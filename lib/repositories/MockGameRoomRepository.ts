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
      totalPot: data.stake, // En koras
      settings: data.settings,
      createdAt: new Date(),
    };

    this.rooms.set(room.id, room);
    return room;
  }

  async findById(id: string): Promise<GameRoom | null> {
    return this.rooms.get(id) || null;
  }

  async findByCreatorId(creatorId: string): Promise<GameRoom[]> {
    return Array.from(this.rooms.values()).filter(room => room.creatorId === creatorId);
  }

  async findAvailable(gameType?: string, status?: GameRoomStatus): Promise<GameRoom[]> {
    return Array.from(this.rooms.values()).filter(room => {
      if (gameType && room.gameType !== gameType) return false;
      if (status && room.status !== status) return false;
      return room.status === 'waiting';
    });
  }

  async update(id: string, data: Partial<GameRoom>): Promise<GameRoom> {
    const room = this.rooms.get(id);
    if (!room) throw new Error('Room not found');
    
    const updatedRoom = {
      ...room,
      ...data,
      updatedAt: new Date()
    };
    
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async delete(id: string): Promise<void> {
    this.rooms.delete(id);
  }

  async addPlayer(roomId: string, player: RoomPlayer): Promise<GameRoom> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    
    room.players.push(player);
    room.totalPot += room.stake; // En koras
    room.updatedAt = new Date();
    
    return room;
  }

  async removePlayer(roomId: string, playerId: string): Promise<GameRoom> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    
    room.players = room.players.filter(p => p.id !== playerId);
    room.totalPot = Math.max(0, room.totalPot - room.stake);
    room.updatedAt = new Date();
    
    return room;
  }

  async updatePlayerStatus(roomId: string, playerId: string, isReady: boolean): Promise<GameRoom> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = isReady;
      room.updatedAt = new Date();
    }
    
    return room;
  }
}