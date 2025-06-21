"use client";

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Play, Users, Coins } from 'lucide-react';

export function TestGameEngine() {
  const [gameId, setGameId] = useState<string>('');
  const [betAmount, setBetAmount] = useState(50);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [aiLevel, setAiLevel] = useState<'EASY' | 'MEDIUM' | 'HARD' | undefined>(undefined);

  // Queries
  const { data: availableGames, refetch: refetchGames } = trpc.game.getAvailable.useQuery();
  const { data: gameState, refetch: refetchGameState } = trpc.game.getGameState.useQuery(
    { gameId },
    { enabled: !!gameId }
  );

  // Mutations
  const createGame = trpc.game.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Partie créée avec succès ! ID: ${data.id}`);
      setGameId(data.id);
      refetchGames();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const joinGame = trpc.game.join.useMutation({
    onSuccess: (data) => {
      toast.success(data.gameStarted ? 'Partie rejointe et démarrée !' : 'Partie rejointe !');
      refetchGames();
      refetchGameState();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const playCard = trpc.game.playCard.useMutation({
    onSuccess: (data) => {
      toast.success(data.isGameOver ? `Partie terminée ! Gagnant: ${data.winner}` : 'Carte jouée !');
      refetchGameState();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const fold = trpc.game.fold.useMutation({
    onSuccess: () => {
      toast.success('Vous vous êtes couché');
      refetchGameState();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleCreateGame = () => {
    createGame.mutate({
      gameType: 'garame',
      betAmount,
      maxPlayers,
      aiLevel,
    });
  };

  const handleJoinGame = (gameId: string) => {
    joinGame.mutate({ gameId });
  };

  const handlePlayCard = (cardId: string) => {
    if (!gameId) {
      toast.error('Aucune partie sélectionnée');
      return;
    }
    playCard.mutate({ gameId, cardId });
  };

  const handleFold = () => {
    if (!gameId) {
      toast.error('Aucune partie sélectionnée');
      return;
    }
    fold.mutate({ gameId });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Test Moteur de Jeu + tRPC</h1>
        <p className="text-muted-foreground">Intégration GameEngine avec tRPC</p>
      </div>

      {/* Création de partie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Créer une nouvelle partie
          </CardTitle>
          <CardDescription>
            Créez une partie Garame avec ou sans IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Mise (Koras)</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min={10}
                max={1000}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Joueurs max</label>
              <Input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                min={2}
                max={5}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Niveau IA (optionnel)</label>
            <Select value={aiLevel || 'NONE'} onValueChange={(value) => setAiLevel(value === 'NONE' ? undefined : value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un niveau IA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Pas d'IA (multijoueur)</SelectItem>
                <SelectItem value="EASY">Facile</SelectItem>
                <SelectItem value="MEDIUM">Moyen</SelectItem>
                <SelectItem value="HARD">Difficile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleCreateGame} 
            disabled={createGame.isPending}
            className="w-full"
          >
            {createGame.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer la partie
          </Button>
        </CardContent>
      </Card>

      {/* Parties disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Parties disponibles
          </CardTitle>
          <CardDescription>
            Rejoignez une partie existante
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableGames?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucune partie disponible
            </p>
          ) : (
            <div className="space-y-2">
              {availableGames?.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{game.type}</Badge>
                      <span className="text-sm font-medium">
                        {game.currentPlayers}/{game.maxPlayers} joueurs
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      Mise: {game.betAmount} Koras
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleJoinGame(game.id)}
                    disabled={joinGame.isPending}
                  >
                    {joinGame.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Rejoindre
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => refetchGames()}
            className="w-full mt-4"
          >
            Actualiser
          </Button>
        </CardContent>
      </Card>

      {/* État de la partie actuelle */}
      {gameId && (
        <Card>
          <CardHeader>
            <CardTitle>Partie actuelle</CardTitle>
            <CardDescription>ID: {gameId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gameState ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Statut</p>
                    <Badge>{gameState.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pot total</p>
                    <p className="text-lg font-bold">{gameState.totalPot} Koras</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Joueurs</p>
                  <div className="space-y-2">
                    {gameState.players.map((player) => (
                      <div
                        key={player.id}
                        className={`flex justify-between items-center p-2 border rounded ${
                          player.userId === gameState.currentPlayerId ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <span className="font-medium">
                          {player.user?.name || 'Joueur IA'}
                          {player.userId === gameState.currentPlayerId && (
                            <Badge variant="secondary" className="ml-2">À son tour</Badge>
                          )}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Position {player.position}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {gameState.status === 'IN_PROGRESS' && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => handlePlayCard('test_card_id')}
                      disabled={playCard.isPending}
                      className="w-full"
                    >
                      {playCard.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Jouer une carte (test)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleFold}
                      disabled={fold.isPending}
                      className="w-full"
                    >
                      {fold.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Se coucher
                    </Button>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => refetchGameState()}
                  className="w-full"
                >
                  Actualiser l'état
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Chargement de l'état de la partie...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 