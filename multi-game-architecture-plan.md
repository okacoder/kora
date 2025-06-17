# LaMap241 Multi-Game Architecture Implementation Plan

## Overview
This plan extends the previous architecture to support multiple card games, up to 8 players, and AI opponents with difficulty levels. The design uses a plugin architecture where each game implements a common interface while maintaining its unique rules and mechanics.

## Architecture Changes Summary

### 1. **Plugin-Based Game System**
- Abstract `BaseGameEngine` that all games extend
- Game-specific implementations (Garame, Poker, etc.)
- Shared interfaces for common operations
- Dynamic game loading

### 2. **Enhanced Room System**
- Support for 2-8 players
- AI player slots
- Mixed human/AI games
- Game-specific room configurations

### 3. **AI Framework**
- Abstract `AIPlayer` class
- Game-specific AI implementations
- Difficulty level system
- Async AI decision making

---

# Core Architecture

## 1. Enhanced Type Definitions

### File: `lib/garame/core/types.ts`

```typescript
// Base types remain the same, with additions:

export interface Player {
  id: string;
  username: string;
  balance: number;
  avatar?: string;
  isAI?: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface GameRoom {
  id: string;
  gameType: string; // 'garame', 'poker', 'rummy', etc.
  stake: number;
  creatorId: string;
  creatorName: string;
  players: RoomPlayer[];
  status: 'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled';
  maxPlayers: number; // 2-8
  minPlayers: number; // minimum to start
  totalPot: number;
  gameStateId?: string;
  settings?: GameRoomSettings;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RoomPlayer {
  id: string;
  name: string;
  position: number; // 0-7 (seat position)
  isReady: boolean;
  isAI: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  joinedAt: Date;
}

export interface GameRoomSettings {
  turnDuration?: number;
  allowSpectators?: boolean;
  privateRoom?: boolean;
  roomCode?: string;
  aiPlayersAllowed?: boolean;
  [key: string]: any; // Game-specific settings
}

export interface BaseGameState {
  id: string;
  roomId: string;
  gameType: string;
  currentPlayerId: string;
  players: Map<string, BasePlayerState>;
  pot: number;
  status: 'playing' | 'paused' | 'finished' | 'abandoned';
  winnerId?: string;
  winners?: string[]; // For games with multiple winners
  turn: number;
  startedAt: Date;
  endedAt?: Date;
  metadata?: Record<string, any>;
}

export interface BasePlayerState {
  id: string;
  position: number;
  score: number;
  isActive: boolean; // Still in game
  isAI: boolean;
  lastAction?: GameAction;
}

// Game Registry
export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  icon: React.ComponentType<{ className?: string }>;
  rules: string[];
  engineClass: new (...args: any[]) => BaseGameEngine;
  aiClass?: new (...args: any[]) => BaseAIPlayer;
}

export interface GameAction {
  type: string;
  playerId: string;
  data?: any;
  timestamp: Date;
  isValid?: boolean;
}
```

## 2. Base Game Engine

### File: `lib/garame/core/base-game-engine.ts`

```typescript
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
```

## 3. Game Registry

### File: `lib/garame/core/game-registry.ts`

