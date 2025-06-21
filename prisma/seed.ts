import { PrismaClient, TransactionType, TransactionStatus, GameType, GameRoomStatus, MoveType, AIDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Créer des utilisateurs de test
  const testUsers = [
    {
      id: 'user1',
      name: 'Alice Garame',
      username: 'alice_garame',
      email: 'alice@example.com',
      emailVerified: true,
      koras: 1000,
      totalWins: 5,
      totalGames: 12,
    },
    {
      id: 'user2', 
      name: 'Bob Kora',
      username: 'bob_kora',
      email: 'bob@example.com',
      emailVerified: true,
      koras: 750,
      totalWins: 3,
      totalGames: 8,
    },
    {
      id: 'user3',
      name: 'Charlie Joueur',
      username: 'charlie_player',
      email: 'charlie@example.com',
      emailVerified: true,
      koras: 500,
      totalWins: 1,
      totalGames: 3,
    },
  ];

  // Insérer les utilisateurs
  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Créer un wallet pour chaque utilisateur
    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        koraBalance: userData.koras,
        totalDeposits: userData.koras * 10, // Simule des dépôts en FCFA
      },
    });

    // Créer des statistiques de jeu
    await prisma.userGameStats.upsert({
      where: { 
        userId_gameType: {
          userId: user.id,
          gameType: 'garame'
        }
      },
      update: {},
      create: {
        userId: user.id,
        gameType: 'garame',
        gamesPlayed: userData.totalGames,
        gamesWon: userData.totalWins,
        totalKorasWon: userData.totalWins * 100,
        totalKorasLost: (userData.totalGames - userData.totalWins) * 50,
        bestWinStreak: Math.max(1, userData.totalWins - 1),
        currentStreak: userData.totalWins > 0 ? 1 : 0,
        avgGameDuration: 300 + Math.floor(Math.random() * 600), // 5-15 minutes
        lastPlayedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Dans les 7 derniers jours
      },
    });

    console.log(`✅ Created user: ${user.name} (${user.email})`);
  }

  // Créer quelques transactions de test
  const transactions = [
    {
      userId: 'user1',
      type: TransactionType.DEPOSIT,
      amount: 5000,
      koras: 500,
      korasBefore: 500,
      korasAfter: 1000,
      description: 'Dépôt initial Mobile Money',
      status: TransactionStatus.COMPLETED,
    },
    {
      userId: 'user1',
      type: TransactionType.GAME_WIN,
      koras: 100,
      korasBefore: 900,
      korasAfter: 1000,
      description: 'Victoire partie Garame #12',
      status: TransactionStatus.COMPLETED,
    },
    {
      userId: 'user2',
      type: TransactionType.BUY_KORAS,
      amount: 7500,
      koras: 750,
      korasBefore: 0,
      korasAfter: 750,
      description: 'Achat de Koras',
      status: TransactionStatus.COMPLETED,
    },
    {
      userId: 'user3',
      type: TransactionType.GAME_STAKE,
      koras: -50,
      korasBefore: 550,
      korasAfter: 500,
      description: 'Mise partie Garame',
      status: TransactionStatus.COMPLETED,
    },
  ];

  for (const transactionData of transactions) {
    await prisma.transaction.create({
      data: {
        ...transactionData,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Dans les 30 derniers jours
        updatedAt: new Date(),
      },
    });
  }

  console.log(`✅ Created ${transactions.length} test transactions`);

  // Créer quelques salles de jeu de test
  const gameRooms = [
    {
      id: 'room1',
      gameType: GameType.garame,
      stake: 50,
      creatorId: 'user1',
      creatorName: 'Alice Garame',
      status: GameRoomStatus.WAITING,
      maxPlayers: 4,
      minPlayers: 2,
      totalPot: 200,
      settings: {
        timeLimit: 30,
        autoStart: true,
        allowSpectators: true,
      },
    },
    {
      id: 'room2',
      gameType: GameType.garame,
      stake: 100,
      creatorId: 'user2',
      creatorName: 'Bob Kora',
      status: GameRoomStatus.IN_PROGRESS,
      maxPlayers: 3,
      minPlayers: 2,
      totalPot: 300,
      settings: {
        timeLimit: 45,
        autoStart: false,
        allowSpectators: false,
      },
    },
  ];

  for (const roomData of gameRooms) {
    const room = await prisma.gameRoom.create({
      data: {
        ...roomData,
        settings: JSON.stringify(roomData.settings),
        createdAt: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000), // Dans les 2 dernières heures
        updatedAt: new Date(),
      },
    });

    // Ajouter des joueurs à la salle
    const playerData = [
      {
        name: roomData.creatorName,
        position: 0,
        isReady: true,
        userId: roomData.creatorId,
        gameRoomId: room.id,
      },
    ];

    // Ajouter d'autres joueurs selon le statut
    if (roomData.status === 'IN_PROGRESS') {
      playerData.push({
        name: 'Charlie Joueur',
        position: 1,
        isReady: true,
        userId: 'user3',
        gameRoomId: room.id,
      });

             // Ajouter une IA
    }

    for (const player of playerData) {
      await prisma.roomPlayer.create({
        data: {
          ...player,
          isAI: false,
        },
      });
    }

    // Create AI player separately if needed
    if (roomData.status === 'IN_PROGRESS') {
      await prisma.roomPlayer.create({
        data: {
          name: 'IA Medium',
          position: 2,
          isReady: true,
          isAI: true,
          aiDifficulty: AIDifficulty.MEDIUM,
          gameRoomId: room.id,
        },
      });
    }

    // Créer un état de jeu pour les parties en cours
    if (roomData.status === 'IN_PROGRESS') {
      await prisma.gameState.create({
        data: {
          id: `state_${room.id}`,
          gameType: 'garame',
          currentPlayerId: roomData.creatorId,
          players: JSON.stringify({
            [roomData.creatorId]: {
              hand: ['3_hearts', '7_spades', '9_diamonds'],
              cardsWon: [],
              korasWon: 0,
              hasFolded: false,
            },
            'user3': {
              hand: ['4_clubs', '8_hearts', '10_diamonds'],
              cardsWon: ['5_spades'],
              korasWon: 0,
              hasFolded: false,
            },
            'ai_medium': {
              hand: ['6_hearts', '9_clubs'],
              cardsWon: [],
              korasWon: 0,
              hasFolded: false,
            },
          }),
          pot: roomData.totalPot,
          status: 'PLAYING',
          turn: 3,
          roomId: room.id,
          metadata: JSON.stringify({
            round: 1,
            maxRounds: 5,
            tableCards: ['5_spades'],
            lastAction: {
              playerId: 'user3',
              action: 'play',
              card: '5_spades',
              timestamp: new Date().toISOString(),
            },
          }),
        },
      });

      // Ajouter quelques mouvements de jeu
      const moves = [
        {
          gameId: `state_${room.id}`,
          playerId: roomData.creatorId,
          playerName: roomData.creatorName,
          moveNumber: 1,
          moveType: MoveType.PLAY_CARD,
          moveData: JSON.stringify({ cardId: '3_hearts' }),
        },
        {
          gameId: `state_${room.id}`,
          playerId: 'user3',
          playerName: 'Charlie Joueur',
          moveNumber: 2,
          moveType: MoveType.PLAY_CARD,
          moveData: JSON.stringify({ cardId: '5_spades' }),
        },
        {
          gameId: `state_${room.id}`,
          playerId: 'ai_medium',
          playerName: 'IA Medium',
          moveNumber: 3,
          moveType: MoveType.PLAY_CARD,
          moveData: JSON.stringify({ cardId: '4_clubs' }),
        },
      ];

      for (const move of moves) {
        await prisma.gameMove.create({
          data: {
            ...move,
            timestamp: new Date(Date.now() - (moves.length - move.moveNumber) * 30 * 1000),
          },
        });
      }
    }

    console.log(`✅ Created game room: ${room.id} (${roomData.status})`);
  }

  console.log('🎉 Database seeded successfully!');
  console.log(`
📊 Summary:
- ${testUsers.length} users created
- ${transactions.length} transactions created  
- ${gameRooms.length} game rooms created
- Game states and moves for active games
- Wallets and game statistics initialized

🎮 Test users:
- alice@example.com (1000 Koras)
- bob@example.com (750 Koras)  
- charlie@example.com (500 Koras)

🏠 Test rooms:
- room1: Waiting for players (50 Koras stake)
- room2: Game in progress (100 Koras stake)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 