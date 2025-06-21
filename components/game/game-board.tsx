"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc/client';
import { PlayingCard, HiddenCard, CardSlot } from './playing-card';
import { EnhancedPlayingCard } from './enhanced-playing-card';
import { useCardAnimation } from '@/hooks/use-card-animation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Crown, 
  Users, 
  Coins, 
  Clock, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Timer
} from 'lucide-react';
import { GarameState, GarameCard } from '@/lib/game-engine/games/garame/GarameState';
import { useCurrentUser } from '@/hooks/use-current-user';

interface GameBoardProps {
  gameId: string;
}

export function GameBoard({ gameId }: GameBoardProps) {
  const user = useCurrentUser();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [gameTimer, setGameTimer] = useState(0);
  
  // Animation hook
  const { getCardState } = useCardAnimation({
    phase: 'playing',
    isMyTurn: false,
    playableCards: [],
    tableCards: []
  }, selectedCard);

  // Queries
  const { data: gameData, refetch: refetchGame } = trpc.game.getGameState.useQuery(
    { gameId },
    { 
      refetchInterval: 2000, // Actualisation toutes les 2 secondes
      enabled: !!gameId 
    }
  );

  const { data: moves } = trpc.game.getMoves.useQuery(
    { gameId },
    { enabled: !!gameId }
  );

  // Mutations
  const playCard = trpc.game.playCard.useMutation({
    onSuccess: (data) => {
      setSelectedCard(null);
      if (data.isGameOver) {
        toast.success(`🎉 Partie terminée ! Gagnant: ${data.winner}`);
      } else {
        toast.success('Carte jouée !');
      }
      refetchGame();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // CORRECTION: Fold retiré car impossible au Garame

  // Timer du jeu
  useEffect(() => {
    if (gameData?.status === 'IN_PROGRESS') {
      const interval = setInterval(() => {
        setGameTimer(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameData?.status]);

  if (!gameData || !user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de la partie...</p>
        </div>
      </div>
    );
  }

  const gameState = gameData.gameState as unknown as GarameState;
  const currentPlayer = gameState?.players?.[user.id];
  const isMyTurn = gameData.currentPlayerId === user.id;
  const otherPlayers = gameData.players.filter(p => p.userId !== user.id);
  
  // Update animation hook with current game state
  const { getCardState: getAnimatedCardState } = useCardAnimation({
    phase: 'playing',
    isMyTurn,
    playableCards: currentPlayer?.hand?.map(c => c.id) || [],
    tableCards: gameState?.tableCards || []
  }, selectedCard);

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn) {
      toast.warning("Ce n'est pas votre tour !");
      return;
    }
    
    if (selectedCard === cardId) {
      // Jouer la carte sélectionnée
      playCard.mutate({ gameId, cardId });
    } else {
      // Sélectionner la carte
      setSelectedCard(cardId);
    }
  };

  // CORRECTION: Fonction handleFold supprimée car impossible au Garame

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête du jeu */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="h-6 w-6 text-yellow-400" />
                  Garame - Partie {gameId.slice(-8)}
                </CardTitle>
                <div className="flex items-center gap-4 text-white">
                  <div className="flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    <span className="text-sm">{formatTime(gameTimer)}</span>
                  </div>
                  <Badge variant={gameData.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                    {gameData.status === 'IN_PROGRESS' ? 'En cours' : gameData.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4 text-white">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">Pot: {gameData.totalPot} Koras</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">{gameData.players.length} joueurs</span>
                </div>
                <div className="flex items-center gap-2">
                  {isMyTurn ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium">Votre tour</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-orange-400" />
                      <span className="text-sm">En attente...</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Zone de jeu principale */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Plateau central */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Joueurs adverses */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {otherPlayers.map((player, index) => (
                <Card key={player.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {player.user?.name?.[0] || player.name[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {player.user?.name || player.name}
                          </p>
                          <p className="text-white/60 text-xs">Position {player.position}</p>
                        </div>
                      </div>
                      {gameData.currentPlayerId === player.userId && (
                        <Badge className="bg-green-500 text-white">
                          À son tour
                        </Badge>
                      )}
                    </div>
                    
                    {/* Cartes de l'adversaire (cachées) */}
                    <div className="flex gap-1 justify-center">
                      {Array.from({ length: 5 }).map((_, cardIndex) => (
                        <EnhancedPlayingCard
                          key={cardIndex}
                          state="hidden"
                          size="sm"
                          delay={cardIndex * 0.05}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Zone centrale - Cartes jouées */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="text-center mb-4">
                <h3 className="text-white font-medium">Cartes jouées ce tour</h3>
                <p className="text-white/60 text-sm">
                  Tour {gameState?.currentRound || 1} sur {gameState?.maxRounds || 5}
                </p>
              </div>
              
              <div className="flex justify-center gap-4 min-h-32">
                {gameState?.tableCards?.length > 0 ? (
                  <AnimatePresence>
                    {gameState.tableCards.map((card, index) => (
                      <motion.div
                        key={`${card.id}-${index}`}
                        initial={{ scale: 0, rotateY: 180 }}
                        animate={{ scale: 1, rotateY: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ delay: index * 0.2 }}
                      >
                        <EnhancedPlayingCard
                          card={card}
                          state="played"
                          size="md"
                          delay={index * 0.1}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="flex gap-4">
                    {Array.from({ length: gameData.players.length }).map((_, index) => (
                      <CardSlot key={index} size="md" />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Ma main */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Votre main</h3>
                {selectedCard && (
                  <Badge className="bg-blue-500 text-white">
                    Carte sélectionnée
                  </Badge>
                )}
              </div>
              
              <div className="flex justify-center gap-2 mb-4">
                {currentPlayer?.hand?.map((card, index) => (
                  <EnhancedPlayingCard
                    key={card.id}
                    card={card}
                    state={getAnimatedCardState(card, true, selectedCard === card.id)}
                    onClick={() => handleCardClick(card.id)}
                    size="lg"
                    delay={index * 0.1}
                  />
                )) || (
                  <div className="text-white/60">Aucune carte disponible</div>
                )}
              </div>

              {/* Actions - CORRECTION: Bouton "Se coucher" retiré car impossible au Garame */}
              {isMyTurn && (
                <div className="flex justify-center gap-3">
                  {selectedCard && (
                    <Button
                      onClick={() => playCard.mutate({ gameId, cardId: selectedCard })}
                      disabled={playCard.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {playCard.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Jouer...
                        </>
                      ) : (
                        'Jouer la carte'
                      )}
                    </Button>
                  )}
                  
                  {/* Message explicatif pour Garame */}
                  {!selectedCard && (
                    <p className="text-white/60 text-sm text-center">
                      Sélectionnez une carte à jouer (impossible de se coucher au Garame)
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Panneau latéral - Statistiques et historique */}
          <div className="space-y-6">
            
            {/* Statistiques de la partie */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-white">
                  <div className="flex justify-between text-sm">
                    <span>Cartes gagnées:</span>
                    <span className="font-medium">{currentPlayer?.cardsWon?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Koras gagnés:</span>
                    <span className="font-medium text-yellow-400">{currentPlayer?.korasWon || 0}</span>
                  </div>
                </div>
                
                <Separator className="bg-white/20" />
                
                <div className="text-white">
                  <p className="text-xs text-white/60 mb-2">Progression du tour</p>
                  <Progress 
                    value={((gameState?.currentRound || 1) / (gameState?.maxRounds || 5)) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-white/60 mt-1">
                    Tour {gameState?.currentRound || 1} / {gameState?.maxRounds || 5}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Historique des mouvements */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Historique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {moves?.slice(-5).reverse().map((move, index) => (
                    <div key={move.id} className="text-xs text-white/80 bg-white/5 rounded p-2">
                      <div className="font-medium">{move.playerName}</div>
                      <div className="text-white/60">
                        {move.moveType === 'PLAY_CARD' ? 'A joué une carte' :
                         move.moveType === 'FOLD' ? 'S\'est couché' : move.moveType}
                      </div>
                    </div>
                  )) || (
                    <div className="text-white/60 text-xs text-center py-4">
                      Aucun mouvement encore
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 