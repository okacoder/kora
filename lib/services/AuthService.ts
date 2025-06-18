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

  async signInWithUsernamePassword(username: string, password: string): Promise<{ user?: User; error?: string; }> {
    const { data, error } = await auth.api.signIn.username({ username, password, rememberMe: true });
    if (error) {
      return { error: error.message };
    }
    return { user: data.user };
  }

  async signUpWithEmailPassword(data: any): Promise<{ user?: User; error?:string; }> {
    const { data: result, error } = await auth.api.signUp.email(data);
     if (error) {
      return { error: error.message };
    }
    return { user: result.user };
  }
}