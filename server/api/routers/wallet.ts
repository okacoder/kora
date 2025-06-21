import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const walletRouter = createTRPCRouter({
  // Obtenir le solde du wallet
  getBalance: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      // Récupérer ou créer le wallet
      let wallet = await ctx.db.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await ctx.db.wallet.create({
          data: { userId },
        });
      }

      return {
        koraBalance: wallet.koraBalance,
        lockedKoras: wallet.lockedKoras,
        totalDeposits: wallet.totalDeposits,
        totalWithdraws: wallet.totalWithdraws,
        userId,
      };
    }),

  // Obtenir l'historique des transactions
  getTransactions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      const [transactions, total] = await Promise.all([
        ctx.db.transaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.transaction.count({
          where: { userId },
        }),
      ]);

      return {
        transactions,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Effectuer un dépôt (simulation)
  deposit: protectedProcedure
    .input(z.object({
      amount: z.number().min(10),
      reference: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      // Récupérer le wallet actuel
      const wallet = await ctx.db.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Calculer les nouveaux Koras (1 FCFA = 0.1 Kora pour la simulation)
      const korasToAdd = Math.floor(input.amount * 0.1);
      const newBalance = wallet.koraBalance + korasToAdd;

      // Créer la transaction
      const transaction = await ctx.db.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount: input.amount,
          koras: korasToAdd,
          korasBefore: wallet.koraBalance,
          korasAfter: newBalance,
          description: `Dépôt Mobile Money${input.reference ? ` - Ref: ${input.reference}` : ''}`,
          reference: input.reference,
          status: 'COMPLETED',
        },
      });

      // Mettre à jour le wallet
      await ctx.db.wallet.update({
        where: { userId },
        data: {
          koraBalance: newBalance,
          totalDeposits: wallet.totalDeposits + input.amount,
        },
      });

      return {
        success: true,
        transactionId: transaction.id,
        newBalance,
        korasAdded: korasToAdd,
      };
    }),

  // Statistiques du wallet
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      
      const stats = await ctx.db.transaction.groupBy({
        by: ['type'],
        where: { userId },
        _sum: {
          koras: true,
          amount: true,
        },
        _count: true,
      });

      return stats.reduce((acc, stat) => {
        acc[stat.type] = {
          count: stat._count,
          totalKoras: stat._sum.koras || 0,
          totalAmount: stat._sum.amount || 0,
        };
        return acc;
      }, {} as Record<string, any>);
    }),
}); 