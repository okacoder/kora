import { injectable } from 'inversify';
import { User } from '@prisma/client';
import { IUserRepository, CreateUserDto, UpdateUserDto } from '@/lib/interfaces/repositories/IUserRepository';

@injectable()
export class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();
  private nextId = 1;

  constructor() {
    // Ajouter un utilisateur de test par défaut
    const testUser: User = {
      id: 'test-user-1',
      name: 'Test User',
      username: 'testuser',
      displayUsername: 'TestUser',
      role: 'USER',
      email: 'test@example.com',
      emailVerified: true,
      phoneNumber: '+1234567890',
      phoneNumberVerified: true,
      image: null,
      koras: 1000,
      totalWins: 0,
      totalGames: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(testUser.id, testUser);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.username === username) || null;
  }

  async create(data: CreateUserDto): Promise<User> {
    const user: User = {
      id: `test-user-${this.nextId++}`,
      name: data.name,
      username: data.username,
      displayUsername: data.username,
      role: data.role || 'USER',
      email: data.email,
      emailVerified: false,
      phoneNumber: data.phoneNumber,
      phoneNumberVerified: false,
      image: null,
      koras: data.koras || 0,
      totalWins: 0,
      totalGames: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = {
      ...user,
      ...data,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateBalance(id: string, amount: number): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = {
      ...user,
      koras: user.koras + amount,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async incrementStats(id: string, wins: number, games: number): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = {
      ...user,
      totalWins: user.totalWins + wins,
      totalGames: user.totalGames + games,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
}