import { Route } from "next";

export const routes = {
  base: "/",
  games: "/games",
  game: (gameId: string) => `/games/${gameId}` as Route<string>,
  koras: "/koras",
  setting: "/setting",
  account: "/account",
  login: "/login",
  signup: "/signup",
} as const;