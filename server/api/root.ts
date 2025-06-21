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