/**
 * Pipeline de transactions pour les jeux LaMap241
 * Gère la validation des mises, le verrouillage des fonds et la distribution des gains
 */

import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';
import { GarameState, GarameKora } from '@/lib/game-engine/games/garame/GarameState';

const prisma = new PrismaClient();

export interface GameTransactionContext {
  gameId: string;
  roomId: string;
  gameType: string;
  betAmount: number;
  playerIds: string[];
  totalPot: number;
  commission: number; // Pourcentage (ex: 10 pour 10%)
}

export interface VictoryReward {
  playerId: string;
  playerName: string;
  baseAmount: number;
  bonusAmount: number;
  koraMultiplier: number;
  totalAmount: number;
  victoryType: 'NORMAL' | 'KORA_SIMPLE' | 'KORA_DOUBLE' | 'KORA_TRIPLE' | 'GRAND_SLAM';
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
}

export interface GameTransactionSummary {
  gameId: string;
  totalPot: number;
  commission: number;
  commissionAmount: number;
  distributedAmount: number;
  winners: VictoryReward[];
  transactions: string[];
  timestamp: Date;
}

export class GameTransactionPipeline {
  private context: GameTransactionContext;
  private lockedFunds: Map<string, number> = new Map();

  constructor(context: GameTransactionContext) {
    this.context = context;
  }

