'use client';

import { useEffect, useState } from "react";
import { useGarameServices } from "../infrastructure/garame-provider";
import { IGameState, IGameEvent } from "../domain/interfaces";
import { tryCatch } from "@/lib/utils";
import { toast } from "sonner";

interface UseGameMasterOptions {
  gameId: string;
  playerId: string;
  onGameEnd?: (winnerId: string, gain: number) => void;
}

export function useGameMaster({ gameId, playerId, onGameEnd }: UseGameMasterOptions) {
  const [timer, setTimer] = useState(30);
  const { gameService, eventHandler } = useGarameServices();
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<IGameState | null>(null);

  // Fetch initial game state
  useEffect(() => {
    async function fetchGameState() {
      setLoading(true);
      const { data, error } = await tryCatch(gameService.getGameState(gameId));
      if (error || !data) {
        toast.error("Impossible de charger la partie.");
        return;
      }
      setGameState(data);
      setLoading(false);
    }
    fetchGameState();
  }, [gameId, gameService]);

  // Subscribe to game events
  useEffect(() => {
    if (!gameId) return;

    const handleGameEvent = (event: IGameEvent) => {
      if (event.type === 'game_state_updated' && event.gameId === gameState?.roomId) {
        const newState = event.data as IGameState;
        setGameState(newState);
        setTimer(30);

        if (newState.status === 'finished' && newState.winnerId && onGameEnd) {
          const gain = newState.winnerId === playerId ? Math.floor(newState.pot * 0.9) : 0;
          onGameEnd(newState.winnerId, gain);
        }
      }
    };

    eventHandler.subscribe(gameState?.roomId ?? gameId, handleGameEvent);
    return () => eventHandler.unsubscribe(gameState?.roomId ?? gameId);
  }, [gameId, gameState?.roomId, eventHandler, onGameEnd, playerId]);


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

    if (!card.canBePlayed) {
      toast.error("Vous ne pouvez pas jouer cette carte");
      return;
    }

    // L'état est mis à jour via l'event, pas besoin de `setGameState` ici.
    const { error } = await tryCatch(gameService.playCard(gameState.id, cardIndex));
    
    if (error) {
      toast.error(error.message);
    }
  }
  
  return { gameState, loading, playCard, timer };
}