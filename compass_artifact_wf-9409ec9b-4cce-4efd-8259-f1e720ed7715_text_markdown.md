# Plan de développement complet pour l'application web de jeux de cartes

## Architecture technique complète

### Stack technologique recommandé

**Frontend:**
- Next.js 15 (App Router)
- tRPC + TanStack Query (migration depuis l'architecture actuelle)
- Zustand pour la gestion d'état du jeu
- Socket.io pour le temps réel
- shadcn/ui (existant)
- GSAP pour les animations de cartes

**Backend:**
- tRPC Server avec WebSocket support
- Prisma (existant)
- Better Auth (existant)
- Redis pour la synchronisation multi-serveurs
- Node.js avec TypeScript

### Structure des dossiers recommandée

```
src/
├── app/
│   ├── api/
│   │   └── trpc/[trpc]/route.ts      # Handler tRPC
│   ├── game/
│   │   ├── [gameId]/page.tsx         # Page de jeu
│   │   └── lobby/page.tsx            # Lobby multijoueur
│   └── layout.tsx
├── lib/
│   ├── trpc/
│   │   ├── client.ts                 # Config client tRPC
│   │   ├── server.ts                 # Helpers serveur
│   │   └── provider.tsx              # Provider TanStack Query
│   ├── game-engine/
│   │   ├── core/
│   │   │   ├── GameState.ts          # État du jeu
│   │   │   ├── GameRules.ts          # Règles abstraites
│   │   │   └── GameEngine.ts         # Moteur principal
│   │   ├── games/
│   │   │   └── garame/
│   │   │       ├── GarameRules.ts    # Règles spécifiques
│   │   │       ├── GarameState.ts    # État Garame
│   │   │       └── GarameAI.ts       # IA pour Garame
│   │   └── ai/
│   │       ├── AIPlayer.ts           # Classe de base IA
│   │       └── strategies/           # Stratégies IA
│   └── websocket/
│       ├── client.ts                 # Client Socket.io
│       └── handlers.ts               # Gestionnaires d'événements
├── server/
│   ├── api/
│   │   ├── root.ts                   # Router principal
│   │   ├── routers/
│   │   │   ├── game.ts               # Procédures de jeu
│   │   │   ├── lobby.ts              # Gestion des lobbies
│   │   │   └── wallet.ts             # Kora wallet
│   │   └── context.ts                # Contexte tRPC
│   ├── websocket/
│   │   ├── server.ts                 # Serveur WebSocket
│   │   └── rooms.ts                  # Gestion des salles
│   └── db/
│       └── schema.prisma             # Schéma Prisma
├── components/
│   ├── game/
│   │   ├── PlayingCard.tsx           # Composant carte amélioré
│   │   ├── GameBoard.tsx             # Plateau de jeu
│   │   ├── PlayerHand.tsx            # Main du joueur
│   │   └── BettingPanel.tsx          # Interface de mise
│   └── ui/                           # shadcn/ui
└── stores/
    ├── gameStore.ts                  # Store Zustand du jeu
    └── socketStore.ts                # Store WebSocket
```

## Structure de base de données

### Schéma Prisma étendu

```prisma
// Modèles existants à conserver
model User {
  id            String   @id @default(cuid())
  // ... champs existants
  games         GamePlayer[]
  transactions  Transaction[]
  aiGames       Game[]   @relation("AIOpponent")
}

model Wallet {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  koraBalance   Int      @default(0)
  transactions  Transaction[]
}

// Nouveaux modèles pour le jeu
model Game {
  id            String   @id @default(cuid())
  type          GameType @default(GARAME)
  status        GameStatus
  createdAt     DateTime @default(now())
  startedAt     DateTime?
  endedAt       DateTime?
  
  // Configuration du jeu
  maxPlayers    Int      @default(2)
  betAmount     Int
  commission    Int      @default(10) // 10%
  
  // État du jeu sérialisé
  gameState     Json
  
  // Relations
  players       GamePlayer[]
  moves         GameMove[]
  transactions  Transaction[]
  
  // IA si jeu solo
  aiLevel       AILevel?
  aiOpponentId  String?
  aiOpponent    User?    @relation("AIOpponent", fields: [aiOpponentId], references: [id])
  
  @@index([status])
  @@index([createdAt])
}

model GamePlayer {
  id            String   @id @default(cuid())
  gameId        String
  game          Game     @relation(fields: [gameId], references: [id])
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  position      Int      // Position dans le jeu (0, 1, 2...)
  isActive      Boolean  @default(true)
  joinedAt      DateTime @default(now())
  leftAt        DateTime?
  
  // Statistiques du joueur
  cardsWon      Int      @default(0)
  korasWon      Int      @default(0)
  
  @@unique([gameId, userId])
  @@index([userId])
}

model GameMove {
  id            String   @id @default(cuid())
  gameId        String
  game          Game     @relation(fields: [gameId], references: [id])
  playerId      String
  
  moveNumber    Int
  moveType      MoveType
  moveData      Json     // Données spécifiques au mouvement
  timestamp     DateTime @default(now())
  
  @@index([gameId, moveNumber])
}

model Transaction {
  id            String   @id @default(cuid())
  walletId      String
  wallet        Wallet   @relation(fields: [walletId], references: [id])
  gameId        String?
  game          Game?    @relation(fields: [gameId], references: [id])
  
  type          TransactionType
  amount        Int
  balance       Int      // Solde après transaction
  description   String
  createdAt     DateTime @default(now())
  
  @@index([walletId])
  @@index([gameId])
}

// Enums
enum GameType {
  GARAME
  // Futurs jeux...
}

enum GameStatus {
  WAITING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum AILevel {
  EASY
  MEDIUM
  HARD
}

enum MoveType {
  PLAY_CARD
  FOLD
  BET
  SPECIAL_MOVE
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  BET
  WIN
  COMMISSION
  REFUND
}
```

## Migration vers tRPC + TanStack Query

### 1. Installation des dépendances

```bash
npm install @trpc/server @trpc/client @trpc/next @trpc/tanstack-react-query @tanstack/react-query zod superjson
npm install --save-dev @types/ws
```

### 2. Configuration du contexte tRPC

```typescript
// server/api/context.ts
import { auth } from '@/lib/auth/better-auth';
import { prisma } from '@/lib/prisma';
import type { inferAsyncReturnType } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

export async function createTRPCContext(opts: CreateNextContextOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
  });

  return {
    session,
    db: prisma,
    req: opts.req,
    res: opts.res,
  };
}

export type Context = inferAsyncReturnType<typeof createTRPCContext>;
```

### 3. Configuration du router principal

```typescript
// server/api/root.ts
import { createTRPCRouter } from './trpc';
import { gameRouter } from './routers/game';
import { lobbyRouter } from './routers/lobby';
import { walletRouter } from './routers/wallet';

export const appRouter = createTRPCRouter({
  game: gameRouter,
  lobby: lobbyRouter,
  wallet: walletRouter,
});

export type AppRouter = typeof appRouter;
```

### 4. Router de jeu avec WebSocket

```typescript
// server/api/routers/game.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { observable } from '@trpc/server/observable';
import { GameEngine } from '@/lib/game-engine/core/GameEngine';
import { GarameRules } from '@/lib/game-engine/games/garame/GarameRules';

export const gameRouter = createTRPCRouter({
  // Créer une nouvelle partie
  create: protectedProcedure
    .input(z.object({
      gameType: z.enum(['GARAME']),
      betAmount: z.number().min(10),
      maxPlayers: z.number().min(2).max(5),
      aiLevel: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Vérifier le solde
      const wallet = await ctx.db.wallet.findUnique({
        where: { userId: ctx.session.user.id },
      });
      
      if (!wallet || wallet.koraBalance < input.betAmount) {
        throw new Error('Solde insuffisant');
      }

      // Créer la partie
      const game = await ctx.db.game.create({
        data: {
          type: input.gameType,
          betAmount: input.betAmount,
          maxPlayers: input.maxPlayers,
          aiLevel: input.aiLevel,
          status: 'WAITING',
          gameState: {},
          players: {
            create: {
              userId: ctx.session.user.id,
              position: 0,
            },
          },
        },
      });

      return game;
    }),

  // Rejoindre une partie
  join: protectedProcedure
    .input(z.object({
      gameId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: { id: input.gameId },
        include: { players: true },
      });

      if (!game || game.status !== 'WAITING') {
        throw new Error('Partie non disponible');
      }

      if (game.players.length >= game.maxPlayers) {
        throw new Error('Partie complète');
      }

      // Ajouter le joueur
      await ctx.db.gamePlayer.create({
        data: {
          gameId: input.gameId,
          userId: ctx.session.user.id,
          position: game.players.length,
        },
      });

      // Démarrer la partie si complète
      if (game.players.length + 1 === game.maxPlayers) {
        const engine = new GameEngine(new GarameRules());
        const initialState = engine.initializeGame(game.players.length + 1);
        
        await ctx.db.game.update({
          where: { id: input.gameId },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            gameState: initialState,
          },
        });
      }

      return { success: true };
    }),

  // Jouer une carte
  playCard: protectedProcedure
    .input(z.object({
      gameId: z.string(),
      cardId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: { id: input.gameId },
        include: { players: true },
      });

      if (!game || game.status !== 'IN_PROGRESS') {
        throw new Error('Partie non active');
      }

      // Valider et appliquer le mouvement
      const engine = new GameEngine(new GarameRules());
      const newState = engine.applyMove(game.gameState, {
        type: 'PLAY_CARD',
        playerId: ctx.session.user.id,
        cardId: input.cardId,
      });

      // Sauvegarder l'état
      await ctx.db.game.update({
        where: { id: input.gameId },
        data: { gameState: newState },
      });

      // Enregistrer le mouvement
      await ctx.db.gameMove.create({
        data: {
          gameId: input.gameId,
          playerId: ctx.session.user.id,
          moveType: 'PLAY_CARD',
          moveNumber: game.gameState.moveCount + 1,
          moveData: { cardId: input.cardId },
        },
      });

      return { success: true, gameState: newState };
    }),

  // Subscription WebSocket pour les mises à jour en temps réel
  onGameUpdate: protectedProcedure
    .input(z.object({
      gameId: z.string(),
    }))
    .subscription(({ ctx, input }) => {
      return observable<any>((emit) => {
        const onUpdate = (data: any) => {
          emit.next(data);
        };

        // S'abonner aux événements du jeu
        ctx.gameEmitter.on(`game:${input.gameId}`, onUpdate);

        // Cleanup
        return () => {
          ctx.gameEmitter.off(`game:${input.gameId}`, onUpdate);
        };
      });
    }),
});
```

## Implémentation du moteur de jeu Garame

### 1. État du jeu Garame

```typescript
// lib/game-engine/games/garame/GarameState.ts
export interface GarameCard {
  id: string;
  rank: number; // 3-10
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
}

export interface GaramePlayer {
  id: string;
  hand: GarameCard[];
  cardsWon: GarameCard[];
  korasWon: number;
  hasFolded: boolean;
}

export interface GarameState {
  players: GaramePlayer[];
  currentPlayerIndex: number;
  currentRound: number;
  maxRounds: number;
  deck: GarameCard[];
  tableCards: GarameCard[];
  betAmount: number;
  pot: number;
  lastAction: {
    playerId: string;
    action: 'play' | 'fold';
    card?: GarameCard;
  } | null;
}
```

### 2. Règles du jeu Garame

```typescript
// lib/game-engine/games/garame/GarameRules.ts
import { GameRules } from '../../core/GameRules';
import { GarameState, GarameCard } from './GarameState';

export class GarameRules implements GameRules<GarameState> {
  initializeGame(playerCount: number, betAmount: number): GarameState {
    const deck = this.createDeck();
    const players = this.createPlayers(playerCount);
    
    // Distribuer 5 cartes par joueur
    const state: GarameState = {
      players,
      currentPlayerIndex: 0,
      currentRound: 1,
      maxRounds: 5,
      deck: [],
      tableCards: [],
      betAmount,
      pot: betAmount * playerCount,
      lastAction: null,
    };

    // Distribution des cartes
    for (let i = 0; i < 5; i++) {
      for (const player of state.players) {
        const card = deck.pop()!;
        player.hand.push(card);
      }
    }

    state.deck = deck;
    return state;
  }

  private createDeck(): GarameCard[] {
    const deck: GarameCard[] = [];
    const suits: Array<'hearts' | 'diamonds' | 'clubs' | 'spades'> = 
      ['hearts', 'diamonds', 'clubs', 'spades'];
    
    for (const suit of suits) {
      for (let rank = 3; rank <= 10; rank++) {
        // Exclure le 10 de pique
        if (!(suit === 'spades' && rank === 10)) {
          deck.push({
            id: `${suit}_${rank}`,
            rank,
            suit,
          });
        }
      }
    }

    // Mélanger le deck
    return this.shuffle(deck);
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  validateMove(state: GarameState, move: any): boolean {
    const player = state.players[state.currentPlayerIndex];
    
    if (move.type === 'PLAY_CARD') {
      // Vérifier que le joueur a la carte
      return player.hand.some(card => card.id === move.cardId);
    }
    
    if (move.type === 'FOLD') {
      return !player.hasFolded;
    }

    return false;
  }

  applyMove(state: GarameState, move: any): GarameState {
    const newState = JSON.parse(JSON.stringify(state));
    const player = newState.players[newState.currentPlayerIndex];

    if (move.type === 'PLAY_CARD') {
      const cardIndex = player.hand.findIndex(c => c.id === move.cardId);
      const card = player.hand.splice(cardIndex, 1)[0];
      newState.tableCards.push(card);
      newState.lastAction = {
        playerId: player.id,
        action: 'play',
        card,
      };
    } else if (move.type === 'FOLD') {
      player.hasFolded = true;
      newState.lastAction = {
        playerId: player.id,
        action: 'fold',
      };
    }

    // Passer au joueur suivant
    do {
      newState.currentPlayerIndex = 
        (newState.currentPlayerIndex + 1) % newState.players.length;
    } while (newState.players[newState.currentPlayerIndex].hasFolded);

    // Vérifier la fin du tour
    if (newState.tableCards.length === newState.players.filter(p => !p.hasFolded).length) {
      this.resolveTurn(newState);
    }

    return newState;
  }

  private resolveTurn(state: GarameState): void {
    // Déterminer le gagnant du tour
    const winningCard = state.tableCards.reduce((highest, card) => 
      card.rank > highest.rank ? card : highest
    );
    
    const winnerIndex = state.tableCards.findIndex(c => c.id === winningCard.id);
    const winner = state.players.find(p => !p.hasFolded);
    
    if (winner) {
      winner.cardsWon.push(...state.tableCards);
      state.tableCards = [];
    }

    // Vérifier les conditions de victoire spéciales
    this.checkSpecialWins(state);

    // Passer au tour suivant
    state.currentRound++;
  }

  private checkSpecialWins(state: GarameState): void {
    for (const player of state.players) {
      const threes = player.hand.filter(c => c.rank === 3);
      
      // Kora simple (2 cartes de 3)
      if (threes.length === 2) {
        player.korasWon += state.pot * 0.5;
      }
      
      // Kora double (3 cartes de 3)
      if (threes.length === 3) {
        player.korasWon += state.pot * 1;
      }
      
      // Kora triple (4 cartes de 3)
      if (threes.length === 4) {
        player.korasWon += state.pot * 2;
      }
    }
  }

  isGameOver(state: GarameState): boolean {
    return state.currentRound > state.maxRounds || 
           state.players.filter(p => !p.hasFolded).length <= 1;
  }

  getWinner(state: GarameState): string | null {
    if (!this.isGameOver(state)) return null;

    // Calculer les scores finaux
    const scores = state.players.map(player => ({
      playerId: player.id,
      score: player.cardsWon.length + (player.korasWon / state.betAmount),
    }));

    scores.sort((a, b) => b.score - a.score);
    return scores[0].playerId;
  }
}
```

## Système d'IA modulaire

### 1. Classe de base IA

```typescript
// lib/game-engine/ai/AIPlayer.ts
export abstract class AIPlayer<TState> {
  constructor(
    protected difficulty: 'EASY' | 'MEDIUM' | 'HARD',
    protected playerId: string
  ) {}

  abstract calculateMove(state: TState): Promise<any>;
  
  protected addDelay(): Promise<void> {
    // Délai réaliste pour simuler la réflexion
    const delay = this.difficulty === 'EASY' ? 1000 : 
                  this.difficulty === 'MEDIUM' ? 2000 : 3000;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

### 2. IA spécifique pour Garame

```typescript
// lib/game-engine/games/garame/GarameAI.ts
import { AIPlayer } from '../../ai/AIPlayer';
import { GarameState, GarameCard } from './GarameState';

export class GarameAI extends AIPlayer<GarameState> {
  async calculateMove(state: GarameState): Promise<any> {
    await this.addDelay();
    
    const player = state.players.find(p => p.id === this.playerId);
    if (!player || player.hasFolded) return null;

    switch (this.difficulty) {
      case 'EASY':
        return this.easyStrategy(state, player);
      case 'MEDIUM':
        return this.mediumStrategy(state, player);
      case 'HARD':
        return this.hardStrategy(state, player);
    }
  }

  private easyStrategy(state: GarameState, player: any): any {
    // Stratégie simple : jouer une carte aléatoire
    const randomIndex = Math.floor(Math.random() * player.hand.length);
    return {
      type: 'PLAY_CARD',
      cardId: player.hand[randomIndex].id,
    };
  }

  private mediumStrategy(state: GarameState, player: any): any {
    // Stratégie moyenne : éviter de jouer les 3 si possible
    const nonThrees = player.hand.filter((c: GarameCard) => c.rank !== 3);
    
    if (nonThrees.length > 0) {
      // Jouer la carte la plus faible qui n'est pas un 3
      const card = nonThrees.reduce((lowest: GarameCard, card: GarameCard) => 
        card.rank < lowest.rank ? card : lowest
      );
      return {
        type: 'PLAY_CARD',
        cardId: card.id,
      };
    }

    // Si que des 3, jouer le premier
    return {
      type: 'PLAY_CARD',
      cardId: player.hand[0].id,
    };
  }

  private hardStrategy(state: GarameState, player: any): any {
    // Stratégie avancée : analyse complète de la situation
    const tableCards = state.tableCards;
    const myHand = player.hand;
    
    // Si des cartes sont déjà jouées ce tour
    if (tableCards.length > 0) {
      const highestOnTable = Math.max(...tableCards.map(c => c.rank));
      const cardsToWin = myHand.filter((c: GarameCard) => c.rank > highestOnTable);
      
      if (cardsToWin.length > 0) {
        // Jouer la carte la plus faible qui peut gagner
        const card = cardsToWin.reduce((lowest: GarameCard, card: GarameCard) => 
          card.rank < lowest.rank ? card : lowest
        );
        return {
          type: 'PLAY_CARD',
          cardId: card.id,
        };
      }
    }

    // Stratégie de conservation des 3
    const threes = myHand.filter((c: GarameCard) => c.rank === 3);
    if (threes.length >= 2 && state.currentRound < 4) {
      // Conserver les 3 pour les Koras
      const nonThrees = myHand.filter((c: GarameCard) => c.rank !== 3);
      if (nonThrees.length > 0) {
        return {
          type: 'PLAY_CARD',
          cardId: nonThrees[0].id,
        };
      }
    }

    // Par défaut, jouer la carte la plus faible
    const weakest = myHand.reduce((lowest: GarameCard, card: GarameCard) => 
      card.rank < lowest.rank ? card : lowest
    );
    
    return {
      type: 'PLAY_CARD',
      cardId: weakest.id,
    };
  }
}
```

## Composant PlayingCard amélioré

```typescript
// components/game/PlayingCard.tsx
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PlayingCardProps {
  rank: number | string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function PlayingCard({
  rank,
  suit,
  isPlayable = true,
  isSelected = false,
  onClick,
  size = 'md',
}: PlayingCardProps) {
  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };

  const suitColors = {
    hearts: 'text-red-600',
    diamonds: 'text-red-600',
    clubs: 'text-gray-900',
    spades: 'text-gray-900',
  };

  const sizeClasses = {
    sm: 'w-16 h-24 text-xl',
    md: 'w-20 h-28 text-2xl',
    lg: 'w-24 h-32 text-3xl',
  };

  return (
    <motion.div
      whileHover={isPlayable ? { y: -10 } : {}}
      whileTap={isPlayable ? { scale: 0.95 } : {}}
      animate={{
        scale: isSelected ? 1.1 : 1,
        boxShadow: isSelected ? '0 10px 30px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.1)',
      }}
      className={cn(
        'relative rounded-lg cursor-pointer transition-all',
        'bg-white border-2 border-gray-200',
        'flex flex-col items-center justify-center',
        'font-bold select-none',
        sizeClasses[size],
        suitColors[suit],
        {
          'opacity-50 cursor-not-allowed': !isPlayable,
          'ring-4 ring-blue-500 ring-offset-2': isSelected,
          'hover:border-gray-400': isPlayable && !isSelected,
        }
      )}
      onClick={isPlayable ? onClick : undefined}
    >
      <div className="absolute top-2 left-2 text-center leading-none">
        <div>{rank}</div>
        <div className="text-lg">{suitSymbols[suit]}</div>
      </div>
      
      <div className="text-4xl md:text-5xl lg:text-6xl">
        {suitSymbols[suit]}
      </div>
      
      <div className="absolute bottom-2 right-2 text-center leading-none rotate-180">
        <div>{rank}</div>
        <div className="text-lg">{suitSymbols[suit]}</div>
      </div>
    </motion.div>
  );
}
```

## Configuration WebSocket

### 1. Serveur WebSocket

```typescript
// server/websocket/server.ts
import { Server } from 'socket.io';
import { createServer } from 'http';
import { RoomManager } from './rooms';
import { verifyJWT } from '@/lib/auth/jwt';

export function createWebSocketServer(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    },
  });

  const roomManager = new RoomManager();

  // Middleware d'authentification
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const user = await verifyJWT(token);
      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.data.user.id} connected`);

    // Rejoindre une salle de jeu
    socket.on('join-game', async (gameId: string) => {
      socket.join(`game:${gameId}`);
      
      // Notifier les autres joueurs
      socket.to(`game:${gameId}`).emit('player-joined', {
        userId: socket.data.user.id,
        gameId,
      });
    });

    // Gérer les actions de jeu
    socket.on('game-action', async (data) => {
      const { gameId, action } = data;
      
      // Valider et traiter l'action
      try {
        const result = await processGameAction(gameId, socket.data.user.id, action);
        
        // Diffuser à tous les joueurs dans la salle
        io.to(`game:${gameId}`).emit('game-update', result);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
      console.log(`User ${socket.data.user.id} disconnected`);
      // Gérer la reconnexion automatique
    });
  });

  return io;
}
```

