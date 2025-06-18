# Plan complet pour retirer l'inversion de dépendance et simplifier l'architecture

## 🗑️ Phase 1 : Suppression du code IoC

### 1.1 Dossiers et fichiers à supprimer complètement

```
lib/
├── di/                          # SUPPRIMER TOUT LE DOSSIER
│   ├── container.ts
│   ├── container.server.ts
│   └── types.ts
├── interfaces/                  # SUPPRIMER TOUT LE DOSSIER
│   ├── repositories/
│   └── services/
├── repositories/                # SUPPRIMER TOUT LE DOSSIER (on va les refaire)
└── services/                    # GARDER mais refaire sans injection

hooks/
└── useInjection.ts             # SUPPRIMER

package.json
├── inversify                   # RETIRER LA DÉPENDANCE
└── reflect-metadata           # RETIRER LA DÉPENDANCE
```

### 1.2 Commandes de nettoyage

```bash
# Supprimer les dossiers
rm -rf lib/di
rm -rf lib/interfaces
rm -rf lib/repositories
rm hooks/useInjection.ts

# Désinstaller les dépendances
npm uninstall inversify reflect-metadata @types/reflect-metadata

# Retirer l'import de reflect-metadata dans tous les fichiers
# Rechercher et supprimer: import 'reflect-metadata';
```

## 📦 Phase 2 : Nouvelle architecture simplifiée

### 2.1 Structure proposée

```
lib/
├── db/
│   └── prisma.ts              # Instance Prisma singleton
├── services/
│   ├── auth.service.ts        # Service d'authentification
│   ├── user.service.ts        # Service utilisateur
│   ├── game.service.ts        # Service de jeu
│   ├── payment.service.ts     # Service de paiement
│   └── transaction.service.ts # Service de transactions
├── hooks/
│   ├── useAuth.ts             # Hook pour l'auth
│   ├── useUser.ts             # Hook pour l'utilisateur
│   └── useGame.ts             # Hook pour les jeux
└── types/
    └── index.ts               # Types TypeScript partagés
```

## 🔨 Phase 3 : Implémentation des services simplifiés

### 3.1 Configuration Prisma

**Fichier : `lib/db/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

// Éviter multiple instances en développement
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

### 3.2 Service d'authentification

**Fichier : `lib/services/auth.service.ts`**

```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { Session } from '@/lib/auth';

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async getSession(): Promise<Session | null> {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async getCurrentUserId(): Promise<string | null> {
    const session = await this.getSession();
    return session?.user?.id || null;
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session?.user;
  }

  async hasRole(role: string): Promise<boolean> {
    const session = await this.getSession();
    return session?.user?.role === role;
  }
}

export const authService = AuthService.getInstance();
```

### 3.3 Service utilisateur

**Fichier : `lib/services/user.service.ts`**

```typescript
import { User } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { authService } from './auth.service';

export interface UpdateUserDto {
  name?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  image?: string;
}

class UserService {
  private static instance: UserService;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getCurrentUser(): Promise<User | null> {
    const userId = await authService.getCurrentUserId();
    if (!userId) return null;

    return this.getUserById(userId);
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    // Vérifier les permissions
    const currentUserId = await authService.getCurrentUserId();
    if (currentUserId !== id && !(await authService.hasRole('ADMIN'))) {
      throw new Error('Unauthorized');
    }

    return await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateBalance(userId: string, amount: number): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        koras: {
          increment: amount,
        },
        updatedAt: new Date(),
      },
    });
  }

  async incrementStats(userId: string, wins: number, games: number): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        totalWins: { increment: wins },
        totalGames: { increment: games },
        updatedAt: new Date(),
      },
    });
  }
}

