'use client';

import { useEffect, useState } from 'react';
import { user } from '@prisma/client';
import { userService } from '@/lib/services/user.service';

export function useCurrentUser() {
  const [user, setUser] = useState<user | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const currentUser = await userService.getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: any) => {
    if (!user) return;

    try {
      const updated = await userService.updateUser(user.id, data);
      setUser(updated);
      return updated;
    } catch (err) {
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    refresh: loadUser,
    update: updateUser,
  };
} 