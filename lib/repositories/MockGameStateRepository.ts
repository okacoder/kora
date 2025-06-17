import { injectable } from 'inversify';
import { BaseGameState, GameStateStatus } from '@/lib/garame/core/types';
import { IGameStateRepository } from '@/lib/interfaces/repositories/IGameStateRepository';

@injectable()
export class MockGameStateRepository implements IGameStateRepository {
  private gameStates: Map<string, BaseGameState> = new Map();
  private roomToGameState: Map<string, string> = new Map();

  async create(gameState: BaseGameState): Promise<void> {
    this.gameStates.set(gameState.id, gameState);
    if (gameState.roomId) {
      this.roomToGameState.set(gameState.roomId, gameState.id);
    }
  }

  async findById(id: string): Promise<BaseGameState | null> {
    return this.gameStates.get(id) || null;
  }

  async findByRoomId(roomId: string): Promise<BaseGameState | null> {
    const gameStateId = this.roomToGameState.get(roomId);
    if (!gameStateId) return null;
    return this.gameStates.get(gameStateId) || null;
  }

  async update(id: string, gameState: BaseGameState): Promise<void> {
    this.gameStates.set(id, gameState);
    if (gameState.roomId) {
      this.roomToGameState.set(gameState.roomId, id);
    }
  }

  async updateStatus(id: string, status: GameStateStatus): Promise<void> {
    const gameState = this.gameStates.get(id);
    if (gameState) {
      gameState.status = status;
      if (status === 'finished') {
        gameState.endedAt = new Date();
      }
    }
  }

  async delete(id: string): Promise<void> {
    const gameState = this.gameStates.get(id);
    if (gameState && gameState.roomId) {
      this.roomToGameState.delete(gameState.roomId);
    }
    this.gameStates.delete(id);
  }
}