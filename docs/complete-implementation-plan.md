# Plan complet d'implémentation des pages LaMap241

## Structure globale du projet

```
app/
├── (auth)/                      # Pages publiques (non authentifiées)
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (authenticated)/             # Pages nécessitant authentification
│   ├── dashboard/              # Tableau de bord principal
│   ├── koras/                  # Gestion du portefeuille
│   ├── games/                  # Hub des jeux
│   │   ├── [gameType]/        # Pages spécifiques par jeu
│   │   │   ├── lobby/         # Liste des salles
│   │   │   ├── create/        # Créer une salle
│   │   │   ├── room/[id]/     # Salle d'attente
│   │   │   └── play/[id]/     # Jeu en cours
│   │   └── history/           # Historique des parties
│   ├── account/               # Profil utilisateur
│   ├── transactions/          # Historique des transactions
│   └── settings/              # Paramètres
├── (admin)/                    # Section administration
│   ├── users/
│   ├── games/
│   ├── transactions/
│   └── analytics/
└── layout.tsx                  # Layout principal avec providers
```

## 1. Configuration des Providers

### Fichier: `app/providers.tsx`
```typescript
"use client";

import 'reflect-metadata';
import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { UserProvider } from './user-provider';
import { GameProvider } from './game-provider';
import { NotificationProvider } from './notification-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UserProvider>
        <GameProvider>
          <NotificationProvider>
            {children}
            <Toaster position="top-right" />
          </NotificationProvider>
        </GameProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
```

### Fichier: `app/user-provider.tsx`
```typescript
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@prisma/client";
import { useUserService, useAuthService } from "@/hooks/useInjection";

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const userService = useUserService();
  const authService = useAuthService();

  const loadUser = async () => {
    try {
      setLoading(true);
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const currentUser = await userService.getCurrentUser();
        setUser(currentUser);
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const refreshUser = async () => {
    await loadUser();
  };

  const updateBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, koras: newBalance });
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser, updateBalance }}>
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

## 2. Pages d'Authentification

### Fichier: `app/(auth)/login/page.tsx`
```typescript
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { IconLoader2, IconBrandGoogle, IconPhone } from '@tabler/icons-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authClient.signIn.emailAndPassword({
        email: `${formData.phoneNumber}@lamap241.com`, // Convertir le numéro en email
        password: formData.password
      });
      
      toast.success('Connexion réussie !');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Connexion à LaMap241
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous pour jouer et gagner des Koras
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <div className="relative">
                <IconPhone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+229 XX XX XX XX"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full">
              <IconBrandGoogle className="mr-2 h-4 w-4" />
              Continuer avec Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-primary hover:underline">
                S'inscrire
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

## 3. Dashboard Principal

### Fichier: `app/(authenticated)/dashboard/page.tsx`
```typescript
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconCoin, IconTrophy, IconCards, IconChartBar } from '@tabler/icons-react';
import Link from 'next/link';
import { useUser } from '@/app/user-provider';
import { useGameRoomService, useTransactionService } from '@/hooks/useInjection';
import { GameRoom } from '@/lib/garame/core/types';
import { Skeleton } from '@/components/ui/skeleton';
import { QuickDepositModal } from '@/components/modals/quick-deposit-modal';
import { ActiveGamesCard } from '@/components/dashboard/active-games-card';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const gameRoomService = useGameRoomService();
  const transactionService = useTransactionService();
  
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalWins: 0,
    winRate: 0,
    ranking: 0
  });
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    // Charger les salles actives
    const rooms = await gameRoomService.getUserRooms(user.id);
    setActiveRooms(rooms.filter(r => r.status === 'waiting' || r.status === 'in_progress'));

    // Calculer les statistiques
    const winRate = user.totalGames > 0 
      ? Math.round((user.totalWins / user.totalGames) * 100) 
      : 0;

    setStats({
      totalGames: user.totalGames,
      totalWins: user.totalWins,
      winRate,
      ranking: await calculateRanking(user.totalWins)
    });
  };

  const calculateRanking = async (wins: number): Promise<number> => {
    // Logique de calcul du classement
    // Pour le moment, simulation
    return Math.max(1, 100 - wins * 5);
  };

  if (userLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête avec solde */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.name || user?.username} !
          </p>
        </div>
        <Card className="border-primary">
          <CardContent className="flex items-center gap-4 p-4">
            <IconCoin className="h-8 w-8 text-primary" />
            <div>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          description={`${stats.winRate}% de victoires`}
        />
        <StatCard
          icon={IconChartBar}
          title="Classement"
          value={`#${stats.ranking}`}
          description="Position nationale"
        />
        <StatCard
          icon={IconCoin}
          title="Gains totaux"
          value={`${user?.totalWins * 90} K`}
          description="Koras gagnés"
        />
      </div>

      {/* Actions rapides */}
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
              <span>Rejoindre une partie</span>
            </Button>
          </Link>
          <Link href="/koras">
            <Button variant="outline" className="w-full h-24 flex-col gap-2">
              <IconCoin className="h-8 w-8" />
              <span>Acheter des Koras</span>
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

      {/* Parties actives */}
      {activeRooms.length > 0 && (
        <ActiveGamesCard rooms={activeRooms} />
      )}

      {/* Transactions récentes */}
      <RecentTransactions userId={user?.id || ''} />

      {/* Modal de dépôt rapide */}
      <QuickDepositModal 
        open={showDepositModal} 
        onClose={() => setShowDepositModal(false)} 
      />
    </div>
  );
}

