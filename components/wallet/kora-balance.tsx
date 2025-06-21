/**
 * Composant d'affichage du solde Koras
 * Affiche le solde avec animations et actions rapides
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  IconCoin,
  IconPlus,
  IconMinus,
  IconRefresh,
  IconEye,
  IconEyeOff,
  IconTrendingUp,
  IconTrendingDown,
  IconLock,
  IconWallet,
  IconChartLine
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface WalletBalance {
  userId: string;
  userName: string;
  totalKoras: number;
  availableKoras: number;
  lockedKoras: number;
  lastTransactionDate?: Date;
}

export interface BalanceStats {
  totalWinnings: number;
  totalLosses: number;
  netProfit: number;
  gamesPlayed: number;
  winRate: number;
}

export interface KoraBalanceProps {
  userId: string;
  className?: string;
  showStats?: boolean;
  showActions?: boolean;
  compactMode?: boolean;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onTransactionHistory?: () => void;
}

export function KoraBalance({ 
  userId, 
  className,
  showStats = true,
  showActions = true,
  compactMode = false,
  onDeposit,
  onWithdraw,
  onTransactionHistory
}: KoraBalanceProps) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [stats, setStats] = useState<BalanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger le solde
  const loadBalance = async () => {
    setLoading(true);
    setError(null);

    try {
      // Ici on ferait l'appel API réel
      // const response = await fetch(`/api/wallet/balance/${userId}`);
      
      // Mock data pour la démo
      const mockBalance: WalletBalance = {
        userId,
        userName: 'Utilisateur Test',
        totalKoras: 15670,
        availableKoras: 14170,
        lockedKoras: 1500,
        lastTransactionDate: new Date(Date.now() - 3600000)
      };

      const mockStats: BalanceStats = {
        totalWinnings: 8450,
        totalLosses: 3200,
        netProfit: 5250,
        gamesPlayed: 23,
        winRate: 65.2
      };

      setBalance(mockBalance);
      setStats(mockStats);

    } catch (err) {
      setError('Erreur lors du chargement du solde');
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir le solde
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBalance();
    setRefreshing(false);
  };

  useEffect(() => {
    loadBalance();
  }, [userId]);

  const formatKoras = (amount: number) => {
    return amount.toLocaleString('fr-FR');
  };

  const getBalanceColor = (amount: number) => {
    if (amount >= 10000) return 'text-chart-4'; // Vert
    if (amount >= 5000) return 'text-chart-5'; // Orange
    return 'text-chart-1'; // Rouge
  };

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? 'text-chart-4' : 'text-chart-1';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <IconRefresh className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Chargement du solde...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !balance) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-chart-1 mb-2">{error || 'Erreur inconnue'}</p>
            <Button onClick={loadBalance} size="sm">
              <IconRefresh className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compactMode) {
    return (
      <Card className={cn("border-primary/20", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <IconCoin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde disponible</p>
                <p className={cn("text-lg font-bold", getBalanceColor(balance.availableKoras))}>
                  {showBalance ? formatKoras(balance.availableKoras) : '••••••'} Koras
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </Button>
              
              {showActions && (
                <>
                  <Button onClick={onDeposit} size="sm">
                    <IconPlus className="w-4 h-4" />
                  </Button>
                  <Button onClick={onWithdraw} variant="outline" size="sm">
                    <IconMinus className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <IconWallet className="w-5 h-5 text-primary" />
            Portefeuille Koras
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <IconRefresh className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Solde principal */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Solde total</p>
          <motion.div
            key={showBalance ? balance.totalKoras : 'hidden'}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="flex items-center justify-center gap-2"
          >
            <IconCoin className="w-8 h-8 text-primary" />
            <span className={cn("text-4xl font-bold", getBalanceColor(balance.totalKoras))}>
              {showBalance ? formatKoras(balance.totalKoras) : '••••••••'}
            </span>
            <span className="text-lg text-muted-foreground">Koras</span>
          </motion.div>
        </div>

        {/* Détails du solde */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-chart-4/10 rounded-lg border border-chart-4/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <IconCoin className="w-4 h-4 text-chart-4" />
              <span className="text-sm font-medium text-chart-4">Disponible</span>
            </div>
            <p className="text-xl font-bold">
              {showBalance ? formatKoras(balance.availableKoras) : '••••••'}
            </p>
          </div>
          
          <div className="text-center p-3 bg-chart-5/10 rounded-lg border border-chart-5/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <IconLock className="w-4 h-4 text-chart-5" />
              <span className="text-sm font-medium text-chart-5">Verrouillé</span>
            </div>
            <p className="text-xl font-bold">
              {showBalance ? formatKoras(balance.lockedKoras) : '••••••'}
            </p>
          </div>
        </div>

        {/* Statistiques */}
        {showStats && stats && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <IconChartLine className="w-4 h-4" />
              Statistiques de jeu
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gains totaux:</span>
                <span className="font-medium text-chart-4 flex items-center gap-1">
                  <IconTrendingUp className="w-3 h-3" />
                  {formatKoras(stats.totalWinnings)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pertes totales:</span>
                <span className="font-medium text-chart-1 flex items-center gap-1">
                  <IconTrendingDown className="w-3 h-3" />
                  {formatKoras(stats.totalLosses)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Profit net:</span>
                <span className={cn("font-medium flex items-center gap-1", getProfitColor(stats.netProfit))}>
                  {stats.netProfit >= 0 ? <IconTrendingUp className="w-3 h-3" /> : <IconTrendingDown className="w-3 h-3" />}
                  {formatKoras(Math.abs(stats.netProfit))}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Taux de victoire:</span>
                <Badge variant="outline" className={cn(
                  stats.winRate >= 60 ? "border-chart-4 text-chart-4" :
                  stats.winRate >= 40 ? "border-chart-5 text-chart-5" :
                  "border-chart-1 text-chart-1"
                )}>
                  {stats.winRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              {stats.gamesPlayed} partie{stats.gamesPlayed > 1 ? 's' : ''} jouée{stats.gamesPlayed > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="grid grid-cols-3 gap-3">
            <Button onClick={onDeposit} className="flex-1">
              <IconPlus className="w-4 h-4 mr-2" />
              Dépôt
            </Button>
            
            <Button onClick={onWithdraw} variant="outline" className="flex-1">
              <IconMinus className="w-4 h-4 mr-2" />
              Retrait
            </Button>
            
            <Button onClick={onTransactionHistory} variant="outline" className="flex-1">
              <IconChartLine className="w-4 h-4 mr-2" />
              Historique
            </Button>
          </div>
        )}

        {/* Dernière transaction */}
        {balance.lastTransactionDate && (
          <p className="text-xs text-muted-foreground text-center">
            Dernière transaction: {new Date(balance.lastTransactionDate).toLocaleString('fr-FR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}