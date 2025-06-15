export interface IPlayer {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  balance: number;
}

export interface ICard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
}

export interface IGameCard extends ICard {
  playerId: string;
  gameId: string;
  canBePlayed: boolean;
}

export interface IGameRoom {
  id: string;
  stake: number;
  creatorId: string;
  creatorName: string;
  opponentId?: string;
  opponentName?: string;
  status: 'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled';
  players: number;
  maxPlayers: number;
  totalPot: number;
  createdAt: Date;
}

export interface IGameState {
  id: string;
  roomId: string;
  currentTurnPlayerId: string;
  lastPlayedCard?: IGameCard;
  currentSuit?: IGameCard['suit'];
  players: Map<string, IPlayerGameState>;
  pot: number;
  status: 'playing' | 'finished';
  winnerId?: string;
  startedAt: Date;
  endedAt?: Date;
}

export interface IPlayerGameState {
  playerId: string;
  cards: IGameCard[];
  hasKora: boolean;
  score: number;
  isReady: boolean;
}

export interface ITransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'game_stake' | 'game_win';
  amount: number;
  gameId?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

// Interfaces des repositories
export interface IPlayerRepository {
  getCurrentPlayer(): Promise<IPlayer>;
  getPlayerById(id: string): Promise<IPlayer | null>;
  updateBalance(playerId: string, amount: number): Promise<void>;
}

export interface IGameRoomRepository {
  getAvailableRooms(): Promise<IGameRoom[]>;
  getRoomById(roomId: string): Promise<IGameRoom | null>;
  createRoom(stake: number, creatorId: string): Promise<IGameRoom>;
  joinRoom(roomId: string, playerId: string): Promise<IGameRoom>;
  leaveRoom(roomId: string, playerId: string): Promise<void>;
  updateRoomStatus(roomId: string, status: IGameRoom['status']): Promise<void>;
}

export interface IGameStateRepository {
  getGameState(gameId: string): Promise<IGameState | null>;
  createGameState(roomId: string, players: string[]): Promise<IGameState>;
  updateGameState(gameId: string, state: Partial<IGameState>): Promise<void>;
  playCard(gameId: string, playerId: string, cardIndex: number): Promise<IGameState>;
  passKora(gameId: string, fromPlayerId: string, toPlayerId: string): Promise<void>;
}

export interface ITransactionRepository {
  createTransaction(transaction: Omit<ITransaction, 'id' | 'createdAt'>): Promise<ITransaction>;
  getUserTransactions(userId: string): Promise<ITransaction[]>;
  getTransactionById(id: string): Promise<ITransaction | null>;
}

// Interfaces des services
export interface IGameService {
  createGame(stake: number): Promise<IGameRoom>;
  joinGame(roomId: string): Promise<IGameRoom>;
  leaveGame(roomId: string): Promise<void>;
  getAvailableGames(): Promise<IGameRoom[]>;
  getGameRoom(roomId: string): Promise<IGameRoom | null>;
  startGame(roomId: string): Promise<IGameState>;
  playCard(gameId: string, cardIndex: number): Promise<IGameState>;
  passKora(gameId: string): Promise<void>;
  getGameState(gameId: string): Promise<IGameState | null>;
}

export interface IPaymentService {
  deposit(amount: number, method: 'airtel' | 'moov'): Promise<ITransaction>;
  withdraw(amount: number, method: 'airtel' | 'moov'): Promise<ITransaction>;
  getBalance(): Promise<number>;
  getTransactionHistory(): Promise<ITransaction[]>;
}

// Event interfaces pour la communication temps réel
export interface IGameEvent {
  type: 'player_joined' | 'player_left' | 'game_started' | 'card_played' | 'game_ended';
  gameId: string;
  data: any;
  timestamp: Date;
}

export interface IGameEventHandler {
  subscribe(gameId: string, callback: (event: IGameEvent) => void): void;
  unsubscribe(gameId: string): void;
  emit(event: IGameEvent): void;
}

// Types d'erreurs personnalisées
export class GameError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'GameError';
  }
}

export class InsufficientBalanceError extends GameError {
  constructor() {
    super('INSUFFICIENT_BALANCE', 'Solde insuffisant pour cette action');
  }
}

export class InvalidMoveError extends GameError {
  constructor(message: string) {
    super('INVALID_MOVE', message);
  }
}

export class GameNotFoundError extends GameError {
  constructor() {
    super('GAME_NOT_FOUND', 'Partie introuvable');
  }
}