"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CardBack } from "@/components/game-card";
import { 
  IconLoader2,
  IconArrowLeft,
  IconAlertCircle,
  IconCards
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGameService, usePaymentService, useGameEventHandler } from "@/lib/garame/infrastructure/garame-provider";
import { IGameRoom, IPlayer, IGameEvent } from "@/lib/garame/domain/interfaces";

export default function GameRoomPage({ params }: { params: { roomId: string } }) {
  const router = useRouter();
  const gameService = useGameService();
  const paymentService = usePaymentService();
  const eventHandler = useGameEventHandler();
  
  const [gameRoom, setGameRoom] = useState<IGameRoom | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<IPlayer | null>(null);
  const [opponent, setOpponent] = useState<IPlayer | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Charger les données de la salle
  useEffect(() => {
    loadRoomData();
  }, [params.roomId]);
  
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
          // Démarrer le compte à rebours
          setCountdown(5);
          break;
      }
    };
    
    eventHandler.subscribe(params.roomId, handleGameEvent);
    
    return () => {
      eventHandler.unsubscribe(params.roomId);
    };
  }, [gameRoom, params.roomId]);
  
  // Gérer le compte à rebours
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    
    const timer = setTimeout(() => {
      if (countdown === 1) {
        // Rediriger vers la partie
        router.push(`/dashboard/garame/play/${gameRoom?.id}`);
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, gameRoom, router]);
  
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
        name: 'Vous',
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
      const room = await gameService.getGameRoom(params.roomId);
      
      if (!room) {
        toast.error("Salle introuvable");
        router.push("/dashboard/garame");
        return;
      }
      
      setGameRoom(room);
      
      // Si la salle a un adversaire, le charger
      if (room.opponentId && room.status !== 'waiting') {
        // Dans un vrai système, on récupérerait les infos de l'adversaire
        setOpponent({
          id: room.opponentId,
          name: room.opponentName || 'Adversaire',
          username: 'opponent',
          balance: 0, // Non affiché
        });
        
        // Si la partie commence, démarrer le countdown
        if (room.status === 'starting') {
          setCountdown(5);
        }
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
      await gameService.leaveGame(params.roomId);
      toast.info("Vous avez quitté la partie");
      router.push("/dashboard/garame");
    } catch (error) {
      console.error("Erreur lors de la sortie:", error);
      toast.error("Impossible de quitter la partie");
    }
  };

  if (loading || !gameRoom) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isCreator = currentPlayer?.id === gameRoom.creatorId;

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={handleLeaveRoom}
          className="gap-2"
        >
          <IconArrowLeft className="size-4" />
          Retour
        </Button>
        
        <Badge variant="outline" className="text-sm">
          Salle #{gameRoom.id}
        </Badge>
      </div>

      {/* État de la partie */}
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {gameRoom.status === 'waiting' && 'En attente d\'un adversaire...'}
            {gameRoom.status === 'starting' && 'La partie va commencer !'}
            {gameRoom.status === 'in_progress' && 'Partie en cours'}
          </CardTitle>
          <CardDescription>
            Mise totale : {gameRoom.totalPot.toLocaleString()} FCFA
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Zone de jeu */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Joueur 1 (créateur) */}
        <Card className={isCreator ? 'border-green-500/50' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback>
                    {isCreator ? currentPlayer?.name.slice(0, 2).toUpperCase() : gameRoom.creatorName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {isCreator ? currentPlayer?.name : gameRoom.creatorName}
                  </h3>
                  <Badge variant="default">
                    Prêt
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Mise</p>
                <p className="font-semibold">{gameRoom.stake.toLocaleString()} FCFA</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              {/* Cartes du joueur (face cachée pour l'instant) */}
              <div className="flex -space-x-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="transform hover:scale-105 transition-transform">
                    <CardBack width={60} height={84} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Joueur 2 (adversaire) */}
        {opponent ? (
          <Card className={!isCreator ? 'border-green-500/50' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarFallback>
                      {!isCreator ? currentPlayer?.name.slice(0, 2).toUpperCase() : opponent.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {!isCreator ? currentPlayer?.name : opponent.name}
                    </h3>
                    <Badge variant="default">
                      Prêt
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Mise</p>
                  <p className="font-semibold">{gameRoom.stake.toLocaleString()} FCFA</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                {/* Cartes de l'adversaire (face cachée) */}
                <div className="flex -space-x-8">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="transform hover:scale-105 transition-transform">
                      <CardBack width={60} height={84} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-full py-12">
              <IconLoader2 className="size-12 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                En attente d'un adversaire...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                La partie commencera automatiquement
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Compte à rebours */}
      {countdown !== null && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-8 text-center">
            <IconCards className="size-16 lg:size-20 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-3xl font-bold mb-2">La partie commence dans...</h2>
            <p className="text-6xl font-bold text-primary animate-pulse">{countdown}</p>
          </CardContent>
        </Card>
      )}

      {/* Informations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations de la partie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Mise par joueur</span>
            <span className="font-semibold">{gameRoom.stake.toLocaleString()} FCFA</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pot total</span>
            <span className="font-semibold text-lg">{gameRoom.totalPot.toLocaleString()} FCFA</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Gain du vainqueur (90%)</span>
            <span className="font-semibold text-green-600">
              {Math.floor(gameRoom.totalPot * 0.9).toLocaleString()} FCFA
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Commission (10%)</span>
            <span className="text-sm">{Math.floor(gameRoom.totalPot * 0.1).toLocaleString()} FCFA</span>
          </div>
        </CardContent>
      </Card>

      {/* Avertissement */}
      {gameRoom.status === 'waiting' && (
        <div className="flex gap-3 p-4 bg-amber-500/10 rounded-lg">
          <IconAlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-400 mb-1">
              Important
            </p>
            <p className="text-amber-900 dark:text-amber-400">
              Ne quittez pas cette page. Si vous quittez la salle, votre mise sera perdue.
              La partie commencera automatiquement dès qu'un adversaire vous rejoindra.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}