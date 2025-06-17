import { Session } from '@/lib/auth';

export interface IAuthService {
  getSession(): Promise<Session | null>;
  getCurrentUserId(): Promise<string | null>;
  isAuthenticated(): Promise<boolean>;
  hasRole(role: string): Promise<boolean>;
}