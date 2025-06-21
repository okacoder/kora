import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const lobbyRouter = createTRPCRouter({
  // Obtenir les salles de jeu actives
  getRooms: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: Implémenter la récupération des salles
      return [];
    }),

  // Créer une nouvelle salle
  createRoom: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      maxPlayers: z.number().min(2).max(5),
      betAmount: z.number().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implémenter la création de salle
      return {
        id: 'temp-room-id',
        message: 'Room creation will be implemented',
        input,
      };
    }),
}); 