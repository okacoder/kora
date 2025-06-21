import { BaseGameState, BasePlayerState } from '../../core/GameRules';

/**
 * Représente une carte dans le jeu Garame
 */
export interface GarameCard {
  id: string;
  rank: number; // 3, 4, 5, 6, 7, 8, 9, 10
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
}

/**
 * État d'un joueur dans le jeu Garame
 */
export interface GaramePlayerState extends BasePlayerState {
  hand: GarameCard[];
  cardsWon: GarameCard[];
  korasWon: number;
  hasFolded: boolean;
  position: number; // Position à la table (0, 1, 2, 3...)
  isReady: boolean;
}

/**
 * État complet du jeu Garame
 */
export interface GarameState extends BaseGameState {
  gameType: 'garame';
  players: Record<string, GaramePlayerState>;
  
  // État spécifique à Garame
  deck: GarameCard[];
  tableCards: GarameCard[]; // Cartes jouées ce tour
  currentRound: number;
  maxRounds: number;
  roundWinner: string | null;
  
  // Historique des tours
  roundHistory: GarameRound[];
  
  // Dernière action
  lastAction: GarameAction | null;
  
  // Statistiques du jeu
  totalCardsPlayed: number;
  korasDetected: GarameKora[];
}

/**
 * Représente un tour complet dans Garame
 */
export interface GarameRound {
  roundNumber: number;
  cardsPlayed: Record<string, GarameCard>; // playerId -> carte jouée
  winner: string;
  winningCard: GarameCard;
  timestamp: Date;
}

/**
 * Action dans le jeu Garame
 */
export interface GarameAction {
  type: 'PLAY_CARD' | 'FOLD' | 'READY';
  playerId: string;
  playerName: string;
  card?: GarameCard;
  timestamp: Date;
}

/**
 * Types de Koras (combinaisons spéciales)
 */
export type GarameKoraType = 'SIMPLE' | 'DOUBLE' | 'TRIPLE' | 'GRAND_SLAM';

/**
 * Représente une Kora détectée
 */
export interface GarameKora {
  type: GarameKoraType;
  playerId: string;
  playerName: string;
  cards: GarameCard[];
  multiplier: number; // Multiplicateur de gain
  timestamp: Date;
}

/**
 * Mouvements possibles dans Garame
 */
export type GarameMoveType = 'PLAY_CARD' | 'FOLD' | 'READY';

/**
 * Données d'un mouvement Garame
 */
export interface GarameMoveData {
  cardId?: string;
  position?: number;
}

/**
 * Configuration du jeu Garame
 */
export interface GarameConfig {
  maxPlayers: number;
  minPlayers: number;
  cardsPerPlayer: number;
  excludeCards: string[]; // Cartes à exclure (ex: "spades_10")
  koraMultipliers: Record<GarameKoraType, number>;
  commission: number; // Pourcentage de commission (0-100)
}

/**
 * Configuration par défaut pour Garame
 */
export const DEFAULT_GARAME_CONFIG: GarameConfig = {
  maxPlayers: 5,
  minPlayers: 2,
  cardsPerPlayer: 5,
  excludeCards: ['spades_10'], // Exclure le 10 de pique
  koraMultipliers: {
    SIMPLE: 0.5,    // 2 cartes de 3 = 50% du pot
    DOUBLE: 1.0,    // 3 cartes de 3 = 100% du pot
    TRIPLE: 2.0,    // 4 cartes de 3 = 200% du pot
    GRAND_SLAM: 5.0 // Toutes les cartes de 3 = 500% du pot
  },
  commission: 10, // 10% de commission
};

/**
 * Utilitaires pour les cartes Garame
 */
export class GarameCardUtils {
  /**
   * Crée un deck complet pour Garame
   */
  static createDeck(config: GarameConfig = DEFAULT_GARAME_CONFIG): GarameCard[] {
    const deck: GarameCard[] = [];
    const suits: Array<'hearts' | 'diamonds' | 'clubs' | 'spades'> = 
      ['hearts', 'diamonds', 'clubs', 'spades'];
    
    for (const suit of suits) {
      for (let rank = 3; rank <= 10; rank++) {
        const cardId = `${suit}_${rank}`;
        
        // Exclure les cartes spécifiées dans la config
        if (!config.excludeCards.includes(cardId)) {
          deck.push({
            id: cardId,
            rank,
            suit,
          });
        }
      }
    }

    return this.shuffle(deck);
  }

  /**
   * Mélange un deck de cartes
   */
  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Compare deux cartes pour déterminer la plus forte
   */
  static compareCards(card1: GarameCard, card2: GarameCard): number {
    return card1.rank - card2.rank;
  }

  /**
   * Trouve la carte la plus forte parmi un ensemble
   */
  static findHighestCard(cards: GarameCard[]): GarameCard {
    return cards.reduce((highest, card) => 
      this.compareCards(card, highest) > 0 ? card : highest
    );
  }

  /**
   * Détecte les Koras dans la main d'un joueur
   */
  static detectKoras(hand: GarameCard[]): GarameKora[] {
    const koras: GarameKora[] = [];
    const threes = hand.filter(card => card.rank === 3);
    
    if (threes.length >= 2) {
      let koraType: GarameKoraType;
      let multiplier: number;
      
      switch (threes.length) {
        case 2:
          koraType = 'SIMPLE';
          multiplier = DEFAULT_GARAME_CONFIG.koraMultipliers.SIMPLE;
          break;
        case 3:
          koraType = 'DOUBLE';
          multiplier = DEFAULT_GARAME_CONFIG.koraMultipliers.DOUBLE;
          break;
        case 4:
          koraType = 'TRIPLE';
          multiplier = DEFAULT_GARAME_CONFIG.koraMultipliers.TRIPLE;
          break;
        default:
          koraType = 'GRAND_SLAM';
          multiplier = DEFAULT_GARAME_CONFIG.koraMultipliers.GRAND_SLAM;
      }
      
      // Note: playerId et playerName seront remplis par le moteur de jeu
      koras.push({
        type: koraType,
        playerId: '',
        playerName: '',
        cards: threes,
        multiplier,
        timestamp: new Date(),
      });
    }
    
    return koras;
  }

  /**
   * Génère un ID unique pour une carte
   */
  static generateCardId(suit: string, rank: number): string {
    return `${suit}_${rank}`;
  }

  /**
   * Parse un ID de carte pour extraire suit et rank
   */
  static parseCardId(cardId: string): { suit: string; rank: number } {
    const [suit, rankStr] = cardId.split('_');
    return { suit, rank: parseInt(rankStr) };
  }
} 