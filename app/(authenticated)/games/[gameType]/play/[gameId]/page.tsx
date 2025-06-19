"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  IconCoin, 
  IconCrown, 
  IconRobot,
  IconLoader2,
  IconArrowLeft
} from '@tabler/icons-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GameTable from '@/components/game-table';

import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';

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
  const user = useCurrentUser();
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

interface GameCard {
  id: string;
  suit: string;
  rank: string;
  value: number;
}

interface PlayingCardProps {
  card: GameCard;
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
  hand: GameCard[];
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

const MOCK_CARDS: GameCard[] = [
  { id: '1', suit: '♠', rank: 'A', value: 14 },
  { id: '2', suit: '♥', rank: 'K', value: 13 },
  { id: '3', suit: '♦', rank: 'Q', value: 12 },
  { id: '4', suit: '♣', rank: 'J', value: 11 },
  { id: '5', suit: '♠', rank: '10', value: 10 }
];

export default function PlayPage() {
  const params = useParams<{ gameType: string, gameId: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  const [gameState, setGameState] = useState<GameState | null>({
        id: '1',
        status: 'PLAYING',
        currentPlayerId: '1',
        players: new Map([
          ['1', { 
            id: '1', 
            name: 'John Doe', 
            isAI: false, 
            hand: MOCK_CARDS.slice(0, 3), 
            score: 120, 
            hasKora: true 
          }],
          ['2', { 
            id: '2', 
            name: 'AI Player', 
            isAI: true, 
            hand: MOCK_CARDS.slice(3, 5), 
            score: 80, 
            hasKora: false 
          }],
        ]),
        turn: 5,
        pot: 1000,
        metadata: {
          maxScore: 500
        }
      });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [gameResult, setGameResult] = useState<any>({
    winners: [],
    metadata: { winnings: 500 }
  });

  const playCard = async (card: GameCard) => {
    //if (!isMyTurn || !user || !gameState) return;

    try {
      // await gameService.playCard(gameState.id, user.id, card.id);
      setSelectedCard(null);
      // await loadGameState();
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

  const currentPlayer = gameState.players.get('1');
  const opponent = Array.from(gameState.players.values()).find(p => p.id !== '1');

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
    <div className="absolute inset-0 flex flex-col">
      <GameEndModal 
        open={showEndModal} 
        onClose={handleEndGame}
        result={gameResult}
      />

      <div className="mb-2 flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/games')}>
          <IconArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-bold">Partie en cours</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1">
        {/* Game Board */}
        <div className="flex-1 lg:flex-1">
          <GameTable
            gameState={{
              players: new Map(Array.from(gameState.players.entries()).map(([id, player]) => [
                id,
                {
                  ...player,
                  cards: player.hand.map(card => ({
                    suit: card.suit,
                    rank: card.rank
                  })),
                  score: player.score,
                  hasKora: player.hasKora
                }
              ])),
              currentPlayerId: gameState.currentPlayerId,
              pot: gameState.pot,
              metadata: gameState.metadata
            }}
            currentPlayerId={currentPlayer.id}
            playerNames={new Map(Array.from(gameState.players.entries()).map(([id, player]) => [
              id,
              player.name
            ]))}
            onCardClick={(playerId, cardIndex) => {
              if (playerId === currentPlayer.id && currentPlayer.hand[cardIndex]) {
                playCard(currentPlayer.hand[cardIndex]);
              }
            }}
            className="h-full"
          />
        </div>

        {/* Game Info Cards */}
        <div className="gap-2 p-4 flex flex-row lg:flex-col lg:gap-4 lg:p-0">
          {/* Opponent */}
          <Card className={cn("p-0 flex-1 lg:flex-none", opponent.id === gameState.currentPlayerId ? 'ring-2 ring-primary' : '')}>
            <CardContent className="p-2 lg:p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1 lg:gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-sm lg:text-base font-semibold">{opponent.name}</span>
                      {opponent.isAI && <IconRobot className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] lg:text-xs text-muted-foreground">
                      <span>{opponent.hand.length} cartes</span>
                      {opponent.hasKora && <IconCrown className="h-3 w-3 text-yellow-500" />}
                    </div>
                  </div>
                </div>
                <div className="text-right lg:text-center">
                  <span className="text-lg lg:text-2xl font-bold">{opponent.score}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Info */}
          <Card className="p-0 flex-1 lg:flex-none">
            <CardContent className="p-2 lg:p-4">
              <div className="flex flex-col items-center justify-center gap-0.5 lg:gap-1">
                <span className="text-xs lg:text-sm text-muted-foreground">Tour {gameState.turn}</span>
                <div className="flex items-center gap-1">
                  <IconCoin className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
                  <span className="text-sm lg:text-lg font-bold">{gameState.pot}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Player */}
          <Card className={cn("p-0 flex-1 lg:flex-none", currentPlayer.id === gameState.currentPlayerId ? 'ring-2 ring-primary' : '')}>
            <CardContent className="p-2 lg:p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1 lg:gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-sm lg:text-base font-semibold">{currentPlayer.name}</span>
                      {isMyTurn && (
                        <Badge variant="secondary" className="text-[8px] lg:text-xs px-1.5 py-0 h-3.5 lg:h-5">À vous</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] lg:text-xs text-muted-foreground">
                      <span>{currentPlayer.hand.length} cartes</span>
                      {currentPlayer.hasKora && <IconCrown className="h-3 w-3 text-yellow-500" />}
                    </div>
                  </div>
                </div>
                <div className="text-right lg:text-center">
                  <span className="text-lg lg:text-2xl font-bold">{currentPlayer.score}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}