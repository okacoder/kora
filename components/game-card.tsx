import React from 'react';
import { cn } from '@/lib/utils';

// Types de cartes
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface CardProps {
  suit: Suit;
  rank: Rank;
  width?: number;
  height?: number;
  className?: string;
}

// Composant pour une carte individuelle
const PlayingCard: React.FC<CardProps> = ({ suit, rank, width = 100, height = 140, className }) => {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  
  // Symboles des suites
  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  
  // Dessins complexes pour les figures
  const renderFaceCard = () => {
    if (rank === 'J' || rank === 'Q' || rank === 'K') {
      return (
        <g transform="translate(50, 70)">
          {/* Fond décoratif */}
          <rect 
            x="-35" 
            y="-50" 
            width="70" 
            height="100" 
            className={cn(
              "fill-current opacity-10",
              isRed ? "text-primary" : "text-accent"
            )}
            rx="5" 
          />
          
          {/* Motifs décoratifs */}
          <g className="opacity-30">
            <path
              d="M-30,-45 L30,-45 M-30,-40 L30,-40 M-30,40 L30,40 M-30,45 L30,45"
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-accent"
              )}
              strokeWidth="1"
              fill="none"
            />
            <circle 
              cx="-25" 
              cy="0" 
              r="15" 
              fill="none" 
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-accent"
              )}
              strokeWidth="1" 
            />
            <circle 
              cx="25" 
              cy="0" 
              r="15" 
              fill="none" 
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-accent"
              )}
              strokeWidth="1" 
            />
          </g>
          
          {/* Figure stylisée */}
          {rank === 'K' && (
            <g>
              <circle 
                cx="0" 
                cy="-10" 
                r="12" 
                className={cn(
                  "fill-current opacity-20",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              <path 
                d="M-8,-15 L0,-20 L8,-15" 
                className={cn(
                  "stroke-current",
                  isRed ? "text-primary" : "text-accent"
                )}
                strokeWidth="2" 
                fill="none" 
              />
              <rect 
                x="-15" 
                y="-5" 
                width="30" 
                height="40" 
                className={cn(
                  "fill-current opacity-10",
                  isRed ? "text-primary" : "text-accent"
                )}
                rx="5" 
              />
              <text 
                x="0" 
                y="50" 
                textAnchor="middle" 
                fontSize="24" 
                className={cn(
                  "fill-current font-bold",
                  isRed ? "text-primary" : "text-accent"
                )}
              >
                K
              </text>
            </g>
          )}
          
          {rank === 'Q' && (
            <g>
              <circle 
                cx="0" 
                cy="-10" 
                r="12" 
                className={cn(
                  "fill-current opacity-20",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              <path 
                d="M-10,-8 Q0,-15 10,-8" 
                className={cn(
                  "stroke-current",
                  isRed ? "text-primary" : "text-accent"
                )}
                strokeWidth="2" 
                fill="none" 
              />
              <rect 
                x="-15" 
                y="-5" 
                width="30" 
                height="40" 
                className={cn(
                  "fill-current opacity-10",
                  isRed ? "text-primary" : "text-accent"
                )}
                rx="5" 
              />
              <text 
                x="0" 
                y="50" 
                textAnchor="middle" 
                fontSize="24" 
                className={cn(
                  "fill-current font-bold",
                  isRed ? "text-primary" : "text-accent"
                )}
              >
                Q
              </text>
            </g>
          )}
          
          {rank === 'J' && (
            <g>
              <circle 
                cx="0" 
                cy="-10" 
                r="12" 
                className={cn(
                  "fill-current opacity-20",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              <rect 
                x="-15" 
                y="-5" 
                width="30" 
                height="40" 
                className={cn(
                  "fill-current opacity-10",
                  isRed ? "text-primary" : "text-accent"
                )}
                rx="5" 
              />
              <text 
                x="0" 
                y="50" 
                textAnchor="middle" 
                fontSize="24" 
                className={cn(
                  "fill-current font-bold",
                  isRed ? "text-primary" : "text-accent"
                )}
              >
                J
              </text>
            </g>
          )}
        </g>
      );
    }
    return null;
  };
  
  // Disposition des symboles pour les cartes numériques
  const renderPips = () => {
    const positions: Record<string, Array<{x: number, y: number}>> = {
      'A': [{x: 50, y: 70}],
      '2': [{x: 50, y: 30}, {x: 50, y: 110}],
      '3': [{x: 50, y: 30}, {x: 50, y: 70}, {x: 50, y: 110}],
      '4': [{x: 30, y: 30}, {x: 70, y: 30}, {x: 30, y: 110}, {x: 70, y: 110}],
      '5': [{x: 30, y: 30}, {x: 70, y: 30}, {x: 50, y: 70}, {x: 30, y: 110}, {x: 70, y: 110}],
      '6': [{x: 30, y: 30}, {x: 70, y: 30}, {x: 30, y: 70}, {x: 70, y: 70}, {x: 30, y: 110}, {x: 70, y: 110}],
      '7': [{x: 30, y: 30}, {x: 70, y: 30}, {x: 50, y: 50}, {x: 30, y: 70}, {x: 70, y: 70}, {x: 30, y: 110}, {x: 70, y: 110}],
      '8': [{x: 30, y: 30}, {x: 70, y: 30}, {x: 50, y: 50}, {x: 30, y: 70}, {x: 70, y: 70}, {x: 50, y: 90}, {x: 30, y: 110}, {x: 70, y: 110}],
      '9': [{x: 30, y: 25}, {x: 70, y: 25}, {x: 30, y: 50}, {x: 70, y: 50}, {x: 50, y: 70}, {x: 30, y: 90}, {x: 70, y: 90}, {x: 30, y: 115}, {x: 70, y: 115}],
      '10': [{x: 30, y: 25}, {x: 70, y: 25}, {x: 50, y: 40}, {x: 30, y: 55}, {x: 70, y: 55}, {x: 30, y: 85}, {x: 70, y: 85}, {x: 50, y: 100}, {x: 30, y: 115}, {x: 70, y: 115}],
    };
    
    const pips = positions[rank] || [];
    
    return pips.map((pos, index) => (
      <text
        key={index}
        x={pos.x}
        y={pos.y}
        fontSize={rank === 'A' ? 40 : 20}
        className={cn(
          "fill-current",
          isRed ? "text-primary" : "text-accent"
        )}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {suitSymbols[suit]}
      </text>
    ));
  };
  
  return (
    <div className={cn("playing-card", className)}>
      <svg width={width} height={height} viewBox="0 0 100 140" className="w-full h-full">
        {/* Fond de carte avec texture */}
        <defs>
          <pattern id={`cardTexture-${suit}-${rank}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" className="fill-card" />
            <rect width="2" height="2" className="fill-card/95" />
          </pattern>
        </defs>
        
        {/* Carte principale */}
        <rect
          x="0"
          y="0"
          width="100"
          height="140"
          rx="8"
          fill={`url(#cardTexture-${suit}-${rank})`}
          className="stroke-border"
          strokeWidth="1"
        />
        
        {/* Bordure intérieure */}
        <rect
          x="4"
          y="4"
          width="92"
          height="132"
          rx="6"
          fill="none"
          className={cn(
            "stroke-current opacity-30",
            isRed ? "text-primary" : "text-accent"
          )}
          strokeWidth="0.5"
        />
        
        {/* Coins supérieur gauche et inférieur droit */}
        <g>
          {/* Coin supérieur gauche */}
          <text 
            x="8" 
            y="20" 
            fontSize="16" 
            className={cn(
              "fill-current font-bold",
              isRed ? "text-primary" : "text-accent"
            )}
          >
            {rank}
          </text>
          <text 
            x="8" 
            y="32" 
            fontSize="14" 
            className={cn(
              "fill-current",
              isRed ? "text-primary" : "text-accent"
            )}
          >
            {suitSymbols[suit]}
          </text>
          
          {/* Coin inférieur droit (inversé) */}
          <g transform="rotate(180, 50, 70)">
            <text 
              x="8" 
              y="20" 
              fontSize="16" 
              className={cn(
                "fill-current font-bold",
                isRed ? "text-primary" : "text-accent"
              )}
            >
              {rank}
            </text>
            <text 
              x="8" 
              y="32" 
              fontSize="14" 
              className={cn(
                "fill-current",
                isRed ? "text-primary" : "text-accent"
              )}
            >
              {suitSymbols[suit]}
            </text>
          </g>
        </g>
        
        {/* Contenu central */}
        {rank === 'J' || rank === 'Q' || rank === 'K' ? renderFaceCard() : renderPips()}
      </svg>
    </div>
  );
};

// Composant pour le dos de carte
const CardBack: React.FC<{ width?: number; height?: number; className?: string }> = ({ 
  width = 100, 
  height = 140,
  className 
}) => {
  return (
    <div className={cn("playing-card", className)}>
      <svg width={width} height={height} viewBox="0 0 100 140" className="w-full h-full">
        <rect x="0" y="0" width="100" height="140" rx="8" className="fill-secondary" />
        <rect x="4" y="4" width="92" height="132" rx="6" className="fill-primary" />
        
        {/* Motif central */}
        <g transform="translate(50, 70)">
          <circle r="30" fill="none" className="stroke-secondary" strokeWidth="2" />
          <circle r="25" fill="none" className="stroke-secondary" strokeWidth="1" />
          <circle r="20" fill="none" className="stroke-secondary" strokeWidth="1" />
          
          {/* Motifs décoratifs */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
            <line
              key={angle}
              x1="0"
              y1="0"
              x2={Math.cos(angle * Math.PI / 180) * 30}
              y2={Math.sin(angle * Math.PI / 180) * 30}
              className="stroke-secondary"
              strokeWidth="1"
            />
          ))}
          
          <text 
            x="0" 
            y="5" 
            textAnchor="middle" 
            fontSize="16" 
            className="fill-secondary font-bold"
          >
            241
          </text>
        </g>
        
        {/* Coins décoratifs */}
        {[[10, 10], [90, 10], [10, 130], [90, 130]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" className="fill-secondary" />
        ))}
      </svg>
    </div>
  );
};

// Composant principal affichant tout le jeu
const FullDeck: React.FC = () => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  return (
    <div className="p-5 bg-background">
      <h2 className="text-center mb-5 text-2xl font-bold text-foreground">
        Jeu de cartes complet - 52 cartes
      </h2>
      
      {suits.map(suit => (
        <div key={suit} className="mb-8">
          <h3 className={cn(
            "mb-4 text-xl font-semibold capitalize",
            suit === 'hearts' || suit === 'diamonds' ? "text-primary" : "text-accent"
          )}>
            {suit === 'hearts' ? '♥ Cœurs' : 
             suit === 'diamonds' ? '♦ Carreaux' :
             suit === 'clubs' ? '♣ Trèfles' :
             '♠ Piques'}
          </h3>
          
          <div className="game-grid">
            {ranks.map(rank => (
              <div key={`${suit}-${rank}`} className="flex justify-center card-shadow">
                <PlayingCard suit={suit} rank={rank} />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Dos de carte bonus */}
      <div className="mt-10 text-center">
        <h3 className="mb-4 text-xl font-semibold text-secondary">Dos de carte</h3>
        <div className="inline-block card-shadow-lg">
          <CardBack />
        </div>
      </div>
    </div>
  );
};

export { PlayingCard, CardBack, FullDeck };
export default FullDeck;