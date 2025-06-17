import { injectable } from 'inversify';
import { TransactionStatus } from '@prisma/client';
import { ITransactionRepository, CreateTransactionDto, Transaction } from '@/lib/interfaces/repositories/ITransactionRepository';

@injectable()
export class MockTransactionRepository implements ITransactionRepository {
  private transactions: Map<string, Transaction> = new Map();
  private nextId = 1;

  async create(data: CreateTransactionDto): Promise<Transaction> {
    const transaction: Transaction = {
      id: `trans-${this.nextId++}`,
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      koras: data.koras,
      korasBefore: data.korasBefore,
      korasAfter: data.korasAfter,
      description: data.description,
      reference: data.reference,
      gameId: data.gameId,
      status: data.status || 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactions.get(id) || null;
  }

  async findByUserId(userId: string, limit?: number): Promise<Transaction[]> {
    const userTransactions = Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? userTransactions.slice(0, limit) : userTransactions;
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    return Array.from(this.transactions.values())
      .find(t => t.reference === reference) || null;
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    const transaction = this.transactions.get(id);
    if (!transaction) throw new Error('Transaction not found');
    
    transaction.status = status;
    transaction.updatedAt = new Date();
    
    return transaction;
  }
}