import { GarameState, GarameCard } from '@/lib/game-engine/games/garame/GarameState';
import { z } from 'zod';

/**
 * Schémas de validation pour les actions de jeu
 */
export const GameActionSchema = z.object({
  type: z.enum(['PLAY_CARD', 'FOLD', 'BET']),
  cardId: z.string().optional(),
  amount: z.number().optional(),
  timestamp: z.number(),
});

export const GameMoveSchema = z.object({
  gameId: z.string().cuid(),
  playerId: z.string().cuid(),
  action: GameActionSchema,
  clientTimestamp: z.number(),
});

/**
 * Erreurs de validation spécifiques
 */
export class GameValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GameValidationError';
  }
}

/**
 * Validateur de jeu côté serveur
 */
export class GameValidator {
  private static readonly MAX_MOVE_DELAY = 30000; // 30 secondes max
  private static readonly MIN_MOVE_DELAY = 100; // 100ms min pour éviter les bots
  
  /**
   * Valide une action de jeu complète
   */
  static validateGameMove(
    gameState: GarameState,
    playerId: string,
    action: any,
    serverTimestamp: number
  ): void {
    // 1. Validation du schéma
    const validatedMove = GameMoveSchema.parse({
      gameId: 'temp', // Sera validé séparément
      playerId,
      action,
      clientTimestamp: action.timestamp || serverTimestamp,
    });

    // 2. Validation temporelle
    this.validateTiming(validatedMove.action, serverTimestamp);

    // 3. Validation de l'état du jeu
    this.validateGameState(gameState, playerId);

    // 4. Validation de l'action spécifique
    this.validateAction(gameState, playerId, validatedMove.action);

    // 5. Validation de la logique métier
    this.validateBusinessLogic(gameState, playerId, validatedMove.action);
  }

  /**
   * Valide le timing des actions pour détecter les bots
   */
  private static validateTiming(action: any, serverTimestamp: number): void {
    const clientTimestamp = action.timestamp;
    const delay = Math.abs(serverTimestamp - clientTimestamp);

    // Vérifier que l'action n'est pas trop ancienne
    if (delay > this.MAX_MOVE_DELAY) {
      throw new GameValidationError(
        'Action trop ancienne',
        'STALE_ACTION',
        { delay, maxDelay: this.MAX_MOVE_DELAY }
      );
    }

    // Vérifier que l'action n'est pas trop rapide (bot detection)
    if (delay < this.MIN_MOVE_DELAY && action.type === 'PLAY_CARD') {
      throw new GameValidationError(
        'Action trop rapide - possible bot',
        'SUSPICIOUS_TIMING',
        { delay, minDelay: this.MIN_MOVE_DELAY }
      );
    }
  }

  /**
   * Valide l'état général du jeu
   */
  private static validateGameState(gameState: GarameState, playerId: string): void {
    // Vérifier que le jeu est actif
    if (!gameState) {
      throw new GameValidationError('État de jeu invalide', 'INVALID_GAME_STATE');
    }

    // Vérifier que le joueur existe
    const player = gameState.players[playerId];
    if (!player) {
      throw new GameValidationError('Joueur non trouvé', 'PLAYER_NOT_FOUND');
    }

    // Vérifier que le joueur n'a pas abandonné
    if (player.hasFolded) {
      throw new GameValidationError('Joueur déjà couché', 'PLAYER_FOLDED');
    }

    // Vérifier que c'est le tour du joueur
    if (gameState.currentPlayerId !== playerId) {
      throw new GameValidationError('Pas votre tour', 'NOT_PLAYER_TURN', {
        currentPlayer: gameState.currentPlayerId,
        requestingPlayer: playerId
      });
    }
  }

  /**
   * Valide l'action spécifique
   */
  private static validateAction(gameState: GarameState, playerId: string, action: any): void {
    const player = gameState.players[playerId];

    switch (action.type) {
      case 'PLAY_CARD':
        this.validatePlayCardAction(player, action);
        break;
      
      case 'FOLD':
        this.validateFoldAction(player);
        break;
      
      case 'BET':
        this.validateBetAction(player, action);
        break;
      
      default:
        throw new GameValidationError('Type d\'action invalide', 'INVALID_ACTION_TYPE');
    }
  }

  /**
   * Valide l'action de jouer une carte
   */
  private static validatePlayCardAction(player: any, action: any): void {
    if (!action.cardId) {
      throw new GameValidationError('ID de carte manquant', 'MISSING_CARD_ID');
    }

    // Vérifier que le joueur possède la carte
    const hasCard = player.hand.some((card: GarameCard) => card.id === action.cardId);
    if (!hasCard) {
      throw new GameValidationError(
        'Carte non possédée',
        'CARD_NOT_OWNED',
        { cardId: action.cardId, hand: player.hand.map((c: GarameCard) => c.id) }
      );
    }

    // Vérifier le format de l'ID de carte
    const cardIdRegex = /^(hearts|diamonds|clubs|spades)_([3-9]|10)$/;
    if (!cardIdRegex.test(action.cardId)) {
      throw new GameValidationError('Format d\'ID de carte invalide', 'INVALID_CARD_FORMAT');
    }
  }

  /**
   * Valide l'action d'abandon
   */
  private static validateFoldAction(player: any): void {
    if (player.hasFolded) {
      throw new GameValidationError('Joueur déjà couché', 'ALREADY_FOLDED');
    }
  }

