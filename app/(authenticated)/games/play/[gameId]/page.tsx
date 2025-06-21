"use client";

import { GameBoard } from '@/components/game/game-board';
import { notFound, useParams } from 'next/navigation';

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string | undefined }>();

  if (!gameId) {
    notFound();
  }

  return <GameBoard gameId={gameId} />;
}