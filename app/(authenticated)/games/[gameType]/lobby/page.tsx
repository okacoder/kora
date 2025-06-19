"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  IconUsers, 
  IconCoin, 
  IconClock, 
  IconRefresh, 
  IconPlus 
} from '@tabler/icons-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useCurrentUser } from '@/hooks/use-current-user';
import { GameRoom, GameRoomStatus, RoomPlayer } from '@prisma/client';

// Extended GameRoom type to include players
interface GameRoomWithPlayers extends GameRoom {
  players: RoomPlayer[];
}

export default function LobbyPage() {
  const params = useParams<{ gameType: string }>();
  const router = useRouter();
  const user = useCurrentUser();

  const [rooms, setRooms] = useState<GameRoomWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    stake: 'all',
    status: 'WAITING'
  });
  const [searchCode, setSearchCode] = useState('');

  useEffect(() => {
    loadRooms();
    
    // Rafraîchir automatiquement toutes les 10 secondes
    const interval = setInterval(loadRooms, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [params.gameType, filter]);

  const loadRooms = async () => {
    try {
      const availableRooms = [] as any[];
      
      // Filtrer selon les critères
      let filteredRooms = availableRooms;
      
      if (filter.stake !== 'all') {
        const maxStake = parseInt(filter.stake);
        filteredRooms = filteredRooms.filter(room => room.stake <= maxStake);
      }

      setRooms(filteredRooms as GameRoomWithPlayers[]);
    } catch (error) {
      toast.error('Erreur lors du chargement des salles');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour rejoindre une salle');
      return;
    }

    try {
      // await joinGameRoom(roomId, user.id);
      router.push(`/games/${params.gameType}/room/${roomId}`);
    } catch (error: any) {
      toast.error(error.message || 'Impossible de rejoindre la salle');
    }
  };

  const handleJoinByCode = async () => {
    if (!searchCode) return;
    
    // Chercher la salle par code
    const room = rooms.find(r => {
      const settings = typeof r.settings === 'string' 
        ? JSON.parse(r.settings as string) 
        : r.settings;
      return settings?.roomCode === searchCode;
    });
    
    if (room) {
      handleJoinRoom(room.id);
    } else {
      toast.error('Code de salle invalide');
    }
  };

  const getRoomStatusColor = (status: GameRoomStatus) => {
    switch (status) {
      case 'WAITING': return 'bg-green-500';
      case 'STARTING': return 'bg-yellow-500';
      case 'IN_PROGRESS': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoomStatusText = (status: GameRoomStatus) => {
    switch (status) {
      case 'WAITING': return 'En attente';
      case 'STARTING': return 'Démarre...';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Terminée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold capitalize">
            Salles de {params.gameType}
          </h1>
          <p className="text-muted-foreground">
            Rejoignez une partie ou créez votre propre salle
          </p>
        </div>
        <Link href={`/games/${params.gameType}/create`}>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Créer une salle
          </Button>
        </Link>
      </div>

      {/* Filtres et recherche */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Code de salle"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinByCode()}
              />
            </div>
            <Select value={filter.stake} onValueChange={(value) => setFilter({ ...filter, stake: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Mise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les mises</SelectItem>
                <SelectItem value="100">≤ 100 Koras</SelectItem>
                <SelectItem value="500">≤ 500 Koras</SelectItem>
                <SelectItem value="1000">≤ 1000 Koras</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadRooms} variant="outline">
              <IconRefresh className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des salles */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-48" />
            </Card>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Aucune salle disponible pour le moment
            </p>
            <Link href={`/games/${params.gameType}/create`}>
              <Button>Créer la première salle</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Salle de {room.creatorName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <IconClock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(room.createdAt), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getRoomStatusColor(room.status)}`} />
                    {getRoomStatusText(room.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Mise</p>
                    <p className="font-semibold flex items-center gap-1">
                      <IconCoin className="h-4 w-4" />
                      {room.stake} Koras
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Joueurs</p>
                    <p className="font-semibold flex items-center gap-1">
                      <IconUsers className="h-4 w-4" />
                      {room.players.length}/{room.maxPlayers}
                    </p>
                  </div>
                </div>

                {/* Liste des joueurs */}
                <div className="space-y-1">
                  {room.players.map((player, idx) => (
                    <div key={player.id} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">#{idx + 1}</span>
                      <span className="flex-1 truncate">{player.name}</span>
                      {player.isAI && (
                        <Badge variant="secondary" className="text-xs">
                          IA
                        </Badge>
                      )}
                    </div>
                  ))}
                  {Array.from({ length: room.maxPlayers - room.players.length }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>#{room.players.length + idx + 1}</span>
                      <span className="flex-1">En attente...</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => handleJoinRoom(room.id)}
                  className="w-full"
                  disabled={room.status !== 'WAITING' || room.players.length >= room.maxPlayers}
                >
                  {room.players.length >= room.maxPlayers ? 'Salle pleine' : 'Rejoindre'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 