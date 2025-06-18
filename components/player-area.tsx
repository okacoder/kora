import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "@/components/game-card";
import { cn } from "@/lib/utils";

interface PlayerAreaProps {
  player: any | null;
  isCurrentPlayer: boolean;
  gameRoom: any;
  showCards?: boolean;
  className?: string;
}

export function PlayerArea({ 
  player, 
  isCurrentPlayer, 
  gameRoom, 
  showCards = true,
  className 
}: PlayerAreaProps) {
  if (!player) {
    return (
      <div className={cn("text-center py-4", className)}>
        <p className="text-game-sm text-muted-foreground">En attente...</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Player info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-game-xs">
              {player.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-game-sm">{player.username}</p>
            {isCurrentPlayer && (
              <Badge variant="secondary" className="text-game-xs h-4">
                Vous
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-game-xs text-muted-foreground">Mise</p>
          <p className="font-semibold text-game-sm">{gameRoom.stake} K</p>
        </div>
      </div>

      {/* Cards */}
      {showCards && (
        <div className="flex justify-center">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <GameCard key={i} size="small" faceDown className="shadow-sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}