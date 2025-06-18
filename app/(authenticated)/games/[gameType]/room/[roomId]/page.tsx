"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  IconCrown, 
  IconRobot, 
  IconCopy, 
  IconUsers, 
  IconCoin, 
  IconLoader2,
  IconArrowLeft
} from '@tabler/icons-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { useGame } from '@/hooks/useGame';
import { useCurrentUser } from '@/hooks/useUser';
import { GameRoom, GameRoomStatus } from '@prisma/client';
import { gameService } from '@/lib/services/game.service';
import { routes } from '@/lib/routes';
// Note: Le composant CountdownTimer est défini dans le plan mais n'existe pas encore.
// import { CountdownTimer } from '@/components/game/countdown-timer';

interface RoomPageProps {
  params: { 
    gameType: string;
    roomId: string;
  };
}

// Placeholder pour CountdownTimer
function CountdownTimer({ seconds, onComplete, message }: { seconds: number; onComplete: () => void; message: string; }) {
    useEffect(() => {
        if (seconds <= 0) {
            onComplete();
            return;
        }
        const timer = setTimeout(() => onComplete(), seconds * 1000);
        return () => clearTimeout(timer);
    }, [seconds, onComplete]);

    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
            <p className="text-2xl text-white mb-4">{message}</p>
            <p className="text-6xl font-bold text-white">{seconds}</p>
        </div>
    );
}

interface GameRoomWithPlayers extends Omit<GameRoom, 'players'> {
  players: RoomPlayer[];
}

interface RoomSettings {
  isPrivate: boolean;
  roomCode?: string;
  aiPlayers?: number;
  aiDifficulty?: string;
  turnDuration?: number;
}

// Fix the avatar property error by making it optional in RoomPlayer
interface RoomPlayer {
  id: string;
  name: string;
  position: number;
  isReady: boolean;
  isAI: boolean;
  aiDifficulty: string | null;
  joinedAt: Date;
  gameRoomId: string;
  userId: string | null;
  avatar?: string;
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [room, setRoom] = useState<GameRoomWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    loadRoom();
    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(loadRoom, 5000);
    return () => clearInterval(interval);
  }, [params.roomId]);

  const loadRoom = async () => {
    if (!user) {
      router.push(routes.login());
      return;
    }

    try {
      setLoading(true);
      const roomData = await gameService.getRoom(params.roomId);
      
      const typedRoom = roomData as GameRoomWithPlayers;
      setRoom(typedRoom);
      
      const currentPlayer = typedRoom.players.find(p => p.userId === user.id);
      setIsReady(currentPlayer?.isReady || false);

      // Si la partie a démarré, rediriger vers la page de jeu
      if (typedRoom.status === 'IN_PROGRESS' && typedRoom.gameStateId) {
        router.push(routes.gamePlay(params.gameType, typedRoom.gameStateId));
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de la salle');
      router.push(routes.gameLobby(params.gameType));
    } finally {
      setLoading(false);
    }
  };

  const toggleReady = async () => {
    if (!room || !user) return;
    
    try {
      await gameService.setPlayerReady(room.id, user.id, !isReady);
      setIsReady(!isReady);
      await loadRoom();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleStartGame = async () => {
    if (!room || !user || room.creatorId !== user.id) return;

    try {
      setCountdown(5);
      setTimeout(async () => {
        try {
          const gameStateId = await gameService.startGame(room.id, user.id);
          router.push(routes.gamePlay(params.gameType, gameStateId));
        } catch (error: any) {
          toast.error(error.message || 'Impossible de démarrer la partie');
          setCountdown(null);
        }
      }, 5000);
    } catch (error: any) {
      toast.error(error.message || 'Impossible de démarrer la partie');
      setCountdown(null);
    }
  };

  const handleLeaveRoom = () => {
    router.push(routes.gameLobby(params.gameType));
  };

  const getRoomSettings = (room: GameRoomWithPlayers): RoomSettings => {
    try {
      const settings = room.settings as Record<string, unknown>;
      return {
        isPrivate: Boolean(settings?.isPrivate),
        roomCode: settings?.roomCode as string | undefined,
        aiPlayers: settings?.aiPlayers as number | undefined,
        aiDifficulty: settings?.aiDifficulty as string | undefined,
        turnDuration: settings?.turnDuration as number | undefined,
      };
    } catch {
      return { isPrivate: false };
    }
  };

  const copyRoomCode = () => {
    if (!room) return;
    const settings = getRoomSettings(room);
    if (settings.roomCode) {
      navigator.clipboard.writeText(settings.roomCode);
      toast.success('Code copié !');
    }
  };

  const canStartGame = () => {
    if (!room || !user || room.creatorId !== user.id) return false;
    if (room.players.length < (room.minPlayers || 2)) return false;
    return room.players.every(p => p.isReady || p.isAI);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!room) return null;

  const settings = getRoomSettings(room);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {countdown !== null && (
        <CountdownTimer 
          seconds={countdown} 
          onComplete={() => setCountdown(null)}
          message="La partie commence dans"
        />
      )}

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleLeaveRoom}>
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Salle de {room.creatorName}</h1>
            <p className="text-muted-foreground">
              {room.players.length}/{room.maxPlayers} joueurs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <IconCoin className="h-4 w-4" />
            {room.stake} Koras
          </Badge>
          {settings.isPrivate && settings.roomCode && (
            <Button variant="outline" size="sm" onClick={copyRoomCode}>
              <IconCopy className="h-4 w-4 mr-1" />
              {settings.roomCode}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des joueurs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUsers className="h-5 w-5" />
              Joueurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {room.players.map((player) => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {room.creatorId === player.userId && (
                    <IconCrown className="h-5 w-5 text-yellow-500" />
                  )}
                  {player.isAI && (
                    <IconRobot className="h-5 w-5 text-blue-500" />
                  )}
                  <Avatar>
                    <AvatarImage src={player.avatar} />
                    <AvatarFallback>
                      {player.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{player.name}</span>
                </div>
                <Badge variant={player.isReady ? "secondary" : "outline"}>
                  {player.isReady ? "Prêt" : "En attente"}
                </Badge>
              </div>
            ))}

            {/* Emplacements vides */}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 opacity-50">
                <Avatar>
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <span>En attente...</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.id === room.creatorId ? (
              <Button 
                className="w-full" 
                onClick={handleStartGame}
                disabled={!canStartGame()}
              >
                Démarrer la partie
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={toggleReady}
                variant={isReady ? "outline" : "default"}
              >
                {isReady ? "Annuler" : "Je suis prêt"}
              </Button>
            )}

            <Separator />

            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleLeaveRoom}
            >
              Quitter la salle
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 