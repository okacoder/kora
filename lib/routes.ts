import { Route } from "next";

export const routes = {
  base: "/",
  games: "/games",
  gameRoom: (gameId: string) => `/games/${gameId}` as Route<string>,
  gamePlay: (gameId: string, roomId: string) => `/games/${gameId}/play/${roomId}` as Route<string>,
  koras: "/koras",
  setting: "/setting",
  account: "/account",
  login: "/login",
  signup: "/signup",
} as const;