import { GameAction } from '@/lib/garame/core/types';
import { GarameState, GaramePlayerState } from '../games/garame/garame-types';
import { CardEvaluation, GameAnalysis, GarameCard } from './garame-ai-types';

export class GarameAIStrategies {
  selectBestCard(evaluations: CardEvaluation[]): CardEvaluation {
    return evaluations.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  selectWorstCard(evaluations: CardEvaluation[]): CardEvaluation {
    return evaluations.reduce((worst, current) => 
      current.score < worst.score ? current : worst
    );
  }

  selectMediumCard(evaluations: CardEvaluation[]): CardEvaluation {
    const sorted = [...evaluations].sort((a, b) => a.score - b.score);
    const medianIndex = Math.floor(sorted.length / 2);
    return sorted[medianIndex];
  }

  findWorstCard(cards: GarameCard[], gameState: GarameState): GarameCard {
    return cards.reduce((worst, current) => 
      this.getCardValue(current) < this.getCardValue(worst) ? current : worst
    );
  }

  calculateOptimalMove(
    gameState: GarameState,
    playerState: GaramePlayerState,
    evaluations: CardEvaluation[],
    deepAnalysis: any
  ): GameAction {
    // Stratégie optimale pour Sensei
    const sorted = [...evaluations].sort((a, b) => b.score - a.score);
    
    // Si on a la Kora et qu'on gagne, jouer conservateur
    if (playerState.hasKora && playerState.score >= 7) {
      const conservativeCard = sorted[sorted.length - 1]; // Plus faible
      return this.createPlayAction(playerState.id, conservativeCard.card);
    }

    // Si on perd et pas de Kora, jouer agressif
    if (!playerState.hasKora && playerState.score <= 3) {
      const aggressiveCard = sorted[0]; // Plus forte
      return this.createPlayAction(playerState.id, aggressiveCard.card);
    }

    // Sinon, jouer équilibré
    const balancedIndex = Math.floor(sorted.length * 0.3);
    return this.createPlayAction(playerState.id, sorted[balancedIndex].card);
  }

  createBluffMove(
    gameState: GarameState,
    playerState: GaramePlayerState,
    evaluations: CardEvaluation[]
  ): GameAction | null {
    // Bluff : jouer une carte faible comme si c'était une forte
    const weakCards = evaluations.filter(e => e.score < 6);
    if (weakCards.length === 0) return null;

    // Choisir la carte faible la plus crédible
    const bluffCard = weakCards[Math.floor(Math.random() * weakCards.length)];
    return this.createPlayAction(playerState.id, bluffCard.card);
  }

  playAggressively(
    evaluations: CardEvaluation[],
    playerState: GaramePlayerState
  ): GameAction {
    // Toujours jouer les meilleures cartes
    const best = this.selectBestCard(evaluations);
    return this.createPlayAction(playerState.id, best.card);
  }

  playDefensively(
    evaluations: CardEvaluation[],
    playerState: GaramePlayerState
  ): GameAction {
    // Garder les bonnes cartes, jouer les moyennes
    const sorted = [...evaluations].sort((a, b) => a.score - b.score);
    const defensiveIndex = Math.floor(sorted.length * 0.4);
    return this.createPlayAction(playerState.id, sorted[defensiveIndex].card);
  }

  playBalanced(
    gameState: GarameState,
    playerState: GaramePlayerState,
    evaluations: CardEvaluation[],
    analysis: GameAnalysis
  ): GameAction {
    // Stratégie équilibrée basée sur le contexte
    let targetPercentile = 0.5; // Milieu par défaut

    // Ajuster selon la situation
    if (analysis.playerPosition === 'winning') {
      targetPercentile = 0.3; // Plus conservateur
    } else if (analysis.playerPosition === 'losing') {
      targetPercentile = 0.7; // Plus agressif
    }

    // Ajuster selon la Kora
    if (playerState.hasKora) {
      targetPercentile -= 0.2; // Plus conservateur avec la Kora
    } else {
      targetPercentile += 0.1; // Un peu plus agressif sans
    }

    // S'assurer que le percentile est dans les limites
    targetPercentile = Math.max(0, Math.min(1, targetPercentile));

    const sorted = [...evaluations].sort((a, b) => a.score - b.score);
    const targetIndex = Math.floor(sorted.length * targetPercentile);
    
    return this.createPlayAction(playerState.id, sorted[targetIndex].card);
  }

  private createPlayAction(playerId: string, card: GarameCard): GameAction {
    return {
      type: 'play_card',
      playerId,
      data: { cardId: card.id },
      timestamp: new Date()
    };
  }

  private getCardValue(card: GarameCard): number {
    const values: Record<string, number> = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11,
      '10': 10, '9': 9, '8': 8, '7': 7,
      '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    return values[card.rank] || 0;
  }
}