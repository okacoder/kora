import { transaction, TransactionType, TransactionStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

class TransactionService {
  private static instance: TransactionService;

  private constructor() {}

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  async getUserTransactions(
    userId: string,
    limit: number = 10,
    type?: TransactionType,
  ): Promise<transaction[]> {
    return await prisma.transaction.findMany({
      where: {
        userId,
        ...(type && { type }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getTransactionById(id: string): Promise<transaction | null> {
    return await prisma.transaction.findUnique({
      where: { id },
    });
  }

  async getTransactionStats(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
    });

    const stats = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalWins: 0,
      totalStakes: 0,
      netProfit: 0,
    };

    transactions.forEach((tx) => {
      switch (tx.type) {
        case 'DEPOSIT':
          stats.totalDeposits += tx.koras || 0;
          break;
        case 'WITHDRAWAL':
          stats.totalWithdrawals += tx.koras || 0;
          break;
        case 'GAME_WIN':
          stats.totalWins += tx.koras || 0;
          break;
        case 'GAME_STAKE':
          stats.totalStakes += tx.koras || 0;
          break;
      }
    });

    stats.netProfit = stats.totalWins - stats.totalStakes;

    return stats;
  }
}

export const transactionService = TransactionService.getInstance(); 