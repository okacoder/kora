"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { IconCards, IconJoker, IconDice, IconRobot, IconUsers, IconTrophy } from '@tabler/icons-react';
import { TestGameEngine } from '@/components/test-game-engine';
import { motion } from 'framer-motion';
import { EnhancedPlayingCard } from '@/components/game/enhanced-playing-card';
import { games } from '@/lib/games';

const COMING_SOON_GAMES = [
  {
    id: 'poker',
    name: 'Poker',
    description: 'Texas Hold\'em - Bientôt disponible',
    icon: IconJoker,
  },
  {
    id: 'belote',
    name: 'Belote',
    description: 'La belote classique - Bientôt disponible',
    icon: IconCards,
  },
  {
    id: 'rami',
    name: 'Rami',
    description: 'Le Rami traditionnel - Bientôt disponible',
    icon: IconDice,
  }
];

export default function GamesPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto">
        <motion.h1 
          className="text-4xl font-bold text-center mb-8 text-foreground"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Choisissez votre jeu
        </motion.h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => {
            
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-card border border-border rounded-lg hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <IconCards className="size-8 text-primary" />
                      <Badge variant="secondary">
                        {game.minPlayers === game.maxPlayers 
                          ? `${game.minPlayers} joueurs`
                          : `${game.minPlayers}-${game.maxPlayers} joueurs`}
                      </Badge>
                    </div>
                    
                    {/* Card Preview for Garame */}
                    {game.id === 'garame' && (
                      <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded mb-4 flex items-center justify-center">
                        <div className="flex gap-2">
                          <EnhancedPlayingCard suit="hearts" rank="3" state="in-hand" size="lg" />
                          <EnhancedPlayingCard suit="spades" rank="7" state="in-hand" size="lg" />
                          <EnhancedPlayingCard suit="diamonds" rank="10" state="in-hand" size="lg" />
                        </div>
                      </div>
                    )}
                    
                    <CardTitle className="text-xl font-semibold text-card-foreground">{game.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{game.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => router.push(`/games/quick?gameType=${game.id}`)}
                        variant="default"
                        size="sm"
                        className="flex-1"
                      >
                        <IconRobot className="w-4 h-4 mr-2" />
                        VS IA
                      </Button>
                      <Button
                        onClick={() => router.push(`/games/create?gameType=${game.id}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <IconUsers className="w-4 h-4 mr-2" />
                        Multijoueur
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          
          {/* Future games placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-muted/50 border border-border rounded-lg opacity-60">
              <CardHeader>
                <div className="w-full h-32 bg-muted rounded mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground">Bientôt disponible</span>
                </div>
                <CardTitle className="text-xl font-semibold text-muted-foreground">Belote</CardTitle>
                <CardDescription className="text-muted-foreground">À venir...</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>

        {/* Global ELO Leaderboard */}
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
            <IconTrophy className="w-6 h-6 text-chart-5" />
            Classement Global
          </h2>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Top Joueurs Garame</CardTitle>
              <CardDescription>Les meilleurs joueurs de la communauté</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Placeholder for leaderboard - will be implemented in Phase 3 */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-chart-5 text-white">#1</Badge>
                    <span className="font-medium">Champion</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-chart-5">2450 ELO</div>
                    <div className="text-xs text-muted-foreground">Grand Maître</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">#2</Badge>
                    <span className="font-medium">Expert</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">2210 ELO</div>
                    <div className="text-xs text-muted-foreground">Diamant I</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">#3</Badge>
                    <span className="font-medium">Maître</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">1980 ELO</div>
                    <div className="text-xs text-muted-foreground">Platine I</div>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    Voir le classement complet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Coming soon games */}
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Prochainement</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COMING_SOON_GAMES.map((game, index) => {
              const Icon = game.icon;
              
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card className="bg-muted/50 border-border opacity-60">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                        <CardTitle className="text-muted-foreground">{game.name}</CardTitle>
                      </div>
                      <CardDescription>{game.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Test du moteur de jeu - Hidden in production */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div 
            className="mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Test du Moteur de Jeu</h2>
            <TestGameEngine />
          </motion.div>
        )}
      </div>
  );
}