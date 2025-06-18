'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/services/auth.service';
import type { Session } from '@/lib/auth';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const currentSession = await authService.getSession();
      setSession(currentSession);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    user: session?.user,
    loading,
    isAuthenticated: !!session,
    refresh: loadSession,
  };
} 