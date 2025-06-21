import { GameRules, GameMove } from '../../core/GameRules';
import { 
  GarameState, 
  GaramePlayerState, 
  GarameCard, 
  GarameConfig, 
  DEFAULT_GARAME_CONFIG,
  GarameCardUtils,
  GarameMoveData,
  GarameAction,
  GarameRound,
  GarameKora
} from './GarameState';

/**
 * Implémentation des règles du jeu Garame
 */
export class GarameRules implements GameRules<GarameState> {
  private config: GarameConfig;

  constructor(config: GarameConfig = DEFAULT_GARAME_CONFIG) {
    this.config = config;
  }

  /**
   * Initialise un nouveau jeu Garame
   */
  initializeGame(playerCount: number, betAmount: number): GarameState {
    if (playerCount < this.config.minPlayers || playerCount > this.config.maxPlayers) {
      throw new Error(`Le nombre de joueurs doit être entre ${this.config.minPlayers} et ${this.config.maxPlayers}`);
    }

    // Créer le deck et mélanger
    const deck = GarameCardUtils.createDeck(this.config);
    
    // Créer les joueurs
    const players: Record<string, GaramePlayerState> = {};
    for (let i = 0; i < playerCount; i++) {
      const playerId = `player_${i}`;
      players[playerId] = {
        id: playerId,
        name: `Joueur ${i + 1}`,
        isActive: true,
        hasLeft: false,
        joinedAt: new Date(),
        hand: [],
        cardsWon: [],
        korasWon: 0,
        hasFolded: false,
        position: i,
        isReady: false,
      };
    }

    // Distribuer les cartes
    const updatedDeck = [...deck];
    for (let cardIndex = 0; cardIndex < this.config.cardsPerPlayer; cardIndex++) {
      for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
        const playerId = `player_${playerIndex}`;
        const card = updatedDeck.pop();
        if (card) {
          players[playerId].hand.push(card);
        }
      }
    }

    // État initial du jeu
    const initialState: GarameState = {
      gameId: `garame_${Date.now()}`,
      gameType: 'garame',
      status: 'in_progress',
      players,
      currentPlayerId: 'player_0', // Le premier joueur commence
      turn: 1,
      betAmount,
      pot: betAmount * playerCount,
      startedAt: new Date(),
      
      // Spécifique à Garame
      deck: updatedDeck,
      tableCards: [],
      currentRound: 1,
      maxRounds: this.config.cardsPerPlayer,
      roundWinner: null,
      roundHistory: [],
      lastAction: null,
      totalCardsPlayed: 0,
      korasDetected: [],
    };

    // Détecter les Koras initiales
    this.detectInitialKoras(initialState);

