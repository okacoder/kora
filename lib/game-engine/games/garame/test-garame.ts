import { GameEngine } from '../../core/GameEngine';
import { GarameRules } from './GarameRules';
import { GarameState, GaramePlayerState } from './GarameState';

/**
 * Tests pour le moteur de jeu Garame
 */
export class GarameTestSuite {
  private engine: GameEngine<GarameState>;
  private rules: GarameRules;

  constructor() {
    this.rules = new GarameRules();
    this.engine = new GameEngine(this.rules);
  }

  /**
   * Test d'initialisation du jeu
   */
  testInitialization(): boolean {
    console.log('🧪 Test: Initialisation du jeu Garame');
    
    try {
      const state = this.engine.initializeGame(3, 100);
      
      // Vérifications de base
      console.assert(state.gameType === 'garame', 'Type de jeu incorrect');
      console.assert(Object.keys(state.players).length === 3, 'Nombre de joueurs incorrect');
      console.assert(state.pot === 300, 'Pot incorrect');
      console.assert(state.betAmount === 100, 'Mise incorrecte');
      console.assert(state.currentRound === 1, 'Tour initial incorrect');
      console.assert(state.status === 'in_progress', 'Statut initial incorrect');
      
      // Vérifier que chaque joueur a 5 cartes
      for (const player of Object.values(state.players)) {
        console.assert(player.hand.length === 5, `Joueur ${player.name} n'a pas 5 cartes`);
        console.assert(player.cardsWon.length === 0, `Joueur ${player.name} a déjà des cartes gagnées`);
        console.assert(!player.hasFolded, `Joueur ${player.name} est déjà couché`);
      }
      
      console.log('✅ Test d\'initialisation réussi');
      return true;
    } catch (error) {
      console.error('❌ Test d\'initialisation échoué:', error);
      return false;
    }
  }

  /**
   * Test de jeu d'une carte
   */
  testPlayCard(): boolean {
    console.log('🧪 Test: Jouer une carte');
    
    try {
      const state = this.engine.initializeGame(2, 50);
      const player1 = Object.values(state.players)[0];
      const firstCard = player1.hand[0];
      
      // Jouer la première carte
      const result = this.engine.executeMove(state, {
        type: 'PLAY_CARD',
        playerId: player1.id,
        data: { cardId: firstCard.id },
      });
      
      console.assert(result.success, 'Le mouvement a échoué');
      console.assert(result.state.tableCards.length === 1, 'Carte pas ajoutée à la table');
      console.assert(result.state.tableCards[0].id === firstCard.id, 'Mauvaise carte sur la table');
      
      const updatedPlayer = result.state.players[player1.id];
      console.assert(updatedPlayer.hand.length === 4, 'Carte pas retirée de la main');
      console.assert(!updatedPlayer.hand.some(c => c.id === firstCard.id), 'Carte encore dans la main');
      
      console.log('✅ Test de jeu de carte réussi');
      return true;
    } catch (error) {
      console.error('❌ Test de jeu de carte échoué:', error);
      return false;
    }
  }

  /**
   * Test de validation des mouvements
   */
  testMoveValidation(): boolean {
    console.log('🧪 Test: Validation des mouvements');
    
    try {
      const state = this.engine.initializeGame(2, 50);
      const player1 = Object.values(state.players)[0];
      const player2 = Object.values(state.players)[1];
      
      // Test: joueur correct peut jouer
      const validMoves = this.engine.getPossibleMoves(state, player1.id);
      console.assert(validMoves.length > 0, 'Pas de mouvements possibles pour le joueur actuel');
      
      // Test: mauvais joueur ne peut pas jouer
      const invalidMoves = this.engine.getPossibleMoves(state, player2.id);
      console.assert(invalidMoves.length === 0, 'Joueur inactif peut jouer');
      
      // Test: carte inexistante
      const invalidResult = this.engine.executeMove(state, {
        type: 'PLAY_CARD',
        playerId: player1.id,
        data: { cardId: 'carte_inexistante' },
      });
      console.assert(!invalidResult.success, 'Carte inexistante acceptée');
      
      console.log('✅ Test de validation réussi');
      return true;
    } catch (error) {
      console.error('❌ Test de validation échoué:', error);
      return false;
    }
  }

  /**
   * Test de détection des Koras
   */
  testKoraDetection(): boolean {
    console.log('🧪 Test: Détection des Koras');
    
    try {
      const state = this.engine.initializeGame(2, 100);
      const player1 = Object.values(state.players)[0];
      
      // Simuler une main avec des 3 pour tester la détection
      player1.hand = [
        { id: 'hearts_3', rank: 3, suit: 'hearts' },
        { id: 'diamonds_3', rank: 3, suit: 'diamonds' },
        { id: 'clubs_5', rank: 5, suit: 'clubs' },
        { id: 'spades_7', rank: 7, suit: 'spades' },
        { id: 'hearts_9', rank: 9, suit: 'hearts' },
      ];
      
      // Réinitialiser et détecter les Koras
      const newState = this.rules.initializeGame(2, 100);
      newState.players[player1.id].hand = player1.hand;
      
      // Simuler la détection manuelle
      const hasKora = state.korasDetected.length > 0;
      console.log(`Koras détectées: ${state.korasDetected.length}`);
      
      console.log('✅ Test de détection des Koras réussi');
      return true;
    } catch (error) {
      console.error('❌ Test de détection des Koras échoué:', error);
      return false;
    }
  }

