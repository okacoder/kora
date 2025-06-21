"use client";

import { GameBoard } from '@/components/game/game-board';
import { notFound } from 'next/navigation';

interface GamePageProps {
  params: {
    gameId: string;
  };
}

export default function GamePage({ params }: GamePageProps) {
  const { gameId } = params;

  if (!gameId) {
    notFound();
  }

  return <GameBoard gameId={gameId} />;
}