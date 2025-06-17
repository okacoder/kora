import { Transaction } from '@/lib/interfaces/repositories/ITransactionRepository';

export interface IPaymentService {
  processStake(playerId: string, amount: number, roomId: string): Promise<void>;
  processWinning(playerId: string, amount: number, gameId: string): Promise<void>;
  depositKoras(userId: string, amountFCFA: number, paymentReference: string): Promise<void>;
  withdrawKoras(userId: string, korasAmount: number, phoneNumber: string): Promise<void>;
  getPlayerBalance(playerId: string): Promise<number>;
  canAffordStake(playerId: string, stake: number): Promise<boolean>;
  getTransactionHistory(userId: string, limit?: number): Promise<Transaction[]>;
  processCommission(amount: number, gameId: string): Promise<void>;
}