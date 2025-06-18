'use client';

import { container } from '@/lib/di/container';
import { TYPES } from '@/lib/di/types';
import { IUserService } from '@/lib/interfaces/services/IUserService';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';
import { IGameRoomService } from '@/lib/interfaces/services/IGameRoomService';
import { IGameEngineService } from '@/lib/interfaces/services/IGameEngineService';
import { IGameStateService } from '@/lib/interfaces/services/IGameStateService';
import { IPaymentService } from '@/lib/interfaces/services/IPaymentService';
import { IEventBusService } from '@/lib/interfaces/services/IEventBusService';
import { IAIService, IGarameAIService } from '@/lib/interfaces/services/IAIService';
import { IMobileMoneyService } from '@/lib/interfaces/services/IMobileMoneyService';
import { ITransactionRepository } from '@/lib/interfaces/repositories/ITransactionRepository';

export function useInjection<T>(serviceIdentifier: symbol): T {
  return container.get<T>(serviceIdentifier);
}

// Hooks spécifiques pour faciliter l'usage
export const useUserService = () => useInjection<IUserService>(TYPES.UserService);
export const useAuthService = () => useInjection<IAuthService>(TYPES.AuthService);
export const useGameRoomService = () => useInjection<IGameRoomService>(TYPES.GameRoomService);
export const useGameEngineService = () => useInjection<IGameEngineService>(TYPES.GameEngineService);
export const useGameStateService = () => useInjection<IGameStateService>(TYPES.GameStateService);
export const usePaymentService = () => useInjection<IPaymentService>(TYPES.PaymentService);
export const useEventBus = () => useInjection<IEventBusService>(TYPES.EventBusService);
export const useAIService = () => useInjection<IAIService>(TYPES.AIService);
export const useGarameAI = () => useInjection<IGarameAIService>(TYPES.GarameAIService);
export const useMobileMoneyService = () => useInjection<IMobileMoneyService>(TYPES.MobileMoneyService);
export const useTransactionRepository = () => useInjection<ITransactionRepository>(TYPES.TransactionRepository);