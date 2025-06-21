import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types de base pour le jeu
export interface GameCard {
  id: string;
  rank: number; // 3-10
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
}

export interface GamePlayer {
  id: string;
  name: string;
  hand: GameCard[];
  cardsWon: GameCard[];
  korasWon: number;
  hasFolded: boolean;
  isConnected: boolean;
}

export interface GameState {
  gameId: string | null;
  players: GamePlayer[];
  currentPlayerIndex: number;
  currentRound: number;
  maxRounds: number;
  tableCards: GameCard[];
  betAmount: number;
  pot: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  lastAction: {
    playerId: string;
    action: 'play' | 'fold';
    card?: GameCard;
    timestamp: string;
  } | null;
}

interface GameStore {
  // État du jeu
  gameState: GameState | null;
  currentUserId: string | null;
  selectedCard: string | null;
  
  // État UI
  isLoading: boolean;
  error: string | null;
  
  // Actions de base
  setCurrentUser: (userId: string) => void;
  setGameState: (state: GameState) => void;
  updateGameState: (updates: Partial<GameState>) => void;
  clearGame: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Actions de jeu
  selectCard: (cardId: string | null) => void;
  playCard: (cardId: string) => void;
  foldHand: () => void;
  
  // Getters calculés
  getCurrentPlayer: () => GamePlayer | null;
  getMyPlayer: () => GamePlayer | null;
  getMyHand: () => GameCard[];
  isMyTurn: () => boolean;
  canPlayCard: (cardId: string) => boolean;
  getGameStats: () => {
    totalPlayers: number;
    activePlayers: number;
    cardsInPlay: number;
    currentPot: number;
  };
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // État initial
    gameState: null,
    currentUserId: null,
    selectedCard: null,
    isLoading: false,
    error: null,

    // Actions de base
    setCurrentUser: (userId: string) => set({ currentUserId: userId }),

    setGameState: (state: GameState) => set({ 
      gameState: state,
      selectedCard: null,
      error: null,
    }),

    updateGameState: (updates: Partial<GameState>) => set((state) => ({
      gameState: state.gameState ? { ...state.gameState, ...updates } : null,
    })),

    clearGame: () => set({
      gameState: null,
      selectedCard: null,
      error: null,
      isLoading: false,
    }),

    setError: (error: string | null) => set({ error }),

    setLoading: (loading: boolean) => set({ isLoading: loading }),

    // Actions de jeu
    selectCard: (cardId: string | null) => set({ selectedCard: cardId }),

    playCard: (cardId: string) => {
      const { gameState, currentUserId } = get();
      if (!gameState || !currentUserId) return;

      // Validation côté client (sera aussi validée côté serveur)
      const myPlayer = gameState.players.find(p => p.id === currentUserId);
      if (!myPlayer || !myPlayer.hand.some(c => c.id === cardId)) {
        set({ error: 'Carte non valide' });
        return;
      }

      if (gameState.currentPlayerIndex !== gameState.players.findIndex(p => p.id === currentUserId)) {
        set({ error: 'Ce n\'est pas votre tour' });
        return;
      }

      // L'action sera envoyée via WebSocket par le composant
      console.log(`Playing card ${cardId}`);
      set({ selectedCard: null });
    },

    foldHand: () => {
      const { gameState, currentUserId } = get();
      if (!gameState || !currentUserId) return;

      const myPlayer = gameState.players.find(p => p.id === currentUserId);
      if (!myPlayer || myPlayer.hasFolded) {
        set({ error: 'Impossible de se coucher' });
        return;
      }

      // L'action sera envoyée via WebSocket par le composant
      console.log('Folding hand');
      set({ selectedCard: null });
    },

    // Getters calculés
    getCurrentPlayer: () => {
      const { gameState } = get();
      if (!gameState || gameState.currentPlayerIndex < 0) return null;
      return gameState.players[gameState.currentPlayerIndex] || null;
    },

    getMyPlayer: () => {
      const { gameState, currentUserId } = get();
      if (!gameState || !currentUserId) return null;
      return gameState.players.find(p => p.id === currentUserId) || null;
    },

    getMyHand: () => {
      const myPlayer = get().getMyPlayer();
      return myPlayer ? myPlayer.hand : [];
    },

    isMyTurn: () => {
      const { gameState, currentUserId } = get();
      if (!gameState || !currentUserId) return false;
      
      const currentPlayer = get().getCurrentPlayer();
      return currentPlayer?.id === currentUserId;
    },

    canPlayCard: (cardId: string) => {
      const { gameState, currentUserId } = get();
      if (!gameState || !currentUserId) return false;

      // Vérifier si c'est mon tour
      if (!get().isMyTurn()) return false;

      // Vérifier si j'ai la carte
      const myHand = get().getMyHand();
      return myHand.some(c => c.id === cardId);
    },

    getGameStats: () => {
      const { gameState } = get();
      if (!gameState) {
        return {
          totalPlayers: 0,
          activePlayers: 0,
          cardsInPlay: 0,
          currentPot: 0,
        };
      }

      return {
        totalPlayers: gameState.players.length,
        activePlayers: gameState.players.filter(p => !p.hasFolded && p.isConnected).length,
        cardsInPlay: gameState.tableCards.length,
        currentPot: gameState.pot,
      };
    },
  }))
);

// Hook personnalisé pour utiliser le store de jeu
export function useGame() {
  const store = useGameStore();
  
  return {
    ...store,
    // Helpers supplémentaires
    hasActiveGame: !!store.gameState,
    gameStatus: store.gameState?.status || 'waiting',
    isGameActive: store.gameState?.status === 'in_progress',
    myTurnIndicator: store.isMyTurn() ? '🎯' : '⏳',
  };
} 