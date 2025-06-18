import { Route } from "next";

export const routes = {
  base: "/",
  games: "/games",
  gameRoom: (gameType: string, roomId: string) => `/games/${gameType}/room/${roomId}` as Route<string>,
  gamePlay: (gameType: string, gameId: string) => `/games/${gameType}/play/${gameId}` as Route<string>,
  koras: "/koras",
  setting: "/settings",
  account: "/account",
  login: "/login",
  signup: "/signup",
  transactions: "/transactions",
  gamesHistory: "/games/history",
} as const;