### 2. Client WebSocket avec reconnexion

```typescript
// lib/websocket/client.ts
import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: Function) => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (token: string) => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      set({ isConnected: true });
      console.log('Connected to WebSocket');
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
      console.log('Disconnected from WebSocket');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  emit: (event: string, data: any) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit(event, data);
    }
  },

  on: (event: string, callback: Function) => {
    const { socket } = get();
    if (socket) {
      socket.on(event, callback);
    }
  },
}));
```

## Store Zustand pour la gestion d'état

```typescript
// stores/gameStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GarameState } from '@/lib/game-engine/games/garame/GarameState';

interface GameStore {
  gameId: string | null;
  gameState: GarameState | null;
  isMyTurn: boolean;
  selectedCard: string | null;
  
  // Actions
  setGame: (gameId: string, state: GarameState) => void;
  updateGameState: (state: GarameState) => void;
  selectCard: (cardId: string | null) => void;
  playCard: (cardId: string) => void;
  
  // Computed
  getMyHand: () => any[];
  canPlayCard: (cardId: string) => boolean;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    gameId: null,
    gameState: null,
    isMyTurn: false,
    selectedCard: null,

    setGame: (gameId, state) => set({ 
      gameId, 
      gameState: state,
      selectedCard: null,
    }),

    updateGameState: (state) => set({ 
      gameState: state,
      selectedCard: null,
    }),

    selectCard: (cardId) => set({ selectedCard: cardId }),

    playCard: async (cardId) => {
      const { gameId } = get();
      if (!gameId) return;

      // Appel tRPC pour jouer la carte
      // L'état sera mis à jour via WebSocket
    },

    getMyHand: () => {
      const state = get().gameState;
      if (!state) return [];
      
      // Logique pour récupérer la main du joueur actuel
      return [];
    },

    canPlayCard: (cardId) => {
      const { gameState, isMyTurn } = get();
      if (!gameState || !isMyTurn) return false;
      
      // Vérifier si la carte peut être jouée
      return true;
    },
  }))
);
```

