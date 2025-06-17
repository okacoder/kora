# Plan d'implémentation de l'Inversion de Dépendance avec InversifyJS

## Vue d'ensemble

Ce plan détaille l'implémentation du principe d'inversion de dépendance (DIP) dans votre jeu LaMap241, en commençant par la gestion des comptes utilisateur. L'objectif est de découpler votre code du backend et de pouvoir développer sans dépendre directement de la base de données.

## 1. Installation des dépendances

```bash
npm install inversify reflect-metadata
npm install --save-dev @types/reflect-metadata
```

## 2. Configuration de base

### Fichier: `tsconfig.json`
Ajouter ces options dans `compilerOptions`:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["reflect-metadata"]
  }
}
```

### Fichier: `app/layout.tsx`
Ajouter en tout début du fichier (avant tous les imports):
```typescript
import 'reflect-metadata';
```

## 3. Définition des interfaces

### Fichier: `lib/interfaces/repositories/IUserRepository.ts`
```typescript
import { User } from '@prisma/client';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  updateBalance(id: string, amount: number): Promise<User>;
  incrementStats(id: string, wins: number, games: number): Promise<User>;
}

export interface CreateUserDto {
  name: string;
  username: string;
  email: string;
  phoneNumber: string;
  role?: 'USER' | 'ADMIN' | 'MODERATOR';
  koras?: number;
}

export interface UpdateUserDto {
  name?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  image?: string;
}
```

### Fichier: `lib/interfaces/services/IUserService.ts`
```typescript
import { User } from '@prisma/client';

export interface IUserService {
  getCurrentUser(): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  updateUserProfile(id: string, data: UpdateProfileDto): Promise<User>;
  getUserBalance(userId: string): Promise<number>;
  addKoras(userId: string, amount: number): Promise<User>;
  deductKoras(userId: string, amount: number): Promise<User>;
  canAffordAmount(userId: string, amount: number): Promise<boolean>;
}

export interface UpdateProfileDto {
  name?: string;
  username?: string;
  image?: string;
}
```

### Fichier: `lib/interfaces/services/IAuthService.ts`
```typescript
import { Session } from '@/lib/auth';

export interface IAuthService {
  getSession(): Promise<Session | null>;
  getCurrentUserId(): Promise<string | null>;
  isAuthenticated(): Promise<boolean>;
  hasRole(role: string): Promise<boolean>;
}
```

## 4. Implémentation des repositories

### Fichier: `lib/repositories/UserRepository.ts`
```typescript
import { injectable } from 'inversify';
import { PrismaClient, User } from '@prisma/client';
import { IUserRepository, CreateUserDto, UpdateUserDto } from '@/lib/interfaces/repositories/IUserRepository';
import prisma from '@/lib/prisma';

@injectable()
export class UserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username }
    });
  }

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        emailVerified: false,
        phoneNumberVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async updateBalance(id: string, amount: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        koras: {
          increment: amount
        },
        updatedAt: new Date()
      }
    });
  }

  async incrementStats(id: string, wins: number, games: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        totalWins: { increment: wins },
        totalGames: { increment: games },
        updatedAt: new Date()
      }
    });
  }
}
```

### Fichier: `lib/repositories/MockUserRepository.ts`
```typescript
import { injectable } from 'inversify';
import { User } from '@prisma/client';
import { IUserRepository, CreateUserDto, UpdateUserDto } from '@/lib/interfaces/repositories/IUserRepository';

