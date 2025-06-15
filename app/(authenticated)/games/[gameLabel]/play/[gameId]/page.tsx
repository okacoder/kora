"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlayingCard, CardBack } from "@/components/game-card";
import { 
  IconCoin,
  IconClock,
  IconTrophy,
  IconHandStop,
  IconPlayerPlay,
  IconCards,
  IconLoader2
} from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGameMaster } from "@/lib/garame/hooks/useGameMaster";
import { useCurrentUser } from "@/hooks/use-current-user";
import Link from "next/link";
import { routes } from "@/lib/routes";
import GameTable from "@/lib/garame/components/gameboard";

export default function GamePlayPage() {
  const router = useRouter();
  const { gameId } = useParams<{ gameId: string }>();
  const currentPlayer = useCurrentUser();

  const { gameState, loading, startGame, playCard, timer } = useGameMaster({ gameId: gameId!, playerId: currentPlayer?.id!, onGameEnd: handleGameEnd });

  const [showRules, setShowRules] = useState(false);

  if (loading || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  const myPlayer = gameState.players.get(currentPlayer?.id!);

  function handleGameEnd(winnerId: string) {
    if (winnerId === currentPlayer?.id) {
      toast.success(`Félicitations ! Vous avez gagné ${Math.floor((gameState?.pot || 0) * 0.9)} FCFA !`);
    } else {
      toast.error("Vous avez perdu cette partie. Tentez votre chance à nouveau !");
    }
  }

  // Responsive layout: grid for desktop, flex-col for mobile, no scroll
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-background">
      {/* Header: infos, timer, pot, retour */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between px-4 py-2 z-20">
        <Link href={routes.game(gameState.id)} className="size-6">
          <IconCards className="size-6" />
        </Link>
        <div className="flex items-center gap-4">
          <Card className={cn(
            "border-2 h-12 flex items-center justify-center px-3",
            gameState.currentTurnPlayerId === currentPlayer?.id ? "border-primary animate-pulse" : "border-muted"
          )}>
            <CardContent className="flex items-center gap-2 p-0">
              <IconClock className="size-5" />
              <span className="font-mono font-bold text-lg">
                {timer.toString().padStart(2, '0')} s
              </span>
            </CardContent>
          </Card>
          <Card className="h-12 flex items-center justify-center px-3">
            <CardContent className="flex items-center gap-2 p-0">
              <IconCoin className="size-5 text-primary" />
              <span className="font-bold">{gameState.pot.toLocaleString()} FCFA</span>
            </CardContent>
          </Card>
        </div>
        {/* Info rules icon */}
        <Button variant="ghost" size="icon" onClick={() => setShowRules(true)}>
          <IconHandStop className="size-6 text-primary" />
        </Button>
      </div>

      {/* Player area */}
      <GameTable
        gameState={gameState}
        currentPlayerId={currentPlayer?.id!}
        playerNames={gameState.players}
        playerAvatars={gameState.players}
        onCardClick={playCard}
      />

      {/* Modal de règles rapides */}
      {showRules && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <IconHandStop className="size-12 mx-auto mb-2 text-primary" />
              <CardTitle className="text-xl">Règles rapides</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <ul className="text-base text-muted-foreground space-y-1">
                <li>• Le joueur avec la kora commence et peut jouer n'importe quelle carte</li>
                <li>• Les autres joueurs doivent suivre la même famille si possible</li>
                <li>• Si vous n'avez pas la famille demandée, jouez n'importe quelle carte</li>
                <li>• Le premier à se débarrasser de toutes ses cartes gagne</li>
              </ul>
              <Button className="mt-4 w-full" onClick={() => setShowRules(false)}>Fermer</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de fin de partie */}
      {gameState.status === 'finished' && gameState.winnerId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <IconTrophy className={cn(
                "size-16 mx-auto mb-4",
                gameState.winnerId === currentPlayerId ? "text-yellow-500" : "text-muted-foreground"
              )} />
              <CardTitle className="text-2xl">
                {gameState.winnerId === currentPlayerId ? "Victoire !" : "Défaite"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-lg">
                {gameState.winnerId === currentPlayerId 
                  ? `Vous avez gagné ${Math.floor(gameState.pot * 0.9).toLocaleString()} FCFA !`
                  : "Vous ferez mieux la prochaine fois !"}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push('/dashboard/garame')}>
                  Nouvelle partie
                </Button>
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                  Retour au tableau de bord
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}