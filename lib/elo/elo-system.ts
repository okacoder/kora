/**
 * Système ELO pour LaMap241
 * Basé sur le système d'échecs avec adaptations pour les jeux de cartes
 */

export interface EloRating {
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  rank: EloRank;
}

export interface EloRank {
  name: string;
  tier: string;
  color: string;
  minRating: number;
  maxRating: number;
}

// Définition des rangs ELO selon le plan d'intégration
export const ELO_RANKS: EloRank[] = [
  { name: "Bronze III", tier: "Bronze", color: "chart-2", minRating: 0, maxRating: 799 },
  { name: "Bronze II", tier: "Bronze", color: "chart-2", minRating: 800, maxRating: 899 },
  { name: "Bronze I", tier: "Bronze", color: "chart-2", minRating: 900, maxRating: 999 },
  { name: "Argent III", tier: "Argent", color: "muted-foreground", minRating: 1000, maxRating: 1099 },
  { name: "Argent II", tier: "Argent", color: "muted-foreground", minRating: 1100, maxRating: 1199 },
  { name: "Argent I", tier: "Argent", color: "muted-foreground", minRating: 1200, maxRating: 1299 },
  { name: "Or III", tier: "Or", color: "chart-5", minRating: 1300, maxRating: 1399 },
  { name: "Or II", tier: "Or", color: "chart-5", minRating: 1400, maxRating: 1499 },
  { name: "Or I", tier: "Or", color: "chart-5", minRating: 1500, maxRating: 1599 },
  { name: "Platine III", tier: "Platine", color: "chart-3", minRating: 1600, maxRating: 1699 },
  { name: "Platine II", tier: "Platine", color: "chart-3", minRating: 1700, maxRating: 1799 },
  { name: "Platine I", tier: "Platine", color: "chart-3", minRating: 1800, maxRating: 1899 },
  { name: "Diamant III", tier: "Diamant", color: "primary", minRating: 1900, maxRating: 1999 },
  { name: "Diamant II", tier: "Diamant", color: "primary", minRating: 2000, maxRating: 2099 },
  { name: "Diamant I", tier: "Diamant", color: "primary", minRating: 2100, maxRating: 2199 },
  { name: "Maître", tier: "Maître", color: "chart-1", minRating: 2200, maxRating: 2399 },
  { name: "Grand Maître", tier: "Grand Maître", color: "chart-1", minRating: 2400, maxRating: 9999 },
];

// Configuration ELO selon le plan
export const ELO_CONFIG = {
  DEFAULT_RATING: 1200,
  BASE_K_FACTOR: 32,
  MAX_ELO_GAIN: 150,
  MAX_ELO_LOSS: -100,
  SPECIAL_VICTORY_BONUS: 50, // Bonus pour victoires Kora
  PLACEMENT_GAMES: 10, // Parties de placement avec K-factor élevé
};

export type VictoryType = 'normal' | 'kora_simple' | 'kora_double' | 'kora_triple' | 'auto_win';

export interface GameResult {
  playerId: string;
  playerRating: number;
  opponentRating: number;
  victory: boolean;
  victoryType?: VictoryType;
  gamesPlayed: number;
}

/**
 * Calcule le facteur K basé sur le nombre de parties jouées et le rating
 */
export function calculateKFactor(gamesPlayed: number, rating: number): number {
  // Parties de placement - K-factor élevé
  if (gamesPlayed < ELO_CONFIG.PLACEMENT_GAMES) {
    return 64;
  }
  
  // Joueurs de haut niveau - K-factor réduit pour plus de stabilité
  if (rating >= 2400) {
    return 16;
  }
  
  if (rating >= 2200) {
    return 24;
  }
  
  return ELO_CONFIG.BASE_K_FACTOR;
}

/**
 * Calcule la probabilité de victoire selon la formule ELO standard
 */
export function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  const ratingDifference = opponentRating - playerRating;
  return 1 / (1 + Math.pow(10, ratingDifference / 400));
}

/**
 * Calcule le nouveau rating ELO après une partie
 */
