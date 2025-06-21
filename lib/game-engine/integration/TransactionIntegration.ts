/**
 * Intégration entre le moteur de jeu et le système de transactions
 * Gère automatiquement les flux financiers pendant les parties
 */

import { GameTransactionPipeline, GameTransactionContext, GameTransactionSummary } from '@/lib/transactions/GameTransactionPipeline';
import { GarameState } from '@/lib/game-engine/games/garame/GarameState';
import { GameEngine, GameEngineResult } from '@/lib/game-engine/core/GameEngine';
import { GameMove } from '@/lib/game-engine/core/GameRules';

export interface GameWithTransactions {
  gameId: string;
  roomId: string;
  gameEngine: GameEngine<GarameState>;
  transactionPipeline: GameTransactionPipeline;
  gameState: GarameState;
  isTransactionLocked: boolean;
  transactionSummary?: GameTransactionSummary;
}

export interface GameStartResult {
  success: boolean;
  game?: GameWithTransactions;
  error?: string;
  validationErrors?: string[];
}

export interface GameEndResult {
  success: boolean;
  finalState: GarameState;
  transactionSummary: GameTransactionSummary;
  error?: string;
}

export class TransactionIntegratedGameEngine {
  private activeGames: Map<string, GameWithTransactions> = new Map();

  /**
   * Démarrer une nouvelle partie avec validation financière
   */
  async startGame(
    gameId: string,
    roomId: string,
    gameType: string,
    betAmount: number,
    playerIds: string[],
    commission: number = 10
  ): Promise<GameStartResult> {
    try {
      // 1. Créer le contexte de transaction
      const transactionContext: GameTransactionContext = {
        gameId,
        roomId,
        gameType,
        betAmount,
        playerIds,
        totalPot: betAmount * playerIds.length,
        commission
      };

      // 2. Initialiser le pipeline de transactions
      const transactionPipeline = new GameTransactionPipeline(transactionContext);

      // 3. Valider et verrouiller les fonds
      const fundValidation = await transactionPipeline.validateAndLockFunds();
      if (!fundValidation.success) {
        return {
          success: false,
          error: 'Validation des fonds échouée',
          validationErrors: fundValidation.errors
        };
      }

      // 4. Initialiser le moteur de jeu
      const gameEngine = new GameEngine(new (await import('@/lib/game-engine/games/garame/GarameRules')).GarameRules());
      const initialGameState = gameEngine.initializeGame(playerIds.length, betAmount, playerIds);
      initialGameState.gameId = gameId;

      // 5. Créer l'objet de partie intégrée
      const game: GameWithTransactions = {
        gameId,
        roomId,
        gameEngine,
        transactionPipeline,
        gameState: initialGameState,
        isTransactionLocked: true
      };

      // 6. Enregistrer la partie active
      this.activeGames.set(gameId, game);

      return {
        success: true,
        game
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue lors du démarrage'
      };
    }
  }

  /**
   * Exécuter un mouvement dans une partie active
   */
  async executeMove(gameId: string, move: GameMove): Promise<GameEngineResult<GarameState>> {
    const game = this.activeGames.get(gameId);
    if (!game) {
      return {
        success: false,
        error: 'Partie introuvable',
        state: {} as GarameState
      };
    }

    try {
      // Exécuter le mouvement via le moteur de jeu
      const result = game.gameEngine.executeMove(game.gameState, move);
      
      if (result.success) {
        // Mettre à jour l'état de la partie
        game.gameState = result.state;

        // Vérifier si la partie est terminée
        if (result.isGameOver) {
          const endResult = await this.endGame(gameId);
          if (endResult.success) {
            result.state = endResult.finalState;
          }
        }
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'exécution du mouvement',
        state: game.gameState
      };
    }
  }

  /**
   * Terminer une partie et distribuer les gains
   */
  async endGame(gameId: string): Promise<GameEndResult> {
    const game = this.activeGames.get(gameId);
    if (!game) {
      return {
        success: false,
        finalState: {} as GarameState,
        transactionSummary: {} as GameTransactionSummary,
        error: 'Partie introuvable'
      };
    }

    try {
      // 1. Vérifier que la partie est bien terminée
      if (game.gameState.endedAt) {
        return {
          success: false,
          finalState: game.gameState,
          transactionSummary: {} as GameTransactionSummary,
          error: 'La partie n\'est pas terminée'
        };
      }

      // 2. Distribuer les gains selon l'état final
      const transactionSummary = await game.transactionPipeline.distributeWinnings(game.gameState);

      // 3. Marquer la partie comme non verrouillée
      game.isTransactionLocked = false;
      game.transactionSummary = transactionSummary;

      // 4. Nettoyer la partie active (optionnel - garder pour l'historique)
      // this.activeGames.delete(gameId);

      return {
        success: true,
        finalState: game.gameState,
        transactionSummary
      };

    } catch (error) {
      // En cas d'erreur, tenter de rembourser les joueurs
      try {
        await game.transactionPipeline.refundAndUnlock();
      } catch (refundError) {
        console.error('Erreur lors du remboursement:', refundError);
      }

      return {
        success: false,
        finalState: game.gameState,
        transactionSummary: {} as GameTransactionSummary,
        error: error instanceof Error ? error.message : 'Erreur lors de la finalisation'
      };
    }
  }

