# Plan complet pour tous les services avec Inversion de Dépendance

## Vue d'ensemble des services à implémenter

Ce plan couvre l'implémentation de tous les services nécessaires pour le jeu LaMap241 en suivant le principe d'inversion de dépendance.

## 1. Services de Jeu (Game Services)

### Interfaces

#### Fichier: `lib/interfaces/repositories/IGameRoomRepository.ts`
```typescript
import { GameRoom, GameRoomStatus, RoomPlayer } from '@/lib/garame/core/types';

export interface IGameRoomRepository {
  create(data: CreateGameRoomDto): Promise<GameRoom>;
  findById(id: string): Promise<GameRoom | null>;
  findByCreatorId(creatorId: string): Promise<GameRoom[]>;
  findAvailable(gameType?: string, status?: GameRoomStatus): Promise<GameRoom[]>;
  update(id: string, data: Partial<GameRoom>): Promise<GameRoom>;
  delete(id: string): Promise<void>;
  addPlayer(roomId: string, player: RoomPlayer): Promise<GameRoom>;
  removePlayer(roomId: string, playerId: string): Promise<GameRoom>;
  updatePlayerStatus(roomId: string, playerId: string, isReady: boolean): Promise<GameRoom>;
}

export interface CreateGameRoomDto {
  gameType: string;
  stake: number;
  creatorId: string;
  creatorName: string;
  maxPlayers: number;
  minPlayers: number;
  settings?: any;
}
```

#### Fichier: `lib/interfaces/repositories/IGameStateRepository.ts`
```typescript
import { BaseGameState, GameStateStatus } from '@/lib/garame/core/types';

export interface IGameStateRepository {
  create(gameState: BaseGameState): Promise<void>;
  findById(id: string): Promise<BaseGameState | null>;
  findByRoomId(roomId: string): Promise<BaseGameState | null>;
  update(id: string, gameState: BaseGameState): Promise<void>;
  updateStatus(id: string, status: GameStateStatus): Promise<void>;
  delete(id: string): Promise<void>;
}
```

#### Fichier: `lib/interfaces/services/IGameRoomService.ts`
```typescript
import { GameRoom, RoomPlayer } from '@/lib/garame/core/types';

export interface IGameRoomService {
  createRoom(gameType: string, stake: number, settings?: any): Promise<GameRoom>;
  joinRoom(roomId: string, asAI?: boolean, aiDifficulty?: 'easy' | 'medium' | 'hard'): Promise<GameRoom>;
  leaveRoom(roomId: string, playerId: string): Promise<void>;
  getRoom(roomId: string): Promise<GameRoom | null>;
  getAvailableRooms(gameType?: string): Promise<GameRoom[]>;
  getUserRooms(userId: string): Promise<GameRoom[]>;
  setPlayerReady(roomId: string, playerId: string, ready: boolean): Promise<void>;
  canStartGame(roomId: string): Promise<boolean>;
  startGame(roomId: string): Promise<string>; // Returns gameStateId
  cancelRoom(roomId: string, userId: string): Promise<void>;
}
```

#### Fichier: `lib/interfaces/services/IGameEngineService.ts`
```typescript
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
```

### Implémentations

