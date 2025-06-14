import { useState, useEffect, useMemo } from "react";
import { usePaymentService } from "@/lib/garame/infrastructure/garame-provider";
import { ITransaction } from "@/lib/garame/domain/interfaces";

interface DashboardStats {
  loading: boolean;
  balance: number; // FCFA
  korasBalance: number;
  totalWins: number;
  totalGames: number;
  winRate: number; // 0-100
  totalGains: number; // FCFA
  transactions: ITransaction[];
}

/**
 * Hook that retourne toutes les métriques nécessaires à l'affichage du dashboard utilisateur.
 * Il centralise la récupération des données afin de respecter le principe DRY.
 */
export function useDashboardStats(): DashboardStats {
  const paymentService = usePaymentService();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const [bal, tx] = await Promise.all([
          paymentService.getBalance(),
          paymentService.getTransactionHistory(),
        ]);
        if (!cancelled) {
          setBalance(bal);
          setTransactions(tx);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Rafraîchissement toutes les 30 s pour garder les infos à jour.
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [paymentService]);

  const stats = useMemo(() => {
    const korasBalance = Math.floor(balance / 10);

    const wins = transactions.filter((t) => t.type === "game_win");
    const stakes = transactions.filter((t) => t.type === "game_stake");

    const totalWins = wins.length;
    const totalGames = stakes.length; // game_stake == parties jouées
    const winRate = totalGames === 0 ? 0 : Math.round((totalWins / totalGames) * 100);

    const totalGains = wins.reduce((acc, tx) => acc + tx.amount, 0);

    return { korasBalance, totalWins, totalGames, winRate, totalGains } as const;
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