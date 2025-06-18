import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { username } from "better-auth/plugins"

const prisma = new PrismaClient();

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// @ts-ignore - Création d'un adaptateur mock simple
const mockAdapter = {
  getUserByEmail: async (email: string) => null,
  getUserByUsername: async (username: string) => {
    if (username === 'testuser') {
      return {
        id: 'test-user-1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        phoneNumber: '+1234567890',
        koras: 5000,
        totalWins: 10,
        totalGames: 10,
        hashedPassword: "hashed_password_placeholder", // requis par better-auth
        emailVerified: true,
      };
    }
    return null;
  },
  createUser: async (data: any) => data,
  getSession: async (sessionId: any) => null,
  createSession: async (data: any) => data,
  updateSession: async (sessionId: any, data: any) => ({ ...data, sessionId }),
  deleteSession: async (sessionId: any) => {},
  getSessionsByUserId: async (userId: any) => [],
  deleteSessionsByUserId: async (userId: any) => {},
};

const options = {
  emailAndPassword: {
    enabled: true,
  },
  database: useMock ? mockAdapter : prismaAdapter(prisma, {
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
    nextCookies(),
     username({
      minUsernameLength: 3,
      maxUsernameLength: 20,
     }) 
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
});

export type Session = typeof auth.$Infer.Session;