#### Fichier: `lib/repositories/GameRoomRepository.ts`
```typescript
import { injectable } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { GameRoom, GameRoomStatus, RoomPlayer } from '@/lib/garame/core/types';
import { IGameRoomRepository, CreateGameRoomDto } from '@/lib/interfaces/repositories/IGameRoomRepository';
import prisma from '@/lib/prisma';

@injectable()
export class GameRoomRepository implements IGameRoomRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: CreateGameRoomDto): Promise<GameRoom> {
    const room = await this.prisma.gameRoom.create({
      data: {
        gameType: data.gameType,
        stake: data.stake,
        creatorId: data.creatorId,
        creatorName: data.creatorName,
        status: 'WAITING',
        maxPlayers: data.maxPlayers,
        minPlayers: data.minPlayers,
        totalPot: 0,
        settings: data.settings || {},
      },
      include: {
        players: true,
      }
    });

    return this.mapToGameRoom(room);
  }

  async findById(id: string): Promise<GameRoom | null> {
    const room = await this.prisma.gameRoom.findUnique({
      where: { id },
      include: { players: true }
    });

    return room ? this.mapToGameRoom(room) : null;
  }

  async findAvailable(gameType?: string, status?: GameRoomStatus): Promise<GameRoom[]> {
    const rooms = await this.prisma.gameRoom.findMany({
      where: {
        ...(gameType && { gameType }),
        status: status || 'WAITING',
      },
      include: { players: true },
      orderBy: { createdAt: 'desc' }
    });

    return rooms.map(this.mapToGameRoom);
  }

  async addPlayer(roomId: string, player: RoomPlayer): Promise<GameRoom> {
    await this.prisma.roomPlayer.create({
      data: {
        gameRoomId: roomId,
        name: player.name,
        position: player.position,
        isReady: player.isReady,
        isAI: player.isAI,
        aiDifficulty: player.aiDifficulty as any,
        userId: !player.isAI ? player.id : null,
      }
    });

    const updatedRoom = await this.findById(roomId);
    if (!updatedRoom) throw new Error('Room not found');
    return updatedRoom;
  }

  private mapToGameRoom(dbRoom: any): GameRoom {
    return {
      id: dbRoom.id,
      gameType: dbRoom.gameType,
      stake: dbRoom.stake,
      creatorId: dbRoom.creatorId,
      creatorName: dbRoom.creatorName,
      players: dbRoom.players.map((p: any) => ({
        id: p.userId || p.id,
        name: p.name,
        position: p.position,
        isReady: p.isReady,
        isAI: p.isAI,
        aiDifficulty: p.aiDifficulty,
        joinedAt: p.joinedAt,
      })),
      status: dbRoom.status.toLowerCase() as any,
      maxPlayers: dbRoom.maxPlayers,
      minPlayers: dbRoom.minPlayers,
      totalPot: dbRoom.totalPot,
      gameStateId: dbRoom.gameStateId,
      settings: dbRoom.settings,
      createdAt: dbRoom.createdAt,
      updatedAt: dbRoom.updatedAt,
    };
  }

  // Autres méthodes...
}
```

#### Fichier: `lib/repositories/MockGameRoomRepository.ts`
```typescript
import { injectable } from 'inversify';
import { GameRoom, GameRoomStatus, RoomPlayer } from '@/lib/garame/core/types';
import { IGameRoomRepository, CreateGameRoomDto } from '@/lib/interfaces/repositories/IGameRoomRepository';

@injectable()
export class MockGameRoomRepository implements IGameRoomRepository {
  private rooms: Map<string, GameRoom> = new Map();
  private nextId = 1;

  async create(data: CreateGameRoomDto): Promise<GameRoom> {
    const room: GameRoom = {
      id: `room-${this.nextId++}`,
      gameType: data.gameType,
      stake: data.stake,
      creatorId: data.creatorId,
      creatorName: data.creatorName,
      players: [{
        id: data.creatorId,
        name: data.creatorName,
        position: 0,
        isReady: true,
        isAI: false,
        joinedAt: new Date()
      }],
      status: 'waiting',
      maxPlayers: data.maxPlayers,
      minPlayers: data.minPlayers,
      totalPot: data.stake * 10, // En FCFA
      settings: data.settings,
      createdAt: new Date(),
    };

    this.rooms.set(room.id, room);
    return room;
  }

  async findById(id: string): Promise<GameRoom | null> {
    return this.rooms.get(id) || null;
  }

  async findAvailable(gameType?: string, status?: GameRoomStatus): Promise<GameRoom[]> {
    return Array.from(this.rooms.values()).filter(room => {
      if (gameType && room.gameType !== gameType) return false;
      if (status && room.status !== status) return false;
      return room.status === 'waiting';
    });
  }

  async addPlayer(roomId: string, player: RoomPlayer): Promise<GameRoom> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    
    room.players.push(player);
    room.totalPot += room.stake * 10; // En FCFA
    room.updatedAt = new Date();
    
    return room;
  }

  // Autres méthodes...
}
```

## 2. Services de Paiement et Transactions

### Interfaces

