import { inject, injectable } from "inversify";
import { TYPES } from "../infrastructure/ioc-container";
import type {
  IGameService,
  IPaymentService,
  IPlayerRepository,
  IGameRoomRepository,
  IGameStateRepository,
  ITransactionRepository,
  IGameRoom,
  IGameState,
  ITransaction,
  IGameEventHandler,
  IGameEvent,
} from "../domain/interfaces";

@injectable()
export class GameService implements IGameService {
  constructor(
    @inject(TYPES.PlayerRepository) private playerRepo: IPlayerRepository,
    @inject(TYPES.GameRoomRepository) private gameRoomRepo: IGameRoomRepository,
    @inject(TYPES.GameStateRepository) private gameStateRepo: IGameStateRepository,
    @inject(TYPES.TransactionRepository) private transactionRepo: ITransactionRepository,
    @inject(TYPES.GameEventHandler) private eventHandler: IGameEventHandler
  ) {}
  
  async createGame(stake: number): Promise<IGameRoom> {
    const currentPlayer = await this.playerRepo.getCurrentPlayer();
    
    // Créer la room
    const room = await this.gameRoomRepo.createRoom(stake, currentPlayer.id);
    
    // Créer la transaction de mise
    await this.transactionRepo.createTransaction({
      userId: currentPlayer.id,
      type: 'game_stake',
      amount: -stake,
      gameId: room.id,
      status: 'completed',
    });
    
    // Émettre l'événement
    this.eventHandler.emit({
      type: 'player_joined',
      gameId: room.id,
      data: { playerId: currentPlayer.id, playerName: currentPlayer.username },
      timestamp: new Date(),
    });
    
    return room;
  }
  
  async joinGame(roomId: string): Promise<IGameRoom> {
    const currentPlayer = await this.playerRepo.getCurrentPlayer();
    
    // Rejoindre la room
    const room = await this.gameRoomRepo.joinRoom(roomId, currentPlayer.id);
    
    // Créer la transaction de mise
    await this.transactionRepo.createTransaction({
      userId: currentPlayer.id,
      type: 'game_stake',
      amount: -room.stake,
      gameId: roomId,
      status: 'completed',
    });
    
    // Émettre l'événement
    this.eventHandler.emit({
      type: 'player_joined',
      gameId: roomId,
      data: { playerId: currentPlayer.id, playerName: currentPlayer.username },
      timestamp: new Date(),
    });
    
    // Démarrer automatiquement la partie après un délai
    setTimeout(async () => {
      await this.startGame(roomId);
    }, 3000);
    
    return room;
  }
  
  async leaveGame(roomId: string): Promise<void> {
    const currentPlayer = await this.playerRepo.getCurrentPlayer();
    await this.gameRoomRepo.leaveRoom(roomId, currentPlayer.id);
    
    // Émettre l'événement
    this.eventHandler.emit({
      type: 'player_left',
      gameId: roomId,
      data: { playerId: currentPlayer.id },
      timestamp: new Date(),
    });
  }
  
  async getAvailableGames(): Promise<IGameRoom[]> {
    return await this.gameRoomRepo.getAvailableRooms();
  }
  
  async getGameRoom(roomId: string): Promise<IGameRoom | null> {
    return await this.gameRoomRepo.getRoomById(roomId);
  }
  
  async startGame(roomId: string): Promise<IGameState> {
    const room = await this.gameRoomRepo.getRoomById(roomId);
    if (!room || !room.opponentId) {
      throw new Error("La partie ne peut pas commencer");
    }
    
    // Créer l'état de jeu
    const gameState = await this.gameStateRepo.createGameState(
      roomId,
      [room.creatorId, room.opponentId]
    );
    
    // Mettre à jour le statut de la room
    await this.gameRoomRepo.updateRoomStatus(roomId, 'in_progress');
    
    // Émettre l'événement
    this.eventHandler.emit({
      type: 'game_started',
      gameId: roomId,
      data: { gameStateId: gameState.id },
      timestamp: new Date(),
    });
    
    return gameState;
  }
  
