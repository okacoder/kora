import { 
  GameRoom, 
  BaseGameState, 
  GameAction, 
  Player,
  GameError,
  ErrorCodes 
} from './types';
import { gameStore } from './game-store';
import { paymentService } from './payment-service';
import { globalEventBus } from './event-bus';

export abstract class BaseGameEngine {
  protected gameType: string;
  
  constructor(
    gameType: string,
    protected store = gameStore,
    protected payment = paymentService,
    protected events = globalEventBus
  ) {
    this.gameType = gameType;
  }

  // Abstract methods that each game must implement
  abstract createInitialState(room: GameRoom): BaseGameState;
  abstract validateAction(state: BaseGameState, action: GameAction): boolean;
  abstract applyAction(state: BaseGameState, action: GameAction): BaseGameState;
  abstract checkWinCondition(state: BaseGameState): { ended: boolean; winners?: string[] };
  abstract getValidActions(state: BaseGameState, playerId: string): GameAction[];
  abstract calculateScores(state: BaseGameState): Map<string, number>;

  // Common room management (shared across all games)
  async createRoom(stake: number, settings?: any): Promise<GameRoom> {
    const player = await this.store.getCurrentPlayer();
    const gameDefinition = this.getGameDefinition();

    if (stake < 10) {
      throw new GameError(ErrorCodes.INVALID_STATE, 'Mise minimum: 10 koras');
    }

    const stakeInFCFA = stake * 10;
    if (player.balance < stakeInFCFA) {
      throw new GameError(ErrorCodes.INSUFFICIENT_BALANCE, 'Solde insuffisant');
    }

    const room = await this.store.createRoom({
      gameType: this.gameType,
      stake,
      creatorId: player.id,
      creatorName: player.username,
      players: [{
        id: player.id,
        name: player.username,
        position: 0,
        isReady: true,
        isAI: false,
        joinedAt: new Date()
      }],
      status: 'waiting',
      maxPlayers: gameDefinition.maxPlayers,
      minPlayers: gameDefinition.minPlayers,
      totalPot: stakeInFCFA,
      settings
    });

    await this.payment.processStake(player.id, stakeInFCFA, room.id);
    await this.events.emit('room.created', { room, player });

    return room;
  }

  async joinRoom(roomId: string, asAI = false, aiDifficulty?: 'easy' | 'medium' | 'hard'): Promise<GameRoom> {
    const room = await this.store.getRoom(roomId);
    if (!room) {
      throw new GameError(ErrorCodes.ROOM_NOT_FOUND, 'Salle introuvable');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new GameError(ErrorCodes.ROOM_FULL, 'Salle complète');
    }

    let player: Player;
    let playerId: string;
    let playerName: string;

    if (asAI) {
      playerId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      playerName = `Bot-${aiDifficulty}`;
      player = {
        id: playerId,
        username: playerName,
        balance: 999999,
        isAI: true,
        aiDifficulty
      };
    } else {
      player = await this.store.getCurrentPlayer();
      playerId = player.id;
      playerName = player.username;

      const stakeInFCFA = room.stake * 10;
      if (player.balance < stakeInFCFA) {
        throw new GameError(ErrorCodes.INSUFFICIENT_BALANCE, 'Solde insuffisant');
      }

      await this.payment.processStake(playerId, stakeInFCFA, room.id);
    }

    // Find next available position
    const takenPositions = room.players.map(p => p.position);
    const position = Array.from({ length: room.maxPlayers }, (_, i) => i)
      .find(pos => !takenPositions.includes(pos)) || 0;

    room.players.push({
      id: playerId,
      name: playerName,
      position,
      isReady: true,
      isAI: asAI,
      aiDifficulty: asAI ? aiDifficulty : undefined,
      joinedAt: new Date()
    });

    room.totalPot += room.stake * 10;

    // Check if we can start
    if (room.players.length >= room.minPlayers) {
      room.status = 'starting';
      setTimeout(() => this.startGame(roomId), 3000);
    }

    const updatedRoom = await this.store.updateRoom(room.id, room);
    await this.events.emit('room.joined', { room: updatedRoom, player });

    return updatedRoom;
  }

