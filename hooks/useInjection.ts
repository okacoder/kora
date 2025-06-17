import { container, TYPES } from '@/lib/di';
import { IUserService } from '@/lib/interfaces/services/IUserService';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';

export function useInjection<T>(serviceIdentifier: symbol): T {
  return container.get<T>(serviceIdentifier);
}

// Hooks spécifiques pour faciliter l'usage
export function useUserService() {
  return useInjection<IUserService>(TYPES.UserService);
}

export function useAuthService() {
  return useInjection<IAuthService>(TYPES.AuthService);
}