#### Fichier: `lib/interfaces/repositories/ITransactionRepository.ts`
```typescript
import { TransactionType, TransactionStatus } from '@prisma/client';

export interface ITransactionRepository {
  create(data: CreateTransactionDto): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findByUserId(userId: string, limit?: number): Promise<Transaction[]>;
  findByReference(reference: string): Promise<Transaction | null>;
  updateStatus(id: string, status: TransactionStatus): Promise<Transaction>;
}

export interface CreateTransactionDto {
  userId: string;
  type: TransactionType;
  amount?: number;
  koras?: number;
  korasBefore: number;
  korasAfter: number;
  description?: string;
  reference?: string;
  gameId?: string;
  status?: TransactionStatus;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount?: number;
  koras?: number;
  korasBefore: number;
  korasAfter: number;
  description?: string;
  reference?: string;
  gameId?: string;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Fichier: `lib/interfaces/services/IPaymentService.ts`
```typescript
export interface IPaymentService {
  processStake(playerId: string, amount: number, roomId: string): Promise<void>;
  processWinning(playerId: string, amount: number, gameId: string): Promise<void>;
  depositKoras(userId: string, amountFCFA: number, paymentReference: string): Promise<void>;
  withdrawKoras(userId: string, korasAmount: number, phoneNumber: string): Promise<void>;
  getPlayerBalance(playerId: string): Promise<number>;
  canAffordStake(playerId: string, stake: number): Promise<boolean>;
  getTransactionHistory(userId: string, limit?: number): Promise<Transaction[]>;
  processCommission(amount: number, gameId: string): Promise<void>;
}
```

### Implémentations

#### Fichier: `lib/services/PaymentService.ts`
```typescript
import { injectable, inject } from 'inversify';
import { IPaymentService } from '@/lib/interfaces/services/IPaymentService';
import { IUserRepository } from '@/lib/interfaces/repositories/IUserRepository';
import { ITransactionRepository, Transaction } from '@/lib/interfaces/repositories/ITransactionRepository';
import { TYPES } from '@/lib/di/types';

@injectable()
export class PaymentService implements IPaymentService {
  private readonly COMMISSION_RATE = 0.10; // 10%
  private readonly KORA_TO_FCFA = 10; // 1 kora = 10 FCFA

  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.TransactionRepository) private transactionRepository: ITransactionRepository
  ) {}

  async processStake(playerId: string, amount: number, roomId: string): Promise<void> {
    const user = await this.userRepository.findById(playerId);
    if (!user) throw new Error('User not found');

    const korasAmount = amount / this.KORA_TO_FCFA;
    if (user.koras < korasAmount) {
      throw new Error('Insufficient balance');
    }

    // Déduire les koras
    await this.userRepository.updateBalance(playerId, -korasAmount);

    // Créer la transaction
    await this.transactionRepository.create({
      userId: playerId,
      type: 'GAME_STAKE',
      koras: korasAmount,
      korasBefore: user.koras,
      korasAfter: user.koras - korasAmount,
      description: `Mise pour la partie ${roomId}`,
      gameId: roomId,
      status: 'COMPLETED'
    });
  }

  async processWinning(playerId: string, amount: number, gameId: string): Promise<void> {
    const user = await this.userRepository.findById(playerId);
    if (!user) throw new Error('User not found');

    // Calculer la commission
    const commission = amount * this.COMMISSION_RATE;
    const netAmount = amount - commission;
    const korasWon = netAmount / this.KORA_TO_FCFA;

    // Ajouter les koras
    await this.userRepository.updateBalance(playerId, korasWon);

    // Créer la transaction de gain
    await this.transactionRepository.create({
      userId: playerId,
      type: 'GAME_WIN',
      koras: korasWon,
      korasBefore: user.koras,
      korasAfter: user.koras + korasWon,
      description: `Gain de la partie ${gameId} (après commission)`,
      gameId: gameId,
      status: 'COMPLETED'
    });

    // Traiter la commission
    await this.processCommission(commission, gameId);
  }

  async depositKoras(userId: string, amountFCFA: number, paymentReference: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const korasToAdd = amountFCFA / this.KORA_TO_FCFA;

    // Ajouter les koras
    await this.userRepository.updateBalance(userId, korasToAdd);

    // Créer la transaction
    await this.transactionRepository.create({
      userId: userId,
      type: 'DEPOSIT',
      amount: amountFCFA,
      koras: korasToAdd,
      korasBefore: user.koras,
      korasAfter: user.koras + korasToAdd,
      description: 'Dépôt Mobile Money',
      reference: paymentReference,
      status: 'COMPLETED'
    });
  }

  async withdrawKoras(userId: string, korasAmount: number, phoneNumber: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.koras < korasAmount) {
      throw new Error('Insufficient balance');
    }

    const amountFCFA = korasAmount * this.KORA_TO_FCFA;
    
    // Appliquer la commission sur les retraits
    const commission = amountFCFA * this.COMMISSION_RATE;
    const netAmount = amountFCFA - commission;

    // Déduire les koras
    await this.userRepository.updateBalance(userId, -korasAmount);

    // Créer la transaction
    const transaction = await this.transactionRepository.create({
      userId: userId,
      type: 'WITHDRAWAL',
      amount: netAmount,
      koras: korasAmount,
      korasBefore: user.koras,
      korasAfter: user.koras - korasAmount,
      description: `Retrait vers ${phoneNumber} (commission: ${commission} FCFA)`,
      status: 'PENDING'
    });

    // Ici, intégrer avec l'API Mobile Money
    // Pour le moment, on simule
    await this.transactionRepository.updateStatus(transaction.id, 'COMPLETED');
  }

  async getPlayerBalance(playerId: string): Promise<number> {
    const user = await this.userRepository.findById(playerId);
    return user?.koras || 0;
  }

  async canAffordStake(playerId: string, stake: number): Promise<boolean> {
    const balance = await this.getPlayerBalance(playerId);
    return balance >= stake;
  }

  async getTransactionHistory(userId: string, limit?: number): Promise<Transaction[]> {
    return this.transactionRepository.findByUserId(userId, limit);
  }

  async processCommission(amount: number, gameId: string): Promise<void> {
    // Ici, on créerait une transaction pour la commission
    // qui irait sur un compte administratif
    await this.transactionRepository.create({
      userId: 'SYSTEM', // Compte système
      type: 'COMMISSION',
      amount: amount,
      description: `Commission sur la partie ${gameId}`,
      gameId: gameId,
      status: 'COMPLETED',
      korasBefore: 0,
      korasAfter: 0
    });
  }
}
```

## 3. Services d'État de Jeu (Game State)

### Interfaces

#### Fichier: `lib/interfaces/services/IGameStateService.ts`
```typescript
import { BaseGameState, Player } from '@/lib/garame/core/types';

