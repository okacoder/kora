/**
 * Hook WebSocket central pour LaMap241
 * Gère la connexion temps réel, la reconnexion automatique et les événements
 */

"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useCurrentUser } from './use-current-user';
import { createMockWebSocketConnection } from '@/lib/websocket/mock-server';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  messageId: string;
}

export interface WebSocketHookReturn {
  socket: WebSocket | null;
  status: WebSocketStatus;
  isConnected: boolean;
  sendMessage: (type: string, payload: any) => void;
  subscribe: (eventType: string, handler: (payload: any) => void) => () => void;
  lastMessage: WebSocketMessage | null;
  reconnect: () => void;
}

// Types d'événements WebSocket
export const WS_EVENTS = {
  // Connexion
  CONNECT: 'ws:connect',
  DISCONNECT: 'ws:disconnect',
  AUTHENTICATE: 'ws:authenticate',
  
  // Rooms
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_UPDATE: 'room:update',
  ROOM_PLAYER_JOIN: 'room:player:join',
  ROOM_PLAYER_LEAVE: 'room:player:leave',
  ROOM_PLAYER_READY: 'room:player:ready',
  ROOM_CHAT_MESSAGE: 'room:chat:message',
  ROOM_GAME_START: 'room:game:start',
  
  // Game
  GAME_STATE_UPDATE: 'game:state:update',
  GAME_MOVE: 'game:move',
  GAME_TURN_START: 'game:turn:start',
  GAME_TURN_END: 'game:turn:end',
  GAME_END: 'game:end',
  GAME_CARD_PLAYED: 'game:card:played',
  GAME_WINNER: 'game:winner',
  
  // Notifications
  NOTIFICATION: 'notification',
  ERROR: 'error',
  
  // System
  HEARTBEAT: 'heartbeat',
  PONG: 'pong'
} as const;

