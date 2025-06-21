import { Server } from 'socket.io';
import { createServer } from 'http';
import { auth } from '@/lib/auth';
import { RoomManager } from './rooms';

export function createWebSocketServer(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "https://localhost:4000",
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  const roomManager = new RoomManager();

  // Middleware d'authentification
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error('No token provided');
      }

      // Vérifier le token avec Better Auth
      const session = await auth.api.getSession({
        headers: { authorization: `Bearer ${token}` } as any,
      });

      if (!session || !session.user) {
        throw new Error('Invalid session');
      }

      socket.data.user = session.user;
      socket.data.sessionId = session.session.id;
      next();
    } catch (err) {
      console.error('WebSocket auth error:', err);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    const userName = socket.data.user.name || 'Joueur';
    
    console.log(`🔌 User ${userName} (${userId}) connected via WebSocket`);

    // Rejoindre une salle de jeu
    socket.on('join-game', async (gameId: string) => {
      try {
        socket.join(`game:${gameId}`);
        await roomManager.addPlayerToRoom(gameId, {
          id: userId,
          name: userName,
          socketId: socket.id,
        });
        
        // Notifier les autres joueurs
        socket.to(`game:${gameId}`).emit('player-joined', {
          userId,
          userName,
          gameId,
          timestamp: new Date().toISOString(),
        });

        // Envoyer l'état actuel de la salle au nouveau joueur
        const roomState = await roomManager.getRoomState(gameId);
        socket.emit('room-state', roomState);

        console.log(`🎮 ${userName} joined game ${gameId}`);
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Quitter une salle de jeu
    socket.on('leave-game', async (gameId: string) => {
      try {
        socket.leave(`game:${gameId}`);
        await roomManager.removePlayerFromRoom(gameId, userId);
        
        // Notifier les autres joueurs
        socket.to(`game:${gameId}`).emit('player-left', {
          userId,
          userName,
          gameId,
          timestamp: new Date().toISOString(),
        });

        console.log(`🚪 ${userName} left game ${gameId}`);
      } catch (error) {
        console.error('Error leaving game:', error);
      }
    });

    // Gérer les actions de jeu
    socket.on('game-action', async (data) => {
      const { gameId, action, payload } = data;
      
      try {
        // Valider que le joueur est dans la salle
        const rooms = Array.from(socket.rooms);
        if (!rooms.includes(`game:${gameId}`)) {
          throw new Error('Player not in game room');
        }

        // Traiter l'action (sera implémenté avec le moteur de jeu)
        const result = await processGameAction(gameId, userId, action, payload);
        
        // Diffuser à tous les joueurs dans la salle
        io.to(`game:${gameId}`).emit('game-update', {
          gameId,
          action,
          playerId: userId,
          playerName: userName,
          result,
          timestamp: new Date().toISOString(),
        });

        console.log(`🎯 ${userName} performed ${action} in game ${gameId}`);
      } catch (error) {
        console.error('Game action error:', error);
        socket.emit('error', { 
          message: error instanceof Error ? error.message : 'Game action failed' 
        });
      }
    });

    // Heartbeat pour maintenir la connexion
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Gestion de la déconnexion
    socket.on('disconnect', async (reason) => {
      console.log(`🔌 ${userName} disconnected: ${reason}`);
      
      // Nettoyer toutes les salles où le joueur était présent
      const rooms = Array.from(socket.rooms);
      for (const room of rooms) {
        if (room.startsWith('game:')) {
          const gameId = room.replace('game:', '');
          await roomManager.removePlayerFromRoom(gameId, userId);
          
          // Notifier les autres joueurs
          socket.to(room).emit('player-disconnected', {
            userId,
            userName,
            gameId,
            reason,
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    // Envoyer un message de bienvenue
    socket.emit('connected', {
      message: 'Connexion WebSocket établie',
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });
  });

  return io;
}

// Fonction temporaire pour traiter les actions de jeu
async function processGameAction(gameId: string, userId: string, action: string, payload: any) {
  // TODO: Implémenter avec le moteur de jeu
  console.log(`Processing ${action} for user ${userId} in game ${gameId}:`, payload);
  
  return {
    success: true,
    message: `Action ${action} processed`,
    gameId,
    userId,
    payload,
  };
} 