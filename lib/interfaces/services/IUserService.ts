import { User } from '@prisma/client';

export interface IUserService {
  getCurrentUser(): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  updateUserProfile(id: string, data: UpdateProfileDto): Promise<User>;
  getUserBalance(userId: string): Promise<number>;
  addKoras(userId: string, amount: number): Promise<User>;
  deductKoras(userId: string, amount: number): Promise<User>;
  canAffordAmount(userId: string, amount: number): Promise<boolean>;
}

export interface UpdateProfileDto {
  name?: string;
  username?: string;
  image?: string;
}