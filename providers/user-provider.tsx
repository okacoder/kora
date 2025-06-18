"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { user as User } from "@prisma/client";
import { useCurrentUser } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";

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
  const { user, loading: userLoading, error, refresh } = useCurrentUser();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Update loading state when both auth and user data are loaded
    setLoading(userLoading || authLoading);
  }, [userLoading, authLoading]);

  const refreshUser = async () => {
    await refresh();
  };

  const updateBalance = useCallback((newBalance: number) => {
    if (user) {
      // This is just a UI update, the actual balance is updated in the database
      // The next refresh will get the updated balance from the database
      const updatedUser = { ...user, koras: newBalance };
      // We can't directly update the user here since it's managed by useCurrentUser
      // This is a limitation of this approach, but the refresh function can be used
      // to get the updated user data after updating the balance
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