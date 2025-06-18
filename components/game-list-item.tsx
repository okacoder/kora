import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "@/components/game-card";
import { IconUsers, IconClock, IconCoin } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface GameListItemProps {
  game: any;
  onJoin: () => void;
  disabled?: boolean;
  className?: string;
}

export function GameListItem({ game, onJoin, disabled, className }: GameListItemProps) {
  const timeAgo = game.createdAt 
    ? `${Math.round((Date.now() - game.createdAt.getTime()) / 60000)}m`
    : "";

  return (
    <div className={cn("game-list-item rounded-lg border bg-card tap-highlight-none", className)}>
      {/* Left side - Game preview */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="flex -space-x-3">
          <GameCard size="small" faceDown />
          <GameCard size="small" faceDown />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-game-sm truncate">{game.creatorName}</p>
          <div className="flex items-center gap-2 text-game-xs text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <IconCoin className="h-3 w-3" />
              {game.stake}
            </span>
            {timeAgo && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <IconClock className="h-3 w-3" />
                  {timeAgo}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Status and action */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-game-xs h-5">
          <IconUsers className="h-3 w-3 mr-0.5" />
          {game.players}/{game.maxPlayers}
        </Badge>
        <Button 
          size="sm"
          variant="default"
          onClick={onJoin}
          disabled={disabled}
          className="h-7 px-3 text-game-xs"
        >
          Rejoindre
        </Button>
      </div>
    </div>
  );
}