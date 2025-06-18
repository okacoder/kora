import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  try {
    const cookieStore = cookies();
    const headers = new Headers();
    headers.set('Cookie', cookieStore.toString());

    const session = await auth.api.getSession({
      headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Update the user in the database
    const updatedUser = await auth.api.updateUser({
      headers,
      body: {
        id: session.user.id,
        ...data,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
} 