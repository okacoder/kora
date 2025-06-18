"use client";

import { gameRegistry } from '@/lib/garame/core/game-registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/lib/routes';

export default function GamesPage() {
  const router = useRouter();
  const games = gameRegistry.getAvailableGames();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Choisissez votre jeu</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => {
          const Icon = game.icon;
          
          return (
            <Card 
              key={game.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(routes.gameLobby(game.id))}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">{game.playerRange}</Badge>
                </div>
                <CardTitle>{game.name}</CardTitle>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href={routes.gameLobby(game.id)}>Jouer</Link>
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
          {['Poker', 'Belote', 'Rami'].map((game) => (
            <Card key={game} className="opacity-60">
              <CardHeader>
                <CardTitle>{game}</CardTitle>
                <CardDescription>Bientôt disponible...</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}