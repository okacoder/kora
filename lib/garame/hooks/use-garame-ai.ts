'use client';

import { useState, useCallback, useEffect } from 'react';
import { container } from '@/lib/di/container';
import { TYPES } from '@/lib/di/types';
import { IGarameAIService } from '@/lib/interfaces/services/IAIService';
import { GameAction } from '@/lib/garame/core/types';
import { GarameState } from '../games/garame/garame-types';

export interface UseGarameAIReturn {
  isThinking: boolean;
  difficulty: 'boa' | 'normal' | 'sensei';
  setDifficulty: (difficulty: 'boa' | 'normal' | 'sensei') => void;
  getAIMove: (gameState: GarameState, playerId: string) => Promise<GameAction | null>;
  error: string | null;
}

export function useGarameAI(initialDifficulty: 'boa' | 'normal' | 'sensei' = 'normal'): UseGarameAIReturn {
  const [isThinking, setIsThinking] = useState(false);
  const [difficulty, setDifficultyState] = useState<'boa' | 'normal' | 'sensei'>(initialDifficulty);
  const [error, setError] = useState<string | null>(null);
  const [aiService, setAiService] = useState<IGarameAIService | null>(null);

  // Initialize AI service
  useEffect(() => {
    try {
      const service = container.get<IGarameAIService>(TYPES.GarameAIService);
      setAiService(service);
      service.setDifficulty(difficulty);
    } catch (err) {
      console.error('Failed to initialize Garame AI service:', err);
      setError('Failed to initialize AI service');
    }
  }, []);

  // Update difficulty when it changes
  const setDifficulty = useCallback((newDifficulty: 'boa' | 'normal' | 'sensei') => {
    setDifficultyState(newDifficulty);
    if (aiService) {
      aiService.setDifficulty(newDifficulty);
    }
  }, [aiService]);

  // Get AI move
  const getAIMove = useCallback(async (
    gameState: GarameState, 
    playerId: string
  ): Promise<GameAction | null> => {
    if (!aiService) {
      setError('AI service not initialized');
      return null;
    }

    setIsThinking(true);
    setError(null);

    try {
      // Add artificial delay for better UX
      const minimumThinkTime = difficulty === 'boa' ? 500 : difficulty === 'normal' ? 1000 : 1500;
      const startTime = Date.now();

      const action = await aiService.getNextAction(gameState, playerId);

      // Ensure minimum thinking time has passed
      const elapsed = Date.now() - startTime;
      if (elapsed < minimumThinkTime) {
        await new Promise(resolve => setTimeout(resolve, minimumThinkTime - elapsed));
      }

      return action;
    } catch (err) {
      console.error('Error getting AI move:', err);
      setError(err instanceof Error ? err.message : 'Failed to get AI move');
      return null;
    } finally {
      setIsThinking(false);
    }
  }, [aiService, difficulty]);

  return {
    isThinking,
    difficulty,
    setDifficulty,
    getAIMove,
    error
  };
}