  async playCard(gameId: string, cardIndex: number): Promise<IGameState> {
    const currentPlayer = await this.playerRepo.getCurrentPlayer();
    const gameState = await this.gameStateRepo.playCard(gameId, currentPlayer.id, cardIndex);

    // Si la partie est terminée, gérer les gains et le statut
    if (gameState.status === 'finished' && gameState.winnerId) {
      const winAmount = Math.floor(gameState.pot * 0.9);
      
      // Créer la transaction de gain
      await this.transactionRepo.createTransaction({
        userId: gameState.winnerId,
        type: 'game_win',
        amount: winAmount,
        gameId: gameState.id,
        status: 'completed',
      });
      
      // Mettre à jour le statut de la room
      await this.gameRoomRepo.updateRoomStatus(gameState.roomId, 'completed');
    }
    
    // Émettre l'événement de mise à jour du state
    this.eventHandler.emit({
      type: 'game_state_updated',
      gameId: gameState.roomId,
      data: gameState,
      timestamp: new Date(),
    });
    
    return gameState;
  }
  
  async getGameState(gameId: string): Promise<IGameState | null> {
    return await this.gameStateRepo.getGameState(gameId);
  }
}

@injectable()
export class PaymentService implements IPaymentService {
  constructor(
    @inject(TYPES.PlayerRepository) private playerRepo: IPlayerRepository,
    @inject(TYPES.TransactionRepository) private transactionRepo: ITransactionRepository
  ) {}
  
  async deposit(amount: number, method: 'airtel' | 'moov'): Promise<ITransaction> {
    const currentPlayer = await this.playerRepo.getCurrentPlayer();
    
    // Simuler le traitement du paiement
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Créer la transaction
    const transaction = await this.transactionRepo.createTransaction({
      userId: currentPlayer.id,
      type: 'deposit',
      amount,
      status: 'completed',
    });
    
    // Mettre à jour le solde
    await this.playerRepo.updateBalance(currentPlayer.id, amount);
    
    return transaction;
  }
  
  async withdraw(amount: number, method: 'airtel' | 'moov'): Promise<ITransaction> {
    const currentPlayer = await this.playerRepo.getCurrentPlayer();
    
    if (currentPlayer.balance < amount) {
      throw new Error("Solde insuffisant");
    }
    
    // Simuler le traitement du retrait
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Créer la transaction
    const transaction = await this.transactionRepo.createTransaction({
      userId: currentPlayer.id,
      type: 'withdrawal',
      amount: -amount,
      status: 'completed',
    });
    
    // Mettre à jour le solde
    await this.playerRepo.updateBalance(currentPlayer.id, -amount);
    
    return transaction;
  }
  
  async getBalance(): Promise<number> {
    const currentPlayer = await this.playerRepo.getCurrentPlayer();
    return currentPlayer.balance;
  }
  
  async getTransactionHistory(): Promise<ITransaction[]> {
    const currentPlayer = await this.playerRepo.getCurrentPlayer();
    return await this.transactionRepo.getUserTransactions(currentPlayer.id);
  }
}

// Gestionnaire d'événements fake (simule WebSocket)
@injectable()
export class FakeGameEventHandler implements IGameEventHandler {
  private subscribers: Map<string, ((event: IGameEvent) => void)[]> = new Map();
  
  subscribe(gameId: string, callback: (event: IGameEvent) => void): void {
    if (!this.subscribers.has(gameId)) {
      this.subscribers.set(gameId, []);
    }
    this.subscribers.get(gameId)!.push(callback);
  }
  
  unsubscribe(gameId: string): void {
    this.subscribers.delete(gameId);
  }
  
  emit(event: IGameEvent): void {
    const callbacks = this.subscribers.get(event.gameId) || [];
    callbacks.forEach(callback => {
      // Simuler un délai réseau
      setTimeout(() => callback(event), Math.random() * 100 + 50);
    });
  }
}