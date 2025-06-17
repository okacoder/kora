import { injectable } from 'inversify';
import { PrismaClient, User } from '@prisma/client';
import { IUserRepository, CreateUserDto, UpdateUserDto } from '@/lib/interfaces/repositories/IUserRepository';
import prisma from '@/lib/prisma';

@injectable()
export class UserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username }
    });
  }

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        emailVerified: false,
        phoneNumberVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async updateBalance(id: string, amount: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        koras: {
          increment: amount
        },
        updatedAt: new Date()
      }
    });
  }

  async incrementStats(id: string, wins: number, games: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        totalWins: { increment: wins },
        totalGames: { increment: games },
        updatedAt: new Date()
      }
    });
  }
}