  async addAIPlayer(roomId: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<void> {
    await this.joinRoom(roomId, true, difficulty);
  }

  async startGame(roomId: string): Promise<BaseGameState> {
    const room = await this.store.getRoom(roomId);
    if (!room || room.status !== 'starting') {
      throw new GameError(ErrorCodes.INVALID_STATE, 'Impossible de démarrer');
    }

    const gameState = this.createInitialState(room);
    await this.store.saveGameState(gameState);

    await this.store.updateRoom(room.id, {
      status: 'in_progress',
      gameStateId: gameState.id
    });

    await this.events.emit('game.started', { roomId, gameState });

    // Start AI players
    this.scheduleAITurns(gameState);

    return gameState;
  }

  async executeAction(gameId: string, action: GameAction): Promise<BaseGameState> {
    let gameState = await this.store.getGameState(gameId);
    if (!gameState) {
      throw new GameError(ErrorCodes.GAME_NOT_FOUND, 'Partie introuvable');
    }

    if (!this.validateAction(gameState, action)) {
      throw new GameError(ErrorCodes.INVALID_MOVE, 'Action invalide');
    }

    gameState = this.applyAction(gameState, action);

    const { ended, winners } = this.checkWinCondition(gameState);
    if (ended) {
      gameState.status = 'finished';
      gameState.winnerId = winners?.[0];
      gameState.winners = winners;
      gameState.endedAt = new Date();

      await this.processEndGame(gameState);
    }

    await this.store.saveGameState(gameState);
    await this.events.emit(`game.${gameId}.updated`, { gameState, action });

    // Schedule next AI turn if needed
    if (!ended) {
      this.scheduleAITurns(gameState);
    }

    return gameState;
  }

  protected async processEndGame(gameState: BaseGameState): Promise<void> {
    const room = await this.store.getRoom(gameState.roomId);
    if (!room) return;

    const scores = this.calculateScores(gameState);
    const totalPot = gameState.pot;

    // Distribute winnings
    if (gameState.winners && gameState.winners.length > 0) {
      const winAmountPerPlayer = Math.floor(totalPot * 0.9 / gameState.winners.length);
      
      for (const winnerId of gameState.winners) {
        const player = room.players.find(p => p.id === winnerId);
        if (player && !player.isAI) {
          await this.payment.processWinning(winnerId, winAmountPerPlayer, gameState.id);
        }
      }
    }

    await this.store.updateRoom(room.id, { status: 'completed' });
    await this.events.emit('game.ended', { gameState, scores });
  }

  protected scheduleAITurns(gameState: BaseGameState): void {
    const currentPlayer = gameState.players.get(gameState.currentPlayerId);
    if (!currentPlayer?.isAI || gameState.status !== 'playing') return;

    // AI thinking time based on difficulty
    const thinkingTime = {
      easy: 1000 + Math.random() * 2000,
      medium: 2000 + Math.random() * 3000,
      hard: 3000 + Math.random() * 4000
    };

    const room = this.store.getRoom(gameState.roomId);
    const aiPlayer = room?.players.find(p => p.id === gameState.currentPlayerId);
    const delay = thinkingTime[aiPlayer?.aiDifficulty || 'medium'];

    setTimeout(async () => {
      try {
        const aiAction = await this.getAIAction(gameState, gameState.currentPlayerId);
        if (aiAction) {
          await this.executeAction(gameState.id, aiAction);
        }
      } catch (error) {
        console.error('AI turn error:', error);
      }
    }, delay);
  }

  protected async getAIAction(gameState: BaseGameState, aiPlayerId: string): Promise<GameAction | null> {
    // This will be overridden by game-specific implementations
    const validActions = this.getValidActions(gameState, aiPlayerId);
    if (validActions.length === 0) return null;

    // Default: random valid action
    return validActions[Math.floor(Math.random() * validActions.length)];
  }

  protected abstract getGameDefinition(): {
    minPlayers: number;
    maxPlayers: number;
  };
}