export interface IGameStateService {
  saveState(gameState: BaseGameState): Promise<void>;
  loadState(gameId: string): Promise<BaseGameState | null>;
  getCurrentPlayer(): Promise<Player>;
  setCurrentPlayer(player: Player): Promise<void>;
  clearState(gameId: string): Promise<void>;
  getAllActiveGames(): Promise<BaseGameState[]>;
}
```

### Implémentations

#### Fichier: `lib/services/GameStateService.ts`
```typescript
import { injectable, inject } from 'inversify';
import { IGameStateService } from '@/lib/interfaces/services/IGameStateService';
import { IGameStateRepository } from '@/lib/interfaces/repositories/IGameStateRepository';
import { IUserService } from '@/lib/interfaces/services/IUserService';
import { BaseGameState, Player } from '@/lib/garame/core/types';
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

  async loadState(gameId: string): Promise<BaseGameState | null> {
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
    return [];
  }
}
```

## 4. Services d'IA

### Interfaces

#### Fichier: `lib/interfaces/services/IAIService.ts`
```typescript
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
```

### Implémentations

#### Fichier: `lib/services/GarameAIService.ts`
```typescript
import { injectable } from 'inversify';
import { IAIService } from '@/lib/interfaces/services/IAIService';
import { GameAction, BaseGameState } from '@/lib/garame/core/types';
import { GarameState, GarameCard } from '@/lib/garame/games/garame/types';

