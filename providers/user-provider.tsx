"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { user as User } from "@prisma/client";
import { useUserService, useAuthService } from "@/hooks/useInjection";

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const userService = useUserService();
  const authService = useAuthService();

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        const currentUser = await userService.getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err as Error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [authService, userService]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const refreshUser = async () => {
    await loadUser();
  };

  const updateBalance = useCallback((newBalance: number) => {
    if (user) {
      setUser(prev => prev ? { ...prev, koras: newBalance } : null);
    }
  }, [user]);

  const value = {
    user,
    loading,
    error,
    refreshUser,
    updateBalance,
    isAuthenticated
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};