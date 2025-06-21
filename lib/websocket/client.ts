'use client';

import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface GameMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
}

export interface GameAction {
  playerId: string;
  playerName: string;
  action: any;
  timestamp: Date;
}

export interface PlayerStatus {
  playerId: string;
  playerName: string;
  isConnected: boolean;
  isReady?: boolean;
  timestamp: Date;
}

interface WebSocketStore {
  // État de connexion
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // État du jeu
  currentGameId: string | null;
  gameState: any | null;
  players: PlayerStatus[];
  messages: GameMessage[];
  
  // Actions
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  joinGame: (gameId: string) => Promise<void>;
  leaveGame: () => void;
  sendGameAction: (action: any) => void;
  sendMessage: (message: string) => void;
  setPlayerReady: (ready: boolean) => void;
  
  // Événements internes
  _handleConnect: () => void;
  _handleDisconnect: () => void;
  _handleError: (error: string) => void;
  _handleGameStateUpdate: (data: any) => void;
  _handlePlayerJoined: (data: PlayerStatus) => void;
  _handlePlayerLeft: (data: PlayerStatus) => void;
  _handleGameMessage: (data: GameMessage) => void;
  _handleGameAction: (data: GameAction) => void;
}

/**
 * Store Zustand pour la gestion WebSocket
 */
export const useWebSocketStore = create<WebSocketStore>()(
  subscribeWithSelector((set, get) => ({
    // État initial
    socket: null,
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    currentGameId: null,
    gameState: null,
    players: [],
    messages: [],

    /**
     * Connexion au serveur WebSocket
     */
    connect: async (token: string) => {
      const { socket, isConnected, isConnecting } = get();
      
      if (isConnected || isConnecting) {
        console.log('WebSocket déjà connecté ou en cours de connexion');
        return;
      }

      set({ isConnecting: true, connectionError: null });

      try {
        const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10,
        });

        // Configuration des événements
        newSocket.on('connect', get()._handleConnect);
        newSocket.on('disconnect', get()._handleDisconnect);
        newSocket.on('error', get()._handleError);
        newSocket.on('game-state-update', get()._handleGameStateUpdate);
        newSocket.on('player-joined', get()._handlePlayerJoined);
        newSocket.on('player-left', get()._handlePlayerLeft);
        newSocket.on('player-disconnected', get()._handlePlayerLeft);
        newSocket.on('game-message-broadcast', get()._handleGameMessage);
        newSocket.on('game-action-broadcast', get()._handleGameAction);
        newSocket.on('ai-action', get()._handleGameAction);

        set({ socket: newSocket, isConnecting: false });

      } catch (error) {
        console.error('Erreur de connexion WebSocket:', error);
        set({ 
          isConnecting: false, 
          connectionError: error instanceof Error ? error.message : 'Erreur de connexion'
        });
      }
    },

    /**
     * Déconnexion du serveur WebSocket
     */
    disconnect: () => {
      const { socket } = get();
      
      if (socket) {
        socket.disconnect();
        set({ 
          socket: null, 
          isConnected: false, 
          currentGameId: null,
          gameState: null,
          players: [],
          messages: []
        });
      }
    },

    /**
     * Rejoindre une partie
     */
    joinGame: async (gameId: string) => {
      const { socket, isConnected } = get();
      
      if (!socket || !isConnected) {
        throw new Error('WebSocket non connecté');
      }

      socket.emit('join-game', { gameId });
      set({ currentGameId: gameId, messages: [] });
    },

    /**
     * Quitter la partie actuelle
     */
    leaveGame: () => {
      const { socket, currentGameId } = get();
      
      if (socket && currentGameId) {
        socket.emit('leave-game', { gameId: currentGameId });
        set({ 
          currentGameId: null, 
          gameState: null, 
          players: [], 
          messages: [] 
        });
      }
    },

    /**
     * Envoyer une action de jeu
     */
    sendGameAction: (action: any) => {
      const { socket, currentGameId, isConnected } = get();
      
      if (!socket || !isConnected || !currentGameId) {
        console.error('Impossible d\'envoyer l\'action: WebSocket non connecté ou pas dans une partie');
        return;
      }

      socket.emit('game-action', {
        gameId: currentGameId,
        action
      });
    },

    /**
     * Envoyer un message de chat
     */
    sendMessage: (message: string) => {
      const { socket, currentGameId, isConnected } = get();
      
      if (!socket || !isConnected || !currentGameId || !message.trim()) {
        return;
      }

      socket.emit('game-message', {
        gameId: currentGameId,
        message: message.trim()
      });
    },

    /**
     * Définir le statut "prêt"
     */
    setPlayerReady: (ready: boolean) => {
      const { socket, currentGameId, isConnected } = get();
      
      if (!socket || !isConnected || !currentGameId) {
        return;
      }

      socket.emit('player-ready', {
        gameId: currentGameId,
        ready
      });
    },

    // Gestionnaires d'événements internes
    _handleConnect: () => {
      console.log('✅ WebSocket connecté');
      set({ isConnected: true, connectionError: null });
    },

    _handleDisconnect: () => {
      console.log('❌ WebSocket déconnecté');
      set({ isConnected: false });
    },

    _handleError: (error: string) => {
      console.error('❌ Erreur WebSocket:', error);
      set({ connectionError: error });
    },

    _handleGameStateUpdate: (data: any) => {
      console.log('🎮 Mise à jour état du jeu:', data);
      set({ 
        gameState: data.gameState,
        players: data.players || []
      });
    },

    _handlePlayerJoined: (data: PlayerStatus) => {
      console.log('👋 Joueur rejoint:', data.playerName);
      set(state => ({
        players: [...state.players.filter(p => p.playerId !== data.playerId), data]
      }));
    },

    _handlePlayerLeft: (data: PlayerStatus) => {
      console.log('👋 Joueur parti:', data.playerName);
      set(state => ({
        players: state.players.filter(p => p.playerId !== data.playerId)
      }));
    },

    _handleGameMessage: (data: GameMessage) => {
      console.log('💬 Message reçu:', data);
      set(state => ({
        messages: [...state.messages, { ...data, timestamp: new Date(data.timestamp) }]
      }));
    },

    _handleGameAction: (data: GameAction) => {
      console.log('🎯 Action de jeu:', data);
      // Les actions de jeu sont gérées par les mises à jour d'état
      // On pourrait ajouter des notifications ici
    },
  }))
);

