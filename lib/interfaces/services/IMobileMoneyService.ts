export interface IMobileMoneyService {
  initiateDeposit(phoneNumber: string, amount: number): Promise<MobileMoneyTransaction>;
  initiateWithdrawal(phoneNumber: string, amount: number): Promise<MobileMoneyTransaction>;
  checkTransactionStatus(transactionId: string): Promise<MobileMoneyStatus>;
  getProviders(): Promise<MobileMoneyProvider[]>;
}

export interface MobileMoneyTransaction {
  id: string;
  reference: string;
  amount: number;
  phoneNumber: string;
  provider: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface MobileMoneyStatus {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
  completedAt?: Date;
}

export interface MobileMoneyProvider {
  id: string;
  name: string;
  logo: string;
  active: boolean;
}