export const userService = UserService.getInstance();
```

### 3.4 Service de paiement

**Fichier : `lib/services/payment.service.ts`**

```typescript
import { TransactionType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { userService } from './user.service';

class PaymentService {
  private static instance: PaymentService;
  private readonly COMMISSION_RATE = 0.1; // 10%
  private readonly KORA_TO_FCFA = 10;

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async processStake(
    playerId: string,
    stakeInKoras: number,
    roomId: string,
  ): Promise<void> {
    const user = await userService.getUserById(playerId);
    if (!user) throw new Error('User not found');

    if (user.koras < stakeInKoras) {
      throw new Error('Insufficient balance');
    }

    // Transaction atomique
    await prisma.$transaction(async (tx) => {
      // Déduire les koras
      await tx.user.update({
        where: { id: playerId },
        data: {
          koras: {
            decrement: stakeInKoras,
          },
        },
      });

      // Créer la transaction
      await tx.transaction.create({
        data: {
          userId: playerId,
          type: 'GAME_STAKE',
          koras: stakeInKoras,
          korasBefore: user.koras,
          korasAfter: user.koras - stakeInKoras,
          description: `Mise pour la partie ${roomId}`,
          gameId: roomId,
          status: 'COMPLETED',
        },
      });
    });
  }

  async processWinning(
    playerId: string,
    amountInKoras: number,
    gameId: string,
  ): Promise<void> {
    const user = await userService.getUserById(playerId);
    if (!user) throw new Error('User not found');

    // Calculer la commission
    const commission = amountInKoras * this.COMMISSION_RATE;
    const netAmount = amountInKoras - commission;

    await prisma.$transaction(async (tx) => {
      // Ajouter les koras (après commission)
      await tx.user.update({
        where: { id: playerId },
        data: {
          koras: {
            increment: netAmount,
          },
          totalWins: {
            increment: 1,
          },
        },
      });

      // Créer la transaction de gain
      await tx.transaction.create({
        data: {
          userId: playerId,
          type: 'GAME_WIN',
          koras: netAmount,
          korasBefore: user.koras,
          korasAfter: user.koras + netAmount,
          description: `Gain de la partie ${gameId} (commission: ${commission} koras)`,
          gameId: gameId,
          status: 'COMPLETED',
        },
      });

      // Créer la transaction de commission
      await tx.transaction.create({
        data: {
          userId: 'SYSTEM',
          type: 'COMMISSION',
          koras: commission,
          korasBefore: 0,
          korasAfter: 0,
          description: `Commission sur la partie ${gameId}`,
          gameId: gameId,
          status: 'COMPLETED',
        },
      });
    });
  }

  async depositKoras(
    userId: string,
    amountFCFA: number,
    reference: string,
  ): Promise<void> {
    const user = await userService.getUserById(userId);
    if (!user) throw new Error('User not found');

    const korasToAdd = amountFCFA / this.KORA_TO_FCFA;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          koras: {
            increment: korasToAdd,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: userId,
          type: 'DEPOSIT',
          amount: amountFCFA,
          koras: korasToAdd,
          korasBefore: user.koras,
          korasAfter: user.koras + korasToAdd,
          description: 'Dépôt Mobile Money',
          reference: reference,
          status: 'COMPLETED',
        },
      });
    });
  }

  async getPlayerBalance(playerId: string): Promise<number> {
    const user = await userService.getUserById(playerId);
    return user?.koras || 0;
  }

  async canAffordStake(playerId: string, stake: number): Promise<boolean> {
    const balance = await this.getPlayerBalance(playerId);
    return balance >= stake;
  }
}

