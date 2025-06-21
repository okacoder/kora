/**
 * Dashboard administrateur pour le suivi financier
 * Vue d'ensemble des revenus, transactions et métriques clés
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  IconCoin,
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconDeviceGamepad2,
  IconPercentage,
  IconDownload,
  IconRefresh,
  IconCalendar,
  IconArrowUp,
  IconArrowDown,
  IconEye,
  IconShield,
  IconAlertTriangle
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Types pour les données du dashboard
interface RevenueSummary {
  totalRevenue: number;
  gameCommissions: number;
  transactionFees: number;
  growthRate: number;
  period: string;
}

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  retentionRate: number;
}

interface GameMetrics {
  totalGames: number;
  totalVolume: number;
  averageBet: number;
  popularGames: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
}

interface FinancialAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
}

export interface FinancialDashboardProps {
  className?: string;
  adminOnly?: boolean;
}

export function FinancialDashboard({ className, adminOnly = true }: FinancialDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  // États des données
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [users, setUsers] = useState<UserMetrics | null>(null);
  const [games, setGames] = useState<GameMetrics | null>(null);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);

  // Charger les données du dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // Ici on ferait les appels API réels
      // const response = await fetch(`/api/admin/dashboard?period=${period}`);
      
      // Mock data pour la démo
      const mockRevenue: RevenueSummary = {
        totalRevenue: 2847500,
        gameCommissions: 2456800,
        transactionFees: 390700,
        growthRate: 12.5,
        period: period === '7d' ? '7 derniers jours' : '30 derniers jours'
      };

      const mockUsers: UserMetrics = {
        totalUsers: 15847,
        activeUsers: 3421,
        newUsers: 234,
        retentionRate: 68.5
      };

      const mockGames: GameMetrics = {
        totalGames: 1256,
        totalVolume: 24568000,
        averageBet: 1950,
        popularGames: [
          { name: 'Garame', count: 1089, revenue: 2180000 },
          { name: 'Belote', count: 167, revenue: 276800 }
        ]
      };

      const mockAlerts: FinancialAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Taux de retrait élevé',
          description: 'Le volume de retraits a augmenté de 25% aujourd\'hui',
          timestamp: new Date(Date.now() - 3600000),
          resolved: false
        },
        {
          id: '2',
          type: 'info',
          title: 'Nouveau pic d\'activité',
          description: 'Record de parties simultanées atteint: 89 parties',
          timestamp: new Date(Date.now() - 7200000),
          resolved: true
        }
      ];

      setRevenue(mockRevenue);
      setUsers(mockUsers);
      setGames(mockGames);
      setAlerts(mockAlerts);

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir les données
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Exporter les données
  const handleExport = () => {
    // Logique d'export en CSV/Excel
    console.log('Export des données financières');
  };

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? IconTrendingUp : IconTrendingDown;
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? 'text-chart-4' : 'text-chart-1';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return IconAlertTriangle;
      case 'warning': return IconEye;
      default: return IconShield;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-12">
          <IconRefresh className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Chargement du dashboard...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financier</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble des performances et revenus
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Aujourd'hui</SelectItem>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <IconRefresh className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Actualiser
          </Button>
          
          <Button onClick={handleExport}>
            <IconDownload className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Alertes importantes */}
      {alerts.filter(a => !a.resolved).length > 0 && (
        <div className="space-y-2">
          {alerts.filter(a => !a.resolved).map((alert) => {
            const AlertIcon = getAlertIcon(alert.type);
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border",
                  alert.type === 'error' && "bg-chart-1/10 border-chart-1/20",
                  alert.type === 'warning' && "bg-chart-5/10 border-chart-5/20",
                  alert.type === 'info' && "bg-chart-3/10 border-chart-3/20"
                )}
              >
                <AlertIcon className={cn(
                  "w-5 h-5",
                  alert.type === 'error' && "text-chart-1",
                  alert.type === 'warning' && "text-chart-5",
                  alert.type === 'info' && "text-chart-3"
                )} />
                <div className="flex-1">
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {alert.timestamp.toLocaleTimeString('fr-FR')}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenus totaux */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <IconCoin className="w-8 h-8 text-primary" />
                <Badge variant="outline" className="text-primary border-primary/30">
                  {revenue?.period}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Revenus totaux</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(revenue?.totalRevenue || 0)} FCFA
                </p>
                
                <div className="flex items-center gap-2">
                  {revenue && (() => {
                    const GrowthIcon = getGrowthIcon(revenue.growthRate);
                    return (
                      <>
                        <GrowthIcon className={cn("w-4 h-4", getGrowthColor(revenue.growthRate))} />
                        <span className={cn("text-sm font-medium", getGrowthColor(revenue.growthRate))}>
                          {Math.abs(revenue.growthRate).toFixed(1)}%
                        </span>
                        <span className="text-sm text-muted-foreground">vs période précédente</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Utilisateurs actifs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <IconUsers className="w-8 h-8 text-chart-3" />
                <Badge variant="outline">
                  {users?.retentionRate.toFixed(1)}% rétention
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                <p className="text-3xl font-bold">{formatCurrency(users?.activeUsers || 0)}</p>
                <p className="text-sm text-muted-foreground">
                  +{users?.newUsers} nouveaux utilisateurs
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Parties jouées */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <IconDeviceGamepad2 className="w-8 h-8 text-chart-4" />
                <Badge variant="outline">
                  {formatCurrency(games?.averageBet || 0)} FCFA/partie
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Parties jouées</p>
                <p className="text-3xl font-bold">{formatCurrency(games?.totalGames || 0)}</p>
                <p className="text-sm text-muted-foreground">
                  Volume: {formatCurrency(games?.totalVolume || 0)} FCFA
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Commissions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-chart-5/20 bg-gradient-to-br from-chart-5/5 to-chart-5/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <IconPercentage className="w-8 h-8 text-chart-5" />
                <Badge variant="outline" className="text-chart-5 border-chart-5/30">
                  10% taux
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Commissions</p>
                <p className="text-3xl font-bold text-chart-5">
                  {formatCurrency(revenue?.gameCommissions || 0)} FCFA
                </p>
                <p className="text-sm text-muted-foreground">
                  +{formatCurrency(revenue?.transactionFees || 0)} FCFA (frais)
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs pour les détails */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="games">Jeux</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition des revenus */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Commissions jeux</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ 
                            width: `${((revenue?.gameCommissions || 0) / (revenue?.totalRevenue || 1)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {formatCurrency(revenue?.gameCommissions || 0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Frais transactions</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-chart-5 rounded-full"
                          style={{ 
                            width: `${((revenue?.transactionFees || 0) / (revenue?.totalRevenue || 1)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {formatCurrency(revenue?.transactionFees || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jeux populaires */}
            <Card>
              <CardHeader>
                <CardTitle>Jeux populaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {games?.popularGames.map((game, index) => (
                    <div key={game.name} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          index === 0 && "bg-chart-5 text-white",
                          index === 1 && "bg-chart-3 text-white",
                          index >= 2 && "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{game.name}</span>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(game.count)} parties</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(game.revenue)} FCFA
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Détails des transactions et flux financiers...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques des jeux</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Métriques détaillées par type de jeu...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Comportement et engagement des utilisateurs...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}