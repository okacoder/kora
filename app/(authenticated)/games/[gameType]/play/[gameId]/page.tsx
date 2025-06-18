"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  IconCoin, 
  IconTrophy, 
  IconCrown, 
  IconRobot 
} from '@tabler/icons-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useGameEngineService, useEventBus, useGarameAI } from '@/hooks/useInjection';
import { useUser } from '@/providers/user-provider';
import { GarameState, GarameCard } from '@/lib/garame/games/garame/garame-types';

// NOTE: Ces composants sont spécifiques au jeu 'garame' et devront être rendus conditionnellement
// ou remplacés par un système de rendu de jeu dynamique basé sur `params.gameType`.
// Pour l'instant, ils sont importés directement pour l'exemple du 'garame'.

// Placeholder pour GameEndModal
function GameEndModal({ open, onClose, result }: { open: boolean; onClose: () => void; result: any; }) {
    if (!open) return null;
    const isWinner = result.winners?.some((w: any) => w.id === useUser().user?.id);
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <Card className="w-full max-w-sm">
                <CardContent className="p-6 text-center">
                    <h2 className="text-2xl font-bold mb-2">
                        {isWinner ? '🎉 Victoire ! 🎉' : '😥 Défaite 😥'}
                    </h2>
                    <p className="mb-4">
                        {isWinner ? `Vous avez gagné ${result.winnings || 0} Koras !` : 'Meilleure chance la prochaine fois.'}
                    </p>
                    <Button onClick={onClose} className="w-full">
                        Retour aux jeux
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

// Placeholder pour PlayingCard
function PlayingCard({ card, onClick, selected, disabled, size }: { card: GarameCard; onClick?: () => void; selected?: boolean; disabled?: boolean; size?: 'large' | 'normal' }) {
    return (
        <div 
            onClick={!disabled ? onClick : undefined}
            className={`w-20 h-28 rounded-lg flex items-center justify-center font-bold text-2xl border-2 ${selected ? 'border-primary' : 'border-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${size === 'large' ? 'w-24 h-36' : ''}`}
        >
            {card.suit[0]}{card.rank}
        </div>
    );
}


interface PlayPageProps {
  params: { 
    gameType: string;
    gameId: string; 
  };
}

export default function GaramePlayPage({ params }: PlayPageProps) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const gameEngine = useGameEngineService();
  const eventBus = useEventBus();
  // NOTE: L'IA est spécifique au 'garame' pour l'instant
  const { getNextMove } = useGarameAI();

  const [gameState, setGameState] = useState<GarameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<GarameCard | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);

  useEffect(() => {
    // TODO: Implémenter une logique pour charger le bon composant de jeu
    // en fonction de `params.gameType`. Pour l'instant, seul 'garame' est géré.
    if (params.gameType !== 'garame') {
        toast.error(`Le jeu '${params.gameType}' n'est pas encore implémenté.`);
        router.push('/games');
        return;
    }

    loadGameState();

    const handleActionPlayed = (data: { gameId: string; }) => {
      if (data.gameId === params.gameId) loadGameState();
    };
    const handleStateUpdated = (data: { gameId: string; state: any; }) => {
      if (data.gameId === params.gameId && data.state) {
        setGameState(data.state);
        setIsMyTurn(data.state.currentPlayerId === user?.id);
      }
    };
    const handleGameEnded = async (data: { gameId: string; }) => {
      if (data.gameId === params.gameId) {
        setGameResult(data);
        setShowEndModal(true);
        await refreshUser();
      }
    };

    eventBus.on('game.action_played', handleActionPlayed);
    eventBus.on('game.state_updated', handleStateUpdated);
    eventBus.on('game.ended', handleGameEnded);

    return () => {
      eventBus.off('game.action_played', handleActionPlayed);
      eventBus.off('game.state_updated', handleStateUpdated);
      eventBus.off('game.ended', handleGameEnded);
    };
  }, [params.gameId, params.gameType, user?.id, gameEngine, eventBus, router, refreshUser]);

  useEffect(() => {
    const isAITurn = () => {
        if (!gameState) return false;
        const currentPlayer = gameState.players.get(gameState.currentPlayerId);
        return currentPlayer?.isAI || false;
    };

    const playAITurn = async () => {
        if (!gameState) return;
        await new Promise(resolve => setTimeout(resolve, 1500));
        const aiMove = await getNextMove(gameState, gameState.currentPlayerId);
        if (aiMove) {
            await gameEngine.processAction(params.gameId, aiMove);
        }
    };

    if (isAITurn()) {
      playAITurn();
    }
  }, [gameState, getNextMove, gameEngine, params.gameId]);

  const loadGameState = async () => {
    try {
      const state = await gameEngine.getGameState(params.gameId);
      if (!state) {
        toast.error('Partie introuvable');
        router.push('/games');
        return;
      }
      
      setGameState(state as GarameState);
      setIsMyTurn(state.currentPlayerId === user?.id);
    } catch (error) {
      toast.error('Erreur lors du chargement');
      router.push('/games');
    } finally {
      setLoading(false);
    }
  };

  const playCard = async (card: GarameCard) => {
    if (!isMyTurn || !user) return;

    try {
      const action = {
        type: 'play_card',
        playerId: user.id,
        data: { cardId: card.id },
      };

      await gameEngine.processAction(params.gameId, action);
      setSelectedCard(null);
    } catch (error: any) {
      toast.error(error.message || 'Coup invalide');
    }
  };

  if (loading || !gameState) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de la partie...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.get(user?.id || '');
  const opponent = Array.from(gameState.players.values()).find(p => p.id !== user?.id);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card className={opponent?.id === gameState.currentPlayerId ? 'ring-2 ring-primary' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold flex items-center gap-2">
                  {opponent?.name || 'Adversaire'}
                  {opponent?.isAI && (
                    <Badge variant="secondary" className="text-xs">
                      <IconRobot className="h-3 w-3" />
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {opponent?.hand.length || 0} cartes
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{opponent?.score || 0}</p>
                {opponent?.hasKora && (
                  <IconCrown className="h-5 w-5 text-yellow-500 ml-auto" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Tour {gameState.turn}</p>
            <p className="text-lg font-semibold flex items-center justify-center gap-2">
              <IconCoin className="h-5 w-5" />
              {gameState.pot} Koras
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Premier à {gameState.maxScore} points
            </p>
          </CardContent>
        </Card>

        <Card className={isMyTurn ? 'ring-2 ring-primary' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Vous</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlayer?.hand.length || 0} cartes
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{currentPlayer?.score || 0}</p>
                {currentPlayer?.hasKora && (
                  <IconCrown className="h-5 w-5 text-yellow-500 ml-auto" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="min-h-[200px] flex items-center justify-center">
            {gameState.lastPlayedCard ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Dernière carte jouée</p>
                <PlayingCard card={gameState.lastPlayedCard} size="large" />
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune carte jouée</p>
            )}
          </div>
          {isMyTurn && (
            <div className="mt-4 text-center">
              <Badge variant="default" className="animate-pulse">
                C'est votre tour !
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Votre main</h3>
            {currentPlayer?.hasKora && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <IconCrown className="h-4 w-4" />
                Vous avez la Kora
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {currentPlayer?.hand.map((card) => (
              <div key={card.id} className="relative group">
                <PlayingCard
                  card={card}
                  onClick={() => isMyTurn && setSelectedCard(card)}
                  selected={selectedCard?.id === card.id}
                  disabled={!isMyTurn}
                />
                {selectedCard?.id === card.id && (
                  <Button
                    size="sm"
                    className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 z-10"
                    onClick={() => playCard(card)}
                  >
                    Jouer
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <GameEndModal
        open={showEndModal}
        onClose={() => {
          setShowEndModal(false);
          router.push('/games');
        }}
        result={gameResult}
      />
    </div>
  );
} 