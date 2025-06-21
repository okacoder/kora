'use client';

import { trpc } from '@/lib/trpc/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

export function TestTRPC() {
  const [depositAmount, setDepositAmount] = useState(1000);
  
  const { data: balance, isLoading, refetch: refetchBalance } = trpc.wallet.getBalance.useQuery();
  const { data: transactions } = trpc.wallet.getTransactions.useQuery({ limit: 5 });
  const { data: games } = trpc.game.getAvailable.useQuery();
  
  const depositMutation = trpc.wallet.deposit.useMutation({
    onSuccess: () => {
      refetchBalance();
    },
  });

  const handleDeposit = () => {
    depositMutation.mutate({
      amount: depositAmount,
      reference: `TEST-${Date.now()}`,
    });
  };

  if (isLoading) {
    return <div>Chargement du wallet...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>🎯 Test tRPC</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Solde du wallet */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Solde Kora:</span> {balance?.koraBalance ?? 0}
          </div>
          <div>
            <span className="font-medium">Koras bloqués:</span> {balance?.lockedKoras ?? 0}
          </div>
          <div>
            <span className="font-medium">Total dépôts:</span> {balance?.totalDeposits ?? 0} FCFA
          </div>
          <div>
            <span className="font-medium">Parties disponibles:</span> {games?.length ?? 0}
          </div>
        </div>

        <Separator />

        {/* Test de dépôt */}
        <div className="space-y-3">
          <h4 className="font-medium">Test de dépôt</h4>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              className="px-3 py-1 border rounded w-24"
              min="10"
              max="10000"
            />
            <span className="text-sm text-gray-600">FCFA</span>
            <Button 
              onClick={handleDeposit}
                             disabled={depositMutation.isPending}
              size="sm"
            >
                             {depositMutation.isPending ? 'Dépôt...' : 'Déposer'}
            </Button>
          </div>
          {depositMutation.error && (
            <p className="text-red-600 text-sm">{depositMutation.error.message}</p>
          )}
          {depositMutation.data && (
            <p className="text-green-600 text-sm">
              ✅ Dépôt réussi! +{depositMutation.data.korasAdded} Koras
            </p>
          )}
        </div>

        <Separator />

        {/* Dernières transactions */}
        <div className="space-y-2">
          <h4 className="font-medium">Dernières transactions</h4>
          {transactions?.transactions?.length ? (
            <div className="space-y-1">
              {transactions.transactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="text-xs bg-gray-50 p-2 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">{tx.type}</span>
                                         <span className={tx.koras && tx.koras > 0 ? 'text-green-600' : 'text-red-600'}>
                       {tx.koras && tx.koras > 0 ? '+' : ''}{tx.koras || 0} Koras
                     </span>
                  </div>
                  <div className="text-gray-600">{tx.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune transaction</p>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            <strong>Test tRPC:</strong> Les données proviennent maintenant de la vraie base de données PostgreSQL.
            Testez le dépôt pour voir les transactions en temps réel !
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 