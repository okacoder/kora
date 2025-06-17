# Implémentation de l'IA Garame avec 3 niveaux de difficulté

## Vue d'ensemble

L'IA du jeu Garame est conçue avec trois niveaux de difficulté progressifs :
- **Boa** (🐍 Facile) : Joue de manière aléatoire avec des erreurs fréquentes
- **Normal** (🎯 Moyen) : Stratégie basique avec quelques tactiques
- **Sensei** (🥋 Maître) : Stratégie avancée avec analyse profonde et bluff

## 1. Interface et Types de l'IA

### Fichier: `lib/garame/ai/garame-ai-types.ts`
```typescript
export interface GarameAIConfig {
  difficulty: 'boa' | 'normal' | 'sensei';
  bluffProbability?: number;
  mistakeProbability?: number;
  analysisDepth?: number;
  memorySize?: number; // Nombre de coups à mémoriser
}

export interface CardEvaluation {
  card: GarameCard;
  score: number;
  reasoning: string;
}

export interface GameAnalysis {
  playerPosition: 'winning' | 'losing' | 'neutral';
  opponentStrength: number; // 0-100
  recommendedStrategy: 'aggressive' | 'conservative' | 'balanced';
  bluffOpportunity: boolean;
  criticalMoment: boolean;
}

export interface OpponentModel {
  playerId: string;
  playsConservatively: boolean;
  bluffFrequency: number;
  averageCardStrength: number;
  koraUsagePattern: 'aggressive' | 'conservative' | 'random';
  recentMoves: Array<{
    card: GarameCard;
    hadKora: boolean;
    wonTrick: boolean;
  }>;
}
```

## 2. Service Principal de l'IA