@injectable()
export class GarameAIService implements IAIService {
  async getNextAction(
    gameState: BaseGameState, 
    playerId: string, 
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<GameAction> {
    const state = gameState as GarameState;
    const playerState = state.players.get(playerId);
    
    if (!playerState) {
      throw new Error('Player not found in game state');
    }

    // Logique d'IA selon la difficulté
    switch (difficulty) {
      case 'easy':
        return this.getEasyAction(state, playerId);
      case 'medium':
        return this.getMediumAction(state, playerId);
      case 'hard':
        return this.getHardAction(state, playerId);
      default:
        return this.getEasyAction(state, playerId);
    }
  }

  private async getEasyAction(state: GarameState, playerId: string): Promise<GameAction> {
    // IA facile : joue de manière aléatoire
    const validActions = this.getValidActionsForPlayer(state, playerId);
    const randomIndex = Math.floor(Math.random() * validActions.length);
    return validActions[randomIndex];
  }

  private async getMediumAction(state: GarameState, playerId: string): Promise<GameAction> {
    // IA moyenne : stratégie basique
    const player = state.players.get(playerId);
    if (!player) throw new Error('Player not found');

    // Si on a une bonne carte, on la joue
    const handCards = player.hand as GarameCard[];
    const goodCard = handCards.find(card => card.value >= 8);
    
    if (goodCard && Math.random() > 0.3) {
      return {
        type: 'play_card',
        playerId,
        data: { cardId: goodCard.id },
        timestamp: new Date()
      };
    }

    // Sinon, on passe
    return {
      type: 'pass',
      playerId,
      data: {},
      timestamp: new Date()
    };
  }

  private async getHardAction(state: GarameState, playerId: string): Promise<GameAction> {
    // IA difficile : stratégie avancée avec bluff
    const shouldBluffNow = this.shouldBluff(state, playerId, 'hard');
    
    if (shouldBluffNow) {
      // Bluffer avec une mauvaise carte
      const player = state.players.get(playerId)!;
      const handCards = player.hand as GarameCard[];
      const worstCard = handCards.reduce((worst, card) => 
        card.value < worst.value ? card : worst
      );
      
      return {
        type: 'play_card',
        playerId,
        data: { cardId: worstCard.id, isBluff: true },
        timestamp: new Date()
      };
    }

    // Jouer stratégiquement
    return this.getStrategicAction(state, playerId);
  }

  evaluatePosition(gameState: BaseGameState, playerId: string): number {
    const state = gameState as GarameState;
    const player = state.players.get(playerId);
    if (!player) return 0;

    // Évaluer la position basée sur les cartes et le score
    const handValue = (player.hand as GarameCard[])
      .reduce((sum, card) => sum + card.value, 0);
    
    return player.score + (handValue * 0.1);
  }

  shouldBluff(gameState: BaseGameState, playerId: string, difficulty: string): boolean {
    if (difficulty === 'easy') return false;
    if (difficulty === 'medium') return Math.random() < 0.1; // 10% de chance
    
    // Pour 'hard', analyser la situation
    const state = gameState as GarameState;
    const player = state.players.get(playerId)!;
    const opponents = Array.from(state.players.values())
      .filter(p => p.id !== playerId && p.isActive);
    
    // Bluffer si on est en retard au score
    const avgOpponentScore = opponents.reduce((sum, p) => sum + p.score, 0) / opponents.length;
    
    return player.score < avgOpponentScore && Math.random() < 0.3;
  }

  private getValidActionsForPlayer(state: GarameState, playerId: string): GameAction[] {
    // Retourner toutes les actions valides pour le joueur
    const player = state.players.get(playerId)!;
    const actions: GameAction[] = [];

    // Action passer
    actions.push({
      type: 'pass',
      playerId,
      data: {},
      timestamp: new Date()
    });

    // Actions jouer carte
    (player.hand as GarameCard[]).forEach(card => {
      actions.push({
        type: 'play_card',
        playerId,
        data: { cardId: card.id },
        timestamp: new Date()
      });
    });

    return actions;
  }

  private getStrategicAction(state: GarameState, playerId: string): GameAction {
    // Implémenter une stratégie avancée
    const player = state.players.get(playerId)!;
    const handCards = player.hand as GarameCard[];
    
    // Trier les cartes par valeur
    const sortedCards = [...handCards].sort((a, b) => b.value - a.value);
    
    // Jouer la meilleure carte si on est en fin de partie
    if (state.turn > 20) {
      return {
        type: 'play_card',
        playerId,
        data: { cardId: sortedCards[0].id },
        timestamp: new Date()
      };
    }

    // Sinon, garder les bonnes cartes pour plus tard
    const mediumCard = sortedCards[Math.floor(sortedCards.length / 2)];
    return {
      type: 'play_card',
      playerId,
      data: { cardId: mediumCard.id },
      timestamp: new Date()
    };
  }
}
```

## 5. Service d'Événements

### Interfaces

#### Fichier: `lib/interfaces/services/IEventBusService.ts`
```typescript
export interface IEventBusService {
  emit(event: string, data: any): Promise<void>;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
  once(event: string, handler: (data: any) => void): void;
}
```

### Implémentations

#### Fichier: `lib/services/EventBusService.ts`
```typescript
import { injectable } from 'inversify';
import { IEventBusService } from '@/lib/interfaces/services/IEventBusService';

@injectable()
export class EventBusService implements IEventBusService {
  private events: Map<string, Set<(data: any) => void>> = new Map();

