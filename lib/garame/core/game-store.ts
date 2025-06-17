import { Player, GameRoom, BaseGameState, RoomPlayer } from './types';

// This is a simplified in-memory store for development
// In production, this would be replaced with proper database operations
class GameStore {
  private static instance: GameStore;
  private players = new Map<string, Player>();
  private rooms = new Map<string, GameRoom>();
  private gameStates = new Map<string, BaseGameState>();
  private currentPlayer: Player | null = null;

  private constructor() {
    // Initialize with test data
    this.initializeTestData();
  }

  static getInstance(): GameStore {
    if (!GameStore.instance) {
      GameStore.instance = new GameStore();
    }
    return GameStore.instance;
  }

  private initializeTestData() {
    // Create a test player
    this.currentPlayer = {
      id: 'current-user',
      username: 'TestPlayer',
      balance: 50000,
      avatar: undefined
    };
    this.players.set(this.currentPlayer.id, this.currentPlayer);
  }

  async getCurrentPlayer(): Promise<Player> {
    if (!this.currentPlayer) {
      throw new Error('No current player');
    }
    return this.currentPlayer;
  }

  async getPlayer(playerId: string): Promise<Player | null> {
    return this.players.get(playerId) || null;
  }

  async createRoom(roomData: Partial<GameRoom>): Promise<GameRoom> {
    const room: GameRoom = {
      id: `room-${Date.now()}`,
      gameType: roomData.gameType || 'garame',
      stake: roomData.stake || 100,
      creatorId: roomData.creatorId || '',
      creatorName: roomData.creatorName || '',
      players: roomData.players || [],
      status: roomData.status || 'waiting',
      maxPlayers: roomData.maxPlayers || 2,
      minPlayers: roomData.minPlayers || 2,
      totalPot: roomData.totalPot || 0,
      settings: roomData.settings,
      createdAt: new Date()
    };

    this.rooms.set(room.id, room);
    return room;
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    return this.rooms.get(roomId) || null;
  }

  async updateRoom(roomId: string, updates: Partial<GameRoom>): Promise<GameRoom> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    Object.assign(room, updates);
    room.updatedAt = new Date();
    return room;
  }

  async saveGameState(gameState: BaseGameState): Promise<void> {
    this.gameStates.set(gameState.id, gameState);
  }

  async getGameState(gameId: string): Promise<BaseGameState | null> {
    return this.gameStates.get(gameId) || null;
  }

  async updatePlayerBalance(playerId: string, amount: number): Promise<void> {
    const player = this.players.get(playerId);
    if (player) {
      player.balance += amount;
    }
  }

  // Get all available rooms
  async getAvailableRooms(gameType?: string): Promise<GameRoom[]> {
    const rooms = Array.from(this.rooms.values());
    return rooms.filter(room => 
      room.status === 'waiting' && 
      (!gameType || room.gameType === gameType)
    );
  }
}

export const gameStore = GameStore.getInstance();