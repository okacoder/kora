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
import { GameRoomRepository } from '@/lib/repositories/GameRoomRepository';
import { GameStateRepository } from '@/lib/repositories/GameStateRepository';
import { TransactionRepository } from '@/lib/repositories/TransactionRepository';
import { MockUserRepository } from '@/lib/repositories/MockUserRepository';
import { MockGameRoomRepository } from '@/lib/repositories/MockGameRoomRepository';
import { MockGameStateRepository } from '@/lib/repositories/MockGameStateRepository';
import { MockTransactionRepository } from '@/lib/repositories/MockTransactionRepository';

// Service Implementations
import { UserService } from '@/lib/services/UserService';
import { AuthService } from '@/lib/services/AuthService';
import { GameRoomService } from '@/lib/services/GameRoomService';
import { GameEngineService } from '@/lib/services/GameEngineService';
import { GameStateService } from '@/lib/services/GameStateService';
import { PaymentService } from '@/lib/services/PaymentService';
import { EventBusService } from '@/lib/services/EventBusService';
import { GarameAIService } from '@/lib/services/GarameAIService';
import { GarameAIServiceAdapter } from '@/lib/services/GarameAIServiceAdapter';
import { MobileMoneyService } from '@/lib/services/MobileMoneyService';
import { MockAuthService } from '@/lib/services/MockAuthService';
import { MockMobileMoneyService } from '@/lib/services/MockMobileMoneyService';

const serverContainer = new Container();
const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// Repositories
if (useMock) {
    serverContainer.bind<IUserRepository>(TYPES.UserRepository).to(MockUserRepository).inSingletonScope();
    serverContainer.bind<IGameRoomRepository>(TYPES.GameRoomRepository).to(MockGameRoomRepository).inSingletonScope();
    serverContainer.bind<IGameStateRepository>(TYPES.GameStateRepository).to(MockGameStateRepository).inSingletonScope();
    serverContainer.bind<ITransactionRepository>(TYPES.TransactionRepository).to(MockTransactionRepository).inSingletonScope();
} else {
    serverContainer.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
    serverContainer.bind<IGameRoomRepository>(TYPES.GameRoomRepository).to(GameRoomRepository).inSingletonScope();
    serverContainer.bind<IGameStateRepository>(TYPES.GameStateRepository).to(GameStateRepository).inSingletonScope();
    serverContainer.bind<ITransactionRepository>(TYPES.TransactionRepository).to(TransactionRepository).inSingletonScope();
}

// Services
serverContainer.bind<IUserService>(TYPES.UserService).to(UserService).inSingletonScope();
serverContainer.bind<IGameRoomService>(TYPES.GameRoomService).to(GameRoomService).inSingletonScope();
serverContainer.bind<IGameEngineService>(TYPES.GameEngineService).to(GameEngineService).inSingletonScope();
serverContainer.bind<IGameStateService>(TYPES.GameStateService).to(GameStateService).inSingletonScope();
serverContainer.bind<IPaymentService>(TYPES.PaymentService).to(PaymentService).inSingletonScope();
serverContainer.bind<IEventBusService>(TYPES.EventBusService).to(EventBusService).inSingletonScope();
serverContainer.bind<IAIService>(TYPES.AIService).to(GarameAIService).inSingletonScope();
serverContainer.bind<IGarameAIService>(TYPES.GarameAIService).to(GarameAIServiceAdapter).inSingletonScope();

if (useMock) {
    serverContainer.bind<IAuthService>(TYPES.AuthService).to(MockAuthService).inSingletonScope();
    serverContainer.bind<IMobileMoneyService>(TYPES.MobileMoneyService).to(MockMobileMoneyService).inSingletonScope();
} else {
    serverContainer.bind<IAuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
    serverContainer.bind<IMobileMoneyService>(TYPES.MobileMoneyService).to(MobileMoneyService).inSingletonScope();
}

export { serverContainer };