# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LaMap241** is a Next.js 15 web application for online card games with real-time multiplayer gameplay, WebSocket support, and virtual currency system. The platform features the traditional Garame card game with plans for additional games.

### Core Features
- 🎮 **Garame Game**: Traditional card game with 19 cards (3-10 excluding 10♠), special Kora victories
- 💰 **Kora Economy**: Virtual currency with 10% commission system
- 🏆 **ELO Ranking**: Chess-style rating system (Bronze → Grand Master)
- 🤖 **AI Players**: Three difficulty levels (Easy, Medium, Hard)
- 🌐 **Real-time Multiplayer**: WebSocket-based live gameplay
- 📱 **Mobile-First**: Responsive design optimized for touch devices

## Development Commands

```bash
# Development with WebSocket support
npm run dev

# Development with mock data (no backend/WebSocket required)
npm run dev:mock

# Build for production
npm run build

# Run production server (includes WebSocket server)
npm start

# Type checking
npm run typecheck

# Linting and formatting
npm run lint
npm run lint:fix

# Database operations
npm run db:migrate         # Run Prisma migrations
npm run db:push           # Push schema changes to database
npm run db:studio         # Open Prisma Studio GUI
npm run db:seed           # Seed database with test data
npm run db:reset          # Reset database (dev only)

# WebSocket server operations
npm run ws:dev            # Start WebSocket server in development
npm run ws:test           # Test WebSocket connections

# Game engine testing
npm run test:game-engine  # Test game logic
npm run test:ai           # Test AI players
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui with custom "new-york" theme and card-game inspired colors
- **Backend**: Node.js with tRPC and Socket.IO WebSocket server
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with phone/email + OTP
- **State Management**: Zustand for game state, TanStack Query for server state
- **Real-time**: Socket.IO for game events and chat
- **Animations**: Framer Motion for card animations and page transitions

### Design System & Theme

The application uses a custom color palette inspired by traditional playing cards:

```css
/* Primary Colors (from globals.css) */
--primary: oklch(0.52 0.18 25);        /* Red cards #B4443E */
--secondary: oklch(0.62 0.08 65);      /* Brown #A68258 */
--background: oklch(0.98 0.01 70);     /* Cream paper (light) */
--background: oklch(0.12 0.02 230);    /* Blue velvet (dark) */

/* Game-specific Colors */
--chart-1: oklch(0.52 0.18 25);        /* Red */
--chart-2: oklch(0.62 0.08 65);        /* Brown */
--chart-3: oklch(0.55 0.08 230);       /* Blue */
--chart-4: oklch(0.5 0.15 165);        /* Green jade */
--chart-5: oklch(0.65 0.18 45);        /* Orange amber */

/* Animation Variables */
--animation-fast: 150ms;
--animation-normal: 300ms;
--animation-slow: 500ms;

/* Card Sizes */
--game-card-width: 32px (sm) | 40px (md) | 60px (lg);
--game-card-height: 45px (sm) | 56px (md) | 84px (lg);
```

### Key Architectural Patterns

1. **Game Engine Pattern**: Abstract base classes that all games extend:
   ```typescript
   // lib/game-engine/core/
   interface GameRules<TState> {
     initializeGame(playerCount: number): TState;
     validateMove(state: TState, move: GameMove): ValidationResult;
     applyMove(state: TState, move: GameMove): TState;
     isGameOver(state: TState): boolean;
     getWinner(state: TState): string | null;
   }
   ```

2. **Modular Game Configuration**:
   ```typescript
   // lib/game-engine/config/
   interface GameConfig {
     cardConfig: { allowedRanks: string[]; allowedSuits: string[]; };
     turnConfig: { minDuration: number; maxDuration: number; };
     bettingConfig: { minBet: number; maxBet: number; };
     rules: { canFold: boolean; mustFollowSuit: boolean; };
     eloConfig: { basePoints: number; maxEloGain: number; };
   }
   ```

3. **WebSocket Architecture**: 
   - Custom server integrates Socket.IO with Next.js at `server.js`
   - Real-time events: `game-update`, `player-joined`, `room-chat`
   - Automatic reconnection with state synchronization

4. **tRPC API Structure**:
   ```typescript
   // server/api/routers/
   - game.ts       // Game operations (create, join, playCard, fold)
   - room.ts       // Room management (invite, kick, chat)
   - wallet.ts     // Kora transactions and balance
   - ranking.ts    // ELO system and leaderboards
   ```

5. **User Flow Architecture**:
   ```
   /games                     → Game selection + global leaderboard
   /games/quick?gameType=X    → Quick AI game configuration
   /games/create?gameType=X   → Create multiplayer room
   /games/room/[roomId]       → Waiting room with real-time status
   /games/play/[gameId]       → Live game with animations
   ```

### Database Schema Key Models

```prisma
model User {
  id          String @id @default(cuid())
  email       String @unique
  phone       String @unique
  wallet      Wallet?
  games       GamePlayer[]
  elo         UserElo[]
}

