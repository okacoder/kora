import { createAuthClient } from 'better-auth/client';
import type { Session } from '@/lib/auth';

const authClient = createAuthClient({
  baseURL: '/api/auth',
});

export type AuthSession = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
    username: string;
    role: 'USER' | 'ADMIN' | 'MODERATOR';
    phoneNumber: string;
    koras: number;
    totalWins: number;
    totalGames: number;
  };
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

class ClientAuthService {
  private static instance: ClientAuthService;
  private currentSession: AuthSession | null = null;

  private constructor() {}

  static getInstance(): ClientAuthService {
    if (!ClientAuthService.instance) {
      ClientAuthService.instance = new ClientAuthService();
    }
    return ClientAuthService.instance;
  }

  private convertSession(session: any): AuthSession | null {
    if (!session) return null;

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        createdAt: new Date(session.user.createdAt),
        updatedAt: new Date(session.user.updatedAt),
        image: session.user.image,
        username: session.user.username || session.user.name,
        role: session.user.role || 'USER',
        phoneNumber: session.user.phoneNumber || '',
        koras: session.user.koras || 0,
        totalWins: session.user.totalWins || 0,
        totalGames: session.user.totalGames || 0,
      },
      session: {
        id: session.session.id,
        createdAt: new Date(session.session.createdAt),
        updatedAt: new Date(session.session.updatedAt),
        userId: session.session.userId,
        expiresAt: new Date(session.session.expiresAt),
        token: session.session.token,
        ipAddress: session.session.ipAddress,
        userAgent: session.session.userAgent,
      },
    };
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const { data: session } = await authClient.getSession();
      this.currentSession = this.convertSession(session);
      return this.currentSession;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
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

  async login(email: string, password: string): Promise<AuthSession | null> {
    try {
      const { data: session } = await authClient.signIn.email({
        email,
        password,
      });
      this.currentSession = this.convertSession(session);
      return this.currentSession;
    } catch (error) {
      console.error('Error during login:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await authClient.signOut();
      this.currentSession = null;
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  async register(data: {
    email: string;
    password: string;
    username: string;
    phoneNumber: string;
  }): Promise<AuthSession | null> {
    try {
      // First, register the user
      const { data: session } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.username,
      });

      // Then update the user with additional fields
      if (session?.user) {
        await fetch('/api/auth/user', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: data.username,
            phoneNumber: data.phoneNumber,
            role: 'USER',
          }),
        });

        // Get the updated session
        const { data: updatedSession } = await authClient.getSession();
        this.currentSession = this.convertSession(updatedSession);
        return this.currentSession;
      }

      return null;
    } catch (error) {
      console.error('Error during registration:', error);
      return null;
    }
  }
}

export const clientAuthService = ClientAuthService.getInstance(); 