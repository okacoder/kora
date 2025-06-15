"use client";

import { useDashboardStats } from "@/lib/garame/hooks/useDashboardStats";
import { DashboardSummaryCards } from "@/components/dashboard-summary-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { TransactionsTable } from "@/components/transactions-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
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
