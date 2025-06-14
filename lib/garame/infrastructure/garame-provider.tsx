// lib/garame/infrastructure/garame-provider.tsx
"use client";

import React, { createContext, useContext, useMemo } from "react";
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
  // Initialiser et mémoriser les services de façon synchrone afin qu'ils soient
  // disponibles dès la première passe de rendu. Cela évite que les composants
  // consommateurs ne se montent avant que `isInitialized` ne passe à true.
  const services = useMemo<GarameContextType>(() => {
    // Initialiser le container IoC (liaisons, singletons, etc.)
    initializeContainer();

    // Récupérer les services configurés
    const gameService = getService<IGameService>(TYPES.GameService);
    const paymentService = getService<IPaymentService>(TYPES.PaymentService);
    const eventHandler = getService<IGameEventHandler>(TYPES.GameEventHandler);

    return {
      gameService,
      paymentService,
      eventHandler,
      isInitialized: true,
    };
    // useMemo avec tableau de dépendances vide => appellé une seule fois par
    // instance du composant Provider côté client.
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