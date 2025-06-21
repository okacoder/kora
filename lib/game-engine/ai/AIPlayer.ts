import { GarameState, GarameCard, GaramePlayerState } from '../games/garame/GarameState';

export type AILevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface AIMove {
  type: 'PLAY_CARD' | 'FOLD';
  cardId?: string;
  confidence: number; // 0-1, confiance dans le mouvement
  reasoning?: string; // Explication du choix (pour debug)
}

export abstract class AIPlayer {
  protected playerId: string;
  protected difficulty: AILevel;
  protected thinkingTime: number;

  constructor(playerId: string, difficulty: AILevel) {
    this.playerId = playerId;
    this.difficulty = difficulty;
    
    // Temps de réflexion selon la difficulté
    this.thinkingTime = {
      'EASY': 500,
      'MEDIUM': 1500,
      'HARD': 2500,
    }[difficulty];
  }

  /**
   * Calcule le prochain mouvement de l'IA
   */
  async calculateMove(gameState: GarameState): Promise<AIMove> {
    // Simulation du temps de réflexion
    await this.delay(this.thinkingTime + Math.random() * 500);
    
    return this.analyzeAndDecide(gameState);
  }

  /**
   * Analyse l'état du jeu et prend une décision
   */
  protected abstract analyzeAndDecide(gameState: GarameState): AIMove;

  /**
   * Évalue la force d'une carte dans le contexte actuel
   */
  protected evaluateCardStrength(card: GarameCard, gameState: GarameState): number {
    const baseValue = card.rank;
    let strength = baseValue;

    // Bonus pour les cartes de 3 (Koras potentiels)
    if (card.rank === 3) {
      const player = gameState.players[this.playerId];
      if (player) {
        const threeCount = player.hand.filter((c: GarameCard) => c.rank === 3).length;
        // Plus on a de 3, plus ils sont précieux
        strength += threeCount * 5;
      }
    }

    // Contexte de la table
    if (gameState.tableCards.length > 0) {
      const highestOnTable = Math.max(...gameState.tableCards.map(c => c.rank));
      
      // Bonus si peut gagner le pli
      if (card.rank > highestOnTable) {
        strength += 3;
      }
      
      // Malus si carte trop faible
      if (card.rank < highestOnTable) {
        strength -= 2;
      }
    }

    return strength;
  }

  /**
   * Analyse les Koras possibles dans la main
   */
  protected analyzeKorasPotential(hand: GarameCard[]): {
    hasKora: boolean;
    koraType: 'simple' | 'double' | 'triple' | null;
    threeCount: number;
  } {
    const threeCount = hand.filter(card => card.rank === 3).length;
    
    let koraType: 'simple' | 'double' | 'triple' | null = null;
    if (threeCount >= 2) koraType = 'simple';
    if (threeCount >= 3) koraType = 'double';
    if (threeCount >= 4) koraType = 'triple';

    return {
      hasKora: threeCount >= 2,
      koraType,
      threeCount
    };
  }

  /**
   * Calcule les probabilités de victoire
   */
  protected calculateWinProbability(gameState: GarameState): number {
    const player = gameState.players[this.playerId];
    if (!player) return 0;

    const totalPlayers = Object.keys(gameState.players).length;
    const cardsWon = player.cardsWon.length;
    const korasWon = player.korasWon;
    
    // Score basé sur les cartes gagnées et les Koras
    const currentScore = cardsWon + (korasWon * 2);
    
    // Estimation du score moyen nécessaire pour gagner
    const averageWinningScore = (gameState.maxRounds * totalPlayers) / totalPlayers + 1;
    
    return Math.min(currentScore / averageWinningScore, 1);
  }

  /**
   * Simule un délai de réflexion
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtient les informations du joueur IA
   */
  protected getPlayerInfo(gameState: GarameState): GaramePlayerState | undefined {
    return gameState.players[this.playerId];
  }

  /**
   * Obtient les informations des adversaires
   */
  protected getOpponents(gameState: GarameState): GaramePlayerState[] {
    return Object.values(gameState.players).filter(p => p.id !== this.playerId);
  }

  /**
   * Détermine si c'est le tour du joueur IA
   */
  protected isMyTurn(gameState: GarameState): boolean {
    return gameState.currentPlayerId === this.playerId;
  }

  /**
   * Analyse la situation de la table
   */
  protected analyzeTableSituation(gameState: GarameState): {
    canWinTrick: boolean;
    highestCard: number;
    cardsPlayed: number;
    isLastToPlay: boolean;
  } {
    const tableCards = gameState.tableCards;
    const totalPlayers = Object.keys(gameState.players).length;
    
    const highestCard = tableCards.length > 0 ? 
      Math.max(...tableCards.map(c => c.rank)) : 0;
    
    const cardsPlayed = tableCards.length;
    const isLastToPlay = cardsPlayed === totalPlayers - 1;
    
    const player = this.getPlayerInfo(gameState);
    const canWinTrick = player ? 
      player.hand.some((card: GarameCard) => card.rank > highestCard) : false;

    return {
      canWinTrick,
      highestCard,
      cardsPlayed,
      isLastToPlay
    };
  }
} 