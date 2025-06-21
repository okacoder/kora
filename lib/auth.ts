import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { betterAuth, type BetterAuthOptions } from 'better-auth';
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
      koras: {
        type: 'number',
        required: false,
        defaultValue: 0,
      },
      totalWins: {
        type: 'number',
        required: false,
        defaultValue: 0,
      },
      totalGames: {
        type: 'number',
        required: false,
        defaultValue: 0,
      },
    },
  },
  plugins: [
     username({
      minUsernameLength: 3,
      maxUsernameLength: 20,
     }),
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
});

export type Session = typeof auth.$Infer.Session;