import { auth } from '@/lib/auth';

async function main() {
  console.log('🌱 Seeding database with Better Auth...');

  const testUsers = [
    {
      username: 'alice_garame',
      email: 'alice@example.com',
      name: 'Alice Garame',
      password: 'password123',
    },
    {
      username: 'bob_kora',
      email: 'bob@example.com',
      name: 'Bob Kora',
      password: 'password123',
    },
    {
      username: 'charlie_player',
      email: 'charlie@example.com',
      name: 'Charlie Joueur',
      password: 'password123',
    },
  ];

  for (const userData of testUsers) {
    try {
      console.log(`Creating user: ${userData.username}`);
      
      // Utiliser l'API Better Auth pour créer l'utilisateur
      const result = await auth.api.signUpEmail({
        body: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
          username: userData.username,
          role: 'USER' as const,
          phoneNumber: `+237${Math.floor(Math.random() * 100000000)}`, // Numéro de téléphone fictif
        },
      });

      console.log(`✅ Created user: ${userData.name} (${userData.email})`);
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.username}:`, error);
    }
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  }); 