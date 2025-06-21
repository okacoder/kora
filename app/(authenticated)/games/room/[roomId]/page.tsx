"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  IconCrown, 
  IconRobot, 
  IconCopy, 
  IconUsers, 
  IconCoin, 
  IconLoader2,
  IconArrowLeft,
  IconDeviceGamepad2,
  IconSettings,
  IconShare2,
  IconLink,
  IconUser,
  IconUserX,
  IconClock,
  IconLogout,
  IconMessageCircle,
  IconCircleCheck,
} from '@tabler/icons-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useCurrentUser } from '@/hooks/use-current-user';
import { GameRoom } from '@prisma/client';
import { routes } from '@/lib/routes';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
// Note: Le composant CountdownTimer est défini dans le plan mais n'existe pas encore.
// import { CountdownTimer } from '@/components/game/countdown-timer';

// Enhanced CountdownTimer with animations
function CountdownTimer({ seconds, onComplete, message }: { seconds: number; onComplete: () => void; message: string; }) {
    const [currentSeconds, setCurrentSeconds] = useState(seconds);

    useEffect(() => {
        if (currentSeconds <= 0) {
            onComplete();
            return;
        }
        const timer = setTimeout(() => setCurrentSeconds(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [currentSeconds, onComplete]);

    return (
        <motion.div 
          className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
            <motion.p 
              className="text-2xl text-white mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {message}
            </motion.p>
            <motion.p 
              className="text-6xl font-bold text-chart-4"
              key={currentSeconds}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20 }}
            >
              {currentSeconds}
            </motion.p>
        </motion.div>
    );
}

// Component pour invitation par nom d'utilisateur
function InviteByUsername({ onInvite }: { onInvite: (username: string) => void }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!username.trim()) return;
    
    setLoading(true);
    try {
      await onInvite(username);
      setUsername('');
      toast.success(`Invitation envoyée à ${username}`);
    } catch (error) {
      toast.error('Erreur lors de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Nom d'utilisateur..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
        />
        <Button 
          onClick={handleInvite} 
          disabled={!username.trim() || loading}
          size="sm"
        >
          {loading ? <IconLoader2 className="w-4 h-4 animate-spin" /> : 'Inviter'}
        </Button>
      </div>
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

export default function RoomPage() {
  const params = useParams<{ gameType: string, roomId: string }>();
  const router = useRouter();
  const user = useCurrentUser();
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

    try {
      setLoading(true);
      const roomData = {
        id: '1',
        players: [{
          id: '1',
          name: 'John Doe',
          position: 1,
          isReady: false,
          isAI: false,
          aiDifficulty: null,
          joinedAt: new Date(),
        }],
        settings: {},
        creatorId: '1',
        creatorName: 'John Doe',
        stake: 100,
        maxPlayers: 4,
        minPlayers: 2,
      } as any;
      
      const typedRoom = roomData as GameRoomWithPlayers;
      setRoom(typedRoom);
      
      const currentPlayer = typedRoom.players.find(p => p.userId === user?.id);
      setIsReady(currentPlayer?.isReady || false);

      // Si la partie a démarré, rediriger vers la page de jeu
      if (typedRoom.id) {
        router.push(routes.gamePlay(typedRoom.id));
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de la salle');
    } finally {
      setLoading(false);
    }
  };

  const toggleReady = async () => {
    if (!room || !user) return;
    
    try {
      // await gameService.setPlayerReady(room.id, user.id, !isReady);
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
          const gameStateId = '1';
          router.push(routes.gamePlay(gameStateId));
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
    if (!room) return;
    router.push(routes.gameLobby(room.gameType));
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
    <div className="min-h-screen bg-background">
      {countdown !== null && (
        <CountdownTimer 
          seconds={countdown} 
          onComplete={() => setCountdown(null)}
          message="La partie commence dans"
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header avec navigation */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleLeaveRoom}>
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Salle de {room.creatorName}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <IconUsers className="h-4 w-4" />
                {room.players?.length || 0}/{room.maxPlayers} joueurs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1 bg-chart-5/10 text-chart-5 border-chart-5/20">
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
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Zone principale des joueurs */}
          <motion.div 
            className="lg:col-span-3 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Liste des joueurs avec statuts visuels */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <IconUsers className="h-5 w-5 text-primary" />
                  Joueurs dans la salle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {room.players.map((player, index) => (
                  <motion.div 
                    key={player.id} 
                    className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {room.creatorId === player.userId && (
                          <IconCrown className="absolute -top-2 -right-2 h-4 w-4 text-chart-5" />
                        )}
                        {player.isAI && (
                          <IconRobot className="absolute -top-2 -left-2 h-4 w-4 text-chart-3" />
                        )}
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {player.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {/* Indicateur de statut en ligne */}
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                          player.isReady ? "bg-chart-4" : "bg-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-card-foreground">{player.name}</span>
                          {room.creatorId === player.userId && (
                            <Badge variant="secondary" className="bg-chart-5/20 text-chart-5 text-xs">
                              Créateur
                            </Badge>
                          )}
                          {player.isAI && (
                            <Badge variant="secondary" className="bg-chart-3/20 text-chart-3 text-xs">
                              IA {player.aiDifficulty}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Rejoint {new Date(player.joinedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {player.isReady ? (
                        <Badge className="bg-chart-4 text-white flex items-center gap-1">
                          <IconCircleCheck className="h-3 w-3" />
                          Prêt
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <IconClock className="h-3 w-3" />
                          En attente
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Emplacements vides avec animation */}
                {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
                  <motion.div 
                    key={`empty-${i}`} 
                    className="flex items-center gap-4 p-4 bg-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (room.players.length + i) * 0.1 }}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        <IconUser className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-muted-foreground font-medium">En attente d'un joueur...</span>
                      <p className="text-xs text-muted-foreground">Emplacement {room.players.length + i + 1}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Actions principales */}
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {user?.id === room.creatorId ? (
                    <Button 
                      className="flex-1 bg-primary hover:bg-primary/90" 
                      onClick={handleStartGame}
                      disabled={!canStartGame()}
                      size="lg"
                    >
                      <IconDeviceGamepad2 className="h-5 w-5 mr-2" />
                      {canStartGame() ? 'Démarrer la partie' : 'En attente des joueurs'}
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1" 
                      onClick={toggleReady}
                      variant={isReady ? "outline" : "default"}
                      size="lg"
                    >
                      {isReady ? (
                        <>
                          <IconUserX className="h-5 w-5 mr-2" />
                          Annuler
                        </>
                      ) : (
                        <>
                          <IconCircleCheck className="h-5 w-5 mr-2" />
                          Je suis prêt
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={handleLeaveRoom}
                    size="lg"
                  >
                    <IconLogout className="h-5 w-5 mr-2" />
                    Quitter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Panneau latéral - Invitations et configuration */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Section invitations */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <IconShare2 className="h-4 w-4 text-secondary" />
                  Inviter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InviteByUsername onInvite={async (username) => {
                  // TODO: Implement invitation logic
                  console.log('Inviting:', username);
                }} />
                
                {settings.isPrivate && settings.roomCode && (
                  <div className="space-y-2">
                    <Label className="text-card-foreground text-sm">Code de la salle</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={settings.roomCode} 
                        readOnly 
                        className="text-center font-mono text-lg"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={copyRoomCode}
                      >
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    toast.success('Lien copié !');
                  }}
                >
                  <IconLink className="h-4 w-4 mr-2" />
                  Copier le lien
                </Button>
              </CardContent>
            </Card>

            {/* Configuration de la partie */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <IconSettings className="h-4 w-4 text-primary" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jeu:</span>
                    <span className="text-card-foreground font-medium">Garame</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mise par joueur:</span>
                    <span className="text-card-foreground font-medium flex items-center gap-1">
                      <IconCoin className="w-3 h-3 text-chart-5" />
                      {room.stake}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joueurs max:</span>
                    <span className="text-card-foreground font-medium">{room.maxPlayers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée/tour:</span>
                    <span className="text-card-foreground font-medium">
                      {settings.turnDuration || 60}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="text-card-foreground font-medium">
                      {settings.isPrivate ? 'Privée' : 'Publique'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total pot:</span>
                    <span className="text-card-foreground font-bold flex items-center gap-1">
                      <IconCoin className="w-3 h-3 text-chart-5" />
                      {room.stake * room.maxPlayers}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Commission (10%):</span>
                    <span className="text-muted-foreground">
                      -{Math.round(room.stake * room.maxPlayers * 0.1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat placeholder */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <IconMessageCircle className="h-4 w-4 text-chart-4" />
                  Chat rapide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">Chat disponible pendant la partie</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 