import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password, email, name } = body;

    if (action === 'signup') {
      console.log('Creating user with Better Auth:', { username, email, name });

      // Créer un utilisateur avec Better Auth
      const result = await auth.api.signUpEmail({
        body: {
          username,
          password,
          email,
          name,
          role: 'USER' as const,
          phoneNumber: `+237${Math.floor(Math.random() * 100000000)}`, // Numéro de téléphone fictif
        },
        headers: request.headers,
      });

      return NextResponse.json({ 
        success: true, 
        message: 'User created successfully',
        user: result 
      });
    } else {
      console.log('Testing auth with:', { username, password: '***' });

      // Essayer de se connecter directement avec Better Auth
      const result = await auth.api.signInUsername({
        body: {
          username,
          password,
        },
        headers: request.headers,
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Authentication successful',
        user: result 
      });
    }

  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Auth test endpoint ready',
    availableUsers: [
      'alice_garame',
      'bob_kora', 
      'charlie_player'
    ],
    usage: {
      signup: 'POST with action: "signup", username, password, email, name',
      signin: 'POST with username, password'
    }
  });
} 