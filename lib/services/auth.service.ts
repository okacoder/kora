import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { Session } from '@/lib/auth';

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async getSession(): Promise<Session | null> {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      return session;
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
}

export const authService = AuthService.getInstance(); 