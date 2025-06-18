"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  IconLoader2,
  IconArrowLeft,
  IconAlertCircle,
  IconCards,
  IconUsers,
  IconTrophy,
  IconCoin
} from "@tabler/icons-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGameEngine } from '@/lib/garame/hooks/use-game-engine';
import { gameRegistry } from '@/lib/garame/core/game-registry';
import { gameStore } from '@/lib/garame/core/game-store';
import { globalEventBus, GameEvents } from '@/lib/garame/core/event-bus';
import type { GameRoom, RoomPlayer } from '@/lib/garame/core/types';
import { PlayerList } from '@/components/game/player-list';

interface GameRenderer {
  renderPlayerArea: (player: RoomPlayer | null, isCurrentPlayer: boolean, gameRoom: GameRoom) => React.ReactNode;
  getGameIcon: () => React.ReactNode;
  getMaxPlayers: () => number;
}

// Default renderer for generic games
const defaultGameRenderer: GameRenderer = {
  renderPlayerArea: (player, isCurrentPlayer, gameRoom) => (
    <div className="flex flex-col items-center justify-center py-8">
      <IconUsers className="h-12 w-12 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">Joueur prêt</p>
    </div>
  ),
  getGameIcon: () => <IconCards className="h-5 w-5" />,
  getMaxPlayers: () => 2,
};

// Garame-specific renderer
const garameRenderer: GameRenderer = {
  renderPlayerArea: (player, isCurrentPlayer, gameRoom) => {
    const CardBack = require("@/components/game-card").CardBack;
    return (
      <div className="flex justify-center">
        <div className="flex -space-x-4 sm:-space-x-6 md:-space-x-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="transform transition-transform hover:scale-105">
              <CardBack width={40} height={56} className="sm:w-[50px] sm:h-[70px] md:w-[60px] md:h-[84px]" />
            </div>
          ))}
        </div>
      </div>
    );
  },
  getGameIcon: () => <IconCards className="h-5 w-5" />,
  getMaxPlayers: () => 2,
};

// Game renderer factory
const getGameRenderer = (gameId: string): GameRenderer => {
  switch (gameId) {
    case 'garame':
      return garameRenderer;
    default:
      return defaultGameRenderer;
  }
};

type GameRoomPageProps = {
  gameLabel: string;
  roomId: string;
}

