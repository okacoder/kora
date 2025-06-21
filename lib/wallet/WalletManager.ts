/**
 * Gestionnaire de portefeuille Koras pour LaMap241
 * Gère les dépôts, retraits, et l'historique des transactions
 */

import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface DepositRequest {
  userId: string;
  amount: number;
  paymentMethod: 'MOBILE_MONEY' | 'BANK_CARD' | 'BANK_TRANSFER';
  paymentReference?: string;
  phoneNumber?: string;
}

export interface WithdrawalRequest {
  userId: string;
  amount: number;
  paymentMethod: 'MOBILE_MONEY' | 'BANK_TRANSFER';
  accountDetails: {
    phoneNumber?: string;
    bankAccount?: string;
    accountName: string;
  };
}

export interface TransactionHistoryFilter {
  userId: string;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface WalletBalance {
  userId: string;
  userName: string;
  totalKoras: number;
  availableKoras: number;
  lockedKoras: number;
  lastTransactionDate?: Date;
}

export interface WalletStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalWinnings: number;
  totalLosses: number;
  netBalance: number;
  gamesPlayed: number;
  commissionsEarned: number; // Pour la plateforme
}

export class WalletManager {
  
  /**
   * Obtenir le solde détaillé d'un portefeuille
   */
  static async getWalletBalance(userId: string): Promise<WalletBalance> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        koras: true,
        transactions: {
          where: { status: TransactionStatus.PENDING },
          select: { amount: true }
        }
      }
    });

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    // Calculer les Koras verrouillées (paris en cours)
    const lockedKoras = user.transactions
      .filter(t => t.amount && t.amount < 0) // Seulement les débits verrouillés
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    const lastTransaction = await prisma.transaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    return {
      userId: user.id,
      userName: user.name,
      totalKoras: user.koras,
      availableKoras: user.koras - lockedKoras,
      lockedKoras,
      lastTransactionDate: lastTransaction?.createdAt
    };
  }

  /**
   * Traiter un dépôt de Koras
   */
  static async processDeposit(request: DepositRequest): Promise<{
    success: boolean;
    transactionId?: string;
    newBalance?: number;
    error?: string;
  }> {
    try {
      // Validation
      if (request.amount <= 0) {
        return { success: false, error: 'Le montant doit être positif' };
      }

      if (request.amount > 1000000) { // Limite de dépôt
        return { success: false, error: 'Montant de dépôt trop élevé (max: 1,000,000 Koras)' };
      }

      // Simuler la validation du paiement (intégration avec Mobile Money/banque)
      const paymentValidation = await this.validatePayment(request);
      if (!paymentValidation.success) {
        return { success: false, error: paymentValidation.error };
      }

      // Transaction atomique
      const result = await prisma.$transaction(async (tx) => {
        // Mettre à jour le solde
        const updatedUser = await tx.user.update({
          where: { id: request.userId },
          data: { koras: { increment: request.amount } }
        });

        // Créer la transaction
        const transaction = await tx.transaction.create({
          data: {
            userId: request.userId,
            type: TransactionType.DEPOSIT,
            amount: request.amount,
            status: TransactionStatus.COMPLETED,
            description: `Dépôt ${request.paymentMethod}`,
          }
        });

        return {
          transactionId: transaction.id,
          newBalance: updatedUser.koras
        };
      });

      return {
        success: true,
        transactionId: result.transactionId,
        newBalance: result.newBalance
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du dépôt'
      };
    }
  }

  /**
   * Traiter un retrait de Koras
   */
  static async processWithdrawal(request: WithdrawalRequest): Promise<{
    success: boolean;
    transactionId?: string;
    newBalance?: number;
    error?: string;
  }> {
    try {
      // Validation
      if (request.amount <= 0) {
        return { success: false, error: 'Le montant doit être positif' };
      }

      if (request.amount < 1000) { // Minimum de retrait
        return { success: false, error: 'Montant minimum de retrait: 1,000 Koras' };
      }

      // Vérifier le solde disponible
      const balance = await this.getWalletBalance(request.userId);
      if (balance.availableKoras < request.amount) {
        return { 
          success: false, 
          error: `Solde insuffisant (disponible: ${balance.availableKoras} Koras)` 
        };
      }

      // Transaction atomique
      const result = await prisma.$transaction(async (tx) => {
        // Déduire le montant
        const updatedUser = await tx.user.update({
          where: { id: request.userId },
          data: { koras: { decrement: request.amount } }
        });

        // Créer la transaction
        const transaction = await tx.transaction.create({
          data: {
            userId: request.userId,
            type: TransactionType.WITHDRAWAL,
            amount: -request.amount, // Négatif pour les retraits
            status: TransactionStatus.PENDING, // En attente de traitement
            description: `Retrait ${request.paymentMethod}`,
          }
        });

        return {
          transactionId: transaction.id,
          newBalance: updatedUser.koras
        };
      });

      // Déclencher le traitement du paiement (intégration externe)
      await this.processWithdrawalPayment(result.transactionId, request);

      return {
        success: true,
        transactionId: result.transactionId,
        newBalance: result.newBalance
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du retrait'
      };
    }
  }

  /**
   * Obtenir l'historique des transactions
   */
  static async getTransactionHistory(filter: TransactionHistoryFilter) {
    const where: any = { userId: filter.userId };

    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter.limit || 50,
        skip: filter.offset || 0,
        include: {
          user: {
            select: { name: true }
          }
        }
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transactions,
      total,
      page: Math.floor((filter.offset || 0) / (filter.limit || 50)) + 1,
      totalPages: Math.ceil(total / (filter.limit || 50))
    };
  }

  /**
   * Calculer les statistiques du portefeuille
   */
  static async getWalletStats(userId: string): Promise<WalletStats> {
    const stats = await prisma.transaction.groupBy({
      by: ['type'],
      where: { 
        userId,
        status: TransactionStatus.COMPLETED
      },
      _sum: { amount: true },
      _count: true
    });

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalWinnings = 0;
    let totalLosses = 0;

    for (const stat of stats) {
      const amount = stat._sum.amount || 0;
      
      switch (stat.type) {
        case TransactionType.DEPOSIT:
          totalDeposits = amount;
          break;
        case TransactionType.WITHDRAWAL:
          totalWithdrawals = Math.abs(amount);
          break;
        case TransactionType.GAME_WIN:
          totalWinnings = amount;
          break;
        case TransactionType.GAME_STAKE:
          totalLosses += Math.abs(amount);
          break;
      }
    }

    // Compter les parties jouées
    const gamesPlayed = await prisma.transaction.groupBy({
      by: ['gameId'],
      where: {
        userId,
        type: TransactionType.GAME_STAKE,
        gameId: { not: null }
      },
      _count: true
    });

    return {
      totalDeposits,
      totalWithdrawals,
      totalWinnings,
      totalLosses,
      netBalance: totalDeposits + totalWinnings - totalWithdrawals - totalLosses,
      gamesPlayed: gamesPlayed.length,
      commissionsEarned: 0 // Sera calculé pour les admins
    };
  }

  /**
   * Validation fictive du paiement (à remplacer par l'intégration réelle)
   */
  private static async validatePayment(request: DepositRequest): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Simulation d'une validation de paiement
    // En réalité, ici on ferait appel à l'API Mobile Money/banque
    
    if (request.paymentMethod === 'MOBILE_MONEY' && !request.phoneNumber) {
      return { success: false, error: 'Numéro de téléphone requis pour Mobile Money' };
    }

    // Simuler un délai de validation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simuler un taux de succès de 95%
    if (Math.random() < 0.95) {
      return { success: true };
    } else {
      return { success: false, error: 'Échec de la validation du paiement' };
    }
  }

  /**
   * Traitement fictif du retrait (à remplacer par l'intégration réelle)
   */
  private static async processWithdrawalPayment(transactionId: string, request: WithdrawalRequest): Promise<void> {
    // Simuler le traitement asynchrone du retrait
    setTimeout(async () => {
      try {
        // Simuler un taux de succès de 90%
        const success = Math.random() < 0.9;
        
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: success ? TransactionStatus.COMPLETED : TransactionStatus.FAILED,
            description: success 
              ? `Retrait ${request.paymentMethod} - Traité`
              : `Retrait ${request.paymentMethod} - Échec`
          }
        });

        // Si échec, rembourser l'utilisateur
        if (!success) {
          await prisma.user.update({
            where: { id: request.userId },
            data: { koras: { increment: request.amount } }
          });
        }

      } catch (error) {
        console.error('Erreur lors du traitement du retrait:', error);
      }
    }, 5000); // Traitement dans 5 secondes
  }

  /**
   * Obtenir les statistiques globales de la plateforme (admin only)
   */
  static async getPlatformStats(): Promise<{
    totalUsers: number;
    totalKorasInCirculation: number;
    totalCommissionsEarned: number;
    totalGamesPlayed: number;
    totalVolume: number;
  }> {
    const [
      totalUsers,
      korasStats,
      commissionStats,
      gamesStats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.aggregate({ _sum: { koras: true } }),
      prisma.transaction.aggregate({
        where: { type: TransactionType.COMMISSION },
        _sum: { amount: true }
      }),
      prisma.transaction.groupBy({
        by: ['gameId'],
        where: {
          type: TransactionType.GAME_STAKE,
          gameId: { not: null }
        }
      })
    ]);

    const totalVolume = await prisma.transaction.aggregate({
      where: {
        type: { in: [TransactionType.GAME_STAKE, TransactionType.DEPOSIT] },
        status: TransactionStatus.COMPLETED
      },
      _sum: { amount: true }
    });

    return {
      totalUsers,
      totalKorasInCirculation: korasStats._sum.koras || 0,
      totalCommissionsEarned: commissionStats._sum.amount || 0,
      totalGamesPlayed: gamesStats.length,
      totalVolume: Math.abs(totalVolume._sum.amount || 0)
    };
  }
}