  /**
   * Annuler une partie et rembourser les joueurs
   */
  async cancelGame(gameId: string, reason: string = 'Partie annulée'): Promise<{ success: boolean; error?: string }> {
    const game = this.activeGames.get(gameId);
    if (!game) {
      return {
        success: false,
        error: 'Partie introuvable'
      };
    }

    try {
      // Rembourser tous les joueurs
      await game.transactionPipeline.refundAndUnlock();

      // Marquer comme non verrouillé
      game.isTransactionLocked = false;

      // Supprimer de la liste des parties actives
      this.activeGames.delete(gameId);

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'annulation'
      };
    }
  }

  /**
   * Obtenir l'état d'une partie active
   */
  getGame(gameId: string): GameWithTransactions | null {
    return this.activeGames.get(gameId) || null;
  }

  /**
   * Obtenir toutes les parties actives
   */
  getActiveGames(): GameWithTransactions[] {
    return Array.from(this.activeGames.values());
  }

  /**
   * Vérifier si une partie a des fonds verrouillés
   */
  hasLockedFunds(gameId: string): boolean {
    const game = this.activeGames.get(gameId);
    return game?.isTransactionLocked || false;
  }

  /**
   * Calculer les métriques financières d'une partie
   */
  getGameFinancialMetrics(gameId: string): {
    totalPot: number;
    commission: number;
    netDistribution: number;
    playersCount: number;
    betPerPlayer: number;
  } | null {
    const game = this.activeGames.get(gameId);
    if (!game) return null;

    const totalPot = game.gameState.pot;
    const commission = Math.round(totalPot * 0.1); // 10% de commission
    const netDistribution = totalPot - commission;
    const playersCount = Object.keys(game.gameState.players).length;
    const betPerPlayer = game.gameState.betAmount;

    return {
      totalPot,
      commission,
      netDistribution,
      playersCount,
      betPerPlayer
    };
  }

  /**
   * Nettoyer les parties inactives (à exécuter périodiquement)
   */
  async cleanupInactiveGames(maxInactiveHours: number = 24): Promise<{
    cleaned: number;
    refunded: number;
    errors: string[];
  }> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - maxInactiveHours * 60 * 60 * 1000);
    
    let cleaned = 0;
    let refunded = 0;
    const errors: string[] = [];

    for (const [gameId, game] of this.activeGames.entries()) {
      try {
        // Vérifier si la partie est inactive
        const gameAge = now.getTime() - (game.gameState.startedAt?.getTime() || 0);
        const isInactive = gameAge > maxInactiveHours * 60 * 60 * 1000;

        if (isInactive && game.isTransactionLocked) {
          // Rembourser les fonds verrouillés
          await game.transactionPipeline.refundAndUnlock();
          refunded++;
        }

        if (isInactive) {
          this.activeGames.delete(gameId);
          cleaned++;
        }

      } catch (error) {
        errors.push(`Erreur lors du nettoyage de la partie ${gameId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    return { cleaned, refunded, errors };
  }

  /**
   * Obtenir les statistiques des parties actives
   */
  getActiveGamesStats(): {
    totalGames: number;
    totalLockedFunds: number;
    totalPot: number;
    averageBet: number;
    gamesByType: Record<string, number>;
  } {
    const games = this.getActiveGames();
    
    const totalGames = games.length;
    let totalLockedFunds = 0;
    let totalPot = 0;
    let totalBets = 0;
    const gamesByType: Record<string, number> = {};

    for (const game of games) {
      if (game.isTransactionLocked) {
        totalLockedFunds += game.gameState.pot;
      }
      
      totalPot += game.gameState.pot;
      totalBets += game.gameState.betAmount;
      
      const gameType = game.gameState.gameType;
      gamesByType[gameType] = (gamesByType[gameType] || 0) + 1;
    }

    return {
      totalGames,
      totalLockedFunds,
      totalPot,
      averageBet: totalGames > 0 ? totalBets / totalGames : 0,
      gamesByType
    };
  }
}

// Instance singleton pour l'application
export const transactionIntegratedGameEngine = new TransactionIntegratedGameEngine();