@injectable()
export class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();
  private nextId = 1;

  constructor() {
    // Ajouter un utilisateur de test par défaut
    const testUser: User = {
      id: 'test-user-1',
      name: 'Test User',
      username: 'testuser',
      displayUsername: 'TestUser',
      role: 'USER',
      email: 'test@example.com',
      emailVerified: true,
      phoneNumber: '+1234567890',
      phoneNumberVerified: true,
      image: null,
      koras: 1000,
      totalWins: 0,
      totalGames: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(testUser.id, testUser);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.username === username) || null;
  }

  async create(data: CreateUserDto): Promise<User> {
    const user: User = {
      id: `test-user-${this.nextId++}`,
      name: data.name,
      username: data.username,
      displayUsername: data.username,
      role: data.role || 'USER',
      email: data.email,
      emailVerified: false,
      phoneNumber: data.phoneNumber,
      phoneNumberVerified: false,
      image: null,
      koras: data.koras || 0,
      totalWins: 0,
      totalGames: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = {
      ...user,
      ...data,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateBalance(id: string, amount: number): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = {
      ...user,
      koras: user.koras + amount,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async incrementStats(id: string, wins: number, games: number): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = {
      ...user,
      totalWins: user.totalWins + wins,
      totalGames: user.totalGames + games,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
}
```

## 5. Implémentation des services

### Fichier: `lib/services/UserService.ts`
```typescript
import { injectable, inject } from 'inversify';
import { User } from '@prisma/client';
import { IUserService, UpdateProfileDto } from '@/lib/interfaces/services/IUserService';
import { IUserRepository } from '@/lib/interfaces/repositories/IUserRepository';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';
import { TYPES } from '@/lib/di/types';

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.AuthService) private authService: IAuthService
  ) {}

  async getCurrentUser(): Promise<User> {
    const userId = await this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user');
    }
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  async updateUserProfile(id: string, data: UpdateProfileDto): Promise<User> {
    // Vérifier que l'utilisateur ne peut modifier que son propre profil
    const currentUserId = await this.authService.getCurrentUserId();
    if (currentUserId !== id && !(await this.authService.hasRole('ADMIN'))) {
      throw new Error('Unauthorized');
    }

    return this.userRepository.update(id, data);
  }

  async getUserBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findById(userId);
    return user?.koras || 0;
  }

  async addKoras(userId: string, amount: number): Promise<User> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    return this.userRepository.updateBalance(userId, amount);
  }

  async deductKoras(userId: string, amount: number): Promise<User> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    const canAfford = await this.canAffordAmount(userId, amount);
    if (!canAfford) {
      throw new Error('Insufficient balance');
    }
    
    return this.userRepository.updateBalance(userId, -amount);
  }

  async canAffordAmount(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getUserBalance(userId);
    return balance >= amount;
  }
}
```

### Fichier: `lib/services/AuthService.ts`
```typescript
import { injectable } from 'inversify';
import { Session } from '@/lib/auth';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

