import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlayingCard, CardBack } from '@/components/game-card';
import { IconHandStop, IconCoin } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import type { BaseGameState, BasePlayerState } from '@/lib/garame/core/types';

interface GameBoardPlayer {
  id: string;
  name: string;
  avatar?: string;
  playerState: BasePlayerState & { cards?: any[]; hasKora?: boolean };
  isCurrentTurn: boolean;
}

interface GameTableProps {
  gameState: BaseGameState;
  currentPlayerId: string;
  playerNames: Map<string, string>;
  playerAvatars?: Map<string, string>;
  onCardClick?: (playerId: string, cardIndex: number) => void;
  className?: string;
}

// Positions des joueurs selon leur nombre
const getPlayerPositions = (playerCount: number) => {
  const positions = {
    2: [
      { top: '5%', left: '50%', transform: 'translate(-50%, 0)' },
      { bottom: '5%', left: '50%', transform: 'translate(-50%, 0)' }
    ],
    3: [
      { top: '10%', left: '50%', transform: 'translate(-50%, 0)' },
      { bottom: '15%', left: '25%', transform: 'translate(-50%, 0)' },
      { bottom: '15%', right: '25%', transform: 'translate(50%, 0)' }
    ],
    4: [
      { top: '10%', left: '50%', transform: 'translate(-50%, 0)' },
      { top: '50%', right: '10%', transform: 'translate(0, -50%)' },
      { bottom: '10%', left: '50%', transform: 'translate(-50%, 0)' },
      { top: '50%', left: '10%', transform: 'translate(0, -50%)' }
    ]
  };
  
  return positions[playerCount as keyof typeof positions] || positions[2];
};

