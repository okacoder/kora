/**
 * Mock WebSocket Server pour le développement
 * Simule les événements WebSocket sans serveur réel
 */

import { WS_EVENTS, WebSocketMessage } from '@/hooks/use-websocket';
import { GameRoomState, RoomPlayer, ChatMessage } from '@/hooks/use-game-room';

export class MockWebSocketServer {
  private static instance: MockWebSocketServer;
  private rooms: Map<string, GameRoomState> = new Map();
  private connections: Map<string, MockWebSocketConnection> = new Map();

  static getInstance(): MockWebSocketServer {
    if (!MockWebSocketServer.instance) {
      MockWebSocketServer.instance = new MockWebSocketServer();
    }
    return MockWebSocketServer.instance;
  }

  createConnection(userId: string): MockWebSocketConnection {
    const connection = new MockWebSocketConnection(userId, this);
    this.connections.set(userId, connection);
    return connection;
  }

  removeConnection(userId: string): void {
    this.connections.delete(userId);
  }

  // Gestion des salles
  createRoom(roomData: Partial<GameRoomState>): GameRoomState {
    const room: GameRoomState = {
      id: `room_${Date.now()}`,
      code: this.generateRoomCode(),
      gameType: 'garame',
      name: `Salle de ${roomData.hostName || 'Joueur'}`,
      hostId: roomData.hostId || '',
      hostName: roomData.hostName || 'Joueur',
      status: 'waiting',
      players: [],
      maxPlayers: 4,
      minPlayers: 2,
      isPrivate: false,
      betAmount: 100,
      settings: {
        turnDuration: 60,
        maxTurns: 5,
        commissionRate: 10
      },
      createdAt: new Date(),
      ...roomData
    };

    this.rooms.set(room.id, room);
    return room;
  }

  joinRoom(roomId: string, userId: string, userInfo: { name: string; avatar?: string }): GameRoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Vérifier si le joueur n'est pas déjà dans la salle
    if (room.players.some(p => p.userId === userId)) {
      return room;
    }

    // Vérifier si la salle n'est pas pleine
    if (room.players.length >= room.maxPlayers) {
      throw new Error('Salle pleine');
    }

    const newPlayer: RoomPlayer = {
      id: `player_${Date.now()}`,
      userId,
      name: userInfo.name,
      avatar: userInfo.avatar,
      position: room.players.length + 1,
      isReady: false,
      isAI: false,
      joinedAt: new Date(),
      lastSeen: new Date(),
      status: 'online'
    };

    room.players.push(newPlayer);
    this.broadcastToRoom(roomId, WS_EVENTS.ROOM_PLAYER_JOIN, {
      player: newPlayer,
      room
    });

    return room;
  }

  leaveRoom(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.userId === userId);
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    // Si c'était l'host et qu'il reste des joueurs, transférer à quelqu'un d'autre
    if (room.hostId === userId && room.players.length > 0) {
      const newHost = room.players[0];
      room.hostId = newHost.userId;
      room.hostName = newHost.name;
    }

    // Si plus de joueurs, supprimer la salle
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
    } else {
      this.broadcastToRoom(roomId, WS_EVENTS.ROOM_PLAYER_LEAVE, {
        playerId: player.id,
        playerName: player.name,
        room
      });
    }
  }

  setPlayerReady(roomId: string, userId: string, isReady: boolean): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.userId === userId);
    if (!player) return;

    player.isReady = isReady;

    this.broadcastToRoom(roomId, WS_EVENTS.ROOM_PLAYER_READY, {
      playerId: player.id,
      playerName: player.name,
      isReady,
      room
    });

    // Vérifier si tous les joueurs sont prêts pour démarrer automatiquement
    if (room.players.length >= room.minPlayers && 
        room.players.every(p => p.isReady || p.isAI)) {
      setTimeout(() => this.startGame(roomId), 1000);
    }
  }

  startGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.status = 'starting';
    
    // Countdown de 5 secondes
    let countdown = 5;
    const countdownInterval = setInterval(() => {
      room.countdown = countdown;
      this.broadcastToRoom(roomId, WS_EVENTS.ROOM_GAME_START, {
        gameId: `game_${Date.now()}`,
        countdown
      });

      countdown--;
      if (countdown < 0) {
        clearInterval(countdownInterval);
        room.status = 'in_progress';
        delete room.countdown;
        
        this.broadcastToRoom(roomId, WS_EVENTS.ROOM_GAME_START, {
          gameId: `game_${Date.now()}`
        });
      }
    }, 1000);
  }

  sendChatMessage(roomId: string, message: Partial<ChatMessage>): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: message.userId || 'anonymous',
      username: message.username || 'Anonyme',
      avatar: message.avatar,
      message: message.message || '',
      timestamp: new Date(),
      type: 'message',
      ...message
    };

    this.broadcastToRoom(roomId, WS_EVENTS.ROOM_CHAT_MESSAGE, chatMessage);
  }

  private broadcastToRoom(roomId: string, eventType: string, payload: any): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Envoyer à tous les joueurs de la salle
    room.players.forEach(player => {
      const connection = this.connections.get(player.userId);
      if (connection) {
        connection.send(eventType, payload);
      }
    });
  }

  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

