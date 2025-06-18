"use server";

import { auth } from './auth';
import { headers } from 'next/headers';
import prisma from './prisma';

export interface UpdateUserDto {
  name?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  image?: string;
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(), 
  });
  const userId = session?.user?.id || null;
  if (!userId) return null;

  return getUserById(userId);
}

export async function getUserById(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export async function updateUser(id: string, data: UpdateUserDto) {
  // Vérifier les permissions
  const currentUserId = await auth.api.getSession({
    headers: await headers(), 
  });

  if (currentUserId?.user?.id !== id) {
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

export async function updateBalance(userId: string, amount: number) {
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

export async function incrementStats(userId: string, wins: number, games: number) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      totalWins: { increment: wins },
      totalGames: { increment: games },
      updatedAt: new Date(),
    },
  });
}