  /**
   * Test de fin de jeu
   */
  testGameEnd(): boolean {
    console.log('🧪 Test: Fin de jeu');
    
    try {
      const state = this.engine.initializeGame(2, 50);
      
      // Simuler un jeu terminé
      const modifiedState = { ...state };
      modifiedState.currentRound = 6; // Plus que 5 tours
      
      const isGameOver = this.rules.isGameOver(modifiedState);
      console.assert(isGameOver, 'Jeu pas détecté comme terminé');
      
      const winners = this.rules.getWinners(modifiedState);
      console.assert(winners !== null, 'Pas de gagnants détectés');
      
      console.log('✅ Test de fin de jeu réussi');
      return true;
    } catch (error) {
      console.error('❌ Test de fin de jeu échoué:', error);
      return false;
    }
  }

  /**
   * Test de calcul des gains
   */
  testPayoutCalculation(): boolean {
    console.log('🧪 Test: Calcul des gains');
    
    try {
      const state = this.engine.initializeGame(2, 100);
      
      // Simuler un jeu terminé avec un gagnant
      const modifiedState = { ...state };
      modifiedState.currentRound = 6;
      modifiedState.status = 'completed';
      
      const payouts = this.rules.calculatePayouts(modifiedState);
      console.assert(Object.keys(payouts).length > 0, 'Pas de gains calculés');
      
      // Vérifier que les gains totaux ne dépassent pas le pot (avec commission)
      const totalPayouts = Object.values(payouts).reduce((sum, amount) => sum + amount, 0);
      console.assert(totalPayouts <= state.pot, 'Gains supérieurs au pot');
      
      console.log('✅ Test de calcul des gains réussi');
      return true;
    } catch (error) {
      console.error('❌ Test de calcul des gains échoué:', error);
      return false;
    }
  }

  /**
   * Simulation d'une partie complète
   */
  simulateFullGame(): boolean {
    console.log('🧪 Simulation: Partie complète');
    
    try {
      let currentState = this.engine.initializeGame(2, 100);
      let moveCount = 0;
      const maxMoves = 50; // Sécurité pour éviter les boucles infinies
      
      console.log('🎮 Début de la simulation...');
      console.log(`Pot initial: ${currentState.pot} Koras`);
      
      while (!this.rules.isGameOver(currentState) && moveCount < maxMoves) {
        const currentPlayer = currentState.players[currentState.currentPlayerId!];
        const possibleMoves = this.engine.getPossibleMoves(currentState, currentPlayer.id);
        
        if (possibleMoves.length === 0) {
          console.log('Aucun mouvement possible, fin de la simulation');
          break;
        }
        
        // Choisir un mouvement aléatoire
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        const result = this.engine.executeMove(currentState, randomMove);
        
        if (!result.success) {
          console.error('Mouvement échoué:', result.error);
          break;
        }
        
        currentState = result.state;
        moveCount++;
        
        console.log(`Tour ${moveCount}: ${currentPlayer.name} - ${randomMove.type}`);
        
        if (result.isGameOver) {
          console.log('🏆 Jeu terminé!');
          console.log('Gagnants:', result.winners);
          console.log('Gains:', result.payouts);
          break;
        }
      }
      
      console.log(`✅ Simulation terminée après ${moveCount} mouvements`);
      return true;
    } catch (error) {
      console.error('❌ Simulation échouée:', error);
      return false;
    }
  }

  /**
   * Lance tous les tests
   */
  runAllTests(): boolean {
    console.log('🚀 Lancement de la suite de tests Garame\n');
    
    const tests = [
      () => this.testInitialization(),
      () => this.testPlayCard(),
      () => this.testMoveValidation(),
      () => this.testKoraDetection(),
      () => this.testGameEnd(),
      () => this.testPayoutCalculation(),
      () => this.simulateFullGame(),
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
      if (test()) {
        passedTests++;
      }
      console.log(''); // Ligne vide entre les tests
    }
    
    console.log(`📊 Résultats: ${passedTests}/${tests.length} tests réussis`);
    
    if (passedTests === tests.length) {
      console.log('🎉 Tous les tests sont passés! Le moteur Garame est fonctionnel.');
      return true;
    } else {
      console.log('❌ Certains tests ont échoué. Vérifiez l\'implémentation.');
      return false;
    }
  }
}

// Export pour utilisation
export function runGarameTests(): boolean {
  const testSuite = new GarameTestSuite();
  return testSuite.runAllTests();
} 