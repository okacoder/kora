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