'use client';

import { useState, useEffect } from 'react';
import { GameStateStatus } from '@prisma/client';
import { gameStateService } from '@/lib/services/game-state.service';

export function useGameState(gameId: string) {
  const [gameState, setGameState] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadGameState();
    // Poll for updates every 2 seconds
    const interval = setInterval(loadGameState, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  const loadGameState = async () => {
    try {
      setError(null);
      const state = await gameStateService.getGameState(gameId);
      if (!state) {
        throw new Error('Game state not found');
      }
      setGameState(state);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const processAction = async (action: any) => {
    try {
      setError(null);
      const updatedState = await gameStateService.processAction(gameId, action);
      setGameState(updatedState);
      return updatedState;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const isAITurn = async () => {
    try {
      return await gameStateService.isAITurn(gameId);
    } catch (err: any) {
      setError(err);
      return false;
    }
  };

  const getNextAIMove = async () => {
    try {
      return await gameStateService.getNextAIMove(gameId);
    } catch (err: any) {
      setError(err);
      return null;
    }
  };

  return {
    gameState,
    loading,
    error,
    processAction,
    isAITurn,
    getNextAIMove,
  };
} 