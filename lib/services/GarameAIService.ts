import { injectable } from 'inversify';
import { IAIService } from '@/lib/interfaces/services/IAIService';
import { GameAction, BaseGameState, BasePlayerState, Card } from '@/lib/garame/core/types';
import { GarameGameState, GaramePlayerState } from '@/lib/garame/games/garame/garame-types';

@injectable()
export class GarameAIService implements IAIService {
  async getNextAction(
    gameState: BaseGameState, 
    playerId: string, 
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<GameAction> {
    const state = gameState as GarameGameState;
    const players = state.players as Map<string, BasePlayerState>;
    const playerState = players.get(playerId) as GaramePlayerState;
    
    if (!playerState) {
      throw new Error('Player not found in game state');
    }

    // Logique d'IA selon la difficulté
    switch (difficulty) {
      case 'easy':
        return this.getEasyAction(state, playerState, playerId);
      case 'medium':
        return this.getMediumAction(state, playerState, playerId);
      case 'hard':
        return this.getHardAction(state, playerState, playerId);
      default:
        return this.getEasyAction(state, playerState, playerId);
    }
  }

  private async getEasyAction(state: GarameGameState, player: GaramePlayerState, playerId: string): Promise<GameAction> {
    // IA facile : joue de manière aléatoire
    const validCards = this.getValidCards(state, player);
    if (validCards.length === 0) {
      throw new Error('No valid cards to play');
    }

    const randomIndex = Math.floor(Math.random() * validCards.length);
    const cardIndex = player.hand.indexOf(validCards[randomIndex]);

    return {
      type: 'play_card',
      playerId,
      data: { 
        cardIndex,
        card: validCards[randomIndex]
      },
      timestamp: new Date()
    };
  }

  private async getMediumAction(state: GarameGameState, player: GaramePlayerState, playerId: string): Promise<GameAction> {
    // IA moyenne : stratégie basique
    const validCards = this.getValidCards(state, player);
    if (validCards.length === 0) {
      throw new Error('No valid cards to play');
    }

    // Si on a une carte de valeur élevée et qu'on peut gagner le pli
    const highCards = validCards.filter(card => this.getCardValue(card) >= 10);
    if (highCards.length > 0 && Math.random() > 0.3) {
      const card = highCards[0];
      const cardIndex = player.hand.indexOf(card);
      return {
        type: 'play_card',
        playerId,
        data: { cardIndex, card },
        timestamp: new Date()
      };
    }

    // Sinon, jouer une carte de faible valeur
    const lowCards = validCards.filter(card => this.getCardValue(card) <= 5);
    const card = lowCards.length > 0 ? lowCards[0] : validCards[0];
    const cardIndex = player.hand.indexOf(card);
    
    return {
      type: 'play_card',
      playerId,
      data: { cardIndex, card },
      timestamp: new Date()
    };
  }

  private async getHardAction(state: GarameGameState, player: GaramePlayerState, playerId: string): Promise<GameAction> {
    // IA difficile : stratégie avancée
    const validCards = this.getValidCards(state, player);
    if (validCards.length === 0) {
      throw new Error('No valid cards to play');
    }

    // Analyser la situation du jeu
    const shouldBluffNow = this.shouldBluff(state, playerId, 'hard');
    
    if (shouldBluffNow) {
      // Bluffer avec une carte faible
      const lowCards = validCards.filter(card => this.getCardValue(card) <= 5);
      if (lowCards.length > 0) {
        const card = lowCards[0];
        const cardIndex = player.hand.indexOf(card);
        return {
          type: 'play_card',
          playerId,
          data: { cardIndex, card },
          timestamp: new Date()
        };
      }
    }

    // Jouer stratégiquement
    return this.getStrategicAction(state, player, playerId, validCards);
  }

  evaluatePosition(gameState: BaseGameState, playerId: string): number {
    const state = gameState as GarameGameState;
    const players = state.players as Map<string, BasePlayerState>;
    const player = players.get(playerId) as GaramePlayerState;
    if (!player) return 0;

    // Évaluer la position basée sur les cartes et le score
    const handValue = player.hand
      .reduce((sum, card) => sum + this.getCardValue(card), 0);
    
    return player.score + (handValue * 0.1) + (player.wonTricks * 5);
  }

  shouldBluff(gameState: BaseGameState, playerId: string, difficulty: string): boolean {
    if (difficulty === 'easy') return false;
    if (difficulty === 'medium') return Math.random() < 0.1; // 10% de chance
    
    // Pour 'hard', analyser la situation
    const state = gameState as GarameGameState;
    const players = state.players as Map<string, BasePlayerState>;
    const player = players.get(playerId) as GaramePlayerState;
    const opponents = Array.from(players.values())
      .filter(p => p.id !== playerId && p.isActive);
    
    // Bluffer si on est en retard au score
    const avgOpponentScore = opponents.reduce((sum, p) => sum + p.score, 0) / opponents.length;
    
    return player.score < avgOpponentScore && Math.random() < 0.3;
  }

  private getValidCards(state: GarameGameState, player: GaramePlayerState): Card[] {
    // Pour simplifier, toutes les cartes sont valides
    // Dans un vrai jeu, il faudrait vérifier les règles
    return player.hand;
  }

  private getCardValue(card: Card): number {
    const rankValues: Record<string, number> = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11,
      '10': 10, '9': 9, '8': 8, '7': 7,
      '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    return rankValues[card.rank] || 0;
  }

  private getStrategicAction(
    state: GarameGameState, 
    player: GaramePlayerState, 
    playerId: string,
    validCards: Card[]
  ): GameAction {
    // Trier les cartes par valeur
    const sortedCards = [...validCards].sort((a, b) => 
      this.getCardValue(b) - this.getCardValue(a)
    );
    
    // Jouer la meilleure carte si on est en fin de partie
    if (state.turn > 20) {
      const card = sortedCards[0];
      const cardIndex = player.hand.indexOf(card);
      return {
        type: 'play_card',
        playerId,
        data: { cardIndex, card },
        timestamp: new Date()
      };
    }

    // Sinon, garder les bonnes cartes pour plus tard
    const mediumCard = sortedCards[Math.floor(sortedCards.length / 2)];
    const cardIndex = player.hand.indexOf(mediumCard);
    return {
      type: 'play_card',
      playerId,
      data: { cardIndex, card: mediumCard },
      timestamp: new Date()
    };
  }
}