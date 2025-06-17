import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlayingCard, CardBack } from '@/components/game-card';
import { IconHandStop, IconCoin } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { GarameGameState, GaramePlayerState } from '../garame-types';

interface GarameGameBoardProps {
  gameState: GarameGameState;
  currentPlayerId: string;
  playerNames: Map<string, string>;
  playerAvatars?: Map<string, string>;
  onCardClick?: (cardIndex: number) => void;
  className?: string;
}

export function GarameGameBoard({ 
  gameState, 
  currentPlayerId, 
  playerNames, 
  playerAvatars, 
  onCardClick, 
  className 
}: GarameGameBoardProps) {
  // Convert game state to players array
  const players = Array.from(gameState.players.entries()).map(([playerId, playerState]) => ({
    id: playerId,
    name: playerNames.get(playerId) || 'Joueur',
    avatar: playerAvatars?.get(playerId),
    state: playerState as GaramePlayerState,
    isCurrentTurn: playerId === gameState.currentPlayerId
  }));

  // Position players (for 2 players)
  const playerPositions = [
    { top: '5%', left: '50%', transform: 'translate(-50%, 0)' },
    { bottom: '5%', left: '50%', transform: 'translate(-50%, 0)' }
  ];

  const isMyTurn = currentPlayerId === gameState.currentPlayerId;
  const myPlayerState = gameState.players.get(currentPlayerId) as GaramePlayerState;

  return (
    <div className={cn("relative w-full h-full min-h-[500px] flex items-center justify-center", className)}>
      {/* Game Table Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[90%] h-[80%] max-w-[600px] max-h-[400px] bg-gradient-to-br from-green-800 to-green-900 rounded-[50%] shadow-2xl">
          <div className="w-full h-full rounded-[50%] bg-gradient-to-br from-transparent via-green-700/20 to-transparent" />
        </div>
      </div>

      {/* Center Area */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        {/* Last Played Card */}
        {gameState.lastPlayedCard && (
          <div className="mb-4 animate-in zoom-in-50 duration-300">
            <PlayingCard 
              suit={gameState.lastPlayedCard.suit} 
              rank={gameState.lastPlayedCard.rank}
              width={80}
              height={110}
            />
          </div>
        )}

        {/* Pot Display */}
        {gameState.pot > 0 && (
          <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full border shadow-lg">
            <div className="flex items-center gap-2">
              <IconCoin className="size-5 text-yellow-500" />
              <span className="font-bold text-lg">{gameState.pot.toLocaleString()} FCFA</span>
            </div>
          </div>
        )}

        {/* Turn Indicator */}
        {gameState.status === 'playing' && (
          <div className="mt-4 text-sm text-muted-foreground">
            {isMyTurn ? "C'est votre tour" : "Tour de l'adversaire"}
          </div>
        )}
      </div>

      {/* Players */}
      {players.map((player, index) => (
        <div 
          key={player.id} 
          className="absolute flex flex-col items-center gap-3"
          style={playerPositions[index]}
        >
          {/* Player Info */}
          <div className="flex flex-col items-center gap-2">
            <Avatar className={cn(
              "size-16 border-2 transition-all",
              player.isCurrentTurn 
                ? "border-yellow-500 ring-2 ring-yellow-500 ring-offset-2 ring-offset-background animate-pulse" 
                : "border-border"
            )}>
              <AvatarImage src={player.avatar} />
              <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <p className="font-semibold">{player.name}</p>
              {player.state.isAI && (
                <Badge variant="secondary" className="text-xs">
                  Bot
                </Badge>
              )}
            </div>

            {/* Kora Indicator */}
            {player.state.hasKora && (
              <Badge variant="default" className="bg-yellow-500 text-black">
                <IconHandStop className="size-3 mr-1" />
                KORA
              </Badge>
            )}
          </div>

          {/* Player Cards */}
          <div className="flex -space-x-4">
            {player.state.cards.map((card, cardIndex) => (
              <div 
                key={cardIndex} 
                className={cn(
                  "relative transition-all duration-200",
                  player.id === currentPlayerId && isMyTurn 
                    ? "hover:z-10 hover:-translate-y-2 cursor-pointer" 
                    : ""
                )}
                onClick={() => {
                  if (player.id === currentPlayerId && isMyTurn && onCardClick) {
                    onCardClick(cardIndex);
                  }
                }}
              >
                {player.id === currentPlayerId ? (
                  <PlayingCard 
                    suit={card.suit} 
                    rank={card.rank}
                    width={60}
                    height={84}
                    className={cn(
                      "shadow-lg",
                      isMyTurn ? "hover:shadow-xl" : "opacity-75"
                    )}
                  />
                ) : (
                  <CardBack 
                    width={60} 
                    height={84}
                    className="shadow-lg"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Cards Count */}
          <Badge variant="outline" className="text-xs">
            {player.state.cards.length} carte{player.state.cards.length > 1 ? 's' : ''}
          </Badge>
        </div>
      ))}

      {/* Game Status Overlay */}
      {gameState.status === 'finished' && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold mb-4">Partie terminée!</h2>
            <p className="text-lg">
              {gameState.winnerId === currentPlayerId ? 'Vous avez gagné!' : 'Vous avez perdu.'}
            </p>
            {gameState.winnerId && (
              <p className="mt-2 text-muted-foreground">
                Gagnant: {playerNames.get(gameState.winnerId)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}