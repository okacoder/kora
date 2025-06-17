import { GameAction, BaseGameState } from '@/lib/garame/core/types';

export interface IAIService {
  getNextAction(
    gameState: BaseGameState, 
    playerId: string, 
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<GameAction>;
  
  evaluatePosition(gameState: BaseGameState, playerId: string): number;
  
  shouldBluff(gameState: BaseGameState, playerId: string, difficulty: string): boolean;
}

export interface IGarameAIService {
  setDifficulty(difficulty: 'boa' | 'normal' | 'sensei'): void;
  
  getNextAction(
    gameState: BaseGameState,
    playerId: string
  ): Promise<GameAction>;
}