```typescript
import { GameDefinition } from './types';
import { BaseGameEngine } from './base-game-engine';
import { BaseAIPlayer } from './base-ai-player';
import { IconCards, IconPokerChip, IconDice } from '@tabler/icons-react';

// Import game-specific engines
import { GarameEngine } from '../games/garame/garame-engine';
import { GarameAI } from '../games/garame/garame-ai';
// Import future games
// import { PokerEngine } from '../games/poker/poker-engine';
// import { PokerAI } from '../games/poker/poker-ai';

class GameRegistry {
  private games = new Map<string, GameDefinition>();
  private engineInstances = new Map<string, BaseGameEngine>();

  register(game: GameDefinition): void {
    this.games.set(game.id, game);
  }

  get(gameId: string): GameDefinition | undefined {
    return this.games.get(gameId);
  }

  getAll(): GameDefinition[] {
    return Array.from(this.games.values());
  }

  getEngine(gameId: string): BaseGameEngine {
    let engine = this.engineInstances.get(gameId);
    if (!engine) {
      const definition = this.get(gameId);
      if (!definition) {
        throw new Error(`Game ${gameId} not registered`);
      }
      engine = new definition.engineClass(gameId);
      this.engineInstances.set(gameId, engine);
    }
    return engine;
  }

  getAvailableGames(): Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType;
    playerRange: string;
  }> {
    return this.getAll().map(game => ({
      id: game.id,
      name: game.name,
      description: game.description,
      icon: game.icon,
      playerRange: game.minPlayers === game.maxPlayers 
        ? `${game.minPlayers} joueurs`
        : `${game.minPlayers}-${game.maxPlayers} joueurs`
    }));
  }
}

// Create singleton instance
export const gameRegistry = new GameRegistry();

// Register games
gameRegistry.register({
  id: 'garame',
  name: 'Garame',
  description: 'Jeu de cartes stratégique avec Kora',
  minPlayers: 2,
  maxPlayers: 2,
  icon: IconCards,
  rules: [
    'Le joueur avec la Kora peut jouer n\'importe quelle carte',
    'Sans Kora, vous devez suivre la couleur',
    'Premier à 10 points gagne',
    'Gardez la Kora pour marquer des points'
  ],
  engineClass: GarameEngine,
  aiClass: GarameAI
});

// Future games can be registered here
// gameRegistry.register({
//   id: 'poker',
//   name: 'Poker Texas Hold\'em',
//   description: 'Le classique jeu de poker',
//   minPlayers: 2,
//   maxPlayers: 8,
//   icon: IconPokerChip,
//   rules: [...],
//   engineClass: PokerEngine,
//   aiClass: PokerAI
// });
```

## 4. Garame-Specific Implementation

### File: `lib/garame/games/garame/garame-types.ts`

```typescript
import { BaseGameState, BasePlayerState, Card } from '../../core/types';

export interface GarameGameState extends BaseGameState {
  lastPlayedCard: Card | null;
  currentSuit?: Card['suit'];
  deck: Card[]; // Remaining deck
  discardPile: Card[];
}

export interface GaramePlayerState extends BasePlayerState {
  cards: Card[];
  hasKora: boolean;
  wonTricks: number;
}

export interface GarameAction {
  type: 'play_card';
  playerId: string;
  data: {
    cardIndex: number;
    card: Card;
  };
}
```

### File: `lib/garame/games/garame/garame-engine.ts`

