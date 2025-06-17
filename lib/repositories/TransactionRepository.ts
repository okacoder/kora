import { injectable } from 'inversify';
import { PrismaClient, TransactionStatus } from '@prisma/client';
import { ITransactionRepository, CreateTransactionDto, Transaction } from '@/lib/interfaces/repositories/ITransactionRepository';
import prisma from '@/lib/prisma';

@injectable()
export class TransactionRepository implements ITransactionRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: CreateTransactionDto): Promise<Transaction> {
    const transaction = await this.prisma.transaction.create({
      data: {
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
      }
    });

    return this.mapToTransaction(transaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id }
    });

    return transaction ? this.mapToTransaction(transaction) : null;
  }

  async findByUserId(userId: string, limit?: number): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return transactions.map(this.mapToTransaction);
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { reference }
    });

    return transaction ? this.mapToTransaction(transaction) : null;
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    return this.mapToTransaction(transaction);
  }

  private mapToTransaction(dbTransaction: any): Transaction {
    return {
      id: dbTransaction.id,
      userId: dbTransaction.userId,
      type: dbTransaction.type,
      amount: dbTransaction.amount,
      koras: dbTransaction.koras,
      korasBefore: dbTransaction.korasBefore || 0,
      korasAfter: dbTransaction.korasAfter || 0,
      description: dbTransaction.description,
      reference: dbTransaction.reference,
      gameId: dbTransaction.gameId,
      status: dbTransaction.status,
      createdAt: dbTransaction.createdAt,
      updatedAt: dbTransaction.updatedAt,
    };
  }
}