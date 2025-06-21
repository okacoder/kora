'use client';

import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastError: string | null;
  
  // Actions
  connect: (token: string) => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback?: Function) => void;
  
  // Game-specific actions
  joinGame: (gameId: string) => void;
  leaveGame: (gameId: string) => void;
  sendGameAction: (gameId: string, action: string, payload: any) => void;
}

function getWebSocketUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: utiliser l'URL actuelle
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  
  // Fallback pour SSR
  return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
}

export const useSocketStore = create<SocketStore>()(
  subscribeWithSelector((set, get) => ({
    socket: null,
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    lastError: null,

    connect: (token: string) => {
      const { socket: existingSocket, isConnecting } = get();
      
      // Éviter les connexions multiples
      if (existingSocket?.connected || isConnecting) {
        console.log('WebSocket already connected or connecting');
        return;
      }

      set({ isConnecting: true, lastError: null });

      const socket = io(getWebSocketUrl(), {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        timeout: 20000,
        transports: ['websocket', 'polling'],
      });

      // Événements de connexion
      socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        set({ 
          isConnected: true, 
          isConnecting: false, 
          reconnectAttempts: 0,
          lastError: null 
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        set({ isConnected: false });
      });

      socket.on('connect_error', (error) => {
        console.error('🔴 WebSocket connection error:', error);
        const attempts = get().reconnectAttempts + 1;
        set({ 
          isConnecting: false,
          reconnectAttempts: attempts,
          lastError: error.message 
        });
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
        set({ reconnectAttempts: 0, lastError: null });
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
        set({ reconnectAttempts: attemptNumber });
      });

      socket.on('reconnect_failed', () => {
        console.error('💥 WebSocket reconnection failed');
        set({ 
          isConnecting: false,
          lastError: 'Reconnection failed after maximum attempts' 
        });
      });

      // Événements de jeu
      socket.on('connected', (data) => {
        console.log('🎮 Game server connected:', data);
      });

      socket.on('player-joined', (data) => {
        console.log('👤 Player joined:', data);
      });

      socket.on('player-left', (data) => {
        console.log('👋 Player left:', data);
      });

      socket.on('player-disconnected', (data) => {
        console.log('🔌 Player disconnected:', data);
      });

      socket.on('game-update', (data) => {
        console.log('🎯 Game update:', data);
      });

      socket.on('room-state', (data) => {
        console.log('🏠 Room state:', data);
      });

      socket.on('error', (error) => {
        console.error('🚨 Game error:', error);
        set({ lastError: error.message });
      });

      // Ping/Pong pour maintenir la connexion
      const pingInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping');
        }
      }, 30000); // Ping toutes les 30 secondes

      socket.on('pong', (data) => {
        // console.log('🏓 Pong received:', data);
      });

      // Nettoyer l'interval à la déconnexion
      socket.on('disconnect', () => {
        clearInterval(pingInterval);
      });

      set({ socket });
    },

    disconnect: () => {
      const { socket } = get();
      if (socket) {
        console.log('🔌 Disconnecting WebSocket...');
        socket.disconnect();
        set({ 
          socket: null, 
          isConnected: false, 
          isConnecting: false,
          reconnectAttempts: 0,
          lastError: null 
        });
      }
    },

    emit: (event: string, data: any) => {
      const { socket, isConnected } = get();
      if (socket && isConnected) {
        socket.emit(event, data);
      } else {
        console.warn(`Cannot emit ${event}: WebSocket not connected`);
        set({ lastError: 'WebSocket not connected' });
      }
    },

    on: (event: string, callback: Function) => {
      const { socket } = get();
      if (socket) {
        socket.on(event, callback as any);
      }
    },

    off: (event: string, callback?: Function) => {
      const { socket } = get();
      if (socket) {
        if (callback) {
          socket.off(event, callback as any);
        } else {
          socket.off(event);
        }
      }
    },

    // Actions spécifiques au jeu
    joinGame: (gameId: string) => {
      const { emit } = get();
      console.log(`🎮 Joining game: ${gameId}`);
      emit('join-game', gameId);
    },

    leaveGame: (gameId: string) => {
      const { emit } = get();
      console.log(`🚪 Leaving game: ${gameId}`);
      emit('leave-game', gameId);
    },

    sendGameAction: (gameId: string, action: string, payload: any) => {
      const { emit } = get();
      console.log(`🎯 Sending game action: ${action} in ${gameId}`);
      emit('game-action', { gameId, action, payload });
    },
  }))
);

// Hook personnalisé pour utiliser WebSocket facilement
export function useWebSocket() {
  const store = useSocketStore();
  
  return {
    ...store,
    isReconnecting: store.reconnectAttempts > 0 && !store.isConnected,
    connectionStatus: store.isConnected 
      ? 'connected' 
      : store.isConnecting 
        ? 'connecting' 
        : store.reconnectAttempts > 0 
          ? 'reconnecting' 
          : 'disconnected'
  };
} 