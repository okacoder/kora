import { BaseGameState, BasePlayerState, Card } from '../../core/types';

export interface GarameState extends BaseGameState {
  lastPlayedCard: Card | null;
  currentSuit?: Card['suit'];
  deck: Card[]; // Remaining deck
  discardPile: Card[];
}

export interface GaramePlayerState extends BasePlayerState {
  hand: Card[];
  hasKora: boolean;
  wonTricks: number;
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