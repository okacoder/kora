// lib/garame/infrastructure/fake-repositories.ts
import { injectable } from "inversify";
import {
  IPlayer,
  IGameRoom,
  IGameState,
  ITransaction,
  IPlayerRepository,
  IGameRoomRepository,
  IGameStateRepository,
  ITransactionRepository,
  ICard,
  IPlayerGameState,
  GameNotFoundError,
  InsufficientBalanceError,
  IGameCard,
} from "../domain/interfaces";

// Fake data store
class FakeDataStore {
  private static instance: FakeDataStore;
  
  players: Map<string, IPlayer> = new Map();
  gameRooms: Map<string, IGameRoom> = new Map();
  gameStates: Map<string, IGameState> = new Map();
  transactions: Map<string, ITransaction> = new Map();
  
  private constructor() {
    // Initialiser avec des données de test
    this.initializeTestData();
  }
  
  static getInstance(): FakeDataStore {
    if (!FakeDataStore.instance) {
      FakeDataStore.instance = new FakeDataStore();
    }
    return FakeDataStore.instance;
  }
  
  private initializeTestData() {
    // Joueur actuel
    this.players.set("current-user", {
      id: "current-user",
      username: "OkaTest",
      balance: 50000,
    });
    
    // Autres joueurs
    this.players.set("player2", {
      id: "player2",
      username: "Jean241",
      balance: 15000,
    });
    
    this.players.set("player3", {
      id: "player3",
      username: "MariePro",
      balance: 30000,
    });
    
    // Parties disponibles (en koras)
    this.gameRooms.set("room1", {
      id: "room1",
      stake: 50,
      creatorId: "player2",
      creatorName: "Jean241",
      status: "waiting",
      players: 1,
      maxPlayers: 2,
      totalPot: 50,
      createdAt: new Date(Date.now() - 5 * 60000), // il y a 5 minutes
    });
    
    this.gameRooms.set("room2", {
      id: "room2",
      stake: 100,
      creatorId: "player3",
      creatorName: "MariePro",
      status: "waiting",
      players: 1,
      maxPlayers: 2,
      totalPot: 100,
      createdAt: new Date(Date.now() - 2 * 60000), // il y a 2 minutes
    });
  }
}

@injectable()
export class FakePlayerRepository implements IPlayerRepository {
  private store = FakeDataStore.getInstance();
  
  async getCurrentPlayer(): Promise<IPlayer> {
    await this.simulateDelay();
    return this.store.players.get("current-user")!;
  }
  
  async getPlayerById(id: string): Promise<IPlayer | null> {
    await this.simulateDelay();
    return this.store.players.get(id) || null;
  }
  
  async updateBalance(playerId: string, amount: number): Promise<void> {
    await this.simulateDelay();
    const player = this.store.players.get(playerId);
    if (player) {
      player.balance += amount;
    }
  }
  
  private simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
  }
}

@injectable()
export class FakeGameRoomRepository implements IGameRoomRepository {
  private store = FakeDataStore.getInstance();
  
  async getAvailableRooms(): Promise<IGameRoom[]> {
    await this.simulateDelay();
    return Array.from(this.store.gameRooms.values())
      .filter(room => room.status === "waiting");
  }
  
  async getRoomById(roomId: string): Promise<IGameRoom | null> {
    await this.simulateDelay();
    return this.store.gameRooms.get(roomId) || null;
  }
  
  async createRoom(stake: number, creatorId: string): Promise<IGameRoom> {
    await this.simulateDelay();
    
    const creator = this.store.players.get(creatorId);
    if (!creator) throw new Error("Joueur introuvable");
    
    // Vérifier le solde en koras
    const creatorKoras = Math.floor(creator.balance / 10);
    if (creatorKoras < stake) {
      throw new InsufficientBalanceError();
    }
    
    const roomId = `room-${Date.now()}`;
    const room: IGameRoom = {
      id: roomId,
      stake,
      creatorId,
      creatorName: creator.username,
      status: "waiting",
      players: 1,
      maxPlayers: 2,
      totalPot: stake,
      createdAt: new Date(),
    };
    
    this.store.gameRooms.set(roomId, room);
    
    // Déduire la mise du solde (en FCFA)
    creator.balance -= stake * 10;
    
    return room;
  }
  
