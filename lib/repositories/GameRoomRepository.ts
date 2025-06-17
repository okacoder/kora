import { injectable } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { GameRoom, GameRoomStatus, RoomPlayer } from '@/lib/garame/core/types';
import { IGameRoomRepository, CreateGameRoomDto } from '@/lib/interfaces/repositories/IGameRoomRepository';
import prisma from '@/lib/prisma';

@injectable()
export class GameRoomRepository implements IGameRoomRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: CreateGameRoomDto): Promise<GameRoom> {
    const room = await this.prisma.gameRoom.create({
      data: {
        gameType: data.gameType,
        stake: data.stake,
        creatorId: data.creatorId,
        creatorName: data.creatorName,
        status: 'WAITING',
        maxPlayers: data.maxPlayers,
        minPlayers: data.minPlayers,
        totalPot: 0,
        settings: data.settings || {},
      },
      include: {
        players: true,
      }
    });

    return this.mapToGameRoom(room);
  }

  async findById(id: string): Promise<GameRoom | null> {
    const room = await this.prisma.gameRoom.findUnique({
      where: { id },
      include: { players: true }
    });

    return room ? this.mapToGameRoom(room) : null;
  }

  async findByCreatorId(creatorId: string): Promise<GameRoom[]> {
    const rooms = await this.prisma.gameRoom.findMany({
      where: { creatorId },
      include: { players: true },
      orderBy: { createdAt: 'desc' }
    });

    return rooms.map(this.mapToGameRoom);
  }

  async findAvailable(gameType?: string, status?: GameRoomStatus): Promise<GameRoom[]> {
    const rooms = await this.prisma.gameRoom.findMany({
      where: {
        ...(gameType && { gameType }),
        status: status || 'WAITING',
      },
      include: { players: true },
      orderBy: { createdAt: 'desc' }
    });

    return rooms.map(this.mapToGameRoom);
  }

  async update(id: string, data: Partial<GameRoom>): Promise<GameRoom> {
    const room = await this.prisma.gameRoom.update({
      where: { id },
      data: {
        status: data.status?.toUpperCase() as any,
        totalPot: data.totalPot,
        gameStateId: data.gameStateId,
        settings: data.settings,
        updatedAt: new Date()
      },
      include: { players: true }
    });

    return this.mapToGameRoom(room);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.gameRoom.delete({
      where: { id }
    });
  }

  async addPlayer(roomId: string, player: RoomPlayer): Promise<GameRoom> {
    await this.prisma.roomPlayer.create({
      data: {
        gameRoomId: roomId,
        name: player.name,
        position: player.position,
        isReady: player.isReady,
        isAI: player.isAI,
        aiDifficulty: player.aiDifficulty?.toUpperCase() as any,
        userId: !player.isAI ? player.id : null,
      }
    });

    const updatedRoom = await this.findById(roomId);
    if (!updatedRoom) throw new Error('Room not found');
    return updatedRoom;
  }

  async removePlayer(roomId: string, playerId: string): Promise<GameRoom> {
    // Find and delete the player
    const players = await this.prisma.roomPlayer.findMany({
      where: { 
        gameRoomId: roomId,
        OR: [
          { userId: playerId },
          { id: playerId }
        ]
      }
    });

    if (players.length > 0) {
      await this.prisma.roomPlayer.delete({
        where: { id: players[0].id }
      });
    }

    const updatedRoom = await this.findById(roomId);
    if (!updatedRoom) throw new Error('Room not found');
    return updatedRoom;
  }

  async updatePlayerStatus(roomId: string, playerId: string, isReady: boolean): Promise<GameRoom> {
    const players = await this.prisma.roomPlayer.findMany({
      where: { 
        gameRoomId: roomId,
        OR: [
          { userId: playerId },
          { id: playerId }
        ]
      }
    });

    if (players.length > 0) {
      await this.prisma.roomPlayer.update({
        where: { id: players[0].id },
        data: { isReady }
      });
    }

    const updatedRoom = await this.findById(roomId);
    if (!updatedRoom) throw new Error('Room not found');
    return updatedRoom;
  }

  private mapToGameRoom(dbRoom: any): GameRoom {
    return {
      id: dbRoom.id,
      gameType: dbRoom.gameType,
      stake: dbRoom.stake,
      creatorId: dbRoom.creatorId,
      creatorName: dbRoom.creatorName,
      players: dbRoom.players.map((p: any) => ({
        id: p.userId || p.id,
        name: p.name,
        position: p.position,
        isReady: p.isReady,
        isAI: p.isAI,
        aiDifficulty: p.aiDifficulty?.toLowerCase(),
        joinedAt: p.joinedAt,
      })),
      status: dbRoom.status.toLowerCase() as any,
      maxPlayers: dbRoom.maxPlayers,
      minPlayers: dbRoom.minPlayers,
      totalPot: dbRoom.totalPot,
      gameStateId: dbRoom.gameStateId,
      settings: dbRoom.settings,
      createdAt: dbRoom.createdAt,
      updatedAt: dbRoom.updatedAt,
    };
  }
}