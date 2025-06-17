"use client";

import { Card } from "@/lib/garame/core/types";
import { GaramePlayerState } from "../garame-types";
import { cn } from "@/lib/utils";
import { IconCrown } from "@tabler/icons-react";

interface GarameBoardProps {
  currentPlayer: GaramePlayerState | null;
  opponentPlayer: GaramePlayerState | null;
  lastPlayedCard: Card | null;
  isMyTurn: boolean;
  canPlayCard: (index: number) => boolean;
  onPlayCard: (index: number) => void;
}

export function GarameBoard({
  currentPlayer,
  opponentPlayer,
  lastPlayedCard,
  isMyTurn,
  canPlayCard,
  onPlayCard
}: GarameBoardProps) {
  const getSuitSymbol = (suit: Card['suit']) => {
    switch (suit) {
      case 'hearts': return '♥️';
      case 'diamonds': return '♦️';
      case 'clubs': return '♣️';
      case 'spades': return '♠️';
    }
  };

  const getCardColor = (suit: Card['suit']) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black';
  };

  const renderCard = (card: Card, index: number, isPlayable: boolean) => {
    return (
      <div
        key={card.id}
        className={cn(
          "relative w-16 h-24 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all",
          isPlayable && isMyTurn ? "hover:scale-105 hover:shadow-lg border-primary" : "border-gray-300",
          !isPlayable && isMyTurn && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => isPlayable && onPlayCard(index)}
      >
        <span className={cn("text-2xl font-bold", getCardColor(card.suit))}>
          {card.rank}
        </span>
        <span className="text-3xl">
          {getSuitSymbol(card.suit)}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Opponent's area */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{opponentPlayer?.isAI ? 'Bot' : 'Adversaire'}</span>
            {opponentPlayer?.hasKora && (
              <IconCrown className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {opponentPlayer?.cards.length || 0} cartes
          </span>
        </div>
        <div className="flex gap-2 justify-center">
          {opponentPlayer?.cards.map((_, index) => (
            <div
              key={index}
              className="w-16 h-24 rounded-lg bg-primary/10 border-2 border-primary/20"
            />
          ))}
        </div>
      </div>

      {/* Playing area */}
      <div className="mb-8 p-8 rounded-xl bg-green-100 dark:bg-green-900/20 min-h-[200px] flex items-center justify-center">
        {lastPlayedCard ? (
          <div className="w-20 h-28 rounded-lg border-2 border-gray-400 bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-lg">
            <span className={cn("text-3xl font-bold", getCardColor(lastPlayedCard.suit))}>
              {lastPlayedCard.rank}
            </span>
            <span className="text-4xl">
              {getSuitSymbol(lastPlayedCard.suit)}
            </span>
          </div>
        ) : (
          <div className="text-muted-foreground">
            {isMyTurn ? "À vous de jouer!" : "En attente de l'adversaire..."}
          </div>
        )}
      </div>

      {/* Current player's area */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Vos cartes</span>
            {currentPlayer?.hasKora && (
              <IconCrown className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {currentPlayer?.cards.length || 0} cartes
          </span>
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          {currentPlayer?.cards.map((card, index) => 
            renderCard(card, index, canPlayCard(index))
          )}
        </div>
      </div>
    </div>
  );
}