```typescript
import { BaseGameEngine } from '../../core/base-game-engine';
import { GameRoom, GameAction, BaseGameState } from '../../core/types';
import { GarameGameState, GaramePlayerState } from './garame-types';
import { GarameRules } from './garame-rules';
import { GarameAI } from './garame-ai';

export class GarameEngine extends BaseGameEngine {
  createInitialState(room: GameRoom): GarameGameState {
    const deck = GarameRules.createShuffledDeck();
    const cardsPerPlayer = 10;
    
    const gameState: GarameGameState = {
      id: `game-${Date.now()}`,
      roomId: room.id,
      gameType: 'garame',
      currentPlayerId: room.players[0].id,
      players: new Map(),
      lastPlayedCard: null,
      deck: [],
      discardPile: [],
      pot: room.totalPot,
      status: 'playing',
      turn: 1,
      startedAt: new Date()
    };

    // Deal cards
    room.players.forEach((player, index) => {
      const playerCards = deck.slice(
        index * cardsPerPlayer,
        (index + 1) * cardsPerPlayer
      );

      const playerState: GaramePlayerState = {
        id: player.id,
        position: player.position,
        cards: playerCards,
        score: 0,
        hasKora: index === 0,
        wonTricks: 0,
        isActive: true,
        isAI: player.isAI,
        lastAction: undefined
      };

      gameState.players.set(player.id, playerState);
    });

    // Remaining cards go to deck
    gameState.deck = deck.slice(room.players.length * cardsPerPlayer);

    return gameState;
  }

  validateAction(state: BaseGameState, action: GameAction): boolean {
    const gameState = state as GarameGameState;
    const garameAction = action as any;

    if (action.type !== 'play_card') return false;
    if (state.currentPlayerId !== action.playerId) return false;

    const playerState = gameState.players.get(action.playerId) as GaramePlayerState;
    if (!playerState) return false;

    const card = playerState.cards[garameAction.data.cardIndex];
    if (!card) return false;

    return GarameRules.canPlayCard(gameState, action.playerId, card);
  }

  applyAction(state: BaseGameState, action: GameAction): GarameGameState {
    const gameState = { ...state } as GarameGameState;
    const garameAction = action as any;
    const playerState = gameState.players.get(action.playerId) as GaramePlayerState;

    // Remove card from hand
    const card = playerState.cards.splice(garameAction.data.cardIndex, 1)[0];

    // Apply Garame rules
    const updates = GarameRules.applyCardPlay(gameState, action.playerId, card);
    Object.assign(gameState, updates);

    // Next player
    const players = Array.from(gameState.players.keys());
    const currentIndex = players.indexOf(action.playerId);
    gameState.currentPlayerId = players[(currentIndex + 1) % players.length];
    gameState.turn++;

    return gameState;
  }

  checkWinCondition(state: BaseGameState): { ended: boolean; winners?: string[] } {
    const gameState = state as GarameGameState;
    return GarameRules.checkEndCondition(gameState);
  }

  getValidActions(state: BaseGameState, playerId: string): GameAction[] {
    const gameState = state as GarameGameState;
    const playerState = gameState.players.get(playerId) as GaramePlayerState;
    
    if (!playerState || state.currentPlayerId !== playerId) return [];

    const validIndices = GarameRules.getPlayableCards(gameState, playerId);
    
    return validIndices.map(index => ({
      type: 'play_card',
      playerId,
      data: {
        cardIndex: index,
        card: playerState.cards[index]
      },
      timestamp: new Date()
    }));
  }

  calculateScores(state: BaseGameState): Map<string, number> {
    const scores = new Map<string, number>();
    
    for (const [playerId, playerState] of state.players) {
      scores.set(playerId, playerState.score);
    }
    
    return scores;
  }

  protected getGameDefinition() {
    return {
      minPlayers: 2,
      maxPlayers: 2
    };
  }

  protected async getAIAction(gameState: BaseGameState, aiPlayerId: string): Promise<GameAction | null> {
    const room = await this.store.getRoom(gameState.roomId);
    const aiPlayer = room?.players.find(p => p.id === aiPlayerId);
    
    if (!aiPlayer?.aiDifficulty) {
      return super.getAIAction(gameState, aiPlayerId);
    }

    const ai = new GarameAI(aiPlayer.aiDifficulty);
    return ai.decideAction(gameState as GarameGameState, aiPlayerId);
  }
}
```

### File: `lib/garame/games/garame/garame-ai.ts`

