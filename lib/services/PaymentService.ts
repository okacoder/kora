import { injectable, inject } from 'inversify';
import { IPaymentService } from '@/lib/interfaces/services/IPaymentService';
import { IUserRepository } from '@/lib/interfaces/repositories/IUserRepository';
import { ITransactionRepository, Transaction } from '@/lib/interfaces/repositories/ITransactionRepository';
import { TYPES } from '@/lib/di/types';

@injectable()
export class PaymentService implements IPaymentService {
  private readonly COMMISSION_RATE = 0.10; // 10%
  private readonly KORA_TO_FCFA = 10; // 1 kora = 10 FCFA

  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.TransactionRepository) private transactionRepository: ITransactionRepository
  ) {}

  async processStake(playerId: string, amount: number, roomId: string): Promise<void> {
    const user = await this.userRepository.findById(playerId);
    if (!user) throw new Error('User not found');

    const korasAmount = amount / this.KORA_TO_FCFA;
    if (user.koras < korasAmount) {
      throw new Error('Insufficient balance');
    }

    // Déduire les koras
    await this.userRepository.updateBalance(playerId, -korasAmount);

    // Créer la transaction
    await this.transactionRepository.create({
      userId: playerId,
      type: 'GAME_STAKE',
      koras: korasAmount,
      korasBefore: user.koras,
      korasAfter: user.koras - korasAmount,
      description: `Mise pour la partie ${roomId}`,
      gameId: roomId,
      status: 'COMPLETED'
    });
  }

  async processWinning(playerId: string, amount: number, gameId: string): Promise<void> {
    const user = await this.userRepository.findById(playerId);
    if (!user) throw new Error('User not found');

    // Calculer la commission
    const commission = amount * this.COMMISSION_RATE;
    const netAmount = amount - commission;
    const korasWon = netAmount / this.KORA_TO_FCFA;

    // Ajouter les koras
    await this.userRepository.updateBalance(playerId, korasWon);

    // Créer la transaction de gain
    await this.transactionRepository.create({
      userId: playerId,
      type: 'GAME_WIN',
      koras: korasWon,
      korasBefore: user.koras,
      korasAfter: user.koras + korasWon,
      description: `Gain de la partie ${gameId} (après commission)`,
      gameId: gameId,
      status: 'COMPLETED'
    });

    // Traiter la commission
    await this.processCommission(commission, gameId);
  }

  async depositKoras(userId: string, amountFCFA: number, paymentReference: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const korasToAdd = amountFCFA / this.KORA_TO_FCFA;

    // Ajouter les koras
    await this.userRepository.updateBalance(userId, korasToAdd);

    // Créer la transaction
    await this.transactionRepository.create({
      userId: userId,
      type: 'DEPOSIT',
      amount: amountFCFA,
      koras: korasToAdd,
      korasBefore: user.koras,
      korasAfter: user.koras + korasToAdd,
      description: 'Dépôt Mobile Money',
      reference: paymentReference,
      status: 'COMPLETED'
    });
  }

  async withdrawKoras(userId: string, korasAmount: number, phoneNumber: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.koras < korasAmount) {
      throw new Error('Insufficient balance');
    }

    const amountFCFA = korasAmount * this.KORA_TO_FCFA;
    
    // Appliquer la commission sur les retraits
    const commission = amountFCFA * this.COMMISSION_RATE;
    const netAmount = amountFCFA - commission;

    // Déduire les koras
    await this.userRepository.updateBalance(userId, -korasAmount);

    // Créer la transaction
    const transaction = await this.transactionRepository.create({
      userId: userId,
      type: 'WITHDRAWAL',
      amount: netAmount,
      koras: korasAmount,
      korasBefore: user.koras,
      korasAfter: user.koras - korasAmount,
      description: `Retrait vers ${phoneNumber} (commission: ${commission} FCFA)`,
      status: 'PENDING'
    });

    // Ici, intégrer avec l'API Mobile Money
    // Pour le moment, on simule
    await this.transactionRepository.updateStatus(transaction.id, 'COMPLETED');
  }

  async getPlayerBalance(playerId: string): Promise<number> {
    const user = await this.userRepository.findById(playerId);
    return user?.koras || 0;
  }

  async canAffordStake(playerId: string, stake: number): Promise<boolean> {
    const balance = await this.getPlayerBalance(playerId);
    return balance >= stake;
  }

  async getTransactionHistory(userId: string, limit?: number): Promise<Transaction[]> {
    return this.transactionRepository.findByUserId(userId, limit);
  }

  async processCommission(amount: number, gameId: string): Promise<void> {
    // Ici, on créerait une transaction pour la commission
    // qui irait sur un compte administratif
    await this.transactionRepository.create({
      userId: 'SYSTEM', // Compte système
      type: 'COMMISSION',
      amount: amount,
      description: `Commission sur la partie ${gameId}`,
      gameId: gameId,
      status: 'COMPLETED',
      korasBefore: 0,
      korasAfter: 0
    });
  }
}