import { injectable } from 'inversify';
import { 
  IMobileMoneyService, 
  MobileMoneyTransaction, 
  MobileMoneyStatus,
  MobileMoneyProvider 
} from '@/lib/interfaces/services/IMobileMoneyService';

@injectable()
export class MockMobileMoneyService implements IMobileMoneyService {
  private providers: MobileMoneyProvider[] = [
    { id: 'airtel', name: 'Airtel Money', logo: '/images/airtel-logo.png', active: true },
    { id: 'moov', name: 'Moov Money', logo: '/images/moov-logo.png', active: true },
  ];

  private transactions: Map<string, MobileMoneyTransaction> = new Map();

  async initiateDeposit(phoneNumber: string, amount: number): Promise<MobileMoneyTransaction> {
    const transaction: MobileMoneyTransaction = {
      id: `mock-dep-${Date.now()}`,
      reference: `MOCK-REF${Date.now()}`,
      amount,
      phoneNumber,
      provider: 'mock-provider',
      status: 'completed', // Mock toujours réussi
      createdAt: new Date()
    };

    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async initiateWithdrawal(phoneNumber: string, amount: number): Promise<MobileMoneyTransaction> {
    const transaction: MobileMoneyTransaction = {
      id: `mock-wit-${Date.now()}`,
      reference: `MOCK-REF${Date.now()}`,
      amount,
      phoneNumber,
      provider: 'mock-provider',
      status: 'completed', // Mock toujours réussi
      createdAt: new Date()
    };

    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async checkTransactionStatus(transactionId: string): Promise<MobileMoneyStatus> {
    const transaction = this.transactions.get(transactionId);
    return {
      transactionId,
      status: transaction?.status || 'completed',
      message: 'Transaction simulée réussie',
      completedAt: new Date()
    };
  }

  async getProviders(): Promise<MobileMoneyProvider[]> {
    return this.providers;
  }
}