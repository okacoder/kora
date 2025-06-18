"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconCoin, IconTrophy, IconCards, IconChartBar, IconLoader2 } from '@tabler/icons-react';
import Link from 'next/link';
import { useUser } from '@/providers/user-provider';
import { useGameRoomService, usePaymentService } from '@/hooks/useInjection';
import { GameRoom } from '@/lib/garame/core/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const gameRoomService = useGameRoomService();
  const paymentService = usePaymentService();
  
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalWins: 0,
    winRate: 0,
    totalEarnings: 0
  });
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Charger les salles actives
      const rooms = await gameRoomService.getUserRooms(user.id);
      setActiveRooms(rooms.filter(r => 
        r.status === 'waiting' || r.status === 'in_progress'
      ));

      // Calculer les statistiques
      const transactions = await paymentService.getTransactionHistory(user.id, 100);
      const wins = transactions.filter(t => t.type === 'GAME_WIN');
      const totalEarnings = wins.reduce((sum, t) => sum + (t.koras || 0), 0);

      const winRate = user.totalGames > 0 
        ? Math.round((user.totalWins / user.totalGames) * 100) 
        : 0;

      setStats({
        totalGames: user.totalGames,
        totalWins: user.totalWins,
        winRate,
        totalEarnings
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête avec solde */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.name || user?.username} !
          </p>
        </div>
        <Card className="border-primary w-full sm:w-auto">
          <CardContent className="flex items-center gap-4 p-4">
            <IconCoin className="h-8 w-8 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Solde</p>
              <p className="text-2xl font-bold">{user?.koras || 0} Koras</p>
              <p className="text-xs text-muted-foreground">
                ≈ {(user?.koras || 0) * 10} FCFA
              </p>
            </div>
            <Button size="sm" onClick={() => setShowDepositModal(true)}>
              Recharger
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          description={`${stats.winRate}% de réussite`}
        />
        <StatCard
          icon={IconChartBar}
          title="Gains totaux"
          value={`${stats.totalEarnings}`}
          description="Koras gagnés"
        />
        <StatCard
          icon={IconCoin}
          title="En jeu"
          value={activeRooms.length}
          description="Parties actives"
        />
      </div>

      {/* Actions rapides */}
      <QuickActionsCard />

      {/* Parties actives */}
      {activeRooms.length > 0 && (
        <ActiveGamesCard rooms={activeRooms} />
      )}

      {/* Transactions récentes */}
      <RecentTransactions userId={user?.id || ''} limit={5} />

      {/* Modal de dépôt */}
      {showDepositModal && (
        <QuickDepositModal 
          open={showDepositModal} 
          onClose={() => setShowDepositModal(false)} 
        />
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
          <div className="space-y-1">
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

function QuickActionsCard() {
  return (
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
            <span>Rejoindre</span>
          </Button>
        </Link>
        <Link href="/koras">
          <Button variant="outline" className="w-full h-24 flex-col gap-2">
            <IconCoin className="h-8 w-8" />
            <span>Acheter Koras</span>
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

// Placeholder components that would need to be created separately
function ActiveGamesCard({ rooms }: { rooms: GameRoom[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parties actives</CardTitle>
        <CardDescription>{rooms.length} partie(s) en cours</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{room.gameType}</p>
                <p className="text-sm text-muted-foreground">
                  {room.players.length}/{room.maxPlayers} joueurs
                </p>
              </div>
              <Link href={`/games/${room.gameType}/room/${room.id}`}>
                <Button size="sm" variant="outline">
                  Continuer
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentTransactions({ userId, limit }: { userId: string; limit: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions récentes</CardTitle>
        <CardDescription>Vos derniers mouvements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucune transaction récente</p>
          <Link href="/transactions">
            <Button variant="link" className="mt-2">
              Voir tout l'historique
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickDepositModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // This would be implemented as a proper modal component
  return null;
}