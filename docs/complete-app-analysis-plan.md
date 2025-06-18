# Plan complet d'analyse et de correction de l'application LaMap241

## 🔍 Analyse de l'état actuel

### 1. Problèmes identifiés

#### a) **Container IoC et Switch Mock/Réel**
- ❌ **Problème principal** : Il existe 2 containers (`container.ts` et `container.server.ts`) ce qui crée de la confusion
- ❌ Le switch entre mock et réel ne fonctionne pas correctement
- ❌ `ClientAuthService` est toujours utilisé même en mode réel
- ❌ Les imports `'use client'` et serveur se mélangent

#### b) **Pages manquantes ou incomplètes**
- ❌ **Dashboard** : Existe mais n'utilise pas les nouveaux services
- ❌ **Transactions** : Page non créée
- ❌ **Games/History** : Page non créée  
- ❌ **Settings** : Deux versions (setting et settings) avec contenu minimal
- ❌ **Register/Signup** : Page non créée
- ❌ **Forgot Password** : Page non créée
- ❌ **Admin** : Toute la section admin manque
- ❌ **Game Create** : Page non créée
- ❌ **Game Play** : Page non créée

#### c) **Services incomplets**
- ❌ **GameEngineService** : Pas d'implémentation trouvée
- ❌ **EventBusService** : Pas d'implémentation trouvée
- ❌ **GarameAIService** : Pas d'implémentation trouvée
- ❌ **MockAuthService** : Pas d'implémentation trouvée
- ❌ **Repositories** : La plupart des repositories ne sont pas implémentés

#### d) **Providers manquants**
- ❌ **UserProvider** : Non créé avec les nouveaux services
- ❌ **GameProvider** : Non créé
- ❌ **NotificationProvider** : Non créé

#### e) **Problèmes d'architecture**
- ❌ Mélange entre l'ancienne architecture (gameStore, paymentService directs) et la nouvelle (injection)
- ❌ Pas de séparation claire client/serveur
- ❌ Le middleware ne protège pas toutes les routes nécessaires

## 📋 Plan de correction détaillé

### Phase 1 : Correction du système d'injection de dépendance

#### 1.1 Unifier les containers

**Fichier : `lib/di/container.ts`**
```typescript
// Supprimer container.server.ts et unifier dans container.ts
// Utiliser une approche conditionnelle basée sur l'environnement

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

const container = new Container();

// Fonction pour configurer le container
export function configureContainer() {
  const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
  const IS_SERVER = typeof window === 'undefined';
  
  // Clear existing bindings
  container.unbindAll();
  
  // Configure based on environment
  if (USE_MOCK) {
    configureMockBindings(container);
  } else {
    configureRealBindings(container, IS_SERVER);
  }
  
  // Services communs
  configureCommonServices(container);
}

// Initialize on import
configureContainer();

export { container };
```

#### 1.2 Créer un hook côté client sécurisé

**Fichier : `hooks/useInjection.ts`**
```typescript
'use client';

import { useMemo } from 'react';
import { container } from '@/lib/di/container';

export function useInjection<T>(serviceIdentifier: symbol): T {
  return useMemo(() => {
    try {
      return container.get<T>(serviceIdentifier);
    } catch (error) {
      console.error(`Failed to inject service: ${serviceIdentifier.toString()}`, error);
      throw error;
    }
  }, [serviceIdentifier]);
}
```

### Phase 2 : Implémenter les services manquants

#### 2.1 GameEngineService

