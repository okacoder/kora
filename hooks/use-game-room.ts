/**
 * Hook pour la gestion des salles de jeu en temps réel
 * Utilise WebSocket pour synchroniser l'état des salles entre les joueurs
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket, WS_EVENTS } from './use-websocket';
import { useCurrentUser } from './use-current-user';
import { toast } from 'sonner';
import { routes } from '@/lib/routes';

export interface RoomPlayer {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  position: number;
  isReady: boolean;
  isAI: boolean;
  aiDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  joinedAt: Date;
  lastSeen: Date;
  status: 'online' | 'away' | 'offline';
}

export interface GameRoomState {
  id: string;
  code: string;
  gameType: string;
  name: string;
  hostId: string;
  hostName: string;
  status: 'waiting' | 'starting' | 'in_progress' | 'completed';
  players: RoomPlayer[];
  maxPlayers: number;
  minPlayers: number;
  isPrivate: boolean;
  betAmount: number;
  settings: {
    turnDuration: number;
    maxTurns: number;
    commissionRate: number;
    [key: string]: any;
  };
  createdAt: Date;
  startedAt?: Date;
  countdown?: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'system' | 'join' | 'leave' | 'ready';
}

export interface UseGameRoomReturn {
  // État de la salle
  room: GameRoomState | null;
  loading: boolean;
  error: string | null;
  
  // Chat
  messages: ChatMessage[];
  
  // Actions joueur
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleReady: () => Promise<void>;
  startGame: () => Promise<void>;
  
  // Chat
  sendMessage: (message: string) => void;
  
  // Invitations
  invitePlayer: (username: string) => Promise<void>;
  kickPlayer: (playerId: string) => Promise<void>;
  
  // État
  isHost: boolean;
  currentPlayer: RoomPlayer | null;
  canStartGame: boolean;
}

export function useGameRoom(roomId?: string): UseGameRoomReturn {
  const user = useCurrentUser();
  const { sendMessage: sendWsMessage, subscribe, isConnected } = useWebSocket();
  
  const [room, setRoom] = useState<GameRoomState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abonnements WebSocket
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers = [
      // Mise à jour de l'état de la salle
      subscribe(WS_EVENTS.ROOM_UPDATE, (payload: { room: GameRoomState }) => {
        setRoom(payload.room);
        setError(null);
      }),

      // Joueur rejoint
      subscribe(WS_EVENTS.ROOM_PLAYER_JOIN, (payload: { player: RoomPlayer; room: GameRoomState }) => {
        setRoom(payload.room);
        
        // Message système dans le chat
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          userId: 'system',
          username: 'Système',
          message: `${payload.player.name} a rejoint la salle`,
          timestamp: new Date(),
          type: 'join'
        };
        setMessages(prev => [...prev, systemMessage]);
        
        toast.success(`${payload.player.name} a rejoint la partie`);
      }),

      // Joueur quitte
      subscribe(WS_EVENTS.ROOM_PLAYER_LEAVE, (payload: { playerId: string; playerName: string; room: GameRoomState }) => {
        setRoom(payload.room);
        
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          userId: 'system',
          username: 'Système',
          message: `${payload.playerName} a quitté la salle`,
          timestamp: new Date(),
          type: 'leave'
        };
        setMessages(prev => [...prev, systemMessage]);
        
        toast.info(`${payload.playerName} a quitté la partie`);
      }),

      // Joueur prêt/pas prêt
      subscribe(WS_EVENTS.ROOM_PLAYER_READY, (payload: { playerId: string; playerName: string; isReady: boolean; room: GameRoomState }) => {
        setRoom(payload.room);
        
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          userId: 'system',
          username: 'Système',
          message: `${payload.playerName} est ${payload.isReady ? 'prêt' : 'pas prêt'}`,
          timestamp: new Date(),
          type: 'ready'
        };
        setMessages(prev => [...prev, systemMessage]);
      }),

      // Message de chat
      subscribe(WS_EVENTS.ROOM_CHAT_MESSAGE, (payload: ChatMessage) => {
        setMessages(prev => [...prev, payload]);
      }),

      // Début de partie
      subscribe(WS_EVENTS.ROOM_GAME_START, (payload: { gameId: string; countdown?: number }) => {
        if (payload.countdown) {
          setRoom(prev => prev ? { ...prev, countdown: payload.countdown } : null);
        } else {
          // Rediriger vers la partie
          window.location.href = routes.gamePlay(payload.gameId);
        }
      }),

      // Erreurs
      subscribe(WS_EVENTS.ERROR, (payload: { message: string; code?: string }) => {
        setError(payload.message);
        toast.error(payload.message);
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isConnected, subscribe]);

  // Rejoindre une salle
  const joinRoom = useCallback(async (roomId: string) => {
    if (!user?.id || !isConnected) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);

    try {
      sendWsMessage(WS_EVENTS.ROOM_JOIN, {
        roomId,
        userId: user.id,
        userInfo: {
          name: user.name,
          avatar: user.image
        }
      });
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, isConnected, sendWsMessage]);

  // Quitter la salle
  const leaveRoom = useCallback(async () => {
    if (!room || !user?.id || !isConnected) return;

    sendWsMessage(WS_EVENTS.ROOM_LEAVE, {
      roomId: room.id,
      userId: user.id
    });

    // Reset de l'état local
    setRoom(null);
    setMessages([]);
    setError(null);
  }, [room, user, isConnected, sendWsMessage]);

  // Basculer le statut prêt
  const toggleReady = useCallback(async () => {
    if (!room || !user?.id || !isConnected) return;

    const currentPlayer = room.players.find(p => p.userId === user.id);
    if (!currentPlayer) return;

    sendWsMessage(WS_EVENTS.ROOM_PLAYER_READY, {
      roomId: room.id,
      userId: user.id,
      isReady: !currentPlayer.isReady
    });
  }, [room, user, isConnected, sendWsMessage]);

  // Démarrer la partie (host seulement)
  const startGame = useCallback(async () => {
    if (!room || !user?.id || !isConnected || room.hostId !== user.id) return;

    sendWsMessage(WS_EVENTS.ROOM_GAME_START, {
      roomId: room.id,
      hostId: user.id
    });
  }, [room, user, isConnected, sendWsMessage]);

  // Envoyer un message de chat
  const sendMessage = useCallback((message: string) => {
    if (!room || !user?.id || !isConnected || !message.trim()) return;

    const chatMessage: Partial<ChatMessage> = {
      userId: user.id,
      username: user.name || 'Anonyme',
      avatar: user.image || undefined,
      message: message.trim(),
      timestamp: new Date(),
      type: 'message'
    };

    sendWsMessage(WS_EVENTS.ROOM_CHAT_MESSAGE, {
      roomId: room.id,
      ...chatMessage
    });
  }, [room, user, isConnected, sendWsMessage]);

  // Inviter un joueur
  const invitePlayer = useCallback(async (username: string) => {
    if (!room || !user?.id || !isConnected) return;

    sendWsMessage('room:invite', {
      roomId: room.id,
      hostId: user.id,
      invitedUsername: username
    });

    toast.success(`Invitation envoyée à ${username}`);
  }, [room, user, isConnected, sendWsMessage]);

  // Expulser un joueur (host seulement)
  const kickPlayer = useCallback(async (playerId: string) => {
    if (!room || !user?.id || !isConnected || room.hostId !== user.id) return;

    sendWsMessage('room:kick', {
      roomId: room.id,
      hostId: user.id,
      playerId
    });
  }, [room, user, isConnected, sendWsMessage]);

  // Auto-join si roomId fourni
  useEffect(() => {
    if (roomId && user?.id && isConnected && !room) {
      joinRoom(roomId).catch(console.error);
    }
  }, [roomId, user?.id, isConnected, room, joinRoom]);

  // Calculer les propriétés dérivées
  const isHost = room?.hostId === user?.id;
  const currentPlayer = room?.players.find(p => p.userId === user?.id) || null;
  const canStartGame = isHost && 
    room !== null && 
    room.players.length >= room.minPlayers && 
    room.players.every(p => p.isReady || p.isAI);

  return {
    room,
    loading,
    error,
    messages,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
    sendMessage,
    invitePlayer,
    kickPlayer,
    isHost,
    currentPlayer,
    canStartGame
  };
}