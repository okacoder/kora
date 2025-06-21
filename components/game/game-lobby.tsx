"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Plus, 
  Users, 
  Coins, 
  Clock, 
  Play,
  Crown,
  Bot,
  Gamepad2,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GameLobbyProps {
  onGameJoined?: (gameId: string) => void;
}

export function GameLobby({ onGameJoined }: GameLobbyProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    betAmount: 50,
    maxPlayers: 2,
    aiLevel: 'NONE' as 'NONE' | 'EASY' | 'MEDIUM' | 'HARD',
  });

  // Queries
  const { data: availableGames, refetch: refetchGames } = trpc.game.getAvailable.useQuery(
    undefined,
    { refetchInterval: 3000 }
  );

  // Mutations
  const createGame = trpc.game.create.useMutation({
    onSuccess: (data) => {
      toast.success('Partie créée avec succès !');
      setShowCreateForm(false);
      if (onGameJoined) {
        onGameJoined(data.id);
      } else {
        router.push(`/games/play/${data.id}`);
      }
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const joinGame = trpc.game.join.useMutation({
    onSuccess: (data) => {
      toast.success('Vous avez rejoint la partie !');
      // data contient { success: boolean }, on utilise le gameId passé en paramètre
      if (onGameJoined) {
        // onGameJoined sera appelé avec le gameId dans handleJoinGame
      } else {
        // La navigation sera gérée dans handleJoinGame
      }
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleCreateGame = () => {
    createGame.mutate({
      gameType: 'garame',
      betAmount: createForm.betAmount,
      maxPlayers: createForm.maxPlayers,
      aiLevel: createForm.aiLevel !== 'NONE' ? createForm.aiLevel : undefined,
    });
  };

  const handleJoinGame = (gameId: string) => {
    joinGame.mutate({ gameId }, {
      onSuccess: () => {
        if (onGameJoined) {
          onGameJoined(gameId);
        } else {
          router.push(`/games/play/${gameId}`);
        }
      }
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Gamepad2 className="h-10 w-10 text-yellow-400" />
            Lobby Garame
          </h1>
          <p className="text-white/70">Rejoignez une partie ou créez la vôtre !</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Parties disponibles */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Actions principales */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between"
            >
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Users className="h-6 w-6" />
                Parties disponibles
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => refetchGames()}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une partie
                </Button>
              </div>
            </motion.div>

            {/* Liste des parties */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {(availableGames?.length ?? 0) > 0 ? (
                availableGames!.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            
                            {/* Info de la partie */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Crown className="h-4 w-4 text-yellow-400" />
                                <span className="text-white font-medium">
                                  Partie #{game.id.slice(-6)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-white/70">
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>{game.currentPlayers}/{game.maxPlayers} joueurs</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Coins className="h-3 w-3 text-yellow-400" />
                                  <span>{game.betAmount} Koras</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTimeAgo(new Date(game.createdAt))}</span>
                                </div>
                              </div>
                            </div>

                            {/* Créateur */}
                            <div className="text-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mb-1">
                                {game.players[0]?.user?.name?.[0] || 'U'}
                              </div>
                              <p className="text-xs text-white/60">{game.players[0]?.user?.name || 'Joueur'}</p>
                            </div>

                            {/* Action */}
                            <Button
                              onClick={() => handleJoinGame(game.id)}
                              disabled={joinGame.isPending}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {joinGame.isPending ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Connexion...
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Rejoindre
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-8 text-center">
                    <Gamepad2 className="h-12 w-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 mb-4">Aucune partie disponible pour le moment</p>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer la première partie
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>

          {/* Panneau de création */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            
            {/* Formulaire de création */}
            {showCreateForm ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Créer une partie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Montant de la mise */}
                  <div className="space-y-2">
                    <Label className="text-white">Mise (Koras)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={1000}
                      step={10}
                      value={createForm.betAmount}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        betAmount: parseInt(e.target.value) || 50
                      }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  {/* Nombre de joueurs */}
                  <div className="space-y-2">
                    <Label className="text-white">Nombre maximum de joueurs</Label>
                    <Select
                      value={createForm.maxPlayers.toString()}
                      onValueChange={(value) => setCreateForm(prev => ({
                        ...prev,
                        maxPlayers: parseInt(value)
                      }))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 joueurs</SelectItem>
                        <SelectItem value="3">3 joueurs</SelectItem>
                        <SelectItem value="4">4 joueurs</SelectItem>
                        <SelectItem value="5">5 joueurs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Niveau IA */}
                  <div className="space-y-2">
                    <Label className="text-white">Adversaire IA (optionnel)</Label>
                    <Select
                      value={createForm.aiLevel}
                      onValueChange={(value) => setCreateForm(prev => ({
                        ...prev,
                        aiLevel: value as 'NONE' | 'EASY' | 'MEDIUM' | 'HARD'
                      }))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Aucune IA</SelectItem>
                        <SelectItem value="EASY">IA Facile</SelectItem>
                        <SelectItem value="MEDIUM">IA Moyenne</SelectItem>
                        <SelectItem value="HARD">IA Difficile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="bg-white/20" />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleCreateGame}
                      disabled={createGame.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {createGame.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Création...
                        </>
                      ) : (
                        'Créer'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-400" />
                    Règles du Garame
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-white/80 text-sm">
                  <div>
                    <h4 className="font-medium text-white mb-1">🎯 Objectif</h4>
                    <p>Gagner le plus de cartes et réaliser des combinaisons spéciales (Koras).</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white mb-1">✨ Koras spéciaux</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• 2 cartes de 3: Kora simple (x0.5)</li>
                      <li>• 3 cartes de 3: Kora double (x1)</li>
                      <li>• 4 cartes de 3: Kora triple (x2)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white mb-1">🃏 Déroulement</h4>
                    <p>5 tours, chaque joueur joue une carte par tour. La carte la plus haute gagne le pli.</p>
                  </div>
                  
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full bg-green-600 hover:bg-green-700 mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une partie
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Statistiques rapides */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-sm">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-white/70 text-sm">
                <div className="flex justify-between">
                  <span>Parties actives:</span>
                  <span className="font-medium">{availableGames?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Joueurs en ligne:</span>
                  <span className="font-medium">
                    {availableGames?.reduce((sum, game) => sum + game.currentPlayers, 0) || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 