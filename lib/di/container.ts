import { Container } from 'inversify';
import { TYPES } from './types';

// Repository Interfaces
import { IUserRepository } from '@/lib/interfaces/repositories/IUserRepository';
import { IGameRoomRepository } from '@/lib/interfaces/repositories/IGameRoomRepository';
import { IGameStateRepository } from '@/lib/interfaces/repositories/IGameStateRepository';
import { ITransactionRepository } from '@/lib/interfaces/repositories/ITransactionRepository';

// Service Interfaces
import { IUserService } from '@/lib/interfaces/services/IUserService';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';
import { IGameRoomService } from '@/lib/interfaces/services/IGameRoomService';
import { IGameEngineService } from '@/lib/interfaces/services/IGameEngineService';
import { IGameStateService } from '@/lib/interfaces/services/IGameStateService';
import { IPaymentService } from '@/lib/interfaces/services/IPaymentService';
import { IEventBusService } from '@/lib/interfaces/services/IEventBusService';
import { IAIService, IGarameAIService } from '@/lib/interfaces/services/IAIService';
import { IMobileMoneyService } from '@/lib/interfaces/services/IMobileMoneyService';

// Repository Implementations
import { UserRepository } from '@/lib/repositories/UserRepository';
import { MockUserRepository } from '@/lib/repositories/MockUserRepository';
import { GameRoomRepository } from '@/lib/repositories/GameRoomRepository';
import { MockGameRoomRepository } from '@/lib/repositories/MockGameRoomRepository';
import { GameStateRepository } from '@/lib/repositories/GameStateRepository';
import { MockGameStateRepository } from '@/lib/repositories/MockGameStateRepository';
import { TransactionRepository } from '@/lib/repositories/TransactionRepository';
import { MockTransactionRepository } from '@/lib/repositories/MockTransactionRepository';

// Service Implementations
import { UserService } from '@/lib/services/UserService';
import { AuthService } from '@/lib/services/AuthService';
import { ClientAuthService } from '@/lib/services/ClientAuthService';
import { MockAuthService } from '@/lib/services/MockAuthService';
import { GameRoomService } from '@/lib/services/GameRoomService';
import { GameEngineService } from '@/lib/services/GameEngineService';
import { GameStateService } from '@/lib/services/GameStateService';
import { PaymentService } from '@/lib/services/PaymentService';
import { EventBusService } from '@/lib/services/EventBusService';
import { GarameAIService } from '@/lib/services/GarameAIService';
import { GarameAIServiceAdapter } from '@/lib/services/GarameAIServiceAdapter';
import { MobileMoneyService } from '@/lib/services/MobileMoneyService';
import { MockMobileMoneyService } from '@/lib/services/MockMobileMoneyService';

const container = new Container();

// Configuration en fonction de l'environnement
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const IS_CLIENT = typeof window !== 'undefined';

// Repositories
if (USE_MOCK) {
  // Mocks
  container.bind<IUserRepository>(TYPES.UserRepository).to(MockUserRepository).inSingletonScope();
  container.bind<IGameRoomRepository>(TYPES.GameRoomRepository).to(MockGameRoomRepository).inSingletonScope();
  container.bind<IGameStateRepository>(TYPES.GameStateRepository).to(MockGameStateRepository).inSingletonScope();
  container.bind<ITransactionRepository>(TYPES.TransactionRepository).to(MockTransactionRepository).inSingletonScope();
  container.bind<IAuthService>(TYPES.AuthService).to(MockAuthService).inSingletonScope();
  container.bind<IMobileMoneyService>(TYPES.MobileMoneyService).to(MockMobileMoneyService).inSingletonScope();
} else {
  // Implémentations réelles
  container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
  container.bind<IGameRoomRepository>(TYPES.GameRoomRepository).to(GameRoomRepository).inSingletonScope();
  container.bind<IGameStateRepository>(TYPES.GameStateRepository).to(GameStateRepository).inSingletonScope();
  container.bind<ITransactionRepository>(TYPES.TransactionRepository).to(TransactionRepository).inSingletonScope();
  // Use ClientAuthService for client-side, AuthService for server-side
  container.bind<IAuthService>(TYPES.AuthService).to(IS_CLIENT ? ClientAuthService : AuthService).inSingletonScope();
  container.bind<IMobileMoneyService>(TYPES.MobileMoneyService).to(MobileMoneyService).inSingletonScope();
}

// Services (toujours les mêmes peu importe l'environnement)
container.bind<IUserService>(TYPES.UserService).to(UserService).inSingletonScope();
container.bind<IGameRoomService>(TYPES.GameRoomService).to(GameRoomService).inSingletonScope();
container.bind<IGameEngineService>(TYPES.GameEngineService).to(GameEngineService).inSingletonScope();
container.bind<IGameStateService>(TYPES.GameStateService).to(GameStateService).inSingletonScope();
container.bind<IPaymentService>(TYPES.PaymentService).to(PaymentService).inSingletonScope();
container.bind<IEventBusService>(TYPES.EventBusService).to(EventBusService).inSingletonScope();
container.bind<IAIService>(TYPES.AIService).to(GarameAIService).inSingletonScope();
container.bind<IGarameAIService>(TYPES.GarameAIService).to(GarameAIServiceAdapter).inSingletonScope();

export { container };