  async joinRoom(roomId: string, playerId: string): Promise<IGameRoom> {
    await this.simulateDelay();
    
    const room = this.store.gameRooms.get(roomId);
    if (!room) throw new GameNotFoundError();
    
    const player = this.store.players.get(playerId);
    if (!player) throw new Error("Joueur introuvable");
    
    // Vérifier le solde en koras
    const playerKoras = Math.floor(player.balance / 10);
    if (playerKoras < room.stake) {
      throw new InsufficientBalanceError();
    }
    
    if (player.balance < room.stake) {
      throw new InsufficientBalanceError();
    }
    
    // Mettre à jour la room
    room.opponentId = playerId;
    room.opponentName = player.username;
    room.players = 2;
    room.totalPot = room.stake * 2;
    room.status = "starting";
    
    // Déduire la mise du solde (en FCFA)
    player.balance -= room.stake * 10;

    // Simuler le début de partie après 3 secondes
    setTimeout(() => {
      room.status = "in_progress";
    }, 3000);
    
    return room;
  }
  
  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    await this.simulateDelay();
    
    const room = this.store.gameRooms.get(roomId);
    if (!room) return;
    
    if (room.creatorId === playerId && room.players === 1) {
      // Rembourser la mise et supprimer la room
      const player = this.store.players.get(playerId);
      if (player) {
        player.balance += room.stake * 10;
      }
      this.store.gameRooms.delete(roomId);
    }
  }
  
  async updateRoomStatus(roomId: string, status: IGameRoom['status']): Promise<void> {
    await this.simulateDelay();
    const room = this.store.gameRooms.get(roomId);
    if (room) {
      room.status = status;
    }
  }
  
  private simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
  }
}

@injectable()
export class FakeGameStateRepository implements IGameStateRepository {
  private store = FakeDataStore.getInstance();
  
  async getGameState(gameId: string): Promise<IGameState | null> {
    await this.simulateDelay();
    return this.store.gameStates.get(gameId) || null;
  }
  
  async createGameState(roomId: string, players: string[]): Promise<IGameState> {
    await this.simulateDelay();
    
    const room = this.store.gameRooms.get(roomId);
    if (!room) throw new GameNotFoundError();
    
    // Distribuer les cartes
    const deck = this.createDeck();
    this.shuffleDeck(deck);
    
    const gameState: IGameState = {
      id: `game-${Date.now()}`,
      roomId,
      currentTurnPlayerId: players[0], // Le créateur commence
      players: new Map(),
      pot: room.totalPot,
      status: "playing",
      startedAt: new Date(),
    };
    
    // Distribuer 5 cartes à chaque joueur
    players.forEach((playerId, index) => {
      const player = this.store.players.get(playerId);
      if (!player) return;

      const playerCards: IGameCard[] = deck.splice(0, 5).map(card => ({
        ...card,
        playerId,
        gameId: gameState.id,
        canBePlayed: gameState.currentTurnPlayerId === playerId,
      }));
      const playerState: IPlayerGameState = {
        playerId,
        username: player.username,
        avatar: player.avatar,
        cards: playerCards,
        hasKora: index === 0, // Le premier joueur a la kora
        score: 0,
        isReady: true,
      };
      gameState.players.set(playerId, playerState);
    });
    
    this.store.gameStates.set(gameState.id, gameState);
    return gameState;
  }
  
  async updateGameState(gameId: string, state: Partial<IGameState>): Promise<void> {
    await this.simulateDelay();
    const gameState = this.store.gameStates.get(gameId);
    if (gameState) {
      Object.assign(gameState, state);
    }
  }
  
