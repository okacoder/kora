import { GameType } from "@prisma/client";

// Game configuration selon le plan d'intégration
export interface GameConfig {
  id: GameType;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  bettingConfig: {
    minBet: number;
    maxBet: number;
    commissionRate: number;
    allowNoBet: boolean;
  };
  turnConfig: {
    minDuration: number;
    maxDuration: number;
    defaultDuration: number;
  };
}

export const garameConfig: GameConfig = {
  id: 'garame',
  name: 'Garame',
  description: 'Jeu traditionnel de cartes inspiré du jeu Garame',
  minPlayers: 2,
  maxPlayers: 5,
  bettingConfig: {
    minBet: 10,
    maxBet: 10000,
    commissionRate: 10,
    allowNoBet: true,
  },
  turnConfig: {
    minDuration: 30,
    maxDuration: 300, // 5 minutes
    defaultDuration: 60,
  }
};

export const games: GameConfig[] = [
  garameConfig,
];

export const getConfigGameById = (id: GameType) => {
  return games.find((game) => game.id === id);
};
