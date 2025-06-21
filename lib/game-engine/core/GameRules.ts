/**
 * Interface de base pour les règles de jeux
 * Tous les jeux doivent implémenter cette interface
 */
export interface GameRules<TState> {
  /**
   * Initialise un nouveau jeu avec le nombre de joueurs spécifié
   */
  initializeGame(playerCount: number, betAmount: number): TState;

  /**
   * Valide si un mouvement est légal dans l'état actuel
   */
  validateMove(state: TState, move: GameMove): boolean;

  /**
   * Applique un mouvement à l'état du jeu et retourne le nouvel état
   */
  applyMove(state: TState, move: GameMove): TState;

  /**
   * Vérifie si le jeu est terminé
   */
  isGameOver(state: TState): boolean;

  /**
   * Retourne le ou les gagnants du jeu (null si pas terminé)
   */
  getWinners(state: TState): string[] | null;

  /**
   * Calcule les gains pour chaque joueur
   */
  calculatePayouts(state: TState): Record<string, number>;

  /**
   * Retourne les actions possibles pour le joueur actuel
   */
  getPossibleMoves(state: TState, playerId: string): GameMove[];
}

/**
 * Interface de base pour les mouvements de jeu
 */
export interface GameMove {
  type: string;
  playerId: string;
  data?: any;
  timestamp?: Date;
}

/**
 * Interface de base pour l'état d'un joueur
 */
export interface BasePlayerState {
  id: string;
  name: string;
  isActive: boolean;
  hasLeft: boolean;
  joinedAt: Date;
}

/**
 * Interface de base pour l'état du jeu
 */
export interface BaseGameState {
  gameId: string;
  gameType: string;
  status: 'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled';
  players: Record<string, BasePlayerState>;
  currentPlayerId: string | null;
  turn: number;
  betAmount: number;
  pot: number;
  startedAt?: Date;
  endedAt?: Date;
  winnerId?: string | null;
  winners?: string[];
} 