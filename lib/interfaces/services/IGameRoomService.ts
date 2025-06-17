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