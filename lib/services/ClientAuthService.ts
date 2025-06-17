import { injectable } from 'inversify';
import { Session } from '@/lib/auth';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';
import { authClient } from '@/lib/auth-client';

@injectable()
export class ClientAuthService implements IAuthService {
  async getSession(): Promise<Session | null> {
    const { data, error } = await authClient.getSession();
    if (error || !data) return null;
    
    // Map the client session to our Session type
    return {
      user: data.user,
      session: data.session
    } as Session;
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