  /**
   * Valide l'action de mise
   */
  private static validateBetAction(player: any, action: any): void {
    if (!action.amount || action.amount <= 0) {
      throw new GameValidationError('Montant de mise invalide', 'INVALID_BET_AMOUNT');
    }

    // Validation du montant selon les règles du jeu
    // (à implémenter selon les règles spécifiques)
  }

  /**
   * Valide la logique métier spécifique au jeu
   */
  private static validateBusinessLogic(gameState: GarameState, playerId: string, action: any): void {
    // Vérifier les règles spécifiques à Garame
    if (action.type === 'PLAY_CARD') {
      this.validateGarameRules(gameState, playerId, action);
    }
  }

  /**
   * Valide les règles spécifiques à Garame
   */
  private static validateGarameRules(gameState: GarameState, playerId: string, action: any): void {
    const player = gameState.players[playerId];
    const card = player.hand.find((c: GarameCard) => c.id === action.cardId);
    
    if (!card) return; // Déjà validé plus haut

    // Règle : Ne peut pas jouer le 10 de pique (carte inexistante dans Garame)
    if (card.suit === 'spades' && card.rank === 10) {
      throw new GameValidationError(
        'Le 10 de pique n\'existe pas dans Garame',
        'INVALID_GARAME_CARD'
      );
    }

    // Règle : Vérifier les contraintes de tour
    if (gameState.tableCards.length > 0) {
      // Logique pour suivre la couleur si nécessaire (selon les règles exactes)
      this.validateSuitFollowing(gameState, card);
    }

    // Règle : Vérifier les conditions de Kora
    this.validateKoraConditions(player, card);
  }

  /**
   * Valide le suivi de couleur (si applicable)
   */
  private static validateSuitFollowing(gameState: GarameState, card: GarameCard): void {
    // Implémentation selon les règles exactes de Garame
    // Pour l'instant, pas de contrainte de couleur
  }

  /**
   * Valide les conditions de Kora
   */
  private static validateKoraConditions(player: any, card: GarameCard): void {
    // Vérifier si le joueur essaie de jouer un 3 de manière suspecte
    if (card.rank === 3) {
      const threeCount = player.hand.filter((c: GarameCard) => c.rank === 3).length;
      
      // Si le joueur a plusieurs 3, s'assurer qu'il ne les gaspille pas
      // (logique à affiner selon la stratégie)
    }
  }

  /**
   * Valide l'intégrité de l'état du jeu
   */
  static validateGameStateIntegrity(gameState: GarameState): void {
    // Vérifier que le nombre total de cartes est correct
    const totalCards = Object.values(gameState.players).reduce(
      (total, player) => total + player.hand.length + player.cardsWon.length,
      gameState.tableCards.length
    );

    const expectedCards = 31; // 32 cartes - 1 (10 de pique exclu)
    if (totalCards !== expectedCards) {
      throw new GameValidationError(
        'Nombre de cartes incorrect',
        'CARD_COUNT_MISMATCH',
        { expected: expectedCards, actual: totalCards }
      );
    }

    // Vérifier qu'il n'y a pas de cartes dupliquées
    const allCards: string[] = [];
    
    Object.values(gameState.players).forEach(player => {
      player.hand.forEach(card => allCards.push(card.id));
      player.cardsWon.forEach(card => allCards.push(card.id));
    });
    
    gameState.tableCards.forEach(card => allCards.push(card.id));

    const uniqueCards = new Set(allCards);
    if (uniqueCards.size !== allCards.length) {
      throw new GameValidationError(
        'Cartes dupliquées détectées',
        'DUPLICATE_CARDS',
        { totalCards: allCards.length, uniqueCards: uniqueCards.size }
      );
    }
  }

  /**
   * Valide les permissions du joueur
   */
  static validatePlayerPermissions(
    gameId: string,
    playerId: string,
    requiredRole: 'player' | 'spectator' | 'admin' = 'player'
  ): void {
    // Validation des permissions selon le rôle
    // À implémenter selon le système de permissions
  }

  /**
   * Génère un hash de l'état du jeu pour détecter les modifications
   */
  static generateGameStateHash(gameState: GarameState): string {
    const stateString = JSON.stringify(gameState, Object.keys(gameState).sort());
    return Buffer.from(stateString).toString('base64');
  }

  /**
   * Valide que l'état du jeu n'a pas été modifié
   */
  static validateGameStateHash(gameState: GarameState, expectedHash: string): void {
    const actualHash = this.generateGameStateHash(gameState);
    if (actualHash !== expectedHash) {
      throw new GameValidationError(
        'État du jeu modifié de manière inattendue',
        'STATE_HASH_MISMATCH',
        { expected: expectedHash, actual: actualHash }
      );
    }
  }
}

/**
 * Middleware de validation pour les routes tRPC
 */
export function validateGameAction(
  gameState: GarameState,
  playerId: string,
  action: any
): void {
  const serverTimestamp = Date.now();
  
  try {
    GameValidator.validateGameMove(gameState, playerId, action, serverTimestamp);
    GameValidator.validateGameStateIntegrity(gameState);
  } catch (error) {
    if (error instanceof GameValidationError) {
      // Logger l'erreur pour monitoring
      console.error('Game validation error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        playerId,
        timestamp: serverTimestamp,
      });
    }
    throw error;
  }
} 