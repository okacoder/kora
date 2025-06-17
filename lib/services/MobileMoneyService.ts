import { injectable } from 'inversify';
import { 
  IMobileMoneyService, 
  MobileMoneyTransaction, 
  MobileMoneyStatus,
  MobileMoneyProvider 
} from '@/lib/interfaces/services/IMobileMoneyService';

@injectable()
export class MobileMoneyService implements IMobileMoneyService {
  private providers: MobileMoneyProvider[] = [
    { id: 'airtel', name: 'Airtel Money', logo: '/images/airtel-logo.png', active: true },
    { id: 'moov', name: 'Moov Money', logo: '/images/moov-logo.png', active: true },
  ];

  async initiateDeposit(phoneNumber: string, amount: number): Promise<MobileMoneyTransaction> {
    // Intégration avec l'API Mobile Money réelle
    // Pour le moment, simulation
    const transaction: MobileMoneyTransaction = {
      id: `dep-${Date.now()}`,
      reference: `REF${Date.now()}`,
      amount,
      phoneNumber,
      provider: this.detectProvider(phoneNumber),
      status: 'pending',
      createdAt: new Date()
    };

    // Simuler l'appel API
    setTimeout(() => {
      // Marquer comme complété après 5 secondes
      this.updateTransactionStatus(transaction.id, 'completed');
    }, 5000);

    return transaction;
  }

  async initiateWithdrawal(phoneNumber: string, amount: number): Promise<MobileMoneyTransaction> {
    const transaction: MobileMoneyTransaction = {
      id: `wit-${Date.now()}`,
      reference: `REF${Date.now()}`,
      amount,
      phoneNumber,
      provider: this.detectProvider(phoneNumber),
      status: 'pending',
      createdAt: new Date()
    };

    // Simuler l'appel API
    setTimeout(() => {
      this.updateTransactionStatus(transaction.id, 'completed');
    }, 7000);

    return transaction;
  }

  async checkTransactionStatus(transactionId: string): Promise<MobileMoneyStatus> {
    // Vérifier le statut réel via API
    // Pour le moment, simulation
    return {
      transactionId,
      status: 'completed',
      message: 'Transaction réussie',
      completedAt: new Date()
    };
  }

  async getProviders(): Promise<MobileMoneyProvider[]> {
    return this.providers;
  }

  private detectProvider(phoneNumber: string): string {
    // Logique pour détecter l'opérateur basé sur le préfixe
    if (phoneNumber.startsWith('+229')) {
      if (['66', '67', '96', '97'].some(prefix => phoneNumber.includes(prefix))) {
        return 'moov';
      }
      if (['61', '62', '91'].some(prefix => phoneNumber.includes(prefix))) {
        return 'airtel';
      }
    }
    return 'unknown';
  }

  private updateTransactionStatus(transactionId: string, status: 'completed' | 'failed'): void {
    // Mise à jour dans la base de données
    console.log(`Transaction ${transactionId} updated to ${status}`);
  }
}