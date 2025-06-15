"use client";

import { useDashboardStats } from "@/lib/garame/hooks/useDashboardStats";
import { Skeleton } from "./ui/skeleton";
import { DashboardSummaryCards } from "./dashboard-summary-cards";
import { TransactionsTable } from "./transactions-table";

export function Dashboard() {
  const {
    loading,
    korasBalance,
    totalGains,
    totalGames,
    winRate,
    transactions,
  } = useDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      {loading ? (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DashboardSummaryCards
          koras={korasBalance}
          totalGains={totalGains}
          totalGames={totalGames}
          winRate={winRate}
        />
      )}

      {/* Table des transactions */}
      <div className="px-4 lg:px-6">
        {loading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <TransactionsTable transactions={transactions} />
        )}
      </div>
    </div>
  );
}