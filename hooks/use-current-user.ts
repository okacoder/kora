'use client';

import { Session } from '@/lib/auth';
import { authClient } from '@/lib/auth-client';
import { useMemo } from 'react';

export const useCurrentUser = (): Session['user'] | null => {
  const { data: session } = authClient.useSession();
  return useMemo(() => (session?.user as Session['user']) || null, [session?.user]);
};

export const useCurrentSession = () => {
  return authClient.useSession();
};
