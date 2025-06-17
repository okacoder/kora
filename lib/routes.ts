import { Route } from "next";

export const routes = {
  base: "/",
  games: "/games",
  gameRoom: (gameLabel: string, roomId: string) => `/games/${gameLabel}?roomId=${roomId}` as Route<string>,
  gamePlay: (gameLabel: string, roomId: string) => `/games/${gameLabel}?gameId=${roomId}` as Route<string>,
  koras: "/koras",
  setting: "/setting",
  account: "/account",
  login: "/login",
  signup: "/signup",
} as const;