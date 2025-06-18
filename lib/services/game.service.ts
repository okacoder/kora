import { GameRoom, GameRoomStatus, GameState, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { paymentService } from './payment.service';
import { userService } from './user.service';

export interface CreateRoomDto {
  gameType: string;
  stake: number;
  maxPlayers?: number;
  minPlayers?: number;
  isPrivate?: boolean;
  aiPlayers?: number;
  aiDifficulty?: 'boa' | 'normal' | 'sensei';
  turnDuration?: number;
}

export interface GameHistoryItem {
  id: string;
  gameType: string;
  stake: number;
  totalPot: number;
  createdAt: Date;
  endedAt: Date | null;
  status: GameRoomStatus;
  players: {
    id: string;
    name: string;
    isWinner: boolean;
  }[];
  winnings: number | null;
}

type GameRoomWithRelations = Prisma.GameRoomGetPayload<{
  include: {
    players: true;
    gameState: true;
  };
}>;

interface GameMetadata {
  winnings?: number;
  [key: string]: any;
}

class GameService {
  private static instance: GameService;

  private constructor() {}

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  async createRoom(userId: string, data: CreateRoomDto): Promise<GameRoom> {
    const user = await userService.getUserById(userId);
    if (!user) throw new Error('User not found');

    // Vérifier le solde
    const canAfford = await paymentService.canAffordStake(userId, data.stake);
    if (!canAfford) {
      throw new Error('Insufficient balance');
    }

    // Créer la salle et traiter la mise dans une transaction
    const room = await prisma.$transaction(async (tx) => {
      // Créer la salle
      const newRoom = await tx.gameRoom.create({
        data: {
          gameType: data.gameType,
          stake: data.stake,
          creatorId: userId,
          creatorName: user.name,
          status: 'WAITING',
          maxPlayers: data.maxPlayers || 2,
          minPlayers: data.minPlayers || 2,
          totalPot: data.stake * 10, // En FCFA
          settings: {
            isPrivate: data.isPrivate || false,
            roomCode: data.isPrivate ? this.generateRoomCode() : null,
            aiPlayers: data.aiPlayers || 0,
            aiDifficulty: data.aiDifficulty || 'normal',
            turnDuration: data.turnDuration || 30
          },
        },
        include: {
          players: true,
        },
      });

      // Ajouter le créateur comme joueur
      await tx.roomPlayer.create({
        data: {
          gameRoomId: newRoom.id,
          userId: userId,
          name: user.name,
          position: 0,
          isReady: true,
          isAI: false,
        },
      });

      // Ajouter les joueurs IA si demandé
      if (data.aiPlayers && data.aiPlayers > 0) {
        for (let i = 0; i < data.aiPlayers; i++) {
          await tx.roomPlayer.create({
            data: {
              gameRoomId: newRoom.id,
              userId: `ai-${i + 1}`,
              name: `IA ${i + 1}`,
              position: i + 1,
              isReady: true,
              isAI: true,
            },
          });
        }
      }

      return newRoom;
    });

    // Traiter la mise
    await paymentService.processStake(userId, data.stake, room.id);

    return room;
  }

  async joinRoom(roomId: string, userId: string): Promise<GameRoom> {
    const user = await userService.getUserById(userId);
    if (!user) throw new Error('User not found');

    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    if (room.status !== 'WAITING') {
      throw new Error('Room is not available');
    }

    const playerCount = await prisma.roomPlayer.count({
      where: { gameRoomId: roomId },
    });

    if (playerCount >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    // Vérifier le solde
    const canAfford = await paymentService.canAffordStake(userId, room.stake);
    if (!canAfford) {
      throw new Error('Insufficient balance');
    }

    // Ajouter le joueur
    await prisma.$transaction(async (tx) => {
      const position = await tx.roomPlayer.count({
        where: { gameRoomId: roomId },
      });

      await tx.roomPlayer.create({
        data: {
          gameRoomId: roomId,
          userId: userId,
          name: user.name,
          position: position,
          isReady: false,
          isAI: false,
        },
      });

      // Mettre à jour le pot total
      await tx.gameRoom.update({
        where: { id: roomId },
        data: {
          totalPot: {
            increment: room.stake * 10,
          },
        },
      });
    });

    // Traiter la mise
    await paymentService.processStake(userId, room.stake, roomId);

    return this.getRoom(roomId);
  }

  async getRoom(roomId: string): Promise<GameRoom> {
    const room = await prisma.gameRoom.findUnique({
      where: { id: roomId },
      include: {
        players: true,
      },
    });

    if (!room) throw new Error('Room not found');
    return room;
  }

  async getAvailableRooms(gameType?: string): Promise<GameRoom[]> {
    return await prisma.gameRoom.findMany({
      where: {
        status: 'WAITING',
        ...(gameType && { gameType }),
      },
      include: {
        players: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserRooms(userId: string): Promise<GameRoomWithRelations[]> {
    return await prisma.gameRoom.findMany({
      where: {
        players: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        players: true,
        gameState: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async setPlayerReady(roomId: string, userId: string, ready: boolean): Promise<void> {
    await prisma.roomPlayer.updateMany({
      where: {
        gameRoomId: roomId,
        userId: userId,
      },
      data: {
        isReady: ready,
      },
    });
  }

  async startGame(roomId: string, userId: string): Promise<string> {
    const room = await this.getRoom(roomId);

    if (room.creatorId !== userId) {
      throw new Error('Only room creator can start the game');
    }

    const players = await prisma.roomPlayer.findMany({
      where: { gameRoomId: roomId },
    });

    if (players.length < room.minPlayers) {
      throw new Error('Not enough players');
    }

    if (!players.every((p) => p.isReady)) {
      throw new Error('All players must be ready');
    }

    // Créer l'état de jeu
    const gameState = await prisma.gameState.create({
      data: {
        roomId: roomId,
        gameType: room.gameType,
        currentPlayerId: players[0].userId || players[0].id,
        players: JSON.stringify(
          players.map((p) => ({
            id: p.userId || p.id,
            name: p.name,
            position: p.position,
            score: 0,
            isActive: true,
            isAI: p.isAI,
          })),
        ),
        pot: room.totalPot,
        status: 'PLAYING',
        turn: 1,
        metadata: {},
      },
    });

    // Mettre à jour le statut de la salle
    await prisma.gameRoom.update({
      where: { id: roomId },
      data: {
        status: 'IN_PROGRESS',
        gameStateId: gameState.id,
      },
    });

    return gameState.id;
  }

  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async getUserGameHistory(userId: string, limit: number = 10): Promise<GameHistoryItem[]> {
    const rooms = await prisma.gameRoom.findMany({
      where: {
        players: {
          some: {
            userId: userId,
          },
        },
        status: {
          in: ['COMPLETED', 'CANCELLED'],
        },
      },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        gameState: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return (rooms as GameRoomWithRelations[]).map(room => ({
      id: room.id,
      gameType: room.gameType,
      stake: room.stake,
      totalPot: room.totalPot,
      createdAt: room.createdAt,
      endedAt: room.gameState?.endedAt || null,
      status: room.status,
      players: room.players.map(player => ({
        id: player.userId || player.id,
        name: player.name,
        isWinner: room.gameState?.winnerId === (player.userId || player.id),
      })),
      winnings: (room.gameState?.metadata as GameMetadata)?.winnings || null,
    }));
  }

  async getGameStats(userId: string) {
    const rooms = await prisma.gameRoom.findMany({
      where: {
        players: {
          some: {
            userId: userId,
          },
        },
        status: 'COMPLETED',
      },
      include: {
        gameState: true,
      },
    });

    const stats = {
      totalGames: rooms.length,
      gamesWon: 0,
      totalWinnings: 0,
      highestWin: 0,
      winRate: 0,
      favoriteGameType: '',
      gameTypes: {} as Record<string, number>,
    };

    rooms.forEach(room => {
      // Count wins
      if (room.gameState?.winnerId === userId) {
        stats.gamesWon++;
        const winnings = (room.gameState?.metadata as any)?.winnings || 0;
        stats.totalWinnings += winnings;
        stats.highestWin = Math.max(stats.highestWin, winnings);
      }

      // Track game types
      stats.gameTypes[room.gameType] = (stats.gameTypes[room.gameType] || 0) + 1;
    });

    // Calculate win rate
    stats.winRate = stats.totalGames > 0 ? (stats.gamesWon / stats.totalGames) * 100 : 0;

    // Find favorite game type
    let maxGames = 0;
    Object.entries(stats.gameTypes).forEach(([type, count]) => {
      if (count > maxGames) {
        maxGames = count;
        stats.favoriteGameType = type;
      }
    });

    return stats;
  }

  async getGameState(gameId: string): Promise<any> {
    const gameState = await prisma.gameState.findUnique({
      where: { id: gameId },
      include: {
        room: {
          include: {
            players: true,
          },
        },
      },
    });

    if (!gameState) {
      throw new Error('Game state not found');
    }

    return gameState;
  }

  async playCard(gameId: string, playerId: string, cardId: string): Promise<void> {
    const gameState = await this.getGameState(gameId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    if (gameState.currentPlayerId !== playerId) {
      throw new Error('Not your turn');
    }

    // TODO: Implement game-specific logic
    await prisma.gameState.update({
      where: { id: gameId },
      data: {
        // Update game state based on the played card
        metadata: {
          lastPlayedCard: cardId,
          lastPlayedBy: playerId,
          lastPlayedAt: new Date().toISOString(),
        },
      },
    });
  }
}

export const gameService = GameService.getInstance(); 