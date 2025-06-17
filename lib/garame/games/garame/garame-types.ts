import { BaseGameState, BasePlayerState, Card } from '../../core/types';

export interface GarameGameState extends BaseGameState {
  lastPlayedCard: Card | null;
  currentSuit?: Card['suit'];
  deck: Card[]; // Remaining deck
  discardPile: Card[];
}

export interface GaramePlayerState extends BasePlayerState {
  cards: Card[];
  hasKora: boolean;
  wonTricks: number;
}

export interface GarameAction {
  type: 'play_card';
  playerId: string;
  data: {
    cardIndex: number;
    card: Card;
  };
}