export function useWebSocket(autoConnect: boolean = true): WebSocketHookReturn {
  const user = useCurrentUser();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);
  const eventHandlers = useRef<Map<string, Set<(payload: any) => void>>>(new Map());
  const heartbeatInterval = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // URL WebSocket depuis les variables d'environnement
  const getWebSocketUrl = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    return `${wsUrl}?userId=${user?.id || 'anonymous'}`;
  }, [user?.id]);

  // Mode mock pour le développement
  const useMockWebSocket = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || !process.env.NEXT_PUBLIC_WS_URL;

  // Envoyer un message via WebSocket
  const sendMessage = useCallback((type: string, payload: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
        messageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      socket.send(JSON.stringify(message));
      
      // Log pour développement
      if (process.env.NODE_ENV === 'development') {
        console.log('📤 WebSocket Send:', { type, payload });
      }
    } else {
      console.warn('WebSocket not connected, message not sent:', { type, payload });
      toast.error('Connexion perdue. Tentative de reconnexion...');
    }
  }, [socket]);

  // S'abonner à un type d'événement
  const subscribe = useCallback((eventType: string, handler: (payload: any) => void) => {
    if (!eventHandlers.current.has(eventType)) {
      eventHandlers.current.set(eventType, new Set());
    }
    eventHandlers.current.get(eventType)!.add(handler);

    // Retourner une fonction de désabonnement
    return () => {
      const handlers = eventHandlers.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          eventHandlers.current.delete(eventType);
        }
      }
    };
  }, []);

  // Gérer les messages entrants
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      setLastMessage(message);

      // Log pour développement
      if (process.env.NODE_ENV === 'development') {
        console.log('📥 WebSocket Receive:', message);
      }

      // Gérer les événements système
      switch (message.type) {
        case WS_EVENTS.HEARTBEAT:
          sendMessage(WS_EVENTS.PONG, { timestamp: Date.now() });
          break;
          
        case WS_EVENTS.ERROR:
          console.error('WebSocket Error:', message.payload);
          toast.error(message.payload.message || 'Erreur de connexion');
          break;
          
        case WS_EVENTS.NOTIFICATION:
          toast.info(message.payload.message);
          break;
      }

      // Distribuer aux abonnés
      const handlers = eventHandlers.current.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.payload);
          } catch (error) {
            console.error('Error in WebSocket handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [sendMessage]);

  // Heartbeat pour maintenir la connexion
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    
    heartbeatInterval.current = setInterval(() => {
      sendMessage(WS_EVENTS.HEARTBEAT, { timestamp: Date.now() });
    }, 30000); // Toutes les 30 secondes
  }, [sendMessage]);

  // Stopper le heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = undefined;
    }
  }, []);

  // Reconnexion automatique
  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setStatus('error');
      toast.error('Impossible de se reconnecter. Veuillez rafraîchir la page.');
      return;
    }

    setStatus('reconnecting');
    reconnectAttempts.current++;
    
    // Délai exponentiel pour la reconnexion
    const delay = Math.min(reconnectDelay.current * Math.pow(2, reconnectAttempts.current - 1), 30000);
    
    toast.info(`Reconnexion dans ${delay / 1000}s... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
    
    reconnectTimeout.current = setTimeout(() => {
      connect();
    }, delay);
  }, []);

  // Connexion WebSocket
  const connect = useCallback(() => {
    if (!user?.id && autoConnect) {
      // Attendre que l'utilisateur soit chargé
      return;
    }

    try {
      setStatus('connecting');
      
      if (useMockWebSocket) {
        // Mode mock pour le développement
        const mockWs = createMockWebSocketConnection(getWebSocketUrl());
        
        // Adapter l'interface mock à l'interface WebSocket standard
        mockWs.send = (data: string) => {
          mockWs.handleMessage(data);
        };
        
        // Simuler les événements WebSocket
        setTimeout(() => {
          setStatus('connected');
          setSocket(mockWs as any);
          reconnectAttempts.current = 0;
          reconnectDelay.current = 1000;
          
          if (user?.id) {
            sendMessage(WS_EVENTS.AUTHENTICATE, {
              userId: user.id,
              userAgent: navigator.userAgent,
              timestamp: Date.now()
            });
          }
          
          startHeartbeat();
          toast.success('Connexion établie (mode mock)');
        }, 500);
        
        return;
      }
      
      // Mode WebSocket réel
      const realWs = new WebSocket(getWebSocketUrl());

      realWs.onopen = () => {
        console.log('🔗 WebSocket connected');
        setStatus('connected');
        setSocket(realWs);
        reconnectAttempts.current = 0;
        reconnectDelay.current = 1000;
        
        // Authentification
        if (user?.id) {
          sendMessage(WS_EVENTS.AUTHENTICATE, {
            userId: user.id,
            userAgent: navigator.userAgent,
            timestamp: Date.now()
          });
        }
        
        startHeartbeat();
        toast.success('Connexion établie');
      };

      realWs.onmessage = handleMessage;

      realWs.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setStatus('disconnected');
        setSocket(null);
        stopHeartbeat();
        
        // Reconnexion automatique si pas fermé intentionnellement
        if (event.code !== 1000 && autoConnect) {
          reconnect();
        }
      };

      realWs.onerror = (error: any) => {
        console.error('❌ WebSocket error:', error);
        setStatus('error');
        toast.error('Erreur de connexion WebSocket');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setStatus('error');
      toast.error('Impossible de se connecter au serveur');
    }
  }, [user?.id, autoConnect, getWebSocketUrl, handleMessage, startHeartbeat, stopHeartbeat, reconnect, sendMessage, useMockWebSocket]);

  // Déconnexion propre
  const disconnect = useCallback(() => {
    if (socket) {
      stopHeartbeat();
      socket.close(1000, 'User disconnected');
      setSocket(null);
      setStatus('disconnected');
    }
    
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
  }, [socket, stopHeartbeat]);

  // Connexion automatique au montage
  useEffect(() => {
    if (autoConnect && user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, user?.id, connect, disconnect]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [stopHeartbeat]);

  return {
    socket,
    status,
    isConnected: status === 'connected',
    sendMessage,
    subscribe,
    lastMessage,
    reconnect: connect
  };
}