@injectable()
export class AuthService implements IAuthService {
  async getSession(): Promise<Session | null> {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
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
```

### Fichier: `lib/services/MockAuthService.ts`
```typescript
import { injectable } from 'inversify';
import { Session } from '@/lib/auth';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';

@injectable()
export class MockAuthService implements IAuthService {
  private mockSession: Session | null = {
    user: {
      id: 'test-user-1',
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      role: 'USER',
      phoneNumber: '+1234567890',
      koras: 1000,
      totalWins: 0,
      totalGames: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,
      phoneNumberVerified: true,
      image: null,
      displayUsername: 'TestUser'
    },
    session: {
      id: 'test-session-1',
      userId: 'test-user-1',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      token: 'test-token',
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'test'
    }
  };

  async getSession(): Promise<Session | null> {
    return this.mockSession;
  }

  async getCurrentUserId(): Promise<string | null> {
    return this.mockSession?.user?.id || null;
  }

  async isAuthenticated(): Promise<boolean> {
    return !!this.mockSession;
  }

  async hasRole(role: string): Promise<boolean> {
    return this.mockSession?.user?.role === role;
  }

  // Méthode utilitaire pour les tests
  setMockSession(session: Session | null): void {
    this.mockSession = session;
  }
}
```

## 6. Configuration du container IoC

### Fichier: `lib/di/types.ts`
```typescript
export const TYPES = {
  // Repositories
  UserRepository: Symbol.for('UserRepository'),
  
  // Services
  UserService: Symbol.for('UserService'),
  AuthService: Symbol.for('AuthService'),
};
```

### Fichier: `lib/di/container.ts`
```typescript
import { Container } from 'inversify';
import { TYPES } from './types';

// Interfaces
import { IUserRepository } from '@/lib/interfaces/repositories/IUserRepository';
import { IUserService } from '@/lib/interfaces/services/IUserService';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';

// Implementations
import { UserRepository } from '@/lib/repositories/UserRepository';
import { MockUserRepository } from '@/lib/repositories/MockUserRepository';
import { UserService } from '@/lib/services/UserService';
import { AuthService } from '@/lib/services/AuthService';
import { MockAuthService } from '@/lib/services/MockAuthService';

const container = new Container();

// Configuration en fonction de l'environnement
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// Repositories
if (USE_MOCK) {
  container.bind<IUserRepository>(TYPES.UserRepository).to(MockUserRepository).inSingletonScope();
  container.bind<IAuthService>(TYPES.AuthService).to(MockAuthService).inSingletonScope();
} else {
  container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
  container.bind<IAuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
}

// Services (toujours les mêmes)
container.bind<IUserService>(TYPES.UserService).to(UserService).inSingletonScope();

export { container };
```

### Fichier: `lib/di/index.ts`
```typescript
export { container } from './container';
export { TYPES } from './types';
```

## 7. Hook React pour l'injection

### Fichier: `hooks/useInjection.ts`
```typescript
import { container, TYPES } from '@/lib/di';

export function useInjection<T>(serviceIdentifier: symbol): T {
  return container.get<T>(serviceIdentifier);
}

// Hooks spécifiques pour faciliter l'usage
export function useUserService() {
  return useInjection<IUserService>(TYPES.UserService);
}

export function useAuthService() {
  return useInjection<IAuthService>(TYPES.AuthService);
}
```

## 8. Mise à jour du provider d'utilisateur

### Fichier: `providers/user-provider.tsx`
```typescript
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@prisma/client";
import { useUserService } from "@/hooks/useInjection";

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const userService = useUserService();

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

  useEffect(() => {
    loadUser();
  }, []);

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
```

## 9. Exemple d'utilisation dans un composant

### Fichier: `app/(authenticated)/account/page.tsx` (modifié)
```typescript
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconLoader } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import { useUserService } from "@/hooks/useInjection";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const { user, loading: userLoading, refreshUser } = useUser();
  const userService = useUserService();

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullname(user.name || "");
      setEmail(user.email || "");
      setUsername(user.username || "");
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError("");
      
      await userService.updateUserProfile(user.id, {
        name: fullname,
        username: username,
      });
      
      await refreshUser();
      toast.success("Profil mis à jour avec succès");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || !user) {
    return (
      <div className="p-4">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">Mon compte</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fullname">Nom complet</Label>
            <Input
              id="fullname"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <Separator />

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Statistiques</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{user.koras}</p>
                <p className="text-sm text-muted-foreground">Koras</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{user.totalWins}</p>
                <p className="text-sm text-muted-foreground">Victoires</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{user.totalGames}</p>
                <p className="text-sm text-muted-foreground">Parties</p>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour...
              </>
            ) : (
              "Mettre à jour"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 10. Variables d'environnement

### Fichier: `.env.local`
```env
# Ajouter cette ligne pour activer les mocks
NEXT_PUBLIC_USE_MOCK=true
```

### Fichier: `.env.production`
```env
# En production, utiliser la vraie base de données
NEXT_PUBLIC_USE_MOCK=false
```

## 11. Mise à jour de app/layout.tsx

Ajouter le UserProvider dans le layout principal :

```typescript
import 'reflect-metadata'; // IMPORTANT: Première ligne
import { UserProvider } from "@/providers/user-provider";

// ... autres imports

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <UserProvider>
          {/* ... reste du layout */}
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
```

## 12. Scripts npm utiles

### Fichier: `package.json` (ajouter ces scripts)
```json
{
  "scripts": {
    "dev:mock": "NEXT_PUBLIC_USE_MOCK=true next dev --experimental-https --port 4000",
    "dev:db": "NEXT_PUBLIC_USE_MOCK=false next dev --experimental-https --port 4000"
  }
}
```