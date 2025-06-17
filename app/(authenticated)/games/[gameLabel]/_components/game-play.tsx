"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  IconCoin,
  IconClock,
  IconTrophy,
  IconHandStop,
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

type GamePlayPageProps = {
  gameLabel: string;
  gameId: string;
}

export default function GamePlayPage({ gameLabel, gameId }: GamePlayPageProps) {
  const router = useRouter();
  const currentPlayer = useCurrentUser();
  
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const handleGameEnd = (theWinnerId: string, gain: number) => {
    setWinnerId(theWinnerId);
    setShowEndGameModal(true);
    if (theWinnerId === currentPlayer?.id) {
      toast.success(`Félicitations ! Vous avez gagné ${gain.toLocaleString()} FCFA !`);
    } else {
      toast.error("Vous avez perdu cette partie. Tentez votre chance à nouveau !");
    }
  };

  const { gameState, loading, playCard, timer } = useGameMaster({ 
    gameId: gameId!, 
    playerId: currentPlayer?.id!, 
    onGameEnd: handleGameEnd 
  });

  const [showRules, setShowRules] = useState(false);

  if (loading || !gameState || !currentPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de la partie...</p>
        </div>
      </div>
    );
  }

  // Responsive layout: grid for desktop, flex-col for mobile, no scroll
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-background space-y-4">
      {/* Header: infos, timer, pot, retour */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between px-4 py-2 z-20 gap-4">
        <Link href={`/games/${gameLabel}`} className="p-2 rounded-full hover:bg-muted min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40">
          <IconCards className="size-6 align-middle inline-block" />
        </Link>
        <div className="flex items-center gap-4">
          <Card className={cn(
            "border-2 h-12 flex items-center justify-center px-3 transition-colors rounded-lg shadow-sm",
            gameState.currentTurnPlayerId === currentPlayer.id ? "border-primary animate-pulse" : "border-muted"
          )}>
            <CardContent className="flex items-center gap-2 p-0">
              <IconClock className="size-5 align-middle inline-block" />
              <span className="font-mono font-bold text-lg">
                {timer.toString().padStart(2, '0')}s
              </span>
            </CardContent>
          </Card>
          <Card className="h-12 flex items-center justify-center px-3 rounded-lg shadow-sm">
            <CardContent className="flex items-center gap-2 p-0">
              <IconCoin className="size-5 text-primary align-middle inline-block" />
              <span className="font-bold">{gameState.pot.toLocaleString()} FCFA</span>
            </CardContent>
          </Card>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowRules(true)} className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40">
          <IconHandStop className="size-6 text-primary align-middle inline-block" />
        </Button>
      </div>

      <GameTable
        gameState={gameState}
        currentPlayerId={currentPlayer.id}
        playerNames={new Map(Array.from(gameState.players.values()).map(p => [p.playerId, p.username]))}
        playerAvatars={new Map(Array.from(gameState.players.values()).map(p => [p.playerId, p.avatar || '']))}
        onCardClick={(_playerId, cardIndex) => playCard(cardIndex)}
        className="mt-16"
      />

      {/* Modal de règles rapides */}
      {showRules && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
            <CardHeader className="text-center">
              <IconHandStop className="size-12 mx-auto mb-2 text-primary align-middle inline-block" />
              <CardTitle className="text-xl">Règles rapides de la Garame</CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-2 text-muted-foreground">
                <p>• Le but est de se débarrasser de toutes ses cartes.</p>
                <p>• Le joueur qui a la "Kora" (indiquée par <IconHandStop className="inline-block size-4 align-middle" />) commence.</p>
                <p>• Le premier joueur peut jouer n'importe quelle carte.</p>
                <p>• Les joueurs suivants doivent jouer une carte de la même famille (couleur) si possible.</p>
                <p>• Si un joueur ne peut pas suivre, il peut jouer n'importe quelle carte.</p>
                <p>• Le premier joueur à vider sa main gagne le pot (moins une commission).</p>
              <Button className="mt-4 w-full min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => setShowRules(false)}>Compris !</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de fin de partie */}
      {showEndGameModal && winnerId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full rounded-lg shadow-lg">
            <CardHeader className="text-center">
              <IconTrophy className={cn(
                "size-16 mx-auto mb-4",
                winnerId === currentPlayer.id ? "text-green-500" : "text-muted-foreground"
              )} />
              <CardTitle className={cn("text-2xl", winnerId === currentPlayer.id ? "text-green-700" : "text-muted-foreground") }>
                {winnerId === currentPlayer.id ? "Victoire !" : "Défaite"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-lg">
                {winnerId === currentPlayer.id 
                  ? `Vous avez gagné ${Math.floor(gameState.pot * 0.9).toLocaleString()} FCFA !`
                  : `Le joueur gagnant est ${gameState.players.get(winnerId)?.username}. Tentez votre chance à nouveau !`}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push(`/games/${gameLabel}`)} className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40">
                  Nouvelle partie
                </Button>
                <Button variant="outline" onClick={() => router.push('/koras')} className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40">
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}