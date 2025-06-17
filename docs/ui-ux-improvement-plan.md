# LaMap241 UI/UX Improvement Plan

## Executive Summary
This document outlines a comprehensive UI/UX improvement plan for the LaMap241 gaming platform, focusing on mobile-first design while ensuring excellent desktop experience. The improvements address space management, visual hierarchy, game-specific UI patterns, and responsive design issues.

## Current Issues
1. **Poor mobile layout** - Elements are too large, wasting screen space
2. **Inefficient space management** - Unnecessary padding and oversized components
3. **Weak visual hierarchy** - Important elements don't stand out
4. **Generic UI** - Doesn't feel like a gaming platform
5. **Responsive design gaps** - Not optimized for different screen sizes

## Design Philosophy
- **Mobile-first**: Optimize for touch interfaces and small screens
- **Game-centric**: Use gaming UI patterns and visual metaphors
- **Efficient**: Maximize content visibility, minimize scrolling
- **Engaging**: Add subtle animations and game-like feedback
- **Accessible**: Maintain readability and usability across devices

---

## 1. Global Styles Enhancement

### File: `app/globals.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* Keep existing color variables... */
  
  /* Add new game-specific variables */
  --game-card-width: 32px;
  --game-card-height: 45px;
  --game-card-width-md: 40px;
  --game-card-height-md: 56px;
  --game-card-width-lg: 60px;
  --game-card-height-lg: 84px;
  
  /* Animation durations */
  --animation-fast: 150ms;
  --animation-normal: 300ms;
  --animation-slow: 500ms;
  
  /* Z-index layers */
  --z-base: 0;
  --z-dropdown: 50;
  --z-sticky: 100;
  --z-fixed: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-notification: 500;
}

