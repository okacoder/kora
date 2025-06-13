import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { username } from "better-auth/plugins"

const prisma = new PrismaClient();

const options = {
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  user: {
    additionalFields: {
      username: {
        type: 'string',
        required: true,
        unique: true,
      },
      role: {
        type: ['USER', 'ADMIN', 'MODERATOR'] as const,
        required: true,
      },
      phoneNumber: {
        type: 'string',
        required: true,
        unique: true,
      },
    },
  },
  plugins: [
    nextCookies(),
     username({
      minUsernameLength: 4
     }) 
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
});

export type Session = typeof auth.$Infer.Session;

