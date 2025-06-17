import { useState, useEffect, useMemo } from "react";
import { paymentService } from "@/lib/garame/core/payment-service";
import { gameStore } from "@/lib/garame/core/game-store";

interface DashboardStats {
  loading: boolean;
  balance: number; // FCFA
  korasBalance: number;
  totalWins: number;
  totalGames: number;
  winRate: number; // 0-100
  totalGains: number; // FCFA
  transactions: any[];
}

/**
 * Hook that retourne toutes les métriques nécessaires à l'affichage du dashboard utilisateur.
 * Il centralise la récupération des données afin de respecter le principe DRY.
 */
export function useDashboardStats(): DashboardStats {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        // Simulate fetching balance and transactions from gameStore
        const currentPlayer = await gameStore.getCurrentPlayer();
        setBalance(currentPlayer.balance);
        // TODO: Replace with real transaction history if available
        setTransactions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    const korasBalance = Math.floor(balance / 10);
    // No real transactions yet, so stats are zero
    return { korasBalance, totalWins: 0, totalGames: 0, winRate: 0, totalGains: 0 } as const;
  }, [balance, transactions]);

  return {
    loading,
    balance,
    korasBalance: stats.korasBalance,
    totalWins: stats.totalWins,
    totalGames: stats.totalGames,
    winRate: stats.winRate,
    totalGains: stats.totalGains,
    transactions,
  };
} 