## Checklist complète pour l'agent développeur

### Phase 1 : Infrastructure (Semaine 1)
- [x] **Migration tRPC**
  - [x] Installer les dépendances tRPC et TanStack Query
  - [x] Créer la structure de dossiers recommandée
  - [x] Configurer le contexte et les routers tRPC
  - [x] Migrer les endpoints existants vers tRPC (routers de base créés)
  - [x] Configurer le provider TanStack Query

- [x] **Configuration WebSocket**
  - [x] Installer Socket.io client et serveur
  - [x] Créer le serveur WebSocket avec authentification
  - [x] Implémenter la logique de reconnexion automatique
  - [x] Créer le store Zustand pour WebSocket
  - [x] Tester la communication bidirectionnelle

### Phase 2 : Base de données (Semaine 1-2)
- [x] **Schéma Prisma**
  - [x] Ajouter les modèles Game, GamePlayer, GameMove
  - [x] Créer les modèles Transaction pour le système de paris
  - [x] Implémenter les indexes pour les performances
  - [x] Créer les migrations Prisma
  - [x] Seeder pour les données de test

### Phase 3 : Moteur de jeu (Semaine 2-3)
- [x] **Architecture modulaire**
  - [x] Créer les interfaces de base (GameRules, GameState)
  - [x] Implémenter le GameEngine principal
  - [x] Créer la structure pour supporter plusieurs jeux

