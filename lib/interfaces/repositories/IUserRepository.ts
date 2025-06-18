import { User } from '@prisma/client';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  updateBalance(id: string, amount: number): Promise<User>;
  incrementStats(id: string, wins: number, games: number): Promise<User>;
}

export interface CreateUserDto {
  name: string;
  username: string;
  email: string;
  phoneNumber: string;
  role?: 'USER' | 'ADMIN' | 'MODERATOR';
  koras: number;
}

export interface UpdateUserDto {
  name?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  image?: string;
}