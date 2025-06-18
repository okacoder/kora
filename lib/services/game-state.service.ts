import { prisma } from '@/lib/db/prisma';
import { GameState, GameStateStatus, Prisma } from '@prisma/client';
import { GarameAIService } from './GarameAIService';
import { GarameState, GaramePlayerState, GarameMetadata } from '@/lib/garame/games/garame/garame-types';

type GameStateWithRoom = Prisma.GameStateGetPayload<{
  include: {
    room: {
      include: {
        players: true;
      };
    };
  };
}>;

class GameStateService {
  private static instance: GameStateService;
  private garameAI: GarameAIService;

  private constructor() {
    this.garameAI = new GarameAIService();
  }

  static getInstance(): GameStateService {
    if (!GameStateService.instance) {
      GameStateService.instance = new GameStateService();
    }
    return GameStateService.instance;
  }

  async getGameState(gameId: string): Promise<GameStateWithRoom | null> {
    try {
      const state = await prisma.gameState.findUnique({
        where: { id: gameId },
        include: {
          room: {
            include: {
              players: true
            }
          }
        }
      });

      if (!state) return null;

      // Convert to GarameState if needed
      if (state.gameType === 'garame') {
        return this.convertToGarameState(state);
      }

      return state;
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  }

  async processAction(gameId: string, action: any): Promise<GameStateWithRoom> {
    const state = await this.getGameState(gameId);
    if (!state) throw new Error('Game state not found');

    // Validate action
    if (state.currentPlayerId !== action.playerId) {
      throw new Error('Not your turn');
    }

    // Process action based on game type
    let updatedState;
    switch (state.gameType) {
      case 'garame':
        updatedState = await this.processGarameAction(state as unknown as GarameState, action);
        break;
      default:
        throw new Error(`Game type ${state.gameType} not supported`);
    }

    // Save updated state
    const playersJson = Object.fromEntries(updatedState.players);
    const metadataJson = {
      lastPlayedCard: updatedState.metadata.lastPlayedCard ? JSON.stringify(updatedState.metadata.lastPlayedCard) : null,
      maxScore: updatedState.metadata.maxScore,
      winners: updatedState.metadata.winners,
      winnings: updatedState.metadata.winnings
    };

    return await prisma.gameState.update({
      where: { id: gameId },
      data: {
        players: JSON.stringify(playersJson),
        currentPlayerId: updatedState.currentPlayerId,
        status: updatedState.status,
        turn: updatedState.turn,
        metadata: metadataJson
      },
      include: {
        room: {
          include: {
            players: true
          }
        }
      }
    });
  }

  private async processGarameAction(state: GarameState, action: any): Promise<GarameState> {
    // Process Garame specific action logic
    const updatedState = { ...state };
    
    // Update state based on action
    switch (action.type) {
      case 'play_card':
        // Implement card playing logic
        const player = updatedState.players.get(action.playerId);
        if (!player) throw new Error('Player not found');
        
        const cardIndex = player.hand.findIndex(c => c.id === action.data.cardId);
        if (cardIndex === -1) throw new Error('Card not found in hand');
        
        const card = player.hand[cardIndex];
        player.hand.splice(cardIndex, 1);
        
        // Update metadata
        updatedState.metadata.lastPlayedCard = card;
        
        // Update turn
        const players = Array.from(updatedState.players.values());
        const currentPlayerIndex = players.findIndex(p => p.id === action.playerId);
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        updatedState.currentPlayerId = players[nextPlayerIndex].id;
        updatedState.turn++;
        break;
      default:
        throw new Error(`Action type ${action.type} not supported`);
    }

    return updatedState;
  }

  async getNextAIMove(gameId: string): Promise<any | null> {
    const state = await this.getGameState(gameId);
    if (!state || state.gameType !== 'garame') return null;

    // For now, just return a random card from the AI's hand
    const garameState = state as unknown as GarameState;
    const aiPlayer = Array.from(garameState.players.values()).find(p => p.isAI);
    if (!aiPlayer || !aiPlayer.hand.length) return null;

    const randomCard = aiPlayer.hand[Math.floor(Math.random() * aiPlayer.hand.length)];
    return {
      type: 'play_card',
      playerId: aiPlayer.id,
      data: { cardId: randomCard.id }
    };
  }

  async isAITurn(gameId: string): Promise<boolean> {
    const state = await this.getGameState(gameId);
    if (!state) return false;

    const currentPlayer = state.room.players.find(p => p.userId === state.currentPlayerId);
    return currentPlayer?.isAI || false;
  }

  private convertToGarameState(state: GameStateWithRoom): GameStateWithRoom {
    const metadata = state.metadata as Record<string, unknown>;
    const players = new Map<string, GaramePlayerState>();
    
    // Convert players array to Map
    const playersObj = JSON.parse(state.players as string);
    for (const [id, player] of Object.entries(playersObj)) {
      players.set(id, player as GaramePlayerState);
    }

    // Parse metadata
    const garameMetadata = {
      lastPlayedCard: metadata.lastPlayedCard ? JSON.parse(metadata.lastPlayedCard as string) : undefined,
      maxScore: metadata.maxScore as number || 10,
      winners: metadata.winners as string[] || [],
      winnings: metadata.winnings as number | undefined
    };

    return {
      ...state,
      players: JSON.stringify(Object.fromEntries(players)),
      metadata: garameMetadata
    };
  }
}

export const gameStateService = GameStateService.getInstance(); 