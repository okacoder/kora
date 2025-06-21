/**
 * Composant ELO Badge - Affiche le rang et rating d'un joueur
 * Utilise la palette de couleurs définie dans le système ELO
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EloRating, getRankFromRating } from "@/lib/elo/elo-system";
import { IconTrophy, IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

interface EloBadgeProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showRating?: boolean;
  showProgress?: boolean;
  className?: string;
}

interface EloCardProps {
  eloRating: EloRating;
  showStats?: boolean;
  showProgress?: boolean;
  className?: string;
}

interface RankProgressProps {
  rating: number;
  className?: string;
}

export function EloBadge({ 
  rating, 
  size = "md", 
  showRating = true, 
  showProgress = false,
  className 
}: EloBadgeProps) {
  const rank = getRankFromRating(rating);
  
  const sizeStyles = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        className={cn(
          sizeStyles[size],
          "flex items-center gap-1 font-semibold border",
          // Couleurs spécifiques par rang
          rank.color === "chart-1" && "bg-chart-1/20 text-chart-1 border-chart-1/30",
          rank.color === "chart-2" && "bg-chart-2/20 text-chart-2 border-chart-2/30", 
          rank.color === "chart-3" && "bg-chart-3/20 text-chart-3 border-chart-3/30",
          rank.color === "chart-5" && "bg-chart-5/20 text-chart-5 border-chart-5/30",
          rank.color === "primary" && "bg-primary/20 text-primary border-primary/30",
          rank.color === "muted-foreground" && "bg-muted text-muted-foreground border-muted-foreground/30"
        )}
      >
        <IconTrophy className={iconSizes[size]} />
        {rank.name}
      </Badge>
      
      {showRating && (
        <span className={cn(
          "font-mono font-bold",
          size === "sm" && "text-sm",
          size === "md" && "text-base", 
          size === "lg" && "text-lg"
        )}>
          {rating}
        </span>
      )}
      
      {showProgress && <RankProgress rating={rating} />}
    </div>
  );
}

export function EloCard({ 
  eloRating, 
  showStats = true, 
  showProgress = true,
  className 
}: EloCardProps) {
  return (
    <div className={cn(
      "p-4 bg-card border border-border rounded-lg",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <EloBadge 
          rating={eloRating.rating} 
          size="lg" 
          showRating={true}
        />
        {showProgress && (
          <RankProgress rating={eloRating.rating} />
        )}
      </div>
      
      {showStats && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {eloRating.gamesPlayed}
            </div>
            <div className="text-sm text-muted-foreground">Parties</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-chart-4">
              {eloRating.wins}
            </div>
            <div className="text-sm text-muted-foreground">Victoires</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-foreground">
              {eloRating.winRate}%
            </div>
            <div className="text-sm text-muted-foreground">Taux</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RankProgress({ rating, className }: RankProgressProps) {
  const rank = getRankFromRating(rating);
  
  // Si c'est le rang maximum, on montre 100%
  if (rank.name === "Grand Maître") {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <div className="w-16 h-2 bg-chart-1 rounded-full" />
        <span className="text-chart-1 font-semibold">MAX</span>
      </div>
    );
  }
  
  const rangeSize = rank.maxRating - rank.minRating;
  const currentProgress = rating - rank.minRating;
  const progressPercentage = Math.round((currentProgress / rangeSize) * 100);
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            rank.color === "chart-1" && "bg-chart-1",
            rank.color === "chart-2" && "bg-chart-2",
            rank.color === "chart-3" && "bg-chart-3", 
            rank.color === "chart-5" && "bg-chart-5",
            rank.color === "primary" && "bg-primary",
            rank.color === "muted-foreground" && "bg-muted-foreground"
          )}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground font-medium">
        {progressPercentage}%
      </span>
    </div>
  );
}

interface EloChangeProps {
  oldRating: number;
  newRating: number;
  size?: "sm" | "md" | "lg";
  showArrow?: boolean;
}

export function EloChange({ 
  oldRating, 
  newRating, 
  size = "md", 
  showArrow = true 
}: EloChangeProps) {
  const change = newRating - oldRating;
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  const sizeStyles = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };
  
  if (isNeutral) {
    return (
      <span className={cn(
        "font-mono text-muted-foreground",
        sizeStyles[size]
      )}>
        ±0
      </span>
    );
  }
  
  return (
    <div className={cn(
      "flex items-center gap-1 font-mono font-semibold",
      sizeStyles[size],
      isPositive ? "text-chart-4" : "text-chart-1"
    )}>
      {showArrow && (
        isPositive ? (
          <IconTrendingUp className={iconSizes[size]} />
        ) : (
          <IconTrendingDown className={iconSizes[size]} />
        )
      )}
      <span>
        {isPositive ? "+" : ""}{change}
      </span>
    </div>
  );
}