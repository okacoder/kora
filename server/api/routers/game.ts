import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { GameEngine } from '@/lib/game-engine/core/GameEngine';
import { GarameRules } from '@/lib/game-engine/games/garame/GarameRules';
import { GarameState } from '@/lib/game-engine/games/garame/GarameState';
import { GameType, GameRoomStatus, AIDifficulty, MoveType, TransactionType, GameStateStatus } from '@prisma/client';

export const gameRouter = createTRPCRouter({
  // Créer une nouvelle partie
  create: protectedProcedure
    .input(z.object({
      gameType: z.enum(['garame']),
      betAmount: z.number().min(10).max(1000),
      maxPlayers: z.number().min(2).max(5),
      aiLevel: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Vérifier le solde du joueur
      const wallet = await ctx.db.wallet.findUnique({
        where: { userId: ctx.session.user.id },
      });
      
      if (!wallet || wallet.koraBalance < input.betAmount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Solde insuffisant pour créer cette partie',
        });
      }

      // Créer l'état initial seulement pour les parties IA
      let initialState = null;
      if (input.aiLevel) {
        const gameEngine = new GameEngine(new GarameRules());
        const playerIds = [ctx.session.user.id, `ai_${input.aiLevel.toLowerCase()}`];
        initialState = gameEngine.initializeGame(playerIds.length, input.betAmount, playerIds);
      }

      // Créer la salle de jeu
      const gameRoom = await ctx.db.gameRoom.create({
        data: {
          gameType: input.gameType as GameType,
          stake: input.betAmount,
          creatorId: ctx.session.user.id,
          creatorName: ctx.session.user.name || 'Joueur',
          status: input.aiLevel ? GameRoomStatus.IN_PROGRESS : GameRoomStatus.WAITING,
          maxPlayers: input.maxPlayers,
          minPlayers: 2,
          totalPot: input.aiLevel ? input.betAmount * 2 : input.betAmount,
          players: {
            create: input.aiLevel ? [
              {
                name: ctx.session.user.name || 'Joueur',
                position: 0,
                userId: ctx.session.user.id,
                isReady: true,
              },
              {
                name: `IA ${input.aiLevel}`,
                position: 1,
                isAI: true,
                aiDifficulty: input.aiLevel,
                isReady: true,
              }
            ] : {
              name: ctx.session.user.name || 'Joueur',
              position: 0,
              userId: ctx.session.user.id,
              isReady: true,
            },
          },
        },
        include: {
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      // Créer l'état de jeu si c'est une partie IA
      if (input.aiLevel && initialState) {
        await ctx.db.gameState.create({
          data: {
            gameType: input.gameType as GameType,
            currentPlayerId: ctx.session.user.id,
            players: initialState as any,
            pot: input.betAmount * 2, // Joueur + IA
            status: GameStateStatus.PLAYING,
            turn: 1,
            roomId: gameRoom.id,
            metadata: {
              aiLevel: input.aiLevel,
              maxRounds: 5,
              currentRound: 1,
            },
          },
        });
      }

      // Débiter le montant de la mise
      await ctx.db.wallet.update({
        where: { userId: ctx.session.user.id },
        data: { koraBalance: { decrement: input.betAmount } },
      });

      // Créer la transaction
      await ctx.db.transaction.create({
        data: {
          userId: ctx.session.user.id,
          type: TransactionType.GAME_STAKE,
          koras: input.betAmount,
          korasBefore: wallet.koraBalance,
          korasAfter: wallet.koraBalance - input.betAmount,
          description: `Mise pour partie ${input.gameType}`,
          gameId: gameRoom.id,
        },
      });

      return {
        id: gameRoom.id,
        gameState: initialState,
        players: gameRoom.players,
        status: gameRoom.status,
        betAmount: gameRoom.stake,
      };
    }),

  // Obtenir les parties disponibles
  getAvailable: protectedProcedure
    .input(z.object({
      gameType: z.enum(['garame']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const gameRooms = await ctx.db.gameRoom.findMany({
        where: {
          status: GameRoomStatus.WAITING,
          gameType: input?.gameType,
          players: {
            none: {
              isAI: true, // Exclure les parties IA
            },
          },
        },
        include: {
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return gameRooms.map(room => ({
        id: room.id,
        type: room.gameType,
        betAmount: room.stake,
        maxPlayers: room.maxPlayers,
        currentPlayers: room.players.length,
        players: room.players,
        createdAt: room.createdAt,
      }));
    }),

  // Rejoindre une partie
  join: protectedProcedure
    .input(z.object({
      gameId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const gameRoom = await ctx.db.gameRoom.findUnique({
        where: { id: input.gameId },
        include: { 
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      if (!gameRoom) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Partie non trouvée',
        });
      }

      if (gameRoom.status !== GameRoomStatus.WAITING) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cette partie n\'est plus disponible',
        });
      }

      if (gameRoom.players.length >= gameRoom.maxPlayers) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Partie complète',
        });
      }

      // Vérifier que le joueur n'est pas déjà dans la partie
      const existingPlayer = gameRoom.players.find(p => p.userId === ctx.session.user.id);
      if (existingPlayer) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Vous êtes déjà dans cette partie',
        });
      }

      // Vérifier le solde
      const wallet = await ctx.db.wallet.findUnique({
        where: { userId: ctx.session.user.id },
      });
      
      if (!wallet || wallet.koraBalance < gameRoom.stake) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Solde insuffisant',
        });
      }

      // Ajouter le joueur
      await ctx.db.roomPlayer.create({
        data: {
          gameRoomId: input.gameId,
          userId: ctx.session.user.id,
          name: ctx.session.user.name || 'Joueur',
          position: gameRoom.players.length,
          isReady: true,
        },
      });

      // Débiter le montant de la mise
      await ctx.db.wallet.update({
        where: { userId: ctx.session.user.id },
        data: { koraBalance: { decrement: gameRoom.stake } },
      });

      // Créer la transaction
      await ctx.db.transaction.create({
        data: {
          userId: ctx.session.user.id,
          type: TransactionType.GAME_STAKE,
          koras: gameRoom.stake,
          korasBefore: wallet.koraBalance,
          korasAfter: wallet.koraBalance - gameRoom.stake,
          description: `Mise pour rejoindre partie ${gameRoom.gameType}`,
          gameId: gameRoom.id,
        },
      });

      // Démarrer la partie si elle est complète
      if (gameRoom.players.length + 1 === gameRoom.maxPlayers) {
        const gameEngine = new GameEngine(new GarameRules());
        const allPlayerIds = [...gameRoom.players.map(p => p.userId!), ctx.session.user.id];
        const initialState = gameEngine.initializeGame(allPlayerIds.length, gameRoom.stake, allPlayerIds);
        
        // Mettre à jour le statut de la salle
        await ctx.db.gameRoom.update({
          where: { id: input.gameId },
          data: {
            status: GameRoomStatus.IN_PROGRESS,
            totalPot: gameRoom.stake * (gameRoom.players.length + 1),
          },
        });

        // Créer l'état de jeu
        await ctx.db.gameState.create({
          data: {
            gameType: gameRoom.gameType,
            currentPlayerId: allPlayerIds[0],
            players: initialState as any,
            pot: gameRoom.stake * (gameRoom.players.length + 1),
            status: GameStateStatus.PLAYING,
            turn: 1,
            roomId: gameRoom.id,
            metadata: {
              maxRounds: 5,
              currentRound: 1,
            },
          },
        });

        return { 
          success: true, 
          gameStarted: true,
          gameState: initialState,
        };
      }

      return { success: true, gameStarted: false };
    }),

  // Obtenir l'état d'une partie
  getGameState: protectedProcedure
    .input(z.object({
      gameId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const gameRoom = await ctx.db.gameRoom.findUnique({
        where: { id: input.gameId },
        include: {
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
          gameState: true,
        },
      });

      if (!gameRoom) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Partie non trouvée',
        });
      }

      // Vérifier que l'utilisateur fait partie de la partie
      const isPlayer = gameRoom.players.some(p => p.userId === ctx.session.user.id);
      if (!isPlayer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous n\'êtes pas autorisé à voir cette partie',
        });
      }

      return {
        id: gameRoom.id,
        status: gameRoom.status,
        gameState: gameRoom.gameState?.players as unknown as GarameState,
        players: gameRoom.players,
        betAmount: gameRoom.stake,
        totalPot: gameRoom.totalPot,
        createdAt: gameRoom.createdAt,
        currentPlayerId: gameRoom.gameState?.currentPlayerId,
        turn: gameRoom.gameState?.turn,
      };
    }),

  // Jouer une carte
  playCard: protectedProcedure
    .input(z.object({
      gameId: z.string(),
      cardId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const gameRoom = await ctx.db.gameRoom.findUnique({
        where: { id: input.gameId },
        include: { 
          players: true,
          gameState: true,
        },
      });

      if (!gameRoom || gameRoom.status !== GameRoomStatus.IN_PROGRESS || !gameRoom.gameState) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Partie non active',
        });
      }

      // Vérifier que c'est au tour du joueur
      if (gameRoom.gameState.currentPlayerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ce n\'est pas votre tour',
        });
      }

      // Valider et appliquer le mouvement
      const gameEngine = new GameEngine(new GarameRules());
      const gameState = gameRoom.gameState.players as unknown as GarameState;
      const move = {
        type: 'PLAY_CARD' as const,
        playerId: ctx.session.user.id,
        cardId: input.cardId,
        timestamp: new Date(),
      };

      const result = gameEngine.executeMove(gameState, move);
      
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error || 'Mouvement invalide',
        });
      }

      const newState = result.state;

              // Sauvegarder l'état
        await ctx.db.gameState.update({
          where: { id: gameRoom.gameState.id },
          data: { 
            players: newState as any,
            turn: { increment: 1 },
            currentPlayerId: newState.currentPlayerId || ctx.session.user.id,
          },
        });

      // Enregistrer le mouvement
      await ctx.db.gameMove.create({
        data: {
          gameId: input.gameId,
          playerId: ctx.session.user.id,
          playerName: ctx.session.user.name || 'Joueur',
          moveType: MoveType.PLAY_CARD,
          moveNumber: gameRoom.gameState.turn + 1,
          moveData: { cardId: input.cardId },
        },
      });

              // Vérifier si la partie est terminée
        if (result.isGameOver) {
          const winnerId = result.winners?.[0];
        
        await ctx.db.gameRoom.update({
          where: { id: input.gameId },
          data: {
            status: GameRoomStatus.COMPLETED,
          },
        });

        await ctx.db.gameState.update({
          where: { id: gameRoom.gameState.id },
          data: {
            status: GameStateStatus.FINISHED,
            winnerId,
            endedAt: new Date(),
          },
        });

        // Distribuer les gains
        if (winnerId) {
          const winner = gameRoom.players.find(p => p.userId === winnerId);
          if (winner) {
            const totalPot = gameRoom.totalPot;
            const commission = Math.floor(totalPot * 0.1); // 10% de commission
            const winnings = totalPot - commission;

            // Créditer le gagnant
            const winnerWallet = await ctx.db.wallet.findUnique({
              where: { userId: winnerId },
            });

            if (winnerWallet) {
              await ctx.db.wallet.update({
                where: { userId: winnerId },
                data: { koraBalance: { increment: winnings } },
              });

              // Créer la transaction de gain
              await ctx.db.transaction.create({
                data: {
                  userId: winnerId,
                  type: TransactionType.GAME_WIN,
                  koras: winnings,
                  korasBefore: winnerWallet.koraBalance,
                  korasAfter: winnerWallet.koraBalance + winnings,
                  description: `Gain partie ${gameRoom.gameType}`,
                  gameId: gameRoom.id,
                },
              });
            }
          }
        }
      }

              return { 
          success: true, 
          gameState: newState,
          isGameOver: result.isGameOver || false,
          winner: result.winners?.[0] || null,
        };
    }),

  // Se coucher (fold)
  fold: protectedProcedure
    .input(z.object({
      gameId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const gameRoom = await ctx.db.gameRoom.findUnique({
        where: { id: input.gameId },
        include: { 
          players: true,
          gameState: true,
        },
      });

      if (!gameRoom || gameRoom.status !== GameRoomStatus.IN_PROGRESS || !gameRoom.gameState) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Partie non active',
        });
      }

      if (gameRoom.gameState.currentPlayerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ce n\'est pas votre tour',
        });
      }

              // Appliquer le fold
        const gameEngine = new GameEngine(new GarameRules());
        const gameState = gameRoom.gameState.players as unknown as GarameState;
        const move = {
          type: 'FOLD' as const,
          playerId: ctx.session.user.id,
          timestamp: new Date(),
        };

        const result = gameEngine.executeMove(gameState, move);
        
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error || 'Impossible de se coucher',
          });
        }

        const newState = result.state;

      // Sauvegarder l'état
      await ctx.db.gameState.update({
        where: { id: gameRoom.gameState.id },
        data: { 
          players: newState as any,
          turn: { increment: 1 },
        },
      });

      // Enregistrer le mouvement
      await ctx.db.gameMove.create({
        data: {
          gameId: input.gameId,
          playerId: ctx.session.user.id,
          playerName: ctx.session.user.name || 'Joueur',
          moveType: MoveType.FOLD,
          moveNumber: gameRoom.gameState.turn + 1,
          moveData: {},
        },
      });

      return { success: true, gameState: newState };
    }),

  // Obtenir l'historique des mouvements
  getMoves: protectedProcedure
    .input(z.object({
      gameId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const moves = await ctx.db.gameMove.findMany({
        where: { gameId: input.gameId },
        orderBy: { moveNumber: 'asc' },
      });

      return moves.map(move => ({
        id: move.id,
        moveNumber: move.moveNumber,
        moveType: move.moveType,
        moveData: move.moveData,
        timestamp: move.timestamp,
        playerId: move.playerId,
        playerName: move.playerName,
      }));
    }),
}); 