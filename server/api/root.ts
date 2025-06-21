import { createTRPCRouter } from './trpc';
import { gameRouter } from './routers/game';
import { lobbyRouter } from './routers/lobby';
import { walletRouter } from './routers/wallet';
import { roomRouter } from './routers/room';

export const appRouter = createTRPCRouter({
  game: gameRouter,
  lobby: lobbyRouter,
  wallet: walletRouter,
  room: roomRouter,
});

export type AppRouter = typeof appRouter; 