'use client';

import { useState, useEffect, useMemo } from "react";
import { usePaymentService, useUserService } from "@/hooks/useInjection";
import { useUser } from "@/providers/user-provider";

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
 * Hook that returns all metrics necessary for the user dashboard display.
 * It centralizes data retrieval to respect the DRY principle.
 */
export function useDashboardStats(): DashboardStats {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const { user } = useUser();
  const paymentService = usePaymentService();
  const userService = useUserService();

  useEffect(() => {
    let cancelled = false;
    
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Get transaction history
        const transactionHistory = await paymentService.getTransactionHistory(user.id, 50);
        if (!cancelled) {
          setTransactions(transactionHistory);
        }
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    load();
    const interval = setInterval(load, 30000);
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, paymentService]);

  const stats = useMemo(() => {
    if (!user) {
      return { totalWins: 0, totalGames: 0, winRate: 0, totalGains: 0 };
    }

    // Calculate stats from user data and transactions
    const winRate = user.totalGames > 0 
      ? Math.round((user.totalWins / user.totalGames) * 100) 
      : 0;
    
    const gameWins = transactions.filter(t => t.type === 'GAME_WIN');
    const totalGains = gameWins.reduce((sum, t) => sum + (t.koras || 0), 0);

    return {
      totalWins: user.totalWins || 0,
      totalGames: user.totalGames || 0,
      winRate,
      totalGains
    };
  }, [user, transactions]);

  return {
    loading,
    balance: user?.koras || 0,
    totalWins: stats.totalWins,
    totalGames: stats.totalGames,
    winRate: stats.winRate,
    totalGains: stats.totalGains,
    transactions,
  };
}