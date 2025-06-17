import { BaseAIPlayer } from '../../core/base-ai-player';
import { GameAction } from '../../core/types';
import { GarameGameState, GaramePlayerState } from './garame-types';
import { GarameRules } from './garame-rules';

export class GarameAI extends BaseAIPlayer {
  constructor(difficulty: 'easy' | 'medium' | 'hard') {
    super('garame', difficulty);
  }

  async decideAction(gameState: GarameGameState, playerId: string): Promise<GameAction | null> {
    const playerState = gameState.players.get(playerId) as GaramePlayerState;
    if (!playerState) return null;

    const playableIndices = GarameRules.getPlayableCards(gameState, playerId);
    if (playableIndices.length === 0) return null;

    // Simulate thinking
    await this.simulateThinking();

    let selectedIndex: number;

    switch (this.difficulty) {
      case 'easy':
        selectedIndex = this.easyStrategy(gameState, playerState, playableIndices);
        break;
      case 'medium':
        selectedIndex = this.mediumStrategy(gameState, playerState, playableIndices);
        break;
      case 'hard':
        selectedIndex = this.hardStrategy(gameState, playerState, playableIndices);
        break;
      default:
        selectedIndex = playableIndices[0];
    }

    return {
      type: 'play_card',
      playerId,
      data: {
        cardIndex: selectedIndex,
        card: playerState.cards[selectedIndex]
      },
      timestamp: new Date()
    };
  }

  private easyStrategy(
    gameState: GarameGameState,
    playerState: GaramePlayerState,
    playableIndices: number[]
  ): number {
    // Easy AI: Random valid card
    return playableIndices[Math.floor(Math.random() * playableIndices.length)];
  }

  private mediumStrategy(
    gameState: GarameGameState,
    playerState: GaramePlayerState,
    playableIndices: number[]
  ): number {
    // Medium AI: Basic strategy
    // - If has Kora, play lowest card to keep control
    // - If no Kora, try to get rid of high cards first
    
    if (playerState.hasKora) {
      // Keep Kora advantage, play lowest card
      let lowestIndex = playableIndices[0];
      let lowestValue = GarameRules.getCardValue(playerState.cards[lowestIndex]);
      
      for (const index of playableIndices) {
        const value = GarameRules.getCardValue(playerState.cards[index]);
        if (value < lowestValue) {
          lowestValue = value;
          lowestIndex = index;
        }
      }
      
      return lowestIndex;
    } else {
      // Without Kora, get rid of high cards when possible
      let highestIndex = playableIndices[0];
      let highestValue = GarameRules.getCardValue(playerState.cards[highestIndex]);
      
      for (const index of playableIndices) {
        const value = GarameRules.getCardValue(playerState.cards[index]);
        if (value > highestValue) {
          highestValue = value;
          highestIndex = index;
        }
      }
      
      return highestIndex;
    }
  }

  private hardStrategy(
    gameState: GarameGameState,
    playerState: GaramePlayerState,
    playableIndices: number[]
  ): number {
    // Hard AI: Advanced strategy
    // - Card counting
    // - Endgame awareness
    // - Strategic Kora management
    // - Suit control

    const opponentId = Array.from(gameState.players.keys())
      .find(id => id !== playerState.id);
    const opponentState = gameState.players.get(opponentId!) as GaramePlayerState;

    // Count remaining cards by suit
    const suitCounts = this.countRemainingSuits(gameState, playerState);
    
    // Endgame strategy - if close to winning (2 or fewer cards)
    if (playerState.cards.length <= 2) {
      if (playerState.hasKora) {
        // Play any card to win faster
        return playableIndices[0];
      } else {
        // Try to play cards that opponent might not be able to follow
        return this.selectUnfollowableCard(playerState, playableIndices, suitCounts);
      }
    }

    // If opponent is close to winning, be aggressive
    if (opponentState && opponentState.cards.length <= 2) {
      // Try to make opponent draw cards or lose Kora
      if (playerState.hasKora) {
        // Play cards in suits opponent might not have
        return this.selectUnfollowableCard(playerState, playableIndices, suitCounts);
      } else {
        // Get rid of dangerous cards
        return this.mediumStrategy(gameState, playerState, playableIndices);
      }
    }

    // Mid-game strategy
    if (playerState.hasKora) {
      // With Kora, control the game
      // Play cards that are safe and keep dangerous cards
      return this.selectSafeCard(playerState, playableIndices, suitCounts);
    } else {
      // Without Kora, try to get rid of isolated cards
      return this.selectIsolatedCard(playerState, playableIndices);
    }
  }

  private countRemainingSuits(
    gameState: GarameGameState,
    playerState: GaramePlayerState
  ): Map<string, number> {
    const counts = new Map<string, number>([
      ['hearts', 13],
      ['diamonds', 13],
      ['clubs', 13],
      ['spades', 13]
    ]);

    // Subtract played cards
    for (const card of gameState.discardPile) {
      counts.set(card.suit, (counts.get(card.suit) || 0) - 1);
    }

    // Subtract cards in hand
    for (const card of playerState.cards) {
      counts.set(card.suit, (counts.get(card.suit) || 0) - 1);
    }

    return counts;
  }

  private selectUnfollowableCard(
    playerState: GaramePlayerState,
    playableIndices: number[],
    suitCounts: Map<string, number>
  ): number {
    // Find card in suit with fewest remaining cards
    let bestIndex = playableIndices[0];
    let lowestSuitCount = Infinity;

    for (const index of playableIndices) {
      const card = playerState.cards[index];
      const suitCount = suitCounts.get(card.suit) || 0;
      
      if (suitCount < lowestSuitCount) {
        lowestSuitCount = suitCount;
        bestIndex = index;
      }
    }

    return bestIndex;
  }

  private selectSafeCard(
    playerState: GaramePlayerState,
    playableIndices: number[],
    suitCounts: Map<string, number>
  ): number {
    // Play cards from suits we have many of
    const suitFrequency = new Map<string, number>();
    
    for (const card of playerState.cards) {
      suitFrequency.set(card.suit, (suitFrequency.get(card.suit) || 0) + 1);
    }

    let bestIndex = playableIndices[0];
    let highestFrequency = 0;
    let lowestValue = Infinity;

    for (const index of playableIndices) {
      const card = playerState.cards[index];
      const frequency = suitFrequency.get(card.suit) || 0;
      const value = GarameRules.getCardValue(card);
      
      // Prefer cards from suits we have many of, and lower values
      if (frequency > highestFrequency || 
          (frequency === highestFrequency && value < lowestValue)) {
        highestFrequency = frequency;
        lowestValue = value;
        bestIndex = index;
      }
    }

    return bestIndex;
  }

  private selectIsolatedCard(
    playerState: GaramePlayerState,
    playableIndices: number[]
  ): number {
    // Find cards that are alone in their suit
    const suitCounts = new Map<string, number>();
    
    for (const card of playerState.cards) {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
    }

    // First try to play isolated cards
    for (const index of playableIndices) {
      const card = playerState.cards[index];
      if (suitCounts.get(card.suit) === 1) {
        return index;
      }
    }

    // Otherwise play highest card
    let highestIndex = playableIndices[0];
    let highestValue = GarameRules.getCardValue(playerState.cards[highestIndex]);
    
    for (const index of playableIndices) {
      const value = GarameRules.getCardValue(playerState.cards[index]);
      if (value > highestValue) {
        highestValue = value;
        highestIndex = index;
      }
    }

    return highestIndex;
  }
}