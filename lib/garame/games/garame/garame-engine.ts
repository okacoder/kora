import { BaseGameEngine } from '../../core/base-game-engine';
import { GameRoom, GameAction, BaseGameState } from '../../core/types';
import { GarameGameState, GaramePlayerState } from './garame-types';
import { GarameRules } from './garame-rules';
import { GarameAI } from './garame-ai';

export class GarameEngine extends BaseGameEngine {
  createInitialState(room: GameRoom): GarameGameState {
    const deck = GarameRules.createShuffledDeck();
    const cardsPerPlayer = 10;
    
    const gameState: GarameGameState = {
      id: `game-${Date.now()}`,
      roomId: room.id,
      gameType: 'garame',
      currentPlayerId: room.players[0].id,
      players: new Map(),
      lastPlayedCard: null,
      deck: [],
      discardPile: [],
      pot: room.totalPot,
      status: 'playing',
      turn: 1,
      startedAt: new Date()
    };

    // Deal cards
    room.players.forEach((player, index) => {
      const playerCards = deck.slice(
        index * cardsPerPlayer,
        (index + 1) * cardsPerPlayer
      );

      const playerState: GaramePlayerState = {
        id: player.id,
        position: player.position,
        hand: playerCards,
        score: 0,
        hasKora: index === 0,
        wonTricks: 0,
        isActive: true,
        isAI: player.isAI,
        lastAction: undefined
      };

      gameState.players.set(player.id, playerState);
    });

    // Remaining cards go to deck
    gameState.deck = deck.slice(room.players.length * cardsPerPlayer);

    return gameState;
  }

  validateAction(state: BaseGameState, action: GameAction): boolean {
    const gameState = state as GarameGameState;
    const garameAction = action as any;

    if (action.type !== 'play_card') return false;
    if (state.currentPlayerId !== action.playerId) return false;

    const playerState = gameState.players.get(action.playerId) as GaramePlayerState;
    if (!playerState) return false;

    const card = playerState.hand[garameAction.data.cardIndex];
    if (!card) return false;

    return GarameRules.canPlayCard(gameState, action.playerId, card);
  }

  applyAction(state: BaseGameState, action: GameAction): GarameGameState {
    const gameState = { ...state } as GarameGameState;
    const garameAction = action as any;
    const playerState = gameState.players.get(action.playerId) as GaramePlayerState;

    // Remove card from hand
    const card = playerState.hand.splice(garameAction.data.cardIndex, 1)[0];

    // Apply Garame rules
    const updates = GarameRules.applyCardPlay(gameState, action.playerId, card);
    Object.assign(gameState, updates);

    // Next player
    const players = Array.from(gameState.players.keys());
    const currentIndex = players.indexOf(action.playerId);
    gameState.currentPlayerId = players[(currentIndex + 1) % players.length];
    gameState.turn++;

    return gameState;
  }

  checkWinCondition(state: BaseGameState): { ended: boolean; winners?: string[] } {
    const gameState = state as GarameGameState;
    return GarameRules.checkEndCondition(gameState);
  }

  getValidActions(state: BaseGameState, playerId: string): GameAction[] {
    const gameState = state as GarameGameState;
    const playerState = gameState.players.get(playerId) as GaramePlayerState;
    
    if (!playerState || state.currentPlayerId !== playerId) return [];

    const validIndices = GarameRules.getPlayableCards(gameState, playerId);
    
    return validIndices.map(index => ({
      type: 'play_card',
      playerId,
      data: {
        cardIndex: index,
        card: playerState.hand[index]
      },
      timestamp: new Date()
    }));
  }

  calculateScores(state: BaseGameState): Map<string, number> {
    const scores = new Map<string, number>();
    
    for (const [playerId, playerState] of state.players) {
      scores.set(playerId, playerState.score);
    }
    
    return scores;
  }

  protected getGameDefinition() {
    return {
      minPlayers: 2,
      maxPlayers: 2
    };
  }

  protected async getAIAction(gameState: BaseGameState, aiPlayerId: string): Promise<GameAction | null> {
    const room = await this.store.getRoom(gameState.roomId);
    const aiPlayer = room?.players.find(p => p.id === aiPlayerId);
    
    if (!aiPlayer?.aiDifficulty) {
      return super.getAIAction(gameState, aiPlayerId);
    }

    const ai = new GarameAI(aiPlayer.aiDifficulty);
    return ai.decideAction(gameState as GarameGameState, aiPlayerId);
  }
}