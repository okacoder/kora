"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useEventBus } from "@/hooks/useInjection";
import { toast } from "sonner";

interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const eventBus = useEventBus();

  useEffect(() => {
    // Listen to game events and show appropriate notifications
    const handlePlayerJoined = (data: any) => {
      if (data.playerName && data.playerName !== 'Vous') {
        toast.info(`${data.playerName} a rejoint la partie`);
      }
    };

    const handlePlayerLeft = (data: any) => {
      if (data.playerName && data.playerName !== 'Vous') {
        toast.warning(`${data.playerName} a quitté la partie`);
      }
    };

    const handleGameStarting = (data: any) => {
      toast.success('La partie commence !');
    };

    const handleGameEnded = (data: any) => {
      if (data.winner) {
        if (data.winner.id === data.currentUserId) {
          toast.success(`Félicitations ! Vous avez gagné ${data.winnings} Koras !`);
        } else {
          toast.info(`${data.winner.name} a gagné la partie`);
        }
      }
    };

    const handleTransaction = (data: any) => {
      if (data.type === 'deposit' && data.status === 'completed') {
        toast.success(`Dépôt de ${data.amount} Koras effectué avec succès`);
      } else if (data.type === 'withdraw' && data.status === 'completed') {
        toast.success(`Retrait de ${data.amount} Koras effectué avec succès`);
      }
    };

    const handleError = (data: any) => {
      toast.error(data.message || 'Une erreur est survenue');
    };

    // Subscribe to events
    eventBus.on('room.player_joined', handlePlayerJoined);
    eventBus.on('room.player_left', handlePlayerLeft);
    eventBus.on('game.starting', handleGameStarting);
    eventBus.on('game.ended', handleGameEnded);
    eventBus.on('transaction.completed', handleTransaction);
    eventBus.on('error', handleError);

    return () => {
      eventBus.off('room.player_joined', handlePlayerJoined);
      eventBus.off('room.player_left', handlePlayerLeft);
      eventBus.off('game.starting', handleGameStarting);
      eventBus.off('game.ended', handleGameEnded);
      eventBus.off('transaction.completed', handleTransaction);
      eventBus.off('error', handleError);
    };
  }, [eventBus]);

  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const showInfo = (message: string) => {
    toast.info(message);
  };

  const showWarning = (message: string) => {
    toast.warning(message);
  };

  return (
    <NotificationContext.Provider
      value={{
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};