@layer base {
  /* Existing base styles... */
  
  /* Add viewport height fixes for mobile */
  .h-viewport {
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height */
  }
  
  .min-h-viewport {
    min-height: 100vh;
    min-height: 100dvh;
  }
  
  /* Safe area insets for mobile */
  .safe-top {
    padding-top: env(safe-area-inset-top);
  }
  
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

@layer components {
  /* Game-specific component styles */
  .game-container {
    @apply h-viewport flex flex-col overflow-hidden;
  }
  
  .game-header {
    @apply flex-shrink-0 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60;
  }
  
  .game-content {
    @apply flex-1 overflow-y-auto;
  }
  
  .game-list-item {
    @apply flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors active:scale-[0.98];
  }
  
  /* Card animations */
  .card-hover {
    @apply transition-all duration-[var(--animation-fast)] hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md;
  }
  
  /* Button enhancements for gaming */
  .btn-game-primary {
    @apply bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-[var(--animation-fast)];
    @apply relative overflow-hidden;
  }
  
  .btn-game-primary::after {
    content: '';
    @apply absolute inset-0 bg-white/20 translate-y-full transition-transform duration-[var(--animation-normal)];
  }
  
  .btn-game-primary:hover::after {
    @apply translate-y-0;
  }
  
  /* Chip/token styles for currency display */
  .currency-chip {
    @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full;
    @apply bg-gradient-to-br from-secondary/90 to-secondary;
    @apply text-secondary-foreground font-semibold text-sm;
    @apply shadow-md border border-secondary/20;
  }
  
  /* Loading states */
  .skeleton-game {
    @apply animate-pulse bg-muted/50 rounded;
  }
  
  /* Mobile tap highlights */
  .tap-highlight-none {
    -webkit-tap-highlight-color: transparent;
  }
}

@layer utilities {
  /* Utility classes for common game UI patterns */
  .text-game-xs {
    @apply text-[10px] leading-3;
  }
  
  .text-game-sm {
    @apply text-xs leading-4;
  }
  
  .text-game-base {
    @apply text-sm leading-5;
  }
  
  .text-game-lg {
    @apply text-base leading-6;
  }
  
  /* Responsive padding utilities */
  .px-game {
    @apply px-3 sm:px-4 lg:px-6;
  }
  
  .py-game {
    @apply py-2 sm:py-3 lg:py-4;
  }
}
```

---

## 2. Game Page Redesign

### File: `app/(authenticated)/games/[gameLabel]/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameCard } from "@/components/game-card";
import { CurrencyDisplay } from "@/components/currency-display";
import { GameListItem } from "@/components/game-list-item";
import { QuickStakeSelector } from "@/components/quick-stake-selector";
import { 
  IconCoin, 
  IconUsers, 
  IconPlus,
  IconCards,
  IconClock,
  IconAlertCircle,
  IconLoader2,
  IconRefresh
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { IGameRoom } from "@/lib/garame/domain/interfaces";
import { useGarameServices } from "@/lib/garame/infrastructure/garame-provider";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const QUICK_STAKES = [50, 100, 200, 500, 1000];

export default function GamePage() {
  const router = useRouter();
  const { gameLabel } = useParams<{ gameLabel: string }>();
  const { gameService, paymentService } = useGarameServices();
  const [selectedTab, setSelectedTab] = useState("join");
  const [selectedStake, setSelectedStake] = useState<number | null>(null);
  const [customStake, setCustomStake] = useState("");
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userKoras, setUserKoras] = useState<number>(0);
  const [availableGames, setAvailableGames] = useState<IGameRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGames, setLoadingGames] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load user balance
  useEffect(() => {
    const loadUserBalance = async () => {
      try {
        const balance = await paymentService.getBalance();
        setUserBalance(balance);
        setUserKoras(Math.floor(balance / 10));
      } catch (error) {
        console.error("Erreur lors du chargement du solde:", error);
        toast.error("Impossible de charger votre solde");
      }
    };
    loadUserBalance();
  }, [paymentService]);

  // Load available games
  useEffect(() => {
    loadAvailableGames();
    const interval = setInterval(loadAvailableGames, 10000); // Reduced frequency
    return () => clearInterval(interval);
  }, []);

  const loadAvailableGames = async () => {
    try {
      const games = await gameService.getAvailableGames();
      setAvailableGames(games);
    } catch (error) {
      console.error("Erreur lors du chargement des parties:", error);
    } finally {
      setLoadingGames(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAvailableGames();
  };

  const handleCreateGame = async () => {
    const stake = customStake ? parseInt(customStake) : selectedStake;
    
    if (!stake || stake < 50) {
      toast.error("La mise minimum est de 50 koras");
      return;
    }

    if (stake * 10 > userBalance) {
      toast.error("Solde insuffisant");
      return;
    }

    setLoading(true);
    try {
      const gameRoom = await gameService.createGame(gameLabel, stake * 10);
      toast.success("Partie créée avec succès!");
      router.push(routes.gameRoom(gameLabel, gameRoom.id));
    } catch (error) {
      toast.error("Erreur lors de la création de la partie");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (roomId: string) => {
    setLoading(true);
    try {
      await gameService.joinGame(roomId);
      toast.success("Vous avez rejoint la partie!");
      router.push(routes.gameRoom(gameLabel, roomId));
    } catch (error) {
      toast.error("Impossible de rejoindre cette partie");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-container">
      {/* Compact Header */}
      <header className="game-header safe-top">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-bold">Garame</h1>
            <p className="text-game-xs text-muted-foreground">Jeu de cartes</p>
          </div>
          
          <CurrencyDisplay 
            koras={userKoras} 
            fcfa={userBalance} 
            size="compact"
            className="ml-4"
          />
        </div>
      </header>

      {/* Game Content */}
      <div className="game-content px-game">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mt-3 mb-2">
            <TabsTrigger value="join" className="text-game-sm">
              Rejoindre
            </TabsTrigger>
            <TabsTrigger value="create" className="text-game-sm">
              Créer
            </TabsTrigger>
          </TabsList>

          {/* Join Tab */}
          <TabsContent value="join" className="flex-1 mt-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-game-sm text-muted-foreground">
                {availableGames.length} partie{availableGames.length > 1 ? 's' : ''} disponible{availableGames.length > 1 ? 's' : ''}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-7 px-2 text-game-xs"
              >
                <IconRefresh className={cn("h-3 w-3", refreshing && "animate-spin")} />
                <span className="ml-1.5">Actualiser</span>
              </Button>
            </div>

            {loadingGames ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-game h-16 rounded-lg" />
                ))}
              </div>
            ) : availableGames.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <IconCards className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-game-sm text-muted-foreground text-center">
                    Aucune partie disponible
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setSelectedTab("create")}
                  >
                    Créer une partie
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-1.5">
                {availableGames.map((game) => (
                  <GameListItem
                    key={game.id}
                    game={game}
                    onJoin={() => handleJoinGame(game.id)}
                    disabled={loading}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create" className="flex-1 mt-0 space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nouvelle partie</CardTitle>
                <CardDescription className="text-game-xs">
                  Définissez votre mise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <QuickStakeSelector
                  stakes={QUICK_STAKES}
                  selectedStake={selectedStake}
                  onSelectStake={setSelectedStake}
                  userBalance={userBalance}
                />

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Mise personnalisée"
                      value={customStake}
                      onChange={(e) => {
                        setCustomStake(e.target.value);
                        setSelectedStake(null);
                      }}
                      min="50"
                      max={Math.floor(userBalance / 10)}
                      className="h-9 text-game-sm"
                    />
                  </div>
                  <Button
                    onClick={handleCreateGame}
                    disabled={(!selectedStake && !customStake) || loading}
                    className="btn-game-primary h-9 px-4"
                  >
                    {loading ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <IconPlus className="h-4 w-4 mr-1.5" />
                        Créer
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-muted/30 rounded-lg p-2.5">
                  <div className="flex gap-2">
                    <IconAlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-game-xs text-muted-foreground space-y-0.5">
                      <p>• Mise bloquée jusqu'à la fin</p>
                      <p>• Gagnant: 90% du pot total</p>
                      <p>• Commission: 10%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Safe area for bottom navigation */}
      <div className="safe-bottom" />
    </div>
  );
}
```

---

## 3. New Components

### File: `components/currency-display.tsx`

```typescript
import { IconCoin } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  koras: number;
  fcfa: number;
  size?: "compact" | "normal" | "large";
  showIcon?: boolean;
  className?: string;
}

export function CurrencyDisplay({ 
  koras, 
  fcfa, 
  size = "normal", 
  showIcon = true,
  className 
}: CurrencyDisplayProps) {
  const sizeClasses = {
    compact: "text-game-xs",
    normal: "text-game-sm",
    large: "text-game-base"
  };

  return (
    <div className={cn("currency-chip", sizeClasses[size], className)}>
      {showIcon && <IconCoin className="h-3.5 w-3.5" />}
      <div className="flex flex-col">
        <span className="font-bold">{koras.toLocaleString()}</span>
        <span className="opacity-70 text-[0.7em]">
          {fcfa.toLocaleString()} FCFA
        </span>
      </div>
    </div>
  );
}
```

### File: `components/game-list-item.tsx`

```typescript
import { IGameRoom } from "@/lib/garame/domain/interfaces";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "@/components/game-card";
import { IconUsers, IconClock, IconCoin } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface GameListItemProps {
  game: IGameRoom;
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
```

### File: `components/quick-stake-selector.tsx`

```typescript
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickStakeSelectorProps {
  stakes: number[];
  selectedStake: number | null;
  onSelectStake: (stake: number) => void;
  userBalance: number;
  className?: string;
}

export function QuickStakeSelector({
  stakes,
  selectedStake,
  onSelectStake,
  userBalance,
  className
}: QuickStakeSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-game-xs text-muted-foreground font-medium">Mise rapide</p>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        {stakes.map((stake) => {
          const canAfford = stake * 10 <= userBalance;
          const isSelected = selectedStake === stake;
          
          return (
            <Button
              key={stake}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectStake(stake)}
              disabled={!canAfford}
              className={cn(
                "h-8 text-game-xs font-medium",
                isSelected && "ring-2 ring-offset-2 ring-primary"
              )}
            >
              {stake}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
```

### File: `components/game-card.tsx` (Update)

Add size variants to the existing component:

```typescript
interface GameCardProps {
  suit?: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank?: string;
  size?: 'small' | 'medium' | 'large';
  faceDown?: boolean;
  className?: string;
}

export function GameCard({ 
  suit = 'hearts', 
  rank = 'A', 
  size = 'medium',
  faceDown = false,
  className 
}: GameCardProps) {
  const sizes = {
    small: { width: 32, height: 45 },
    medium: { width: 50, height: 70 },
    large: { width: 70, height: 98 }
  };

  const { width, height } = sizes[size];

  if (faceDown) {
    return <CardBack width={width} height={height} className={className} />;
  }

  return <PlayingCard suit={suit} rank={rank} width={width} height={height} className={className} />;
}
```

---

## 4. Game Room Page Improvements

### File: `app/(authenticated)/games/[gameLabel]/[roomId]/page.tsx`

Key improvements for the game room:

```typescript
// Add mobile-optimized layout structure
return (
  <div className="game-container">
    {/* Game header with players and pot */}
    <header className="game-header safe-top">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="h-7 w-7 p-0"
          >
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-game-base font-bold">Partie #{roomId.slice(-6)}</h1>
            <p className="text-game-xs text-muted-foreground">
              Pot: {gameRoom.totalPot} koras
            </p>
          </div>
        </div>
        
        <Badge 
          variant={gameRoom.status === 'in_progress' ? 'default' : 'secondary'}
          className="text-game-xs"
        >
          {gameRoom.status === 'waiting' && 'En attente'}
          {gameRoom.status === 'in_progress' && 'En cours'}
        </Badge>
      </div>
    </header>

    {/* Game area */}
    <div className="flex-1 px-game py-3">
      {/* Player cards area */}
      <div className="flex flex-col gap-3 h-full">
        {/* Opponent area */}
        <div className="flex-1 flex items-start justify-center">
          {opponent && (
            <PlayerArea 
              player={opponent}
              isCurrentPlayer={false}
              gameRoom={gameRoom}
            />
          )}
        </div>

        {/* Game table/center area */}
        <div className="flex-shrink-0 flex items-center justify-center py-4">
          <GameTable gameState={gameState} />
        </div>

        {/* Current player area */}
        <div className="flex-1 flex items-end justify-center">
          {currentPlayer && (
            <PlayerArea 
              player={currentPlayer}
              isCurrentPlayer={true}
              gameRoom={gameRoom}
            />
          )}
        </div>
      </div>
    </div>

    {/* Action bar for mobile */}
    <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur px-game py-3 safe-bottom">
      <div className="flex items-center justify-between">
        <div className="text-game-xs text-muted-foreground">
          {gameState?.currentTurnPlayerId === currentPlayer?.id 
            ? "C'est votre tour" 
            : "Tour de l'adversaire"}
        </div>
        {timer && (
          <Badge variant="outline" className="text-game-xs">
            <IconClock className="h-3 w-3 mr-1" />
            {timer}s
          </Badge>
        )}
      </div>
    </div>
  </div>
);
```

---

## 5. Responsive Breakpoints

### File: `tailwind.config.ts`

Add custom breakpoints optimized for gaming:

```typescript
module.exports = {
  theme: {
    extend: {
      screens: {
        'xs': '475px',      // Large phones
        'sm': '640px',      // Tablets
        'md': '768px',      // Small laptops
        'lg': '1024px',     // Desktop
        'xl': '1280px',     // Large desktop
        '2xl': '1536px',    // Extra large
        // Game-specific breakpoints
        'game-sm': '360px', // Small mobile games
        'game-md': '768px', // Tablet games
        'game-lg': '1024px' // Desktop games
      },
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'float-medium': 'float 6s ease-in-out infinite',
        'float-fast': 'float 4s ease-in-out infinite',
        'card-flip': 'flip 0.6s ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-soft': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        }
      }
    }
  }
}
```

---

## 6. Performance Optimizations

### File: `lib/utils/performance.ts`

```typescript
// Debounce hook for search and filtering
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Intersection observer for lazy loading
export function useLazyLoad(threshold = 0.1) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return { ref, isIntersecting };
}
```

---

## 7. Mobile-Specific Enhancements

### File: `hooks/use-mobile-game.ts`

```typescript
import { useEffect, useState } from 'react';

export function useMobileGame() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      );
    };

    const updateViewportHeight = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight);
    };

    updateOrientation();
    updateViewportHeight();

    window.addEventListener('resize', updateOrientation);
    window.addEventListener('resize', updateViewportHeight);
    window.visualViewport?.addEventListener('resize', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('resize', updateViewportHeight);
      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (error) {
      console.error('Fullscreen request failed:', error);
    }
  };

  return {
    orientation,
    isFullscreen,
    viewportHeight,
    requestFullscreen
  };
}
```

---

## 8. Layout Improvements

### File: `components/auth/layouts.tsx`

Update the authenticated layout for better game experience:

```typescript
export const AuthenticatedLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return;
  }

  // Check if we're in a game route
  const isGameRoute = headers().get('x-pathname')?.includes('/games/');

  return (
    <AuthenticatedProviders>
      {isGameRoute ? (
        // Full-screen game layout
        <div className="h-viewport w-full">
          {children}
        </div>
      ) : (
        // Regular app layout with sidebar
        <>
          <AppSidebar
            user={{ ...session.user, image: session.user.image ?? null }}
            variant="inset"
          />
          <SidebarInset className="bg-background overflow-hidden">
            <SiteHeader />
            <div className="flex-1 relative">
              <div className="absolute py-6 inset-0 overflow-y-scroll @container/main">
                {children}
              </div>
            </div>
          </SidebarInset>
        </>
      )}
    </AuthenticatedProviders>
  );
};
```

---

## Implementation Priority

1. **Phase 1 - Core Fixes (Day 1)**
   - Update global.css with new utilities
   - Implement the redesigned game page
   - Add new components (CurrencyDisplay, GameListItem, QuickStakeSelector)

2. **Phase 2 - Mobile Optimization (Day 2)**
   - Implement viewport height fixes
   - Add mobile-specific hooks
   - Update layout system for game routes

3. **Phase 3 - Enhancements (Day 3)**
   - Add animations and transitions
   - Implement performance optimizations
   - Add game-specific UI patterns

4. **Phase 4 - Testing & Polish (Day 4)**
   - Test on various devices
   - Fix responsive issues
   - Add loading states and error handling

## Success Metrics

- **Page load time**: < 2s on 3G
- **Interaction responsiveness**: < 100ms
- **Layout shift**: CLS < 0.1
- **Mobile usability**: 100% touch targets > 44px
- **Screen efficiency**: No scrolling needed for core actions

## Notes for Implementation

1. Always test on real devices, especially older phones
2. Use Chrome DevTools device emulation for quick checks
3. Ensure all interactive elements have proper touch targets
4. Test with slow network conditions
5. Verify safe area insets on devices with notches
6. Consider adding haptic feedback for mobile actions
7. Test landscape orientation for tablet users
8. Ensure proper keyboard handling for input fields