**Fichier : `lib/services/GameEngineService.ts`**
```typescript
import { injectable, inject } from 'inversify';
import { IGameEngineService } from '@/lib/interfaces/services/IGameEngineService';
import { IGameStateRepository } from '@/lib/interfaces/repositories/IGameStateRepository';
import { IEventBusService } from '@/lib/interfaces/services/IEventBusService';
import { BaseGameState, GameAction } from '@/lib/garame/core/types';
import { TYPES } from '@/lib/di/types';
import { gameRegistry } from '@/lib/garame/core/game-registry';

@injectable()
export class GameEngineService implements IGameEngineService {
  constructor(
    @inject(TYPES.GameStateRepository) private gameStateRepository: IGameStateRepository,
    @inject(TYPES.EventBusService) private eventBus: IEventBusService
  ) {}

  async createGame(room: GameRoom): Promise<BaseGameState> {
    const engine = gameRegistry.getEngine(room.gameType);
    const gameState = engine.createInitialState(room);
    await this.gameStateRepository.create(gameState);
    await this.eventBus.emit('game.created', { gameState, room });
    return gameState;
  }

  async processAction(gameId: string, action: GameAction): Promise<BaseGameState> {
    const gameState = await this.gameStateRepository.findById(gameId);
    if (!gameState) throw new Error('Game not found');
    
    const engine = gameRegistry.getEngine(gameState.gameType);
    
    // Valider l'action
    if (!engine.validateAction(gameState, action)) {
      throw new Error('Invalid action');
    }
    
    // Appliquer l'action
    const newState = engine.applyAction(gameState, action);
    
    // Vérifier la condition de victoire
    const { ended, winners } = engine.checkWinCondition(newState);
    if (ended) {
      newState.status = 'finished';
      newState.winners = winners || [];
      await this.eventBus.emit('game.ended', { gameId, winners, gameState: newState });
    }
    
    // Sauvegarder le nouvel état
    await this.gameStateRepository.update(gameId, newState);
    await this.eventBus.emit('game.action_played', { gameId, action, gameState: newState });
    
    return newState;
  }

  // Autres méthodes...
}
```

#### 2.2 EventBusService

**Fichier : `lib/services/EventBusService.ts`**
```typescript
import { injectable } from 'inversify';
import { IEventBusService } from '@/lib/interfaces/services/IEventBusService';

type EventHandler = (data: any) => void | Promise<void>;

@injectable()
export class EventBusService implements IEventBusService {
  private events: Map<string, Set<EventHandler>> = new Map();
  private asyncQueue: Promise<void> = Promise.resolve();

  async emit(event: string, data: any): Promise<void> {
    const handlers = this.events.get(event);
    if (!handlers || handlers.size === 0) return;

    // Queue async operations to maintain order
    this.asyncQueue = this.asyncQueue.then(async () => {
      const promises = Array.from(handlers).map(async (handler) => {
        try {
          await handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
      await Promise.all(promises);
    });

    await this.asyncQueue;
  }

  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  once(event: string, handler: EventHandler): void {
    const onceHandler: EventHandler = async (data) => {
      await handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}
```

### Phase 3 : Créer les providers manquants

#### 3.1 UserProvider avec injection

**Fichier : `providers/user-provider.tsx`**
```typescript
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@prisma/client";
import { useUserService, useAuthService } from "@/hooks/useInjection";

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const userService = useUserService();
  const authService = useAuthService();

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        const currentUser = await userService.getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err as Error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [authService, userService]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const refreshUser = async () => {
    await loadUser();
  };

  const updateBalance = useCallback((newBalance: number) => {
    if (user) {
      setUser(prev => prev ? { ...prev, koras: newBalance } : null);
    }
  }, [user]);

  const value = {
    user,
    loading,
    error,
    refreshUser,
    updateBalance,
    isAuthenticated
  };

  return (
    <UserContext.Provider value={value}>
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

### Phase 4 : Implémenter les pages manquantes

#### 4.1 Page Dashboard mise à jour

**Fichier : `app/(authenticated)/dashboard/page.tsx`**
```typescript
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconCoin, IconTrophy, IconCards, IconChartBar, IconLoader2 } from '@tabler/icons-react';
import Link from 'next/link';
import { useUser } from '@/providers/user-provider';
import { useGameRoomService, usePaymentService } from '@/hooks/useInjection';
import { GameRoom } from '@/lib/garame/core/types';
import { QuickDepositModal } from '@/components/modals/quick-deposit-modal';
import { ActiveGamesCard } from '@/components/dashboard/active-games-card';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const gameRoomService = useGameRoomService();
  const paymentService = usePaymentService();
  
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalWins: 0,
    winRate: 0,
    totalEarnings: 0
  });
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Charger les salles actives
      const rooms = await gameRoomService.getUserRooms(user.id);
      setActiveRooms(rooms.filter(r => 
        r.status === 'waiting' || r.status === 'in_progress'
      ));

      // Calculer les statistiques
      const transactions = await paymentService.getTransactionHistory(user.id, 100);
      const wins = transactions.filter(t => t.type === 'GAME_WIN');
      const totalEarnings = wins.reduce((sum, t) => sum + (t.koras || 0), 0);

      const winRate = user.totalGames > 0 
        ? Math.round((user.totalWins / user.totalGames) * 100) 
        : 0;

      setStats({
        totalGames: user.totalGames,
        totalWins: user.totalWins,
        winRate,
        totalEarnings
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête avec solde */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.name || user?.username} !
          </p>
        </div>
        <Card className="border-primary w-full sm:w-auto">
          <CardContent className="flex items-center gap-4 p-4">
            <IconCoin className="h-8 w-8 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Solde</p>
              <p className="text-2xl font-bold">{user?.koras || 0} Koras</p>
              <p className="text-xs text-muted-foreground">
                ≈ {(user?.koras || 0) * 10} FCFA
              </p>
            </div>
            <Button size="sm" onClick={() => setShowDepositModal(true)}>
              Recharger
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={IconCards}
          title="Parties jouées"
          value={stats.totalGames}
          description="Total de parties"
        />
        <StatCard
          icon={IconTrophy}
          title="Victoires"
          value={stats.totalWins}
          description={`${stats.winRate}% de réussite`}
        />
        <StatCard
          icon={IconChartBar}
          title="Gains totaux"
          value={`${stats.totalEarnings}`}
          description="Koras gagnés"
        />
        <StatCard
          icon={IconCoin}
          title="En jeu"
          value={activeRooms.length}
          description="Parties actives"
        />
      </div>

      {/* Actions rapides */}
      <QuickActionsCard />

      {/* Parties actives */}
      {activeRooms.length > 0 && (
        <ActiveGamesCard rooms={activeRooms} />
      )}

      {/* Transactions récentes */}
      <RecentTransactions userId={user?.id || ''} limit={5} />

      {/* Modal de dépôt */}
      <QuickDepositModal 
        open={showDepositModal} 
        onClose={() => setShowDepositModal(false)} 
      />
    </div>
  );
}

