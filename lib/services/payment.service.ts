import { TransactionType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { userService } from './user.service';

class PaymentService {
  private static instance: PaymentService;
  private readonly COMMISSION_RATE = 0.1; // 10%
  private readonly KORA_TO_FCFA = 10;

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async processStake(
    playerId: string,
    stakeInKoras: number,
    roomId: string,
  ): Promise<void> {
    const user = await userService.getUserById(playerId);
    if (!user) throw new Error('User not found');

    if (user.koras < stakeInKoras) {
      throw new Error('Insufficient balance');
    }

    // Transaction atomique
    await prisma.$transaction(async (tx) => {
      // Déduire les koras
      await tx.user.update({
        where: { id: playerId },
        data: {
          koras: {
            decrement: stakeInKoras,
          },
        },
      });

      // Créer la transaction
      await tx.transaction.create({
        data: {
          userId: playerId,
          type: 'GAME_STAKE',
          koras: stakeInKoras,
          korasBefore: user.koras,
          korasAfter: user.koras - stakeInKoras,
          description: `Mise pour la partie ${roomId}`,
          gameId: roomId,
          status: 'COMPLETED',
        },
      });
    });
  }

  async processWinning(
    playerId: string,
    amountInKoras: number,
    gameId: string,
  ): Promise<void> {
    const user = await userService.getUserById(playerId);
    if (!user) throw new Error('User not found');

    // Calculer la commission
    const commission = amountInKoras * this.COMMISSION_RATE;
    const netAmount = amountInKoras - commission;

    await prisma.$transaction(async (tx) => {
      // Ajouter les koras (après commission)
      await tx.user.update({
        where: { id: playerId },
        data: {
          koras: {
            increment: netAmount,
          },
          totalWins: {
            increment: 1,
          },
        },
      });

      // Créer la transaction de gain
      await tx.transaction.create({
        data: {
          userId: playerId,
          type: 'GAME_WIN',
          koras: netAmount,
          korasBefore: user.koras,
          korasAfter: user.koras + netAmount,
          description: `Gain de la partie ${gameId} (commission: ${commission} koras)`,
          gameId: gameId,
          status: 'COMPLETED',
        },
      });

      // Créer la transaction de commission
      await tx.transaction.create({
        data: {
          userId: 'SYSTEM',
          type: 'COMMISSION',
          koras: commission,
          korasBefore: 0,
          korasAfter: 0,
          description: `Commission sur la partie ${gameId}`,
          gameId: gameId,
          status: 'COMPLETED',
        },
      });
    });
  }

  async depositKoras(
    userId: string,
    amountFCFA: number,
    reference: string,
  ): Promise<void> {
    const user = await userService.getUserById(userId);
    if (!user) throw new Error('User not found');

    const korasToAdd = amountFCFA / this.KORA_TO_FCFA;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          koras: {
            increment: korasToAdd,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: userId,
          type: 'DEPOSIT',
          amount: amountFCFA,
          koras: korasToAdd,
          korasBefore: user.koras,
          korasAfter: user.koras + korasToAdd,
          description: 'Dépôt Mobile Money',
          reference: reference,
          status: 'COMPLETED',
        },
      });
    });
  }

  async getPlayerBalance(playerId: string): Promise<number> {
    const user = await userService.getUserById(playerId);
    return user?.koras || 0;
  }

  async canAffordStake(playerId: string, stake: number): Promise<boolean> {
    const balance = await this.getPlayerBalance(playerId);
    return balance >= stake;
  }
}

export const paymentService = PaymentService.getInstance(); 