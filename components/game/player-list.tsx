import { RoomPlayer } from '@/lib/garame/core/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  IconRobot, 
  IconUser, 
  IconCrown,
  IconX 
} from '@tabler/icons-react';

interface PlayerListProps {
  players: RoomPlayer[];
  maxPlayers: number;
  isHost: boolean;
  onAddAI?: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onKickPlayer?: (playerId: string) => void;
}

export function PlayerList({ 
  players, 
  maxPlayers, 
  isHost,
  onAddAI,
  onKickPlayer 
}: PlayerListProps) {
  const emptySlots = maxPlayers - players.length;

  return (
    <div className="space-y-2">
      {/* Active players */}
      {players.map((player, index) => (
        <div 
          key={player.id}
          className="flex items-center justify-between p-3 bg-card rounded-lg border"
        >
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {player.isAI ? <IconRobot /> : player.name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{player.name}</span>
                {index === 0 && (
                  <IconCrown className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <div className="flex gap-1">
                {player.isAI && (
                  <Badge variant="secondary" className="text-xs">
                    Bot {player.aiDifficulty}
                  </Badge>
                )}
                {player.isReady && (
                  <Badge variant="default" className="text-xs">
                    Prêt
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {isHost && player.isAI && onKickPlayer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onKickPlayer(player.id)}
            >
              <IconX className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {/* Empty slots */}
      {Array.from({ length: emptySlots }).map((_, index) => (
        <div 
          key={`empty-${index}`}
          className="flex items-center justify-center p-3 border-2 border-dashed rounded-lg"
        >
          {isHost && onAddAI ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAddAI('easy')}
              >
                <IconRobot className="h-4 w-4 mr-1" />
                Bot Facile
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAddAI('medium')}
              >
                <IconRobot className="h-4 w-4 mr-1" />
                Bot Moyen
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAddAI('hard')}
              >
                <IconRobot className="h-4 w-4 mr-1" />
                Bot Difficile
              </Button>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              En attente d'un joueur...
            </span>
          )}
        </div>
      ))}
    </div>
  );
}