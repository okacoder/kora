import { injectable, inject } from 'inversify';
import { User } from '@prisma/client';
import { IUserService, UpdateProfileDto } from '@/lib/interfaces/services/IUserService';
import { IUserRepository } from '@/lib/interfaces/repositories/IUserRepository';
import { IAuthService } from '@/lib/interfaces/services/IAuthService';
import { TYPES } from '@/lib/di/types';

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.AuthService) private authService: IAuthService
  ) {}

  async getCurrentUser(): Promise<User> {
    const userId = await this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user');
    }
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  async updateUserProfile(id: string, data: UpdateProfileDto): Promise<User> {
    // Vérifier que l'utilisateur ne peut modifier que son propre profil
    const currentUserId = await this.authService.getCurrentUserId();
    if (currentUserId !== id && !(await this.authService.hasRole('ADMIN'))) {
      throw new Error('Unauthorized');
    }

    return this.userRepository.update(id, data);
  }

  async getUserBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findById(userId);
    return user?.koras || 0;
  }

  async addKoras(userId: string, amount: number): Promise<User> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    return this.userRepository.updateBalance(userId, amount);
  }

  async deductKoras(userId: string, amount: number): Promise<User> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    const canAfford = await this.canAffordAmount(userId, amount);
    if (!canAfford) {
      throw new Error('Insufficient balance');
    }
    
    return this.userRepository.updateBalance(userId, -amount);
  }

  async canAffordAmount(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getUserBalance(userId);
    return balance >= amount;
  }
}