import { useState, useEffect, useMemo } from "react";
import { paymentService } from "@/lib/garame/core/payment-service";
import { gameStore } from "@/lib/garame/core/game-store";

interface DashboardStats {
  loading: boolean;
  balance: number; // koras
  totalWins: number;
  totalGames: number;
  winRate: number; // 0-100
  totalGains: number; // koras
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
        // Récupérer le solde en koras
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
    // No real transactions yet, so stats are zero
    return { totalWins: 0, totalGames: 0, winRate: 0, totalGains: 0 } as const;
  }, [balance, transactions]);

  return {
    loading,
    balance,
    totalWins: stats.totalWins,
    totalGames: stats.totalGames,
    winRate: stats.winRate,
    totalGains: stats.totalGains,
    transactions,
  };
} 