const GameTable = ({ 
  gameState, 
  currentPlayerId, 
  playerNames, 
  playerAvatars, 
  onCardClick, 
  className 
}: GameTableProps) => {
  // Convert game state to players array
  const players: GameBoardPlayer[] = Array.from(gameState.players.entries()).map(([playerId, playerState]) => ({
    id: playerId,
    name: playerNames.get(playerId) || 'Joueur',
    avatar: playerAvatars?.get(playerId),
    playerState: playerState as BasePlayerState & { cards?: any[]; hasKora?: boolean },
    isCurrentTurn: playerId === gameState.currentPlayerId
  }));
  
  const positions = getPlayerPositions(players.length);
  // Try to get lastPlayedCard if present in metadata or state
  const centerCard = (gameState as any).lastPlayedCard || gameState.metadata?.lastPlayedCard;
  
  return (
    <div className={cn("relative w-full h-full min-h-[400px] flex items-center justify-center", className)}>
      {/* Table SVG avec design system */}
      <svg 
        viewBox="0 0 400 600" 
        className="absolute inset-0 w-full h-full max-w-lg max-h-[600px] mx-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Dégradé utilisant les couleurs du design system */}
          <radialGradient id="tableGradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" className="text-chart-4/80" stopColor="currentColor" />
            <stop offset="30%" className="text-chart-4" stopColor="currentColor" />
            <stop offset="60%" className="text-chart-4" stopColor="currentColor" />
            <stop offset="100%" className="text-chart-4/90" stopColor="currentColor" />
          </radialGradient>
          
          {/* Effet de brillance */}
          <radialGradient id="tableShine" cx="40%" cy="30%" r="50%">
            <stop offset="0%" className="text-background/30" stopColor="currentColor" />
            <stop offset="50%" className="text-background/10" stopColor="currentColor" />
            <stop offset="100%" className="text-background/0" stopColor="currentColor" />
          </radialGradient>
          
          {/* Ombre */}
          <filter id="tableShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
            <feOffset dx="0" dy="8" result="offsetblur"/>
            <feMorphology operator="dilate" radius="2"/>
            <feFlood floodOpacity="0.2"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Pattern de texture */}
          <pattern id="tableTexture" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="25" cy="25" r="0.5" className="text-chart-4" fill="currentColor" opacity="0.3"/>
            <circle cx="75" cy="25" r="0.5" className="text-chart-4" fill="currentColor" opacity="0.3"/>
            <circle cx="25" cy="75" r="0.5" className="text-chart-4" fill="currentColor" opacity="0.3"/>
            <circle cx="75" cy="75" r="0.5" className="text-chart-4" fill="currentColor" opacity="0.3"/>
          </pattern>
        </defs>
        
        {/* Table principale */}
        <ellipse cx="200" cy="300" rx="180" ry="270" fill="url(#tableGradient)" filter="url(#tableShadow)"/>
        
        {/* Texture */}
        <ellipse cx="200" cy="300" rx="180" ry="270" fill="url(#tableTexture)" opacity="0.3"/>
        
        {/* Bordure dorée */}
        <ellipse cx="200" cy="300" rx="180" ry="270" fill="none" className="stroke-primary" strokeWidth="3" opacity="0.8"/>
        
        {/* Bordure intérieure */}
        <ellipse cx="200" cy="300" rx="170" ry="260" fill="none" className="stroke-chart-4/60" strokeWidth="2"/>
        
        {/* Zone de jeu */}
        <ellipse cx="200" cy="300" rx="160" ry="250" fill="none" className="stroke-chart-4/40" strokeWidth="1.5" strokeDasharray="5 5"/>
        
        {/* Reflet */}
        <ellipse cx="200" cy="300" rx="170" ry="260" fill="url(#tableShine)"/>
        
        {/* Logo central */}
        <g opacity="0.2">
          <circle cx="200" cy="300" r="40" fill="none" className="stroke-chart-4" strokeWidth="1"/>
          <g transform="translate(200, 300)">
            <path d="M0,-20 L5,-5 L20,0 L5,5 L0,20 L-5,5 L-20,0 L-5,-5 Z" className="fill-chart-4" opacity="0.3"/>
            <circle cx="0" cy="0" r="8" fill="none" className="stroke-chart-4" strokeWidth="1"/>
          </g>
        </g>
        
        {/* Points décoratifs */}
        <g opacity="0.3">
          <circle cx="200" cy="30" r="3" className="fill-primary"/>
          <circle cx="200" cy="570" r="3" className="fill-primary"/>
          <circle cx="20" cy="300" r="3" className="fill-primary"/>
          <circle cx="380" cy="300" r="3" className="fill-primary"/>
        </g>
      </svg>
      
      {/* Carte du centre (dernière carte jouée) */}
      {centerCard && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-in zoom-in-50 duration-300">
            <PlayingCard 
              suit={centerCard.suit} 
              rank={centerCard.rank}
              width={80}
              height={110}
            />
          </div>
          {gameState.pot > 0 && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border">
              <div className="flex items-center gap-1">
                <IconCoin className="size-4 text-primary" />
                <span className="text-sm font-semibold">{gameState.pot.toLocaleString()} koras</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Joueurs */}
      {players.map((player, index) => (
        <div 
          key={player.id} 
          className="absolute flex flex-col items-center gap-2"
          style={positions[index]}
        >
          {/* Avatar et infos */}
          <div className="flex flex-col items-center gap-1">
            <Avatar className={cn(
              "size-12 md:size-14 border-2 transition-all",
              player.isCurrentTurn 
                ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background" 
                : "border-border"
            )}>
              <AvatarImage src={player.avatar} />
              <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <p className="text-sm font-semibold">{player.name}</p>
              <div className="flex items-center gap-1 justify-center">
                <IconCoin className="size-3 text-primary" />
                <span className="text-xs text-muted-foreground">{player.playerState.score?.toLocaleString?.() ?? 0} koras</span>
              </div>
            </div>
          </div>
          
          {/* Cartes du joueur */}
          <div className="flex -space-x-4 mt-1">
            {(player.playerState.cards || []).map((card, cardIndex) => (
              <div 
                key={cardIndex} 
                className={cn(
                  "relative transition-all",
                  player.id === currentPlayerId ? "hover:z-10 hover:-translate-y-2 cursor-pointer" : ""
                )}
                onClick={() => {
                  if (player.id === currentPlayerId && player.isCurrentTurn && onCardClick) {
                    onCardClick(player.id, cardIndex);
                  }
                }}
              >
                {player.id === currentPlayerId ? (
                  <PlayingCard 
                    suit={card.suit} 
                    rank={card.rank}
                    width={50}
                    height={70}
                  />
                ) : (
                  <CardBack width={50} height={70} />
                )}
              </div>
            ))}
          </div>
          
          {/* Badges */}
          <div className="flex gap-1">
            {player.playerState.hasKora && (
              <Badge variant="default" className="text-xs">
                <IconHandStop className="size-3 mr-1" />Kora
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {(player.playerState.cards?.length ?? 0)} cartes
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameTable;