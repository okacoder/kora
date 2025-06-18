import { user } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { authService } from './auth.service';

export interface UpdateUserDto {
  name?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  image?: string;
}

class UserService {
  private static instance: UserService;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getCurrentUser(): Promise<user | null> {
    const userId = await authService.getCurrentUserId();
    if (!userId) return null;

    return this.getUserById(userId);
  }

  async getUserById(id: string): Promise<user | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<user | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<user> {
    // Vérifier les permissions
    const currentUserId = await authService.getCurrentUserId();
    if (currentUserId !== id && !(await authService.hasRole('ADMIN'))) {
      throw new Error('Unauthorized');
    }

    return await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateBalance(userId: string, amount: number): Promise<user> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        koras: {
          increment: amount,
        },
        updatedAt: new Date(),
      },
    });
  }

  async incrementStats(userId: string, wins: number, games: number): Promise<user> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        totalWins: { increment: wins },
        totalGames: { increment: games },
        updatedAt: new Date(),
      },
    });
  }
}

export const userService = UserService.getInstance(); 