import { GameDefinition } from './types';
import { BaseGameEngine } from './base-game-engine';
import { BaseAIPlayer } from './base-ai-player';
import { IconCards, IconPokerChip, IconDice } from '@tabler/icons-react';

// Import game-specific engines
import { GarameEngine } from '../games/garame/garame-engine';
import { GarameAI } from '../games/garame/garame-ai';
// Import future games
// import { PokerEngine } from '../games/poker/poker-engine';
// import { PokerAI } from '../games/poker/poker-ai';

class GameRegistry {
  private games = new Map<string, GameDefinition>();
  private engineInstances = new Map<string, BaseGameEngine>();

  register(game: GameDefinition): void {
    this.games.set(game.id, game);
  }

  get(gameId: string): GameDefinition | undefined {
    return this.games.get(gameId);
  }

  getAll(): GameDefinition[] {
    return Array.from(this.games.values());
  }

  getEngine(gameId: string): BaseGameEngine {
    let engine = this.engineInstances.get(gameId);
    if (!engine) {
      const definition = this.get(gameId);
      if (!definition) {
        throw new Error(`Game ${gameId} not registered`);
      }
      engine = new definition.engineClass(gameId);
      this.engineInstances.set(gameId, engine);
    }
    return engine;
  }

  getAvailableGames(): Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    playerRange: string;
  }> {
    return this.getAll().map(game => ({
      id: game.id,
      name: game.name,
      description: game.description,
      icon: game.icon,
      playerRange: game.minPlayers === game.maxPlayers 
        ? `${game.minPlayers} joueurs`
        : `${game.minPlayers}-${game.maxPlayers} joueurs`
    }));
  }
}

// Create singleton instance
export const gameRegistry = new GameRegistry();

// Register games
gameRegistry.register({
  id: 'garame',
  name: 'Garame',
  description: 'Jeu de cartes traditionnel béninois avec système de Kora',
  minPlayers: 2,
  maxPlayers: 2,
  icon: IconCards,
  rules: [
    'Chaque joueur reçoit 5 cartes au début',
    'Le joueur avec la Kora peut jouer n\'importe quelle carte',
    'Sans Kora, vous devez suivre la couleur jouée',
    'La Kora passe à l\'adversaire après chaque pli',
    'Le premier joueur à se débarrasser de toutes ses cartes gagne',
    'Le gagnant remporte 90% du pot'
  ],
  engineClass: GarameEngine,
  aiClass: GarameAI
});

// Future games can be registered here
// gameRegistry.register({
//   id: 'poker',
//   name: 'Poker Texas Hold\'em',
//   description: 'Le classique jeu de poker',
//   minPlayers: 2,
//   maxPlayers: 8,
//   icon: IconPokerChip,
//   rules: [...],
//   engineClass: PokerEngine,
//   aiClass: PokerAI
// });