```typescript
import { BaseAIPlayer } from '../../core/base-ai-player';
import { GameAction } from '../../core/types';
import { GarameGameState, GaramePlayerState } from './garame-types';
import { GarameRules } from './garame-rules';

export class GarameAI extends BaseAIPlayer {
  constructor(difficulty: 'easy' | 'medium' | 'hard') {
    super('garame', difficulty);
  }

  async decideAction(gameState: GarameGameState, playerId: string): Promise<GameAction | null> {
    const playerState = gameState.players.get(playerId) as GaramePlayerState;
    if (!playerState) return null;

    const playableIndices = GarameRules.getPlayableCards(gameState, playerId);
    if (playableIndices.length === 0) return null;

    let selectedIndex: number;

    switch (this.difficulty) {
      case 'easy':
        selectedIndex = this.easyStrategy(gameState, playerState, playableIndices);
        break;
      case 'medium':
        selectedIndex = this.mediumStrategy(gameState, playerState, playableIndices);
        break;
      case 'hard':
        selectedIndex = this.hardStrategy(gameState, playerState, playableIndices);
        break;
      default:
        selectedIndex = playableIndices[0];
    }

    return {
      type: 'play_card',
      playerId,
      data: {
        cardIndex: selectedIndex,
        card: playerState.cards[selectedIndex]
      },
      timestamp: new Date()
    };
  }

  private easyStrategy(
    gameState: GarameGameState,
    playerState: GaramePlayerState,
    playableIndices: number[]
  ): number {
    // Easy AI: Random valid card
    return playableIndices[Math.floor(Math.random() * playableIndices.length)];
  }

  private mediumStrategy(
    gameState: GarameGameState,
    playerState: GaramePlayerState,
    playableIndices: number[]
  ): number {
    // Medium AI: Basic strategy
    // - If has Kora, play lowest card to keep it
    // - If no Kora, try to win with highest card
    
    if (playerState.hasKora) {
      // Keep Kora, play lowest
      let lowestIndex = playableIndices[0];
      let lowestRank = this.getCardValue(playerState.cards[lowestIndex]);
      
      for (const index of playableIndices) {
        const rank = this.getCardValue(playerState.cards[index]);
        if (rank < lowestRank) {
          lowestRank = rank;
          lowestIndex = index;
        }
      }
      
      return lowestIndex;
    } else {
      // Try to win Kora, play highest
      let highestIndex = playableIndices[0];
      let highestRank = this.getCardValue(playerState.cards[highestIndex]);
      
      for (const index of playableIndices) {
        const rank = this.getCardValue(playerState.cards[index]);
        if (rank > highestRank) {
          highestRank = rank;
          highestIndex = index;
        }
      }
      
      return highestIndex;
    }
  }

  private hardStrategy(
    gameState: GarameGameState,
    playerState: GaramePlayerState,
    playableIndices: number[]
  ): number {
    // Hard AI: Advanced strategy
    // - Track played cards
    // - Calculate probabilities
    // - Strategic Kora management
    // - Endgame optimization

    const opponentId = Array.from(gameState.players.keys())
      .find(id => id !== playerState.id);
    const opponentState = gameState.players.get(opponentId!) as GaramePlayerState;

    // If close to winning (8+ points), be aggressive
    if (playerState.score >= 8) {
      if (playerState.hasKora) {
        // Keep Kora and win
        return this.mediumStrategy(gameState, playerState, playableIndices);
      } else {
        // Need to steal Kora
        return this.playHighestCard(playerState, playableIndices);
      }
    }

    // If opponent close to winning, must be aggressive
    if (opponentState && opponentState.score >= 8) {
      if (!playerState.hasKora) {
        // Must try to get Kora
        return this.playHighestCard(playerState, playableIndices);
      }
    }

    // Mid-game: balanced approach
    if (playerState.hasKora) {
      // Calculate if we can safely keep Kora
      const canKeepKora = this.calculateKoraSafety(gameState, playerState, playableIndices);
      if (canKeepKora.safe) {
        return canKeepKora.cardIndex;
      }
    }

    // Default to medium strategy
    return this.mediumStrategy(gameState, playerState, playableIndices);
  }

  private calculateKoraSafety(
    gameState: GarameGameState,
    playerState: GaramePlayerState,
    playableIndices: number[]
  ): { safe: boolean; cardIndex: number } {
    // Complex calculation based on:
    // - Cards already played
    // - Opponent's likely cards
    // - Current suit requirements
    
    // For now, simplified version
    const midRangeIndices = playableIndices.filter(index => {
      const value = this.getCardValue(playerState.cards[index]);
      return value >= 5 && value <= 10;
    });

    if (midRangeIndices.length > 0) {
      return {
        safe: true,
        cardIndex: midRangeIndices[0]
      };
    }

    return {
      safe: false,
      cardIndex: playableIndices[0]
    };
  }

  private playHighestCard(playerState: GaramePlayerState, playableIndices: number[]): number {
    let highestIndex = playableIndices[0];
    let highestValue = this.getCardValue(playerState.cards[highestIndex]);

    for (const index of playableIndices) {
      const value = this.getCardValue(playerState.cards[index]);
      if (value > highestValue) {
        highestValue = value;
        highestIndex = index;
      }
    }

    return highestIndex;
  }

  private getCardValue(card: any): number {
    const rankValues: Record<string, number> = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11,
      '10': 10, '9': 9, '8': 8, '7': 7,
      '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    return rankValues[card.rank] || 0;
  }
}
```

