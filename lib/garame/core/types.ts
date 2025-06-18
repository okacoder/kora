// Base types remain the same, with additions:

export interface Player {
  id: string;
  username: string;
  balance: number;
  avatar?: string;
  isAI?: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface GameRoom {
  id: string;
  gameType: string; // 'garame', 'poker', 'rummy', etc.
  stake: number;
  creatorId: string;
  creatorName: string;
  players: RoomPlayer[];
  status: 'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled';
  maxPlayers: number; // 2-8
  minPlayers: number; // minimum to start
  totalPot: number;
  gameStateId?: string;
  settings?: GameRoomSettings;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RoomPlayer {
  id: string;
  name: string;
  position: number; // 0-7 (seat position)
  isReady: boolean;
  isAI: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  joinedAt: Date;
}

export interface GameRoomSettings {
  turnDuration?: number;
  allowSpectators?: boolean;
  privateRoom?: boolean;
  roomCode?: string;
  aiPlayersAllowed?: boolean;
  [key: string]: any; // Game-specific settings
}

export interface BaseGameState {
  id: string;
  roomId: string;
  gameType: string;
  currentPlayerId: string;
  players: Map<string, BasePlayerState>;
  pot: number;
  status: 'playing' | 'paused' | 'finished' | 'abandoned';
  winnerId?: string;
  winners?: string[]; // For games with multiple winners
  turn: number;
  startedAt: Date;
  endedAt?: Date;
  metadata?: Record<string, any>;
}

export interface BasePlayerState {
  id: string;
  position: number;
  score: number;
  isActive: boolean; // Still in game
  isAI: boolean;
  lastAction?: GameAction;
}

// Game Registry
export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  icon: React.ComponentType<{ className?: string }>;
  rules: string[];
  engineClass: new (...args: any[]) => any; // Will be BaseGameEngine
  aiClass?: new (...args: any[]) => any; // Will be BaseAIPlayer
}

export interface GameAction {
  type: string;
  playerId: string;
  data?: any;
  timestamp: Date;
  isValid?: boolean;
}

// Card types for card games
export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  id: string;
}

// Payment Service interface
export interface PaymentService {
  processStake(playerId: string, amount: number, roomId: string): Promise<void>;
  processWinning(playerId: string, amount: number, gameId: string): Promise<void>;
}

// Error handling
export enum ErrorCodes {
  INVALID_MOVE = 'INVALID_MOVE',
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  ROOM_FULL = 'ROOM_FULL',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  INVALID_STATE = 'INVALID_STATE',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export class GameError extends Error {
  constructor(public code: ErrorCodes, message: string) {
    super(message);
    this.name = 'GameError';
  }
}