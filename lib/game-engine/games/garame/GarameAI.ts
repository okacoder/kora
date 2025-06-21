import { AIPlayer, AIMove, AILevel } from '../../ai/AIPlayer';
import { GarameState, GarameCard, GaramePlayerState } from './GarameState';

/**
 * IA spécialisée pour le jeu Garame
 * Implémente trois niveaux de difficulté avec des stratégies différentes
 */
export class GarameAI extends AIPlayer {
  constructor(playerId: string, difficulty: AILevel) {
    super(playerId, difficulty);
  }

  /**
   * Analyse l'état du jeu et décide du prochain mouvement
   */
  protected analyzeAndDecide(gameState: GarameState): AIMove {
    const player = this.getPlayerInfo(gameState);
    
    if (!player || !this.isMyTurn(gameState)) {
      return {
        type: 'PLAY_CARD',
        confidence: 0,
        reasoning: 'Pas mon tour'
      };
    }

    // Analyser la situation
    const tableSituation = this.analyzeTableSituation(gameState);
    const korasPotential = this.analyzeKorasPotential(player.hand);
    const winProbability = this.calculateWinProbability(gameState);

    // Décider selon la difficulté
    switch (this.difficulty) {
      case 'EASY':
        return this.easyStrategy(gameState, player, tableSituation, korasPotential);
      case 'MEDIUM':
        return this.mediumStrategy(gameState, player, tableSituation, korasPotential, winProbability);
      case 'HARD':
        return this.hardStrategy(gameState, player, tableSituation, korasPotential, winProbability);
      default:
        return this.easyStrategy(gameState, player, tableSituation, korasPotential);
    }
  }

  /**
   * Stratégie facile : Joue de manière aléatoire avec quelques règles de base
   */
  private easyStrategy(
    gameState: GarameState,
    player: GaramePlayerState,
    tableSituation: any,
    korasPotential: any
  ): AIMove {
    const playableCards = player.hand.filter(card => !card || card.rank > 0);
    
    if (playableCards.length === 0) {
      return {
        type: 'PLAY_CARD',
        confidence: 0.3,
        reasoning: 'Aucune carte jouable'
      };
    }

    // Éviter de jouer les 3 si on en a plusieurs (règle basique)
    const nonThrees = playableCards.filter(card => card.rank !== 3);
    const cardsToChooseFrom = nonThrees.length > 0 && korasPotential.threeCount >= 2 
      ? nonThrees 
      : playableCards;

    // Choix aléatoire parmi les cartes disponibles
    const randomIndex = Math.floor(Math.random() * cardsToChooseFrom.length);
    const selectedCard = cardsToChooseFrom[randomIndex];

    return {
      type: 'PLAY_CARD',
      cardId: selectedCard.id,
      confidence: 0.4,
      reasoning: `Jeu aléatoire - ${selectedCard.rank} de ${selectedCard.suit}`
    };
  }

  /**
   * Stratégie moyenne : Analyse basique de la situation
   */
  private mediumStrategy(
    gameState: GarameState,
    player: GaramePlayerState,
    tableSituation: any,
    korasPotential: any,
    winProbability: number
  ): AIMove {

    // Conservation des Koras
    if (korasPotential.hasKora && gameState.currentRound < 4) {
      const nonThrees = player.hand.filter(card => card.rank !== 3);
      if (nonThrees.length > 0) {
        // Jouer la carte la plus faible qui n'est pas un 3
        const weakestNonThree = nonThrees.reduce((weakest, card) => 
          card.rank < weakest.rank ? card : weakest
        );

        return {
          type: 'PLAY_CARD',
          cardId: weakestNonThree.id,
          confidence: 0.6,
          reasoning: `Conservation des Koras - joue ${weakestNonThree.rank} de ${weakestNonThree.suit}`
        };
      }
    }

    // Stratégie selon la situation de table
    if (tableSituation.canWinTrick) {
      // Essayer de gagner le pli avec la carte la plus faible possible
      const winningCards = player.hand.filter(card => card.rank > tableSituation.highestCard);
      if (winningCards.length > 0) {
        const lowestWinning = winningCards.reduce((lowest, card) => 
          card.rank < lowest.rank ? card : lowest
        );

        return {
          type: 'PLAY_CARD',
          cardId: lowestWinning.id,
          confidence: 0.7,
          reasoning: `Gagne le pli avec ${lowestWinning.rank} de ${lowestWinning.suit}`
        };
      }
    }

    // Si ne peut pas gagner, jouer la carte la plus faible
    const weakestCard = player.hand.reduce((weakest, card) => 
      card.rank < weakest.rank ? card : weakest
    );

    return {
      type: 'PLAY_CARD',
      cardId: weakestCard.id,
      confidence: 0.5,
      reasoning: `Défausse ${weakestCard.rank} de ${weakestCard.suit}`
    };
  }

