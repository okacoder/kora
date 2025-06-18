import { injectable, inject } from 'inversify';
import type { IGameStateService } from '@/lib/interfaces/services/IGameStateService';
import type { IGameStateRepository } from '@/lib/interfaces/repositories/IGameStateRepository';
import type { IUserService } from '@/lib/interfaces/services/IUserService';
import type { BaseGameState, Player } from '@/lib/garame/core/types';
import { TYPES } from '@/lib/di/types';

@injectable()
export class GameStateService implements IGameStateService {
  constructor(
    @inject(TYPES.GameStateRepository) private gameStateRepository: IGameStateRepository,
    @inject(TYPES.UserService) private userService: IUserService
  ) {}

  async saveState(gameState: BaseGameState): Promise<void> {
    const existing = await this.gameStateRepository.findById(gameState.id);
    if (existing) {
      await this.gameStateRepository.update(gameState.id, gameState);
    } else {
      await this.gameStateRepository.create(gameState);
    }
  }

  async getGameState(gameId: string): Promise<BaseGameState | null> {
    return this.gameStateRepository.findById(gameId);
  }

  async getCurrentPlayer(): Promise<Player> {
    const user = await this.userService.getCurrentUser();
    return {
      id: user.id,
      username: user.username,
      balance: user.koras,
      avatar: user.image || undefined
    };
  }

  async setCurrentPlayer(player: Player): Promise<void> {
    // Dans cette architecture, on utilise l'authentification
    // donc pas besoin de setter manuellement le joueur
  }

  async clearState(gameId: string): Promise<void> {
    await this.gameStateRepository.delete(gameId);
  }

  async getAllActiveGames(): Promise<BaseGameState[]> {
    // Implémentation selon les besoins
    // Pour le moment, on retourne un tableau vide
    return [];
  }
}