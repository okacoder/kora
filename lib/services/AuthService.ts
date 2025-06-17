import { injectable } from 'inversify';
import { Session } from '@/lib/auth';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

@injectable()
export class AuthService implements IAuthService {
  async getSession(): Promise<Session | null> {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
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