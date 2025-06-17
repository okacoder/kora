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
  IconCoin,
  IconClock
} from "@tabler/icons-react";
import { PlayerArea } from "@/components/player-area";
import { GameTable } from "@/components/game-table";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useGarameServices } from "@/lib/garame/infrastructure/garame-provider";
import { IGameRoom, IPlayer, IGameEvent } from "@/lib/garame/domain/interfaces";
import { games } from "@/lib/games";
import { routes } from "@/lib/routes";

interface GameRenderer {
  renderPlayerArea: (player: IPlayer | null, isCurrentPlayer: boolean, gameRoom: IGameRoom) => React.ReactNode;
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

export default function GameRoomPage() {
  const router = useRouter();
  const { gameLabel, roomId } = useParams<{ gameLabel: string; roomId: string }>();
  const { gameService, paymentService, eventHandler } = useGarameServices();
  
  const [gameRoom, setGameRoom] = useState<IGameRoom | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<IPlayer | null>(null);
  const [opponent, setOpponent] = useState<IPlayer | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameStateId, setGameStateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get game info and renderer
  const gameInfo = games.find(g => g.id === gameLabel);
  const gameRenderer = getGameRenderer(gameLabel);
  
  // Charger les données de la salle
  useEffect(() => {
    if (!roomId) return;
    loadRoomData();
  }, [roomId]);
  
  // S'abonner aux événements de la salle
  useEffect(() => {
    if (!gameRoom) return;
    
    const handleGameEvent = (event: IGameEvent) => {
      console.log("Événement reçu:", event);
      
      switch (event.type) {
        case 'player_joined':
          // Recharger les données de la salle
          loadRoomData();
          break;
          
        case 'player_left':
          setOpponent(null);
          loadRoomData();
          break;
          
        case 'game_started':
          // Sauvegarder l'identifiant de la partie et démarrer le compte à rebours
          setGameStateId(event.data.gameStateId);
          setCountdown(5);
          break;
      }
    };
    
    if (!roomId) return;
    eventHandler.subscribe(roomId, handleGameEvent);
    
    return () => {
      if (roomId) eventHandler.unsubscribe(roomId);
    };
  }, [gameRoom, roomId]);
  
  // Gérer le compte à rebours
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    
    const timer = setTimeout(() => {
      if (countdown === 1) {
        // Rediriger vers la partie (utiliser gameStateId si disponible, sinon l'id de la room)
        router.push(routes.gamePlay(gameLabel, gameStateId ?? gameRoom?.id!));
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, gameRoom, gameStateId, router]);
  
  // Charger les données actuelles du joueur
  useEffect(() => {
    loadCurrentPlayer();
  }, []);
  
  const loadCurrentPlayer = async () => {
    try {
      const balance = await paymentService.getBalance();
      // Simuler la récupération du joueur actuel
      setCurrentPlayer({
        id: 'current-user',
        username: 'player1',
        balance,
      });
    } catch (error) {
      console.error("Erreur lors du chargement du joueur:", error);
    }
  };
  
  const loadRoomData = async () => {
    try {
      setLoading(true);
      const room = await gameService.getGameRoom(roomId!);
      
      if (!room) {
        toast.error("Salle introuvable");
        router.push(routes.gameRoom(roomId));
        return;
      }
      
      setGameRoom(room);
      
      // Si la salle a un adversaire, le charger
      if (room.opponentId && room.opponentName && room.status !== 'waiting') {
        // Dans un vrai système, on récupérerait les infos de l'adversaire
        setOpponent({
          id: room.opponentId,
          username: room.opponentName,
          balance: 0,
        });
        
        // Le compte à rebours démarrera après réception de l'événement "game_started"
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la salle:", error);
      toast.error("Impossible de charger la salle");
    } finally {
      setLoading(false);
    }
  };
  
  const handleLeaveRoom = async () => {
    try {
      await gameService.leaveGame(roomId!);
      toast.info("Vous avez quitté la partie");
      router.push(routes.gameRoom(roomId));
    } catch (error) {
      console.error("Erreur lors de la sortie:", error);
      toast.error("Impossible de quitter la partie");
    }
  };

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

  const isCreator = currentPlayer?.id === gameRoom.creatorId;

  return (
    <div className="game-container">
      {/* Game header with players and pot */}
      <header className="game-header safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLeaveRoom}
              className="h-7 w-7 p-0"
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-game-base font-bold">Partie #{roomId.slice(-6)}</h1>
              <p className="text-game-xs text-muted-foreground">
                Pot: {gameRoom.totalPot} koras
              </p>
            </div>
          </div>
          
          <Badge 
            variant={gameRoom.status === 'in_progress' ? 'default' : 'secondary'}
            className="text-game-xs"
          >
            {gameRoom.status === 'waiting' && 'En attente'}
            {gameRoom.status === 'in_progress' && 'En cours'}
            {gameRoom.status === 'starting' && 'Démarrage...'}
          </Badge>
        </div>
      </header>

      {/* Game area */}
      <div className="flex-1 px-game py-3">
        {/* Player cards area */}
        <div className="flex flex-col gap-3 h-full">
          {/* Opponent area */}
          <div className="flex-1 flex items-start justify-center">
            {opponent && (
              <PlayerArea 
                player={opponent}
                isCurrentPlayer={false}
                gameRoom={gameRoom}
              />
            )}
          </div>

          {/* Game table/center area */}
          <div className="flex-shrink-0 flex items-center justify-center py-4">
            <GameTable totalPot={gameRoom.totalPot} />
          </div>

          {/* Current player area */}
          <div className="flex-1 flex items-end justify-center">
            {currentPlayer && (
              <PlayerArea 
                player={currentPlayer}
                isCurrentPlayer={true}
                gameRoom={gameRoom}
              />
            )}
          </div>
        </div>
      </div>

      {/* Action bar for mobile */}
      <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur px-game py-3 safe-bottom">
        <div className="flex items-center justify-between">
          <div className="text-game-xs text-muted-foreground">
            {gameRoom.status === 'waiting' ? 'En attente d\'adversaire' : 'Partie en cours'}
          </div>
          {countdown !== null && (
            <Badge variant="outline" className="text-game-xs">
              <IconClock className="h-3 w-3 mr-1" />
              {countdown}s
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}