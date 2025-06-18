import { BaseGameState, BasePlayerState, Card } from '../../core/types';
import { GameStateStatus } from '@prisma/client';

export interface GarameCard {
  id: string;
  suit: string;
  rank: string | number;
}

export interface GaramePlayerState {
  id: string;
  name: string;
  score: number;
  hand: GarameCard[];
  hasKora: boolean;
  isAI: boolean;
  isActive: boolean;
}

export interface GarameMetadata {
  lastPlayedCard?: GarameCard;
  maxScore: number;
  winners: string[];
  winnings?: number;
}

export interface GarameState {
  id: string;
  gameType: 'garame';
  currentPlayerId: string;
  players: Map<string, GaramePlayerState>;
  pot: number;
  status: GameStateStatus;
  winnerId: string | null;
  winners: string[];
  turn: number;
  startedAt: Date;
  endedAt: Date | null;
  metadata: GarameMetadata;
  roomId: string;
}

// Keep backward compatibility
export interface GarameGameState extends GarameState {}

export interface GarameAction {
  type: 'play_card';
  playerId: string;
  data: {
    cardIndex: number;
    card: Card;
  };
}