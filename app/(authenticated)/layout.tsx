"use client";

import { useCurrentUser } from '@/hooks/use-current-user';
import { gameStore } from '@/lib/garame/core/game-store';
import { useEffect } from 'react';
import type { Player } from '@/lib/garame/core/types';

// Ce composant s'assure que l'utilisateur actuellement connecté est
// synchronisé avec le `gameStore` qui gère l'état du jeu.
function GameStoreUserSync() {
  const currentUser = useCurrentUser();

  useEffect(() => {
    if (currentUser) {
      // Adapte l'objet `currentUser` au type `Player` attendu par le store
      const player: Player = {
        id: currentUser.id,
        username: currentUser.username || 'Joueur',
        // Assumant que `koras` est le solde principal, converti depuis la DB
        balance: currentUser.koras || 0,
        avatar: currentUser.image || undefined,
      };
      gameStore.setCurrentUser(player);
    }
  }, [currentUser]);

  return null; // Ce composant ne rend rien dans l'UI
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameStoreUserSync />
      {children}
    </>
  );
}
