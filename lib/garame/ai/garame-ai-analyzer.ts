import { GarameState, GaramePlayerState } from '../games/garame/garame-types';
import { GameAnalysis, OpponentModel, GarameCard } from './garame-ai-types';

export class GarameAIAnalyzer {
  analyzeGameState(gameState: GarameState, playerId: string): GameAnalysis {
    const player = gameState.players.get(playerId) as GaramePlayerState;
    const opponent = this.getOpponent(gameState, playerId);
    
    const playerScore = player.score;
    const opponentScore = opponent?.score || 0;
    const scoreDiff = playerScore - opponentScore;

    // Déterminer la position du joueur
    let playerPosition: 'winning' | 'losing' | 'neutral';
    if (scoreDiff > 3) playerPosition = 'winning';
    else if (scoreDiff < -3) playerPosition = 'losing';
    else playerPosition = 'neutral';

    // Évaluer la force de l'adversaire
    const opponentStrength = this.evaluateOpponentStrength(gameState, opponent);

    // Recommander une stratégie
    let recommendedStrategy: 'aggressive' | 'conservative' | 'balanced';
    if (playerPosition === 'winning' && player.hasKora) {
      recommendedStrategy = 'conservative';
    } else if (playerPosition === 'losing' && !player.hasKora) {
      recommendedStrategy = 'aggressive';
    } else {
      recommendedStrategy = 'balanced';
    }

    // Détecter les opportunités de bluff
    const bluffOpportunity = this.detectBluffOpportunity(gameState, player);

    // Identifier les moments critiques
    const criticalMoment = this.isCriticalMoment(gameState, playerScore, opponentScore);

    return {
      playerPosition,
      opponentStrength,
      recommendedStrategy,
      bluffOpportunity,
      criticalMoment
    };
  }

  performDeepAnalysis(
    gameState: GarameState,
    playerId: string,
    opponentModel: OpponentModel | undefined,
    depth: number
  ): any {
    // Analyse approfondie pour Sensei
    const analysis = {
      bestSequence: [],
      expectedOutcome: 0,
      riskLevel: 0,
      opportunities: []
    };

    // Simuler les prochains coups possibles
    for (let i = 0; i < depth; i++) {
      // Logique de simulation simplifiée pour l'instant
      // Dans une implémentation complète, on simulerait plusieurs branches
    }

    return analysis;
  }

  private evaluateOpponentStrength(
    gameState: GarameState, 
    opponent: GaramePlayerState | undefined
  ): number {
    if (!opponent) return 0;

    let strength = 50; // Base

    // Score
    strength += opponent.score * 5;

    // Possession de la Kora
    if (opponent.hasKora) strength += 20;

    // Nombre de cartes restantes
    strength += opponent.hand.length * 2;

    return Math.min(100, Math.max(0, strength));
  }

  private detectBluffOpportunity(
    gameState: GarameState, 
    player: GaramePlayerState
  ): boolean {
    // Le bluff est possible quand :
    // 1. Le joueur a la Kora (peut jouer n'importe quoi)
    // 2. L'adversaire a peu de cartes
    // 3. Le score est serré

    if (!player.hasKora) return false;

    const opponent = this.getOpponent(gameState, player.id);
    if (!opponent) return false;

    const hasWeakCards = player.hand.some(card => this.getCardValue(card) < 6);
    const opponentLowCards = opponent.hand.length <= 3;
    const closeScore = Math.abs(player.score - opponent.score) <= 2;

    return hasWeakCards && opponentLowCards && closeScore;
  }

  private isCriticalMoment(
    gameState: GarameState, 
    playerScore: number, 
    opponentScore: number
  ): boolean {
    // Moments critiques :
    // 1. Un joueur est proche de gagner (8+ points)
    // 2. Fin de partie proche
    // 3. Peu de cartes restantes

    const nearWin = playerScore >= 8 || opponentScore >= 8;
    const lateGame = gameState.turn > 15;
    const fewCardsLeft = Array.from(gameState.players.values())
      .some(p => (p as GaramePlayerState).hand.length <= 2);

    return nearWin || lateGame || fewCardsLeft;
  }

  private getOpponent(gameState: GarameState, playerId: string): GaramePlayerState | undefined {
    return Array.from(gameState.players.values())
      .find(p => p.id !== playerId) as GaramePlayerState;
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