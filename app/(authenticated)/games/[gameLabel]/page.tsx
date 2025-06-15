'use client';

import { useParams } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function GamePage() {
  const { gameLabel } = useParams();
  const currentPlayer = useCurrentUser();
  return <div>GamePage {gameLabel}</div>;
}