  /**
   * 1. Validation et verrouillage des fonds avant le début du jeu
   */
  async validateAndLockFunds(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const playerId of this.context.playerIds) {
      try {
        // Vérifier le solde du joueur
        const user = await prisma.user.findUnique({
          where: { id: playerId },
          select: { id: true, name: true, koras: true }
        });

        if (!user) {
          errors.push(`Joueur ${playerId} introuvable`);
          continue;
        }

        if (user.koras < this.context.betAmount) {
          errors.push(`${user.name} n'a pas assez de Koras (${user.koras} < ${this.context.betAmount})`);
          continue;
        }

        // Verrouiller les fonds
        const lockResult = await this.lockPlayerFunds(playerId, this.context.betAmount);
        if (!lockResult.success) {
          errors.push(`Impossible de verrouiller les fonds pour ${user.name}: ${lockResult.error}`);
        }

      } catch (error) {
        errors.push(`Erreur lors de la validation pour ${playerId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * 2. Verrouillage des fonds d'un joueur
   */
  private async lockPlayerFunds(playerId: string, amount: number): Promise<TransactionResult> {
    try {
      // Transaction atomique pour verrouiller les fonds
      const result = await prisma.$transaction(async (tx) => {
        // Vérifier le solde actuel
        const user = await tx.user.findUnique({
          where: { id: playerId },
          select: { koras: true }
        });

        if (!user || user.koras < amount) {
          throw new Error('Solde insuffisant');
        }

        // Déduire le montant
        const updatedUser = await tx.user.update({
          where: { id: playerId },
          data: { koras: { decrement: amount } }
        });

        // Créer une transaction de mise
        const transaction = await tx.transaction.create({
          data: {
            userId: playerId,
            gameId: this.context.gameId,
            type: TransactionType.GAME_STAKE,
            amount: -amount, // Négatif car c'est une sortie
            status: TransactionStatus.PENDING,
            description: `Mise verrouillée pour la partie ${this.context.gameId}`,
          }
        });

        return {
          transactionId: transaction.id,
          newBalance: updatedUser.koras
        };
      });

      // Enregistrer le verrouillage local
      this.lockedFunds.set(playerId, amount);

      return {
        success: true,
        transactionId: result.transactionId,
        newBalance: result.newBalance
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de verrouillage'
      };
    }
  }

  /**
   * 3. Calcul et distribution des gains basés sur l'état final du jeu
   */
  async distributeWinnings(gameState: GarameState): Promise<GameTransactionSummary> {
    // Calculer les récompenses selon les règles Garame
    const rewards = this.calculateGameRewards(gameState);
    
    // Calculer la commission
    const totalDistributed = rewards.reduce((sum, reward) => sum + reward.totalAmount, 0);
    const commissionAmount = Math.round(this.context.totalPot * (this.context.commission / 100));
    const netDistribution = this.context.totalPot - commissionAmount;

    const transactionIds: string[] = [];

    try {
      // Distribution des gains en transaction atomique
      await prisma.$transaction(async (tx) => {
        for (const reward of rewards) {
          if (reward.totalAmount > 0) {
            // Distribuer les gains au gagnant
            const updatedUser = await tx.user.update({
              where: { id: reward.playerId },
              data: { koras: { increment: reward.totalAmount } }
            });

            // Créer la transaction de gain
            const winTransaction = await tx.transaction.create({
              data: {
                userId: reward.playerId,
                gameId: this.context.gameId,
                type: TransactionType.GAME_WIN,
                amount: reward.totalAmount,
                status: TransactionStatus.COMPLETED,
                description: `Gain ${reward.victoryType} - Partie ${this.context.gameId}`,
              }
            });

            transactionIds.push(winTransaction.id);
          }
        }

        // Marquer les transactions de mise comme complétées
        await tx.transaction.updateMany({
          where: {
            gameId: this.context.gameId,
            type: TransactionType.GAME_STAKE,
            status: TransactionStatus.PENDING
          },
          data: { status: TransactionStatus.COMPLETED }
        });

        // Créer la transaction de commission
        if (commissionAmount > 0) {
          const commissionTransaction = await tx.transaction.create({
            data: {
              userId: 'PLATFORM', // ID spécial pour la plateforme
              gameId: this.context.gameId,
              type: TransactionType.COMMISSION,
              amount: commissionAmount,
              status: TransactionStatus.COMPLETED,
              description: `Commission ${this.context.commission}% - Partie ${this.context.gameId}`,
            }
          });

          transactionIds.push(commissionTransaction.id);
        }
      });

      return {
        gameId: this.context.gameId,
        totalPot: this.context.totalPot,
        commission: this.context.commission,
        commissionAmount,
        distributedAmount: totalDistributed,
        winners: rewards,
        transactions: transactionIds,
        timestamp: new Date()
      };

    } catch (error) {
      throw new Error(`Erreur lors de la distribution des gains: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * 4. Calcul des récompenses selon les règles Garame
   */
  private calculateGameRewards(gameState: GarameState): VictoryReward[] {
    const rewards: VictoryReward[] = [];

    // Vérifier les Koras détectées (victoires spéciales)
    for (const kora of gameState.korasDetected) {
      const koraReward = this.calculateKoraReward(kora);
      rewards.push(koraReward);
    }

    // Si pas de Kora, distribuer selon les gagnants normaux
    if (rewards.length === 0 && gameState.winners && gameState.winners.length > 0) {
      const normalRewards = this.calculateNormalRewards(gameState);
      rewards.push(...normalRewards);
    }

    return rewards;
  }

  /**
   * Calcul des gains pour les victoires Kora
   */
  private calculateKoraReward(kora: GarameKora): VictoryReward {
    const baseAmount = Math.round(this.context.totalPot * 0.9); // 90% après commission
    const bonusAmount = Math.round(baseAmount * kora.multiplier);
    const totalAmount = baseAmount + bonusAmount;

    return {
      playerId: kora.playerId,
      playerName: kora.playerName,
      baseAmount,
      bonusAmount,
      koraMultiplier: kora.multiplier,
      totalAmount,
      victoryType: `KORA_${kora.type}` as any
    };
  }

  /**
   * Calcul des gains pour les victoires normales
   */
  private calculateNormalRewards(gameState: GarameState): VictoryReward[] {
    const winners = gameState.winners || [];
    if (winners.length === 0) return [];

    const totalAmount = Math.round(this.context.totalPot * 0.9); // 90% après commission
    const amountPerWinner = Math.round(totalAmount / winners.length);

    return winners.map(playerId => ({
      playerId,
      playerName: gameState.players[playerId]?.name || 'Joueur',
      baseAmount: amountPerWinner,
      bonusAmount: 0,
      koraMultiplier: 1,
      totalAmount: amountPerWinner,
      victoryType: 'NORMAL' as const
    }));
  }

  /**
   * 5. Annulation et remboursement en cas d'erreur
   */
  async refundAndUnlock(): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        for (const [playerId, amount] of this.lockedFunds.entries()) {
          // Rembourser le joueur
          await tx.user.update({
            where: { id: playerId },
            data: { koras: { increment: amount } }
          });

          // Marquer la transaction comme annulée
          await tx.transaction.updateMany({
            where: {
              userId: playerId,
              gameId: this.context.gameId,
              type: TransactionType.GAME_STAKE,
              status: TransactionStatus.PENDING
            },
            data: { 
              status: TransactionStatus.CANCELLED,
              description: `Mise remboursée - Partie annulée ${this.context.gameId}`
            }
          });
        }
      });

      // Nettoyer les fonds verrouillés
      this.lockedFunds.clear();

    } catch (error) {
      throw new Error(`Erreur lors du remboursement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtenir le résumé des transactions pour une partie
   */
  static async getGameTransactionSummary(gameId: string): Promise<any> {
    return await prisma.transaction.findMany({
      where: { gameId },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}