## 5. Base AI Player

### File: `lib/garame/core/base-ai-player.ts`

```typescript
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
```

## 6. Updated React Hooks

### File: `lib/garame/hooks/use-game-engine.ts`

```typescript
import { useState, useCallback, useMemo } from 'react';
import { gameRegistry } from '../core/game-registry';
import { GameRoom, BaseGameState } from '../core/types';
import { toast } from 'sonner';

export function useGameEngine(gameType: string) {
  const engine = useMemo(() => gameRegistry.getEngine(gameType), [gameType]);
  const [loading, setLoading] = useState(false);

  const createRoom = useCallback(async (
    stake: number,
    settings?: any
  ): Promise<GameRoom> => {
    setLoading(true);
    try {
      const room = await engine.createRoom(stake, settings);
      toast.success('Partie créée!');
      return room;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [engine]);

  const joinRoom = useCallback(async (roomId: string): Promise<GameRoom> => {
    setLoading(true);
    try {
      const room = await engine.joinRoom(roomId);
      toast.success('Partie rejointe!');
      return room;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [engine]);

  const addAIPlayer = useCallback(async (
    roomId: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<void> => {
    setLoading(true);
    try {
      await engine.addAIPlayer(roomId, difficulty);
      toast.success(`Bot ${difficulty} ajouté!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [engine]);

  const executeAction = useCallback(async (
    gameId: string,
    action: any
  ): Promise<BaseGameState> => {
    try {
      return await engine.executeAction(gameId, action);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur';
      toast.error(message);
      throw error;
    }
  }, [engine]);

  return {
    engine,
    loading,
    createRoom,
    joinRoom,
    addAIPlayer,
    executeAction
  };
}
```

## 7. Updated UI Components

### File: `app/(authenticated)/games/page.tsx`

```typescript
"use client";

