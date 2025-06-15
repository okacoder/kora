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
import { useGameState, useOpponentAI } from "@/lib/garame/hooks/useGameState";
import { ICard } from "@/lib/garame/domain/interfaces";

export default function GamePlayPage() {
  const router = useRouter();
  const { gameId } = useParams<{ gameId: string }>();

  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const currentPlayerId = 'current-user';
  const opponentId = 'player2';
  
  const {
    gameState,
    loading,
    timeLeft,
    canPlayCard,
    playCard,
    passKora,
    isMyTurn
  } = useGameState({
    gameId: gameId!,
    playerId: currentPlayerId,
    onGameEnd: (winnerId) => {
      if (winnerId === currentPlayerId) {
        toast.success(`Félicitations ! Vous avez gagné ${Math.floor((gameState?.pot || 0) * 0.9)} FCFA !`);
      } else {
        toast.error("Vous avez perdu cette partie. Tentez votre chance à nouveau !");
      }
    }
  });
  
  useOpponentAI(gameState, opponentId);
  
  if (loading || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  const myPlayer = gameState.players.get(currentPlayerId);
  const opponent = gameState.players.get(opponentId);
  
  if (!myPlayer || !opponent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Erreur lors du chargement de la partie</p>
      </div>
    );
  }

  const handlePlayCard = async (index: number) => {
    if (!isMyTurn || gameState.status !== 'playing') return;
    const card = myPlayer.cards[index];
    if (!canPlayCard(card)) {
      toast.error("Vous devez jouer une carte de la même famille !");
      return;
    }
    await playCard(index);
    setSelectedCard(null);
  };

  // Responsive layout: grid for desktop, flex-col for mobile, no scroll
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-background">
      {/* Header: infos, timer, pot, retour */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between px-4 py-2 z-20">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/garame')}>
          <IconCards className="size-6" />
        </Button>
        <div className="flex items-center gap-4">
          <Card className={cn(
            "border-2 h-12 flex items-center justify-center px-3",
            isMyTurn ? "border-primary animate-pulse" : "border-muted"
          )}>
            <CardContent className="flex items-center gap-2 p-0">
              <IconClock className="size-5" />
              <span className="font-mono font-bold text-lg">
                00:{timeLeft.toString().padStart(2, '0')}
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

      {/* Plateau central: avatars, cartes jouées, pot */}
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Opponent avatar & cards (top) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <Avatar className={cn("size-16 border-4", gameState.currentTurnPlayerId === opponentId && "border-primary animate-pulse")}> <AvatarFallback>IA</AvatarFallback> </Avatar>
            <div className="flex justify-center -space-x-8 mt-2">
              {opponent.cards.map((_, index) => (
                <div key={index} className="transform">
                  <CardBack width={70} height={100} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              {opponent.hasKora && (
                <Badge variant="default" className="text-xs"><IconHandStop className="size-3 mr-1" />Kora</Badge>
              )}
              <Badge variant="outline" className="text-xs">{opponent.cards.length} cartes</Badge>
            </div>
          </div>

          {/* Plateau central (carte jouée) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
            <div className="rounded-full bg-muted/60 shadow-lg flex flex-col items-center justify-center p-6">
              {gameState.lastPlayedCard ? (
                <PlayingCard 
                  suit={gameState.lastPlayedCard.suit} 
                  rank={gameState.lastPlayedCard.rank}
                  width={120}
                  height={170}
                />
              ) : (
                <IconCards className="size-20 text-muted-foreground" />
              )}
              {gameState.currentSuit && (
                <Badge variant="outline" className="text-sm mt-2">
                  Famille : {
                    gameState.currentSuit === 'hearts' ? '♥ Cœurs' :
                    gameState.currentSuit === 'diamonds' ? '♦ Carreaux' :
                    gameState.currentSuit === 'clubs' ? '♣ Trèfles' :
                    '♠ Piques'
                  }
                </Badge>
              )}
            </div>
          </div>

          {/* My avatar & cards (bottom) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <Avatar className={cn("size-16 border-4", isMyTurn && "border-primary animate-pulse")}> <AvatarFallback>VS</AvatarFallback> </Avatar>
            <div className="flex justify-center gap-2 flex-wrap mt-2">
              {myPlayer.cards.map((card: ICard, index: number) => (
                <div 
                  key={index} 
                  className={cn(
                    "cursor-pointer transform transition-all",
                    selectedCard === index && "scale-125 -translate-y-4 z-20",
                    isMyTurn && canPlayCard(card) 
                      ? "hover:scale-110 hover:-translate-y-2" 
                      : "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (isMyTurn && canPlayCard(card)) {
                      setSelectedCard(index);
                    }
                  }}
                >
                  <PlayingCard 
                    suit={card.suit} 
                    rank={card.rank}
                    width={90}
                    height={130}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              {myPlayer.hasKora && (
                <Badge variant="default" className="text-xs"><IconHandStop className="size-3 mr-1" />Kora</Badge>
              )}
              {isMyTurn && (
                <Badge variant="secondary" className="text-xs animate-pulse"><IconPlayerPlay className="size-3 mr-1" />Votre tour</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions: jouer/annuler/passer la main */}
      <div className="absolute bottom-0 left-0 w-full flex flex-col items-center gap-2 pb-4 z-30">
        {selectedCard !== null && (
          <div className="flex justify-center gap-2 mb-2">
            <Button 
              onClick={() => handlePlayCard(selectedCard)}
              disabled={!isMyTurn}
              className="text-lg px-8 py-3"
            >
              Jouer cette carte
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSelectedCard(null)}
              className="text-lg px-8 py-3"
            >
              Annuler
            </Button>
          </div>
        )}
        {isMyTurn && myPlayer.hasKora && (
          <Button 
            variant="outline" 
            size="lg"
            onClick={passKora}
            className="text-lg px-8 py-3"
          >
            Passer la main
          </Button>
        )}
      </div>

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