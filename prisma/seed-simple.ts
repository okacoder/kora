import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with basic data...');

  // Créer des utilisateurs de test avec mots de passe
  const testUsers = [
    {
      id: 'user1',
      name: 'Alice Garame',
      username: 'alice_garame',
      email: 'alice@example.com',
      password: 'password123', // Mot de passe simple pour les tests
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
      password: 'password123',
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
      password: 'password123',
      emailVerified: true,
      koras: 500,
      totalWins: 1,
      totalGames: 3,
    },
  ];

  // Insérer les utilisateurs
  for (const userData of testUsers) {
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        emailVerified: userData.emailVerified,
        koras: userData.koras,
        totalWins: userData.totalWins,
        totalGames: userData.totalGames,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Créer un compte avec mot de passe pour l'authentification
    await prisma.account.upsert({
      where: { 
        id: `account_${userData.id}`
      },
      update: {},
      create: {
        id: `account_${userData.id}`,
        accountId: userData.email,
        providerId: 'credential',
        userId: user.id,
        password: hashedPassword,
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
      userId: 'user2',
      type: TransactionType.BUY_KORAS,
      amount: 7500,
      koras: 750,
      korasBefore: 0,
      korasAfter: 750,
      description: 'Achat de Koras',
      status: TransactionStatus.COMPLETED,
    },
  ];

  for (const transactionData of transactions) {
    await prisma.transaction.create({
      data: {
        ...transactionData,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    });
  }

  console.log(`✅ Created ${transactions.length} test transactions`);

  console.log('🎉 Database seeded successfully!');
  console.log(`
📊 Summary:
- ${testUsers.length} users created with wallets and accounts
- ${transactions.length} transactions created

🎮 Test users (password: password123):
- alice@example.com (1000 Koras)
- bob@example.com (750 Koras)  
- charlie@example.com (500 Koras)

Ready for testing tRPC and WebSocket!
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