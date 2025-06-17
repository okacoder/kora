import { injectable, inject } from 'inversify';
import { IGameEngineService } from '@/lib/interfaces/services/IGameEngineService';
import { IGameStateRepository } from '@/lib/interfaces/repositories/IGameStateRepository';
import { GameAction, BaseGameState, GameRoom } from '@/lib/garame/core/types';
import { gameRegistry } from '@/lib/garame/core/game-registry';
import { TYPES } from '@/lib/di/types';

@injectable()
export class GameEngineService implements IGameEngineService {
  constructor(
    @inject(TYPES.GameStateRepository) private gameStateRepository: IGameStateRepository
  ) {}

  async createGame(room: GameRoom): Promise<BaseGameState> {
    // Obtenir le moteur de jeu approprié
    const engine = gameRegistry.getEngine(room.gameType);
    if (!engine) {
      throw new Error(`Game engine not found for game type: ${room.gameType}`);
    }

    // Créer l'état initial du jeu
    const gameState = engine.createInitialState(room);
    
    // Sauvegarder l'état
    await this.gameStateRepository.create(gameState);

    return gameState;
  }

  async processAction(gameId: string, action: GameAction): Promise<BaseGameState> {
    // Charger l'état actuel
    const currentState = await this.gameStateRepository.findById(gameId);
    if (!currentState) {
      throw new Error('Game state not found');
    }

    // Obtenir le moteur de jeu
    const engine = gameRegistry.getEngine(currentState.gameType);
    if (!engine) {
      throw new Error(`Game engine not found for game type: ${currentState.gameType}`);
    }

    // Valider l'action
    if (!engine.validateAction(currentState, action)) {
      throw new Error('Invalid action');
    }

    // Appliquer l'action
    const newState = engine.applyAction(currentState, action);

    // Sauvegarder le nouvel état
    await this.gameStateRepository.update(gameId, newState);

    return newState;
  }

  async getGameState(gameId: string): Promise<BaseGameState | null> {
    return this.gameStateRepository.findById(gameId);
  }

  async getValidActions(gameId: string, playerId: string): Promise<GameAction[]> {
    const gameState = await this.gameStateRepository.findById(gameId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    const engine = gameRegistry.getEngine(gameState.gameType);
    if (!engine) {
      throw new Error(`Game engine not found for game type: ${gameState.gameType}`);
    }

    return engine.getValidActions(gameState, playerId);
  }

  async isGameEnded(gameId: string): Promise<boolean> {
    const gameState = await this.gameStateRepository.findById(gameId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    const engine = gameRegistry.getEngine(gameState.gameType);
    if (!engine) {
      throw new Error(`Game engine not found for game type: ${gameState.gameType}`);
    }

    return engine.isGameOver(gameState);
  }

  async getWinners(gameId: string): Promise<string[]> {
    const gameState = await this.gameStateRepository.findById(gameId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    const engine = gameRegistry.getEngine(gameState.gameType);
    if (!engine) {
      throw new Error(`Game engine not found for game type: ${gameState.gameType}`);
    }

    return engine.getWinners(gameState);
  }

  async forfeitGame(gameId: string, playerId: string): Promise<void> {
    const gameState = await this.gameStateRepository.findById(gameId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    // Marquer le joueur comme ayant abandonné
    const players = gameState.players as Map<string, any>;
    const player = players.get(playerId);
    if (player) {
      player.isActive = false;
      player.hasFolded = true;
    }

    // Vérifier si le jeu doit se terminer
    const activePlayers = Array.from(players.values()).filter(p => p.isActive);
    if (activePlayers.length <= 1) {
      gameState.status = 'finished';
      gameState.winnerId = activePlayers[0]?.id;
      gameState.winners = [activePlayers[0]?.id];
    }

    await this.gameStateRepository.update(gameId, gameState);
  }
}