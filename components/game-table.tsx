import React from "react";
import { GameCard } from "@/components/game-card";
import { Badge } from "@/components/ui/badge";
import { IconCoin } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface GameTableProps {
  gameState?: any;
  totalPot?: number;
  className?: string;
}

export function GameTable({ gameState, totalPot = 0, className }: GameTableProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Table surface */}
      <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl p-4 border-2 border-secondary/30">
        {/* Center pot display */}
        <div className="flex items-center justify-center mb-3">
          <Badge variant="secondary" className="text-game-xs px-3 py-1">
            <IconCoin className="h-3 w-3 mr-1" />
            Pot: {totalPot.toLocaleString()} koras
          </Badge>
        </div>

        {/* Cards area */}
        <div className="flex justify-center items-center min-h-[80px]">
          {gameState?.centerCards ? (
            <div className="flex gap-1">
              {gameState.centerCards.map((card: any, index: number) => (
                <GameCard
                  key={index}
                  suit={card.suit}
                  rank={card.rank}
                  size="small"
                  className="shadow-md"
                />
              ))}
            </div>
          ) : (
            <div className="text-game-xs text-muted-foreground">
              En attente...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}