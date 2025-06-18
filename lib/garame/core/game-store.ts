import { Player, GameRoom, BaseGameState } from './types';

// Helper to handle Maps with JSON stringify/parse
const replacer = (key: string, value: any) => {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()),
    };
  } else {
    return value;
  }
}

const reviver = (key: string, value: any) => {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}

const STORAGE_KEYS = {
  PLAYERS: 'kora-store-players',
  ROOMS: 'kora-store-rooms',
  GAME_STATES: 'kora-store-game-states',
  CURRENT_PLAYER: 'kora-store-current-player',
};

class GameStore {
  private static instance: GameStore;
  private players!: Map<string, Player>;
  private rooms!: Map<string, GameRoom>;
  private gameStates!: Map<string, BaseGameState>;
  private currentPlayer: Player | null = null;

  private constructor() {
    this._loadFromSession();
    if (this.rooms.size === 0) {
      this.createDefaultAIRooms();
    }
  }

  static getInstance(): GameStore {
    if (!GameStore.instance) {
      GameStore.instance = new GameStore();
    }
    return GameStore.instance;
  }

  private _loadFromSession() {
    if (typeof window === 'undefined') {
      this.players = new Map();
      this.rooms = new Map();
      this.gameStates = new Map();
      this.currentPlayer = null;
      return;
    }
    
    const playersData = sessionStorage.getItem(STORAGE_KEYS.PLAYERS);
    this.players = playersData ? JSON.parse(playersData, reviver) : new Map();

    const roomsData = sessionStorage.getItem(STORAGE_KEYS.ROOMS);
    this.rooms = roomsData ? JSON.parse(roomsData, reviver) : new Map();

    const gameStatesData = sessionStorage.getItem(STORAGE_KEYS.GAME_STATES);
    this.gameStates = gameStatesData ? JSON.parse(gameStatesData, reviver) : new Map();

    const currentPlayerDate = sessionStorage.getItem(STORAGE_KEYS.CURRENT_PLAYER);
    this.currentPlayer = currentPlayerDate ? JSON.parse(currentPlayerDate) : null;
  }

  private _save() {
    if (typeof window === 'undefined') return;
    
    sessionStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(this.players, replacer));
    sessionStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(this.rooms, replacer));
    sessionStorage.setItem(STORAGE_KEYS.GAME_STATES, JSON.stringify(this.gameStates, replacer));
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_PLAYER, JSON.stringify(this.currentPlayer));
  }

  async setCurrentUser(player: Player): Promise<void> {
    this.currentPlayer = player;
    this.players.set(player.id, player);
    this._save();
  }

  async getCurrentPlayer(): Promise<Player> {
    if (!this.currentPlayer) {
      throw new Error('No current player set in store');
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
    this._save();
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
    this._save();
    return room;
  }

  async saveGameState(gameState: BaseGameState): Promise<void> {
    this.gameStates.set(gameState.id, gameState);
    this._save();
  }

  async getGameState(gameId: string): Promise<BaseGameState | null> {
    return this.gameStates.get(gameId) || null;
  }

  async updatePlayerBalance(playerId: string, amount: number): Promise<void> {
    const player = this.players.get(playerId);
    if (player) {
      player.koras += amount;
    }
    this._save();
  }

  async getAvailableRooms(gameType?: string): Promise<GameRoom[]> {
    const rooms = Array.from(this.rooms.values());
    return rooms.filter(room => 
      room.status === 'waiting' && 
      (!gameType || room.gameType === gameType)
    );
  }

  createDefaultAIRooms() {
    // Crée une room publique Garame avec 1 IA (medium)
    const now = Date.now();
    const room: GameRoom = {
      id: `room-ai-default-${now}`,
      gameType: 'garame',
      stake: 10,
      creatorId: 'ai-system',
      creatorName: 'KoraBot',
      players: [
        {
          id: 'ai-bot-1',
          name: 'Bot Medium',
          position: 0,
          isReady: true,
          isAI: true,
          aiDifficulty: 'medium',
          joinedAt: new Date()
        }
      ],
      status: 'waiting',
      maxPlayers: 2,
      minPlayers: 2,
      totalPot: 10,
      settings: {},
      createdAt: new Date(now)
    };
    this.rooms.set(room.id, room);
  }

  // Utilitaire pour créer un Player à partir d'un User
  createPlayerFromUser(user: any): Player {
    return {
      id: user.id,
      username: user.username,
      koras: user.koras,
      avatar: user.image,
      isAI: false
    };
  }
}

export const gameStore = GameStore.getInstance();