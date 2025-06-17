import { injectable } from 'inversify';
import { GameAction, BaseGameState } from '@/lib/garame/core/types';
import { GarameState, GaramePlayerState } from '../games/garame/garame-types';
import { 
  GarameAIConfig, 
  CardEvaluation, 
  GameAnalysis, 
  OpponentModel,
  GarameCard 
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
    const opponent = gameState.players.get(opponentId) as GaramePlayerState;
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