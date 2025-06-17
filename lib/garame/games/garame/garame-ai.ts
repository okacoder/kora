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
    // - If has Kora, play lowest card to keep it
    // - If no Kora, try to win with highest card
    
    if (playerState.hasKora) {
      // Keep Kora, play lowest
      let lowestIndex = playableIndices[0];
      let lowestRank = this.getCardValue(playerState.cards[lowestIndex]);
      
      for (const index of playableIndices) {
        const rank = this.getCardValue(playerState.cards[index]);
        if (rank < lowestRank) {
          lowestRank = rank;
          lowestIndex = index;
        }
      }
      
      return lowestIndex;
    } else {
      // Try to win Kora, play highest
      let highestIndex = playableIndices[0];
      let highestRank = this.getCardValue(playerState.cards[highestIndex]);
      
      for (const index of playableIndices) {
        const rank = this.getCardValue(playerState.cards[index]);
        if (rank > highestRank) {
          highestRank = rank;
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
    // - Track played cards
    // - Calculate probabilities
    // - Strategic Kora management
    // - Endgame optimization

    const opponentId = Array.from(gameState.players.keys())
      .find(id => id !== playerState.id);
    const opponentState = gameState.players.get(opponentId!) as GaramePlayerState;

    // If close to winning (8+ points), be aggressive
    if (playerState.score >= 8) {
      if (playerState.hasKora) {
        // Keep Kora and win
        return this.mediumStrategy(gameState, playerState, playableIndices);
      } else {
        // Need to steal Kora
        return this.playHighestCard(playerState, playableIndices);
      }
    }

    // If opponent close to winning, must be aggressive
    if (opponentState && opponentState.score >= 8) {
      if (!playerState.hasKora) {
        // Must try to get Kora
        return this.playHighestCard(playerState, playableIndices);
      }
    }

    // Mid-game: balanced approach
    if (playerState.hasKora) {
      // Calculate if we can safely keep Kora
      const canKeepKora = this.calculateKoraSafety(gameState, playerState, playableIndices);
      if (canKeepKora.safe) {
        return canKeepKora.cardIndex;
      }
    }

    // Default to medium strategy
    return this.mediumStrategy(gameState, playerState, playableIndices);
  }

  private calculateKoraSafety(
    gameState: GarameGameState,
    playerState: GaramePlayerState,
    playableIndices: number[]
  ): { safe: boolean; cardIndex: number } {
    // Complex calculation based on:
    // - Cards already played
    // - Opponent's likely cards
    // - Current suit requirements
    
    // For now, simplified version
    const midRangeIndices = playableIndices.filter(index => {
      const value = this.getCardValue(playerState.cards[index]);
      return value >= 5 && value <= 10;
    });

    if (midRangeIndices.length > 0) {
      return {
        safe: true,
        cardIndex: midRangeIndices[0]
      };
    }

    return {
      safe: false,
      cardIndex: playableIndices[0]
    };
  }

  private playHighestCard(playerState: GaramePlayerState, playableIndices: number[]): number {
    let highestIndex = playableIndices[0];
    let highestValue = this.getCardValue(playerState.cards[highestIndex]);

    for (const index of playableIndices) {
      const value = this.getCardValue(playerState.cards[index]);
      if (value > highestValue) {
        highestValue = value;
        highestIndex = index;
      }
    }

    return highestIndex;
  }

  private getCardValue(card: any): number {
    const rankValues: Record<string, number> = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11,
      '10': 10, '9': 9, '8': 8, '7': 7,
      '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    return rankValues[card.rank] || 0;
  }
}