import { IconCards } from "@tabler/icons-react";

export const games = [
  {
    id: "garame",
    name: "Garame",
    description: "Le jeu de la bataille de cartes célèbre au Gabon.",
    icon: IconCards,
  },
] as const;

export const getGameById = (id: string) => {
  return games.find((game) => game.id === id);
};