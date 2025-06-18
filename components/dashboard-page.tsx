"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconCoin, IconTrophy, IconCards, IconChartBar } from '@tabler/icons-react';
import Link from 'next/link';
import { useUser } from '@/providers/user-provider';
import { useGameRoomService, useTransactionRepository } from '@/hooks/useInjection';
import { GameRoom } from '@/lib/garame/core/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const gameRoomService = useGameRoomService();
  const transactionRepository = useTransactionRepository();
  
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalWins: 0,
    winRate: 0,
    ranking: 0
  });
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    // Charger les salles actives
    const rooms = await gameRoomService.getUserRooms(user.id);
    setActiveRooms(rooms.filter(r => r.status === 'waiting' || r.status === 'in_progress'));

    // Calculer les statistiques
    const winRate = user.totalGames > 0 
      ? Math.round((user.totalWins / user.totalGames) * 100) 
      : 0;

    setStats({
      totalGames: user.totalGames,
      totalWins: user.totalWins,
      winRate,
      ranking: await calculateRanking(user.totalWins)
    });
  };

  const calculateRanking = async (wins: number): Promise<number> => {
    // Logique de calcul du classement
    // Pour le moment, simulation
    return Math.max(1, 100 - wins * 5);
  };

  if (userLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête avec solde */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.name || user?.username} !
          </p>
        </div>
        <Card className="border-primary">
          <CardContent className="flex items-center gap-4 p-4">
            <IconCoin className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Solde</p>
              <p className="text-2xl font-bold">{user?.koras || 0} Koras</p>
              <p className="text-xs text-muted-foreground">
                {user?.koras?.toLocaleString()} koras
              </p>
            </div>
            <Link href="/koras">
              <Button size="sm">Recharger</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={IconCards}
          title="Parties jouées"
          value={stats.totalGames}
          description="Total de parties"
        />
        <StatCard
          icon={IconTrophy}
          title="Victoires"
          value={stats.totalWins}
          description={`${stats.winRate}% de victoires`}
        />
        <StatCard
          icon={IconChartBar}
          title="Classement"
          value={`#${stats.ranking}`}
          description="Position nationale"
        />
        <StatCard
          icon={IconCoin}
          title="Gains totaux"
          value={`${user?.totalWins * 90} K`}
          description="Koras gagnés"
        />
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Commencez une nouvelle partie</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/games/garame/create">
            <Button variant="outline" className="w-full h-24 flex-col gap-2">
              <IconCards className="h-8 w-8" />
              <span>Créer une partie</span>
            </Button>
          </Link>
          <Link href="/games/garame/lobby">
            <Button variant="outline" className="w-full h-24 flex-col gap-2">
              <IconTrophy className="h-8 w-8" />
              <span>Rejoindre une partie</span>
            </Button>
          </Link>
          <Link href="/koras">
            <Button variant="outline" className="w-full h-24 flex-col gap-2">
              <IconCoin className="h-8 w-8" />
              <span>Acheter des Koras</span>
            </Button>
          </Link>
          <Link href="/games/history">
            <Button variant="outline" className="w-full h-24 flex-col gap-2">
              <IconChartBar className="h-8 w-8" />
              <span>Historique</span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Parties actives */}
      {activeRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parties actives</CardTitle>
            <CardDescription>Vos parties en cours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeRooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{room.gameType}</p>
                    <p className="text-sm text-muted-foreground">
                      Mise: {room.stake} Koras • {room.players.length}/{room.maxPlayers} joueurs
                    </p>
                  </div>
                  <Link href={`/games/${room.gameType}/room/${room.id}`}>
                    <Button size="sm">Rejoindre</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Composants utilitaires
function StatCard({ icon: Icon, title, value, description }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}