export class MockWebSocketConnection {
  private userId: string;
  private server: MockWebSocketServer;
  private messageHandlers: Map<string, (payload: any) => void> = new Map();
  public readyState: number = WebSocket.OPEN;

  constructor(userId: string, server: MockWebSocketServer) {
    this.userId = userId;
    this.server = server;
    
    // Simuler la connexion
    setTimeout(() => {
      this.send(WS_EVENTS.CONNECT, { userId });
    }, 100);
  }

  send(type: string, payload: any): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Simuler l'envoi avec un délai réseau
    setTimeout(() => {
      const handler = this.messageHandlers.get(type);
      if (handler) {
        handler(payload);
      }
    }, Math.random() * 50 + 10); // 10-60ms de latence
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    // Écouter tous les types de messages
    this.messageHandlers.set('*', callback);
  }

  handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      // Traitement des messages entrants selon le type
      switch (message.type) {
        case WS_EVENTS.ROOM_JOIN:
          const room = this.server.joinRoom(
            message.payload.roomId, 
            this.userId, 
            message.payload.userInfo
          );
          if (room) {
            this.send(WS_EVENTS.ROOM_UPDATE, { room });
          }
          break;

        case WS_EVENTS.ROOM_LEAVE:
          this.server.leaveRoom(message.payload.roomId, this.userId);
          break;

        case WS_EVENTS.ROOM_PLAYER_READY:
          this.server.setPlayerReady(
            message.payload.roomId, 
            this.userId, 
            message.payload.isReady
          );
          break;

        case WS_EVENTS.ROOM_GAME_START:
          this.server.startGame(message.payload.roomId);
          break;

        case WS_EVENTS.ROOM_CHAT_MESSAGE:
          this.server.sendChatMessage(message.payload.roomId, {
            ...message.payload,
            userId: this.userId
          });
          break;

        case WS_EVENTS.HEARTBEAT:
          this.send(WS_EVENTS.PONG, { timestamp: Date.now() });
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
    this.server.removeConnection(this.userId);
  }
}

// Factory pour créer des connexions mock en mode développement
export function createMockWebSocketConnection(url: string): MockWebSocketConnection {
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const userId = urlParams.get('userId') || 'anonymous';
  
  const server = MockWebSocketServer.getInstance();
  const connection = server.createConnection(userId);
  
  // Simuler l'interface WebSocket standard
  const mockSocket = {
    ...connection,
    addEventListener: (event: string, handler: any) => {
      if (event === 'message') {
        connection.onMessage(handler);
      }
    },
    removeEventListener: () => {},
    OPEN: WebSocket.OPEN,
    CLOSED: WebSocket.CLOSED
  };

  return connection;
}