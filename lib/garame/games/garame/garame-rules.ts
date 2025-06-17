import { Card } from '../../core/types';
import { GarameGameState, GaramePlayerState } from './garame-types';

export class GarameRules {
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
    
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

  static canPlayCard(gameState: GarameGameState, playerId: string, card: Card): boolean {
    const playerState = gameState.players.get(playerId) as GaramePlayerState;
    if (!playerState) return false;

    // If player has Kora, they can play any card
    if (playerState.hasKora) return true;

    // If no card has been played this turn, any card is valid
    if (!gameState.lastPlayedCard) return true;

    // Must follow suit if possible
    const playerCards = playerState.cards;
    const hasSuit = playerCards.some(c => c.suit === gameState.currentSuit);
    
    if (hasSuit) {
      return card.suit === gameState.currentSuit;
    }
    
    // If no cards of the required suit, any card is valid
    return true;
  }

  static getPlayableCards(gameState: GarameGameState, playerId: string): number[] {
    const playerState = gameState.players.get(playerId) as GaramePlayerState;
    if (!playerState) return [];

    const playableIndices: number[] = [];
    
    for (let i = 0; i < playerState.cards.length; i++) {
      if (this.canPlayCard(gameState, playerId, playerState.cards[i])) {
        playableIndices.push(i);
      }
    }
    
    return playableIndices;
  }

  static applyCardPlay(gameState: GarameGameState, playerId: string, card: Card): Partial<GarameGameState> {
    const updates: Partial<GarameGameState> = {
      lastPlayedCard: card,
      currentSuit: card.suit
    };

    // Add card to discard pile
    gameState.discardPile.push(card);

    // Check if this completes a trick (both players have played)
    if (gameState.discardPile.length % 2 === 0) {
      // Determine trick winner
      const player1Card = gameState.discardPile[gameState.discardPile.length - 2];
      const player2Card = gameState.discardPile[gameState.discardPile.length - 1];
      
      const player1Id = Array.from(gameState.players.keys())[0];
      const player2Id = Array.from(gameState.players.keys())[1];
      
      const winnerId = this.determineTrickWinner(
        player1Id,
        player1Card,
        player2Id,
        player2Card,
        gameState
      );

      // Transfer Kora to trick winner
      for (const [id, player] of gameState.players) {
        const garamePlayer = player as GaramePlayerState;
        garamePlayer.hasKora = (id === winnerId);
        if (id === winnerId) {
          garamePlayer.wonTricks++;
        }
      }

      // Reset for next trick
      updates.lastPlayedCard = null;
      updates.currentSuit = undefined;
    }

    return updates;
  }

  static determineTrickWinner(
    player1Id: string,
    player1Card: Card,
    player2Id: string,
    player2Card: Card,
    gameState: GarameGameState
  ): string {
    // If both cards are same suit, higher rank wins
    if (player1Card.suit === player2Card.suit) {
      return this.compareRanks(player1Card.rank, player2Card.rank) > 0 
        ? player1Id 
        : player2Id;
    }

    // If different suits, the card matching the led suit wins
    const ledSuit = gameState.discardPile[gameState.discardPile.length - 2].suit;
    if (player1Card.suit === ledSuit) return player1Id;
    if (player2Card.suit === ledSuit) return player2Id;

    // Neither matches led suit (shouldn't happen in valid play)
    return player1Id;
  }

  static compareRanks(rank1: string, rank2: string): number {
    const rankValues: Record<string, number> = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11,
      '10': 10, '9': 9, '8': 8, '7': 7,
      '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    
    return rankValues[rank1] - rankValues[rank2];
  }

  static checkEndCondition(gameState: GarameGameState): { ended: boolean; winners?: string[] } {
    // Game ends when a player has no cards left
    for (const [playerId, playerState] of gameState.players) {
      const garamePlayer = playerState as GaramePlayerState;
      if (garamePlayer.cards.length === 0) {
        // Player with Kora at end wins
        if (garamePlayer.hasKora) {
          garamePlayer.score = 10; // Winner gets 10 points
          return { ended: true, winners: [playerId] };
        }
      }
    }

    // Check if deck is exhausted and no one can play
    const allPlayersStuck = Array.from(gameState.players.values()).every(player => {
      const garamePlayer = player as GaramePlayerState;
      return garamePlayer.cards.length > 0 && 
             this.getPlayableCards(gameState, player.id).length === 0;
    });

    if (allPlayersStuck) {
      // Player with Kora wins
      const winnerEntry = Array.from(gameState.players.entries()).find(([_, player]) => {
        const garamePlayer = player as GaramePlayerState;
        return garamePlayer.hasKora;
      });
      
      if (winnerEntry) {
        winnerEntry[1].score = 10;
        return { ended: true, winners: [winnerEntry[0]] };
      }
    }

    return { ended: false };
  }
}