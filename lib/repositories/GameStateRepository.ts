import { injectable } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { BaseGameState, GameStateStatus } from '@/lib/garame/core/types';
import { IGameStateRepository } from '@/lib/interfaces/repositories/IGameStateRepository';
import prisma from '@/lib/prisma';

@injectable()
export class GameStateRepository implements IGameStateRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(gameState: BaseGameState): Promise<void> {
    await this.prisma.gameState.create({
      data: {
        id: gameState.id,
        gameType: gameState.gameType,
        currentPlayerId: gameState.currentPlayerId,
        players: gameState.players,
        pot: gameState.pot,
        status: this.mapStatusToPrisma(gameState.status),
        winnerId: gameState.winnerId,
        winners: gameState.winners || [],
        turn: gameState.turn,
        roomId: gameState.roomId,
        metadata: gameState.metadata,
      }
    });
  }

  async findById(id: string): Promise<BaseGameState | null> {
    const gameState = await this.prisma.gameState.findUnique({
      where: { id }
    });

    return gameState ? this.mapToBaseGameState(gameState) : null;
  }

  async findByRoomId(roomId: string): Promise<BaseGameState | null> {
    const gameState = await this.prisma.gameState.findUnique({
      where: { roomId }
    });

    return gameState ? this.mapToBaseGameState(gameState) : null;
  }

  async update(id: string, gameState: BaseGameState): Promise<void> {
    await this.prisma.gameState.update({
      where: { id },
      data: {
        currentPlayerId: gameState.currentPlayerId,
        players: gameState.players,
        pot: gameState.pot,
        status: this.mapStatusToPrisma(gameState.status),
        winnerId: gameState.winnerId,
        winners: gameState.winners || [],
        turn: gameState.turn,
        metadata: gameState.metadata,
        endedAt: gameState.status === 'finished' ? new Date() : undefined,
      }
    });
  }

  async updateStatus(id: string, status: GameStateStatus): Promise<void> {
    await this.prisma.gameState.update({
      where: { id },
      data: {
        status: this.mapStatusToPrisma(status),
        endedAt: status === 'finished' ? new Date() : undefined,
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.gameState.delete({
      where: { id }
    });
  }

  private mapStatusToPrisma(status: GameStateStatus): string {
    const statusMap: Record<GameStateStatus, string> = {
      'playing': 'PLAYING',
      'paused': 'PAUSED',
      'finished': 'FINISHED',
      'abandoned': 'ABANDONED',
    };
    return statusMap[status] || 'PLAYING';
  }

  private mapStatusFromPrisma(status: string): GameStateStatus {
    const statusMap: Record<string, GameStateStatus> = {
      'PLAYING': 'playing',
      'PAUSED': 'paused',
      'FINISHED': 'finished',
      'ABANDONED': 'abandoned',
    };
    return statusMap[status] || 'playing';
  }

  private mapToBaseGameState(dbGameState: any): BaseGameState {
    return {
      id: dbGameState.id,
      gameType: dbGameState.gameType,
      roomId: dbGameState.roomId,
      currentPlayerId: dbGameState.currentPlayerId,
      players: dbGameState.players,
      pot: dbGameState.pot,
      status: this.mapStatusFromPrisma(dbGameState.status),
      winnerId: dbGameState.winnerId,
      winners: dbGameState.winners,
      turn: dbGameState.turn,
      startedAt: dbGameState.startedAt,
      endedAt: dbGameState.endedAt,
      metadata: dbGameState.metadata,
    };
  }
}