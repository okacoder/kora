interface Player {
  id: string;
  name: string;
  socketId: string;
  joinedAt?: Date;
}

interface GameRoom {
  id: string;
  players: Map<string, Player>;
  maxPlayers: number;
  createdAt: Date;
  gameState?: any;
}

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();

  // Créer une nouvelle salle
  createRoom(gameId: string, maxPlayers: number = 5): GameRoom {
    const room: GameRoom = {
      id: gameId,
      players: new Map(),
      maxPlayers,
      createdAt: new Date(),
    };

    this.rooms.set(gameId, room);
    console.log(`🏠 Room ${gameId} created (max ${maxPlayers} players)`);
    return room;
  }

  // Ajouter un joueur à une salle
  async addPlayerToRoom(gameId: string, player: Player): Promise<void> {
    let room = this.rooms.get(gameId);
    
    // Créer la salle si elle n'existe pas
    if (!room) {
      room = this.createRoom(gameId);
    }

    // Vérifier si la salle est pleine
    if (room.players.size >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    // Vérifier si le joueur n'est pas déjà dans la salle
    if (room.players.has(player.id)) {
      // Mettre à jour les informations du joueur (nouveau socketId)
      const existingPlayer = room.players.get(player.id)!;
      existingPlayer.socketId = player.socketId;
      existingPlayer.joinedAt = new Date();
    } else {
      // Ajouter le nouveau joueur
      room.players.set(player.id, {
        ...player,
        joinedAt: new Date(),
      });
    }

    console.log(`👤 Player ${player.name} added to room ${gameId} (${room.players.size}/${room.maxPlayers})`);
  }

  // Retirer un joueur d'une salle
  async removePlayerFromRoom(gameId: string, playerId: string): Promise<void> {
    const room = this.rooms.get(gameId);
    if (!room) return;

    const removed = room.players.delete(playerId);
    if (removed) {
      console.log(`👤 Player ${playerId} removed from room ${gameId} (${room.players.size}/${room.maxPlayers})`);
    }

    // Supprimer la salle si elle est vide
    if (room.players.size === 0) {
      this.rooms.delete(gameId);
      console.log(`🏠 Room ${gameId} deleted (empty)`);
    }
  }

  // Obtenir l'état d'une salle
  async getRoomState(gameId: string): Promise<any> {
    const room = this.rooms.get(gameId);
    if (!room) {
      return null;
    }

    return {
      gameId: room.id,
      players: Array.from(room.players.values()).map(player => ({
        id: player.id,
        name: player.name,
        joinedAt: player.joinedAt,
      })),
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt,
      gameState: room.gameState,
    };
  }

  // Obtenir tous les joueurs d'une salle
  getRoomPlayers(gameId: string): Player[] {
    const room = this.rooms.get(gameId);
    return room ? Array.from(room.players.values()) : [];
  }

  // Mettre à jour l'état du jeu dans une salle
  updateGameState(gameId: string, gameState: any): void {
    const room = this.rooms.get(gameId);
    if (room) {
      room.gameState = gameState;
    }
  }

  // Obtenir toutes les salles actives
  getActiveRooms(): Array<{ gameId: string; playerCount: number; maxPlayers: number }> {
    return Array.from(this.rooms.values()).map(room => ({
      gameId: room.id,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
    }));
  }

  // Vérifier si un joueur est dans une salle
  isPlayerInRoom(gameId: string, playerId: string): boolean {
    const room = this.rooms.get(gameId);
    return room ? room.players.has(playerId) : false;
  }

  // Obtenir le socketId d'un joueur dans une salle
  getPlayerSocketId(gameId: string, playerId: string): string | null {
    const room = this.rooms.get(gameId);
    if (!room) return null;
    
    const player = room.players.get(playerId);
    return player ? player.socketId : null;
  }

  // Nettoyer les salles vides (à appeler périodiquement)
  cleanupEmptyRooms(): void {
    const emptyRooms = Array.from(this.rooms.entries())
      .filter(([_, room]) => room.players.size === 0)
      .map(([gameId]) => gameId);

    emptyRooms.forEach(gameId => {
      this.rooms.delete(gameId);
      console.log(`🧹 Cleaned up empty room ${gameId}`);
    });
  }
} 