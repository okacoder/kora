import { BaseGameState, GameAction } from './types';

export abstract class BaseAIPlayer {
  constructor(
    protected gameType: string,
    protected difficulty: 'easy' | 'medium' | 'hard'
  ) {}

  abstract decideAction(gameState: BaseGameState, playerId: string): Promise<GameAction | null>;

  protected async simulateThinking(): Promise<void> {
    // Simulate thinking time
    const baseTime = {
      easy: 500,
      medium: 1000,
      hard: 1500
    };

    const variance = Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, baseTime[this.difficulty] + variance));
  }

  protected evaluatePosition(gameState: BaseGameState, playerId: string): number {
    // Base evaluation function - override in game-specific implementations
    const playerState = gameState.players.get(playerId);
    if (!playerState) return 0;

    return playerState.score;
  }
}