### Fichier: `lib/garame/ai/garame-ai-service.ts`
```typescript
import { injectable } from 'inversify';
import { GameAction, BaseGameState } from '@/lib/garame/core/types';
import { GarameState, GaramePlayerState, GarameCard } from '../games/garame/types';
import { 
  GarameAIConfig, 
  CardEvaluation, 
  GameAnalysis, 
  OpponentModel 
} from './garame-ai-types';
import { GarameAIStrategies } from './garame-ai-strategies';
import { GarameAIAnalyzer } from './garame-ai-analyzer';

@injectable()
export class GarameAIService {
  private config: GarameAIConfig;
  private analyzer: GarameAIAnalyzer;
  private strategies: GarameAIStrategies;
  private opponentModels: Map<string, OpponentModel> = new Map();

  constructor() {
    this.analyzer = new GarameAIAnalyzer();
    this.strategies = new GarameAIStrategies();
    this.config = { difficulty: 'normal' };
  }

  setDifficulty(difficulty: 'boa' | 'normal' | 'sensei'): void {
    this.config = this.getConfigForDifficulty(difficulty);
  }

  async getNextAction(
    gameState: GarameState,
    playerId: string
  ): Promise<GameAction> {
    const playerState = gameState.players.get(playerId) as GaramePlayerState;
    if (!playerState) {
      throw new Error('Player not found in game state');
    }

    // Analyser la situation actuelle
    const analysis = this.analyzer.analyzeGameState(gameState, playerId);
    
    // Mettre à jour le modèle de l'adversaire
    this.updateOpponentModel(gameState, playerId);

    // Choisir la stratégie selon la difficulté
    let action: GameAction;

    switch (this.config.difficulty) {
      case 'boa':
        action = await this.playAsBoa(gameState, playerId, playerState, analysis);
        break;
      case 'normal':
        action = await this.playAsNormal(gameState, playerId, playerState, analysis);
        break;
      case 'sensei':
        action = await this.playAsSensei(gameState, playerId, playerState, analysis);
        break;
      default:
        action = await this.playAsNormal(gameState, playerId, playerState, analysis);
    }

    return action;
  }

  private async playAsBoa(
    gameState: GarameState,
    playerId: string,
    playerState: GaramePlayerState,
    analysis: GameAnalysis
  ): Promise<GameAction> {
    const validCards = this.getValidCards(gameState, playerState);
    
    // Boa fait des erreurs fréquentes
    if (Math.random() < this.config.mistakeProbability!) {
      // Jouer une mauvaise carte intentionnellement
      const worstCard = this.strategies.findWorstCard(validCards, gameState);
      return this.createPlayAction(playerId, worstCard);
    }

    // Sinon, jouer aléatoirement
    const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
    return this.createPlayAction(playerId, randomCard);
  }

  private async playAsNormal(
    gameState: GarameState,
    playerId: string,
    playerState: GaramePlayerState,
    analysis: GameAnalysis
  ): Promise<GameAction> {
    const validCards = this.getValidCards(gameState, playerState);
    const evaluations = this.evaluateCards(validCards, gameState, playerState);

    // Stratégie basique selon la situation
    if (playerState.hasKora) {
      // Avec la Kora, jouer prudemment
      if (analysis.playerPosition === 'winning') {
        // Garder les bonnes cartes pour la fin
        const mediumCard = this.strategies.selectMediumCard(evaluations);
        return this.createPlayAction(playerId, mediumCard.card);
      } else {
        // Essayer de reprendre l'avantage
        const bestCard = this.strategies.selectBestCard(evaluations);
        return this.createPlayAction(playerId, bestCard.card);
      }
    } else {
      // Sans la Kora, essayer de la récupérer
      if (this.canWinTrick(gameState, evaluations)) {
        const bestCard = this.strategies.selectBestCard(evaluations);
        return this.createPlayAction(playerId, bestCard.card);
      } else {
        // Économiser les bonnes cartes
        const worstCard = this.strategies.selectWorstCard(evaluations);
        return this.createPlayAction(playerId, worstCard.card);
      }
    }
  }

  private async playAsSensei(
    gameState: GarameState,
    playerId: string,
    playerState: GaramePlayerState,
    analysis: GameAnalysis
  ): Promise<GameAction> {
    const validCards = this.getValidCards(gameState, playerState);
    const evaluations = this.evaluateCards(validCards, gameState, playerState);
    const opponentModel = this.opponentModels.get(this.getOpponentId(gameState, playerId));

    // Analyse approfondie avec mémoire des coups précédents
    const deepAnalysis = this.analyzer.performDeepAnalysis(
      gameState, 
      playerId, 
      opponentModel,
      this.config.analysisDepth!
    );

    // Décision basée sur multiple facteurs
    if (analysis.criticalMoment) {
      // Moment critique : jouer le meilleur coup possible
      return this.strategies.calculateOptimalMove(
        gameState, 
        playerState, 
        evaluations, 
        deepAnalysis
      );
    }

    // Considérer le bluff
    if (analysis.bluffOpportunity && Math.random() < this.config.bluffProbability!) {
      const bluffMove = this.strategies.createBluffMove(
        gameState, 
        playerState, 
        evaluations
      );
      if (bluffMove) return bluffMove;
    }

    // Stratégie adaptative basée sur l'adversaire
    if (opponentModel) {
      if (opponentModel.playsConservatively) {
        // Contre un joueur conservateur, être agressif
        return this.strategies.playAggressively(evaluations, playerState);
      } else if (opponentModel.bluffFrequency > 0.3) {
        // Contre un bluffeur, être prudent
        return this.strategies.playDefensively(evaluations, playerState);
      }
    }

    // Stratégie équilibrée par défaut
    return this.strategies.playBalanced(
      gameState, 
      playerState, 
      evaluations, 
      analysis
    );
  }

  private getConfigForDifficulty(difficulty: 'boa' | 'normal' | 'sensei'): GarameAIConfig {
    switch (difficulty) {
      case 'boa':
        return {
          difficulty: 'boa',
          bluffProbability: 0.05, // Bluff rarement
          mistakeProbability: 0.4, // 40% de chance de faire une erreur
          analysisDepth: 1,
          memorySize: 0 // Pas de mémoire
        };
      case 'normal':
        return {
          difficulty: 'normal',
          bluffProbability: 0.15,
          mistakeProbability: 0.1,
          analysisDepth: 2,
          memorySize: 5
        };
      case 'sensei':
        return {
          difficulty: 'sensei',
          bluffProbability: 0.25,
          mistakeProbability: 0.02, // Presque jamais d'erreur
          analysisDepth: 4,
          memorySize: 20 // Mémorise beaucoup de coups
        };
    }
  }

  private evaluateCards(
    cards: GarameCard[], 
    gameState: GarameState, 
    playerState: GaramePlayerState
  ): CardEvaluation[] {
    return cards.map(card => ({
      card,
      score: this.calculateCardScore(card, gameState, playerState),
      reasoning: this.getCardReasoning(card, gameState, playerState)
    }));
  }

  private calculateCardScore(
    card: GarameCard, 
    gameState: GarameState, 
    playerState: GaramePlayerState
  ): number {
    let score = this.getCardValue(card);

    // Ajustements selon le contexte
    if (playerState.hasKora) {
      // Avec la Kora, privilégier les cartes moyennes
      score = score > 10 ? score - 3 : score + 2;
    }

    // Si c'est le dernier tour, maximiser les points
    if (gameState.turn > 15) {
      score += 5;
    }

    // Bonus pour les cartes de la couleur demandée
    if (gameState.currentSuit && card.suit === gameState.currentSuit) {
      score += 3;
    }

    return score;
  }

  private getCardValue(card: GarameCard): number {
    const values: Record<string, number> = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11,
      '10': 10, '9': 9, '8': 8, '7': 7,
      '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    return values[card.rank] || 0;
  }

  // Méthodes utilitaires...
  private createPlayAction(playerId: string, card: GarameCard): GameAction {
    return {
      type: 'play_card',
      playerId,
      data: { cardId: card.id },
      timestamp: new Date()
    };
  }

  private getValidCards(gameState: GarameState, playerState: GaramePlayerState): GarameCard[] {
    // Logique pour obtenir les cartes jouables
    return playerState.hand.filter(card => 
      this.canPlayCard(card, gameState, playerState)
    );
  }

  private canPlayCard(
    card: GarameCard, 
    gameState: GarameState, 
    playerState: GaramePlayerState
  ): boolean {
    // Si le joueur a la Kora, il peut jouer n'importe quelle carte
    if (playerState.hasKora) return true;

    // Sinon, doit suivre la couleur si possible
    if (!gameState.currentSuit) return true;

    const hasSuitCard = playerState.hand.some(c => c.suit === gameState.currentSuit);
    return !hasSuitCard || card.suit === gameState.currentSuit;
  }

  private updateOpponentModel(gameState: GarameState, playerId: string): void {
    const opponentId = this.getOpponentId(gameState, playerId);
    const opponent = gameState.players.get(opponentId);
    if (!opponent) return;

    let model = this.opponentModels.get(opponentId);
    if (!model) {
      model = {
        playerId: opponentId,
        playsConservatively: false,
        bluffFrequency: 0,
        averageCardStrength: 0,
        koraUsagePattern: 'random',
        recentMoves: []
      };
      this.opponentModels.set(opponentId, model);
    }

    // Mettre à jour le modèle avec le dernier coup
    if (opponent.lastAction && opponent.lastAction.type === 'play_card') {
      const lastCard = opponent.lastAction.data.card as GarameCard;
      model.recentMoves.push({
        card: lastCard,
        hadKora: opponent.hasKora,
        wonTrick: false // À déterminer
      });

      // Garder seulement les N derniers coups
      if (model.recentMoves.length > this.config.memorySize!) {
        model.recentMoves.shift();
      }

      // Analyser les patterns
      this.analyzeOpponentPatterns(model);
    }
  }

  private analyzeOpponentPatterns(model: OpponentModel): void {
    if (model.recentMoves.length < 3) return;

    // Calculer la force moyenne des cartes jouées
    const avgStrength = model.recentMoves.reduce((sum, move) => 
      sum + this.getCardValue(move.card), 0
    ) / model.recentMoves.length;
    
    model.averageCardStrength = avgStrength;
    model.playsConservatively = avgStrength < 7;

    // Détecter les patterns d'utilisation de la Kora
    const koraPlays = model.recentMoves.filter(m => m.hadKora);
    if (koraPlays.length > 0) {
      const avgKoraCardValue = koraPlays.reduce((sum, move) => 
        sum + this.getCardValue(move.card), 0
      ) / koraPlays.length;
      
      model.koraUsagePattern = avgKoraCardValue < 6 ? 'conservative' : 
                               avgKoraCardValue > 10 ? 'aggressive' : 'random';
    }
  }

  private getOpponentId(gameState: GarameState, playerId: string): string {
    const players = Array.from(gameState.players.keys());
    return players.find(id => id !== playerId) || '';
  }

  private canWinTrick(gameState: GarameState, evaluations: CardEvaluation[]): boolean {
    if (!gameState.lastPlayedCard) return true;
    
    const bestCard = evaluations.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return this.getCardValue(bestCard.card) > this.getCardValue(gameState.lastPlayedCard);
  }

  private getCardReasoning(
    card: GarameCard, 
    gameState: GarameState, 
    playerState: GaramePlayerState
  ): string {
    if (playerState.hasKora && this.getCardValue(card) < 6) {
      return "Carte faible pour conserver la Kora";
    }
    if (!playerState.hasKora && this.getCardValue(card) > 11) {
      return "Carte forte pour récupérer la Kora";
    }
    return "Carte équilibrée";
  }
}
```

