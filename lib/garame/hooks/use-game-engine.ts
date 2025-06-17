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
      console.log('Partie créée:', room);
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