- [x] **Implémentation Garame**
  - [x] Créer GarameState et GarameCard
  - [x] Implémenter GarameRules avec toutes les règles
  - [x] Créer la logique de distribution des cartes
  - [x] Implémenter la détection des Koras
  - [x] Tester toutes les conditions de victoire

- [x] **Intégration tRPC**
  - [x] Créer les procédures tRPC pour les jeux (create, join, playCard, fold)
  - [x] Intégrer le moteur de jeu avec les routers tRPC
  - [x] Gérer les transactions et les gains automatiquement
  - [x] Créer un composant de test pour l'intégration
  - [x] Valider le fonctionnement complet du système

### Phase 4 : Interface utilisateur (Semaine 3-4)
- [x] **Composants de jeu**
  - [x] Améliorer PlayingCard (contrastes, animations)
  - [x] Créer GameBoard responsive
  - [x] Implémenter interface de jeu complète
  - [x] Créer système de notifications en temps réel
  - [x] Ajouter les animations Framer Motion

- [x] **Pages de jeu**
  - [x] Page lobby avec liste des parties
  - [x] Page de jeu principale
  - [x] Interface de création de partie
  - [x] Écran de fin de partie avec gains
  - [x] Système de notifications interactives

### Phase 5 : IA et multijoueur (Semaine 4-5)
- [x] **Système d'IA**
  - [x] Créer la classe AIPlayer abstraite
  - [x] Implémenter GarameAI avec 3 niveaux
  - [x] Stratégies différenciées par difficulté
  - [x] Tester et équilibrer les difficultés

