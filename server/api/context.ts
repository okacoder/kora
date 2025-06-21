import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { inferAsyncReturnType } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers as any,
  });

  return {
    session,
    db: prisma,
    req: opts.req,
  };
}

export type Context = inferAsyncReturnType<typeof createTRPCContext>; 