import { gameRegistry } from '@/lib/garame/core/game-registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function GamesListPage() {
  const router = useRouter();
  const games = gameRegistry.getAvailableGames();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Choisissez votre jeu</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => {
          const Icon = game.icon;
          
          return (
            <Card 
              key={game.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/games/${game.id}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">{game.playerRange}</Badge>
                </div>
                <CardTitle>{game.name}</CardTitle>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Jouer
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming soon games */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Prochainement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Poker', 'Belote', 'Rami'].map((game) => (
            <Card key={game} className="opacity-60">
              <CardHeader>
                <CardTitle>{game}</CardTitle>
                <CardDescription>Bientôt disponible...</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### File: `components/game/room-settings.tsx`

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { GameDefinition } from '@/lib/garame/core/types';

interface RoomSettingsProps {
  game: GameDefinition;
  onCreateRoom: (settings: any) => void;
}

export function RoomSettings({ game, onCreateRoom }: RoomSettingsProps) {
  const [settings, setSettings] = useState({
    maxPlayers: game.maxPlayers,
    turnDuration: 30,
    allowSpectators: false,
    privateRoom: false,
    aiPlayersAllowed: true,
    stake: 100
  });

  const handleSubmit = () => {
    onCreateRoom(settings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres de la partie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Number of players */}
        {game.minPlayers < game.maxPlayers && (
          <div className="space-y-2">
            <Label>Nombre de joueurs</Label>
            <Select
              value={settings.maxPlayers.toString()}
              onValueChange={(value) => setSettings({ ...settings, maxPlayers: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: game.maxPlayers - game.minPlayers + 1 },
                  (_, i) => game.minPlayers + i
                ).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} joueurs
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Stake */}
        <div className="space-y-2">
          <Label>Mise (koras)</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[settings.stake]}
              onValueChange={([value]) => setSettings({ ...settings, stake: value })}
              min={50}
              max={1000}
              step={50}
              className="flex-1"
            />
            <span className="w-16 text-right font-medium">{settings.stake}</span>
          </div>
        </div>

        {/* Turn duration */}
        <div className="space-y-2">
          <Label>Durée du tour (secondes)</Label>
          <Select
            value={settings.turnDuration.toString()}
            onValueChange={(value) => setSettings({ ...settings, turnDuration: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 secondes</SelectItem>
              <SelectItem value="30">30 secondes</SelectItem>
              <SelectItem value="45">45 secondes</SelectItem>
              <SelectItem value="60">60 secondes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AI players */}
        <div className="flex items-center justify-between">
          <Label htmlFor="ai-players">Autoriser les bots</Label>
          <Switch
            id="ai-players"
            checked={settings.aiPlayersAllowed}
            onCheckedChange={(checked) => setSettings({ ...settings, aiPlayersAllowed: checked })}
          />
        </div>

        {/* Private room */}
        <div className="flex items-center justify-between">
          <Label htmlFor="private-room">Partie privée</Label>
          <Switch
            id="private-room"
            checked={settings.privateRoom}
            onCheckedChange={(checked) => setSettings({ ...settings, privateRoom: checked })}
          />
        </div>

        <Button 
          onClick={handleSubmit}
          className="w-full"
          size="lg"
        >
          Créer la partie
        </Button>
      </CardContent>
    </Card>
  );
}
```

### File: `components/game/player-list.tsx`

```typescript
import { RoomPlayer } from '@/lib/garame/core/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  IconRobot, 
  IconUser, 
  IconCrown,
  IconX 
} from '@tabler/icons-react';

interface PlayerListProps {
  players: RoomPlayer[];
  maxPlayers: number;
  isHost: boolean;
  onAddAI?: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onKickPlayer?: (playerId: string) => void;
}

export function PlayerList({ 
  players, 
  maxPlayers, 
  isHost,
  onAddAI,
  onKickPlayer 
}: PlayerListProps) {
  const emptySlots = maxPlayers - players.length;

  return (
    <div className="space-y-2">
      {/* Active players */}
      {players.map((player, index) => (
        <div 
          key={player.id}
          className="flex items-center justify-between p-3 bg-card rounded-lg border"
        >
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {player.isAI ? <IconRobot /> : player.name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{player.name}</span>
                {index === 0 && (
                  <IconCrown className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <div className="flex gap-1">
                {player.isAI && (
                  <Badge variant="secondary" className="text-xs">
                    Bot {player.aiDifficulty}
                  </Badge>
                )}
                {player.isReady && (
                  <Badge variant="default" className="text-xs">
                    Prêt
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {isHost && player.isAI && onKickPlayer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onKickPlayer(player.id)}
            >
              <IconX className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {/* Empty slots */}
      {Array.from({ length: emptySlots }).map((_, index) => (
        <div 
          key={`empty-${index}`}
          className="flex items-center justify-center p-3 border-2 border-dashed rounded-lg"
        >
          {isHost && onAddAI ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAddAI('easy')}
              >
                <IconRobot className="h-4 w-4 mr-1" />
                Bot Facile
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAddAI('medium')}
              >
                <IconRobot className="h-4 w-4 mr-1" />
                Bot Moyen
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAddAI('hard')}
              >
                <IconRobot className="h-4 w-4 mr-1" />
                Bot Difficile
              </Button>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              En attente d'un joueur...
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

## 8. Migration Notes

### Changes from Previous Architecture:

1. **BaseGameEngine**: All games extend this base class
2. **Game Registry**: Central place to register and access games
3. **Flexible Rooms**: Support 2-8 players with mixed human/AI
4. **AI Framework**: Pluggable AI with difficulty levels
5. **Game-Agnostic UI**: Components work with any game type

### Adding a New Game:

1. Create game folder: `lib/garame/games/[game-name]/`
2. Implement:
   - `[game]-types.ts`: Game-specific types
   - `[game]-engine.ts`: Extends BaseGameEngine
   - `[game]-rules.ts`: Game logic
   - `[game]-ai.ts`: AI implementation
3. Register in `game-registry.ts`
4. Add game-specific UI components if needed

### Benefits:

- **Scalable**: Easy to add new games
- **Maintainable**: Each game is isolated
- **Flexible**: Support various player counts and AI
- **Reusable**: Shared components and infrastructure