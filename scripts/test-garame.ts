#!/usr/bin/env tsx

import { runGarameTests } from '../lib/game-engine/games/garame/test-garame';

console.log('🎯 Tests du moteur de jeu Garame\n');

try {
  const success = runGarameTests();
  
  if (success) {
    console.log('\n🎉 Tous les tests sont passés! Le moteur Garame est prêt.');
    process.exit(0);
  } else {
    console.log('\n❌ Certains tests ont échoué.');
    process.exit(1);
  }
} catch (error) {
  console.error('\n💥 Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
} 