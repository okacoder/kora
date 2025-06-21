import { GameType } from "@prisma/client";
import { Route } from "next";

export const routes = {
  base: "/",
  games: "/games",
  gameRoom: (roomId: string) => `/games/room/${roomId}` as Route<string>,
  gamePlay: (gameId: string) => `/games/play/${gameId}` as Route<string>,
  gameLobby: (gameType: GameType) => `/games/lobby?gameType=${gameType}` as Route<string>,
  createGameRoom: (gameType: GameType) => `/games/create?gameType=${gameType}` as Route<string>,
  koras: "/koras",
  setting: "/settings",
  account: "/account",
  login: "/login",
  signup: "/signup",
  transactions: "/transactions",
  gamesHistory: "/games/history",
} as const;