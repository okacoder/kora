// lib/garame/infrastructure/garame-provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeContainer, getService } from "./container-config";
import { TYPES } from "./ioc-container";
import { IGameService, IPaymentService, IGameEventHandler } from "../domain/interfaces";

interface GarameContextType {
  gameService: IGameService | null;
  paymentService: IPaymentService | null;
  eventHandler: IGameEventHandler | null;
  isInitialized: boolean;
}

const GarameContext = createContext<GarameContextType>({
  gameService: null,
  paymentService: null,
  eventHandler: null,
  isInitialized: false,
});

export function GarameProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<GarameContextType>({
    gameService: null,
    paymentService: null,
    eventHandler: null,
    isInitialized: false,
  });

  useEffect(() => {
    // Initialiser le container IoC
    initializeContainer();

    // Obtenir les services
    const gameService = getService<IGameService>(TYPES.GameService);
    const paymentService = getService<IPaymentService>(TYPES.PaymentService);
    const eventHandler = getService<IGameEventHandler>(TYPES.GameEventHandler);

    setServices({
      gameService,
      paymentService,
      eventHandler,
      isInitialized: true,
    });
  }, []);

  return (
    <GarameContext.Provider value={services}>
      {children}
    </GarameContext.Provider>
  );
}

// Hook pour utiliser les services
export function useGarameServices() {
  const context = useContext(GarameContext);
  
  if (!context.isInitialized) {
    throw new Error("Les services Garame ne sont pas encore initialisés");
  }
  
  return {
    gameService: context.gameService!,
    paymentService: context.paymentService!,
    eventHandler: context.eventHandler!,
  };
}

// Hooks spécifiques pour chaque service
export function useGameService() {
  const { gameService } = useGarameServices();
  return gameService;
}

export function usePaymentService() {
  const { paymentService } = useGarameServices();
  return paymentService;
}

export function useGameEventHandler() {
  const { eventHandler } = useGarameServices();
  return eventHandler;
}