import { Route } from "next";

export const routes: Record<string, Route<string> | ((...args: any[]) => string)> = {
  base: "/",
  games: "/games",
  game: (gameId: string) => `/games/${gameId}`,
  koras: "/koras",
  setting: "/setting",
  account: "/account",
};