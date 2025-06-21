"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GarameCard } from "@/lib/game-engine/games/garame/GarameState";

export type CardState = 
  | 'hidden'      // État initial (dos visible)
  | 'dealing'     // Animation de distribution
  | 'in-hand'     // Dans la main du joueur
  | 'playable'    // Peut être jouée (surbrillance)
  | 'disabled'    // Ne peut pas être jouée (grisée)
  | 'selected'    // Sélectionnée par le joueur
  | 'playing'     // Animation de jeu vers la table
  | 'played'      // Jouée sur la table
  | 'winning';    // Carte gagnante (effet spécial)

interface EnhancedPlayingCardProps {
  card?: GarameCard;
  suit?: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank?: string | number;
  state: CardState;
  onClick?: () => void;
  position?: { x: number; y: number }; // Position absolue pour animations
  size?: 'sm' | 'md' | 'lg';
  delay?: number; // Délai pour animations en séquence
  className?: string;
}

// Composant pour le dos de carte
function CardBack({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-12',
    md: 'w-10 h-14', 
    lg: 'w-16 h-24'
  };

  return (
    <div className={cn(
      "rounded-lg shadow-md border-2 border-border",
      "bg-gradient-to-br from-chart-3 to-chart-3/80",
      "flex items-center justify-center",
      sizeClasses[size],
      className
    )}>
      <div className="text-white text-xl font-bold opacity-50">K</div>
    </div>
  );
}

export function EnhancedPlayingCard({
  card,
  suit,
  rank,
  state,
  onClick,
  position,
  size = 'md',
  delay = 0,
  className
}: EnhancedPlayingCardProps) {
  
  // Utiliser les propriétés de la carte si disponible
  const cardSuit = card?.suit || suit;
  const cardRank = card?.rank || rank;

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

  // Animations selon l'état - utilise les variables CSS existantes
  const getAnimationVariants = () => ({
    hidden: {
      scale: 0,
      rotateY: 180,
      opacity: 0
    },
    dealing: {
      scale: 1,
      rotateY: 180,
      opacity: 1,
      transition: {
        delay,
        duration: 0.3, // var(--animation-normal)
        ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuad
      }
    },
    'in-hand': {
      scale: 1,
      rotateY: 0,
      opacity: 1,
      transition: {
        delay: delay + 0.2,
        duration: 0.4,
        ease: [0.42, 0, 0.58, 1] // easeInOut
      }
    },
    playable: {
      scale: 1.05,
      y: -8,
      boxShadow: "0 10px 25px hsl(var(--primary) / 0.3)",
      transition: {
        duration: 0.15, // var(--animation-fast)
        ease: [0.25, 0.46, 0.45, 0.94] // easeOut
      }
    },
    disabled: {
      scale: 1,
      opacity: 0.4,
      filter: "grayscale(1)"
    },
    selected: {
      scale: 1.1,
      y: -16,
      rotate: 2,
      boxShadow: "0 15px 35px hsl(var(--primary) / 0.4)",
      borderColor: "hsl(var(--primary))",
      borderWidth: "2px",
      transition: {
        duration: 0.15, // var(--animation-fast)
        ease: [0.25, 0.46, 0.45, 0.94] // easeOut
      }
    },
    playing: {
      scale: 0.9,
      x: position?.x || 0,
      y: position?.y || 0,
      rotate: Math.random() * 20 - 10, // Rotation aléatoire
      transition: {
        duration: 0.6,
        ease: [0.42, 0, 0.58, 1] // easeInOut
      }
    },
    played: {
      scale: 0.9,
      rotate: Math.random() * 20 - 10
    },
    winning: {
      scale: 1.1,
      boxShadow: "0 0 30px hsl(var(--chart-5))",
      borderColor: "hsl(var(--chart-5))",
      borderWidth: "3px",
      transition: {
        duration: 0.3,
        repeat: 3,
        repeatType: "reverse" as const
      }
    }
  });

  const cardSizeClasses = {
    sm: "w-8 h-12 text-xs",  // Utilise les variables CSS existantes
    md: "w-10 h-14 text-sm",
    lg: "w-16 h-24 text-base"
  };

  return (
    <motion.div
      className={cn(
        "relative cursor-pointer select-none",
        cardSizeClasses[size],
        {
          "cursor-not-allowed": state === 'disabled',
          "cursor-pointer": state === 'playable' || state === 'in-hand',
        },
        className
      )}
      variants={getAnimationVariants() as any}
      initial="hidden"
      animate={state}
      whileHover={state === 'playable' ? "playable" : undefined}
      whileTap={state === 'playable' ? { scale: 0.95 } : undefined}
      onClick={state === 'playable' || state === 'in-hand' ? onClick : undefined}
    >
      <AnimatePresence mode="wait">
        {(state === 'hidden' || state === 'dealing') ? (
          <motion.div
            key="back"
            className="w-full h-full"
            initial={{ rotateY: 0 }}
            exit={{ rotateY: 90 }}
            transition={{ duration: 0.2 }}
          >
            <CardBack className="w-full h-full" size={size} />
          </motion.div>
        ) : (
          <motion.div
            key="front"
            className="w-full h-full"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={cn(
              "w-full h-full border-2 border-border rounded-lg",
              "bg-card shadow-sm flex flex-col justify-between p-1",
              // Effets selon l'état
              state === 'playable' && "ring-2 ring-primary/20",
              state === 'selected' && "ring-2 ring-primary",
              state === 'disabled' && "opacity-50 grayscale",
              state === 'winning' && "ring-4 ring-chart-5 ring-opacity-60"
            )}>
              {cardSuit && cardRank && (
                <>
                  {/* Coin supérieur gauche */}
                  <div className={cn("flex flex-col items-center leading-none", suitColors[cardSuit])}>
                    <div className="font-bold">{cardRank}</div>
                    <div className="text-xs">{suitSymbols[cardSuit]}</div>
                  </div>

                  {/* Symbole central */}
                  <div className={cn("flex-1 flex items-center justify-center", suitColors[cardSuit])}>
                    <div className={cn(
                      "font-bold",
                      size === 'sm' && "text-lg",
                      size === 'md' && "text-2xl", 
                      size === 'lg' && "text-4xl"
                    )}>
                      {suitSymbols[cardSuit]}
                    </div>
                  </div>

                  {/* Coin inférieur droit (inversé) */}
                  <div className={cn("flex flex-col items-center leading-none rotate-180", suitColors[cardSuit])}>
                    <div className="font-bold">{cardRank}</div>
                    <div className="text-xs">{suitSymbols[cardSuit]}</div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicateur spécial pour cartes de 3 (Koras) */}
      {cardRank === 3 && state !== 'hidden' && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-chart-5 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.5, type: "spring" }}
        >
          <span className="text-xs font-bold text-white">★</span>
        </motion.div>
      )}

      {/* Effet de brillance pour les cartes spéciales */}
      {cardRank === 3 && state === 'playable' && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden"
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
    </motion.div>
  );
}