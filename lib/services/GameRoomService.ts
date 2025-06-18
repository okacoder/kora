import { injectable, inject } from 'inversify';
import { IGameRoomService } from '@/lib/interfaces/services/IGameRoomService';
import { IGameRoomRepository } from '@/lib/interfaces/repositories/IGameRoomRepository';
import { IUserService } from '@/lib/interfaces/services/IUserService';
import { IPaymentService } from '@/lib/interfaces/services/IPaymentService';
import { IGameEngineService } from '@/lib/interfaces/services/IGameEngineService';
import { GameRoom, RoomPlayer } from '@/lib/garame/core/types';
import { TYPES } from '@/lib/di/types';

@injectable()
export class GameRoomService implements IGameRoomService {
  constructor(
    @inject(TYPES.GameRoomRepository) private gameRoomRepository: IGameRoomRepository,
    @inject(TYPES.UserService) private userService: IUserService,
    @inject(TYPES.PaymentService) private paymentService: IPaymentService,
    @inject(TYPES.GameEngineService) private gameEngineService: IGameEngineService
  ) {}

  async createRoom(gameType: string, stake: number, settings?: any): Promise<GameRoom> {
    const user = await this.userService.getCurrentUser();
    
    // Vérifier que l'utilisateur peut se permettre la mise
    const canAfford = await this.paymentService.canAffordStake(user.id, stake);
    if (!canAfford) {
      throw new Error('Insufficient balance to create room');
    }

    // Créer la salle
    const room = await this.gameRoomRepository.create({
      gameType,
      stake,
      creatorId: user.id,
      creatorName: user.name,
      maxPlayers: settings?.maxPlayers || 4,
      minPlayers: settings?.minPlayers || 2,
      settings
    });

    // Traiter la mise du créateur
    await this.paymentService.processStake(user.id, stake, room.id); // stake en koras

    return room;
  }

  async joinRoom(roomId: string, asAI?: boolean, aiDifficulty?: 'easy' | 'medium' | 'hard'): Promise<GameRoom> {
    const room = await this.gameRoomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');
    
    if (room.status !== 'waiting') {
      throw new Error('Room is not accepting new players');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    let player: RoomPlayer;
    
    if (asAI) {
      // Créer un joueur IA
      player = {
        id: `ai-${Date.now()}`,
        name: `AI ${aiDifficulty || 'medium'}`,
        position: room.players.length,
        isReady: true,
        isAI: true,
        aiDifficulty,
        joinedAt: new Date()
      };
    } else {
      // Joueur humain
      const user = await this.userService.getCurrentUser();
      
      // Vérifier que le joueur n'est pas déjà dans la salle
      if (room.players.some(p => p.id === user.id)) {
        throw new Error('Already in this room');
      }

      // Vérifier le solde
      const canAfford = await this.paymentService.canAffordStake(user.id, room.stake);
      if (!canAfford) {
        throw new Error('Insufficient balance to join room');
      }

      // Traiter la mise
      await this.paymentService.processStake(user.id, room.stake, room.id);

      player = {
        id: user.id,
        name: user.name,
        position: room.players.length,
        isReady: false,
        isAI: false,
        joinedAt: new Date()
      };
    }

    return await this.gameRoomRepository.addPlayer(roomId, player);
  }

  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    const room = await this.gameRoomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');

    if (room.status !== 'waiting') {
      throw new Error('Cannot leave room once game has started');
    }

    await this.gameRoomRepository.removePlayer(roomId, playerId);

    // Si c'était le créateur et qu'il n'y a plus de joueurs, supprimer la salle
    if (playerId === room.creatorId && room.players.length === 1) {
      await this.gameRoomRepository.delete(roomId);
    }
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    return this.gameRoomRepository.findById(roomId);
  }

  async getAvailableRooms(gameType?: string): Promise<GameRoom[]> {
    return this.gameRoomRepository.findAvailable(gameType, 'waiting');
  }

  async getUserRooms(userId: string): Promise<GameRoom[]> {
    return this.gameRoomRepository.findByCreatorId(userId);
  }

  async setPlayerReady(roomId: string, playerId: string, ready: boolean): Promise<void> {
    await this.gameRoomRepository.updatePlayerStatus(roomId, playerId, ready);
  }

  async canStartGame(roomId: string): Promise<boolean> {
    const room = await this.gameRoomRepository.findById(roomId);
    if (!room) return false;

    // Vérifier le nombre minimum de joueurs
    if (room.players.length < room.minPlayers) return false;

    // Vérifier que tous les joueurs sont prêts
    return room.players.every(p => p.isReady);
  }

  async startGame(roomId: string): Promise<string> {
    const room = await this.gameRoomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');

    const canStart = await this.canStartGame(roomId);
    if (!canStart) {
      throw new Error('Cannot start game: not all players are ready or minimum players not met');
    }

    // Mettre à jour le statut de la salle
    await this.gameRoomRepository.update(roomId, { status: 'starting' });

    // Créer la partie
    const gameState = await this.gameEngineService.createGame(room);

    // Mettre à jour la salle avec l'ID de l'état du jeu
    await this.gameRoomRepository.update(roomId, { 
      status: 'in_progress',
      gameStateId: gameState.id 
    });

    return gameState.id;
  }

  async cancelRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.gameRoomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');

    if (room.creatorId !== userId) {
      throw new Error('Only the creator can cancel the room');
    }

    if (room.status !== 'waiting') {
      throw new Error('Cannot cancel room once game has started');
    }

    // TODO: Rembourser les mises des joueurs

    await this.gameRoomRepository.update(roomId, { status: 'cancelled' });
  }
}