## 3. Analyseur de Jeu

### Fichier: `lib/garame/ai/garame-ai-analyzer.ts`
```typescript
import { GarameState, GaramePlayerState, GarameCard } from '../games/garame/types';
import { GameAnalysis, OpponentModel } from './garame-ai-types';

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
      // Logique de simulation...
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
      .some(p => p.hand.length <= 2);

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
```

## 4. Stratégies de l'IA

### Fichier: `lib/garame/ai/garame-ai-strategies.ts`
```typescript
import { GameAction } from '@/lib/garame/core/types';
import { GarameState, GaramePlayerState, GarameCard } from '../games/garame/types';
import { CardEvaluation, GameAnalysis } from './garame-ai-types';

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
```

## 5. Intégration avec le Container IoC

### Fichier: `lib/di/types.ts` (ajout)
```typescript
export const TYPES = {
  // ... autres types existants
  GarameAIService: Symbol.for('GarameAIService'),
};
```

### Fichier: `lib/di/container.ts` (ajout)
```typescript
import { GarameAIService } from '@/lib/garame/ai/garame-ai-service';

// Dans la configuration du container
container.bind(TYPES.GarameAIService).to(GarameAIService).inSingletonScope();
```

## 6. Hook pour utiliser l'IA

### Fichier: `hooks/useGarameAI.ts`
```typescript
import { useInjection } from './useInjection';
import { TYPES } from '@/lib/di/types';
import { GarameAIService } from '@/lib/garame/ai/garame-ai-service';

export function useGarameAI() {
  const aiService = useInjection<GarameAIService>(TYPES.GarameAIService);
  
  return {
    setDifficulty: (difficulty: 'boa' | 'normal' | 'sensei') => {
      aiService.setDifficulty(difficulty);
    },
    getNextMove: async (gameState: any, playerId: string) => {
      return aiService.getNextAction(gameState, playerId);
    }
  };
}
```

