import { injectable } from 'inversify';
import { IGarameAIService } from '@/lib/interfaces/services/IAIService';
import { GameAction, BaseGameState } from '@/lib/garame/core/types';
import { GarameAIService } from '@/lib/garame/ai/garame-ai-service';
import { GarameState } from '@/lib/garame/games/garame/garame-types';

@injectable()
export class GarameAIServiceAdapter implements IGarameAIService {
  private aiService: GarameAIService;

  constructor() {
    this.aiService = new GarameAIService();
  }

  setDifficulty(difficulty: 'boa' | 'normal' | 'sensei'): void {
    this.aiService.setDifficulty(difficulty);
  }

  async getNextAction(
    gameState: BaseGameState,
    playerId: string
  ): Promise<GameAction> {
    // Cast to GarameState for the specialized AI
    return this.aiService.getNextAction(gameState as GarameState, playerId);
  }
}