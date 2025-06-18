'use client';

import { useState, useCallback } from 'react';
import { GameRoom } from '@prisma/client';
import { gameService, CreateRoomDto } from '@/lib/services/game.service';

export function useGame() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createRoom = useCallback(async (userId: string, data: CreateRoomDto) => {
    try {
      setLoading(true);
      setError(null);
      const room = await gameService.createRoom(userId, data);
      return room;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (roomId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const room = await gameService.joinRoom(roomId, userId);
      return room;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailableRooms = useCallback(async (gameType?: string) => {
    try {
      setLoading(true);
      setError(null);
      const rooms = await gameService.getAvailableRooms(gameType);
      return rooms;
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createRoom,
    joinRoom,
    getAvailableRooms,
    getRoom: gameService.getRoom,
    getUserRooms: gameService.getUserRooms,
    setPlayerReady: gameService.setPlayerReady,
    startGame: gameService.startGame,
  };
} 