  /**
   * Stratégie difficile : Analyse avancée avec prédiction des adversaires
   */
  private hardStrategy(
    gameState: GarameState,
    player: GaramePlayerState,
    tableSituation: any,
    korasPotential: any,
    winProbability: number
  ): AIMove {
    // Analyse avancée de la position
    const opponents = this.getOpponents(gameState);
    const gameProgression = gameState.currentRound / gameState.maxRounds;
    

    // Gestion avancée des Koras
    if (korasPotential.hasKora) {
      const koraValue = this.calculateKoraValue(korasPotential, gameState);
      
      // Protection aggressive des Koras de haute valeur
      if (koraValue > gameState.betAmount && gameState.currentRound < gameState.maxRounds - 1) {
        const nonThrees = player.hand.filter(card => card.rank !== 3);
        if (nonThrees.length > 1) {
          // Choisir stratégiquement quelle carte jouer
          const strategicCard = this.selectStrategicCard(nonThrees, tableSituation, gameState);
          
          return {
            type: 'PLAY_CARD',
            cardId: strategicCard.id,
            confidence: 0.85,
            reasoning: `Protection Kora (valeur: ${koraValue}) - joue ${strategicCard.rank} de ${strategicCard.suit}`
          };
        }
      }
    }

    // Analyse des adversaires et adaptation
    const opponentAnalysis = this.analyzeOpponents(opponents, gameState);
    
    // Si en position de force, jouer agressivement
    if (winProbability > 0.7) {
      if (tableSituation.canWinTrick) {
        const optimalWinningCard = this.findOptimalWinningCard(player.hand, tableSituation);
        if (optimalWinningCard) {
          return {
            type: 'PLAY_CARD',
            cardId: optimalWinningCard.id,
            confidence: 0.9,
            reasoning: `Jeu agressif - gagne avec ${optimalWinningCard.rank} de ${optimalWinningCard.suit}`
          };
        }
      }
    }

    // Stratégie défensive sophistiquée
    if (tableSituation.isLastToPlay) {
      // Décision optimale en dernière position
      const optimalCard = this.selectOptimalLastCard(player.hand, tableSituation, gameState);
      return {
        type: 'PLAY_CARD',
        cardId: optimalCard.id,
        confidence: 0.8,
        reasoning: `Jeu optimal en dernière position - ${optimalCard.rank} de ${optimalCard.suit}`
      };
    }

    // Jeu par défaut intelligent
    const smartCard = this.selectSmartDefaultCard(player.hand, tableSituation, gameState, korasPotential);
    
    return {
      type: 'PLAY_CARD',
      cardId: smartCard.id,
      confidence: 0.75,
      reasoning: `Jeu intelligent par défaut - ${smartCard.rank} de ${smartCard.suit}`
    };
  }

  /**
   * Calcule la valeur potentielle d'une Kora
   */
  private calculateKoraValue(korasPotential: any, gameState: GarameState): number {
    const basePot = gameState.betAmount * Object.keys(gameState.players).length;
    
    switch (korasPotential.koraType) {
      case 'simple': return basePot * 0.5;
      case 'double': return basePot * 1.0;
      case 'triple': return basePot * 2.0;
      default: return 0;
    }
  }

  /**
   * Sélectionne une carte stratégique parmi les options disponibles
   */
  private selectStrategicCard(cards: GarameCard[], tableSituation: any, gameState: GarameState): GarameCard {
    // Si peut gagner le pli, prendre la carte la plus faible qui gagne
    if (tableSituation.canWinTrick) {
      const winningCards = cards.filter(card => card.rank > tableSituation.highestCard);
      if (winningCards.length > 0) {
        return winningCards.reduce((lowest, card) => card.rank < lowest.rank ? card : lowest);
      }
    }
    
    // Sinon, jouer la carte la plus faible
    return cards.reduce((lowest, card) => card.rank < lowest.rank ? card : lowest);
  }

  /**
   * Analyse les adversaires pour prédire leurs stratégies
   */
  private analyzeOpponents(opponents: GaramePlayerState[], gameState: GarameState): any {
    return opponents.map(opponent => ({
      id: opponent.id,
      cardsWon: opponent.cardsWon.length,
      korasWon: opponent.korasWon,
      hasFolded: opponent.hasFolded,
      threat: opponent.cardsWon.length + (opponent.korasWon * 2),
      position: opponent.position
    }));
  }

  /**
   * Trouve la carte optimale pour gagner un pli
   */
  private findOptimalWinningCard(hand: GarameCard[], tableSituation: any): GarameCard | null {
    const winningCards = hand.filter(card => card.rank > tableSituation.highestCard);
    
    if (winningCards.length === 0) return null;
    
    // Retourner la carte la plus faible qui peut gagner
    return winningCards.reduce((lowest, card) => card.rank < lowest.rank ? card : lowest);
  }

  /**
   * Sélectionne la carte optimale en dernière position
   */
  private selectOptimalLastCard(hand: GarameCard[], tableSituation: any, gameState: GarameState): GarameCard {
    // En dernière position, on sait exactement si on peut gagner
    if (tableSituation.canWinTrick) {
      const winningCard = this.findOptimalWinningCard(hand, tableSituation);
      if (winningCard) return winningCard;
    }
    
    // Si on ne peut pas gagner, jouer la carte la plus faible
    return hand.reduce((lowest, card) => card.rank < lowest.rank ? card : lowest);
  }

  /**
   * Sélectionne une carte par défaut de manière intelligente
   */
  private selectSmartDefaultCard(
    hand: GarameCard[], 
    tableSituation: any, 
    gameState: GarameState, 
    korasPotential: any
  ): GarameCard {
    // Éviter les 3 si on a un potentiel de Kora
    if (korasPotential.hasKora) {
      const nonThrees = hand.filter(card => card.rank !== 3);
      if (nonThrees.length > 0) {
        return this.selectStrategicCard(nonThrees, tableSituation, gameState);
      }
    }
    
    // Sélection basée sur l'évaluation de force
    const cardStrengths = hand.map(card => ({
      card,
      strength: this.evaluateCardStrength(card, gameState)
    }));
    
    // Trier par force et prendre une carte de force moyenne-faible
    cardStrengths.sort((a, b) => a.strength - b.strength);
    const targetIndex = Math.floor(cardStrengths.length * 0.3); // 30% du bas
    
    return cardStrengths[targetIndex]?.card || hand[0];
  }
} 