import { PaymentService } from './types';
import { gameStore } from './game-store';

class PaymentServiceImpl implements PaymentService {
  private static instance: PaymentServiceImpl;

  private constructor() {}

  static getInstance(): PaymentServiceImpl {
    if (!PaymentServiceImpl.instance) {
      PaymentServiceImpl.instance = new PaymentServiceImpl();
    }
    return PaymentServiceImpl.instance;
  }

  async processStake(playerId: string, amount: number, roomId: string): Promise<void> {
    // Déduire la mise du solde du joueur (en koras)
    await gameStore.updatePlayerBalance(playerId, -amount);
    
    // Dans une vraie implémentation :
    // 1. Créer un enregistrement de transaction
    // 2. Mettre à jour le pot de la room
    // 3. Gérer l'intégration avec la passerelle de paiement si besoin
    console.log(`Processed stake: Player ${playerId} staked ${amount} koras in room ${roomId}`);
  }

  async processWinning(playerId: string, amount: number, gameId: string): Promise<void> {
    // Ajouter les gains au solde du joueur (en koras)
    await gameStore.updatePlayerBalance(playerId, amount);
    
    // Dans une vraie implémentation :
    // 1. Créer un enregistrement de transaction
    // 2. Mettre à jour les statistiques du joueur
    // 3. Gérer la fiscalité si besoin
    console.log(`Processed winning: Player ${playerId} won ${amount} koras from game ${gameId}`);
  }

  async getPlayerBalance(playerId: string): Promise<number> {
    const player = await gameStore.getPlayer(playerId);
    return player?.balance || 0;
  }

  async canAffordStake(playerId: string, stake: number): Promise<boolean> {
    const balance = await this.getPlayerBalance(playerId);
    return balance >= stake;
  }
}

export const paymentService = PaymentServiceImpl.getInstance();