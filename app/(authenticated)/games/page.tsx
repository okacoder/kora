"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { IconCards, IconJoker, IconDice } from '@tabler/icons-react';
import { GameType } from '@prisma/client';
import { TestGameEngine } from '@/components/test-game-engine';

interface Game {
  id: GameType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  minPlayers: number;
  maxPlayers: number;
}

const AVAILABLE_GAMES: Game[] = [
  {
    id: 'garame',
    name: 'Garame',
    description: 'Le jeu de cartes traditionnel gabonais',
    icon: IconCards,
    minPlayers: 2,
    maxPlayers: 4,
  }
];

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Choisissez votre jeu</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AVAILABLE_GAMES.map((game) => {
          const Icon = game.icon;
          
          return (
            <Card 
              key={game.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(routes.createGameRoom(game.id))}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">
                    {game.minPlayers === game.maxPlayers 
                      ? `${game.minPlayers} joueurs`
                      : `${game.minPlayers}-${game.maxPlayers} joueurs`}
                  </Badge>
                </div>
                <CardTitle>{game.name}</CardTitle>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href={routes.createGameRoom(game.id)}>Jouer</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming soon games */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Prochainement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COMING_SOON_GAMES.map((game) => {
            const Icon = game.icon;
            
            return (
              <Card key={game.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                    <CardTitle>{game.name}</CardTitle>
                  </div>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Test du moteur de jeu */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Test du Moteur de Jeu</h2>
        <TestGameEngine />
      </div>
    </div>
  );
}