- [x] **Multijoueur temps réel**
  - [x] Synchronisation d'état via WebSocket
  - [x] Gestion des salles de jeu
  - [x] Système de reconnexion automatique
  - [x] Indicateurs de connexion des joueurs

### Phase 6 : Sécurité et optimisations (Semaine 5-6)
- [ ] **Sécurité**
  - [ ] Validation côté serveur de tous les mouvements
  - [ ] Implémentation anti-triche (rate limiting)
  - [ ] Journalisation des actions suspectes
  - [ ] Chiffrement des communications sensibles
  - [ ] Tests de pénétration basiques

- [ ] **Optimisations**
  - [ ] Mise en cache avec Redis
  - [ ] Optimisation des requêtes Prisma
  - [ ] Compression des messages WebSocket
  - [ ] Lazy loading des composants
  - [ ] Bundle splitting avec Next.js

### Phase 7 : Système financier (Semaine 6)
- [ ] **Gestion des Koras**
  - [ ] Système de dépôt/retrait
  - [ ] Calcul automatique des commissions (10%)
  - [ ] Historique des transactions
  - [ ] Intégration avec le wallet existant
  - [ ] Tests de tous les scénarios financiers

### Phase 8 : Tests et déploiement (Semaine 6-7)
- [ ] **Tests**
  - [ ] Tests unitaires (Vitest) pour le moteur de jeu
  - [ ] Tests d'intégration pour l'API tRPC
  - [ ] Tests E2E (Cypress) pour les flux utilisateur
  - [ ] Tests de charge pour le WebSocket
  - [ ] Tests de sécurité