// Composants auxiliaires
function StatCard({ icon: Icon, title, value, description }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
        <CardDescription>Commencez une nouvelle partie</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/games/garame/create">
          <Button variant="outline" className="w-full h-24 flex-col gap-2">
            <IconCards className="h-8 w-8" />
            <span>Créer une partie</span>
          </Button>
        </Link>
        <Link href="/games/garame/lobby">
          <Button variant="outline" className="w-full h-24 flex-col gap-2">
            <IconTrophy className="h-8 w-8" />
            <span>Rejoindre</span>
          </Button>
        </Link>
        <Link href="/koras">
          <Button variant="outline" className="w-full h-24 flex-col gap-2">
            <IconCoin className="h-8 w-8" />
            <span>Acheter Koras</span>
          </Button>
        </Link>
        <Link href="/games/history">
          <Button variant="outline" className="w-full h-24 flex-col gap-2">
            <IconChartBar className="h-8 w-8" />
            <span>Historique</span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="h-32 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}
```

#### 4.2 Page Transactions

**Fichier : `app/(authenticated)/transactions/page.tsx`**
```typescript
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  IconCoin, 
  IconArrowUp, 
  IconArrowDown, 
  IconTrophy,
  IconShoppingCart,
  IconPercentage,
  IconLoader2
} from '@tabler/icons-react';
import { useUser } from '@/providers/user-provider';
import { usePaymentService } from '@/hooks/useInjection';
import { Transaction } from '@/lib/interfaces/repositories/ITransactionRepository';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TransactionsPage() {
  const { user } = useUser();
  const paymentService = usePaymentService();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'games'>('all');

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, filter]);

  const loadTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allTransactions = await paymentService.getTransactionHistory(user.id, 50);
      
      // Filtrer selon le type
      let filtered = allTransactions;
      switch (filter) {
        case 'deposits':
          filtered = allTransactions.filter(t => t.type === 'DEPOSIT');
          break;
        case 'withdrawals':
          filtered = allTransactions.filter(t => t.type === 'WITHDRAWAL');
          break;
        case 'games':
          filtered = allTransactions.filter(t => 
            t.type === 'GAME_STAKE' || t.type === 'GAME_WIN'
          );
          break;
      }
      
      setTransactions(filtered);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return <IconArrowDown className="h-5 w-5 text-green-500" />;
      case 'WITHDRAWAL': return <IconArrowUp className="h-5 w-5 text-red-500" />;
      case 'GAME_STAKE': return <IconCoin className="h-5 w-5 text-yellow-500" />;
      case 'GAME_WIN': return <IconTrophy className="h-5 w-5 text-green-500" />;
      case 'BUY_KORAS': return <IconShoppingCart className="h-5 w-5 text-blue-500" />;
      case 'COMMISSION': return <IconPercentage className="h-5 w-5 text-gray-500" />;
      default: return <IconCoin className="h-5 w-5" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'Dépôt';
      case 'WITHDRAWAL': return 'Retrait';
      case 'GAME_STAKE': return 'Mise';
      case 'GAME_WIN': return 'Gain';
      case 'BUY_KORAS': return 'Achat';
      case 'COMMISSION': return 'Commission';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default">Complété</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">En attente</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Historique des transactions</h1>
        <p className="text-muted-foreground">
          Consultez tous vos mouvements de Koras
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tout</TabsTrigger>
          <TabsTrigger value="deposits">Dépôts</TabsTrigger>
          <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
          <TabsTrigger value="games">Jeux</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Aucune transaction trouvée
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-semibold">
                            {getTransactionLabel(transaction.type)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(transaction.createdAt), {
                              addSuffix: true,
                              locale: fr
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          transaction.type === 'GAME_WIN' || transaction.type === 'DEPOSIT'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'GAME_WIN' || transaction.type === 'DEPOSIT' ? '+' : '-'}
                          {transaction.koras || 0} Koras
                        </p>
                        {transaction.amount && (
                          <p className="text-sm text-muted-foreground">
                            {transaction.amount} FCFA
                          </p>
                        )}
                        <div className="mt-1">
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### 4.3 Page Historique des parties

**Fichier : `app/(authenticated)/games/history/page.tsx`**
```typescript
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  IconTrophy, 
  IconX, 
  IconCoin,
  IconCalendar,
  IconClock,
  IconUsers,
  IconLoader2
} from '@tabler/icons-react';
import { useUser } from '@/providers/user-provider';
import { useGameStateService } from '@/hooks/useInjection';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GameHistory {
  id: string;
  gameType: string;
  status: 'finished' | 'abandoned';
  isWinner: boolean;
  stake: number;
  earnings: number;
  opponents: string[];
  duration: number;
  startedAt: Date;
  endedAt: Date;
}

export default function GamesHistoryPage() {
  const { user } = useUser();
  const gameStateService = useGameStateService();
  
  const [games, setGames] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    totalEarnings: 0,
    totalLosses: 0,
    winRate: 0
  });

  useEffect(() => {
    if (user) {
      loadGameHistory();
    }
  }, [user]);

  const loadGameHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // TODO: Implémenter getPlayerGameHistory dans GameStateService
      // Pour le moment, utiliser des données mockées
      const mockGames: GameHistory[] = [
        {
          id: 'game-1',
          gameType: 'garame',
          status: 'finished',
          isWinner: true,
          stake: 100,
          earnings: 180,
          opponents: ['Player2'],
          duration: 600,
          startedAt: new Date(Date.now() - 3600000),
          endedAt: new Date(Date.now() - 3000000)
        },
        {
          id: 'game-2',
          gameType: 'garame',
          status: 'finished',
          isWinner: false,
          stake: 50,
          earnings: 0,
          opponents: ['Bot Easy'],
          duration: 450,
          startedAt: new Date(Date.now() - 86400000),
          endedAt: new Date(Date.now() - 85950000)
        }
      ];
      
      setGames(mockGames);
      
      // Calculer les statistiques
      const wins = mockGames.filter(g => g.isWinner).length;
      const losses = mockGames.filter(g => !g.isWinner).length;
      const totalEarnings = mockGames.reduce((sum, g) => sum + (g.isWinner ? g.earnings : 0), 0);
      const totalLosses = mockGames.reduce((sum, g) => sum + (!g.isWinner ? g.stake : 0), 0);
      
      setStats({
        totalGames: mockGames.length,
        wins,
        losses,
        totalEarnings,
        totalLosses,
        winRate: mockGames.length > 0 ? Math.round((wins / mockGames.length) * 100) : 0
      });
      
    } catch (error) {
      console.error('Error loading game history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Historique des parties</h1>
        <p className="text-muted-foreground">
          Consultez vos performances passées
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          label="Parties jouées"
          value={stats.totalGames}
          icon={<IconCalendar className="h-4 w-4" />}
        />
        <StatCard
          label="Victoires"
          value={stats.wins}
          icon={<IconTrophy className="h-4 w-4" />}
          variant="success"
        />
        <StatCard
          label="Défaites"
          value={stats.losses}
          icon={<IconX className="h-4 w-4" />}
          variant="danger"
        />
        <StatCard
          label="Taux de victoire"
          value={`${stats.winRate}%`}
          icon={<IconTrophy className="h-4 w-4" />}
        />
        <StatCard
          label="Gains totaux"
          value={`${stats.totalEarnings} K`}
          icon={<IconCoin className="h-4 w-4" />}
          variant="success"
        />
        <StatCard
          label="Pertes totales"
          value={`${stats.totalLosses} K`}
          icon={<IconCoin className="h-4 w-4" />}
          variant="danger"
        />
      </div>

      {/* Liste des parties */}
      {games.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore joué de parties
            </p>
            <Button asChild>
              <a href="/games">Commencer à jouer</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <Card key={game.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      game.isWinner ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {game.isWinner ? (
                        <IconTrophy className="h-6 w-6 text-green-600" />
                      ) : (
                        <IconX className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg capitalize">
                        {game.gameType}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <IconUsers className="h-4 w-4" />
                          vs {game.opponents.join(', ')}
                        </span>
                        <span className="flex items-center gap-1">
                          <IconClock className="h-4 w-4" />
                          {Math.floor(game.duration / 60)}m {game.duration % 60}s
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(game.endedAt, {
                          addSuffix: true,
                          locale: fr
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Mise</p>
                      <p className="font-semibold">{game.stake} Koras</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Résultat</p>
                      <p className={`font-bold text-lg ${
                        game.isWinner ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {game.isWinner ? `+${game.earnings}` : `-${game.stake}`} Koras
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  variant = 'default' 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'danger';
}) {
  const colorClasses = {
    default: 'text-foreground',
    success: 'text-green-600',
    danger: 'text-red-600'
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold ${colorClasses[variant]}`}>
              {value}
            </p>
          </div>
          <div className="text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Phase 5 : Corriger les problèmes d'architecture

#### 5.1 Mise à jour du middleware

**Fichier : `middleware.ts`**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const publicRoutes = ["/", "/login", "/signup", "/forgot-password"];
const authRoutes = ["/login", "/signup", "/forgot-password"];
const protectedRoutes = [
  "/dashboard",
  "/games", 
  "/account", 
  "/koras", 
  "/settings",
  "/transactions",
  "/admin"
];

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from auth pages
  if (sessionCookie && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users trying to access protected routes
  if (!sessionCookie && protectedRoutes.some(route => pathname.startsWith(route))) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

#### 5.2 Configuration des variables d'environnement

**Fichier : `.env.example`**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lamap241?schema=public"

# Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:4000"

# Mock Mode
NEXT_PUBLIC_USE_MOCK=true

# Mobile Money (Production)
AIRTEL_API_KEY=""
AIRTEL_API_SECRET=""
MOOV_API_KEY=""
MOOV_API_SECRET=""

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:4000"
NEXT_PUBLIC_KORA_TO_FCFA_RATE=10
NEXT_PUBLIC_COMMISSION_RATE=0.10
```

### Phase 6 : Scripts et commandes

#### 6.1 Mise à jour de package.json

**Fichier : `package.json`**
```json
{
  "scripts": {
    "dev": "next dev --experimental-https --port 4000",
    "dev:mock": "NEXT_PUBLIC_USE_MOCK=true next dev --experimental-https --port 4000",
    "dev:real": "NEXT_PUBLIC_USE_MOCK=false next dev --experimental-https --port 4000",
    "build": "next build",
    "build:mock": "NEXT_PUBLIC_USE_MOCK=true next build",
    "build:real": "NEXT_PUBLIC_USE_MOCK=false next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "postinstall": "prisma generate"
  }
}
```

## 📝 Résumé des actions à effectuer

1. **Unifier les containers IoC** (Priorité: HAUTE)
   - Supprimer `container.server.ts`
   - Refactorer `container.ts` pour gérer client/serveur
   - Corriger le switch mock/réel

2. **Implémenter les services manquants** (Priorité: HAUTE)
   - GameEngineService
   - EventBusService
   - GarameAIService
   - Tous les repositories manquants

3. **Créer les providers** (Priorité: HAUTE)
   - UserProvider avec injection
   - GameProvider
   - NotificationProvider

4. **Implémenter les pages manquantes** (Priorité: MOYENNE)
   - Dashboard (mise à jour)
   - Transactions
   - Games/History
   - Register/Signup
   - Game Create/Play
   - Admin section

5. **Corriger l'architecture** (Priorité: MOYENNE)
   - Middleware
   - Variables d'environnement
   - Scripts npm

6. **Tests et documentation** (Priorité: BASSE)
   - Tests unitaires pour les services
   - Documentation de l'API
   - Guide de déploiement

Cette approche systématique permettra de corriger tous les problèmes identifiés et d'avoir une application fonctionnelle avec une architecture solide.