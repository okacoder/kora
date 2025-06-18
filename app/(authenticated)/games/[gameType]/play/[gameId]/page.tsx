"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  IconCoin, 
  IconTrophy, 
  IconCrown, 
  IconRobot,
  IconLoader2,
  IconArrowLeft
} from '@tabler/icons-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { useCurrentUser } from '@/hooks/useUser';
import { gameService } from '@/lib/services/game.service';
import { routes } from '@/lib/routes';

interface GameEndModalProps {
  open: boolean;
  onClose: () => void;
  result: {
    winners: Array<{ id: string; name: string }>;
    metadata: {
      winnings: number;
    };
  };
}

function GameEndModal({ open, onClose, result }: GameEndModalProps) {
  const { user } = useCurrentUser();
  if (!open) return null;
  const isWinner = result.winners?.some(w => w.id === user?.id);
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">
            {isWinner ? '🎉 Victoire ! 🎉' : '😥 Défaite 😥'}
          </h2>
          <p className="mb-4">
            {isWinner ? `Vous avez gagné ${result.metadata.winnings || 0} Koras !` : 'Meilleure chance la prochaine fois.'}
          </p>
          <Button onClick={onClose} className="w-full">
            Retour aux jeux
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface Card {
  id: string;
  suit: string;
  rank: string;
  value: number;
}

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'large' | 'normal';
}

function PlayingCard({ card, onClick, selected, disabled, size = 'normal' }: PlayingCardProps) {
  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`
        relative rounded-lg flex items-center justify-center font-bold text-2xl border-2 
        ${selected ? 'border-primary' : 'border-gray-300'} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'} 
        ${size === 'large' ? 'w-24 h-36' : 'w-20 h-28'}
        transition-all duration-200
      `}
    >
      <span className={size === 'large' ? 'text-3xl' : 'text-2xl'}>
        {card.suit[0]}{card.rank}
      </span>
    </div>
  );
}

interface Player {
  id: string;
  name: string;
  isAI: boolean;
  hand: Card[];
  score: number;
  hasKora: boolean;
}

interface GameState {
  id: string;
  status: 'PLAYING' | 'FINISHED';
  currentPlayerId: string;
  players: Map<string, Player>;
  turn: number;
  pot: number;
  metadata: {
    maxScore: number;
  };
}

interface PlayPageProps {
  params: { 
    gameType: string;
    gameId: string; 
  };
}

export default function PlayPage({ params }: PlayPageProps) {
  const router = useRouter();
  const { user, refresh: refreshUser } = useCurrentUser();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);

  useEffect(() => {
    loadGameState();
    // Rafraîchir toutes les 2 secondes
    const interval = setInterval(loadGameState, 2000);
    return () => clearInterval(interval);
  }, [params.gameId]);

  const loadGameState = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const state = await gameService.getGameState(params.gameId);
      setGameState(state as GameState);
      setIsMyTurn(state.currentPlayerId === user.id);

      if (state.status === 'FINISHED') {
        setGameResult(state);
        setShowEndModal(true);
        refreshUser();
      }
    } catch (error: any) {
      setError(error);
      toast.error(error.message || 'Erreur lors du chargement de la partie');
    } finally {
      setLoading(false);
    }
  };

  const playCard = async (card: Card) => {
    if (!isMyTurn || !user || !gameState) return;

    try {
      await gameService.playCard(gameState.id, user.id, card.id);
      setSelectedCard(null);
      await loadGameState();
    } catch (error: any) {
      toast.error(error.message || 'Coup invalide');
    }
  };

  const handleEndGame = () => {
    setShowEndModal(false);
    router.push('/games');
  };

  if (loading || !gameState) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <IconLoader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de la partie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-red-500">Erreur: {error.message}</p>
        <Button onClick={() => router.push('/games')} className="mt-4">
          Retour aux jeux
        </Button>
      </div>
    );
  }

  const currentPlayer = gameState.players.get(user?.id || '');
  const opponent = Array.from(gameState.players.values()).find(p => p.id !== user?.id);

  if (!currentPlayer || !opponent) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-red-500">Erreur: Joueur non trouvé</p>
        <Button onClick={() => router.push('/games')} className="mt-4">
          Retour aux jeux
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <GameEndModal 
        open={showEndModal} 
        onClose={handleEndGame}
        result={gameResult}
      />

      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/games')}>
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Partie en cours</h1>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Opponent */}
        <Card className={opponent.id === gameState.currentPlayerId ? 'ring-2 ring-primary' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold flex items-center gap-2">
                  {opponent.name}
                  {opponent.isAI && (
                    <Badge variant="secondary" className="text-xs">
                      <IconRobot className="h-3 w-3" />
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {opponent.hand.length} cartes
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{opponent.score}</p>
                {opponent.hasKora && (
                  <IconCrown className="h-5 w-5 text-yellow-500 ml-auto" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Info */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Tour {gameState.turn}</p>
            <p className="text-lg font-semibold flex items-center justify-center gap-2">
              <IconCoin className="h-5 w-5" />
              {gameState.pot} Koras
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Premier à {gameState.metadata.maxScore} points
            </p>
          </CardContent>
        </Card>

        {/* Current Player */}
        <Card className={currentPlayer.id === gameState.currentPlayerId ? 'ring-2 ring-primary' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold flex items-center gap-2">
                  {currentPlayer.name}
                  {isMyTurn && (
                    <Badge variant="secondary">À vous de jouer</Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentPlayer.hand.length} cartes
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{currentPlayer.score}</p>
                {currentPlayer.hasKora && (
                  <IconCrown className="h-5 w-5 text-yellow-500 ml-auto" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opponent's Hand */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Main de l'adversaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.from({ length: opponent.hand.length }).map((_, i) => (
                <div 
                  key={i}
                  className="w-20 h-28 rounded-lg border-2 border-gray-300 bg-muted"
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Player's Hand */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Votre main</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 justify-center">
              {currentPlayer.hand.map((card) => (
                <PlayingCard
                  key={card.id}
                  card={card}
                  onClick={() => isMyTurn ? playCard(card) : null}
                  selected={selectedCard?.id === card.id}
                  disabled={!isMyTurn}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 