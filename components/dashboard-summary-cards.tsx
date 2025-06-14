import { IconCoin, IconTrophy, IconUsers, IconPercentage } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardSummaryCardsProps {
  koras: number;
  totalGains: number; // FCFA
  totalGames: number;
  winRate: number; // 0-100
  className?: string;
}

export function DashboardSummaryCards({
  koras,
  totalGains,
  totalGames,
  winRate,
  className,
}: DashboardSummaryCardsProps) {
  return (
    <div
      className={
        "grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4" +
        (className ? ` ${className}` : "")
      }
    >
      {/* Solde Koras */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Vos koras</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {koras.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconCoin />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Disponible pour jouer</div>
        </CardFooter>
      </Card>

      {/* Gains cumulés */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Gains cumulés</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalGains.toLocaleString()} FCFA
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrophy />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Au total, depuis l'inscription</div>
        </CardFooter>
      </Card>

      {/* Total parties */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Parties jouées</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalGames}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Toutes mises confondues</div>
        </CardFooter>
      </Card>

      {/* Taux de victoire */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Taux de victoires</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {winRate}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconPercentage />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Victoire / parties</div>
        </CardFooter>
      </Card>
    </div>
  );
} 