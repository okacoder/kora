"use client";

import { useCallback, useState } from "react";
import { CardState } from "@/components/game/enhanced-playing-card";
import { GarameCard } from "@/lib/game-engine/games/garame/GarameState";

interface GameState {
  phase?: 'dealing' | 'playing' | 'resolving' | 'ended';
  isMyTurn?: boolean;
  playableCards?: string[];
  tableCards?: any[];
  players?: Map<string, any> | Record<string, any>;
}

interface UseCardAnimationReturn {
  getCardState: (card: GarameCard, isMyCard: boolean, isSelected?: boolean) => CardState;
  playCardAnimation: (cardId: string, targetPosition: { x: number; y: number }) => Promise<void>;
  animationPhase: 'dealing' | 'playing' | 'resolving';
  setAnimationPhase: (phase: 'dealing' | 'playing' | 'resolving') => void;
}

export function useCardAnimation(
  gameState?: GameState,
  selectedCard?: string | null
): UseCardAnimationReturn {
  const [animationPhase, setAnimationPhase] = useState<'dealing' | 'playing' | 'resolving'>('dealing');

  const getCardState = useCallback((
    card: GarameCard, 
    isMyCard: boolean, 
    isSelected?: boolean
  ): CardState => {
    // Phase de distribution
    if (gameState?.phase === 'dealing' || animationPhase === 'dealing') {
      return 'dealing';
    }

    // Cartes des autres joueurs
    if (!isMyCard) {
      return 'in-hand';
    }

    // Mes cartes
    if (isSelected || selectedCard === card.id) {
      return 'selected';
    }

    // Si c'est mon tour et la carte est jouable
    if (gameState?.isMyTurn && gameState?.playableCards?.includes(card.id)) {
      return 'playable';
    }

    // Si c'est mon tour mais la carte n'est pas jouable
    if (gameState?.isMyTurn) {
      return 'disabled';
    }

    // État par défaut
    return 'in-hand';
  }, [gameState, selectedCard, animationPhase]);

  const playCardAnimation = useCallback(async (
    _cardId: string, 
    _targetPosition: { x: number; y: number }
  ): Promise<void> => {
    return new Promise(resolve => {
      // Simuler l'animation vers la table
      // Dans une vraie implémentation, on utiliserait Framer Motion pour animer
      // la carte depuis sa position actuelle vers la position cible
      setTimeout(resolve, 600); // Durée de l'animation
    });
  }, []);

  return {
    getCardState,
    playCardAnimation,
    animationPhase,
    setAnimationPhase
  };
}