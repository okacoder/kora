'use client';

import { useParams } from 'next/navigation';

export default function GamePage() {
  const { gameLabel } = useParams();
  return <div>GamePage {gameLabel}</div>;
}