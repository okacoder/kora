import { injectable } from 'inversify';
import { 
  IMobileMoneyService, 
  MobileMoneyTransaction, 
  MobileMoneyStatus,
  MobileMoneyProvider,
  DepositRequest,
  WithdrawRequest,
  MobileMoneyResponse
} from '@/lib/interfaces/services/IMobileMoneyService';

@injectable()
export class MockMobileMoneyService implements IMobileMoneyService {
  private providers: MobileMoneyProvider[] = [
    { id: 'airtel', name: 'Airtel Money', logo: '/images/airtel-logo.png', active: true },
    { id: 'moov', name: 'Moov Money', logo: '/images/moov-logo.png', active: true },
  ];

  private transactions: Map<string, MobileMoneyTransaction> = new Map();

  async deposit(data: DepositRequest): Promise<MobileMoneyResponse> {
    console.log('Mock deposit:', data);
    return {
      success: true,
      transactionId: `mock-dep-${Date.now()}`
    };
  }

  async withdraw(data: WithdrawRequest): Promise<MobileMoneyResponse> {
    console.log('Mock withdraw:', data);
    return {
      success: true,
      transactionId: `mock-wit-${Date.now()}`
    };
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