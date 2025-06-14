// lib/garame/infrastructure/container-config.ts
import { container, TYPES } from "./ioc-container";
import {
  IPlayerRepository,
  IGameRoomRepository,
  IGameStateRepository,
  ITransactionRepository,
  IGameService,
  IPaymentService,
  IGameEventHandler,
} from "../domain/interfaces";
import {
  FakePlayerRepository,
  FakeGameRoomRepository,
  FakeGameStateRepository,
  FakeTransactionRepository,
} from "./fake-repositories";
import {
  GameService,
  PaymentService,
  FakeGameEventHandler,
} from "../application/services";

// Helper to avoid duplicate bindings that lead to "Ambiguous bindings" errors.
function bindSingletonOnce<T>(identifier: symbol, constructor: new (...args: any[]) => T) {
  if (!container.isBound(identifier)) {
    container.bind<T>(identifier).to(constructor).inSingletonScope();
  }
}

// Configuration pour l'environnement de développement (fake repositories)
export function configureFakeContainer() {
  // Repositories
  bindSingletonOnce<IPlayerRepository>(TYPES.PlayerRepository, FakePlayerRepository);
  bindSingletonOnce<IGameRoomRepository>(TYPES.GameRoomRepository, FakeGameRoomRepository);
  bindSingletonOnce<IGameStateRepository>(TYPES.GameStateRepository, FakeGameStateRepository);
  bindSingletonOnce<ITransactionRepository>(TYPES.TransactionRepository, FakeTransactionRepository);
  
  // Event Handler
  bindSingletonOnce<IGameEventHandler>(TYPES.GameEventHandler, FakeGameEventHandler);
  
  // Services
  bindSingletonOnce<IGameService>(TYPES.GameService, GameService);
  bindSingletonOnce<IPaymentService>(TYPES.PaymentService, PaymentService);
}

// Configuration pour la production (vraies implémentations)
export function configureProductionContainer() {
  // TODO: Remplacer par les vraies implémentations
  // container.bind<IPlayerRepository>(TYPES.PlayerRepository).to(RealPlayerRepository).inSingletonScope();
  // container.bind<IGameRoomRepository>(TYPES.GameRoomRepository).to(RealGameRoomRepository).inSingletonScope();
  // etc...
}

// Initialiser le container selon l'environnement
export function initializeContainer() {
  // Invalidate previous bindings during HMR or re-initialization to avoid "Ambiguous bindings" errors
  try {
    container.unbindAll();
  } catch {
    // ignore if already unbound
  }
  if (process.env.NODE_ENV === 'production') {
    // configureProductionContainer();
    // Pour l'instant, utiliser les fakes même en production
    configureFakeContainer();
  } else {
    configureFakeContainer();
  }
}

// Fonction helper pour obtenir un service
export function getService<T>(serviceIdentifier: symbol): T {
  return container.get<T>(serviceIdentifier);
}