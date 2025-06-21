'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebSocket } from '@/lib/websocket/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import { trpc } from '@/lib/trpc/client';

interface AITestResult {
  playerId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  move: any;
  confidence: number;
  reasoning: string;
  timestamp: Date;
}

export function TestAIMultiplayer() {
  const user = useCurrentUser();
  const {
    isConnected,
    isConnecting,
    connectionError,
    currentGameId,
    gameState,
    players,
    messages,
    connect,
    disconnect,
    joinGame,
    leaveGame,
    sendGameAction,
    sendMessage,
    setPlayerReady
  } = useWebSocket();

  // État local
  const [newGameStake, setNewGameStake] = useState(100);
  const [aiDifficulty, setAiDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [aiTestResults, setAiTestResults] = useState<AITestResult[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Mutations tRPC
  const createGameMutation = trpc.game.create.useMutation();
  const joinGameMutation = trpc.game.join.useMutation();
  const playCardMutation = trpc.game.playCard.useMutation();
  const foldMutation = trpc.game.fold.useMutation();

  // Queries tRPC
  const { data: availableGamesData, refetch: refetchGames } = trpc.game.getAvailable.useQuery();

  useEffect(() => {
    if (availableGamesData) {
      setAvailableGames(availableGamesData);
    }
  }, [availableGamesData]);

  // Connexion automatique au WebSocket
  useEffect(() => {
    if (user && !isConnected && !isConnecting) {
      // Simuler un token pour la démo
      connect(user.id);
    }
  }, [user, isConnected, isConnecting, connect]);

  /**
   * Crée une nouvelle partie avec IA
   */
  const handleCreateAIGame = async () => {
    try {
             const result = await createGameMutation.mutateAsync({
         gameType: 'garame',
         betAmount: newGameStake,
         maxPlayers: 2,
         aiLevel: aiDifficulty
       });

      console.log('Partie IA créée:', result);
      await refetchGames();
      
      // Rejoindre automatiquement la partie
      if (result.id) {
        await joinGame(result.id);
      }
    } catch (error) {
      console.error('Erreur création partie IA:', error);
    }
  };

  /**
   * Crée une nouvelle partie multijoueur
   */
  const handleCreateMultiplayerGame = async () => {
    try {
      const result = await createGameMutation.mutateAsync({
        gameType: 'GARAME',
        betAmount: newGameStake,
        maxPlayers: 4
      });

      console.log('Partie multijoueur créée:', result);
      await refetchGames();
    } catch (error) {
      console.error('Erreur création partie multijoueur:', error);
    }
  };

  /**
   * Rejoint une partie existante
   */
  const handleJoinGame = async (gameId: string) => {
    try {
      await joinGameMutation.mutateAsync({ gameId });
      await joinGame(gameId);
      console.log('Partie rejointe:', gameId);
    } catch (error) {
      console.error('Erreur rejoindre partie:', error);
    }
  };

  /**
   * Joue une carte (simulation)
   */
  const handlePlayCard = async () => {
    if (!currentGameId) return;

    try {
      const result = await playCardMutation.mutateAsync({
        gameId: currentGameId,
        cardId: 'hearts_7' // Carte simulée
      });

      // Envoyer l'action via WebSocket
      sendGameAction({
        type: 'PLAY_CARD',
        cardId: 'hearts_7'
      });

      console.log('Carte jouée:', result);
    } catch (error) {
      console.error('Erreur jouer carte:', error);
    }
  };

  /**
   * Se coucher
   */
  const handleFold = async () => {
    if (!currentGameId) return;

    try {
      await foldMutation.mutateAsync({ gameId: currentGameId });
      
      sendGameAction({
        type: 'FOLD'
      });

      console.log('Couché');
    } catch (error) {
      console.error('Erreur se coucher:', error);
    }
  };

  /**
   * Envoie un message de chat
   */
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendMessage(chatMessage);
      setChatMessage('');
    }
  };

  /**
   * Change le statut "prêt"
   */
  const handleToggleReady = () => {
    const newReady = !isPlayerReady;
    setIsPlayerReady(newReady);
    setPlayerReady(newReady);
  };

  /**
   * Test de l'IA en local
   */
  const handleTestAI = async () => {
    try {
      // Simuler un test d'IA local
      const mockGameState = {
        players: {
          [user?.id || 'test']: {
            id: user?.id || 'test',
            hand: [
              { id: 'hearts_3', rank: 3, suit: 'hearts' },
              { id: 'diamonds_7', rank: 7, suit: 'diamonds' },
              { id: 'clubs_9', rank: 9, suit: 'clubs' }
            ],
            cardsWon: [],
            korasWon: 0,
            hasFolded: false,
            position: 0,
            isReady: true
          }
        },
        currentPlayerId: user?.id || 'test',
        tableCards: [
          { id: 'spades_5', rank: 5, suit: 'spades' }
        ],
        currentRound: 1,
        maxRounds: 5,
        betAmount: 100
      };

      // Simuler le résultat de l'IA
      const aiResult: AITestResult = {
        playerId: 'ai-test',
        difficulty: aiDifficulty,
        move: {
          type: 'PLAY_CARD',
          cardId: 'diamonds_7'
        },
        confidence: 0.75,
        reasoning: `IA ${aiDifficulty}: Joue 7 de carreau pour gagner le pli`,
        timestamp: new Date()
      };

      setAiTestResults(prev => [aiResult, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Erreur test IA:', error);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test IA & Multijoueur</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Veuillez vous connecter pour tester l'IA et le multijoueur.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Phase 5 - Test IA & Multijoueur</h1>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            WebSocket: {isConnected ? 'Connecté' : 'Déconnecté'}
          </Badge>
          {connectionError && (
            <Badge variant="destructive">Erreur: {connectionError}</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Création de Parties */}
        <Card>
          <CardHeader>
            <CardTitle>Créer une Partie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="stake">Mise (Koras)</Label>
              <Input
                id="stake"
                type="number"
                value={newGameStake}
                onChange={(e) => setNewGameStake(Number(e.target.value))}
                min={10}
                max={1000}
              />
            </div>

            <div>
              <Label htmlFor="ai-difficulty">Difficulté IA</Label>
              <Select value={aiDifficulty} onValueChange={(value: any) => setAiDifficulty(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Facile</SelectItem>
                  <SelectItem value="MEDIUM">Moyen</SelectItem>
                  <SelectItem value="HARD">Difficile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateAIGame}
                disabled={createGameMutation.isLoading}
                className="flex-1"
              >
                Partie vs IA
              </Button>
              <Button 
                onClick={handleCreateMultiplayerGame}
                disabled={createGameMutation.isLoading}
                variant="outline"
                className="flex-1"
              >
                Partie Multijoueur
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section Test IA */}
        <Card>
          <CardHeader>
            <CardTitle>Test IA Local</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleTestAI} className="w-full">
              Tester IA {aiDifficulty}
            </Button>

            <ScrollArea className="h-40">
              <div className="space-y-2">
                {aiTestResults.map((result, index) => (
                  <div key={index} className="p-2 bg-muted rounded text-sm">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">{result.difficulty}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {result.confidence * 100}% confiance
                      </span>
                    </div>
                    <p className="mt-1">{result.reasoning}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Section Parties Disponibles */}
        <Card>
          <CardHeader>
            <CardTitle>Parties Disponibles</CardTitle>
            <Button onClick={() => refetchGames()} size="sm" variant="outline">
              Actualiser
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {availableGames.map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{game.creatorName}</div>
                      <div className="text-sm text-muted-foreground">
                        {game.stake} Koras • {game.players?.length || 0}/{game.maxPlayers} joueurs
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleJoinGame(game.id)}
                      disabled={joinGameMutation.isLoading}
                    >
                      Rejoindre
                    </Button>
                  </div>
                ))}
                {availableGames.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Aucune partie disponible
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Section Partie Actuelle */}
        <Card>
          <CardHeader>
            <CardTitle>Partie Actuelle</CardTitle>
            {currentGameId && (
              <Badge variant="outline">ID: {currentGameId}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {currentGameId ? (
              <>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleToggleReady}
                    variant={isPlayerReady ? "default" : "outline"}
                    size="sm"
                  >
                    {isPlayerReady ? "Prêt ✓" : "Pas prêt"}
                  </Button>
                  <Button onClick={leaveGame} variant="destructive" size="sm">
                    Quitter
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Joueurs ({players.length})</h4>
                  <div className="space-y-1">
                    {players.map((player) => (
                      <div key={player.playerId} className="flex items-center gap-2">
                        <Badge variant={player.isConnected ? "default" : "secondary"}>
                          {player.playerName}
                        </Badge>
                        {player.isReady && <span className="text-green-500">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    onClick={handlePlayCard}
                    disabled={playCardMutation.isLoading}
                    size="sm"
                  >
                    Jouer Carte
                  </Button>
                  <Button 
                    onClick={handleFold}
                    disabled={foldMutation.isLoading}
                    variant="outline"
                    size="sm"
                  >
                    Se Coucher
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Chat ({messages.length})</h4>
                  <ScrollArea className="h-24 mb-2">
                    <div className="space-y-1">
                      {messages.map((msg, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{msg.playerName}:</span>{' '}
                          {msg.message}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Tapez votre message..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} size="sm">
                      Envoyer
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Aucune partie en cours
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section État du Jeu (Debug) */}
      {gameState && (
        <Card>
          <CardHeader>
            <CardTitle>État du Jeu (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <pre className="text-xs">
                {JSON.stringify(gameState, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 