export const paymentService = PaymentService.getInstance();
```

### 3.5 Service de jeu

**Fichier : `lib/services/game.service.ts`**

```typescript
import { GameRoom, GameRoomStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { paymentService } from './payment.service';
import { userService } from './user.service';

export interface CreateRoomDto {
  gameType: string;
  stake: number;
  maxPlayers?: number;
  minPlayers?: number;
  isPrivate?: boolean;
}

class GameService {
  private static instance: GameService;

  private constructor() {}

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  async createRoom(userId: string, data: CreateRoomDto): Promise<GameRoom> {
    const user = await userService.getUserById(userId);
    if (!user) throw new Error('User not found');

    // Vérifier le solde
    const canAfford = await paymentService.canAffordStake(userId, data.stake);
    if (!canAfford) {
      throw new Error('Insufficient balance');
    }

    // Créer la salle et traiter la mise dans une transaction
    const room = await prisma.$transaction(async (tx) => {
      // Créer la salle
      const newRoom = await tx.gameRoom.create({
        data: {
          gameType: data.gameType,
          stake: data.stake,
          creatorId: userId,
          creatorName: user.name,
          status: 'WAITING',
          maxPlayers: data.maxPlayers || 2,
          minPlayers: data.minPlayers || 2,
          totalPot: data.stake * 10, // En FCFA
          settings: {
            isPrivate: data.isPrivate || false,
            roomCode: data.isPrivate ? this.generateRoomCode() : null,
          },
        },
        include: {
          players: true,
        },
      });

      // Ajouter le créateur comme joueur
      await tx.roomPlayer.create({
        data: {
          gameRoomId: newRoom.id,
          userId: userId,
          name: user.name,
          position: 0,
          isReady: true,
          isAI: false,
        },
      });

      return newRoom;
    });

    // Traiter la mise
    await paymentService.processStake(userId, data.stake, room.id);

    return room;
  }

  async joinRoom(roomId: string, userId: string): Promise<GameRoom> {
    const user = await userService.getUserById(userId);
    if (!user) throw new Error('User not found');

    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    if (room.status !== 'WAITING') {
      throw new Error('Room is not available');
    }

    const playerCount = await prisma.roomPlayer.count({
      where: { gameRoomId: roomId },
    });

    if (playerCount >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    // Vérifier le solde
    const canAfford = await paymentService.canAffordStake(userId, room.stake);
    if (!canAfford) {
      throw new Error('Insufficient balance');
    }

    // Ajouter le joueur
    await prisma.$transaction(async (tx) => {
      const position = await tx.roomPlayer.count({
        where: { gameRoomId: roomId },
      });

      await tx.roomPlayer.create({
        data: {
          gameRoomId: roomId,
          userId: userId,
          name: user.name,
          position: position,
          isReady: false,
          isAI: false,
        },
      });

      // Mettre à jour le pot total
      await tx.gameRoom.update({
        where: { id: roomId },
        data: {
          totalPot: {
            increment: room.stake * 10,
          },
        },
      });
    });

    // Traiter la mise
    await paymentService.processStake(userId, room.stake, roomId);

    return this.getRoom(roomId);
  }

  async getRoom(roomId: string): Promise<GameRoom> {
    const room = await prisma.gameRoom.findUnique({
      where: { id: roomId },
      include: {
        players: true,
      },
    });

    if (!room) throw new Error('Room not found');
    return room;
  }

  async getAvailableRooms(gameType?: string): Promise<GameRoom[]> {
    return await prisma.gameRoom.findMany({
      where: {
        status: 'WAITING',
        ...(gameType && { gameType }),
      },
      include: {
        players: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserRooms(userId: string): Promise<GameRoom[]> {
    return await prisma.gameRoom.findMany({
      where: {
        players: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        players: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async setPlayerReady(roomId: string, userId: string, ready: boolean): Promise<void> {
    await prisma.roomPlayer.updateMany({
      where: {
        gameRoomId: roomId,
        userId: userId,
      },
      data: {
        isReady: ready,
      },
    });
  }

  async startGame(roomId: string, userId: string): Promise<string> {
    const room = await this.getRoom(roomId);

    if (room.creatorId !== userId) {
      throw new Error('Only room creator can start the game');
    }

    const players = await prisma.roomPlayer.findMany({
      where: { gameRoomId: roomId },
    });

    if (players.length < room.minPlayers) {
      throw new Error('Not enough players');
    }

    if (!players.every((p) => p.isReady)) {
      throw new Error('All players must be ready');
    }

    // Créer l'état de jeu
    const gameState = await prisma.gameState.create({
      data: {
        roomId: roomId,
        gameType: room.gameType,
        currentPlayerId: players[0].userId || players[0].id,
        players: JSON.stringify(
          players.map((p) => ({
            id: p.userId || p.id,
            name: p.name,
            position: p.position,
            score: 0,
            isActive: true,
            isAI: p.isAI,
          })),
        ),
        pot: room.totalPot,
        status: 'PLAYING',
        turn: 1,
        metadata: {},
      },
    });

    // Mettre à jour le statut de la salle
    await prisma.gameRoom.update({
      where: { id: roomId },
      data: {
        status: 'IN_PROGRESS',
        gameStateId: gameState.id,
      },
    });

    return gameState.id;
  }

  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

export const gameService = GameService.getInstance();
```

### 3.6 Service de transactions

**Fichier : `lib/services/transaction.service.ts`**

```typescript
import { Transaction, TransactionType, TransactionStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

class TransactionService {
  private static instance: TransactionService;

  private constructor() {}

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  async getUserTransactions(
    userId: string,
    limit: number = 10,
    type?: TransactionType,
  ): Promise<Transaction[]> {
    return await prisma.transaction.findMany({
      where: {
        userId,
        ...(type && { type }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return await prisma.transaction.findUnique({
      where: { id },
    });
  }

  async getTransactionStats(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
    });

    const stats = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalWins: 0,
      totalStakes: 0,
      netProfit: 0,
    };

    transactions.forEach((tx) => {
      switch (tx.type) {
        case 'DEPOSIT':
          stats.totalDeposits += tx.koras || 0;
          break;
        case 'WITHDRAWAL':
          stats.totalWithdrawals += tx.koras || 0;
          break;
        case 'GAME_WIN':
          stats.totalWins += tx.koras || 0;
          break;
        case 'GAME_STAKE':
          stats.totalStakes += tx.koras || 0;
          break;
      }
    });

    stats.netProfit = stats.totalWins - stats.totalStakes;

    return stats;
  }
}

export const transactionService = TransactionService.getInstance();
```

## 🎣 Phase 4 : Nouveaux hooks React

### 4.1 Hook d'authentification

**Fichier : `hooks/useAuth.ts`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/services/auth.service';
import type { Session } from '@/lib/auth';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const currentSession = await authService.getSession();
      setSession(currentSession);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    user: session?.user,
    loading,
    isAuthenticated: !!session,
    refresh: loadSession,
  };
}
```

### 4.2 Hook utilisateur

**Fichier : `hooks/useUser.ts`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { User } from '@prisma/client';
import { userService } from '@/lib/services/user.service';

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const currentUser = await userService.getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: any) => {
    if (!user) return;

    try {
      const updated = await userService.updateUser(user.id, data);
      setUser(updated);
      return updated;
    } catch (err) {
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    refresh: loadUser,
    update: updateUser,
  };
}
```

### 4.3 Hook de jeu

**Fichier : `hooks/useGame.ts`**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { GameRoom } from '@prisma/client';
import { gameService, CreateRoomDto } from '@/lib/services/game.service';

export function useGame() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createRoom = useCallback(async (userId: string, data: CreateRoomDto) => {
    try {
      setLoading(true);
      setError(null);
      const room = await gameService.createRoom(userId, data);
      return room;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (roomId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const room = await gameService.joinRoom(roomId, userId);
      return room;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailableRooms = useCallback(async (gameType?: string) => {
    try {
      setLoading(true);
      setError(null);
      const rooms = await gameService.getAvailableRooms(gameType);
      return rooms;
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createRoom,
    joinRoom,
    getAvailableRooms,
    getRoom: gameService.getRoom,
    getUserRooms: gameService.getUserRooms,
    setPlayerReady: gameService.setPlayerReady,
    startGame: gameService.startGame,
  };
}
```

## 🔄 Phase 5 : Mise à jour des pages

### 5.1 Exemple de page Koras mise à jour

**Fichier : `app/(authenticated)/koras/page.tsx`**

```typescript
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconCoin, IconLoader2 } from '@tabler/icons-react';
import { useCurrentUser } from '@/hooks/useUser';
import { paymentService } from '@/lib/services/payment.service';
import { toast } from 'sonner';

export default function KorasPage() {
  const { user, refresh } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  const handleDeposit = async () => {
    if (!user || !depositAmount) return;

    try {
      setLoading(true);
      const amountFCFA = parseInt(depositAmount);

      // Simuler un dépôt
      await paymentService.depositKoras(
        user.id,
        amountFCFA,
        `REF-${Date.now()}`
      );

      toast.success('Dépôt effectué avec succès !');
      setDepositAmount('');
      await refresh(); // Rafraîchir l'utilisateur
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du dépôt');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gestion des Koras</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCoin className="h-6 w-6" />
            Solde actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{user.koras} Koras</p>
          <p className="text-muted-foreground">
            ≈ {user.koras * 10} FCFA
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acheter des Koras</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="number"
              placeholder="Montant en FCFA"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            {depositAmount && (
              <p className="text-sm text-muted-foreground mt-1">
                Vous recevrez {parseInt(depositAmount) / 10} Koras
              </p>
            )}
          </div>

          <Button
            onClick={handleDeposit}
            disabled={loading || !depositAmount}
            className="w-full"
          >
            {loading ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              'Acheter'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5.2 Exemple de page Lobby mise à jour

**Fichier : `app/(authenticated)/games/[gameType]/lobby/page.tsx`**

```typescript
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameRoom } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconUsers, IconCoin, IconPlus } from '@tabler/icons-react';
import { useGame } from '@/hooks/useGame';
import { useCurrentUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import Link from 'next/link';

interface LobbyPageProps {
  params: { gameType: string };
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { getAvailableRooms, joinRoom, loading } = useGame();
  const [rooms, setRooms] = useState<GameRoom[]>([]);

  useEffect(() => {
    loadRooms();
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(loadRooms, 10000);
    return () => clearInterval(interval);
  }, [params.gameType]);

  const loadRooms = async () => {
    const availableRooms = await getAvailableRooms(params.gameType);
    setRooms(availableRooms);
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      await joinRoom(roomId, user.id);
      router.push(`/games/${params.gameType}/room/${roomId}`);
    } catch (error: any) {
      toast.error(error.message || 'Impossible de rejoindre la salle');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Salles de {params.gameType}</h1>
        <Link href={`/games/${params.gameType}/create`}>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Créer une salle
          </Button>
        </Link>
      </div>

      {loading ? (
        <div>Chargement...</div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Aucune salle disponible
            </p>
            <Link href={`/games/${params.gameType}/create`}>
              <Button>Créer la première salle</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Salle de {room.creatorName}
                </CardTitle>
                <Badge variant="outline">
                  {room.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <IconCoin className="h-4 w-4" />
                    {room.stake} Koras
                  </span>
                  <span className="flex items-center gap-1">
                    <IconUsers className="h-4 w-4" />
                    {room.players.length}/{room.maxPlayers}
                  </span>
                </div>

                <Button
                  onClick={() => handleJoinRoom(room.id)}
                  className="w-full"
                  disabled={room.players.length >= room.maxPlayers}
                >
                  {room.players.length >= room.maxPlayers ? 'Pleine' : 'Rejoindre'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 🧹 Phase 6 : Nettoyage final

### 6.1 Mise à jour des imports

Rechercher et remplacer dans tous les fichiers :

- `import { useInjection } from '@/hooks/useInjection'` → Supprimer
- `import { TYPES } from '@/lib/di/types'` → Supprimer
- `import { injectable, inject } from 'inversify'` → Supprimer
- `@injectable()` → Supprimer
- `@inject(TYPES.xxx)` → Supprimer

### 6.2 Variables d'environnement

**Fichier : `.env.example`**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lamap241"

# Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:4000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:4000"
```

### 6.3 Scripts package.json

**Fichier : `package.json`**

```json
{
  "scripts": {
    "dev": "next dev --experimental-https --port 4000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

## 📄 Phase 6 : Modifications des pages existantes

### 6.1 Page Dashboard

**Fichier : `app/(authenticated)/dashboard/page.tsx`**

**Changements nécessaires :**

```typescript
// ❌ SUPPRIMER
import { useGameRoomService, useTransactionService } from '@/hooks/useInjection';
import { useUser } from '@/app/user-provider';

// ✅ AJOUTER
import { gameService } from '@/lib/services/game.service';
import { transactionService } from '@/lib/services/transaction.service';
import { useCurrentUser } from '@/hooks/useUser';

// ❌ ANCIEN CODE
const gameRoomService = useGameRoomService();
const transactionService = useTransactionService();
const rooms = await gameRoomService.getUserRooms(user.id);

// ✅ NOUVEAU CODE
const { user } = useCurrentUser();
const rooms = await gameService.getUserRooms(user.id);
const transactions = await transactionService.getUserTransactions(user.id);
```

### 6.2 Page Account

**Fichier : `app/(authenticated)/account/page.tsx`**

**Changements nécessaires :**

```typescript
// ❌ SUPPRIMER
import { authClient } from '@/lib/auth-client';

// ✅ AJOUTER
import { useCurrentUser } from '@/hooks/useUser';
import { userService } from '@/lib/services/user.service';

// ❌ ANCIEN CODE
const { data: session } = await authClient.getSession();
setFullname(data?.user?.name ?? '');

// ✅ NOUVEAU CODE
const { user, update } = useCurrentUser();
setFullname(user?.name || '');

// Pour la mise à jour
const handleUpdate = async () => {
  try {
    await update({ name: fullname, username });
    toast.success('Profil mis à jour');
  } catch (error) {
    toast.error('Erreur lors de la mise à jour');
  }
};
```

### 6.3 Page Koras

**Fichier : `app/(authenticated)/koras/page.tsx`**

**Changements nécessaires :**

```typescript
// ❌ SUPPRIMER
import { paymentService as oldPaymentService } from '@/lib/garame/core/payment-service';
import { gameStore } from '@/lib/garame/core/game-store';

// ✅ AJOUTER
import { paymentService } from '@/lib/services/payment.service';
import { useCurrentUser } from '@/hooks/useUser';

// ❌ ANCIEN CODE
const currentUser = await gameStore.getCurrentPlayer();
await oldPaymentService.processStake(currentUser.id, -amount, 'deposit');

// ✅ NOUVEAU CODE
const { user, refresh } = useCurrentUser();
await paymentService.depositKoras(user.id, amount, reference);
await refresh(); // Rafraîchir le solde
```

### 6.4 Page Games Lobby

**Fichier : `app/(authenticated)/games/[gameType]/lobby/page.tsx`**

**Changements nécessaires :**

```typescript
// ❌ SUPPRIMER
import { useGameRoomService, useEventBus } from '@/hooks/useInjection';

// ✅ AJOUTER
import { gameService } from '@/lib/services/game.service';
import { useGame } from '@/hooks/useGame';
import { useCurrentUser } from '@/hooks/useUser';

// ❌ ANCIEN CODE
const gameRoomService = useGameRoomService();
const eventBus = useEventBus();
const availableRooms = await gameRoomService.getAvailableRooms(params.gameType);
await gameRoomService.joinRoom(roomId);

// ✅ NOUVEAU CODE
const { user } = useCurrentUser();
const { joinRoom, getAvailableRooms } = useGame();
const rooms = await getAvailableRooms(params.gameType);
await joinRoom(roomId, user.id);
```

### 6.5 Page Create Room

**Fichier : `app/(authenticated)/games/[gameType]/create/page.tsx`**

**Changements nécessaires :**

```typescript
// ❌ SUPPRIMER
import { useGameRoomService, usePaymentService } from '@/hooks/useInjection';
import { useUser } from '@/app/user-provider';

// ✅ AJOUTER
import { useGame } from '@/hooks/useGame';
import { useCurrentUser } from '@/hooks/useUser';
import { paymentService } from '@/lib/services/payment.service';

// ❌ ANCIEN CODE
const gameRoomService = useGameRoomService();
const paymentService = usePaymentService();
const room = await gameRoomService.createRoom(params.gameType, settings.stake, settings);

// ✅ NOUVEAU CODE
const { user } = useCurrentUser();
const { createRoom } = useGame();
const canAfford = await paymentService.canAffordStake(user.id, settings.stake);
if (!canAfford) {
  toast.error('Solde insuffisant');
  return;
}
const room = await createRoom(user.id, {
  gameType: params.gameType,
  stake: settings.stake,
  ...settings,
});
```

### 6.6 Page Room

**Fichier : `app/(authenticated)/games/[gameType]/room/[roomId]/page.tsx`**

**Changements nécessaires :**

```typescript
// ❌ SUPPRIMER
import { useGameRoomService, useEventBus } from '@/hooks/useInjection';

// ✅ AJOUTER
import { gameService } from '@/lib/services/game.service';
import { useCurrentUser } from '@/hooks/useUser';

// ❌ ANCIEN CODE
const gameRoomService = useGameRoomService();
const eventBus = useEventBus();
await gameRoomService.setPlayerReady(room.id, user.id, !isReady);
await gameRoomService.startGame(room.id);

// ✅ NOUVEAU CODE
const { user } = useCurrentUser();
await gameService.setPlayerReady(room.id, user.id, !isReady);
const gameStateId = await gameService.startGame(room.id, user.id);
```

### 6.7 Providers à modifier

**Fichier : `providers/user-provider.tsx` (si existe)**

```typescript
// ❌ SUPPRIMER COMPLÈTEMENT L'ANCIEN PROVIDER

// ✅ CRÉER UN NOUVEAU PROVIDER SIMPLE (optionnel)
"use client";

import React, { createContext, useContext } from "react";
import { useCurrentUser } from "@/hooks/useUser";

const UserContext = createContext<ReturnType<typeof useCurrentUser> | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const userState = useCurrentUser();

  return (
    <UserContext.Provider value={userState}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};
```

### 6.8 Composants à modifier

**Tous les composants qui utilisent l'injection devront être modifiés :**

```typescript
// Exemple : ActiveGamesCard
// ❌ ANCIEN
import { useGameRoomService } from '@/hooks/useInjection';
const gameRoomService = useGameRoomService();

// ✅ NOUVEAU
import { gameService } from '@/lib/services/game.service';
// Utiliser directement gameService
```

## 🧹 Phase 7 : Nettoyage final

### 7.1 Mise à jour des imports dans tous les fichiers

**Script bash pour trouver tous les fichiers à modifier :**

```bash
# Trouver tous les fichiers qui importent useInjection
grep -r "useInjection" app/ components/ --include="*.tsx" --include="*.ts"

# Trouver tous les fichiers qui importent des types IoC
grep -r "TYPES\." app/ components/ --include="*.tsx" --include="*.ts"

# Trouver tous les fichiers avec @injectable
grep -r "@injectable" lib/ --include="*.tsx" --include="*.ts"
```

### 7.2 Checklist de migration

- [x] Supprimer tous les fichiers IoC
- [x] Créer `lib/db/prisma.ts`
- [x] Créer tous les services simplifiés
- [x] Créer les nouveaux hooks
- [x] Migrer `app/(authenticated)/koras/page.tsx`
- [x] Migrer `app/(authenticated)/dashboard/page.tsx`
- [x] Migrer `app/(authenticated)/account/page.tsx`
- [ ] Migrer `app/(authenticated)/games/page.tsx`
- [x] Migrer `app/(authenticated)/games/[gameType]/lobby/page.tsx`
- [ ] Migrer `app/(authenticated)/games/[gameType]/create/page.tsx`
- [ ] Migrer `app/(authenticated)/games/[gameType]/room/[roomId]/page.tsx`
- [ ] Migrer `app/(authenticated)/games/[gameType]/play/[gameId]/page.tsx`
- [ ] Migrer `app/(authenticated)/transactions/page.tsx`
- [ ] Migrer `app/(authenticated)/games/history/page.tsx`
- [x] Migrer le provider utilisateur (`providers/user-provider.tsx`)
- [x] Migrer le provider de jeu (`providers/game-provider.tsx`)
- [x] Migrer le provider de notifications (`providers/notification-provider.tsx`)
- [ ] Migrer tous les composants
- [x] Supprimer les imports inutiles
- [x] Désinstaller les dépendances IoC (inversify, reflect-metadata)
- [ ] Tester l'application complète

## ✅ Avantages de cette nouvelle architecture

1. **Simplicité** : Plus de configuration IoC complexe
2. **Performances** : Moins d'overhead, imports directs
3. **Débugage** : Plus facile de suivre le code
4. **Type-safety** : TypeScript fonctionne mieux sans l'IoC
5. **Prisma direct** : Utilisation native avec transactions
6. **Maintenabilité** : Code plus simple à comprendre

## 🚀 Ordre d'exécution

1. **Backup** : Faire une sauvegarde du projet actuel
2. **Supprimer** : Retirer tous les fichiers IoC
3. **Créer** : Implémenter les nouveaux services
4. **Créer** : Implémenter les nouveaux hooks
5. **Migrer** : Mettre à jour les pages une par une (commencer par les plus simples)
6. **Tester** : Vérifier chaque page après migration
7. **Nettoyer** : Supprimer tous les imports inutiles

Cette approche vous donnera une application plus simple, plus rapide et plus facile à maintenir.
