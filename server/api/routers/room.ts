/**
 * Router tRPC pour la gestion des salles de jeu
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { GameType, GameRoomStatus } from '@prisma/client';

const createRoomSchema = z.object({
  gameType: z.nativeEnum(GameType),
  betAmount: z.number().min(100).max(100000),
  maxPlayers: z.number().min(2).max(5),
  isPrivate: z.boolean().default(false),
  turnDuration: z.number().min(30).max(300).default(60),
  invitedPlayers: z.array(z.string()).default([])
});

const joinRoomSchema = z.object({
  roomId: z.string(),
  code: z.string().optional()
});

const updateRoomSchema = z.object({
  roomId: z.string(),
  isReady: z.boolean()
});

export const roomRouter = createTRPCRouter({
  /**
   * Créer une nouvelle salle de jeu
   */
  create: protectedProcedure
    .input(createRoomSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Vérifier le solde de l'utilisateur
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { koras: true, name: true }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur introuvable'
        });
      }

      if (user.koras < input.betAmount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Solde insuffisant pour cette mise'
        });
      }

      // Générer un code de salle unique
      const generateRoomCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      };

      let roomCode = generateRoomCode();
      
      // S'assurer que le code est unique
      while (await ctx.db.gameRoom.findFirst({ where: { code: roomCode } })) {
        roomCode = generateRoomCode();
      }

      // Créer la salle
      const room = await ctx.db.gameRoom.create({
        data: {
          gameType: input.gameType,
          stake: input.betAmount,
          creatorId: userId,
          creatorName: user.name,
          status: GameRoomStatus.WAITING,
          maxPlayers: input.maxPlayers,
          minPlayers: 2,
          totalPot: 0,
          code: roomCode,
          settings: {
            turnDuration: input.turnDuration,
            isPrivate: input.isPrivate,
            commission: 10
          }
        }
      });

      // Ajouter le créateur comme premier joueur
      await ctx.db.roomPlayer.create({
        data: {
          gameRoomId: room.id,
          userId: userId,
          name: user.name,
          position: 0,
          isReady: false,
          isAI: false
        }
      });

      return {
        id: room.id,
        code: room.code || '',
        gameType: room.gameType,
        status: room.status,
        betAmount: room.stake,
        maxPlayers: room.maxPlayers,
        hostName: room.creatorName,
        isPrivate: input.isPrivate
      };
    }),

  /**
   * Rejoindre une salle existante
   */
  join: protectedProcedure
    .input(joinRoomSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Trouver la salle par ID ou code
      const room = await ctx.db.gameRoom.findFirst({
        where: {
          OR: [
            { id: input.roomId },
            { code: input.code }
          ]
        },
        include: {
          players: {
            include: { user: true }
          }
        }
      });

      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Salle introuvable'
        });
      }

      if (room.status !== GameRoomStatus.WAITING) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cette salle n\'accepte plus de nouveaux joueurs'
        });
      }

      if (room.players.length >= room.maxPlayers) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cette salle est pleine'
        });
      }

      // Vérifier si le joueur n'est pas déjà dans la salle
      const existingPlayer = room.players.find((p: any) => p.userId === userId);
      if (existingPlayer) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Vous êtes déjà dans cette salle'
        });
      }

      // Vérifier le solde
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { koras: true, name: true }
      });

      if (!user || user.koras < room.stake) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Solde insuffisant pour rejoindre cette salle'
        });
      }

      // Ajouter le joueur à la salle
      await ctx.db.roomPlayer.create({
        data: {
          gameRoomId: room.id,
          userId: userId,
          name: user.name,
          position: room.players.length,
          isReady: false,
          isAI: false
        }
      });

      return {
        success: true,
        roomId: room.id
      };
    }),

  /**
   * Mettre à jour le statut de préparation du joueur
   */
  updateReady: protectedProcedure
    .input(updateRoomSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Trouver le joueur dans la salle
      const player = await ctx.db.roomPlayer.findFirst({
        where: {
          gameRoomId: input.roomId,
          userId: userId
        }
      });

      if (!player) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vous n\'êtes pas dans cette salle'
        });
      }

      // Mettre à jour le statut
      await ctx.db.roomPlayer.update({
        where: { id: player.id },
        data: { isReady: input.isReady }
      });

      // Vérifier si tous les joueurs sont prêts pour démarrer automatiquement
      const room = await ctx.db.gameRoom.findUnique({
        where: { id: input.roomId },
        include: { players: true }
      });

      if (room && room.players.length >= room.minPlayers) {
        const allReady = room.players.every(p => p.isReady || p.isAI);
        
        if (allReady) {
          // Démarrer la partie automatiquement
          await ctx.db.gameRoom.update({
            where: { id: input.roomId },
            data: { status: GameRoomStatus.IN_PROGRESS }
          });
        }
      }

      return { success: true };
    }),

  /**
   * Obtenir les détails d'une salle
   */
  get: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.db.gameRoom.findUnique({
        where: { id: input.roomId },
        include: {
          players: {
            include: { user: { select: { name: true, image: true } } }
          },
          creator: { select: { name: true } }
        }
      });

      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Salle introuvable'
        });
      }

      return {
        id: room.id,
        code: room.code || '',
        gameType: room.gameType,
        status: room.status,
        betAmount: room.stake,
        maxPlayers: room.maxPlayers,
        minPlayers: room.minPlayers,
        hostId: room.creatorId,
        hostName: room.creatorName,
        isPrivate: (room.settings as any)?.isPrivate || false,
        settings: room.settings,
        players: room.players.map((p: any) => ({
          id: p.id,
          userId: p.userId,
          name: p.name,
          avatar: p.user?.image,
          position: p.position,
          isReady: p.isReady,
          isAI: p.isAI,
          aiDifficulty: p.aiDifficulty,
          joinedAt: p.joinedAt,
          status: 'online' as const
        }))
      };
    }),

  /**
   * Lister les salles publiques disponibles
   */
  list: protectedProcedure
    .input(z.object({
      gameType: z.nativeEnum(GameType).optional(),
      status: z.nativeEnum(GameRoomStatus).optional()
    }))
    .query(async ({ ctx, input }) => {
      const rooms = await ctx.db.gameRoom.findMany({
        where: {
          status: input.status || GameRoomStatus.WAITING,
          gameType: input.gameType,
          // Seulement les salles publiques
          settings: {
            path: ['isPrivate'],
            equals: false
          }
        },
        include: {
          players: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      return rooms.map((room: any) => ({
        id: room.id,
        gameType: room.gameType,
        betAmount: room.stake,
        currentPlayers: room.players.length,
        maxPlayers: room.maxPlayers,
        hostName: room.creatorName,
        createdAt: room.createdAt
      }));
    }),

  /**
   * Quitter une salle
   */
  leave: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const player = await ctx.db.roomPlayer.findFirst({
        where: {
          gameRoomId: input.roomId,
          userId: userId
        }
      });

      if (!player) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vous n\'êtes pas dans cette salle'
        });
      }

      // Supprimer le joueur
      await ctx.db.roomPlayer.delete({
        where: { id: player.id }
      });

      // Vérifier si la salle est vide
      const remainingPlayers = await ctx.db.roomPlayer.count({
        where: { gameRoomId: input.roomId }
      });

      if (remainingPlayers === 0) {
        // Supprimer la salle si elle est vide
        await ctx.db.gameRoom.delete({
          where: { id: input.roomId }
        });
      } else {
        // Si c'était l'hôte, transférer à quelqu'un d'autre
        const room = await ctx.db.gameRoom.findUnique({
          where: { id: input.roomId },
          include: { players: { include: { user: true } } }
        });

        if (room && room.creatorId === userId && room.players.length > 0) {
          const newHost = room.players[0];
          await ctx.db.gameRoom.update({
            where: { id: input.roomId },
            data: {
              creatorId: newHost.userId!,
              creatorName: newHost.user?.name || newHost.name
            }
          });
        }
      }

      return { success: true };
    })
});