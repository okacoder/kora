"use client";

import { ITransaction } from "@/lib/garame/domain/interfaces";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IconArrowDownLeft, IconArrowUpRight, IconCoin, IconTrendingUp, IconReceipt } from "@tabler/icons-react";

interface TransactionsTableProps {
  transactions: ITransaction[];
}

function getIcon(type: ITransaction["type"]) {
  switch (type) {
    case "deposit":
      return <IconArrowDownLeft className="size-4 text-green-600" />;
    case "withdrawal":
      return <IconArrowUpRight className="size-4 text-red-600" />;
    case "game_stake":
      return <IconCoin className="size-4 text-orange-600" />;
    case "game_win":
      return <IconTrendingUp className="size-4 text-green-600" />;
    default:
      return <IconReceipt className="size-4" />;
  }
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const latest = transactions.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dernières activités</CardTitle>
        <CardDescription>Vos 5 dernières transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {latest.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune transaction pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {latest.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                    {getIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{tx.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount.toLocaleString()} FCFA
                  </p>
                  <Badge variant="outline" className="text-xs capitalize">
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 