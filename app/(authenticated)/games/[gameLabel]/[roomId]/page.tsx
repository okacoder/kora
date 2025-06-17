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
import { useGarameServices } from "@/lib/garame/infrastructure/garame-provider";
import { IGameRoom, IPlayer, IGameEvent } from "@/lib/garame/domain/interfaces";
import { games } from "@/lib/games";
import { routes } from "@/lib/routes";
import { PlayerList } from '@/components/game/player-list';

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

  // Add handler to add AI player
  const handleAddAI = async (difficulty: 'easy' | 'medium' | 'hard') => {
    try {
      await gameService.addAIPlayer(roomId!, difficulty);
      toast.success(`Bot ${difficulty} ajouté!`);
      loadRoomData();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du bot');
    }
  };

  // Add handler to kick AI player
  const handleKickPlayer = async (playerId: string) => {
    try {
      await gameService.kickPlayer(roomId!, playerId);
      toast.success('Bot retiré!');
      loadRoomData();
    } catch (error) {
      toast.error('Erreur lors du retrait du bot');
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
    <div className="flex flex-col gap-4 sm:gap-6 px-4 pb-8 max-w-6xl mx-auto">
      {/* Header - Mobile optimized */}
      <div className="flex items-center justify-between py-2">
        <Button 
          variant="ghost" 
          onClick={handleLeaveRoom}
          className="gap-1 sm:gap-2 px-2 sm:px-4 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40"
          size="sm"
        >
          <IconArrowLeft className="h-4 w-4 align-middle inline-block" />
          <span className="hidden sm:inline">Retour</span>
        </Button>
        <div className="flex items-center gap-2">
          {gameRenderer.getGameIcon()}
          <Badge variant="outline" className="text-xs sm:text-sm min-h-[28px] flex items-center">
            {gameInfo.name} - Salle #{gameRoom.id}
          </Badge>
        </div>
      </div>
      {/* État de la partie - Mobile optimized */}
      <Card className="border-primary/20 rounded-lg shadow-sm mb-2">
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">
            {gameRoom.status === 'waiting' && 'En attente d\'un adversaire...'}
            {gameRoom.status === 'starting' && 'La partie va commencer !'}
            {gameRoom.status === 'in_progress' && 'Partie en cours'}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2">
            <div className="flex items-center justify-center gap-2">
              <IconCoin className="h-4 w-4 align-middle inline-block" />
              <span>Mise totale : {gameRoom.totalPot.toLocaleString()} FCFA</span>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
      {/* Zone de jeu - Mobile first grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Player List Integration */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Joueurs dans la salle</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerList
              players={gameRoom.players}
              maxPlayers={gameRoom.maxPlayers}
              isHost={isCreator}
              onAddAI={isCreator ? handleAddAI : undefined}
              onKickPlayer={isCreator ? handleKickPlayer : undefined}
            />
          </CardContent>
        </Card>
        {/* Joueur 1 (créateur) - Mobile optimized */}
        <Card className={`${isCreator ? 'border-green-500/50 shadow-green-500/10 shadow-lg' : ''} transition-all bg-card rounded-lg shadow-sm border`}>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarFallback className="text-xs sm:text-sm">
                    {isCreator ? currentPlayer?.username.slice(0, 2).toUpperCase() : gameRoom.creatorName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate max-w-[100px]">
                    {isCreator ? currentPlayer?.username : gameRoom.creatorName}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Badge variant="default" className="text-xs min-h-[28px] flex items-center">
                      Prêt
                    </Badge>
                    {isCreator && (
                      <Badge variant="secondary" className="text-xs min-h-[28px] flex items-center">
                        Vous
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Mise</p>
                <p className="font-semibold text-sm sm:text-base">{gameRoom.stake.toLocaleString()} FCFA</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            {gameRenderer.renderPlayerArea(
              isCreator ? currentPlayer : { id: gameRoom.creatorId, username: gameRoom.creatorName, balance: 0 },
              isCreator,
              gameRoom
            )}
          </CardContent>
        </Card>
        {/* Joueur 2 (adversaire) - Mobile optimized */}
        {opponent ? (
          <Card className={`${!isCreator ? 'border-green-500/50 shadow-green-500/10 shadow-lg' : ''} transition-all bg-card rounded-lg shadow-sm border`}>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarFallback className="text-xs sm:text-sm">
                      {!isCreator ? currentPlayer?.username.slice(0, 2).toUpperCase() : opponent.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate max-w-[100px]">
                      {!isCreator ? currentPlayer?.username : opponent.username}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Badge variant="default" className="text-xs min-h-[28px] flex items-center">
                        Prêt
                      </Badge>
                      {!isCreator && (
                        <Badge variant="secondary" className="text-xs min-h-[28px] flex items-center">
                          Vous
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Mise</p>
                  <p className="font-semibold text-sm sm:text-base">{gameRoom.stake.toLocaleString()} FCFA</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              {gameRenderer.renderPlayerArea(opponent, !isCreator, gameRoom)}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-2 rounded-lg shadow-sm bg-card">
            <CardContent className="flex flex-col items-center justify-center h-full py-8 sm:py-12 min-h-[200px]">
              <IconLoader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-muted-foreground mb-3 sm:mb-4 align-middle inline-block" />
              <p className="text-sm sm:text-base text-muted-foreground text-center font-medium">
                En attente d'un adversaire...
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 text-center">
                La partie commencera automatiquement
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Compte à rebours - Mobile optimized */}
      {countdown !== null && (
        <Card className="border-primary bg-primary/5 animate-in slide-in-from-bottom duration-300 rounded-lg shadow-md mt-4">
          <CardContent className="py-6 sm:py-8 text-center">
            <div className="animate-pulse">
              {gameRenderer.getGameIcon()}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 mt-4">La partie commence dans...</h2>
            <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary animate-pulse">{countdown}</p>
          </CardContent>
        </Card>
      )}
      {/* Informations - Collapsible on mobile */}
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
              <span className="font-semibold text-sm sm:text-base">{gameRoom.stake.toLocaleString()} FCFA</span>
            </div>
            <div className="sm:hidden"></div>
            <Separator className="col-span-2 sm:col-span-1" />
            <div className="sm:flex sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground block sm:inline">Pot total</span>
              <span className="font-semibold text-base sm:text-lg">{gameRoom.totalPot.toLocaleString()} FCFA</span>
            </div>
            <div className="sm:hidden"></div>
            <Separator className="col-span-2 sm:col-span-1" />
            <div className="sm:flex sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground block sm:inline">Gain (90%)</span>
              <span className="font-semibold text-sm sm:text-base text-green-600">
                {Math.floor(gameRoom.totalPot * 0.9).toLocaleString()} FCFA
              </span>
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground block sm:inline">Commission</span>
              <span className="text-xs sm:text-sm">{Math.floor(gameRoom.totalPot * 0.1).toLocaleString()} FCFA</span>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Avertissement - Mobile optimized */}
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
    </div>
  );
}