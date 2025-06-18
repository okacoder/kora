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
  IconLoader2 
} from '@tabler/icons-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { useGameRoomService, useEventBus } from '@/hooks/useInjection';
import { useUser } from '@/providers/user-provider';
import { GameRoom } from '@/lib/garame/core/types';
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


export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const { user } = useUser();
  const gameRoomService = useGameRoomService();
  const eventBus = useEventBus();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    loadRoom();

    const handleRoomUpdate = (data: { roomId: string; }) => {
      if (data.roomId === params.roomId) loadRoom();
    };
    const handleGameStarting = (data: { roomId: string; }) => {
      if (data.roomId === params.roomId) setCountdown(5);
    };
    const handleGameStarted = (data: { roomId: string; gameStateId: any; }) => {
      if (data.roomId === params.roomId) {
        router.push(`/games/${params.gameType}/play/${data.gameStateId}`);
      }
    };

    // S'abonner aux événements
    eventBus.on('room.updated', handleRoomUpdate);
    eventBus.on('room.player_joined', handleRoomUpdate);
    eventBus.on('room.player_left', handleRoomUpdate);
    eventBus.on('game.starting', handleGameStarting);
    eventBus.on('game.started', handleGameStarted);

    return () => {
      eventBus.off('room.updated', handleRoomUpdate);
      eventBus.off('room.player_joined', handleRoomUpdate);
      eventBus.off('room.player_left', handleRoomUpdate);
      eventBus.off('game.starting', handleGameStarting);
      eventBus.off('game.started', handleGameStarted);
    };
  }, [params.roomId, params.gameType, eventBus, gameRoomService, router]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      const roomData = await gameRoomService.getRoom(params.roomId);
      if (!roomData) {
        toast.error('Salle introuvable');
        router.push(`/games/${params.gameType}/lobby`);
        return;
      }
      setRoom(roomData);
      
      const currentPlayer = roomData.players.find(p => p.id === user?.id);
      setIsReady(currentPlayer?.isReady || false);
    } catch (error) {
      toast.error('Erreur lors du chargement');
      router.push(`/games/${params.gameType}/lobby`);
    } finally {
      setLoading(false);
    }
  };

  const toggleReady = async () => {
    if (!room || !user) return;
    
    try {
      await gameRoomService.setPlayerReady(room.id, user.id, !isReady);
      setIsReady(!isReady);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleStartGame = async () => {
    if (!room || room.creatorId !== user?.id) return;

    try {
      await gameRoomService.startGame(room.id);
      // La redirection se fera via l'événement 'game.started'
    } catch (error: any) {
      toast.error(error.message || 'Impossible de démarrer');
    }
  };

  const handleLeaveRoom = async () => {
    if (!room || !user) return;

    try {
      await gameRoomService.leaveRoom(room.id);
      router.push(`/games/${params.gameType}/lobby`);
    } catch (error) {
      toast.error('Erreur lors de la sortie');
    }
  };

  const copyRoomCode = () => {
    if (room?.settings?.roomCode) {
      navigator.clipboard.writeText(room.settings.roomCode);
      toast.success('Code copié !');
    }
  };

  const canStartGame = () => {
    if (!room || room.creatorId !== user?.id) return false;
    if (room.players.length < room.minPlayers) return false;
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
        <div>
          <h1 className="text-3xl font-bold">Salle d'attente</h1>
          <p className="text-muted-foreground">
            {params.gameType} - Mise: {room.stake} Koras
          </p>
        </div>
        {room.settings?.privateRoom && room.settings?.roomCode && (
          <Card>
            <CardContent className="p-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Code:</span>
              <code className="font-mono font-bold">{room.settings.roomCode}</code>
              <Button size="sm" variant="ghost" onClick={copyRoomCode}>
                <IconCopy className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des joueurs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUsers className="h-5 w-5" />
                Joueurs ({room.players.length}/{room.maxPlayers})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: room.maxPlayers }).map((_, index) => {
                const player = room.players[index];
                
                if (player) {
                  return (
                    <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={player.avatarUrl} />
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{player.name}</span>
                            {player.id === room.creatorId && (
                              <IconCrown className="h-4 w-4 text-yellow-500" />
                            )}
                            {player.isAI && (
                              <Badge variant="secondary" className="text-xs">
                                <IconRobot className="h-3 w-3 mr-1" />
                                IA
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Position {player.position + 1}
                          </p>
                        </div>
                      </div>
                      <Badge variant={player.isReady ? 'default' : 'outline'}>
                        {player.isReady ? 'Prêt' : 'En attente'}
                      </Badge>
                    </div>
                  );
                } else {
                  return (
                    <div key={`empty-${index}`} className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-muted-foreground">En attente d'un joueur...</span>
                          <p className="text-sm text-muted-foreground">
                            Position {index + 1}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </CardContent>
          </Card>
        </div>

        {/* Informations et actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Mise totale</span>
                <span className="font-semibold flex items-center gap-1">
                  <IconCoin className="h-4 w-4" />
                  {room.totalPot} Koras
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Gain potentiel</span>
                <span className="font-semibold text-green-600">
                  {Math.floor(room.totalPot * 0.9)} Koras
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                * Commission de 10% déduite
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              {user?.id === room.creatorId ? (
                <>
                  <Button 
                    onClick={handleStartGame}
                    disabled={!canStartGame()}
                    className="w-full"
                  >
                    {!canStartGame() 
                      ? 'En attente des joueurs...'
                      : 'Démarrer la partie'
                    }
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Tous les joueurs doivent être prêts
                  </p>
                </>
              ) : (
                <Button 
                  onClick={toggleReady}
                  variant={isReady ? 'secondary' : 'default'}
                  className="w-full"
                >
                  {isReady ? 'Annuler' : 'Je suis prêt'}
                </Button>
              )}
              
              <Button 
                onClick={handleLeaveRoom}
                variant="destructive"
                className="w-full"
              >
                Quitter la salle
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discussion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Le chat sera disponible prochainement
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 