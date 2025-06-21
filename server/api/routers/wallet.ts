import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const walletRouter = createTRPCRouter({
  // Obtenir le solde du wallet
  getBalance: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: Implémenter la récupération du solde
      return {
        koraBalance: 0,
        userId: ctx.session.user.id,
      };
    }),

  // Obtenir l'historique des transactions
  getTransactions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // TODO: Implémenter la récupération des transactions
      return {
        transactions: [],
        total: 0,
      };
    }),

  // Effectuer un dépôt
  deposit: protectedProcedure
    .input(z.object({
      amount: z.number().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implémenter la logique de dépôt
      return {
        success: true,
        newBalance: input.amount,
        transactionId: 'temp-transaction-id',
      };
    }),
}); 