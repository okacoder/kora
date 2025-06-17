import { BaseGameState, GameStateStatus } from '@/lib/garame/core/types';

export interface IGameStateRepository {
  create(gameState: BaseGameState): Promise<void>;
  findById(id: string): Promise<BaseGameState | null>;
  findByRoomId(roomId: string): Promise<BaseGameState | null>;
  update(id: string, gameState: BaseGameState): Promise<void>;
  updateStatus(id: string, status: GameStateStatus): Promise<void>;
  delete(id: string): Promise<void>;
}