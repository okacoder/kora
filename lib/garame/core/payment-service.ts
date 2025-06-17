import { PaymentService } from './types';
import { gameStore } from './game-store';

class PaymentServiceImpl implements PaymentService {
  private static instance: PaymentServiceImpl;

  private constructor() {}

  static getInstance(): PaymentServiceImpl {
    if (!PaymentServiceImpl.instance) {
      PaymentServiceImpl.instance = new PaymentServiceImpl();
    }
    return PaymentServiceImpl.instance;
  }

  async processStake(playerId: string, amount: number, roomId: string): Promise<void> {
    // Deduct stake from player balance
    await gameStore.updatePlayerBalance(playerId, -amount);
    
    // In a real implementation, this would:
    // 1. Create a transaction record
    // 2. Update the room's pot
    // 3. Handle payment gateway integration
    console.log(`Processed stake: Player ${playerId} staked ${amount} FCFA in room ${roomId}`);
  }

  async processWinning(playerId: string, amount: number, gameId: string): Promise<void> {
    // Add winnings to player balance
    await gameStore.updatePlayerBalance(playerId, amount);
    
    // In a real implementation, this would:
    // 1. Create a transaction record
    // 2. Update player statistics
    // 3. Handle tax calculations if needed
    console.log(`Processed winning: Player ${playerId} won ${amount} FCFA from game ${gameId}`);
  }

  async getPlayerBalance(playerId: string): Promise<number> {
    const player = await gameStore.getPlayer(playerId);
    return player?.balance || 0;
  }

  async canAffordStake(playerId: string, stake: number): Promise<boolean> {
    const balance = await this.getPlayerBalance(playerId);
    return balance >= stake;
  }
}

export const paymentService = PaymentServiceImpl.getInstance();