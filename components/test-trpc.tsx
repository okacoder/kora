'use client';

import { trpc } from '@/lib/trpc/provider';

export function TestTRPC() {
  const { data: balance, isLoading } = trpc.wallet.getBalance.useQuery();
  const { data: games } = trpc.game.getAvailable.useQuery();

  if (isLoading) {
    return <div>Chargement du wallet...</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Test tRPC</h3>
      <div className="space-y-2">
        <p>Solde Kora: {balance?.koraBalance ?? 'Non disponible'}</p>
        <p>Parties disponibles: {games?.length ?? 0}</p>
      </div>
    </div>
  );
} 