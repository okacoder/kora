'use server';

import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
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
      const cookieStore = cookies();
      const headers = new Headers();
      headers.set('Cookie', cookieStore.toString());

      const session = await auth.api.getSession({
        headers,
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

  async updateUser(userId: string, data: {
    username?: string;
    phoneNumber?: string;
    role?: 'USER' | 'ADMIN' | 'MODERATOR';
    koras?: number;
    totalWins?: number;
    totalGames?: number;
  }): Promise<void> {
    try {
      const cookieStore = cookies();
      const headers = new Headers();
      headers.set('Cookie', cookieStore.toString());

      await auth.api.updateUser({
        headers,
        body: {
          id: userId,
          ...data,
        },
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}

export const authService = AuthService.getInstance(); 