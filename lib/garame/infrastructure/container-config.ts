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

// Configuration pour l'environnement de développement (fake repositories)
export function configureFakeContainer() {
  // Repositories
  container.bind<IPlayerRepository>(TYPES.PlayerRepository).to(FakePlayerRepository).inSingletonScope();
  container.bind<IGameRoomRepository>(TYPES.GameRoomRepository).to(FakeGameRoomRepository).inSingletonScope();
  container.bind<IGameStateRepository>(TYPES.GameStateRepository).to(FakeGameStateRepository).inSingletonScope();
  container.bind<ITransactionRepository>(TYPES.TransactionRepository).to(FakeTransactionRepository).inSingletonScope();
  
  // Event Handler
  container.bind<IGameEventHandler>(TYPES.GameEventHandler).to(FakeGameEventHandler).inSingletonScope();
  
  // Services
  container.bind<IGameService>(TYPES.GameService).to(GameService).inSingletonScope();
  container.bind<IPaymentService>(TYPES.PaymentService).to(PaymentService).inSingletonScope();
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