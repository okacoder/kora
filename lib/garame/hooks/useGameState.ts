"use client";

import { useState, useEffect, useCallback } from "react";
import { useGarameServices } from "../infrastructure/garame-provider";
import { IGameState, IGameEvent, ICard, InvalidMoveError } from "../domain/interfaces";
import { toast } from "sonner";


interface UseGameStateOptions {
  gameId: string;
  playerId: string;
  onGameEnd?: (winnerId: string) => void;
}

export function useGameState({ gameId, playerId, onGameEnd }: UseGameStateOptions) {
  const { gameService, eventHandler } = useGarameServices();
  
  const [gameState, setGameState] = useState<IGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Charger l'état initial du jeu
  useEffect(() => {
    loadGameState();
  }, [gameId]);
  
  // S'abonner aux événements du jeu
  useEffect(() => {
    if (!gameState) return;
    
    const handleGameEvent = (event: IGameEvent) => {
      switch (event.type) {
        case 'card_played':
          // Recharger l'état du jeu
          loadGameState();
          setTimeLeft(30); // Réinitialiser le timer
          break;
          
        case 'kora_passed':
          loadGameState();
          setTimeLeft(30);
          break;
          
        case 'game_ended':
          if (onGameEnd) {
            onGameEnd(event.data.winnerId);
          }
          break;
      }
    };
    
    eventHandler.subscribe(gameState.roomId, handleGameEvent);
    
    return () => {
      eventHandler.unsubscribe(gameState.roomId);
    };
  }, [gameState, eventHandler, onGameEnd]);
  
  // Timer pour le tour
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    if (gameState.currentTurnPlayerId !== playerId) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Temps écoulé, jouer automatiquement une carte
          handleTimeout();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState, playerId]);
  
  const loadGameState = async () => {
    try {
      setLoading(true);
      const state = await gameService.getGameState(gameId);
      if (state) {
        setGameState(state);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'état du jeu:", error);
      toast.error("Impossible de charger la partie");
    } finally {
      setLoading(false);
    }
  };
  
  const handleTimeout = async () => {
    if (!gameState) return;
    
    const playerState = gameState.players.get(playerId);
    if (!playerState || playerState.cards.length === 0) return;
    
    // Jouer la première carte valide
    for (let i = 0; i < playerState.cards.length; i++) {
      if (canPlayCard(playerState.cards[i])) {
        await playCard(i);
        toast.warning("Temps écoulé ! Une carte a été jouée automatiquement.");
        return;
      }
    }
  };
  
  const canPlayCard = (card: ICard): boolean => {
    if (!gameState) return false;
    
    const playerState = gameState.players.get(playerId);
    if (!playerState) return false;
    
    // Si c'est le premier tour ou pas de carte jouée
    if (!gameState.currentSuit) return true;
    
    // Si le joueur a la kora, il peut jouer n'importe quelle carte
    if (playerState.hasKora) return true;
    
    // Sinon, il doit jouer la même famille si possible
    const hasSameSuit = playerState.cards.some(c => c.suit === gameState.currentSuit);
    if (hasSameSuit) {
      return card.suit === gameState.currentSuit;
    }
    
    // S'il n'a pas la famille demandée, il peut jouer n'importe quelle carte
    return true;
  };
  
  const playCard = useCallback(async (cardIndex: number) => {
    if (!gameState) return;
    
    try {
      const newState = await gameService.playCard(gameId, cardIndex);
      setGameState(newState);
      setTimeLeft(30);
    } catch (error) {
      if (error instanceof InvalidMoveError) {
        toast.error(error.message);
      } else {
        toast.error("Impossible de jouer cette carte");
      }
    }
  }, [gameState, gameId, gameService]);
  
  const passKora = useCallback(async () => {
    if (!gameState) return;
    
    const playerState = gameState.players.get(playerId);
    if (!playerState?.hasKora) return;
    
    try {
      await gameService.passKora(gameId);
      await loadGameState();
      setTimeLeft(30);
      toast.info("Vous avez passé la main");
    } catch (error) {
      toast.error("Impossible de passer la kora");
    }
  }, [gameState, gameId, playerId, gameService]);
  
  return {
    gameState,
    loading,
    timeLeft,
    canPlayCard,
    playCard,
    passKora,
    isMyTurn: gameState?.currentTurnPlayerId === playerId,
  };
}

// Hook pour simuler le jeu de l'adversaire (IA)
export function useOpponentAI(gameState: IGameState | null, opponentId: string) {
  const { gameService } = useGarameServices();
  
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    if (gameState.currentTurnPlayerId !== opponentId) return;
    
    // Simuler un délai de réflexion
    const timeout = setTimeout(async () => {
      await simulateOpponentMove();
    }, 2000 + Math.random() * 2000); // Entre 2 et 4 secondes
    
    return () => clearTimeout(timeout);
  }, [gameState]);
  
  const simulateOpponentMove = async () => {
    if (!gameState) return;
    
    const opponentState = gameState.players.get(opponentId);
    if (!opponentState) return;
    
    // Stratégie simple : jouer la première carte valide
    const validMoves = opponentState.cards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => {
        if (!gameState.currentSuit) return true;
        if (opponentState.hasKora) return true;
        
        const hasSameSuit = opponentState.cards.some(c => c.suit === gameState.currentSuit);
        if (hasSameSuit) {
          return card.suit === gameState.currentSuit;
        }
        return true;
      });
    
    if (validMoves.length > 0) {
      // Choisir une carte au hasard parmi les coups valides
      const move = validMoves[Math.floor(Math.random() * validMoves.length)];
      
      try {
        await gameService.playCard(gameState.id, move.index);
      } catch (error) {
        console.error("Erreur IA:", error);
      }
    }
  };
}