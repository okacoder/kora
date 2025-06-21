/**
 * Composant Leaderboard - Affiche le classement des joueurs
 * Supporte différents modes d'affichage et filtres
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EloBadge, EloChange } from "./elo-badge";
import { EloRating, getRankFromRating, ELO_RANKS } from "@/lib/elo/elo-system";
import { IconTrophy, IconMedal, IconSearch, IconFilter, IconUsers, IconCrown } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LeaderboardPlayer {
  id: string;
  name: string;
  avatar?: string;
  eloRating: EloRating;
  previousRating?: number;
  position: number;
  previousPosition?: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  players: LeaderboardPlayer[];
  title?: string;
  gameType?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  maxItems?: number;
  className?: string;
}

interface LeaderboardItemProps {
  player: LeaderboardPlayer;
  index: number;
  showChange?: boolean;
}

interface LeaderboardStatsProps {
  players: LeaderboardPlayer[];
}

export function Leaderboard({ 
  players,
  title = "Classement", 
  gameType = "Garame",
  showSearch = true,
  showFilters = true,
  maxItems = 50,
  className 
}: LeaderboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"rating" | "winRate" | "gamesPlayed">("rating");
  
  // Filtrage et tri
  const filteredPlayers = players
    .filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRank = rankFilter === "all" || player.eloRating.rank.tier === rankFilter;
      return matchesSearch && matchesRank;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.eloRating.rating - a.eloRating.rating;
        case "winRate":
          return b.eloRating.winRate - a.eloRating.winRate;
        case "gamesPlayed":
          return b.eloRating.gamesPlayed - a.eloRating.gamesPlayed;
        default:
          return b.eloRating.rating - a.eloRating.rating;
      }
    })
    .slice(0, maxItems);
  
  // Calculer les positions après tri
  const playersWithPositions = filteredPlayers.map((player, index) => ({
    ...player,
    position: index + 1
  }));
  
  const uniqueRanks = Array.from(new Set(ELO_RANKS.map(rank => rank.tier)));
  
  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <IconTrophy className="h-5 w-5 text-chart-5" />
            {title} - {gameType}
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <IconUsers className="h-3 w-3" />
            {players.length} joueurs
          </Badge>
        </div>
        
        {(showSearch || showFilters) && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {showSearch && (
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un joueur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
            
            {showFilters && (
              <div className="flex gap-2">
                <Select value={rankFilter} onValueChange={setRankFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Rang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rangs</SelectItem>
                    {uniqueRanks.map(tier => (
                      <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                    ))}\n                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="winRate">Taux de victoire</SelectItem>
                    <SelectItem value="gamesPlayed">Parties jouées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {playersWithPositions.map((player, index) => (
            <LeaderboardItem 
              key={player.id} 
              player={player} 
              index={index}
              showChange={true}
            />
          ))}
          
          {playersWithPositions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun joueur trouvé
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function LeaderboardItem({ player, index, showChange = false }: LeaderboardItemProps) {
  const positionChange = player.previousPosition ? player.previousPosition - player.position : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border transition-colors",
        player.isCurrentUser 
          ? "bg-primary/10 border-primary/30" 
          : "bg-muted/20 border-border/50 hover:bg-muted/30"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Position */}
        <div className="relative">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
            player.position === 1 && "bg-chart-5 text-white",
            player.position === 2 && "bg-muted-foreground text-white", 
            player.position === 3 && "bg-chart-2 text-white",
            player.position > 3 && "bg-muted text-muted-foreground"
          )}>
            {player.position <= 3 ? (
              <IconMedal className="h-4 w-4" />
            ) : (
              player.position
            )}
          </div>
          
          {/* Changement de position */}
          {showChange && positionChange !== 0 && (
            <div className={cn(
              "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold",
              positionChange > 0 ? "bg-chart-4 text-white" : "bg-chart-1 text-white"
            )}>
              {positionChange > 0 ? "↑" : "↓"}
            </div>
          )}
        </div>
        
        {/* Avatar et nom */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={player.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {player.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-card-foreground">
                {player.name}
              </span>
              {player.isCurrentUser && (
                <Badge variant="secondary" className="text-xs">
                  Vous
                </Badge>
              )}
              {player.position === 1 && (
                <IconCrown className="h-4 w-4 text-chart-5" />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {player.eloRating.gamesPlayed} parties • {player.eloRating.winRate}% victoires
            </div>
          </div>
        </div>
      </div>
      
      {/* Rating et badge */}
      <div className="flex items-center gap-4">
        {showChange && player.previousRating && (
          <EloChange 
            oldRating={player.previousRating}
            newRating={player.eloRating.rating}
            size="sm"
          />
        )}
        <EloBadge 
          rating={player.eloRating.rating}
          size="md"
          showRating={true}
        />
      </div>
    </motion.div>
  );
}

export function LeaderboardStats({ players }: LeaderboardStatsProps) {
  const totalPlayers = players.length;
  const averageRating = Math.round(
    players.reduce((sum, p) => sum + p.eloRating.rating, 0) / totalPlayers
  );
  const highestRating = Math.max(...players.map(p => p.eloRating.rating));
  const mostActivePlayer = players.reduce((prev, current) => 
    prev.eloRating.gamesPlayed > current.eloRating.gamesPlayed ? prev : current
  );
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-card border-border">
        <CardContent className="pt-4 text-center">
          <div className="text-2xl font-bold text-foreground">{totalPlayers}</div>
          <div className="text-sm text-muted-foreground">Joueurs actifs</div>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-border">
        <CardContent className="pt-4 text-center">
          <div className="text-2xl font-bold text-foreground">{averageRating}</div>
          <div className="text-sm text-muted-foreground">Rating moyen</div>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-border">
        <CardContent className="pt-4 text-center">
          <div className="text-2xl font-bold text-chart-5">{highestRating}</div>
          <div className="text-sm text-muted-foreground">Meilleur score</div>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-border">
        <CardContent className="pt-4 text-center">
          <div className="text-2xl font-bold text-foreground">{mostActivePlayer.eloRating.gamesPlayed}</div>
          <div className="text-sm text-muted-foreground">Record de parties</div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CompactLeaderboard({ 
  players, 
  maxItems = 5,
  className 
}: { 
  players: LeaderboardPlayer[];
  maxItems?: number;
  className?: string;
}) {
  const topPlayers = players
    .sort((a, b) => b.eloRating.rating - a.eloRating.rating)
    .slice(0, maxItems);
  
  return (
    <div className={cn("space-y-2", className)}>
      {topPlayers.map((player, index) => (
        <div 
          key={player.id}
          className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
              index === 0 && "bg-chart-5 text-white",
              index === 1 && "bg-muted-foreground text-white",
              index === 2 && "bg-chart-2 text-white",
              index > 2 && "bg-muted text-muted-foreground"
            )}>
              {index + 1}
            </div>
            <span className="font-medium text-card-foreground">{player.name}</span>
          </div>
          <EloBadge rating={player.eloRating.rating} size="sm" />
        </div>
      ))}
    </div>
  );
}