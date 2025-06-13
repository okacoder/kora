import { Container } from "inversify";
import "reflect-metadata";

// Identifiants pour l'injection
export const TYPES = {
  PlayerRepository: Symbol.for("PlayerRepository"),
  GameRoomRepository: Symbol.for("GameRoomRepository"),
  GameStateRepository: Symbol.for("GameStateRepository"),
  TransactionRepository: Symbol.for("TransactionRepository"),
  GameService: Symbol.for("GameService"),
  PaymentService: Symbol.for("PaymentService"),
  GameEventHandler: Symbol.for("GameEventHandler"),
};

// Créer le container
const container = new Container();

export { container };