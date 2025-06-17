import { TransactionType, TransactionStatus } from '@prisma/client';

export interface ITransactionRepository {
  create(data: CreateTransactionDto): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findByUserId(userId: string, limit?: number): Promise<Transaction[]>;
  findByReference(reference: string): Promise<Transaction | null>;
  updateStatus(id: string, status: TransactionStatus): Promise<Transaction>;
}

export interface CreateTransactionDto {
  userId: string;
  type: TransactionType;
  amount?: number;
  koras?: number;
  korasBefore: number;
  korasAfter: number;
  description?: string;
  reference?: string;
  gameId?: string;
  status?: TransactionStatus;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount?: number;
  koras?: number;
  korasBefore: number;
  korasAfter: number;
  description?: string;
  reference?: string;
  gameId?: string;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}