import { injectable } from 'inversify';
import { Session } from '@/lib/auth';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';

@injectable()
export class MockAuthService implements IAuthService {
  private mockSession: Session | null = {
    user: {
      id: 'test-user-1',
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      role: 'USER',
      phoneNumber: '+1234567890',
      koras: 1000,
      totalWins: 0,
      totalGames: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,
      phoneNumberVerified: true,
      image: null,
      displayUsername: 'TestUser'
    },
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

  // Méthode utilitaire pour les tests
  setMockSession(session: Session | null): void {
    this.mockSession = session;
  }
}