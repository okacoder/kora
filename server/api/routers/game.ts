import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const gameRouter = createTRPCRouter({
  // Créer une nouvelle partie
  create: protectedProcedure
    .input(z.object({
      gameType: z.enum(['GARAME']),
      betAmount: z.number().min(10),
      maxPlayers: z.number().min(2).max(5),
      aiLevel: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implémenter la logique de création de partie
      return {
        id: 'temp-game-id',
        message: 'Game creation will be implemented',
        input,
      };
    }),

  // Obtenir les parties disponibles
  getAvailable: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: Implémenter la récupération des parties disponibles
      return [];
    }),

  // Rejoindre une partie
  join: protectedProcedure
    .input(z.object({
      gameId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implémenter la logique pour rejoindre une partie
      return { success: true, gameId: input.gameId };
    }),
}); 