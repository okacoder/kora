import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GarameAI } from '@/lib/game-engine/games/garame/GarameAI';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface SocketUser {
  id: string;
  name: string;
  email: string;
}

interface GameSocket extends Socket {
  user?: SocketUser;
}

/**
 * Serveur WebSocket pour le multijoueur temps réel
 */
export class GameWebSocketServer {
  private io: Server;
  private gameRooms: Map<string, Set<string>> = new Map(); // gameId -> Set<socketId>
  private playerSockets: Map<string, string> = new Map(); // playerId -> socketId
  private aiPlayers: Map<string, GarameAI> = new Map(); // gameId -> GarameAI

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Configuration du middleware d'authentification
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: GameSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Token manquant'));
        }

               // Vérifier le token avec Better Auth
       const session = await auth.api.getSession({
         headers: new Headers({ authorization: `Bearer ${token}` })
       });

        if (!session?.user) {
          return next(new Error('Session invalide'));
        }

        socket.user = {
          id: session.user.id,
          name: session.user.name || 'Joueur',
          email: session.user.email || ''
        };

        next();
      } catch (error) {
        console.error('Erreur d\'authentification WebSocket:', error);
        next(new Error('Authentification échouée'));
      }
    });
  }

  /**
   * Configuration des gestionnaires d'événements
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: GameSocket) => {
      console.log(`🔌 Connexion WebSocket: ${socket.user?.name} (${socket.id})`);

      // Événements de jeu
      socket.on('join-game', (data) => this.handleJoinGame(socket, data));
      socket.on('leave-game', (data) => this.handleLeaveGame(socket, data));
      socket.on('game-action', (data) => this.handleGameAction(socket, data));
      socket.on('player-ready', (data) => this.handlePlayerReady(socket, data));

      // Événements de chat (optionnel)
      socket.on('game-message', (data) => this.handleGameMessage(socket, data));

      // Déconnexion
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  /**
   * Gère l'entrée d'un joueur dans une partie
   */
  private async handleJoinGame(socket: GameSocket, data: { gameId: string }): Promise<void> {
    try {
      const { gameId } = data;
      const userId = socket.user?.id;

      if (!userId) {
        socket.emit('error', { message: 'Utilisateur non authentifié' });
        return;
      }

                    // Vérifier que le joueur fait partie de cette partie
       const gamePlayer = await prisma.roomPlayer.findFirst({
         where: {
           gameRoomId: gameId,
           userId,
         },
         include: {
           gameRoom: true,
           user: true
         }
       });

       if (!gamePlayer) {
         socket.emit('error', { message: 'Vous ne faites pas partie de cette partie' });
         return;
       }

      // Rejoindre la salle
      socket.join(`game:${gameId}`);
      
      // Enregistrer la connexion
      if (!this.gameRooms.has(gameId)) {
        this.gameRooms.set(gameId, new Set());
      }
      this.gameRooms.get(gameId)!.add(socket.id);
      this.playerSockets.set(userId, socket.id);

      // Envoyer l'état actuel du jeu
      const gameState = await this.getGameState(gameId);
      socket.emit('game-state-update', gameState);

      // Notifier les autres joueurs
      socket.to(`game:${gameId}`).emit('player-joined', {
        playerId: userId,
        playerName: socket.user?.name,
        timestamp: new Date()
      });

      console.log(`🎮 ${socket.user?.name} a rejoint la partie ${gameId}`);

    } catch (error) {
      console.error('Erreur join-game:', error);
      socket.emit('error', { message: 'Erreur lors de l\'entrée dans la partie' });
    }
  }

  /**
   * Gère la sortie d'un joueur d'une partie
   */
  private handleLeaveGame(socket: GameSocket, data: { gameId: string }): void {
    const { gameId } = data;
    const userId = socket.user?.id;

    if (!userId) return;

    // Quitter la salle
    socket.leave(`game:${gameId}`);
    
    // Nettoyer les références
    const room = this.gameRooms.get(gameId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        this.gameRooms.delete(gameId);
      }
    }
    this.playerSockets.delete(userId);

    // Notifier les autres joueurs
    socket.to(`game:${gameId}`).emit('player-left', {
      playerId: userId,
      playerName: socket.user?.name,
      timestamp: new Date()
    });

    console.log(`🚪 ${socket.user?.name} a quitté la partie ${gameId}`);
  }

  /**
   * Gère une action de jeu d'un joueur
   */
  private async handleGameAction(socket: GameSocket, data: any): Promise<void> {
    try {
      const userId = socket.user?.id;
      if (!userId) {
        socket.emit('error', { message: 'Utilisateur non authentifié' });
        return;
      }

      // Ici on utiliserait normalement le tRPC router pour traiter l'action
      // Pour la Phase 5, on simule le traitement
      
      const { gameId, action } = data;
      
      // Diffuser l'action à tous les joueurs de la partie
      this.io.to(`game:${gameId}`).emit('game-action-broadcast', {
        playerId: userId,
        playerName: socket.user?.name,
        action,
        timestamp: new Date()
      });

      // Simuler le traitement de l'IA si nécessaire
      await this.processAITurn(gameId);

    } catch (error) {
      console.error('Erreur game-action:', error);
      socket.emit('error', { message: 'Erreur lors du traitement de l\'action' });
    }
  }

  /**
   * Gère le statut "prêt" d'un joueur
   */
  private handlePlayerReady(socket: GameSocket, data: { gameId: string, ready: boolean }): void {
    const { gameId, ready } = data;
    const userId = socket.user?.id;

    if (!userId) return;

    // Diffuser le statut aux autres joueurs
    socket.to(`game:${gameId}`).emit('player-ready-update', {
      playerId: userId,
      playerName: socket.user?.name,
      ready,
      timestamp: new Date()
    });
  }

  /**
   * Gère les messages de chat dans une partie
   */
  private handleGameMessage(socket: GameSocket, data: { gameId: string, message: string }): void {
    const { gameId, message } = data;
    const userId = socket.user?.id;

    if (!userId || !message.trim()) return;

    // Diffuser le message à tous les joueurs de la partie
    this.io.to(`game:${gameId}`).emit('game-message-broadcast', {
      playerId: userId,
      playerName: socket.user?.name,
      message: message.trim(),
      timestamp: new Date()
    });
  }

  /**
   * Gère la déconnexion d'un joueur
   */
  private handleDisconnect(socket: GameSocket): void {
    const userId = socket.user?.id;
    if (!userId) return;

    // Trouver la partie du joueur
    let gameId: string | null = null;
    for (const [gId, sockets] of this.gameRooms.entries()) {
      if (sockets.has(socket.id)) {
        gameId = gId;
        break;
      }
    }

    if (gameId) {
      // Nettoyer les références
      const room = this.gameRooms.get(gameId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          this.gameRooms.delete(gameId);
        }
      }
      this.playerSockets.delete(userId);

      // Notifier les autres joueurs
      socket.to(`game:${gameId}`).emit('player-disconnected', {
        playerId: userId,
        playerName: socket.user?.name,
        timestamp: new Date()
      });
    }

    console.log(`🔌 Déconnexion: ${socket.user?.name} (${socket.id})`);
  }

     /**
    * Récupère l'état actuel d'une partie
    */
   private async getGameState(gameId: string): Promise<any> {
     try {
       const game = await prisma.gameRoom.findUnique({
         where: { id: gameId },
         include: {
           players: {
             include: { user: true }
           },
           gameState: true
         }
       });

       if (!game) {
         throw new Error('Partie non trouvée');
       }

       return {
         gameId,
         status: game.status,
         gameState: game.gameState,
         players: game.players.map(p => ({
           id: p.userId,
           name: p.user?.name || p.name,
           position: p.position,
           isReady: p.isReady,
           isAI: p.isAI
         })),
         timestamp: new Date()
       };

     } catch (error) {
       console.error('Erreur getGameState:', error);
       return {
         gameId,
         error: 'Impossible de récupérer l\'état de la partie'
       };
     }
   }

  /**
   * Traite le tour d'une IA
   */
  private async processAITurn(gameId: string): Promise<void> {
    try {
      // Vérifier s'il y a une IA dans cette partie
      const aiPlayer = this.aiPlayers.get(gameId);
      if (!aiPlayer) return;

      // Simuler un délai de réflexion
      setTimeout(async () => {
        // Ici on utiliserait l'IA pour calculer le mouvement
        // Pour l'instant, on simule juste une action
        
        this.io.to(`game:${gameId}`).emit('ai-action', {
          playerId: 'ai-player',
          playerName: 'IA',
          action: { type: 'PLAY_CARD', cardId: 'simulated-card' },
          reasoning: 'Mouvement calculé par l\'IA',
          timestamp: new Date()
        });

      }, 1000 + Math.random() * 2000); // 1-3 secondes

    } catch (error) {
      console.error('Erreur processAITurn:', error);
    }
  }

  /**
   * Diffuse un message à tous les joueurs d'une partie
   */
  public broadcastToGame(gameId: string, event: string, data: any): void {
    this.io.to(`game:${gameId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Envoie un message à un joueur spécifique
   */
  public sendToPlayer(playerId: string, event: string, data: any): void {
    const socketId = this.playerSockets.get(playerId);
    if (socketId) {
      this.io.to(socketId).emit(event, {
        ...data,
        timestamp: new Date()
      });
    }
  }

  /**
   * Obtient les statistiques du serveur
   */
  public getStats(): any {
    return {
      connectedClients: this.io.sockets.sockets.size,
      activeGames: this.gameRooms.size,
      totalPlayers: this.playerSockets.size,
      aiPlayers: this.aiPlayers.size
    };
  }
} 