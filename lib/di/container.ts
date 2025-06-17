import { Container } from 'inversify';
import { TYPES } from './types';

// Interfaces
import { IUserRepository } from '@/lib/interfaces/repositories/IUserRepository';
import { IUserService } from '@/lib/interfaces/services/IUserService';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';

// Implementations
import { UserRepository } from '@/lib/repositories/UserRepository';
import { MockUserRepository } from '@/lib/repositories/MockUserRepository';
import { UserService } from '@/lib/services/UserService';
import { AuthService } from '@/lib/services/AuthService';
import { MockAuthService } from '@/lib/services/MockAuthService';

const container = new Container();

// Configuration en fonction de l'environnement
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// Repositories
if (USE_MOCK) {
  container.bind<IUserRepository>(TYPES.UserRepository).to(MockUserRepository).inSingletonScope();
  container.bind<IAuthService>(TYPES.AuthService).to(MockAuthService).inSingletonScope();
} else {
  container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
  container.bind<IAuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
}

// Services (toujours les mêmes)
container.bind<IUserService>(TYPES.UserService).to(UserService).inSingletonScope();

export { container };