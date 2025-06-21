import { Socket } from 'socket.io';
import { GarameState, GarameAction } from '@/lib/game-engine/games/garame/GarameState';
import { GameEngine } from '@/lib/game-engine/core/GameEngine';
import { GarameRules } from '@/lib/game-engine/games/garame/GarameRules';
import { GarameAI } from '@/lib/game-engine/games/garame/GarameAI';
import prisma from '@/lib/prisma';

export interface ConnectedPlayer {
  id: string;
  name: string;
  socket: Socket;
  isConnected: boolean;
  lastSeen: Date;
  isAI: boolean;
}

export interface GameRoom {
  id: string;
  gameState: GarameState;
  players: Map<string, ConnectedPlayer>;
  gameEngine: GameEngine<GarameState>;
  aiPlayers: Map<string, GarameAI>;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  reconnectionTimeouts: Map<string, NodeJS.Timeout>;
}

/**
 * Gestionnaire des salles de jeu WebSocket
 * Gère les connexions, reconnexions et synchronisation en temps réel
 */
export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private playerRooms: Map<string, string> = new Map(); // playerId -> roomId
  private readonly RECONNECTION_TIMEOUT = 30000; // 30 secondes
  private readonly ROOM_CLEANUP_INTERVAL = 300000; // 5 minutes
  private readonly MAX_INACTIVE_TIME = 1800000; // 30 minutes

  constructor() {
    // Nettoyage périodique des salles inactives
    setInterval(() => {
      this.cleanupInactiveRooms();
    }, this.ROOM_CLEANUP_INTERVAL);
  }

  /**
   * Crée ou récupère une salle de jeu
   */
  async getOrCreateRoom(gameId: string): Promise<GameRoom> {
    if (this.rooms.has(gameId)) {
      return this.rooms.get(gameId)!;
    }

    // Récupérer les données du jeu depuis la base de données
    const gameData = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: { user: true }
        }
      }
    });

    if (!gameData) {
      throw new Error(`Game ${gameId} not found`);
    }

    // Créer la salle
    const room: GameRoom = {
      id: gameId,
      gameState: gameData.gameState as GarameState,
      players: new Map(),
      gameEngine: new GameEngine(new GarameRules()),
      aiPlayers: new Map(),
      isActive: gameData.status === 'IN_PROGRESS',
      createdAt: new Date(),
      lastActivity: new Date(),
      reconnectionTimeouts: new Map()
    };

    // Initialiser les joueurs IA
    for (const player of gameData.players) {
      if (player.user.email?.includes('@ai.garame')) {
        const aiLevel = gameData.aiLevel || 'MEDIUM';
        const aiPlayer = new GarameAI(player.userId, aiLevel);
        room.aiPlayers.set(player.userId, aiPlayer);
      }
    }

    this.rooms.set(gameId, room);
    return room;
  }

  /**
   * Ajoute un joueur à une salle
   */
  async addPlayerToRoom(gameId: string, playerId: string, playerName: string, socket: Socket): Promise<void> {
    const room = await this.getOrCreateRoom(gameId);
    
    // Annuler le timeout de reconnexion si existant
    if (room.reconnectionTimeouts.has(playerId)) {
      clearTimeout(room.reconnectionTimeouts.get(playerId)!);
      room.reconnectionTimeouts.delete(playerId);
    }

    // Ajouter ou mettre à jour le joueur
    const player: ConnectedPlayer = {
      id: playerId,
      name: playerName,
      socket,
      isConnected: true,
      lastSeen: new Date(),
      isAI: false
    };

    room.players.set(playerId, player);
    this.playerRooms.set(playerId, gameId);
    room.lastActivity = new Date();

    // Rejoindre la salle Socket.io
    socket.join(`game:${gameId}`);

    // Envoyer l'état actuel du jeu au joueur
    socket.emit('game-state-update', {
      gameState: room.gameState,
      players: this.getPlayersInfo(room),
      timestamp: new Date()
    });

    // Notifier les autres joueurs
    socket.to(`game:${gameId}`).emit('player-connected', {
      playerId,
      playerName,
      timestamp: new Date()
    });

    console.log(`Player ${playerName} (${playerId}) joined room ${gameId}`);
  }

  /**
   * Supprime un joueur d'une salle (déconnexion)
   */
  removePlayerFromRoom(playerId: string): void {
    const gameId = this.playerRooms.get(playerId);
    if (!gameId) return;

    const room = this.rooms.get(gameId);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    // Marquer comme déconnecté mais garder en mémoire pour reconnexion
    player.isConnected = false;
    player.lastSeen = new Date();

    // Programmer un timeout pour supprimer définitivement
    const timeout = setTimeout(() => {
      room.players.delete(playerId);
      this.playerRooms.delete(playerId);
      room.reconnectionTimeouts.delete(playerId);

      // Notifier les autres joueurs
      player.socket.to(`game:${gameId}`).emit('player-disconnected', {
        playerId,
        playerName: player.name,
        permanent: true,
        timestamp: new Date()
      });

      console.log(`Player ${player.name} (${playerId}) permanently removed from room ${gameId}`);
    }, this.RECONNECTION_TIMEOUT);

    room.reconnectionTimeouts.set(playerId, timeout);

    // Notifier les autres joueurs de la déconnexion temporaire
    player.socket.to(`game:${gameId}`).emit('player-disconnected', {
      playerId,
      playerName: player.name,
      permanent: false,
      reconnectionTime: this.RECONNECTION_TIMEOUT,
      timestamp: new Date()
    });

    console.log(`Player ${player.name} (${playerId}) disconnected from room ${gameId} (${this.RECONNECTION_TIMEOUT}ms to reconnect)`);
  }

  /**
   * Traite une action de jeu d'un joueur
   */
  async handleGameAction(playerId: string, action: GarameAction): Promise<void> {
    const gameId = this.playerRooms.get(playerId);
    if (!gameId) {
      throw new Error('Player not in any room');
    }

    const room = this.rooms.get(gameId);
    if (!room || !room.isActive) {
      throw new Error('Room not found or not active');
    }

    const player = room.players.get(playerId);
    if (!player || !player.isConnected) {
      throw new Error('Player not connected');
    }

    // Vérifier que c'est le tour du joueur
    if (room.gameState.currentPlayerId !== playerId) {
      throw new Error('Not your turn');
    }

         try {
       // Appliquer l'action via le moteur de jeu
       const result = room.gameEngine.executeMove(room.gameState, {
         type: action.type,
         playerId,
         cardId: action.card?.id,
         data: action,
         timestamp: new Date()
       });

       if (!result.success) {
         throw new Error(result.error || 'Échec de l\'exécution du mouvement');
       }

       // Mettre à jour l'état
       room.gameState = result.state;
       room.lastActivity = new Date();

       // Sauvegarder en base de données
       await this.saveGameState(gameId, result.state, action);

       // Diffuser la mise à jour à tous les joueurs
       this.broadcastGameUpdate(room);

       // Vérifier si c'est maintenant le tour d'une IA
       await this.handleAITurn(room);

       // Vérifier la fin de partie
       if (result.isGameOver) {
         await this.handleGameEnd(room);
       }

    } catch (error) {
      // Envoyer l'erreur au joueur
      player.socket.emit('game-error', {
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Gère le tour d'une IA
   */
  private async handleAITurn(room: GameRoom): Promise<void> {
    const currentPlayerId = room.gameState.currentPlayerId;
    const aiPlayer = room.aiPlayers.get(currentPlayerId);
    
    if (!aiPlayer) return; // Pas une IA

    try {
      // Calculer le mouvement de l'IA
      const aiMove = await aiPlayer.calculateMove(room.gameState);
      
      // Appliquer le mouvement
      const newGameState = room.gameEngine.applyMove(room.gameState, {
        type: aiMove.type,
        playerId: currentPlayerId,
        cardId: aiMove.cardId,
        data: {
          type: aiMove.type,
          playerId: currentPlayerId,
          playerName: `AI ${currentPlayerId}`,
          card: aiMove.cardId ? room.gameState.players[currentPlayerId].hand.find(c => c.id === aiMove.cardId) : undefined,
          timestamp: new Date()
        }
      });

      room.gameState = newGameState;
      room.lastActivity = new Date();

      // Sauvegarder en base
      await this.saveGameState(room.id, newGameState, {
        type: aiMove.type,
        playerId: currentPlayerId,
        playerName: `AI ${currentPlayerId}`,
        card: aiMove.cardId ? room.gameState.players[currentPlayerId].hand.find(c => c.id === aiMove.cardId) : undefined,
        timestamp: new Date()
      });

      // Diffuser la mise à jour
      this.broadcastGameUpdate(room, {
        aiMove: {
          playerId: currentPlayerId,
          confidence: aiMove.confidence,
          reasoning: aiMove.reasoning
        }
      });

      // Vérifier si il y a encore une IA à jouer
      if (!room.gameEngine.isGameOver(newGameState)) {
        setTimeout(() => {
          this.handleAITurn(room);
        }, 1000); // Délai entre les mouvements d'IA
      }

    } catch (error) {
      console.error(`AI error in room ${room.id}:`, error);
      // En cas d'erreur IA, faire passer au joueur suivant
      // ou gérer selon la logique métier
    }
  }

  /**
   * Diffuse une mise à jour de jeu à tous les joueurs connectés
   */
  private broadcastGameUpdate(room: GameRoom, additionalData?: any): void {
    const updateData = {
      gameState: room.gameState,
      players: this.getPlayersInfo(room),
      timestamp: new Date(),
      ...additionalData
    };

    // Envoyer à tous les joueurs connectés
    room.players.forEach((player) => {
      if (player.isConnected) {
        player.socket.emit('game-state-update', updateData);
      }
    });
  }

  /**
   * Sauvegarde l'état du jeu en base de données
   */
  private async saveGameState(gameId: string, gameState: GarameState, action: GarameAction): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Mettre à jour l'état du jeu
        await tx.game.update({
          where: { id: gameId },
          data: { 
            gameState: gameState as any,
            updatedAt: new Date()
          }
        });

        // Enregistrer le mouvement
        await tx.gameMove.create({
          data: {
            gameId,
            playerId: action.playerId,
            moveType: action.type,
            moveNumber: gameState.totalCardsPlayed,
            moveData: {
              cardId: action.card?.id,
              card: action.card,
              timestamp: action.timestamp
            }
          }
        });
      });
    } catch (error) {
      console.error(`Failed to save game state for ${gameId}:`, error);
    }
  }

  /**
   * Gère la fin de partie
   */
  private async handleGameEnd(room: GameRoom): Promise<void> {
    try {
      const winner = room.gameEngine.getWinner(room.gameState);
      
      // Calculer les gains et pertes
      const results = this.calculateGameResults(room.gameState);
      
      // Mettre à jour la base de données
      await this.updateGameResults(room.id, results, winner);
      
      // Diffuser les résultats
      this.broadcastGameUpdate(room, {
        gameEnded: true,
        winner,
        results,
        finalStats: this.calculateFinalStats(room.gameState)
      });

      // Marquer la salle comme inactive
      room.isActive = false;

      console.log(`Game ${room.id} ended. Winner: ${winner}`);

    } catch (error) {
      console.error(`Error handling game end for ${room.id}:`, error);
    }
  }

  /**
   * Calcule les résultats financiers de la partie
   */
  private calculateGameResults(gameState: GarameState): any {
    const players = Object.values(gameState.players);
    const totalPot = gameState.betAmount * players.length;
    const commission = Math.floor(totalPot * 0.1); // 10%
    const netPot = totalPot - commission;

    // Calculer les scores
    const scores = players.map(player => ({
      playerId: player.id,
      cardsWon: player.cardsWon.length,
      korasWon: player.korasWon,
      totalScore: player.cardsWon.length + (player.korasWon * 2),
      hasFolded: player.hasFolded
    }));

    // Trier par score
    scores.sort((a, b) => b.totalScore - a.totalScore);
    
    const winner = scores[0];
    const winnings = Math.floor(netPot * 0.8); // 80% au gagnant
    const secondPlace = Math.floor(netPot * 0.2); // 20% au second

    return {
      totalPot,
      commission,
      netPot,
      scores,
      winnings: {
        [winner.playerId]: winnings,
        [scores[1]?.playerId]: scores.length > 1 ? secondPlace : 0
      }
    };
  }

  /**
   * Met à jour les résultats en base de données
   */
  private async updateGameResults(gameId: string, results: any, winner: string | null): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Mettre à jour le statut du jeu
      await tx.game.update({
        where: { id: gameId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
          gameState: results
        }
      });

      // Créer les transactions pour les gains/pertes
      for (const [playerId, amount] of Object.entries(results.winnings)) {
        if (amount && typeof amount === 'number' && amount > 0) {
          const wallet = await tx.wallet.findUnique({
            where: { userId: playerId }
          });

          if (wallet) {
            await tx.wallet.update({
              where: { userId: playerId },
              data: { koraBalance: { increment: amount } }
            });

            await tx.transaction.create({
              data: {
                walletId: wallet.id,
                gameId,
                type: 'WIN',
                amount,
                balance: wallet.koraBalance + amount,
                description: `Gain de partie - ${amount} Koras`
              }
            });
          }
        }
      }
    });
  }

  /**
   * Calcule les statistiques finales
   */
  private calculateFinalStats(gameState: GarameState): any {
    const players = Object.values(gameState.players);
    
    return {
      totalRounds: gameState.currentRound,
      totalCardsPlayed: gameState.totalCardsPlayed,
      korasDetected: gameState.korasDetected.length,
      gameDuration: Date.now() - gameState.startedAt.getTime(),
      playerStats: players.map(player => ({
        playerId: player.id,
        cardsWon: player.cardsWon.length,
        korasWon: player.korasWon,
        hasFolded: player.hasFolded,
        finalScore: player.cardsWon.length + (player.korasWon * 2)
      }))
    };
  }

  /**
   * Obtient les informations des joueurs pour diffusion
   */
  private getPlayersInfo(room: GameRoom): any[] {
    return Array.from(room.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      isConnected: player.isConnected,
      isAI: player.isAI,
      lastSeen: player.lastSeen
    }));
  }

  /**
   * Nettoie les salles inactives
   */
  private cleanupInactiveRooms(): void {
    const now = Date.now();
    
    for (const [roomId, room] of this.rooms.entries()) {
      const inactiveTime = now - room.lastActivity.getTime();
      
      if (inactiveTime > this.MAX_INACTIVE_TIME) {
        // Nettoyer les timeouts
        room.reconnectionTimeouts.forEach(timeout => clearTimeout(timeout));
        
        // Supprimer les références des joueurs
        room.players.forEach(player => {
          this.playerRooms.delete(player.id);
        });
        
        // Supprimer la salle
        this.rooms.delete(roomId);
        
        console.log(`Cleaned up inactive room ${roomId} (inactive for ${Math.floor(inactiveTime / 60000)} minutes)`);
      }
    }
  }

  /**
   * Obtient les statistiques du gestionnaire de salles
   */
  getStats(): any {
    return {
      totalRooms: this.rooms.size,
      activeRooms: Array.from(this.rooms.values()).filter(room => room.isActive).length,
      totalPlayers: this.playerRooms.size,
      connectedPlayers: Array.from(this.rooms.values())
        .reduce((total, room) => total + Array.from(room.players.values()).filter(p => p.isConnected).length, 0)
    };
  }
} 