  async emit(event: string, data: any): Promise<void> {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  on(event: string, handler: (data: any) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  once(event: string, handler: (data: any) => void): void {
    const onceHandler = (data: any) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }
}
```

## 6. Service Mobile Money

### Interfaces

#### Fichier: `lib/interfaces/services/IMobileMoneyService.ts`
```typescript
export interface IMobileMoneyService {
  initiateDeposit(phoneNumber: string, amount: number): Promise<MobileMoneyTransaction>;
  initiateWithdrawal(phoneNumber: string, amount: number): Promise<MobileMoneyTransaction>;
  checkTransactionStatus(transactionId: string): Promise<MobileMoneyStatus>;
  getProviders(): Promise<MobileMoneyProvider[]>;
}

export interface MobileMoneyTransaction {
  id: string;
  reference: string;
  amount: number;
  phoneNumber: string;
  provider: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface MobileMoneyStatus {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
  completedAt?: Date;
}

export interface MobileMoneyProvider {
  id: string;
  name: string;
  logo: string;
  active: boolean;
}
```

### Implémentations

#### Fichier: `lib/services/MobileMoneyService.ts`
```typescript
import { injectable } from 'inversify';
import { 
  IMobileMoneyService, 
  MobileMoneyTransaction, 
  MobileMoneyStatus,
  MobileMoneyProvider 
} from '@/lib/interfaces/services/IMobileMoneyService';

@injectable()
export class MobileMoneyService implements IMobileMoneyService {
  private providers: MobileMoneyProvider[] = [
    { id: 'airtel', name: 'Airtel Money', logo: '/images/airtel-logo.png', active: true },
    { id: 'moov', name: 'Moov Money', logo: '/images/moov-logo.png', active: true },
  ];

  async initiateDeposit(phoneNumber: string, amount: number): Promise<MobileMoneyTransaction> {
    // Intégration avec l'API Mobile Money réelle
    // Pour le moment, simulation
    const transaction: MobileMoneyTransaction = {
      id: `dep-${Date.now()}`,
      reference: `REF${Date.now()}`,
      amount,
      phoneNumber,
      provider: this.detectProvider(phoneNumber),
      status: 'pending',
      createdAt: new Date()
    };

    // Simuler l'appel API
    setTimeout(() => {
      // Marquer comme complété après 5 secondes
      this.updateTransactionStatus(transaction.id, 'completed');
    }, 5000);

    return transaction;
  }

  async initiateWithdrawal(phoneNumber: string, amount: number): Promise<MobileMoneyTransaction> {
    const transaction: MobileMoneyTransaction = {
      id: `wit-${Date.now()}`,
      reference: `REF${Date.now()}`,
      amount,
      phoneNumber,
      provider: this.detectProvider(phoneNumber),
      status: 'pending',
      createdAt: new Date()
    };

    // Simuler l'appel API
    setTimeout(() => {
      this.updateTransactionStatus(transaction.id, 'completed');
    }, 7000);

    return transaction;
  }

  async checkTransactionStatus(transactionId: string): Promise<MobileMoneyStatus> {
    // Vérifier le statut réel via API
    // Pour le moment, simulation
    return {
      transactionId,
      status: 'completed',
      message: 'Transaction réussie',
      completedAt: new Date()
    };
  }

  async getProviders(): Promise<MobileMoneyProvider[]> {
    return this.providers;
  }

  private detectProvider(phoneNumber: string): string {
    // Logique pour détecter l'opérateur basé sur le préfixe
    if (phoneNumber.startsWith('+229')) {
      if (['66', '67', '96', '97'].some(prefix => phoneNumber.includes(prefix))) {
        return 'moov';
      }
      if (['61', '62', '91'].some(prefix => phoneNumber.includes(prefix))) {
        return 'airtel';
      }
    }
    return 'unknown';
  }

  private updateTransactionStatus(transactionId: string, status: 'completed' | 'failed'): void {
    // Mise à jour dans la base de données
    console.log(`Transaction ${transactionId} updated to ${status}`);
  }
}
```

## 7. Mise à jour du Container IoC

### Fichier: `lib/di/types.ts` (mise à jour)
```typescript
export const TYPES = {
  // Repositories
  UserRepository: Symbol.for('UserRepository'),
  GameRoomRepository: Symbol.for('GameRoomRepository'),
  GameStateRepository: Symbol.for('GameStateRepository'),
  TransactionRepository: Symbol.for('TransactionRepository'),
  
  // Services
  UserService: Symbol.for('UserService'),
  AuthService: Symbol.for('AuthService'),
  GameRoomService: Symbol.for('GameRoomService'),
  GameEngineService: Symbol.for('GameEngineService'),
  GameStateService: Symbol.for('GameStateService'),
  PaymentService: Symbol.for('PaymentService'),
  EventBusService: Symbol.for('EventBusService'),
  AIService: Symbol.for('AIService'),
  MobileMoneyService: Symbol.for('MobileMoneyService'),
};
```

### Fichier: `lib/di/container.ts` (mise à jour)
```typescript
import { Container } from 'inversify';
import { TYPES } from './types';

// Toutes les interfaces...
// Toutes les implémentations...

const container = new Container();

// Configuration en fonction de l'environnement
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// Repositories
if (USE_MOCK) {
  // Mocks
  container.bind(TYPES.UserRepository).to(MockUserRepository).inSingletonScope();
  container.bind(TYPES.GameRoomRepository).to(MockGameRoomRepository).inSingletonScope();
  container.bind(TYPES.GameStateRepository).to(MockGameStateRepository).inSingletonScope();
  container.bind(TYPES.TransactionRepository).to(MockTransactionRepository).inSingletonScope();
  container.bind(TYPES.AuthService).to(MockAuthService).inSingletonScope();
  container.bind(TYPES.MobileMoneyService).to(MockMobileMoneyService).inSingletonScope();
} else {
  // Implémentations réelles
  container.bind(TYPES.UserRepository).to(UserRepository).inSingletonScope();
  container.bind(TYPES.GameRoomRepository).to(GameRoomRepository).inSingletonScope();
  container.bind(TYPES.GameStateRepository).to(GameStateRepository).inSingletonScope();
  container.bind(TYPES.TransactionRepository).to(TransactionRepository).inSingletonScope();
  container.bind(TYPES.AuthService).to(AuthService).inSingletonScope();
  container.bind(TYPES.MobileMoneyService).to(MobileMoneyService).inSingletonScope();
}

// Services (toujours les mêmes peu importe l'environnement)
container.bind(TYPES.UserService).to(UserService).inSingletonScope();
container.bind(TYPES.GameRoomService).to(GameRoomService).inSingletonScope();
container.bind(TYPES.GameEngineService).to(GameEngineService).inSingletonScope();
container.bind(TYPES.GameStateService).to(GameStateService).inSingletonScope();
container.bind(TYPES.PaymentService).to(PaymentService).inSingletonScope();
container.bind(TYPES.EventBusService).to(EventBusService).inSingletonScope();
container.bind(TYPES.AIService).to(GarameAIService).inSingletonScope();

export { container };
```

## 8. Hooks personnalisés pour tous les services

### Fichier: `hooks/useInjection.ts` (mise à jour)
```typescript
import { container, TYPES } from '@/lib/di';
import { IUserService } from '@/lib/interfaces/services/IUserService';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';
import { IGameRoomService } from '@/lib/interfaces/services/IGameRoomService';
import { IGameEngineService } from '@/lib/interfaces/services/IGameEngineService';
import { IPaymentService } from '@/lib/interfaces/services/IPaymentService';
import { IEventBusService } from '@/lib/interfaces/services/IEventBusService';
import { IAIService } from '@/lib/interfaces/services/IAIService';
import { IMobileMoneyService } from '@/lib/interfaces/services/IMobileMoneyService';

export function useInjection<T>(serviceIdentifier: symbol): T {
  return container.get<T>(serviceIdentifier);
}

// Hooks spécifiques
export const useUserService = () => useInjection<IUserService>(TYPES.UserService);
export const useAuthService = () => useInjection<IAuthService>(TYPES.AuthService);
export const useGameRoomService = () => useInjection<IGameRoomService>(TYPES.GameRoomService);
export const useGameEngineService = () => useInjection<IGameEngineService>(TYPES.GameEngineService);
export const usePaymentService = () => useInjection<IPaymentService>(TYPES.PaymentService);
export const useEventBus = () => useInjection<IEventBusService>(TYPES.EventBusService);
export const useAIService = () => useInjection<IAIService>(TYPES.AIService);
export const useMobileMoneyService = () => useInjection<IMobileMoneyService>(TYPES.MobileMoneyService);
```

## 9. Exemple d'utilisation complète

### Fichier: `app/(authenticated)/games/create-room.tsx`
```typescript
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGameRoomService, usePaymentService, useEventBus } from '@/hooks/useInjection';
import { toast } from 'sonner';

export default function CreateRoomPage() {
  const router = useRouter();
  const gameRoomService = useGameRoomService();
  const paymentService = usePaymentService();
  const eventBus = useEventBus();
  
  const [stake, setStake] = useState(100);
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      
      // Vérifier le solde
      const canAfford = await paymentService.canAffordStake('current-user', stake);
      if (!canAfford) {
        toast.error('Solde insuffisant');
        return;
      }

      // Créer la salle
      const room = await gameRoomService.createRoom('garame', stake);
      
      // Émettre l'événement
      await eventBus.emit('room.created', { room });
      
      toast.success('Salle créée avec succès');
      router.push(`/games/garame/room/${room.id}`);
    } catch (error) {
      toast.error('Erreur lors de la création de la salle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Créer une partie</h1>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="stake">Mise (en koras)</Label>
          <Input
            id="stake"
            type="number"
            min={10}
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Équivalent: {stake * 10} FCFA
          </p>
        </div>

        <Button 
          onClick={handleCreateRoom}
          disabled={loading || stake < 10}
          className="w-full"
        >
          {loading ? 'Création...' : 'Créer la salle'}
        </Button>
      </div>
    </div>
  );
}
```

## 10. Tests unitaires

### Fichier: `__tests__/services/PaymentService.test.ts`
```typescript
import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '@/lib/di/types';
import { IPaymentService } from '@/lib/interfaces/services/IPaymentService';
import { IUserRepository } from '@/lib/interfaces/repositories/IUserRepository';
import { ITransactionRepository } from '@/lib/interfaces/repositories/ITransactionRepository';
import { PaymentService } from '@/lib/services/PaymentService';
import { MockUserRepository } from '@/lib/repositories/MockUserRepository';
import { MockTransactionRepository } from '@/lib/repositories/MockTransactionRepository';

describe('PaymentService', () => {
  let container: Container;
  let paymentService: IPaymentService;

  beforeEach(() => {
    container = new Container();
    container.bind(TYPES.UserRepository).to(MockUserRepository);
    container.bind(TYPES.TransactionRepository).to(MockTransactionRepository);
    container.bind(TYPES.PaymentService).to(PaymentService);
    
    paymentService = container.get(TYPES.PaymentService);
  });

  test('should process stake correctly', async () => {
    const playerId = 'test-user-1';
    const amount = 1000; // 1000 FCFA = 100 koras
    const roomId = 'room-1';

    await paymentService.processStake(playerId, amount, roomId);
    
    const balance = await paymentService.getPlayerBalance(playerId);
    expect(balance).toBe(900); // 1000 - 100
  });

  test('should throw error for insufficient balance', async () => {
    const playerId = 'test-user-1';
    const amount = 20000; // Plus que le solde
    const roomId = 'room-1';

    await expect(
      paymentService.processStake(playerId, amount, roomId)
    ).rejects.toThrow('Insufficient balance');
  });

  test('should process winnings with commission', async () => {
    const playerId = 'test-user-1';
    const amount = 2000; // 2000 FCFA
    const gameId = 'game-1';

    const initialBalance = await paymentService.getPlayerBalance(playerId);
    await paymentService.processWinning(playerId, amount, gameId);
    
    const finalBalance = await paymentService.getPlayerBalance(playerId);
    const expectedGain = (amount * 0.9) / 10; // 90% après commission, converti en koras
    
    expect(finalBalance).toBe(initialBalance + expectedGain);
  });
});
```

## Structure finale des dossiers

```
lib/
├── interfaces/
│   ├── repositories/
│   │   ├── IUserRepository.ts
│   │   ├── IGameRoomRepository.ts
│   │   ├── IGameStateRepository.ts
│   │   └── ITransactionRepository.ts
│   └── services/
│       ├── IUserService.ts
│       ├── IAuthService.ts
│       ├── IGameRoomService.ts
│       ├── IGameEngineService.ts
│       ├── IGameStateService.ts
│       ├── IPaymentService.ts
│       ├── IEventBusService.ts
│       ├── IAIService.ts
│       └── IMobileMoneyService.ts
├── repositories/
│   ├── UserRepository.ts
│   ├── MockUserRepository.ts
│   ├── GameRoomRepository.ts
│   ├── MockGameRoomRepository.ts
│   ├── GameStateRepository.ts
│   ├── MockGameStateRepository.ts
│   ├── TransactionRepository.ts
│   └── MockTransactionRepository.ts
├── services/
│   ├── UserService.ts
│   ├── AuthService.ts
│   ├── MockAuthService.ts
│   ├── GameRoomService.ts
│   ├── GameEngineService.ts
│   ├── GameStateService.ts
│   ├── PaymentService.ts
│   ├── EventBusService.ts
│   ├── GarameAIService.ts
│   ├── MobileMoneyService.ts
│   └── MockMobileMoneyService.ts
└── di/
    ├── types.ts
    ├── container.ts
    └── index.ts
```

## Conclusion

Cette architecture offre :

1. **Découplage total** entre la logique métier et l'infrastructure
2. **Testabilité maximale** avec des mocks pour tous les services
3. **Développement sans backend** complet
4. **Extensibilité** pour ajouter de nouveaux jeux facilement
5. **Maintenabilité** avec une structure claire et organisée

Vous pouvez maintenant développer toute l'application en mode mock, puis basculer progressivement vers les implémentations réelles service par service.