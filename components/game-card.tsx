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
          {/* Fond décoratif avec pattern */}
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
          
          {/* Cadre ornementé */}
          <rect 
            x="-32" 
            y="-47" 
            width="64" 
            height="94" 
            fill="none"
            className={cn(
              "stroke-current opacity-20",
              isRed ? "text-primary" : "text-accent"
            )}
            strokeWidth="1.5"
            rx="3" 
          />
          
          {/* Motifs décoratifs élaborés */}
          <g className="opacity-30">
            {/* Lignes horizontales décoratives */}
            <path
              d="M-30,-45 L30,-45 M-30,-40 L30,-40 M-30,40 L30,40 M-30,45 L30,45"
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-accent"
              )}
              strokeWidth="1"
              fill="none"
            />
            
            {/* Cercles ornementaux */}
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
            
            {/* Motifs en losange */}
            <path
              d="M0,-35 L10,-25 L0,-15 L-10,-25 Z M0,15 L10,25 L0,35 L-10,25 Z"
              fill="none"
              className={cn(
                "stroke-current",
                isRed ? "text-primary" : "text-accent"
              )}
              strokeWidth="0.5"
            />
          </g>
          
          {/* Figure stylisée */}
          {rank === 'K' && (
            <g>
              {/* Couronne du roi */}
              <path 
                d="M-15,-25 L-10,-20 L-5,-25 L0,-20 L5,-25 L10,-20 L15,-25 L15,-15 L-15,-15 Z" 
                className={cn(
                  "fill-current opacity-30",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              <circle cx="-10" cy="-25" r="2" className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
              <circle cx="0" cy="-25" r="2" className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
              <circle cx="10" cy="-25" r="2" className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
              
              {/* Visage stylisé */}
              <circle 
                cx="0" 
                cy="-5" 
                r="8" 
                className={cn(
                  "fill-current opacity-15",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              
              {/* Corps avec détails royaux */}
              <path
                d="M-20,5 L-15,0 L-10,5 L-10,35 L10,35 L10,5 L15,0 L20,5"
                fill="none"
                className={cn(
                  "stroke-current opacity-40",
                  isRed ? "text-primary" : "text-accent"
                )}
                strokeWidth="1.5"
              />
              
              {/* Symbole du pouvoir */}
              <circle cx="0" cy="20" r="5" fill="none" 
                className={cn("stroke-current opacity-30", isRed ? "text-primary" : "text-accent")} 
                strokeWidth="1" />
              <text 
                x="0" 
                y="23" 
                textAnchor="middle" 
                fontSize="8" 
                className={cn(
                  "fill-current opacity-50",
                  isRed ? "text-primary" : "text-accent"
                )}
              >
                {suitSymbols[suit]}
              </text>
              
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
              {/* Coiffe de la reine */}
              <path 
                d="M-12,-22 Q0,-28 12,-22 L12,-15 Q0,-20 -12,-15 Z" 
                className={cn(
                  "fill-current opacity-30",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              <circle cx="0" cy="-25" r="3" className={cn("fill-current opacity-50", isRed ? "text-primary" : "text-accent")} />
              
              {/* Visage avec élégance */}
              <circle 
                cx="0" 
                cy="-5" 
                r="8" 
                className={cn(
                  "fill-current opacity-15",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              
              {/* Robe élaborée */}
              <path
                d="M-15,5 Q-10,0 -5,5 L-8,35 L8,35 L5,5 Q10,0 15,5"
                fill="none"
                className={cn(
                  "stroke-current opacity-40",
                  isRed ? "text-primary" : "text-accent"
                )}
                strokeWidth="1.5"
              />
              
              {/* Collier */}
              <ellipse cx="0" cy="10" rx="8" ry="3" fill="none" 
                className={cn("stroke-current opacity-30", isRed ? "text-primary" : "text-accent")} 
                strokeWidth="1" />
              
              {/* Fleur décorative */}
              <g transform="translate(0, 20)">
                <circle cx="0" cy="0" r="2" className={cn("fill-current opacity-20", isRed ? "text-primary" : "text-accent")} />
                <circle cx="-4" cy="-2" r="2" className={cn("fill-current opacity-15", isRed ? "text-primary" : "text-accent")} />
                <circle cx="4" cy="-2" r="2" className={cn("fill-current opacity-15", isRed ? "text-primary" : "text-accent")} />
                <circle cx="-4" cy="2" r="2" className={cn("fill-current opacity-15", isRed ? "text-primary" : "text-accent")} />
                <circle cx="4" cy="2" r="2" className={cn("fill-current opacity-15", isRed ? "text-primary" : "text-accent")} />
              </g>
              
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
              {/* Chapeau du valet */}
              <path 
                d="M-10,-20 L-8,-25 Q0,-28 8,-25 L10,-20 L5,-15 L-5,-15 Z" 
                className={cn(
                  "fill-current opacity-30",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              <circle cx="7" cy="-22" r="2" className={cn("fill-current opacity-40", isRed ? "text-primary" : "text-accent")} />
              
              {/* Visage jeune */}
              <circle 
                cx="0" 
                cy="-5" 
                r="8" 
                className={cn(
                  "fill-current opacity-15",
                  isRed ? "text-primary" : "text-accent"
                )}
              />
              
              {/* Tunique avec détails */}
              <path
                d="M-12,5 L-10,0 L-8,5 L-10,35 L10,35 L8,5 L10,0 L12,5"
                fill="none"
                className={cn(
                  "stroke-current opacity-40",
                  isRed ? "text-primary" : "text-accent"
                )}
                strokeWidth="1.5"
              />
              
              {/* Ceinture */}
              <rect x="-10" y="15" width="20" height="3" 
                className={cn("fill-current opacity-20", isRed ? "text-primary" : "text-accent")} />
              
              {/* Épée stylisée */}
              <g transform="translate(15, 10) rotate(45)">
                <rect x="-1" y="0" width="2" height="15" className={cn("fill-current opacity-30", isRed ? "text-primary" : "text-accent")} />
                <rect x="-3" y="-2" width="6" height="3" className={cn("fill-current opacity-40", isRed ? "text-primary" : "text-accent")} />
              </g>
              
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
        {/* Fond de carte avec texture et patterns */}
        <defs>
          {/* Pattern de texture */}
          <pattern id={`cardTexture-${suit}-${rank}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" className="fill-card" />
            <rect width="2" height="2" className="fill-card/95" />
          </pattern>
          
          {/* Gradient pour profondeur */}
          <linearGradient id={`cardGradient-${suit}-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="text-card/90" stopColor="currentColor" />
            <stop offset="50%" className="text-card" stopColor="currentColor" />
            <stop offset="100%" className="text-card/80" stopColor="currentColor" />
          </linearGradient>
          
          {/* Pattern décoratif pour les bordures */}
          <pattern id={`borderPattern-${suit}-${rank}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" className={cn("fill-current opacity-20", isRed ? "text-primary" : "text-accent")} />
            <circle cx="8" cy="8" r="1" className={cn("fill-current opacity-20", isRed ? "text-primary" : "text-accent")} />
          </pattern>
          
          {/* Ombre portée */}
          <filter id={`cardShadow-${suit}-${rank}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="1" dy="2" result="offsetblur"/>
            <feFlood floodColor="#000000" floodOpacity="0.15"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Ombre de carte */}
        <rect
          x="1"
          y="2"
          width="98"
          height="138"
          rx="8"
          className="fill-black/10"
        />
        
        {/* Carte principale avec gradient */}
        <rect
          x="0"
          y="0"
          width="100"
          height="140"
          rx="8"
          fill={`url(#cardGradient-${suit}-${rank})`}
          className="stroke-border"
          strokeWidth="1"
          filter={`url(#cardShadow-${suit}-${rank})`}
        />
        
        {/* Bordure décorative extérieure */}
        <rect
          x="2"
          y="2"
          width="96"
          height="136"
          rx="7"
          fill="none"
          className={cn(
            "stroke-current opacity-40",
            isRed ? "text-primary" : "text-accent"
          )}
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        
        {/* Bordure intérieure avec pattern */}
        <rect
          x="4"
          y="4"
          width="92"
          height="132"
          rx="6"
          fill={`url(#borderPattern-${suit}-${rank})`}
          className={cn(
            "stroke-current opacity-30",
            isRed ? "text-primary" : "text-accent"
          )}
          strokeWidth="0.5"
        />
        
        {/* Motifs décoratifs aux coins */}
        <g className="opacity-10">
          <path d="M10,10 L25,10 L25,8 L10,8 Z M10,10 L10,25 L8,25 L8,10 Z" 
            className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
          <path d="M75,10 L90,10 L90,8 L75,8 Z M90,10 L90,25 L92,25 L92,10 Z" 
            className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
          <path d="M10,130 L25,130 L25,132 L10,132 Z M10,130 L10,115 L8,115 L8,130 Z" 
            className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
          <path d="M75,130 L90,130 L90,132 L75,132 Z M90,130 L90,115 L92,115 L92,130 Z" 
            className={cn("fill-current", isRed ? "text-primary" : "text-accent")} />
        </g>

        {/* Coins supérieur gauche et inférieur droit */}
        <g>
          {/* Coin supérieur gauche avec fond décoratif */}
          <g>
            <rect x="5" y="12" width="20" height="25" rx="3" 
              className={cn("fill-current opacity-5", isRed ? "text-primary" : "text-accent")} />
            <text 
              x="10" 
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
              x="10" 
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
          
          {/* Coin inférieur droit (inversé) avec fond décoratif */}
          <g transform="rotate(180, 50, 70)">
            <rect x="5" y="12" width="20" height="25" rx="3" 
              className={cn("fill-current opacity-5", isRed ? "text-primary" : "text-accent")} />
            <text 
              x="10" 
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
              x="10" 
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
        <defs>
          {/* Pattern répétitif pour le fond */}
          <pattern id="cardBackPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" className="fill-primary" />
            <circle cx="10" cy="10" r="8" className="fill-primary/90" />
            <circle cx="10" cy="10" r="6" className="fill-primary/80" />
            <circle cx="10" cy="10" r="4" className="fill-secondary/20" />
            <rect x="9" y="2" width="2" height="16" className="fill-secondary/30" />
            <rect x="2" y="9" width="16" height="2" className="fill-secondary/30" />
          </pattern>
          
          {/* Gradient pour bordure */}
          <linearGradient id="backBorderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="text-secondary" stopColor="currentColor" />
            <stop offset="50%" className="text-secondary/80" stopColor="currentColor" />
            <stop offset="100%" className="text-secondary" stopColor="currentColor" />
          </linearGradient>
        </defs>
        
        {/* Bordure extérieure */}
        <rect x="0" y="0" width="100" height="140" rx="8" fill="url(#backBorderGradient)" />
        
        {/* Fond avec pattern */}
        <rect x="4" y="4" width="92" height="132" rx="6" fill="url(#cardBackPattern)" />
        
        {/* Cadre intérieur décoratif */}
        <rect x="8" y="8" width="84" height="124" rx="5" fill="none" 
          className="stroke-secondary/50" strokeWidth="1" strokeDasharray="2 1" />
        
        {/* Motif central élaboré */}
        <g transform="translate(50, 70)">
          {/* Étoile à 8 branches */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
            <g key={angle} transform={`rotate(${angle})`}>
              <path d="M0,0 L0,-30 L2,-25 L0,-20 L-2,-25 Z" className="fill-secondary/60" />
            </g>
          ))}
          
          {/* Cercles concentriques */}
          <circle r="30" fill="none" className="stroke-secondary" strokeWidth="2" />
          <circle r="25" fill="none" className="stroke-secondary/80" strokeWidth="1" />
          <circle r="20" fill="none" className="stroke-secondary/60" strokeWidth="1" />
          <circle r="15" fill="none" className="stroke-secondary/40" strokeWidth="0.5" />
          
          {/* Médaillon central */}
          <circle r="12" className="fill-primary" />
          <circle r="10" className="fill-secondary/20" />
          
          <text 
            x="0" 
            y="5" 
            textAnchor="middle" 
            fontSize="14" 
            className="fill-secondary font-bold"
          >
            241
          </text>
        </g>
        
        {/* Ornements aux coins */}
        {[[10, 10], [90, 10], [10, 130], [90, 130]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x}, ${y})`}>
            <circle r="6" className="fill-secondary" />
            <circle r="4" className="fill-primary" />
            <circle r="2" className="fill-secondary/50" />
          </g>
        ))}
        
        {/* Fioritures décoratives sur les bords */}
        <g className="opacity-30">
          <path d="M20,5 Q30,10 40,5 M60,5 Q70,10 80,5" className="stroke-secondary" strokeWidth="0.5" fill="none" />
          <path d="M20,135 Q30,130 40,135 M60,135 Q70,130 80,135" className="stroke-secondary" strokeWidth="0.5" fill="none" />
          <path d="M5,30 Q10,40 5,50 M5,90 Q10,100 5,110" className="stroke-secondary" strokeWidth="0.5" fill="none" />
          <path d="M95,30 Q90,40 95,50 M95,90 Q90,100 95,110" className="stroke-secondary" strokeWidth="0.5" fill="none" />
        </g>
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