    return initialState;
  }

  /**
   * Valide si un mouvement est légal
   */
  validateMove(state: GarameState, move: GameMove): boolean {
    const player = state.players[move.playerId];
    if (!player || !player.isActive || player.hasFolded) {
      return false;
    }

    // Vérifier si c'est le tour du joueur
    if (state.currentPlayerId !== move.playerId) {
      return false;
    }

    const moveData = move.data as GarameMoveData;

    switch (move.type) {
      case 'PLAY_CARD':
        return this.validatePlayCard(state, move.playerId, moveData.cardId);
      
      case 'FOLD':
        return this.validateFold(state, move.playerId);
      
      case 'READY':
        return this.validateReady(state, move.playerId);
      
      default:
        return false;
    }
  }

  /**
   * Applique un mouvement au jeu
   */
  applyMove(state: GarameState, move: GameMove): GarameState {
    const newState = JSON.parse(JSON.stringify(state)) as GarameState;
    const moveData = move.data as GarameMoveData;

    switch (move.type) {
      case 'PLAY_CARD':
        this.applyPlayCard(newState, move.playerId, moveData.cardId!);
        break;
      
      case 'FOLD':
        this.applyFold(newState, move.playerId);
        break;
      
      case 'READY':
        this.applyReady(newState, move.playerId);
        break;
    }

    // Mettre à jour l'action
    newState.lastAction = {
      type: move.type as any,
      playerId: move.playerId,
      playerName: newState.players[move.playerId].name,
      timestamp: new Date(),
    };

    // Vérifier si le tour est terminé
    if (move.type === 'PLAY_CARD') {
      this.checkRoundEnd(newState);
    }

    return newState;
  }

  /**
   * Vérifie si le jeu est terminé
   */
  isGameOver(state: GarameState): boolean {
    // Jeu terminé si tous les tours sont joués
    if (state.currentRound > state.maxRounds) {
      return true;
    }

    // Jeu terminé si un seul joueur reste actif
    const activePlayers = Object.values(state.players).filter(p => p.isActive && !p.hasFolded);
    if (activePlayers.length <= 1) {
      return true;
    }

    return false;
  }

  /**
   * Retourne les gagnants du jeu
   */
  getWinners(state: GarameState): string[] | null {
    if (!this.isGameOver(state)) {
      return null;
    }

    const activePlayers = Object.values(state.players).filter(p => p.isActive && !p.hasFolded);
    
    if (activePlayers.length === 1) {
      return [activePlayers[0].id];
    }

    // Calculer les scores finaux
    const scores = activePlayers.map(player => ({
      playerId: player.id,
      score: this.calculatePlayerScore(player),
    }));

    // Trier par score décroissant
    scores.sort((a, b) => b.score - a.score);

    // Retourner tous les joueurs avec le meilleur score
    const bestScore = scores[0].score;
    return scores.filter(s => s.score === bestScore).map(s => s.playerId);
  }

  /**
   * Calcule les gains pour chaque joueur
   */
  calculatePayouts(state: GarameState): Record<string, number> {
    const payouts: Record<string, number> = {};
    const winners = this.getWinners(state);
    
    if (!winners || winners.length === 0) {
      return payouts;
    }

    // Calculer la commission
    const commission = Math.floor(state.pot * (this.config.commission / 100));
    const netPot = state.pot - commission;

    // Distribuer les gains
    const winnerShare = Math.floor(netPot / winners.length);
    
    for (const winner of winners) {
      payouts[winner] = winnerShare;
    }

    // Ajouter les gains des Koras
    for (const kora of state.korasDetected) {
      const koraGain = Math.floor(state.betAmount * kora.multiplier);
      payouts[kora.playerId] = (payouts[kora.playerId] || 0) + koraGain;
    }

    return payouts;
  }

  /**
   * Retourne les mouvements possibles pour un joueur
   */
  getPossibleMoves(state: GarameState, playerId: string): GameMove[] {
    const moves: GameMove[] = [];
    const player = state.players[playerId];

    if (!player || !player.isActive || player.hasFolded) {
      return moves;
    }

    if (state.currentPlayerId !== playerId) {
      return moves;
    }

    // Jouer une carte
    for (const card of player.hand) {
      moves.push({
        type: 'PLAY_CARD',
        playerId,
        data: { cardId: card.id },
      });
    }

    // Se coucher (si pas déjà fait)
    if (!player.hasFolded) {
      moves.push({
        type: 'FOLD',
        playerId,
        data: {},
      });
    }

    return moves;
  }

  // Méthodes privées pour la validation

  private validatePlayCard(state: GarameState, playerId: string, cardId?: string): boolean {
    if (!cardId) return false;
    
    const player = state.players[playerId];
    return player.hand.some(card => card.id === cardId);
  }

  private validateFold(state: GarameState, playerId: string): boolean {
    const player = state.players[playerId];
    return !player.hasFolded;
  }

  private validateReady(state: GarameState, playerId: string): boolean {
    const player = state.players[playerId];
    return !player.isReady;
  }

  // Méthodes privées pour l'application des mouvements

  private applyPlayCard(state: GarameState, playerId: string, cardId: string): void {
    const player = state.players[playerId];
    const cardIndex = player.hand.findIndex(card => card.id === cardId);
    
    if (cardIndex === -1) return;

    // Retirer la carte de la main et l'ajouter à la table
    const card = player.hand.splice(cardIndex, 1)[0];
    state.tableCards.push(card);
    state.totalCardsPlayed++;

    // Mettre à jour l'action
    if (state.lastAction) {
      state.lastAction.card = card;
    }

    // Passer au joueur suivant
    this.nextPlayer(state);
  }

  private applyFold(state: GarameState, playerId: string): void {
    const player = state.players[playerId];
    player.hasFolded = true;
    player.isActive = false;

    // Passer au joueur suivant
    this.nextPlayer(state);
  }

  private applyReady(state: GarameState, playerId: string): void {
    const player = state.players[playerId];
    player.isReady = true;
  }

  private nextPlayer(state: GarameState): void {
    const playerIds = Object.keys(state.players);
    const currentIndex = playerIds.indexOf(state.currentPlayerId!);
    
    // Trouver le prochain joueur actif
    let nextIndex = (currentIndex + 1) % playerIds.length;
    let attempts = 0;
    
    while (attempts < playerIds.length) {
      const nextPlayerId = playerIds[nextIndex];
      const nextPlayer = state.players[nextPlayerId];
      
      if (nextPlayer.isActive && !nextPlayer.hasFolded) {
        state.currentPlayerId = nextPlayerId;
        return;
      }
      
      nextIndex = (nextIndex + 1) % playerIds.length;
      attempts++;
    }
    
    // Aucun joueur actif trouvé
    state.currentPlayerId = null;
  }

  private checkRoundEnd(state: GarameState): void {
    const activePlayers = Object.values(state.players).filter(p => p.isActive && !p.hasFolded);
    
    // Vérifier si tous les joueurs actifs ont joué
    if (state.tableCards.length === activePlayers.length) {
      this.resolveRound(state);
    }
  }

  private resolveRound(state: GarameState): void {
    if (state.tableCards.length === 0) return;

    // Trouver la carte gagnante
    const winningCard = GarameCardUtils.findHighestCard(state.tableCards);
    
    // Trouver le joueur qui a joué cette carte
    let roundWinner: string | null = null;
    const cardsPlayed: Record<string, GarameCard> = {};
    
    for (const [playerId, player] of Object.entries(state.players)) {
      if (player.isActive && !player.hasFolded) {
        // Logique simplifiée : associer les cartes aux joueurs
        // Dans une vraie implémentation, il faudrait tracker qui a joué quelle carte
        const playedCard = state.tableCards.find(card => card.id === winningCard.id);
        if (playedCard) {
          roundWinner = playerId;
          cardsPlayed[playerId] = playedCard;
        }
      }
    }

    if (roundWinner) {
      // Le gagnant récupère toutes les cartes
      const winner = state.players[roundWinner];
      winner.cardsWon.push(...state.tableCards);
      
      // Enregistrer le tour dans l'historique
      const round: GarameRound = {
        roundNumber: state.currentRound,
        cardsPlayed,
        winner: roundWinner,
        winningCard,
        timestamp: new Date(),
      };
      state.roundHistory.push(round);
      
      // Nettoyer la table
      state.tableCards = [];
      state.roundWinner = roundWinner;
      state.currentPlayerId = roundWinner; // Le gagnant commence le prochain tour
      state.currentRound++;
    }
  }

  private detectInitialKoras(state: GarameState): void {
    for (const [playerId, player] of Object.entries(state.players)) {
      const koras = GarameCardUtils.detectKoras(player.hand);
      
      for (const kora of koras) {
        kora.playerId = playerId;
        kora.playerName = player.name;
        state.korasDetected.push(kora);
        player.korasWon += kora.multiplier;
      }
    }
  }

  private calculatePlayerScore(player: GaramePlayerState): number {
    // Score basé sur le nombre de cartes gagnées + bonus Koras
    return player.cardsWon.length + (player.korasWon * 10);
  }
} 