export const TYPES = {
  // Repositories
  UserRepository: Symbol.for('UserRepository'),
  GameRoomRepository: Symbol.for('GameRoomRepository'),
  GameStateRepository: Symbol.for('GameStateRepository'),
  TransactionRepository: Symbol.for('TransactionRepository'),
  
  // Services
  UserService: Symbol.for('UserService'),
  AuthService: Symbol.for('AuthService'),
  GameRoomService: Symbol.for('GameRoomService'),
  GameEngineService: Symbol.for('GameEngineService'),
  GameStateService: Symbol.for('GameStateService'),
  PaymentService: Symbol.for('PaymentService'),
  EventBusService: Symbol.for('EventBusService'),
  AIService: Symbol.for('AIService'),
  MobileMoneyService: Symbol.for('MobileMoneyService'),
};