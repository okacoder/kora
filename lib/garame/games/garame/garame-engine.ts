import { BaseGameEngine } from '../../core/base-game-engine';
import { GameRoom, GameAction, BaseGameState } from '../../core/types';
import { GarameGameState, GaramePlayerState } from './garame-types';
import { GarameRules } from './garame-rules';
import { GarameAI } from './garame-ai';

export class GarameEngine extends BaseGameEngine {
  createInitialState(room: GameRoom): GarameGameState {
    const deck = GarameRules.createShuffledDeck();
    const cardsPerPlayer = 5; // Traditional Garame uses 5 cards per player
    
    const gameState: GarameGameState = {
      id: `game-${Date.now()}`,
      roomId: room.id,
      gameType: 'garame',
      currentPlayerId: room.players[0].id,
      players: new Map(),
      lastPlayedCard: null,
      currentSuit: undefined,
      deck: [],
      discardPile: [],
      pot: room.totalPot,
      status: 'playing',
      turn: 1,
      startedAt: new Date()
    };

    // Deal cards to players
    room.players.forEach((player, index) => {
      const playerCards = deck.slice(
        index * cardsPerPlayer,
        (index + 1) * cardsPerPlayer
      );

      const playerState: GaramePlayerState = {
        id: player.id,
        position: player.position,
        cards: playerCards,
        score: 0,
        hasKora: index === 0, // First player gets Kora
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

    if (state.currentPlayerId !== action.playerId) return false;

    if (action.type === 'play_card') {
      const playerState = gameState.players.get(action.playerId) as GaramePlayerState;
      if (!playerState) return false;

      const card = playerState.cards[garameAction.data.cardIndex];
      if (!card) return false;

      return GarameRules.canPlayCard(gameState, action.playerId, card);
    }

    if (action.type === 'pass_kora') {
      const playerState = gameState.players.get(action.playerId) as GaramePlayerState;
      const targetState = gameState.players.get(garameAction.data.targetPlayerId) as GaramePlayerState;
      
      return playerState?.hasKora === true && targetState?.isActive === true;
    }

    return false;
  }

  applyAction(state: BaseGameState, action: GameAction): GarameGameState {
    const gameState = { ...state } as GarameGameState;
    const garameAction = action as any;

    if (action.type === 'play_card') {
      const playerState = gameState.players.get(action.playerId) as GaramePlayerState;
      
      // Remove card from hand
      const card = playerState.cards.splice(garameAction.data.cardIndex, 1)[0];
      
      // Apply game rules
      const updates = GarameRules.applyCardPlay(gameState, action.playerId, card);
      Object.assign(gameState, updates);

      // Update player's last action
      playerState.lastAction = action;

      // Check if this completes a trick (in 2-player Garame, every card play does)
      const players = Array.from(gameState.players.keys());
      const otherPlayerId = players.find(id => id !== action.playerId);
      
      if (otherPlayerId) {
        // In traditional Garame, the other player gets Kora after each play
        const otherPlayer = gameState.players.get(otherPlayerId) as GaramePlayerState;
        if (otherPlayer) {
          playerState.hasKora = false;
          otherPlayer.hasKora = true;
        }
      }

      // Next player's turn
      gameState.currentPlayerId = otherPlayerId || action.playerId;
      gameState.currentSuit = undefined; // Reset for next trick
    }

    if (action.type === 'pass_kora') {
      const playerState = gameState.players.get(action.playerId) as GaramePlayerState;
      const targetState = gameState.players.get(garameAction.data.targetPlayerId) as GaramePlayerState;
      
      if (playerState && targetState) {
        playerState.hasKora = false;
        targetState.hasKora = true;
        gameState.currentPlayerId = garameAction.data.targetPlayerId;
      }
    }

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

    const actions: GameAction[] = [];

    // Get playable card actions
    const validIndices = GarameRules.getPlayableCards(gameState, playerId);
    
    validIndices.forEach(index => {
      actions.push({
        type: 'play_card',
        playerId,
        data: {
          cardIndex: index,
          card: playerState.cards[index]
        },
        timestamp: new Date()
      });
    });

    // Add pass Kora action if player has it
    if (playerState.hasKora) {
      const otherPlayers = Array.from(gameState.players.entries())
        .filter(([id, p]) => id !== playerId && p.isActive);
      
      otherPlayers.forEach(([targetId]) => {
        actions.push({
          type: 'pass_kora',
          playerId,
          data: {
            targetPlayerId: targetId
          },
          timestamp: new Date()
        });
      });
    }

    return actions;
  }

  calculateScores(state: BaseGameState): Map<string, number> {
    const scores = new Map<string, number>();
    
    for (const [playerId, playerState] of state.players) {
      const garamePlayer = playerState as GaramePlayerState;
      // Score based on cards left (lower is better) and tricks won
      const cardsLeft = garamePlayer.cards.length;
      const score = garamePlayer.wonTricks * 100 - cardsLeft * 10;
      scores.set(playerId, score);
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