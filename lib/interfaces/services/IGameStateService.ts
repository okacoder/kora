import { BaseGameState, Player } from '@/lib/garame/core/types';

export interface IGameStateService {
  saveState(gameState: BaseGameState): Promise<void>;
  getGameState(gameId: string): Promise<BaseGameState | null>;
  getCurrentPlayer(): Promise<Player>;
  setCurrentPlayer(player: Player): Promise<void>;
  clearState(gameId: string): Promise<void>;
  getAllActiveGames(): Promise<BaseGameState[]>;
}