export default function GameRoomPage({ gameLabel, roomId }: GameRoomPageProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { engine, addAIPlayer } = useGameEngine(gameLabel);

  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameStateId, setGameStateId] = useState<string | null>(null);

  // Get game info and renderer
  const gameInfo = gameRegistry.get(gameLabel);
  const gameRenderer = gameInfo ? {
    renderPlayerArea: () => <div />,
    getGameIcon: () => <gameInfo.icon className="h-5 w-5" />, // fallback
    getMaxPlayers: () => gameInfo.maxPlayers,
  } : null;

  // Load room data
  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    gameStore.getRoom(roomId)
    .then(room => {
    if (!room) {
      toast.error('Salle introuvable');
      setLoading(false);
      router.push('/games');
      return;
    }
    setGameRoom(room);
    setLoading(false);
  })
  .catch(() => {
    toast.error('Salle introuvable');
    setLoading(false);
    router.push('/games');
  });
  }, [roomId]);

  // Subscribe to room events
  useEffect(() => {
    if (!roomId) return;
    const handleRoomEvent = (data: any) => {
      if (data.room && data.room.id === roomId) {
        setGameRoom({ ...data.room });
      }
      if (data.gameStateId) {
        setGameStateId(data.gameStateId);
        setCountdown(5);
      }
    };
    globalEventBus.on(GameEvents.ROOM_JOINED, handleRoomEvent);
    globalEventBus.on(GameEvents.ROOM_UPDATED, handleRoomEvent);
    globalEventBus.on(GameEvents.GAME_STARTED, handleRoomEvent);
    return () => {
      globalEventBus.off(GameEvents.ROOM_JOINED, handleRoomEvent);
      globalEventBus.off(GameEvents.ROOM_UPDATED, handleRoomEvent);
      globalEventBus.off(GameEvents.GAME_STARTED, handleRoomEvent);
    };
  }, [roomId]);

  // Countdown for game start
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setTimeout(() => {
      if (countdown === 1) {
        router.push(`/games/${gameLabel}/play/${gameStateId ?? gameRoom?.id}`);
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, gameRoom, gameStateId, router, gameLabel]);

  // Add AI player
  const handleAddAI = async (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!roomId) return;
    try {
      await addAIPlayer(roomId, difficulty);
      toast.success(`Bot ${difficulty} ajouté!`);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du bot');
    }
  };

  // Kick AI player (not implemented in base engine, placeholder)
  const handleKickPlayer = async (playerId: string) => {
    toast.error('Retrait de bot non implémenté');
  };

  console.log({gameRoom, loading, roomId});

  if (loading || !gameRoom) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de la salle...</p>
        </div>
      </div>
    );
  }

  if (!gameInfo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <IconAlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Jeu non trouvé</p>
          <Button onClick={() => router.push('/games')} variant="outline">
            Retour aux jeux
          </Button>
        </div>
      </div>
    );
  }

  const isCreator = currentUser?.id === gameRoom.creatorId;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 px-4 pb-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/games')}
          className="gap-1 sm:gap-2 px-2 sm:px-4 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40"
          size="sm"
        >
          <IconArrowLeft className="h-4 w-4 align-middle inline-block" />
          <span className="hidden sm:inline">Retour</span>
        </Button>
        <div className="flex items-center gap-2">
          {gameRenderer?.getGameIcon()}
          <Badge variant="outline" className="text-xs sm:text-sm min-h-[28px] flex items-center">
            {gameInfo.name} - Salle #{gameRoom.id}
          </Badge>
        </div>
      </div>
      {/* Room status */}
      <Card className="border-primary/20 rounded-lg shadow-sm mb-2">
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">
            {gameRoom.status === 'waiting' && 'En attente de joueurs...'}
            {gameRoom.status === 'starting' && 'La partie va commencer !'}
            {gameRoom.status === 'in_progress' && 'Partie en cours'}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2">
            <div className="flex items-center justify-center gap-2">
              <IconCoin className="h-4 w-4 align-middle inline-block" />
              <span>Mise totale : {gameRoom.totalPot.toLocaleString()} koras</span>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
      {/* Player List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Joueurs dans la salle</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerList
              players={gameRoom.players as RoomPlayer[]}
              maxPlayers={gameRoom.maxPlayers}
              isHost={isCreator}
              onAddAI={isCreator ? handleAddAI : undefined}
              onKickPlayer={isCreator ? handleKickPlayer : undefined}
            />
          </CardContent>
        </Card>
      </div>
      {/* Info */}
      <Card className="rounded-lg shadow-sm mt-4">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <IconTrophy className="h-4 w-4 sm:h-5 sm:w-5 align-middle inline-block" />
            Informations de la partie
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:block sm:space-y-3">
            <div className="sm:flex sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground block sm:inline">Mise par joueur</span>
              <span className="font-semibold text-sm sm:text-base">{gameRoom.stake.toLocaleString()} koras</span>
            </div>
            <div className="sm:hidden"></div>
            <Separator className="col-span-2 sm:col-span-1" />
            <div className="sm:flex sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground block sm:inline">Pot total</span>
              <span className="font-semibold text-base sm:text-lg">{gameRoom.totalPot.toLocaleString()} koras</span>
            </div>
            <div className="sm:hidden"></div>
            <Separator className="col-span-2 sm:col-span-1" />
            <div className="sm:flex sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground block sm:inline">Gain (90%)</span>
              <span className="font-semibold text-sm sm:text-base text-green-600">
                {Math.floor(gameRoom.totalPot * 0.9).toLocaleString()} koras
              </span>
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground block sm:inline">Commission</span>
              <span className="text-xs sm:text-sm">{Math.floor(gameRoom.totalPot * 0.1).toLocaleString()} koras</span>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Warning */}
      {gameRoom.status === 'waiting' && (
        <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 bg-amber-500/10 rounded-lg border-2 border-amber-500/40 mt-4 shadow-sm">
          <IconAlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0 mt-0.5 align-middle inline-block" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-400 mb-1">
              Important
            </p>
            <p className="text-amber-900 dark:text-amber-400 leading-relaxed">
              Ne quittez pas cette page. Si vous quittez la salle, votre mise sera perdue.
              La partie commencera automatiquement dès qu'un adversaire vous rejoindra.
            </p>
          </div>
        </div>
      )}
      {/* Countdown */}
      {countdown !== null && (
        <Card className="border-primary bg-primary/5 animate-in slide-in-from-bottom duration-300 rounded-lg shadow-md mt-4">
          <CardContent className="py-6 sm:py-8 text-center">
            <div className="animate-pulse">
              {gameRenderer?.getGameIcon()}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 mt-4">La partie commence dans...</h2>
            <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary animate-pulse">{countdown}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}