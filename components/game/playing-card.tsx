"use client";

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { GarameCard } from '@/lib/game-engine/games/garame/GarameState';

interface PlayingCardProps {
  card: GarameCard;
  isPlayable?: boolean;
  isSelected?: boolean;
  isRevealed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export function PlayingCard({
  card,
  isPlayable = true,
  isSelected = false,
  isRevealed = true,
  size = 'md',
  onClick,
  className,
}: PlayingCardProps) {
  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };

  const suitColors = {
    hearts: 'text-red-500',
    diamonds: 'text-red-500',
    clubs: 'text-gray-900',
    spades: 'text-gray-900',
  };

  const sizeClasses = {
    sm: 'w-12 h-16 text-xs',
    md: 'w-16 h-24 text-sm',
    lg: 'w-20 h-28 text-base',
  };

  const cardVariants = {
    hidden: {
      rotateY: 180,
      scale: 0.8,
    },
    visible: {
      rotateY: 0,
      scale: 1,
    },
    hover: {
      y: isPlayable ? -8 : 0,
      scale: isPlayable ? 1.05 : 1,
    },
    tap: {
      scale: isPlayable ? 0.95 : 1,
    },
    selected: {
      y: -12,
      scale: 1.1,
    }
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-lg cursor-pointer select-none',
        'bg-white border-2 border-gray-200 shadow-md',
        'flex flex-col items-center justify-between p-1',
        sizeClasses[size],
        {
          'opacity-50 cursor-not-allowed': !isPlayable,
          'border-blue-400 ring-2 ring-blue-300': isSelected,
          'hover:border-gray-400 hover:shadow-lg': isPlayable && !isSelected,
          'cursor-pointer': isPlayable,
        },
        className
      )}
      variants={cardVariants}
      initial="hidden"
      animate={isSelected ? "selected" : "visible"}
      whileHover={isPlayable ? "hover" : undefined}
      whileTap={isPlayable ? "tap" : undefined}
      onClick={isPlayable ? onClick : undefined}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Face avant de la carte */}
      <motion.div
        className="w-full h-full flex flex-col justify-between"
        style={{
          backfaceVisibility: "hidden",
          transform: isRevealed ? "rotateY(0deg)" : "rotateY(180deg)",
        }}
      >
        {/* Coin supérieur gauche */}
        <div className={cn("flex flex-col items-center leading-none", suitColors[card.suit])}>
          <div className="font-bold">{card.rank}</div>
          <div className="text-xs">{suitSymbols[card.suit]}</div>
        </div>

        {/* Symbole central */}
        <div className={cn("flex-1 flex items-center justify-center", suitColors[card.suit])}>
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold">
            {suitSymbols[card.suit]}
          </div>
        </div>

        {/* Coin inférieur droit (inversé) */}
        <div className={cn("flex flex-col items-center leading-none rotate-180", suitColors[card.suit])}>
          <div className="font-bold">{card.rank}</div>
          <div className="text-xs">{suitSymbols[card.suit]}</div>
        </div>
      </motion.div>

      {/* Face arrière de la carte */}
      {!isRevealed && (
        <motion.div
          className="absolute inset-0 w-full h-full rounded-lg"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg flex items-center justify-center">
            <div className="text-white text-xl font-bold opacity-50">K</div>
          </div>
        </motion.div>
      )}

      {/* Effet de brillance pour les cartes spéciales (3s) */}
      {card.rank === 3 && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: "linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.3) 50%, transparent 70%)",
          }}
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "linear",
          }}
        />
      )}

      {/* Indicateur de carte jouable */}
      {isPlayable && !isSelected && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}

// Composant pour une carte face cachée
export function HiddenCard({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-12 h-16',
    md: 'w-16 h-24',
    lg: 'w-20 h-28',
  };

  return (
    <motion.div
      className={cn(
        'rounded-lg shadow-md',
        'bg-gradient-to-br from-blue-600 to-purple-700',
        'flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-white text-xl font-bold opacity-50">K</div>
    </motion.div>
  );
}

// Composant pour un emplacement de carte vide
export function CardSlot({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-12 h-16',
    md: 'w-16 h-24',
    lg: 'w-20 h-28',
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed border-gray-300',
        'bg-gray-50 flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      <div className="text-gray-400 text-xs">Vide</div>
    </div>
  );
} 