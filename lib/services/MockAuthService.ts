import { injectable } from 'inversify';
import { Session } from '@/lib/auth';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';
import { user as User } from '@prisma/client';

@injectable()
export class MockAuthService implements IAuthService {
  private mockSession: Session | null;

  constructor() {
    const testUser: User = {
      id: 'test-user-1',
      name: 'Test User',
      username: 'testuser',
      displayUsername: 'TestUser',
      role: 'USER',
      email: 'test@example.com',
      emailVerified: true,
      phoneNumber: '+1234567890',
      phoneNumberVerified: true,
      image: null,
      koras: 5000,
      totalWins: 10,
      totalGames: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockSession = {
      user: testUser,
      session: {
        id: 'test-session-1',
        userId: 'test-user-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: 'test-token',
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test'
      }
    };
  }

  async getSession(): Promise<Session | null> {
    return this.mockSession;
  }

  async getCurrentUserId(): Promise<string | null> {
    return this.mockSession?.user?.id || null;
  }

  async isAuthenticated(): Promise<boolean> {
    return !!this.mockSession;
  }

  async hasRole(role: string): Promise<boolean> {
    return this.mockSession?.user?.role === role;
  }

  async signInWithUsernamePassword(username: string, password: string): Promise<{ user?: User; error?: string; }> {
    if (username === 'testuser' && this.mockSession?.user) {
      return { user: this.mockSession.user };
    }
    return { error: 'Invalid credentials' };
  }

  async signUpWithEmailPassword(data: any): Promise<{ user?: User; error?: string; }> {
    // Simule une inscription réussie et retourne l'utilisateur de test.
    if (this.mockSession?.user) {
      return { user: this.mockSession.user };
    }
    return { error: 'Mock user not configured' };
  }

  // Méthode utilitaire pour les tests
  setMockSession(session: Session | null): void {
    this.mockSession = session;
  }
}