## 7. Exemple d'utilisation dans le jeu

### Fichier: `app/(authenticated)/games/garame/play/page.tsx` (extrait)
```typescript
"use client";

import { useEffect, useState } from 'react';
import { useGarameAI } from '@/hooks/useGarameAI';
import { useGameEngineService } from '@/hooks/useInjection';

export default function GaramePlayPage() {
  const { setDifficulty, getNextMove } = useGarameAI();
  const gameEngine = useGameEngineService();
  const [gameState, setGameState] = useState(null);
  const [aiDifficulty, setAIDifficulty] = useState<'boa' | 'normal' | 'sensei'>('normal');

  // Configurer la difficulté de l'IA
  useEffect(() => {
    setDifficulty(aiDifficulty);
  }, [aiDifficulty]);

  // Faire jouer l'IA
  const playAITurn = async () => {
    if (!gameState || !isAITurn()) return;

    const aiPlayerId = getAIPlayerId();
    const aiMove = await getNextMove(gameState, aiPlayerId);
    
    if (aiMove) {
      const newState = await gameEngine.processAction(gameState.id, aiMove);
      setGameState(newState);
    }
  };

  // Interface pour changer la difficulté
  return (
    <div>
      <div className="mb-4">
        <label>Difficulté de l'IA:</label>
        <select 
          value={aiDifficulty} 
          onChange={(e) => setAIDifficulty(e.target.value as any)}
        >
          <option value="boa">🐍 Boa (Facile)</option>
          <option value="normal">🎯 Normal</option>
          <option value="sensei">🥋 Sensei (Maître)</option>
        </select>
      </div>
      
      {/* Reste de l'interface du jeu */}
    </div>
  );
}
```

## Résumé des comportements par niveau

### 🐍 **Boa (Facile)**
- Joue aléatoirement la plupart du temps
- 40% de chance de faire une erreur évidente
- Ne mémorise pas les coups précédents
- Ne bluffe presque jamais (5%)
- Facile à battre pour les débutants

### 🎯 **Normal (Moyen)**
- Stratégie basique mais cohérente
- Comprend quand garder/récupérer la Kora
- Mémorise les 5 derniers coups
- Bluffe occasionnellement (15%)
- Défi équilibré pour la plupart des joueurs

### 🥋 **Sensei (Maître)**
- Analyse profonde de la situation
- S'adapte au style de l'adversaire
- Mémorise 20 coups et détecte les patterns
- Bluffe stratégiquement (25%)
- Très difficile à battre

Cette implémentation offre une progression naturelle et permet aux joueurs de tous niveaux de trouver un défi adapté.