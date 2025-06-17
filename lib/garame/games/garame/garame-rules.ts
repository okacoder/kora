import { Card } from '../../core/types';
import { GarameGameState, GaramePlayerState } from './garame-types';

export class GarameRules {
  // Create and shuffle a standard 52-card deck
  static createShuffledDeck(): Card[] {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: Card[] = [];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ 
          suit, 
          rank,
          id: `${suit}-${rank}` 
        });
      }
    }
    
    // Shuffle using Fisher-Yates algorithm
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

  // Check if a player can play a specific card
  static canPlayCard(
    gameState: GarameGameState, 
    playerId: string, 
    card: Card
  ): boolean {
    // Not player's turn
    if (gameState.currentPlayerId !== playerId) {
      return false;
    }

    const playerState = gameState.players.get(playerId) as GaramePlayerState;
    if (!playerState) return false;

    // Player with Kora can play any card
    if (playerState.hasKora) {
      return true;
    }

    // If no suit has been set (first card of trick), any card is valid
    if (!gameState.currentSuit) {
      return true;
    }

    // Must follow suit if possible
    const hasSuitCard = playerState.cards.some(c => c.suit === gameState.currentSuit);
    if (hasSuitCard) {
      return card.suit === gameState.currentSuit;
    }

    // Can play any card if no cards of the required suit
    return true;
  }

  // Get indices of playable cards for a player
  static getPlayableCards(
    gameState: GarameGameState, 
    playerId: string
  ): number[] {
    const playerState = gameState.players.get(playerId) as GaramePlayerState;
    if (!playerState || gameState.currentPlayerId !== playerId) {
      return [];
    }

    const playableIndices: number[] = [];
    
    playerState.cards.forEach((card, index) => {
      if (this.canPlayCard(gameState, playerId, card)) {
        playableIndices.push(index);
      }
    });

    return playableIndices;
  }

  // Apply card play and update game state
  static applyCardPlay(
    gameState: GarameGameState,
    playerId: string,
    card: Card
  ): Partial<GarameGameState> {
    const updates: Partial<GarameGameState> = {
      lastPlayedCard: card,
      currentSuit: card.suit
    };

    // Add card to discard pile
    gameState.discardPile.push(card);

    return updates;
  }

  // Check if game has ended
  static checkEndCondition(
    gameState: GarameGameState
  ): { ended: boolean; winners?: string[] } {
    // Check if any player has no cards left
    for (const [playerId, playerState] of gameState.players) {
      const garamePlayer = playerState as GaramePlayerState;
      if (garamePlayer.cards.length === 0 && garamePlayer.isActive) {
        return {
          ended: true,
          winners: [playerId]
        };
      }
    }

    // Check if deck is empty and no one can play
    if (gameState.deck.length === 0) {
      // Find player with least cards
      let minCards = Infinity;
      let winners: string[] = [];
      
      for (const [playerId, playerState] of gameState.players) {
        const garamePlayer = playerState as GaramePlayerState;
        if (!garamePlayer.isActive) continue;
        
        if (garamePlayer.cards.length < minCards) {
          minCards = garamePlayer.cards.length;
          winners = [playerId];
        } else if (garamePlayer.cards.length === minCards) {
          winners.push(playerId);
        }
      }
      
      return {
        ended: true,
        winners
      };
    }

    return { ended: false };
  }

  // Calculate card value for AI evaluation
  static getCardValue(card: Card): number {
    const rankValues: Record<string, number> = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11,
      '10': 10, '9': 9, '8': 8, '7': 7,
      '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    return rankValues[card.rank] || 0;
  }

  // Determine trick winner
  static getTrickWinner(
    firstCard: Card,
    secondCard: Card,
    firstPlayerHasKora: boolean,
    secondPlayerHasKora: boolean
  ): 'first' | 'second' {
    // If both cards are same suit, highest wins
    if (firstCard.suit === secondCard.suit) {
      return this.getCardValue(firstCard) > this.getCardValue(secondCard) ? 'first' : 'second';
    }

    // If first player set the suit and second didn't follow, first wins
    // (unless second player has Kora)
    if (!secondPlayerHasKora) {
      return 'first';
    }

    // If second player has Kora and played different suit, compare values
    return this.getCardValue(secondCard) > this.getCardValue(firstCard) ? 'second' : 'first';
  }
}