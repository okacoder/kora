const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 4000;

// Créer l'app Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Créer le serveur HTTP
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Créer le serveur Socket.IO
  const io = new Server(server, {
    cors: {
      origin: [`https://localhost:${port}`, `http://localhost:${port}`],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Gestionnaire de salles simple pour les tests
  const rooms = new Map();

  // Middleware d'authentification pour WebSocket uniquement
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      // Si pas de token, créer un utilisateur temporaire pour les tests
      if (!token) {
        socket.data.user = {
          id: 'guest-' + Math.random().toString(36).substr(2, 9),
          name: 'Guest User'
        };
        return next();
      }

      // Pour les tests, accepter n'importe quel token non vide
      socket.data.user = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        name: 'Authenticated User'
      };
      
      next();
    } catch (err) {
      console.error('WebSocket auth error:', err.message);
      // Permettre la connexion même en cas d'erreur d'auth pour les tests
      socket.data.user = {
        id: 'fallback-' + Math.random().toString(36).substr(2, 9),
        name: 'Fallback User'
      };
      next();
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    const userName = socket.data.user.name;
    
    console.log(`🔌 User ${userName} (${userId}) connected via WebSocket`);

    // Rejoindre une salle de jeu
    socket.on('join-game', async (gameId) => {
      try {
        socket.join(`game:${gameId}`);
        
        if (!rooms.has(gameId)) {
          rooms.set(gameId, new Set());
        }
        rooms.get(gameId).add(userId);
        
        // Notifier les autres joueurs
        socket.to(`game:${gameId}`).emit('player-joined', {
          userId,
          userName,
          gameId,
          timestamp: new Date().toISOString(),
        });

        // Envoyer l'état actuel de la salle au nouveau joueur
        const roomPlayers = Array.from(rooms.get(gameId) || []);
        socket.emit('room-state', {
          gameId,
          players: roomPlayers.map(id => ({ id, name: `User ${id}` })),
          playerCount: roomPlayers.length,
        });

        console.log(`🎮 ${userName} joined game ${gameId}`);
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Quitter une salle de jeu
    socket.on('leave-game', async (gameId) => {
      try {
        socket.leave(`game:${gameId}`);
        
        if (rooms.has(gameId)) {
          rooms.get(gameId).delete(userId);
          if (rooms.get(gameId).size === 0) {
            rooms.delete(gameId);
          }
        }
        
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
        const gameRooms = Array.from(socket.rooms);
        if (!gameRooms.includes(`game:${gameId}`)) {
          throw new Error('Player not in game room');
        }

        console.log(`🎯 ${userName} performed ${action} in game ${gameId}:`, payload);
        
        // Diffuser à tous les joueurs dans la salle
        io.to(`game:${gameId}`).emit('game-update', {
          gameId,
          action,
          playerId: userId,
          playerName: userName,
          payload,
          timestamp: new Date().toISOString(),
        });

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
      const gameRooms = Array.from(socket.rooms);
      for (const room of gameRooms) {
        if (room.startsWith('game:')) {
          const gameId = room.replace('game:', '');
          
          if (rooms.has(gameId)) {
            rooms.get(gameId).delete(userId);
            if (rooms.get(gameId).size === 0) {
              rooms.delete(gameId);
            }
          }
          
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

  // Démarrer le serveur
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Server ready on https://localhost:${port}`);
    console.log(`🔌 WebSocket server ready on ws://localhost:${port}`);
  });
}); 