import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating wallets and transactions for existing users...');

  // Récupérer les utilisateurs créés par Better Auth
  const users = await prisma.user.findMany({
    where: {
      username: {
        in: ['alice_garame', 'bob_kora', 'charlie_player']
      }
    }
  });

  console.log(`Found ${users.length} users`);

  // Données de wallet par utilisateur
  const walletData = {
    'alice_garame': { koras: 1000, totalDeposits: 10000 },
    'bob_kora': { koras: 750, totalDeposits: 7500 },
    'charlie_player': { koras: 500, totalDeposits: 5000 },
  };

  // Créer les wallets
  for (const user of users) {
    const userData = walletData[user.username as keyof typeof walletData];
    
    if (userData) {
      // Créer le wallet
      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          koraBalance: userData.koras,
          totalDeposits: userData.totalDeposits,
        },
      });

      // Mettre à jour les koras dans le profil utilisateur
      await prisma.user.update({
        where: { id: user.id },
        data: {
          koras: userData.koras,
          totalWins: user.username === 'alice_garame' ? 5 : user.username === 'bob_kora' ? 3 : 1,
          totalGames: user.username === 'alice_garame' ? 12 : user.username === 'bob_kora' ? 8 : 3,
        },
      });

      console.log(`✅ Created wallet for ${user.name} (${userData.koras} Koras)`);
    }
  }

  // Créer quelques transactions de test
  const aliceUser = users.find(u => u.username === 'alice_garame');
  const bobUser = users.find(u => u.username === 'bob_kora');

  if (aliceUser) {
    await prisma.transaction.create({
      data: {
        userId: aliceUser.id,
        type: TransactionType.DEPOSIT,
        amount: 5000,
        koras: 500,
        korasBefore: 500,
        korasAfter: 1000,
        description: 'Dépôt initial Mobile Money',
        status: TransactionStatus.COMPLETED,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Il y a 7 jours
      },
    });
  }

  if (bobUser) {
    await prisma.transaction.create({
      data: {
        userId: bobUser.id,
        type: TransactionType.BUY_KORAS,
        amount: 7500,
        koras: 750,
        korasBefore: 0,
        korasAfter: 750,
        description: 'Achat de Koras',
        status: TransactionStatus.COMPLETED,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
      },
    });
  }

  console.log('✅ Created test transactions');

  console.log('🎉 Database seeded successfully!');
  console.log(`
📊 Summary:
- ${users.length} users with wallets created
- 2 test transactions created

🎮 Test users (password: password123):
- alice_garame (Alice Garame) - 1000 Koras
- bob_kora (Bob Kora) - 750 Koras  
- charlie_player (Charlie Joueur) - 500 Koras

✅ Ready for testing tRPC and WebSocket!
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