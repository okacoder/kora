export interface DepositRequest {
  userId: string;
  phoneNumber: string;
  amount: number;
  provider: 'airtel' | 'moov';
}

export interface WithdrawRequest {
  userId: string;
  phoneNumber: string;
  amount: number;
  provider: 'airtel' | 'moov';
}

export interface MobileMoneyResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
}

export interface IMobileMoneyService {
  deposit(data: DepositRequest): Promise<MobileMoneyResponse>;
  withdraw(data: WithdrawRequest): Promise<MobileMoneyResponse>;
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