model Room {
  id          String @id @default(cuid())
  code        String @unique      // 6-digit room code
  gameType    GameType           // GARAME, BELOTE, etc.
  status      RoomStatus         // WAITING, IN_PROGRESS, COMPLETED
  betAmount   Int
  maxPlayers  Int
  isPrivate   Boolean
  players     RoomPlayer[]
  gameId      String?            // Links to active game
}

model Game {
  id          String @id @default(cuid())
  type        GameType
  status      GameStatus
  gameState   Json               // Serialized game state
  moves       GameMove[]
  players     GamePlayer[]
  betAmount   Int
  commission  Int @default(10)   // Percentage
}

model UserElo {
  userId      String
  gameType    GameType
  rating      Int @default(1200)
  gamesPlayed Int @default(0)
  wins        Int @default(0)
  losses      Int @default(0)
}

model Transaction {
  id          String @id @default(cuid())
  walletId    String
  gameId      String?
  type        TransactionType    // BET, WIN, COMMISSION, DEPOSIT, WITHDRAWAL
  amount      Int
  balance     Int               // Balance after transaction
  description String
}
```

### Garame Game Specifics

**Rules Summary**:
- 19 cards: 3,4,5,6,7,8,9,10 of each suit (excludes 10♠, A,2,J,Q,K)
- 5 cards per player, 5 rounds maximum
- Must follow suit if possible, otherwise discard any card
- **NO FOLDING** - impossible to fold in Garame
- Win by having control after round 5

**Special Victories**:
- **Kora Simple**: Win round 5 with a 3 (2x bet)
- **Kora Double**: Win rounds 4 & 5 with 3s (4x bet)  
- **Kora Triple**: Win rounds 3, 4 & 5 with 3s (8x bet)
- **Auto-win conditions**: Hand sum < 21, or three 7s

**ELO System**:
- Bronze III (< 800) → Grand Master (2400+)
- Base K-factor: 32, Special victory bonus: +50
- Max gain/loss per game: +150/-100

### Component Organization

```
components/
├── ui/                    # shadcn/ui base components
├── game/
│   ├── enhanced-playing-card.tsx    # Animated card with 8 states
│   ├── enhanced-game-board.tsx      # Main game interface
│   ├── game-lobby.tsx              # Room browser
│   ├── player-hand.tsx             # Player's cards display
│   └── game-notifications.tsx      # Real-time game events
├── wallet/
│   ├── kora-balance.tsx            # Current balance display
│   ├── transaction-history.tsx     # Financial records
│   └── deposit-modal.tsx           # Kora purchase interface
└── ranking/
    ├── elo-badge.tsx               # Rank display with colors
    ├── leaderboard.tsx             # Global rankings
    └── rank-progress.tsx           # Progress to next rank