  async playCard(gameId: string, playerId: string, cardIndex: number): Promise<IGameState> {
    await this.simulateDelay();

    const gameState = this.store.gameStates.get(gameId);
    if (!gameState) throw new GameNotFoundError();

    if (gameState.currentTurnPlayerId !== playerId) {
      throw new Error("Ce n'est pas votre tour de jouer");
    }

    const playerState = gameState.players.get(playerId);
    if (!playerState) throw new Error("Joueur introuvable dans la partie");

    const card = playerState.cards[cardIndex];
    if (!card) throw new Error("Carte invalide");

    if (!card.canBePlayed) {
      throw new Error("Cette carte ne peut pas être jouée pour le moment");
    }

    // Retirer la carte de la main du joueur
    playerState.cards.splice(cardIndex, 1);

    // Mettre à jour l'état du jeu
    gameState.lastPlayedCard = card;
    gameState.currentSuit = card.suit;

    // Passer au joueur suivant
    const playerIds = Array.from(gameState.players.keys());
    const currentIndex = playerIds.indexOf(playerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    gameState.currentTurnPlayerId = playerIds[nextIndex];

    // Vérifier si le joueur a gagné
    if (playerState.cards.length === 0) {
      gameState.status = "finished";
      gameState.winnerId = playerId;
      gameState.endedAt = new Date();

      // Distribuer les gains (en FCFA)
      const winner = this.store.players.get(playerId);
      if (winner) {
        const korasWon = Math.floor(gameState.pot * 0.9);
        winner.balance += korasWon * 10; // Convertir en FCFA
      }

      // Aucune carte n'est jouable
      gameState.players.forEach(pState => {
        pState.cards.forEach(c => c.canBePlayed = false);
      });
    } else {
      // Mettre à jour canBePlayed pour toutes les cartes de tous les joueurs
      gameState.players.forEach((pState) => {
        const isNextPlayer = pState.playerId === gameState.currentTurnPlayerId;

        // Si ce n'est pas le tour du joueur, aucune de ses cartes n'est jouable.
        if (!isNextPlayer) {
          pState.cards.forEach(c => { c.canBePlayed = false; });
          return;
        }

        const canFollowSuit = pState.cards.some(c => c.suit === gameState.currentSuit);

        pState.cards.forEach(c => {
          if (gameState.currentSuit) {
            c.canBePlayed = canFollowSuit ? c.suit === gameState.currentSuit : true;
          } else {
            c.canBePlayed = true;
          }
        });
      });
    }

    return gameState;
  }
  
  async passKora(gameId: string, fromPlayerId: string, toPlayerId: string): Promise<void> {
    await this.simulateDelay();
    
    const gameState = this.store.gameStates.get(gameId);
    if (!gameState) throw new GameNotFoundError();
    
    const fromPlayer = gameState.players.get(fromPlayerId);
    const toPlayer = gameState.players.get(toPlayerId);
    
    if (fromPlayer && toPlayer) {
      fromPlayer.hasKora = false;
      toPlayer.hasKora = true;
      gameState.currentTurnPlayerId = toPlayerId;
    }
  }
  
  private createDeck(): ICard[] {
    const suits: ICard['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: ICard['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: ICard[] = [];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank });
      }
    }
    
    return deck;
  }
  
  private shuffleDeck(deck: ICard[]): void {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
  
  private simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
  }
}

@injectable()
export class FakeTransactionRepository implements ITransactionRepository {
  private store = FakeDataStore.getInstance();
  
  async createTransaction(transaction: Omit<ITransaction, 'id' | 'createdAt'>): Promise<ITransaction> {
    await this.simulateDelay();
    
    const newTransaction: ITransaction = {
      ...transaction,
      id: `tx-${Date.now()}`,
      createdAt: new Date(),
    };
    
    this.store.transactions.set(newTransaction.id, newTransaction);
    return newTransaction;
  }
  
  async getUserTransactions(userId: string): Promise<ITransaction[]> {
    await this.simulateDelay();
    
    return Array.from(this.store.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getTransactionById(id: string): Promise<ITransaction | null> {
    await this.simulateDelay();
    return this.store.transactions.get(id) || null;
  }
  
  private simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
  }
}