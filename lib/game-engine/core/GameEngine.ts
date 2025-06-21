import { GameRules, GameMove, BaseGameState } from './GameRules';

/**
 * Moteur de jeu principal qui orchestre tous les types de jeux
 */
export class GameEngine<TState extends BaseGameState> {
  private rules: GameRules<TState>;
  private moveHistory: GameMove[] = [];

  constructor(rules: GameRules<TState>) {
    this.rules = rules;
  }

  /**
   * Initialise un nouveau jeu
   */
  initializeGame(playerCount: number, betAmount: number): TState {
    const initialState = this.rules.initializeGame(playerCount, betAmount);
    this.moveHistory = [];
    return initialState;
  }

  /**
   * Exécute un mouvement dans le jeu
   */
  executeMove(state: TState, move: GameMove): GameEngineResult<TState> {
    try {
      // Ajouter timestamp si pas présent
      if (!move.timestamp) {
        move.timestamp = new Date();
      }

      // Valider le mouvement
      if (!this.rules.validateMove(state, move)) {
        return {
          success: false,
          error: 'Mouvement invalide',
          state,
        };
      }

      // Appliquer le mouvement
      const newState = this.rules.applyMove(state, move);
      
      // Ajouter à l'historique
      this.moveHistory.push(move);

      // Vérifier si le jeu est terminé
      const isGameOver = this.rules.isGameOver(newState);
      const winners = isGameOver ? this.rules.getWinners(newState) : null;
      const payouts = isGameOver ? this.rules.calculatePayouts(newState) : null;

      return {
        success: true,
        state: newState,
        isGameOver,
        winners,
        payouts,
        moveHistory: [...this.moveHistory],
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        state,
      };
    }
  }

  /**
   * Obtient les mouvements possibles pour un joueur
   */
  getPossibleMoves(state: TState, playerId: string): GameMove[] {
    return this.rules.getPossibleMoves(state, playerId);
  }

  /**
   * Vérifie si c'est le tour d'un joueur spécifique
   */
  isPlayerTurn(state: TState, playerId: string): boolean {
    return state.currentPlayerId === playerId;
  }

  /**
   * Obtient l'historique des mouvements
   */
  getMoveHistory(): GameMove[] {
    return [...this.moveHistory];
  }

  /**
   * Restaure l'état du jeu à partir de l'historique
   */
  restoreFromHistory(initialState: TState, moves: GameMove[]): TState {
    let currentState = initialState;
    
    for (const move of moves) {
      if (this.rules.validateMove(currentState, move)) {
        currentState = this.rules.applyMove(currentState, move);
      } else {
        throw new Error(`Mouvement invalide dans l'historique: ${JSON.stringify(move)}`);
      }
    }
    
    this.moveHistory = [...moves];
    return currentState;
  }

  /**
   * Obtient des statistiques sur le jeu en cours
   */
  getGameStats(state: TState): GameStats {
    return {
      gameType: state.gameType,
      playerCount: Object.keys(state.players).length,
      activePlayers: Object.values(state.players).filter(p => p.isActive && !p.hasLeft).length,
      turn: state.turn,
      totalMoves: this.moveHistory.length,
      duration: state.startedAt ? Date.now() - state.startedAt.getTime() : 0,
      pot: state.pot,
      betAmount: state.betAmount,
    };
  }
}

/**
 * Résultat d'une exécution de mouvement
 */
export interface GameEngineResult<TState> {
  success: boolean;
  state: TState;
  error?: string;
  isGameOver?: boolean;
  winners?: string[] | null;
  payouts?: Record<string, number> | null;
  moveHistory?: GameMove[];
}

/**
 * Statistiques d'un jeu
 */
export interface GameStats {
  gameType: string;
  playerCount: number;
  activePlayers: number;
  turn: number;
  totalMoves: number;
  duration: number; // en millisecondes
  pot: number;
  betAmount: number;
} 