```

### Real-time Game Flow

1. **Room Creation**: Player creates room via `trpc.room.create`
2. **Player Joining**: Others join via room code or invitation
3. **Game Start**: Automatic when all players ready + countdown
4. **Live Gameplay**: 
   - Moves validated by `GameRules.validateMove()`
   - State updated via `GameRules.applyMove()`
   - Changes broadcast to all players via WebSocket
   - Card animations synchronized across clients
5. **Game End**: ELO calculation + Kora distribution

### Card Animation States

The `EnhancedPlayingCard` component supports these animated states:
- `hidden` → `dealing` → `in-hand` → `playable` → `selected` → `playing` → `played` → `winning`

Animation sequences use Framer Motion with the defined CSS variables for timing.

### Important Implementation Details

- **Path Aliases**: Use `@/*` for imports from project root
- **Authentication**: Protected routes under `app/(authenticated)/`
- **Mock Mode**: Set `NEXT_PUBLIC_USE_MOCK=true` for frontend-only development
- **Environment Variables**:
  ```env
  DATABASE_URL=              # PostgreSQL connection
  NEXTAUTH_SECRET=          # Authentication secret
  REDIS_URL=                # Cache and session storage
  WEBSOCKET_PORT=3001       # WebSocket server port
  MOBILE_MONEY_API_KEY=     # Payment integration
  NEXT_PUBLIC_WS_URL=       # WebSocket client connection
  NEXT_PUBLIC_USE_MOCK=     # Enable mock mode
  ```

### Adding New Games

1. **Game Engine**: Create folder in `lib/game-engine/games/[gameName]/`
   ```typescript
   // Implement required interfaces
   class NewGameRules implements GameRules<NewGameState> { ... }
   interface NewGameState extends GameState { ... }
   class NewGameAI extends AIPlayer<NewGameState> { ... }
   ```

2. **Configuration**: Add to `lib/game-engine/config/`
   ```typescript
   const newGameConfig: GameConfig = {
     cardConfig: { allowedRanks: [...], allowedSuits: [...] },
     rules: { canFold: boolean, mustFollowSuit: boolean },
     // ... other config
   };
   ```

3. **Database**: Add game type to Prisma schema enum
4. **UI Components**: Create game-specific components
5. **Routing**: Add pages following the established flow pattern

### AI Implementation

AI players use strategy pattern with difficulty scaling:
- **Easy**: Random valid moves
- **Medium**: Basic card counting and suit following
- **Hard**: Advanced strategy with opponent modeling

```typescript
// lib/game-engine/ai/
abstract class AIPlayer<TState> {
  abstract calculateMove(state: TState): Promise<GameMove>;
  protected addDelay(): Promise<void> { /* Realistic thinking time */ }
}
```

### Financial System

**Kora Economy**:
- Virtual currency purchased with Mobile Money
- 10% platform commission on all games  
- Automatic distribution after game completion
- Transaction logging for audit/tax purposes

**Transaction Pipeline**:
```typescript
// lib/transactions/GameTransactionPipeline.ts
1. Validate player balances before game start
2. Lock funds during gameplay
3. Calculate winnings based on victory type
4. Distribute to winners (90% of pot)
5. Record platform commission (10%)
6. Update ELO ratings
7. Create transaction records
```

### Performance Considerations

- **Redis Caching**: Room states, active games, leaderboards
- **Database Optimization**: Proper indexing on gameId, userId, timestamp
- **WebSocket Scaling**: Rooms can be distributed across servers via Redis pub/sub
- **Card Animations**: 60fps targets with hardware acceleration
- **Mobile Optimization**: Touch-friendly hit targets, reduced animations on low-end devices

### Testing Strategy

```bash
# Unit Tests
npm run test:game-engine     # Game logic validation
npm run test:elo            # ELO calculation accuracy  
npm run test:transactions   # Financial calculations

# Integration Tests  
npm run test:api            # tRPC endpoint testing
npm run test:websocket      # Real-time communication
npm run test:flow           # Complete game flow

# E2E Tests
npm run test:e2e            # Full user journeys
npm run test:mobile         # Mobile-specific testing
```

### Deployment

**Production Requirements**:
- PostgreSQL database with connection pooling
- Redis instance for caching and WebSocket scaling
- WebSocket server deployment (separate from Next.js if needed)
- CDN for static assets and images
- SSL certificates for WSS connections
- Mobile Money API integration for payments

**Environment Setup**:
```bash
# Production build
npm run build

# Database preparation  
npm run db:migrate
npm run db:seed

# Start production server (includes WebSocket)
npm start
```

### Common Debugging

**Game State Issues**:
- Check Prisma Studio for persisted state
- Enable WebSocket debugging in browser dev tools
- Use `npm run test:game-engine` to validate logic

**WebSocket Problems**:
- Verify `NEXT_PUBLIC_WS_URL` matches server
- Check network tab for connection failures
- Test with `npm run ws:test`

**Animation Performance**:
- Enable React DevTools Profiler
- Check for 60fps in Performance tab
- Reduce animation complexity on mobile

**ELO Calculation Errors**:
- Use `npm run test:elo` with specific scenarios
- Check transaction history for calculation audit trail

---

Remember: This is a production card game platform handling real money (Koras), so prioritize security, data integrity, and fair play in all implementations.