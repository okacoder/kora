import { GameAction, BaseGameState, GameRoom } from '@/lib/garame/core/types';

export interface IGameEngineService {
  createGame(room: GameRoom): Promise<BaseGameState>;
  processAction(gameId: string, action: GameAction): Promise<BaseGameState>;
  getGameState(gameId: string): Promise<BaseGameState | null>;
  getValidActions(gameId: string, playerId: string): Promise<GameAction[]>;
  isGameEnded(gameId: string): Promise<boolean>;
  getWinners(gameId: string): Promise<string[]>;
  forfeitGame(gameId: string, playerId: string): Promise<void>;
}