export function calculateNewRating(result: GameResult): number {
  const kFactor = calculateKFactor(result.gamesPlayed, result.playerRating);
  const expectedScore = calculateExpectedScore(result.playerRating, result.opponentRating);
  const actualScore = result.victory ? 1 : 0;
  
  // Calcul de base ELO
  let ratingChange = kFactor * (actualScore - expectedScore);
  
  // Bonus pour victoires spéciales (Kora)
  if (result.victory && result.victoryType && result.victoryType !== 'normal') {
    ratingChange += ELO_CONFIG.SPECIAL_VICTORY_BONUS;
  }
  
  // Limitation des gains/pertes maximums
  ratingChange = Math.max(ELO_CONFIG.MAX_ELO_LOSS, Math.min(ELO_CONFIG.MAX_ELO_GAIN, ratingChange));
  
  const newRating = Math.round(result.playerRating + ratingChange);
  
  // Rating minimum de 0
  return Math.max(0, newRating);
}

/**
 * Détermine le rang basé sur le rating
 */
export function getRankFromRating(rating: number): EloRank {
  for (const rank of ELO_RANKS) {
    if (rating >= rank.minRating && rating <= rank.maxRating) {
      return rank;
    }
  }
  
  // Fallback vers le rang le plus bas
  return ELO_RANKS[0];
}

/**
 * Calcule les statistiques ELO complètes
 */
export function calculateEloRating(
  currentRating: number,
  gamesPlayed: number,
  wins: number,
  losses: number
): EloRating {
  const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
  const rank = getRankFromRating(currentRating);
  
  return {
    rating: currentRating,
    gamesPlayed,
    wins,
    losses,
    winRate: Math.round(winRate * 100) / 100,
    rank,
  };
}

/**
 * Calcule le pourcentage de progression vers le prochain rang
 */
export function calculateRankProgress(rating: number): number {
  const currentRank = getRankFromRating(rating);
  
  // Si c'est le rang maximum, retourner 100%
  if (currentRank.name === "Grand Maître") {
    return 100;
  }
  
  const rangeSize = currentRank.maxRating - currentRank.minRating;
  const currentProgress = rating - currentRank.minRating;
  
  return Math.round((currentProgress / rangeSize) * 100);
}

/**
 * Trouve le prochain rang
 */
export function getNextRank(currentRating: number): EloRank | null {
  const currentRank = getRankFromRating(currentRating);
  const currentIndex = ELO_RANKS.findIndex(rank => rank.name === currentRank.name);
  
  if (currentIndex === -1 || currentIndex === ELO_RANKS.length - 1) {
    return null;
  }
  
  return ELO_RANKS[currentIndex + 1];
}

/**
 * Simule une partie multi-joueurs (pour Garame à 3+ joueurs)
 * Adapte le système ELO pour les parties à plusieurs joueurs
 */
export function calculateMultiplayerEloChanges(
  players: Array<{
    id: string;
    rating: number;
    gamesPlayed: number;
    position: number; // 1 = vainqueur, 2 = deuxième, etc.
    victoryType?: VictoryType;
  }>
): Array<{ playerId: string; newRating: number; ratingChange: number }> {
  const results: Array<{ playerId: string; newRating: number; ratingChange: number }> = [];
  
  // Calcul de la moyenne des ratings des adversaires pour chaque joueur
  for (const player of players) {
    const opponents = players.filter(p => p.id !== player.id);
    const averageOpponentRating = opponents.reduce((sum, opp) => sum + opp.rating, 0) / opponents.length;
    
    // Détermine si le joueur a gagné (position 1)
    const victory = player.position === 1;
    
    const gameResult: GameResult = {
      playerId: player.id,
      playerRating: player.rating,
      opponentRating: averageOpponentRating,
      victory,
      victoryType: player.victoryType,
      gamesPlayed: player.gamesPlayed,
    };
    
    const newRating = calculateNewRating(gameResult);
    const ratingChange = newRating - player.rating;
    
    results.push({
      playerId: player.id,
      newRating,
      ratingChange,
    });
  }
  
  return results;
}