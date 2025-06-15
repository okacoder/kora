'use client';

import { useEffect, useState } from "react";
import { useGarameServices } from "../infrastructure/garame-provider";
import { IGameState } from "../domain/interfaces";
import { tryCatch } from "@/lib/utils";
import { toast } from "sonner";

interface UseGameMasterOptions {
  gameId: string;
  playerId: string;
  onGameEnd?: (winnerId: string) => void;
}

export function useGameMaster({ gameId, playerId }: UseGameMasterOptions) {
  const [timer, setTimer] = useState(30);
  const { gameService, paymentService, eventHandler } = useGarameServices();
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<IGameState | null>(null);

  async function startGame() {
    const { error, data } = await tryCatch(gameService.startGame(gameId));

    if (error) {
      toast.error(error.message);
      return;
    }

    setTimer(30);
    setGameState(data);
  }

  async function playCard(cardIndex: number) {
    setLoading(true);

    if (!gameState) {
      toast.error("Le jeu n'a pas encore commencé");
      return;
    }

    if (gameState.currentTurnPlayerId !== playerId) {
      toast.error("Ce n'est pas votre tour de jouer");
      return;
    }

    const card = gameState.players.get(playerId)?.cards[cardIndex];

    if (!card) {
      toast.error("Cette carte n'est pas dans votre main");
      return;
    }

    if (!card.canBePlayed) {
      toast.error("Vous ne pouvez pas jouer cette carte");
      return;
    }

    const { error, data } = await tryCatch(gameService.playCard(gameId, cardIndex));
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    
    setGameState(data);
    setTimer(30);
    setLoading(false);
  }
  
  return { gameState, loading, startGame, playCard, timer };
}