// Composants utilitaires
function StatCard({ icon: Icon, title, value, description }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
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

function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

## 4. Pages de Gestion des Koras

### Fichier: `app/(authenticated)/koras/page.tsx`
```typescript
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { IconCoin, IconArrowDown, IconArrowUp, IconLoader2 } from '@tabler/icons-react';
import { useUser } from '@/app/user-provider';
import { usePaymentService, useMobileMoneyService } from '@/hooks/useInjection';
import { toast } from 'sonner';
import Image from 'next/image';

export default function KorasPage() {
  const { user, updateBalance } = useUser();
  const paymentService = usePaymentService();
  const mobileMoneyService = useMobileMoneyService();

  const [activeTab, setActiveTab] = useState('deposit');
  const [loading, setLoading] = useState(false);
  
  // États pour le dépôt
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

  // États pour le retrait
  const [withdrawKoras, setWithdrawKoras] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState(user?.phoneNumber || '');

  const predefinedAmounts = [
    { koras: 50, fcfa: 500, bonus: 0 },
    { koras: 100, fcfa: 1000, bonus: 10 },
    { koras: 500, fcfa: 5000, bonus: 75 },
    { koras: 1000, fcfa: 10000, bonus: 200 },
  ];

  const handleDeposit = async () => {
    if (!depositAmount || !selectedProvider || !phoneNumber) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      // Initier la transaction Mobile Money
      const transaction = await mobileMoneyService.initiateDeposit(
        phoneNumber,
        parseInt(depositAmount)
      );

      // Afficher les instructions
      toast.info(`Composez *133# et suivez les instructions pour valider le paiement`);

      // Vérifier le statut de la transaction
      const checkStatus = setInterval(async () => {
        const status = await mobileMoneyService.checkTransactionStatus(transaction.id);
        
        if (status.status === 'completed') {
          clearInterval(checkStatus);
          
          // Créditer les Koras
          await paymentService.depositKoras(
            user!.id,
            parseInt(depositAmount),
            transaction.reference
          );

          // Mettre à jour le solde local
          const newBalance = await paymentService.getPlayerBalance(user!.id);
          updateBalance(newBalance);

          toast.success('Dépôt effectué avec succès !');
          setDepositAmount('');
        } else if (status.status === 'failed') {
          clearInterval(checkStatus);
          toast.error('Transaction échouée');
        }
      }, 5000); // Vérifier toutes les 5 secondes

      // Timeout après 5 minutes
      setTimeout(() => {
        clearInterval(checkStatus);
        setLoading(false);
      }, 300000);

    } catch (error) {
      toast.error('Erreur lors du dépôt');
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawKoras || !withdrawPhone) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const korasAmount = parseInt(withdrawKoras);
    if (korasAmount > (user?.koras || 0)) {
      toast.error('Solde insuffisant');
      return;
    }

    setLoading(true);
    try {
      await paymentService.withdrawKoras(user!.id, korasAmount, withdrawPhone);
      
      // Mettre à jour le solde local
      const newBalance = await paymentService.getPlayerBalance(user!.id);
      updateBalance(newBalance);

      toast.success('Retrait initié ! Vous recevrez votre argent sous peu.');
      setWithdrawKoras('');
    } catch (error) {
      toast.error('Erreur lors du retrait');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion des Koras</h1>
        <p className="text-muted-foreground">
          Rechargez votre compte ou retirez vos gains
        </p>
      </div>

      {/* Solde actuel */}
      <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Solde actuel
              </p>
              <p className="text-4xl font-bold flex items-center gap-2">
                <IconCoin className="h-8 w-8" />
                {user?.koras || 0} Koras
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Équivalent: {(user?.koras || 0) * 10} FCFA
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Commission: 10% sur les retraits
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit">
            <IconArrowDown className="mr-2 h-4 w-4" />
            Déposer
          </TabsTrigger>
          <TabsTrigger value="withdraw">
            <IconArrowUp className="mr-2 h-4 w-4" />
            Retirer
          </TabsTrigger>
        </TabsList>

        {/* Onglet Dépôt */}
        <TabsContent value="deposit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acheter des Koras</CardTitle>
              <CardDescription>
                Choisissez un montant et payez via Mobile Money
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Montants prédéfinis */}
              <div className="grid grid-cols-2 gap-4">
                {predefinedAmounts.map((amount) => (
                  <Button
                    key={amount.koras}
                    variant={depositAmount === amount.fcfa.toString() ? 'default' : 'outline'}
                    className="h-auto p-4"
                    onClick={() => setDepositAmount(amount.fcfa.toString())}
                  >
                    <div className="text-left">
                      <p className="font-bold">{amount.koras} Koras</p>
                      <p className="text-sm text-muted-foreground">
                        {amount.fcfa} FCFA
                      </p>
                      {amount.bonus > 0 && (
                        <p className="text-xs text-green-600">
                          +{amount.bonus} Koras bonus!
                        </p>
                      )}
                    </div>
                  </Button>
                ))}
              </div>

              {/* Montant personnalisé */}
              <div className="space-y-2">
                <Label htmlFor="custom-amount">Ou entrez un montant (FCFA)</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="Ex: 2500"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                {depositAmount && (
                  <p className="text-sm text-muted-foreground">
                    Vous recevrez: {Math.floor(parseInt(depositAmount) / 10)} Koras
                  </p>
                )}
              </div>

              {/* Sélection de l'opérateur */}
              <div className="space-y-2">
                <Label>Opérateur Mobile Money</Label>
                <RadioGroup value={selectedProvider} onValueChange={setSelectedProvider}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="airtel" id="airtel" />
                    <Label htmlFor="airtel" className="flex items-center gap-2 cursor-pointer">
                      <Image src="/images/airtel-logo.png" alt="Airtel" width={30} height={30} />
                      Airtel Money
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="moov" id="moov" />
                    <Label htmlFor="moov" className="flex items-center gap-2 cursor-pointer">
                      <Image src="/images/moov-logo.png" alt="Moov" width={30} height={30} />
                      Moov Money
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Numéro de téléphone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+229 XX XX XX XX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleDeposit} 
                disabled={loading || !depositAmount || !selectedProvider}
                className="w-full"
              >
                {loading ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transaction en cours...
                  </>
                ) : (
                  'Procéder au paiement'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Retrait */}
        <TabsContent value="withdraw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retirer des gains</CardTitle>
              <CardDescription>
                Convertissez vos Koras en argent réel (commission de 10%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Montant à retirer */}
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Nombre de Koras à retirer</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="Ex: 100"
                  value={withdrawKoras}
                  onChange={(e) => setWithdrawKoras(e.target.value)}
                  max={user?.koras || 0}
                />
                {withdrawKoras && (
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">
                      Montant brut: {parseInt(withdrawKoras) * 10} FCFA
                    </p>
                    <p className="text-muted-foreground">
                      Commission (10%): {parseInt(withdrawKoras)} FCFA
                    </p>
                    <p className="font-semibold text-green-600">
                      Vous recevrez: {parseInt(withdrawKoras) * 9} FCFA
                    </p>
                  </div>
                )}
              </div>

              {/* Numéro de réception */}
              <div className="space-y-2">
                <Label htmlFor="withdraw-phone">Numéro Mobile Money</Label>
                <Input
                  id="withdraw-phone"
                  type="tel"
                  placeholder="+229 XX XX XX XX"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleWithdraw} 
                disabled={loading || !withdrawKoras || parseInt(withdrawKoras) > (user?.koras || 0)}
                className="w-full"
              >
                {loading ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  'Retirer'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## 5. Hub des Jeux

### Fichier: `app/(authenticated)/games/page.tsx`
```typescript
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconCards, IconPokerChip, IconDice, IconUsers, IconCoin } from '@tabler/icons-react';
import Link from 'next/link';
import { gameRegistry } from '@/lib/garame/core/game-registry';

export default function GamesPage() {
  const games = gameRegistry.getAvailableGames();

  const gameDetails = {
    garame: {
      icon: IconCards,
      color: 'bg-blue-500',
      minStake: 10,
      maxStake: 10000,
      activeRooms: 15,
      onlinePlayers: 42,
      description: 'Jeu de cartes stratégique traditionnel. Gardez la Kora pour marquer des points!',
      rules: [
        'Premier à 10 points gagne',
        'La Kora permet de jouer n\'importe quelle carte',
        'Sans Kora, suivez la couleur',
        'Commission de 10% sur les gains'
      ]
    },
    poker: {
      icon: IconPokerChip,
      color: 'bg-red-500',
      minStake: 50,
      maxStake: 50000,
      activeRooms: 8,
      onlinePlayers: 24,
      description: 'Texas Hold\'em - Le classique du poker. Bluffez et remportez le pot!',
      rules: [
        'Mises avec limite de pot',
        '2 à 8 joueurs par table',
        'Tournois quotidiens',
        'Commission de 10% sur les gains'
      ],
      comingSoon: true
    },
    ludo: {
      icon: IconDice,
      color: 'bg-green-500',
      minStake: 5,
      maxStake: 5000,
      activeRooms: 0,
      onlinePlayers: 0,
      description: 'Jeu de plateau familial. Soyez le premier à ramener tous vos pions!',
      rules: [
        '2 à 4 joueurs',
        'Lancez les dés et avancez',
        'Éliminez les pions adverses',
        'Commission de 10% sur les gains'
      ],
      comingSoon: true
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Choisissez votre jeu</h1>
        <p className="text-muted-foreground">
          Sélectionnez un jeu pour commencer à jouer et gagner des Koras
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(gameDetails).map(([gameId, game]) => {
          const GameIcon = game.icon;
          return (
            <Card 
              key={gameId} 
              className={`relative overflow-hidden ${game.comingSoon ? 'opacity-75' : ''}`}
            >
              {game.comingSoon && (
                <Badge className="absolute top-4 right-4 z-10" variant="secondary">
                  Bientôt disponible
                </Badge>
              )}
              
              <CardHeader>
                <div className={`${game.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4`}>
                  <GameIcon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="capitalize">{gameId}</CardTitle>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Statistiques */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Mise min/max</p>
                    <p className="font-semibold">
                      {game.minStake} - {game.maxStake} Koras
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">En ligne</p>
                    <p className="font-semibold flex items-center gap-1">
                      <IconUsers className="h-4 w-4" />
                      {game.onlinePlayers} joueurs
                    </p>
                  </div>
                </div>

                {/* Règles */}
                <div className="space-y-1">
                  <p className="text-sm font-medium">Règles:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {game.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/games/${gameId}/lobby`} className="flex-1">
                    <Button 
                      variant="default" 
                      className="w-full" 
                      disabled={game.comingSoon}
                    >
                      Jouer maintenant
                    </Button>
                  </Link>
                  <Link href={`/games/${gameId}/create`}>
                    <Button 
                      variant="outline" 
                      disabled={game.comingSoon}
                    >
                      Créer une salle
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section tutoriels */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Nouveau sur LaMap241 ?</CardTitle>
          <CardDescription>
            Apprenez les règles et stratégies de nos jeux
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              📚 Guide du débutant
            </Button>
            <Button variant="outline" className="justify-start">
              🎮 Tutoriel Garame
            </Button>
            <Button variant="outline" className="justify-start">
              💡 Stratégies avancées
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 6. Lobby du Jeu (Liste des salles)

### Fichier: `app/(authenticated)/games/[gameType]/lobby/page.tsx`
```typescript
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconUsers, IconCoin, IconClock, IconRefresh, IconPlus } from '@tabler/icons-react';
import { useGameRoomService, useEventBus } from '@/hooks/useInjection';
import { GameRoom } from '@/lib/garame/core/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LobbyPageProps {
  params: { gameType: string };
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const router = useRouter();
  const gameRoomService = useGameRoomService();
  const eventBus = useEventBus();

  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    stake: 'all',
    status: 'waiting'
  });
  const [searchCode, setSearchCode] = useState('');

  useEffect(() => {
    loadRooms();
    
    // S'abonner aux événements de mise à jour
    eventBus.on('room.created', handleRoomUpdate);
    eventBus.on('room.updated', handleRoomUpdate);
    eventBus.on('room.player_joined', handleRoomUpdate);

    // Rafraîchir automatiquement toutes les 10 secondes
    const interval = setInterval(loadRooms, 10000);

    return () => {
      eventBus.off('room.created', handleRoomUpdate);
      eventBus.off('room.updated', handleRoomUpdate);
      eventBus.off('room.player_joined', handleRoomUpdate);
      clearInterval(interval);
    };
  }, [params.gameType, filter]);

  const loadRooms = async () => {
    try {
      const availableRooms = await gameRoomService.getAvailableRooms(params.gameType);
      
      // Filtrer selon les critères
      let filteredRooms = availableRooms;
      
      if (filter.stake !== 'all') {
        const maxStake = parseInt(filter.stake);
        filteredRooms = filteredRooms.filter(room => room.stake <= maxStake);
      }

      setRooms(filteredRooms);
    } catch (error) {
      toast.error('Erreur lors du chargement des salles');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomUpdate = (data: any) => {
    if (data.room && data.room.gameType === params.gameType) {
      loadRooms();
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await gameRoomService.joinRoom(roomId);
      router.push(`/games/${params.gameType}/room/${roomId}`);
    } catch (error: any) {
      toast.error(error.message || 'Impossible de rejoindre la salle');
    }
  };

  const handleJoinByCode = async () => {
    if (!searchCode) return;
    
    // Chercher la salle par code
    const room = rooms.find(r => r.settings?.roomCode === searchCode);
    if (room) {
      handleJoinRoom(room.id);
    } else {
      toast.error('Code de salle invalide');
    }
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-green-500';
      case 'starting': return 'bg-yellow-500';
      case 'in_progress': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoomStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'En attente';
      case 'starting': return 'Démarre...';
      case 'in_progress': return 'En cours';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold capitalize">
            Salles de {params.gameType}
          </h1>
          <p className="text-muted-foreground">
            Rejoignez une partie ou créez votre propre salle
          </p>
        </div>
        <Link href={`/games/${params.gameType}/create`}>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Créer une salle
          </Button>
        </Link>
      </div>

      {/* Filtres et recherche */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Code de salle"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinByCode()}
              />
            </div>
            <Select value={filter.stake} onValueChange={(value) => setFilter({ ...filter, stake: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Mise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les mises</SelectItem>
                <SelectItem value="100">≤ 100 Koras</SelectItem>
                <SelectItem value="500">≤ 500 Koras</SelectItem>
                <SelectItem value="1000">≤ 1000 Koras</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadRooms} variant="outline">
              <IconRefresh className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des salles */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-48" />
            </Card>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Aucune salle disponible pour le moment
            </p>
            <Link href={`/games/${params.gameType}/create`}>
              <Button>Créer la première salle</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Salle de {room.creatorName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <IconClock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(room.createdAt), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getRoomStatusColor(room.status)}`} />
                    {getRoomStatusText(room.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Mise</p>
                    <p className="font-semibold flex items-center gap-1">
                      <IconCoin className="h-4 w-4" />
                      {room.stake} Koras
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Joueurs</p>
                    <p className="font-semibold flex items-center gap-1">
                      <IconUsers className="h-4 w-4" />
                      {room.players.length}/{room.maxPlayers}
                    </p>
                  </div>
                </div>

                {/* Liste des joueurs */}
                <div className="space-y-1">
                  {room.players.map((player, idx) => (
                    <div key={player.id} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">#{idx + 1}</span>
                      <span className="flex-1 truncate">{player.name}</span>
                      {player.isAI && (
                        <Badge variant="secondary" className="text-xs">
                          IA
                        </Badge>
                      )}
                    </div>
                  ))}
                  {Array.from({ length: room.maxPlayers - room.players.length }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>#{room.players.length + idx + 1}</span>
                      <span className="flex-1">En attente...</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => handleJoinRoom(room.id)}
                  className="w-full"
                  disabled={room.status !== 'waiting' || room.players.length >= room.maxPlayers}
                >
                  {room.players.length >= room.maxPlayers ? 'Salle pleine' : 'Rejoindre'}
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

## 7. Création de Salle

### Fichier: `app/(authenticated)/games/[gameType]/create/page.tsx`
```typescript
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { IconCoin, IconUsers, IconRobot, IconLock } from '@tabler/icons-react';
import { useGameRoomService, usePaymentService } from '@/hooks/useInjection';
import { useUser } from '@/app/user-provider';
import { toast } from 'sonner';

interface CreateRoomPageProps {
  params: { gameType: string };
}

export default function CreateRoomPage({ params }: CreateRoomPageProps) {
  const router = useRouter();
  const { user } = useUser();
  const gameRoomService = useGameRoomService();
  const paymentService = usePaymentService();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    stake: 100,
    isPrivate: false,
    aiPlayers: 0,
    aiDifficulty: 'normal' as 'boa' | 'normal' | 'sensei',
    turnDuration: 30
  });

  const presetStakes = [50, 100, 500, 1000, 5000];

  const handleCreate = async () => {
    if (!user) return;

    // Vérifier le solde
    const canAfford = await paymentService.canAffordStake(user.id, settings.stake);
    if (!canAfford) {
      toast.error('Solde insuffisant pour cette mise');
      return;
    }

    setLoading(true);
    try {
      const room = await gameRoomService.createRoom(params.gameType, settings.stake, {
        privateRoom: settings.isPrivate,
        aiPlayersAllowed: settings.aiPlayers > 0,
        turnDuration: settings.turnDuration
      });

      // Ajouter les joueurs IA si demandé
      for (let i = 0; i < settings.aiPlayers; i++) {
        await gameRoomService.joinRoom(room.id, true, settings.aiDifficulty);
      }

      toast.success('Salle créée avec succès !');
      router.push(`/games/${params.gameType}/room/${room.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Créer une salle de {params.gameType}</h1>
        <p className="text-muted-foreground">
          Configurez votre partie selon vos préférences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres de la partie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mise */}
          <div className="space-y-3">
            <Label>Mise (en Koras)</Label>
            <div className="grid grid-cols-5 gap-2">
              {presetStakes.map((stake) => (
                <Button
                  key={stake}
                  variant={settings.stake === stake ? 'default' : 'outline'}
                  onClick={() => setSettings({ ...settings, stake })}
                  className="relative"
                >
                  <span>{stake}</span>
                  {stake >= 1000 && (
                    <Badge className="absolute -top-2 -right-2 text-xs" variant="secondary">
                      Pro
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.stake}
                onChange={(e) => setSettings({ ...settings, stake: parseInt(e.target.value) || 0 })}
                min={10}
                max={10000}
              />
              <span className="text-sm text-muted-foreground">
                = {settings.stake * 10} FCFA
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Solde actuel: {user?.koras || 0} Koras
            </p>
          </div>

          {/* Joueurs IA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ajouter des joueurs IA</Label>
              <span className="text-sm text-muted-foreground">
                {settings.aiPlayers} IA
              </span>
            </div>
            <Slider
              value={[settings.aiPlayers]}
              onValueChange={([value]) => setSettings({ ...settings, aiPlayers: value })}
              max={params.gameType === 'garame' ? 1 : 3}
              step={1}
            />
            
            {settings.aiPlayers > 0 && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label>Niveau de difficulté de l'IA</Label>
                <RadioGroup 
                  value={settings.aiDifficulty} 
                  onValueChange={(value: any) => setSettings({ ...settings, aiDifficulty: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="boa" id="boa" />
                    <Label htmlFor="boa" className="cursor-pointer">
                      🐍 Boa (Facile) - Fait des erreurs fréquentes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" />
                    <Label htmlFor="normal" className="cursor-pointer">
                      🎯 Normal - Bon défi pour la plupart
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sensei" id="sensei" />
                    <Label htmlFor="sensei" className="cursor-pointer">
                      🥋 Sensei (Maître) - Extrêmement difficile
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          {/* Durée des tours */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Durée par tour</Label>
              <span className="text-sm text-muted-foreground">
                {settings.turnDuration} secondes
              </span>
            </div>
            <Slider
              value={[settings.turnDuration]}
              onValueChange={([value]) => setSettings({ ...settings, turnDuration: value })}
              min={15}
              max={120}
              step={15}
            />
          </div>

          {/* Salle privée */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Salle privée</Label>
              <p className="text-sm text-muted-foreground">
                Seuls les joueurs avec le code peuvent rejoindre
              </p>
            </div>
            <Switch
              checked={settings.isPrivate}
              onCheckedChange={(checked) => setSettings({ ...settings, isPrivate: checked })}
            />
          </div>

          {/* Résumé */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-2">
              <h4 className="font-semibold">Résumé de la partie</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <IconCoin className="h-4 w-4 text-muted-foreground" />
                  <span>Mise: {settings.stake} Koras</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconUsers className="h-4 w-4 text-muted-foreground" />
                  <span>Joueurs: {1 + settings.aiPlayers}/2</span>
                </div>
                {settings.isPrivate && (
                  <div className="flex items-center gap-2">
                    <IconLock className="h-4 w-4 text-muted-foreground" />
                    <span>Salle privée</span>
                  </div>
                )}
                {settings.aiPlayers > 0 && (
                  <div className="flex items-center gap-2">
                    <IconRobot className="h-4 w-4 text-muted-foreground" />
                    <span>IA: {settings.aiDifficulty}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleCreate} 
            disabled={loading || settings.stake > (user?.koras || 0)}
            className="w-full"
            size="lg"
          >
            {loading ? 'Création...' : 'Créer la salle'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 8. Salle d'Attente

### Fichier: `app/(authenticated)/games/[gameType]/room/[roomId]/page.tsx`
```typescript
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { IconCrown, IconRobot, IconCopy, IconUsers, IconCoin, IconLoader2 } from '@tabler/icons-react';
import { useGameRoomService, useEventBus } from '@/hooks/useInjection';
import { useUser } from '@/app/user-provider';
import { GameRoom, RoomPlayer } from '@/lib/garame/core/types';
import { toast } from 'sonner';
import { CountdownTimer } from '@/components/game/countdown-timer';

interface RoomPageProps {
  params: { 
    gameType: string;
    roomId: string;
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const { user } = useUser();
  const gameRoomService = useGameRoomService();
  const eventBus = useEventBus();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    loadRoom();

    // S'abonner aux événements
    eventBus.on('room.updated', handleRoomUpdate);
    eventBus.on('room.player_joined', handleRoomUpdate);
    eventBus.on('room.player_left', handleRoomUpdate);
    eventBus.on('game.starting', handleGameStarting);
    eventBus.on('game.started', handleGameStarted);

    return () => {
      eventBus.off('room.updated', handleRoomUpdate);
      eventBus.off('room.player_joined', handleRoomUpdate);
      eventBus.off('room.player_left', handleRoomUpdate);
      eventBus.off('game.starting', handleGameStarting);
      eventBus.off('game.started', handleGameStarted);
    };
  }, [params.roomId]);

  const loadRoom = async () => {
    try {
      const roomData = await gameRoomService.getRoom(params.roomId);
      if (!roomData) {
        toast.error('Salle introuvable');
        router.push(`/games/${params.gameType}/lobby`);
        return;
      }
      setRoom(roomData);
      
      // Vérifier si le joueur est prêt
      const currentPlayer = roomData.players.find(p => p.id === user?.id);
      setIsReady(currentPlayer?.isReady || false);
    } catch (error) {
      toast.error('Erreur lors du chargement');
      router.push(`/games/${params.gameType}/lobby`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomUpdate = (data: any) => {
    if (data.roomId === params.roomId) {
      loadRoom();
    }
  };

  const handleGameStarting = (data: any) => {
    if (data.roomId === params.roomId) {
      setCountdown(5);
    }
  };

  const handleGameStarted = (data: any) => {
    if (data.roomId === params.roomId) {
      router.push(`/games/${params.gameType}/play/${data.gameStateId}`);
    }
  };

  const toggleReady = async () => {
    if (!room || !user) return;
    
    try {
      await gameRoomService.setPlayerReady(room.id, user.id, !isReady);
      setIsReady(!isReady);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleStartGame = async () => {
    if (!room || room.creatorId !== user?.id) return;

    try {
      const gameStateId = await gameRoomService.startGame(room.id);
      // La redirection se fera via l'événement
    } catch (error: any) {
      toast.error(error.message || 'Impossible de démarrer');
    }
  };

  const handleLeaveRoom = async () => {
    if (!room || !user) return;

    try {
      await gameRoomService.leaveRoom(room.id, user.id);
      router.push(`/games/${params.gameType}/lobby`);
    } catch (error) {
      toast.error('Erreur lors de la sortie');
    }
  };

  const copyRoomCode = () => {
    if (room?.settings?.roomCode) {
      navigator.clipboard.writeText(room.settings.roomCode);
      toast.success('Code copié !');
    }
  };

  const canStartGame = () => {
    if (!room || room.creatorId !== user?.id) return false;
    if (room.players.length < room.minPlayers) return false;
    return room.players.every(p => p.isReady);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {countdown !== null && (
        <CountdownTimer 
          seconds={countdown} 
          onComplete={() => setCountdown(null)}
          message="La partie commence dans"
        />
      )}

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Salle d'attente</h1>
          <p className="text-muted-foreground">
            {params.gameType} - Mise: {room.stake} Koras
          </p>
        </div>
        {room.settings?.privateRoom && room.settings?.roomCode && (
          <Card>
            <CardContent className="p-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Code:</span>
              <code className="font-mono font-bold">{room.settings.roomCode}</code>
              <Button size="sm" variant="ghost" onClick={copyRoomCode}>
                <IconCopy className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des joueurs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUsers className="h-5 w-5" />
                Joueurs ({room.players.length}/{room.maxPlayers})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: room.maxPlayers }).map((_, index) => {
                const player = room.players[index];
                
                if (player) {
                  return (
                    <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`/avatars/${index + 1}.png`} />
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{player.name}</span>
                            {player.id === room.creatorId && (
                              <IconCrown className="h-4 w-4 text-yellow-500" />
                            )}
                            {player.isAI && (
                              <Badge variant="secondary" className="text-xs">
                                <IconRobot className="h-3 w-3 mr-1" />
                                IA
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Position {player.position + 1}
                          </p>
                        </div>
                      </div>
                      <Badge variant={player.isReady ? 'default' : 'outline'}>
                        {player.isReady ? 'Prêt' : 'En attente'}
                      </Badge>
                    </div>
                  );
                } else {
                  return (
                    <div key={`empty-${index}`} className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-muted-foreground">En attente d'un joueur...</span>
                          <p className="text-sm text-muted-foreground">
                            Position {index + 1}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </CardContent>
          </Card>
        </div>

        {/* Informations et actions */}
        <div className="space-y-4">
          {/* Informations de la partie */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Mise totale</span>
                <span className="font-semibold flex items-center gap-1">
                  <IconCoin className="h-4 w-4" />
                  {room.totalPot / 10} Koras
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Gain potentiel</span>
                <span className="font-semibold text-green-600">
                  {Math.floor((room.totalPot / 10) * 0.9)} Koras
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                * Commission de 10% déduite
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {user?.id === room.creatorId ? (
                <>
                  <Button 
                    onClick={handleStartGame}
                    disabled={!canStartGame()}
                    className="w-full"
                  >
                    {!canStartGame() 
                      ? 'En attente des joueurs...'
                      : 'Démarrer la partie'
                    }
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Tous les joueurs doivent être prêts
                  </p>
                </>
              ) : (
                <Button 
                  onClick={toggleReady}
                  variant={isReady ? 'secondary' : 'default'}
                  className="w-full"
                >
                  {isReady ? 'Annuler' : 'Je suis prêt'}
                </Button>
              )}
              
              <Button 
                onClick={handleLeaveRoom}
                variant="destructive"
                className="w-full"
              >
                Quitter la salle
              </Button>
            </CardContent>
          </Card>

          {/* Chat (optionnel) */}
          <Card>
            <CardHeader>
              <CardTitle>Discussion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Le chat sera disponible prochainement
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

## 9. Page de Jeu (Garame)

### Fichier: `app/(authenticated)/games/garame/play/[gameId]/page.tsx`
```typescript
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconCoin, IconTrophy, IconCrown, IconRobot } from '@tabler/icons-react';
import { useGameEngineService, useEventBus, useGarameAI } from '@/hooks/useInjection';
import { useUser } from '@/app/user-provider';
import { GarameState, GaramePlayerState, GarameCard } from '@/lib/garame/games/garame/types';
import { toast } from 'sonner';
import { GameEndModal } from '@/components/game/game-end-modal';
import { PlayingCard } from '@/components/game/playing-card';

interface PlayPageProps {
  params: { gameId: string };
}

export default function GaramePlayPage({ params }: PlayPageProps) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const gameEngine = useGameEngineService();
  const eventBus = useEventBus();
  const { getNextMove } = useGarameAI();

  const [gameState, setGameState] = useState<GarameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<GarameCard | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);

  useEffect(() => {
    loadGameState();

    // S'abonner aux événements
    eventBus.on('game.action_played', handleActionPlayed);
    eventBus.on('game.state_updated', handleStateUpdated);
    eventBus.on('game.ended', handleGameEnded);

    return () => {
      eventBus.off('game.action_played', handleActionPlayed);
      eventBus.off('game.state_updated', handleStateUpdated);
      eventBus.off('game.ended', handleGameEnded);
    };
  }, [params.gameId]);

  useEffect(() => {
    if (gameState && isAITurn()) {
      playAITurn();
    }
  }, [gameState?.currentPlayerId]);

  const loadGameState = async () => {
    try {
      const state = await gameEngine.getGameState(params.gameId);
      if (!state) {
        toast.error('Partie introuvable');
        router.push('/games');
        return;
      }
      
      setGameState(state as GarameState);
      setIsMyTurn(state.currentPlayerId === user?.id);
    } catch (error) {
      toast.error('Erreur lors du chargement');
      router.push('/games');
    } finally {
      setLoading(false);
    }
  };

  const handleActionPlayed = (data: any) => {
    if (data.gameId === params.gameId) {
      loadGameState();
    }
  };

  const handleStateUpdated = (data: any) => {
    if (data.gameId === params.gameId && data.state) {
      setGameState(data.state);
      setIsMyTurn(data.state.currentPlayerId === user?.id);
    }
  };

  const handleGameEnded = async (data: any) => {
    if (data.gameId === params.gameId) {
      setGameResult(data);
      setShowEndModal(true);
      await refreshUser(); // Rafraîchir le solde
    }
  };

  const isAITurn = () => {
    if (!gameState) return false;
    const currentPlayer = gameState.players.get(gameState.currentPlayerId);
    return currentPlayer?.isAI || false;
  };

  const playAITurn = async () => {
    if (!gameState) return;
    
    // Attendre un peu pour que ce soit plus naturel
    await new Promise(resolve => setTimeout(resolve, 1500));

    const aiMove = await getNextMove(gameState, gameState.currentPlayerId);
    if (aiMove) {
      await gameEngine.processAction(params.gameId, aiMove);
    }
  };

  const playCard = async (card: GarameCard) => {
    if (!isMyTurn || !user) return;

    try {
      const action = {
        type: 'play_card',
        playerId: user.id,
        data: { cardId: card.id },
        timestamp: new Date()
      };

      await gameEngine.processAction(params.gameId, action);
      setSelectedCard(null);
    } catch (error) {
      toast.error('Coup invalide');
    }
  };

  const getPlayerDisplay = (playerId: string) => {
    const player = gameState?.players.get(playerId);
    if (!player) return null;

    const isCurrentPlayer = playerId === user?.id;
    const playerInfo = Array.from(gameState!.players.values()).find(p => p.id === playerId);

    return {
      name: isCurrentPlayer ? 'Vous' : playerInfo?.name || 'Adversaire',
      isAI: player.isAI,
      score: player.score,
      hasKora: player.hasKora,
      cardCount: player.hand.length,
      isActive: gameState?.currentPlayerId === playerId
    };
  };

  if (loading || !gameState) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de la partie...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.get(user?.id || '');
  const opponent = Array.from(gameState.players.values()).find(p => p.id !== user?.id);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* En-tête avec les scores */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {/* Joueur adverse */}
        <Card className={opponent?.id === gameState.currentPlayerId ? 'ring-2 ring-primary' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold flex items-center gap-2">
                  {opponent?.name || 'Adversaire'}
                  {opponent?.isAI && (
                    <Badge variant="secondary" className="text-xs">
                      <IconRobot className="h-3 w-3" />
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {opponent?.hand.length || 0} cartes
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{opponent?.score || 0}</p>
                {opponent?.hasKora && (
                  <IconCrown className="h-5 w-5 text-yellow-500 ml-auto" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Infos de la partie */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Tour {gameState.turn}</p>
            <p className="text-lg font-semibold flex items-center justify-center gap-2">
              <IconCoin className="h-5 w-5" />
              {gameState.pot / 10} Koras
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Premier à 10 points
            </p>
          </CardContent>
        </Card>

        {/* Joueur actuel */}
        <Card className={isMyTurn ? 'ring-2 ring-primary' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Vous</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlayer?.hand.length || 0} cartes
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{currentPlayer?.score || 0}</p>
                {currentPlayer?.hasKora && (
                  <IconCrown className="h-5 w-5 text-yellow-500 ml-auto" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone de jeu */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="min-h-[200px] flex items-center justify-center">
            {gameState.lastPlayedCard ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Dernière carte jouée</p>
                <PlayingCard card={gameState.lastPlayedCard} size="large" />
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune carte jouée</p>
            )}
          </div>

          {isMyTurn && (
            <div className="mt-4 text-center">
              <Badge variant="default" className="animate-pulse">
                C'est votre tour !
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main du joueur */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Votre main</h3>
            {currentPlayer?.hasKora && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <IconCrown className="h-4 w-4" />
                Vous avez la Kora
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {currentPlayer?.hand.map((card) => (
              <div key={card.id} className="relative">
                <PlayingCard
                  card={card}
                  onClick={() => isMyTurn && setSelectedCard(card)}
                  selected={selectedCard?.id === card.id}
                  disabled={!isMyTurn}
                />
                {selectedCard?.id === card.id && (
                  <Button
                    size="sm"
                    className="absolute -bottom-10 left-1/2 transform -translate-x-1/2"
                    onClick={() => playCard(card)}
                  >
                    Jouer
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de fin de partie */}
      <GameEndModal
        open={showEndModal}
        onClose={() => {
          setShowEndModal(false);
          router.push('/games');
        }}
        result={gameResult}
      />
    </div>
  );
}
```

## Structure des composants réutilisables

```
components/
├── dashboard/
│   ├── active-games-card.tsx
│   └── recent-transactions.tsx
├── game/
│   ├── countdown-timer.tsx
│   ├── game-end-modal.tsx
│   └── playing-card.tsx
├── modals/
│   └── quick-deposit-modal.tsx
└── ui/
    └── (shadcn components)
```

## Points clés de l'implémentation

1. **Injection de dépendance** : Tous les services sont injectés via les hooks personnalisés
2. **État global** : UserProvider et GameProvider gèrent l'état global
3. **Temps réel** : EventBus pour la communication entre composants
4. **IA intégrée** : L'IA joue automatiquement quand c'est son tour
5. **Gestion des erreurs** : Toast notifications pour tous les feedbacks
6. **Responsive** : Interface adaptée mobile et desktop
7. **Sécurité** : Vérification du solde avant chaque action
8. **Performance** : Lazy loading et optimisations React

Cette architecture permet une évolutivité maximale et l'ajout facile de nouveaux jeux.