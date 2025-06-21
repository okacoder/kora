'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/websocket/client';
import { useGame } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function TestWebSocket() {
  const {
    isConnected,
    isConnecting,
    isReconnecting,
    connectionStatus,
    reconnectAttempts,
    lastError,
    connect,
    disconnect,
    joinGame,
    leaveGame,
    sendGameAction,
  } = useWebSocket();

  const { hasActiveGame, getGameStats } = useGame();
  const gameStats = getGameStats();
  const [testGameId, setTestGameId] = useState('test-game-123');
  const [isInGame, setIsInGame] = useState(false);

  // Simuler un token d'authentification (en production, récupérer depuis le contexte d'auth)
  const mockToken = 'mock-jwt-token-for-testing';

  useEffect(() => {
    // Auto-connect au chargement du composant
    if (!isConnected && !isConnecting) {
      connect(mockToken);
    }

    // Cleanup à la déconnexion du composant
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, []);

  const handleJoinGame = () => {
    if (isConnected) {
      joinGame(testGameId);
      setIsInGame(true);
    }
  };

  const handleLeaveGame = () => {
    if (isConnected) {
      leaveGame(testGameId);
      setIsInGame(false);
    }
  };

  const handleTestAction = () => {
    if (isConnected) {
      sendGameAction(testGameId, 'test-action', {
        message: 'Test action from WebSocket',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'reconnecting': return 'bg-orange-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connecté';
      case 'connecting': return 'Connexion...';
      case 'reconnecting': return `Reconnexion... (${reconnectAttempts})`;
      case 'disconnected': return 'Déconnecté';
      default: return 'Inconnu';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔌 Test WebSocket
          <Badge className={getStatusColor(connectionStatus)}>
            {getStatusText(connectionStatus)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut de connexion */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">État:</span> {connectionStatus}
          </div>
          <div>
            <span className="font-medium">Reconnexions:</span> {reconnectAttempts}
          </div>
        </div>

        {lastError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">
              <strong>Erreur:</strong> {lastError}
            </p>
          </div>
        )}

        <Separator />

        {/* Contrôles de connexion */}
        <div className="flex gap-2">
          <Button 
            onClick={() => connect(mockToken)}
            disabled={isConnected || isConnecting}
            variant="outline"
            size="sm"
          >
            Se connecter
          </Button>
          <Button 
            onClick={disconnect}
            disabled={!isConnected}
            variant="outline"
            size="sm"
          >
            Se déconnecter
          </Button>
        </div>

        <Separator />

        {/* Contrôles de jeu */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">ID de partie:</span>
            <input
              type="text"
              value={testGameId}
              onChange={(e) => setTestGameId(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
              placeholder="test-game-123"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleJoinGame}
              disabled={!isConnected || isInGame}
              size="sm"
            >
              Rejoindre la partie
            </Button>
            <Button 
              onClick={handleLeaveGame}
              disabled={!isConnected || !isInGame}
              variant="outline"
              size="sm"
            >
              Quitter la partie
            </Button>
            <Button 
              onClick={handleTestAction}
              disabled={!isConnected || !isInGame}
              variant="secondary"
              size="sm"
            >
              Action test
            </Button>
          </div>
        </div>

        {/* Statistiques de jeu */}
        {hasActiveGame && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Joueurs:</span> {gameStats.activePlayers}/{gameStats.totalPlayers}
              </div>
              <div>
                <span className="font-medium">Pot:</span> {gameStats.currentPot} Koras
              </div>
              <div>
                <span className="font-medium">Cartes en jeu:</span> {gameStats.cardsInPlay}
              </div>
              <div>
                <span className="font-medium">Dans la partie:</span> {isInGame ? '✅' : '❌'}
              </div>
            </div>
          </>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            <strong>Instructions:</strong> Ce composant teste la connexion WebSocket. 
            Ouvrez la console pour voir les événements en temps réel.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 