"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { GameRoom, GameState } from "@prisma/client";
import { gameService } from "@/lib/services/game.service";
import { useGame } from "@/hooks/useGame";
import { useCurrentUser } from "@/hooks/useUser";

// Extended types to include relations
interface GameRoomWithPlayers extends GameRoom {
  players: any[];
}

interface GameStateWithRelations extends GameState {
  room?: GameRoomWithPlayers;
}

interface GameContextType {
  currentRoom: GameRoomWithPlayers | null;
  currentGameState: GameStateWithRelations | null;
  activeRooms: GameRoomWithPlayers[];
  loading: boolean;
  error: Error | null;
  setCurrentRoom: (room: GameRoomWithPlayers | null) => void;
  setCurrentGameState: (state: GameStateWithRelations | null) => void;
  refreshActiveRooms: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [currentRoom, setCurrentRoom] = useState<GameRoomWithPlayers | null>(null);
  const [currentGameState, setCurrentGameState] = useState<GameStateWithRelations | null>(null);
  const [activeRooms, setActiveRooms] = useState<GameRoomWithPlayers[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useCurrentUser();
  const { joinRoom: joinGameRoom, error: gameError } = useGame();

  useEffect(() => {
    // Initial load
    if (user) {
      refreshActiveRooms();
    }
  }, [user]);

  // Set error from game hook
  useEffect(() => {
    if (gameError) {
      setError(gameError);
    }
  }, [gameError]);

  const refreshActiveRooms = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const rooms = await gameService.getAvailableRooms();
      setActiveRooms(rooms as GameRoomWithPlayers[]);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const room = await joinGameRoom(roomId, user.id);
      setCurrentRoom(room as GameRoomWithPlayers);
      setError(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async (roomId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      // This functionality needs to be implemented in the game service
      // For now, we'll just set the current room to null
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

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within GameProvider");
  }
  return context;
};