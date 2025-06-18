"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { GameRoom, BaseGameState } from "@/lib/garame/core/types";
import { useGameRoomService, useGameStateService, useEventBus } from "@/hooks/useInjection";

interface GameContextType {
  currentRoom: GameRoom | null;
  currentGameState: BaseGameState | null;
  activeRooms: GameRoom[];
  loading: boolean;
  error: Error | null;
  setCurrentRoom: (room: GameRoom | null) => void;
  setCurrentGameState: (state: BaseGameState | null) => void;
  refreshActiveRooms: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [currentGameState, setCurrentGameState] = useState<BaseGameState | null>(null);
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const gameRoomService = useGameRoomService();
  const gameStateService = useGameStateService();
  const eventBus = useEventBus();

  useEffect(() => {
    // Subscribe to game events
    const handleRoomUpdate = (data: any) => {
      if (data.room && currentRoom?.id === data.room.id) {
        setCurrentRoom(data.room);
      }
      // Refresh active rooms when any room is updated
      refreshActiveRooms();
    };

    const handleGameStateUpdate = (data: any) => {
      if (data.state && currentGameState?.id === data.state.id) {
        setCurrentGameState(data.state);
      }
    };

    const handleGameEnd = (data: any) => {
      if (data.gameId === currentGameState?.id) {
        setCurrentGameState(null);
        setCurrentRoom(null);
      }
    };

    eventBus.on('room.updated', handleRoomUpdate);
    eventBus.on('room.created', handleRoomUpdate);
    eventBus.on('room.player_joined', handleRoomUpdate);
    eventBus.on('room.player_left', handleRoomUpdate);
    eventBus.on('game.state_updated', handleGameStateUpdate);
    eventBus.on('game.ended', handleGameEnd);

    // Initial load
    refreshActiveRooms();

    return () => {
      eventBus.off('room.updated', handleRoomUpdate);
      eventBus.off('room.created', handleRoomUpdate);
      eventBus.off('room.player_joined', handleRoomUpdate);
      eventBus.off('room.player_left', handleRoomUpdate);
      eventBus.off('game.state_updated', handleGameStateUpdate);
      eventBus.off('game.ended', handleGameEnd);
    };
  }, [currentRoom?.id, currentGameState?.id]);

  const refreshActiveRooms = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the service
      // For now, we'll just set an empty array
      setActiveRooms([]);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      setLoading(true);
      const room = await gameRoomService.joinRoom(roomId);
      setCurrentRoom(room);
      setError(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async (roomId: string) => {
    try {
      setLoading(true);
      await gameRoomService.leaveRoom(roomId);
      if (currentRoom?.id === roomId) {
        setCurrentRoom(null);
        setCurrentGameState(null);
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <GameContext.Provider
      value={{
        currentRoom,
        currentGameState,
        activeRooms,
        loading,
        error,
        setCurrentRoom,
        setCurrentGameState,
        refreshActiveRooms,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
};