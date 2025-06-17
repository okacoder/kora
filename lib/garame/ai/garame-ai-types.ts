import { Card } from '@/lib/garame/core/types';

export type GarameCard = Card;

export interface GarameAIConfig {
  difficulty: 'boa' | 'normal' | 'sensei';
  bluffProbability?: number;
  mistakeProbability?: number;
  analysisDepth?: number;
  memorySize?: number; // Nombre de coups à mémoriser
}

export interface CardEvaluation {
  card: GarameCard;
  score: number;
  reasoning: string;
}

export interface GameAnalysis {
  playerPosition: 'winning' | 'losing' | 'neutral';
  opponentStrength: number; // 0-100
  recommendedStrategy: 'aggressive' | 'conservative' | 'balanced';
  bluffOpportunity: boolean;
  criticalMoment: boolean;
}

export interface OpponentModel {
  playerId: string;
  playsConservatively: boolean;
  bluffFrequency: number;
  averageCardStrength: number;
  koraUsagePattern: 'aggressive' | 'conservative' | 'random';
  recentMoves: Array<{
    card: GarameCard;
    hadKora: boolean;
    wonTrick: boolean;
  }>;
}