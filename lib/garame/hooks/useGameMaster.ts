'use client';

import { useEffect, useState } from "react";
import { useGameEngine } from "../hooks/use-game-engine";
import { useGameStateService, useEventBus } from "@/hooks/useInjection";
import { toast } from "sonner";

interface UseGameMasterOptions {
  gameId: string;
  playerId: string;
  onGameEnd?: (winnerId: string, gain: number) => void;
}

export function useGameMaster({ gameId, playerId, onGameEnd }: UseGameMasterOptions) {
  const [timer, setTimer] = useState(30);
  const { engine, executeAction } = useGameEngine('garame');
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<any>(null);
  
  const gameStateService = useGameStateService();
  const eventBus = useEventBus();

  // Fetch initial game state
  useEffect(() => {
    async function fetchGameState() {
      setLoading(true);
      try {
        const state = await gameStateService.getGameState(gameId);
        setGameState(state);
      } catch (error) {
        toast.error("Impossible de charger la partie.");
      } finally {
        setLoading(false);
      }
    }
    fetchGameState();
  }, [gameId, gameStateService]);

  // Subscribe to game events
  useEffect(() => {
    if (!gameId) return;
    
    const handleGameEvent = (event: any) => {
      if (event.type === 'game_state_updated' && event.gameId === gameId) {
        const newState = event.data;
        setGameState(newState);
        setTimer(30);
        if (newState.status === 'finished' && newState.winnerId && onGameEnd) {
          const gain = newState.winnerId === playerId ? Math.floor(newState.pot * 0.9) : 0;
          onGameEnd(newState.winnerId, gain);
        }
      }
    };
    
    eventBus.on(`game.${gameId}.updated`, handleGameEvent);
    return () => eventBus.off(`game.${gameId}.updated`, handleGameEvent);
  }, [gameId, onGameEnd, playerId, eventBus]);

  async function playCard(cardIndex: number) {
    if (!gameState) {
      toast.error("Le jeu n'a pas encore commencé");
      return;
    }
    if (gameState.currentTurnPlayerId !== playerId) {
      toast.error("Ce n'est pas votre tour de jouer");
      return;
    }
    const playerState = gameState.players.get(playerId);
    const card = playerState?.cards[cardIndex];
    if (!card) {
      toast.error("Cette carte n'est pas dans votre main");
      return;
    }
    
    try {
      await executeAction(gameState.id, {
        type: 'play_card',
        playerId,
        data: { cardIndex, card },
        timestamp: new Date()
      });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du jeu de la carte");
    }
  }
  
  return { gameState, loading, playCard, timer };
}