- [ ] **Déploiement**
  - [ ] Configuration des variables d'environnement
  - [ ] Setup Redis pour la production
  - [ ] Configuration du serveur WebSocket
  - [ ] Monitoring et alertes
  - [ ] Documentation complète

## Meilleures pratiques spécifiques

### Gestion d'état pour jeux de cartes
1. **État immuable** : Toujours créer de nouveaux objets d'état
2. **Historique des mouvements** : Conserver tous les mouvements pour replay/undo
3. **État dérivé** : Calculer les scores et statistiques à partir de l'état de base
4. **Optimistic updates** : Mettre à jour l'UI immédiatement, rollback si erreur

### Sécurité multijoueur
1. **Never trust the client** : Toute validation côté serveur
2. **Rate limiting** : Maximum 100 actions par minute par joueur
3. **Détection de patterns** : Identifier les comportements suspects
4. **Chiffrement** : TLS 1.3 minimum pour toutes les communications

### Performance temps réel
1. **Message batching** : Grouper les mises à jour non critiques
2. **Compression** : Utiliser la compression WebSocket native
3. **Debouncing** : Limiter la fréquence des mises à jour UI
4. **Lazy loading** : Charger les ressources à la demande

### Architecture modulaire
1. **Separation of concerns** : Logique métier séparée de l'UI
2. **Dependency injection** : Faciliter les tests et la maintenance
3. **Event-driven** : Communication découplée entre modules
4. **Plugin system** : Permettre l'ajout facile de nouveaux jeux

Ce plan de développement complet vous fournit une base solide pour créer votre application de jeux de cartes avec toutes les fonctionnalités demandées. L'architecture proposée est scalable, sécurisée et permet d'ajouter facilement de nouveaux jeux à l'avenir.