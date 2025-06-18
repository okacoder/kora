import { authService } from '@/lib/services/auth.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await authService.getSession();
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(null);
  }
} 