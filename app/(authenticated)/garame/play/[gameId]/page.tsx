"use client";

import { useState, useEffect } from "react";
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
  IconCards
} from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types pour le jeu
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
}

interface Player {
  id: string;
  name: string;
  cards: Card[];
  hasKora: boolean;
  score: number;
}

interface GameState {
  id: string;
  currentTurn: string;
  lastPlayedCard?: Card;
  currentSuit?: Suit;
  players: {
    [playerId: string]: Player;
  };
  pot: number;
  status: 'playing' | 'finished';
  winnerId?: string;
}

// État initial du jeu (mock)
const initialGameState: GameState = {
  id: '1',
  currentTurn: 'player1',
  pot: 2000,
  status: 'playing',
  players: {
    player1: {
      id: 'player1',
      name: 'Vous',
      cards: [
        { suit: 'hearts', rank: 'K' },
        { suit: 'diamonds', rank: '7' },
        { suit: 'clubs', rank: 'A' },
        { suit: 'spades', rank: '10' },
        { suit: 'hearts', rank: '3' }
      ],
      hasKora: true,
      score: 0
    },
    player2: {
      id: 'player2',
      name: 'Jean241',
      cards: [
        { suit: 'hearts', rank: 'Q' },
        { suit: 'diamonds', rank: 'J' },
        { suit: 'clubs', rank: '5' },
        { suit: 'spades', rank: 'K' },
        { suit: 'hearts', rank: '8' }
      ],
      hasKora: false,
      score: 0
    }
  }
};

export default function GamePlayPage({ params }: { params: { gameId: string } }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30); // Timer de 30 secondes par tour
  const currentPlayerId = 'player1'; // ID du joueur actuel (à récupérer depuis l'auth)
  
  const isMyTurn = gameState.currentTurn === currentPlayerId;
  const myPlayer = gameState.players[currentPlayerId];
  const opponent = gameState.players['player2'];

  // Timer pour le tour
  useEffect(() => {
    if (gameState.status !== 'playing') return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Temps écoulé, jouer automatiquement une carte
          handleTimeout();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState.status, gameState.currentTurn]);

  const handleTimeout = () => {
    if (isMyTurn) {
      // Jouer la première carte disponible
      handlePlayCard(0);
      toast.error("Temps écoulé ! Une carte a été jouée automatiquement.");
    }
  };

  const canPlayCard = (card: Card): boolean => {
    // Si c'est le premier tour ou pas de carte jouée
    if (!gameState.currentSuit) return true;
    
    // Si le joueur a la kora, il peut jouer n'importe quelle carte
    if (myPlayer.hasKora) return true;
    
    // Sinon, il doit jouer la même famille si possible
    const hasSameSuit = myPlayer.cards.some(c => c.suit === gameState.currentSuit);
    if (hasSameSuit) {
      return card.suit === gameState.currentSuit;
    }
    
    // S'il n'a pas la famille demandée, il peut jouer n'importe quelle carte
    return true;
  };

  const handlePlayCard = (index: number) => {
    if (!isMyTurn || gameState.status !== 'playing') return;
    
    const card = myPlayer.cards[index];
    if (!canPlayCard(card)) {
      toast.error("Vous devez jouer une carte de la même famille !");
      return;
    }
    
    // Mettre à jour l'état du jeu
    setGameState(prev => ({
      ...prev,
      lastPlayedCard: card,
      currentSuit: card.suit,
      currentTurn: 'player2',
      players: {
        ...prev.players,
        [currentPlayerId]: {
          ...myPlayer,
          cards: myPlayer.cards.filter((_, i) => i !== index)
        }
      }
    }));
    
    setSelectedCard(null);
    setTimeLeft(30);
    
    // Simuler le tour de l'adversaire
    setTimeout(() => {
      simulateOpponentTurn();
    }, 2000);
  };

  const simulateOpponentTurn = () => {
    // Logique simple pour simuler le jeu de l'adversaire
    const opponentCards = opponent.cards;
    const playableCards = opponentCards.filter((card, index) => {
      if (!gameState.currentSuit) return true;
      if (opponent.hasKora) return true;
      
      const hasSameSuit = opponentCards.some(c => c.suit === gameState.currentSuit);
      if (hasSameSuit) {
        return card.suit === gameState.currentSuit;
      }
      return true;
    });
    
    if (playableCards.length === 0) return;
    
    const cardToPlay = playableCards[0];
    const cardIndex = opponentCards.findIndex(c => c.suit === cardToPlay.suit && c.rank === cardToPlay.rank);
    
    setGameState(prev => ({
      ...prev,
      lastPlayedCard: cardToPlay,
      currentSuit: cardToPlay.suit,
      currentTurn: currentPlayerId,
      players: {
        ...prev.players,
        player2: {
          ...opponent,
          cards: opponent.cards.filter((_, i) => i !== cardIndex)
        }
      }
    }));
    
    setTimeLeft(30);
    
    // Vérifier si la partie est terminée
    if (opponent.cards.length === 1) {
      endGame();
    }
  };

  const endGame = () => {
    // Déterminer le gagnant
    const winner = myPlayer.cards.length < opponent.cards.length ? currentPlayerId : 'player2';
    
    setGameState(prev => ({
      ...prev,
      status: 'finished',
      winnerId: winner
    }));
    
    if (winner === currentPlayerId) {
      toast.success(`Félicitations ! Vous avez gagné ${Math.floor(gameState.pot * 0.9)} FCFA !`);
    } else {
      toast.error("Vous avez perdu cette partie. Tentez votre chance à nouveau !");
    }
  };

  const handlePass = () => {
    if (!isMyTurn || !myPlayer.hasKora) return;
    
    // Passer la kora à l'adversaire
    setGameState(prev => ({
      ...prev,
      currentTurn: 'player2',
      players: {
        ...prev.players,
        [currentPlayerId]: { ...myPlayer, hasKora: false },
        player2: { ...opponent, hasKora: true }
      }
    }));
    
    setTimeLeft(30);
    toast.info("Vous avez passé la main");
    
    setTimeout(() => {
      simulateOpponentTurn();
    }, 2000);
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
          gameState.currentTurn === 'player2' && "ring-2 ring-primary"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>{opponent.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{opponent.name}</h3>
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
                  <AvatarFallback>{myPlayer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{myPlayer.name}</h3>
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
                  onClick={handlePass}
                >
                  Passer la main
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-2 flex-wrap">
              {myPlayer.cards.map((card, index) => (
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
      {gameState.status === 'finished' && (
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
                <Button onClick={() => window.location.href = '/garame'}>
                  Nouvelle partie
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
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