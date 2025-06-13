// app/(authenticated)/(dashboard)/dashboard/garame/play/[gameId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PlayingCard, CardBack } from "@/components/game-card";
import { 
  IconCoin,
  IconClock,
  IconAlertCircle,
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

export default function GamePlayPage({ params }: { params: { gameId: string } }) {
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const currentPlayerId = 'current-user'; // À récupérer depuis l'auth
  const opponentId = 'player2'; // À déterminer dynamiquement
  
  const {
    gameState,
    loading,
    timeLeft,
    canPlayCard,
    playCard,
    passKora,
    isMyTurn
  } = useGameState({
    gameId: params.gameId,
    playerId: currentPlayerId,
    onGameEnd: (winnerId) => {
      if (winnerId === currentPlayerId) {
        toast.success(`Félicitations ! Vous avez gagné ${Math.floor((gameState?.pot || 0) * 0.9)} FCFA !`);
      } else {
        toast.error("Vous avez perdu cette partie. Tentez votre chance à nouveau !");
      }
    }
  });
  
  // Activer l'IA pour l'adversaire en mode développement
  useOpponentAI(gameState, opponentId);
  
  if (loading || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  const myPlayer = gameState.players.get(currentPlayerId);
  const opponent = gameState.players.get(opponentId);
  
  if (!myPlayer || !opponent) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
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

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6 max-w-6xl mx-auto">
      {/* Header avec infos de la partie */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold">Partie en cours</h1>
          <Badge variant="outline">Salle #{params.gameId}</Badge>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Timer */}
          <Card className={cn(
            "border-2",
            isMyTurn ? "border-primary animate-pulse" : "border-muted"
          )}>
            <CardContent className="flex items-center gap-2 p-3">
              <IconClock className="size-5" />
              <span className="font-mono font-bold text-lg">
                00:{timeLeft.toString().padStart(2, '0')}
              </span>
            </CardContent>
          </Card>
          
          {/* Pot */}
          <Card>
            <CardContent className="flex items-center gap-2 p-3">
              <IconCoin className="size-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Pot total</p>
                <p className="font-bold">{gameState.pot.toLocaleString()} FCFA</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Zone de jeu principale */}
      <div className="grid gap-4">
        {/* Adversaire */}
        <Card className={cn(
          "transition-all",
          gameState.currentTurnPlayerId === opponentId && "ring-2 ring-primary"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>IA</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">Adversaire IA</h3>
                  <div className="flex items-center gap-2">
                    {opponent.hasKora && (
                      <Badge variant="default" className="text-xs">
                        <IconHandStop className="size-3 mr-1" />
                        Kora
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {opponent.cards.length} cartes
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center -space-x-8">
              {opponent.cards.map((_, index) => (
                <div key={index} className="transform hover:scale-105 transition-transform">
                  <CardBack width={60} height={84} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Zone de jeu centrale */}
        <Card className="bg-muted/30">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4">
              {gameState.lastPlayedCard ? (
                <>
                  <p className="text-sm text-muted-foreground">Dernière carte jouée</p>
                  <div className="transform scale-110">
                    <PlayingCard 
                      suit={gameState.lastPlayedCard.suit} 
                      rank={gameState.lastPlayedCard.rank}
                      width={100}
                      height={140}
                    />
                  </div>
                  {gameState.currentSuit && (
                    <Badge variant="outline" className="text-sm">
                      Famille demandée : {
                        gameState.currentSuit === 'hearts' ? '♥ Cœurs' :
                        gameState.currentSuit === 'diamonds' ? '♦ Carreaux' :
                        gameState.currentSuit === 'clubs' ? '♣ Trèfles' :
                        '♠ Piques'
                      }
                    </Badge>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <IconCards className="size-16 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Aucune carte jouée</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mes cartes */}
        <Card className={cn(
          "transition-all",
          isMyTurn && "ring-2 ring-primary"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>VS</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">Vous</h3>
                  <div className="flex items-center gap-2">
                    {myPlayer.hasKora && (
                      <Badge variant="default" className="text-xs">
                        <IconHandStop className="size-3 mr-1" />
                        Kora
                      </Badge>
                    )}
                    {isMyTurn && (
                      <Badge variant="secondary" className="text-xs animate-pulse">
                        <IconPlayerPlay className="size-3 mr-1" />
                        Votre tour
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {isMyTurn && myPlayer.hasKora && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={passKora}
                >
                  Passer la main
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-2 flex-wrap">
              {myPlayer.cards.map((card: ICard, index: number) => (
                <div 
                  key={index} 
                  className={cn(
                    "cursor-pointer transform transition-all",
                    selectedCard === index && "scale-110 -translate-y-4",
                    isMyTurn && canPlayCard(card) 
                      ? "hover:scale-105 hover:-translate-y-2" 
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
                    width={80}
                    height={112}
                  />
                </div>
              ))}
            </div>
            
            {selectedCard !== null && (
              <div className="flex justify-center gap-2 mt-4">
                <Button 
                  onClick={() => handlePlayCard(selectedCard)}
                  disabled={!isMyTurn}
                >
                  Jouer cette carte
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCard(null)}
                >
                  Annuler
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Règles rapides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Règles rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Le joueur avec la kora commence et peut jouer n'importe quelle carte</li>
            <li>• Les autres joueurs doivent suivre la même famille si possible</li>
            <li>• Si vous n'avez pas la famille demandée, jouez n'importe quelle carte</li>
            <li>• Le premier à se débarrasser de toutes ses cartes gagne</li>
          </ul>
        </CardContent>
      </Card>

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