/**
 * Hook pour utiliser WebSocket dans les composants React
 */
export const useWebSocket = () => {
  const store = useWebSocketStore();
  
  return {
    // État
    isConnected: store.isConnected,
    isConnecting: store.isConnecting,
    connectionError: store.connectionError,
    currentGameId: store.currentGameId,
    gameState: store.gameState,
    players: store.players,
    messages: store.messages,
    
    // Actions
    connect: store.connect,
    disconnect: store.disconnect,
    joinGame: store.joinGame,
    leaveGame: store.leaveGame,
    sendGameAction: store.sendGameAction,
    sendMessage: store.sendMessage,
    setPlayerReady: store.setPlayerReady,
  };
};

/**
 * Hook pour écouter des événements WebSocket spécifiques
 */
export const useWebSocketListener = (
  event: keyof WebSocketStore,
  callback: (value: any, previousValue: any) => void
) => {
  return useWebSocketStore.subscribe(
    (state) => state[event],
    callback
  );
};

/**
 * Utilitaires WebSocket
 */
export const WebSocketUtils = {
  /**
   * Vérifie si le WebSocket est prêt pour envoyer des données
   */
  isReady: (): boolean => {
    const { socket, isConnected } = useWebSocketStore.getState();
    return !!(socket && isConnected);
  },

  /**
   * Obtient les statistiques de connexion
   */
  getConnectionStats: (): any => {
    const { socket, isConnected, players, messages } = useWebSocketStore.getState();
    
    return {
      isConnected,
      socketId: socket?.id || null,
      playersCount: players.length,
      messagesCount: messages.length,
      lastMessage: messages[messages.length - 1] || null,
    };
  },

  /**
   * Force la reconnexion
   */
  forceReconnect: (): void => {
    const { socket } = useWebSocketStore.getState();
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  },

  /**
   * Nettoie les messages anciens (garde les 100 derniers)
   */
  cleanupMessages: (): void => {
    useWebSocketStore.setState(state => ({
      messages: state.messages.slice(-100)
    }));
  }
};

/**
 * Types pour TypeScript
 */
export type { WebSocketStore }; 