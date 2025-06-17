import { useState, useEffect, useCallback } from 'react';
import { useGameEngine } from '../../../hooks/use-game-engine';
import { globalEventBus } from '../../../core/event-bus';
import { gameStore } from '../../../core/game-store';
import { GarameGameState } from '../garame-types';
import { GarameRules } from '../garame-rules';
import { GameRoom, BaseGameState } from '../../../core/types';

interface UseGarameGameProps {
  roomId?: string;
  gameId?: string;
}

export function useGarameGame({ roomId, gameId }: UseGarameGameProps) {
  const { engine, executeAction } = useGameEngine('garame');
  const [gameState, setGameState] = useState<GarameGameState | null>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get current player
        const player = await gameStore.getCurrentPlayer();
        setCurrentPlayer(player);

        // Load room if roomId provided
        if (roomId) {
          const roomData = await gameStore.getRoom(roomId);
          setRoom(roomData);
        }

        // Load game state if gameId provided
        if (gameId) {
          const state = await gameStore.getGameState(gameId);
          if (state) {
            setGameState(state as GarameGameState);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [roomId, gameId]);

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return;

    const handleGameUpdate = (data: { gameState: BaseGameState }) => {
      setGameState(data.gameState as GarameGameState);
    };

    globalEventBus.on(`game.${gameId}.updated`, handleGameUpdate);

    return () => {
      globalEventBus.off(`game.${gameId}.updated`, handleGameUpdate);
    };
  }, [gameId]);

  // Play a card
  const playCard = useCallback(async (cardIndex: number) => {
    if (!gameState || !currentPlayer) return;

    try {
      const newState = await executeAction(gameState.id, {
        type: 'play_card',
        playerId: currentPlayer.id,
        data: {
          cardIndex,
          card: (gameState.players.get(currentPlayer.id) as any)?.cards[cardIndex]
        }
      });

      setGameState(newState as GarameGameState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du coup');
    }
  }, [gameState, currentPlayer, executeAction]);

  // Pass Kora to another player
  const passKora = useCallback(async (targetPlayerId: string) => {
    if (!gameState || !currentPlayer) return;

    try {
      const newState = await executeAction(gameState.id, {
        type: 'pass_kora',
        playerId: currentPlayer.id,
        data: {
          targetPlayerId
        }
      });

      setGameState(newState as GarameGameState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du passage de Kora');
    }
  }, [gameState, currentPlayer, executeAction]);

  // Get valid moves for current player
  const getValidMoves = useCallback(() => {
    if (!gameState || !currentPlayer) return [];

    return GarameRules.getPlayableCards(gameState, currentPlayer.id);
  }, [gameState, currentPlayer]);

  // Check if it's current player's turn
  const isMyTurn = gameState?.currentPlayerId === currentPlayer?.id;

  // Get player names map
  const getPlayerNames = useCallback(() => {
    const names = new Map<string, string>();
    
    if (room) {
      room.players.forEach(player => {
        names.set(player.id, player.name);
      });
    }

    return names;
  }, [room]);

  return {
    gameState,
    room,
    currentPlayer,
    loading,
    error,
    isMyTurn,
    playCard,
    passKora,
    getValidMoves,
    getPlayerNames
  };
}