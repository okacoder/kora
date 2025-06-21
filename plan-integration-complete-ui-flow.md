# Plan complet d'intégration UI/UX - Respectant la charte graphique existante

## 🎨 Respect de la charte graphique existante

### Palette de couleurs utilisée (inspirée cartes de jeu)
- **Rouge des cartes** : `oklch(0.52 0.18 25)` (#B4443E) 
- **Marron doré** : `oklch(0.62 0.08 65)` (#A68258)
- **Fond crème/papier** (light) : `oklch(0.98 0.01 70)`
- **Fond velours bleu nuit** (dark) : `oklch(0.12 0.02 230)`
- **Style shadcn** : "new-york" avec base "neutral"

### Variables CSS déjà définies à utiliser
```css
/* Tailles cartes */
--game-card-width: 32px (sm) | 40px (md) | 60px (lg)
--game-card-height: 45px (sm) | 56px (md) | 84px (lg)

/* Animations */
--animation-fast: 150ms
--animation-normal: 300ms  
--animation-slow: 500ms

/* Z-index */
--z-modal: 400
--z-notification: 500
```

## 🎯 Architecture du Flow Utilisateur

### 1. Page principale des jeux (/games)
```
/games
├── Sélection du type de jeu (Garame, Belote, etc.)
├── Modes disponibles:
│   ├── 🤖 Partie rapide vs IA
│   ├── 👥 Créer une salle multijoueur 
│   └── 🎲 Rejoindre partie publique
└── Classement ELO global
```

### 2. Configuration partie rapide IA (/games/quick?gameType=garame)
```
/games/quick?gameType=garame
├── Sélection niveau IA: Facile/Moyen/Difficile
├── Configuration durée tour: 30s-2min
├── Règles du jeu personnalisées
└── Lancer partie → /games/play/[gameId]
```

### 3. Création salle multijoueur (/games/create?gameType=garame)
```
/games/create?gameType=garame
├── Configuration de la partie:
│   ├── Mise en Koras (minimum/maximum)
│   ├── Nombre de joueurs (2-5 selon le jeu)
│   ├── Durée par tour (30s-5min)
│   ├── Salle privée/publique
│   └── Règles personnalisées du jeu
├── Invitations:
│   ├── Par pseudo
│   ├── Lien de partage
│   └── Invitations automatiques (amis)
└── Créer → /games/room/[roomId]
```

### 4. Salle d'attente (/games/room/[roomId])
```
/games/room/[roomId]
├── Informations partie:
│   ├── Configuration visible
│   ├── Code de la salle
│   └── Compte à rebours si tous prêts
├── Gestion des joueurs:
│   ├── Liste joueurs + statuts (🟢 Connecté, 🟡 En attente, ⚫ Absent)
│   ├── Boutons inviter/désinviter (host only)
│   ├── Partage lien salle
│   └── Chat salle d'attente
├── Actions:
│   ├── Marquer "Prêt" ✅
│   ├── Quitter la salle ❌
│   └── Lancer partie (auto si tous prêts)
└── Redirection auto → /games/play/[gameId]
```

### 5. Partie en cours (/games/play/[gameId])
```
/games/play/[gameId]
├── Interface de jeu principale
├── Système de classement ELO en temps réel
├── Chat partie (optionnel)
├── Boutons: Abandonner/Pause/Règles
└── Fin de partie → Modal gains + ELO + retour
```

## 🎮 Système de configuration modulaire des jeux

### Structure de configuration par jeu

```typescript
// lib/game-engine/config/GameConfigs.ts
interface GameConfig {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  
  // Configuration des cartes
  cardConfig: {
    allowedRanks: string[];
    allowedSuits: string[];
    specialCards?: string[]; // Cartes spéciales exclues
    deckSize: number;
  };
  
  // Configuration des tours
  turnConfig: {
    minDuration: number; // en secondes
    maxDuration: number;
    defaultDuration: number;
    maxTurns?: number;
    cardsPerPlayer: number;
  };
  
  // Configuration des mises (si applicable)
  bettingConfig?: {
    minBet: number;
    maxBet: number;
    commissionRate: number; // %
    allowNoBet: boolean; // Pour IA
  };
  
  // Règles spécifiques
  rules: {
    canFold: boolean;
    mustFollowSuit: boolean;
    discardWhenCantFollow: boolean;
    autoWinConditions: AutoWinCondition[];
    specialVictories: SpecialVictory[];
  };
  
  // Configuration ELO
  eloConfig: {
    basePoints: number;
    winMultiplier: number;
    specialVictoryBonus: number;
    maxEloGain: number;
    maxEloLoss: number;
  };
}

// Configuration spécifique Garame
const garameConfig: GameConfig = {
  id: 'garame',
  name: 'Garame',
  description: 'Jeu traditionnel de cartes inspiré du jeu Garame',
  minPlayers: 2,
  maxPlayers: 5,
  
  cardConfig: {
    allowedRanks: ['3', '4', '5', '6', '7', '8', '9', '10'],
    allowedSuits: ['hearts', 'diamonds', 'clubs', 'spades'],
    specialCards: ['10♠'], // 10 de pique exclu
    deckSize: 19, // 20 cartes - 1 (10♠)
  },
  
  turnConfig: {
    minDuration: 30,
    maxDuration: 300, // 5 minutes
    defaultDuration: 60,
    maxTurns: 5,
    cardsPerPlayer: 5,
  },
  
  bettingConfig: {
    minBet: 10,
    maxBet: 10000,
    commissionRate: 10,
    allowNoBet: true, // Pour parties IA
  },
  
  rules: {
    canFold: false, // CORRECTION: Pas de fold dans Garame
    mustFollowSuit: true,
    discardWhenCantFollow: true, // Si pas la couleur, défausser n'importe quelle carte
    autoWinConditions: [
      { type: 'WEAK_HAND', condition: 'sum < 21' },
      { type: 'TRIPLE_SEVEN', condition: 'count(7) >= 3' }
    ],
    specialVictories: [
      { type: 'KORA_SIMPLE', condition: 'win_turn_5_with_3', multiplier: 2 },
      { type: 'KORA_DOUBLE', condition: 'win_turn_4_and_5_with_3', multiplier: 4 },
      { type: 'KORA_TRIPLE', condition: 'win_turn_3_4_5_with_3', multiplier: 8 }
    ]
  },
  
  eloConfig: {
    basePoints: 32,
    winMultiplier: 1.0,
    specialVictoryBonus: 50,
    maxEloGain: 150,
    maxEloLoss: 100,
  }
};
```

## 🏆 Système de classement ELO

### Calcul ELO adapté aux jeux de cartes

```typescript
// lib/ranking/EloSystem.ts
interface PlayerElo {
  userId: string;
  gameType: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  specialVictories: number;
  lastUpdated: Date;
}

interface EloResult {
  playerId: string;
  oldRating: number;
  newRating: number;
  change: number;
  reason: string;
}

class EloRankingSystem {
  private readonly K_FACTOR = 32; // Facteur de variabilité
  private readonly INITIAL_RATING = 1200;

  /**
   * Calcule les nouveaux ratings ELO après une partie
   */
  calculateNewRatings(
    players: PlayerElo[],
    results: GameResult,
    gameConfig: GameConfig
  ): EloResult[] {
    const winners = results.winners;
    const allResults: EloResult[] = [];

    for (const player of players) {
      const isWinner = winners.some(w => w.id === player.userId);
      const hasSpecialVictory = results.specialVictories?.some(sv => sv.playerId === player.userId);
      
      let ratingChange = this.calculateRatingChange(
        player,
        players.filter(p => p.userId !== player.userId),
        isWinner,
        gameConfig
      );

      // Bonus pour victoires spéciales
      if (hasSpecialVictory) {
        ratingChange += gameConfig.eloConfig.specialVictoryBonus;
      }

      // Limiter les gains/pertes
      ratingChange = Math.max(
        -gameConfig.eloConfig.maxEloLoss,
        Math.min(gameConfig.eloConfig.maxEloGain, ratingChange)
      );

      const newRating = Math.max(0, player.rating + ratingChange);

      allResults.push({
        playerId: player.userId,
        oldRating: player.rating,
        newRating,
        change: ratingChange,
        reason: this.getChangeReason(isWinner, hasSpecialVictory),
      });
    }

    return allResults;
  }

  private calculateRatingChange(
    player: PlayerElo,
    opponents: PlayerElo[],
    won: boolean,
    config: GameConfig
  ): number {
    const averageOpponentRating = 
      opponents.reduce((sum, opp) => sum + opp.rating, 0) / opponents.length;

    const expectedScore = 1 / (1 + Math.pow(10, (averageOpponentRating - player.rating) / 400));
    const actualScore = won ? 1 : 0;

    return Math.round(this.K_FACTOR * (actualScore - expectedScore));
  }

  private getChangeReason(won: boolean, special: boolean): string {
    if (special) return 'Victoire spéciale';
    return won ? 'Victoire' : 'Défaite';
  }

  /**
   * Obtient le rang textuel basé sur l'ELO
   */
  getRank(rating: number): string {
    if (rating < 800) return 'Bronze III';
    if (rating < 900) return 'Bronze II';
    if (rating < 1000) return 'Bronze I';
    if (rating < 1100) return 'Argent III';
    if (rating < 1200) return 'Argent II';
    if (rating < 1300) return 'Argent I';
    if (rating < 1400) return 'Or III';
    if (rating < 1500) return 'Or II';
    if (rating < 1600) return 'Or I';
    if (rating < 1700) return 'Platine III';
    if (rating < 1800) return 'Platine II';
    if (rating < 1900) return 'Platine I';
    if (rating < 2000) return 'Diamant III';
    if (rating < 2100) return 'Diamant II';
    if (rating < 2200) return 'Diamant I';
    if (rating < 2400) return 'Maître';
    return 'Grand Maître';
  }
}
```

## 🔧 Correction des règles Garame

### Règles corrigées dans le moteur

```typescript
// lib/game-engine/games/garame/GarameRulesFixed.ts
export class GarameRulesFixed extends GameRules<GarameState> {
  
  validateMove(state: GarameState, move: GameMove): ValidationResult {
    const player = this.getCurrentPlayer(state);
    const leadSuit = this.getLeadSuit(state);

    if (move.type === 'PLAY_CARD') {
      const card = this.findCardInHand(player, move.cardId);
      if (!card) {
        return { valid: false, reason: 'Carte non trouvée dans la main' };
      }

      // Si une couleur a été jouée ce tour
      if (leadSuit) {
        const hasMatchingSuit = player.hand.some(c => c.suit === leadSuit);
        
        if (hasMatchingSuit) {
          // DOIT jouer la couleur demandée
          if (card.suit !== leadSuit) {
            return { 
              valid: false, 
              reason: `Vous devez jouer ${this.getSuitName(leadSuit)}` 
            };
          }
        } else {
          // Peut jouer n'importe quelle carte (défausse)
          return { valid: true, reason: 'Défausse libre - pas de carte de la couleur demandée' };
        }
      }

      return { valid: true, reason: 'Coup valide' };
    }

    // PAS DE FOLD dans Garame
    if (move.type === 'FOLD') {
      return { valid: false, reason: 'Il est impossible de se coucher au Garame' };
    }

    return { valid: false, reason: 'Type de mouvement inconnu' };
  }

  applyMove(state: GarameState, move: GameMove): GarameState {
    const newState = this.cloneState(state);
    const player = this.getCurrentPlayer(newState);

    if (move.type === 'PLAY_CARD') {
      // Retirer la carte de la main
      const cardIndex = player.hand.findIndex(c => c.id === move.cardId);
      const playedCard = player.hand.splice(cardIndex, 1)[0];
      
      // Ajouter à la table
      newState.tableCards.push({
        card: playedCard,
        playerId: player.id,
        timestamp: Date.now()
      });

      // Mettre à jour le compteur de mouvements
      newState.moveCount++;
      
      // Enregistrer l'action
      newState.lastAction = {
        playerId: player.id,
        type: 'PLAY_CARD',
        cardId: move.cardId,
        timestamp: Date.now()
      };
    }

    // Passer au joueur suivant
    this.nextPlayer(newState);

    // Vérifier si le tour est terminé
    if (this.isTurnComplete(newState)) {
      this.resolveTurn(newState);
    }

    // Vérifier les conditions de victoire automatique après chaque coup
    this.checkAutoWinConditions(newState);

    return newState;
  }

  private checkAutoWinConditions(state: GarameState): void {
    for (const player of state.players) {
      // Main faible (somme < 21)
      const handSum = player.hand.reduce((sum, card) => sum + card.rank, 0);
      if (handSum < 21) {
        this.declareAutoWinner(state, player.id, 'WEAK_HAND');
        return;
      }

      // Triple 7
      const sevens = player.hand.filter(c => c.rank === 7);
      if (sevens.length >= 3) {
        this.declareAutoWinner(state, player.id, 'TRIPLE_SEVEN');
        return;
      }
    }
  }

  private resolveTurn(state: GarameState): void {
    const tableCards = state.tableCards;
    const leadSuit = tableCards[0].card.suit;
    
    // Trouver la carte gagnante (plus haute de la couleur demandée)
    const validCards = tableCards.filter(tc => tc.card.suit === leadSuit);
    const winningCard = validCards.reduce((highest, current) => 
      current.card.rank > highest.card.rank ? current : highest
    );

    const winner = state.players.find(p => p.id === winningCard.playerId)!;
    
    // Le gagnant remporte toutes les cartes du tour
    winner.cardsWon.push(...tableCards.map(tc => tc.card));
    
    // Vider la table
    state.tableCards = [];
    
    // Le gagnant commence le prochain tour
    state.currentPlayerIndex = state.players.findIndex(p => p.id === winner.id);
    state.currentTurn++;

    // Vérifier les Koras après chaque tour gagné avec un 3
    if (winningCard.card.rank === 3) {
      this.checkKoraVictories(state, winner.id, state.currentTurn - 1);
    }

    // Vérifier fin de partie (5 tours ou plus de cartes)
    if (state.currentTurn > 5 || state.players.every(p => p.hand.length === 0)) {
      this.endGame(state);
    }
  }

  private checkKoraVictories(state: GarameState, playerId: string, turnWon: number): void {
    const player = state.players.find(p => p.id === playerId)!;
    
    if (!player.koraHistory) {
      player.koraHistory = [];
    }
    
    player.koraHistory.push(turnWon);

    // Kora Triple (tours 3, 4, 5)
    if (player.koraHistory.includes(3) && 
        player.koraHistory.includes(4) && 
        player.koraHistory.includes(5)) {
      this.declareSpecialVictory(state, playerId, 'KORA_TRIPLE', 8);
      return;
    }

    // Kora Double (tours 4 et 5)
    if (player.koraHistory.includes(4) && player.koraHistory.includes(5)) {
      this.declareSpecialVictory(state, playerId, 'KORA_DOUBLE', 4);
      return;
    }

    // Kora Simple (tour 5)
    if (turnWon === 5) {
      this.declareSpecialVictory(state, playerId, 'KORA_SIMPLE', 2);
    }
  }
}
```

## 🃏 Amélioration du GameBoard existant avec animations

### Système d'animation des cartes (à ajouter au GameBoard)

```typescript
// components/game/enhanced-playing-card.tsx
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type CardState = 
  | 'hidden'      // État initial (dos visible)
  | 'dealing'     // Animation de distribution
  | 'in-hand'     // Dans la main du joueur
  | 'playable'    // Peut être jouée (surbrillance)
  | 'disabled'    // Ne peut pas être jouée (grisée)
  | 'selected'    // Sélectionnée par le joueur
  | 'playing'     // Animation de jeu vers la table
  | 'played'      // Jouée sur la table
  | 'winning'     // Carte gagnante (effet spécial)

interface EnhancedPlayingCardProps {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string | number;
  state: CardState;
  onClick?: () => void;
  position?: { x: number; y: number }; // Position absolue pour animations
  size?: 'sm' | 'md' | 'lg';
  delay?: number; // Délai pour animations en séquence
}

export function EnhancedPlayingCard({
  suit,
  rank,
  state,
  onClick,
  position,
  size = 'md',
  delay = 0
}: EnhancedPlayingCardProps) {
  
  // Animations selon l'état
  const getAnimationVariants = () => ({
    hidden: {
      scale: 0,
      rotateY: 180,
      opacity: 0
    },
    dealing: {
      scale: 1,
      rotateY: 180,
      opacity: 1,
      transition: {
        delay,
        duration: 0.3,
        ease: "easeOut"
      }
    },
    'in-hand': {
      scale: 1,
      rotateY: 0,
      opacity: 1,
      transition: {
        delay: delay + 0.2,
        duration: 0.4,
        ease: "easeInOut"
      }
    },
    playable: {
      scale: 1.05,
      y: -8,
      boxShadow: "0 10px 25px rgba(180, 68, 62, 0.3)",
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    disabled: {
      scale: 1,
      opacity: 0.4,
      filter: "grayscale(1)"
    },
    selected: {
      scale: 1.1,
      y: -16,
      rotate: state === 'selected' ? 2 : 0,
      boxShadow: "0 15px 35px rgba(180, 68, 62, 0.4)",
      borderColor: "var(--primary)",
      borderWidth: "2px"
    },
    playing: {
      scale: 0.9,
      x: position?.x || 0,
      y: position?.y || 0,
      rotate: Math.random() * 20 - 10, // Rotation aléatoire
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    },
    played: {
      scale: 0.9,
      rotate: Math.random() * 20 - 10
    },
    winning: {
      scale: 1.1,
      boxShadow: "0 0 30px var(--chart-5)",
      borderColor: "var(--chart-5)",
      borderWidth: "3px",
      transition: {
        duration: 0.3,
        repeat: 3,
        repeatType: "reverse"
      }
    }
  });

  const cardSizeClasses = {
    sm: "w-8 h-12",  // Utilise les variables CSS existantes
    md: "w-10 h-14",
    lg: "w-16 h-24"
  };

  return (
    <motion.div
      className={cn(
        "relative cursor-pointer select-none",
        cardSizeClasses[size],
        {
          "cursor-not-allowed": state === 'disabled',
          "cursor-pointer": state === 'playable' || state === 'in-hand',
        }
      )}
      variants={getAnimationVariants()}
      initial="hidden"
      animate={state}
      whileHover={state === 'playable' ? "playable" : undefined}
      whileTap={state === 'playable' ? { scale: 0.95 } : undefined}
      onClick={state === 'playable' || state === 'in-hand' ? onClick : undefined}
    >
      <AnimatePresence mode="wait">
        {(state === 'hidden' || state === 'dealing') ? (
          <motion.div
            key="back"
            className="w-full h-full"
            initial={{ rotateY: 0 }}
            exit={{ rotateY: 90 }}
            transition={{ duration: 0.2 }}
          >
            <CardBack className="w-full h-full" />
          </motion.div>
        ) : (
          <motion.div
            key="front"
            className="w-full h-full"
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PlayingCard 
              suit={suit} 
              rank={rank} 
              className={cn(
                "w-full h-full border-2 border-border",
                "bg-card shadow-sm rounded-lg",
                // Effets selon l'état
                state === 'playable' && "ring-2 ring-primary/20",
                state === 'selected' && "ring-2 ring-primary",
                state === 'disabled' && "opacity-50 grayscale",
                state === 'winning' && "ring-4 ring-chart-5 ring-opacity-60"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicateur spécial pour cartes de 3 (Koras) */}
      {rank === 3 && state !== 'hidden' && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-chart-5 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.5, type: "spring" }}
        >
          <span className="text-xs font-bold text-white">★</span>
        </motion.div>
      )}
    </motion.div>
  );
}
```

### GameBoard amélioré avec animations

```typescript
// components/game/enhanced-game-board.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EnhancedPlayingCard } from "./enhanced-playing-card";
import { cn } from "@/lib/utils";

export function EnhancedGameBoard({ 
  gameState, 
  currentPlayerId, 
  onCardPlay,
  className 
}) {
  const [animationPhase, setAnimationPhase] = useState<'dealing' | 'playing' | 'complete'>('dealing');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Séquence d'animation de distribution
  useEffect(() => {
    if (gameState.phase === 'dealing') {
      setAnimationPhase('dealing');
      
      // Délai pour chaque carte distribuée
      const totalCards = gameState.players.size * 5;
      const dealingTime = totalCards * 200; // 200ms par carte
      
      setTimeout(() => {
        setAnimationPhase('playing');
      }, dealingTime);
    }
  }, [gameState.phase]);

  const handleCardClick = (cardId: string) => {
    if (selectedCard === cardId) {
      // Jouer la carte sélectionnée
      onCardPlay(cardId);
      setSelectedCard(null);
    } else {
      // Sélectionner la carte
      setSelectedCard(cardId);
    }
  };

  const getCardState = (card: any, isMyCard: boolean): CardState => {
    if (animationPhase === 'dealing') {
      return card.dealt ? 'dealing' : 'hidden';
    }

    if (!isMyCard) return 'in-hand';

    if (selectedCard === card.id) return 'selected';
    
    if (gameState.isMyTurn && gameState.playableCards.includes(card.id)) {
      return 'playable';
    }
    
    if (gameState.isMyTurn) return 'disabled';
    
    return 'in-hand';
  };

  return (
    <div className={cn(
      "relative w-full h-screen bg-background",
      "overflow-hidden", // Pour les animations qui sortent du cadre
      className
    )}>
      
      {/* Zone centrale - Cartes jouées */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div 
          className="relative w-64 h-40 rounded-xl border-2 border-dashed border-muted-foreground/30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <AnimatePresence>
            {gameState.tableCards.map((tableCard, index) => (
              <motion.div
                key={tableCard.id}
                className="absolute"
                style={{
                  left: `${20 + index * 15}%`,
                  top: `${20 + index * 10}%`,
                }}
                initial={{ x: tableCard.fromPosition?.x || 0, y: tableCard.fromPosition?.y || 0 }}
                animate={{ x: 0, y: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <EnhancedPlayingCard
                  suit={tableCard.suit}
                  rank={tableCard.rank}
                  state={tableCard.isWinning ? 'winning' : 'played'}
                  size="md"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Positionnement des joueurs */}
      {Array.from(gameState.players.entries()).map(([playerId, player], index) => {
        const isMe = playerId === currentPlayerId;
        const position = getPlayerPositions(gameState.players.size)[index];
        
        return (
          <motion.div
            key={playerId}
            className="absolute"
            style={position}
            initial={{ opacity: 0, y: isMe ? 50 : -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {/* Avatar et info joueur */}
            <div className={cn(
              "flex flex-col items-center mb-4",
              !isMe && "mb-0 mt-4"
            )}>
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-primary">
                  <AvatarImage src={player.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {player.name[0]}
                  </AvatarFallback>
                </Avatar>
                
                {/* Indicateur de tour */}
                {gameState.currentPlayerId === playerId && (
                  <motion.div
                    className="absolute -inset-1 rounded-full bg-primary/20"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
              
              <span className="text-sm font-medium mt-1">{player.name}</span>
              
              {/* Statistiques */}
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Cartes: {player.hand.length}</span>
                {player.korasWon > 0 && (
                  <Badge variant="secondary" className="px-1 py-0">
                    Kora: {player.korasWon}
                  </Badge>
                )}
              </div>
            </div>

            {/* Main du joueur */}
            <div className={cn(
              "flex gap-1",
              isMe ? "justify-center" : "justify-center"
            )}>
              {player.hand.map((card, cardIndex) => (
                <EnhancedPlayingCard
                  key={card.id}
                  suit={card.suit}
                  rank={card.rank}
                  state={getCardState(card, isMe)}
                  onClick={isMe ? () => handleCardClick(card.id) : undefined}
                  size={isMe ? "md" : "sm"}
                  delay={cardIndex * 0.1} // Distribution échelonnée
                />
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Overlay d'informations */}
      <motion.div
        className="absolute top-4 left-4 right-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <div className="flex justify-between items-center">
          <div className="bg-card/80 backdrop-blur-sm rounded-lg p-3 border border-border">
            <div className="text-sm text-muted-foreground">Tour {gameState.currentRound}/5</div>
            <div className="font-semibold">
              {gameState.phase === 'dealing' && "Distribution..."}
              {gameState.phase === 'playing' && `Tour de ${gameState.currentPlayerName}`}
              {gameState.phase === 'ended' && "Partie terminée"}
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-lg p-3 border border-border">
            <div className="text-sm text-muted-foreground">Pot</div>
            <div className="font-semibold flex items-center gap-1">
              <IconCoin className="w-4 h-4 text-chart-5" />
              {gameState.pot} Koras
            </div>
          </div>
        </div>
      </motion.div>

      {/* Messages d'action */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
              Appuyez à nouveau pour jouer cette carte
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

## 📱 Composants UI intégrés (respectant la charte)

### 1. Page sélection de jeu (/games)

```typescript
// app/games/page.tsx
export default function GamesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Texture subtile déjà définie dans globals.css */}
      
      <div className="container mx-auto px-4 py-8 safe-top">
        <motion.h1 
          className="text-4xl font-bold text-center mb-8 text-foreground"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Choisissez votre jeu
        </motion.h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Garame - utilise les couleurs de la charte */}
          <motion.div
            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded mb-4 flex items-center justify-center">
              <div className="flex gap-2">
                <PlayingCard suit="hearts" rank="3" className="w-8 h-12" />
                <PlayingCard suit="spades" rank="7" className="w-8 h-12" />
                <PlayingCard suit="diamonds" rank="K" className="w-8 h-12" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">Garame</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Jeu traditionnel de stratégie et chance
            </p>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => router.push('/games/quick?gameType=garame')}
                variant="default"
                size="sm"
                className="flex-1"
              >
                🤖 VS IA
              </Button>
              <Button
                onClick={() => router.push('/games/create?gameType=garame')}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                👥 Multijoueur
              </Button>
            </div>
          </motion.div>
          
          {/* Futurs jeux - style cohérent */}
          <div className="bg-muted/50 border border-border rounded-lg p-6 opacity-60">
            <div className="w-full h-32 bg-muted rounded mb-4 flex items-center justify-center">
              <span className="text-muted-foreground">Bientôt disponible</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-muted-foreground">Belote</h3>
            <p className="text-muted-foreground text-sm mb-4">À venir...</p>
          </div>
        </div>

        {/* Classement global - utilise chart colors */}
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-6 text-foreground">🏆 Classement Global</h2>
          <EloLeaderboard />
        </motion.div>
      </div>
    </div>
  );
}
```

### 2. Configuration partie rapide (/games/quick)

```typescript
// app/games/quick/page.tsx
export default function QuickGamePage() {
  const [aiLevel, setAiLevel] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [turnDuration, setTurnDuration] = useState(60);
  const gameType = searchParams.get('gameType') || 'garame';
  const config = getGameConfig(gameType);

  return (
    <div className="min-h-screen bg-background safe-top">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
            Partie rapide - {config.name}
          </h1>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              {/* Niveau IA - utilise les couleurs de la charte */}
              <div className="mb-6">
                <Label className="text-base font-semibold text-card-foreground">
                  Niveau de l'IA
                </Label>
                <RadioGroup value={aiLevel} onValueChange={setAiLevel} className="mt-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="EASY" id="easy" />
                    <Label htmlFor="easy" className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-chart-4"></div>
                      Facile
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="MEDIUM" id="medium" />
                    <Label htmlFor="medium" className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-chart-5"></div>
                      Moyen
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="HARD" id="hard" />
                    <Label htmlFor="hard" className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      Difficile
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Durée du tour */}
              <div className="mb-6">
                <Label className="text-base font-semibold text-card-foreground">
                  Durée par tour: {turnDuration}s
                </Label>
                <Slider
                  value={[turnDuration]}
                  onValueChange={([value]) => setTurnDuration(value)}
                  min={config.turnConfig.minDuration}
                  max={config.turnConfig.maxDuration}
                  step={15}
                  className="mt-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{config.turnConfig.minDuration}s</span>
                  <span>{config.turnConfig.maxDuration}s</span>
                </div>
              </div>

              {/* Preview des cartes */}
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <Label className="text-sm font-medium text-card-foreground mb-2 block">
                  Aperçu du jeu
                </Label>
                <div className="flex justify-center gap-1">
                  <PlayingCard suit="hearts" rank="3" className="w-6 h-9" />
                  <PlayingCard suit="clubs" rank="7" className="w-6 h-9" />
                  <PlayingCard suit="diamonds" rank="10" className="w-6 h-9" />
                  <CardBack className="w-6 h-9" />
                  <CardBack className="w-6 h-9" />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  19 cartes • 5 par joueur • Victoires Kora possibles
                </p>
              </div>

              <Button 
                onClick={handleStartQuickGame}
                className="w-full mt-6 bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Lancer la partie
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
```

### 3. Création de salle (/games/create) - Style cohérent

```typescript
// app/games/create/page.tsx
export default function CreateRoomPage() {
  const [betAmount, setBetAmount] = useState(100);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);

  return (
    <div className="min-h-screen bg-background safe-top">
      <div className="container mx-auto px-4 py-8">
        <motion.h1 
          className="text-3xl font-bold mb-8 text-center text-foreground"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Créer une salle - {config.name}
        </motion.h1>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Configuration - utilise la palette existante */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Settings className="w-5 h-5 text-primary" />
                  Configuration de la partie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mise */}
                <div>
                  <Label className="text-card-foreground">Mise par joueur (Koras)</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <Slider
                      value={[betAmount]}
                      onValueChange={([value]) => setBetAmount(value)}
                      min={config.bettingConfig.minBet}
                      max={Math.min(userWallet.balance / 4, config.bettingConfig.maxBet)}
                      step={10}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1 min-w-[80px]">
                      <IconCoin className="w-4 h-4 text-chart-5" />
                      <span className="text-lg font-bold text-card-foreground">{betAmount}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{config.bettingConfig.minBet}</span>
                    <span>Votre solde: {userWallet.balance}</span>
                  </div>
                </div>

                {/* Nombre de joueurs */}
                <div>
                  <Label className="text-card-foreground">Nombre de joueurs</Label>
                  <Select value={maxPlayers.toString()} onValueChange={v => setMaxPlayers(+v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: config.maxPlayers - config.minPlayers + 1 }, (_, i) => (
                        <SelectItem key={i} value={(config.minPlayers + i).toString()}>
                          {config.minPlayers + i} joueurs
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type de salle */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-card-foreground">Salle privée</Label>
                    <p className="text-xs text-muted-foreground">
                      Seuls les joueurs invités peuvent rejoindre
                    </p>
                  </div>
                  <Switch
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Invitations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Users className="w-5 h-5 text-secondary" />
                  Inviter des joueurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerInviteSystem
                  onInvite={handleInvitePlayer}
                  invitedPlayers={invitedPlayers}
                  maxPlayers={maxPlayers - 1}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div 
          className="flex justify-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={handleCreateRoom}
            size="lg"
            className="min-w-[200px] bg-primary hover:bg-primary/90"
          >
            <Gamepad2 className="w-5 h-5 mr-2" />
            Créer la salle
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
```

### 4. Salle d'attente (/games/room/[roomId]) - Design velours

```typescript
// app/games/room/[roomId]/page.tsx
export default function GameRoomPage({ params }: { params: { roomId: string } }) {
  const { data: room } = trpc.room.get.useQuery({ roomId: params.roomId });
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background safe-top">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Informations principales */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-card-foreground flex items-center gap-2">
                      <Gamepad2 className="w-6 h-6 text-primary" />
                      {room?.gameName}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      Salle #{room?.code} • {room?.betAmount} Koras par joueur
                    </p>
                  </div>
                  
                  {countdown && (
                    <motion.div
                      className="text-center bg-chart-4/10 rounded-lg p-3"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <div className="text-3xl font-bold text-chart-4">{countdown}</div>
                      <p className="text-xs text-muted-foreground">Lancement dans...</p>
                    </motion.div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Liste des joueurs */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-card-foreground">
                    Joueurs ({room?.players.length}/{room?.maxPlayers})
                  </h3>
                  
                  <div className="grid gap-3">
                    {room?.players.map((player, index) => (
                      <motion.div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10 border-2 border-primary">
                              <AvatarImage src={player.avatar} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {player.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            
                            {player.id === room.hostId && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-chart-5 rounded-full flex items-center justify-center">
                                <Crown className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="font-medium text-card-foreground">{player.name}</div>
                            <div className="text-xs text-muted-foreground">
                              ELO: {player.elo || 1200}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Statut joueur */}
                          <div className="flex items-center gap-1">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              player.status === 'ready' && "bg-chart-4",
                              player.status === 'waiting' && "bg-chart-5", 
                              player.status === 'offline' && "bg-muted-foreground"
                            )} />
                            <span className="text-xs text-muted-foreground">
                              {player.status === 'ready' && "Prêt"}
                              {player.status === 'waiting' && "En attente"}
                              {player.status === 'offline' && "Hors ligne"}
                            </span>
                          </div>
                          
                          {/* Actions host */}
                          {currentUser?.id === room.hostId && player.id !== room.hostId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleKickPlayer(player.id)}
                            >
                              <UserX className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Slots vides */}
                    {Array.from({ length: room?.maxPlayers - room?.players.length }).map((_, i) => (
                      <div 
                        key={i} 
                        className="flex items-center p-3 border-2 border-dashed border-muted-foreground/30 rounded-lg"
                      >
                        <User className="h-8 w-8 text-muted-foreground mr-3" />
                        <span className="text-muted-foreground">En attente d'un joueur...</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={() => setIsReady(!isReady)}
                    variant={isReady ? "default" : "outline"}
                    className="flex-1"
                  >
                    {isReady ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Prêt
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Pas prêt
                      </>
                    )}
                  </Button>
                  
                  <Button variant="destructive" onClick={handleLeaveRoom}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Quitter
                  </Button>
                  
                  {currentUser?.id === room?.hostId && (
                    <Button 
                      onClick={handleForceStart}
                      disabled={room?.players.length < room?.minPlayers}
                      className="bg-chart-4 hover:bg-chart-4/90"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Force start
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            {/* Invitations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-secondary" />
                    Inviter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={handleCopyRoomLink}
                      variant="outline"
                      className="w-full"
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Copier le lien
                    </Button>
                    
                    <InviteByUsername onInvite={handleInviteUser} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Configuration */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée/tour:</span>
                    <span className="text-card-foreground font-medium">{room?.turnDuration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tours max:</span>
                    <span className="text-card-foreground font-medium">{room?.maxTurns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission:</span>
                    <span className="text-card-foreground font-medium">{room?.commissionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total pot:</span>
                    <span className="text-card-foreground font-medium flex items-center gap-1">
                      <IconCoin className="w-3 h-3 text-chart-5" />
                      {(room?.betAmount || 0) * (room?.maxPlayers || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Chat salle */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <RoomChat roomId={params.roomId} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 🔄 Flow complet de transaction

### Pipeline de traitement des gains

```typescript
// lib/transactions/GameTransactionPipeline.ts
class GameTransactionPipeline {
  
  async processGameEnd(
    gameId: string,
    results: GameResult,
    eloChanges: EloResult[]
  ): Promise<TransactionResult> {
    
    return await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({
        where: { id: gameId },
        include: { players: { include: { user: true } } }
      });

      // 1. Calculer les gains bruts
      const totalPot = game.betAmount * game.players.length;
      const commission = Math.floor(totalPot * (game.commissionRate / 100));
      const netPot = totalPot - commission;

      // 2. Répartir selon le type de victoire
      const winnerGains = this.calculateWinnerGains(results, netPot);

      // 3. Mettre à jour les wallets
      for (const gain of winnerGains) {
        await tx.wallet.update({
          where: { userId: gain.playerId },
          data: { koraBalance: { increment: gain.amount } }
        });

        // Enregistrer la transaction
        await tx.transaction.create({
          data: {
            walletId: gain.walletId,
            gameId,
            type: 'WIN',
            amount: gain.amount,
            description: `Victoire ${results.victoryType} - ${game.gameName}`,
          }
        });
      }

      // 4. Enregistrer la commission
      await tx.transaction.create({
        data: {
          walletId: 'platform',
          gameId,
          type: 'COMMISSION',
          amount: commission,
          description: `Commission ${game.commissionRate}% - Partie ${gameId}`,
        }
      });

      // 5. Mettre à jour les ELO
      for (const eloChange of eloChanges) {
        await tx.userElo.upsert({
          where: {
            userId_gameType: {
              userId: eloChange.playerId,
              gameType: game.type
            }
          },
          create: {
            userId: eloChange.playerId,
            gameType: game.type,
            rating: eloChange.newRating,
            gamesPlayed: 1,
            wins: eloChange.change > 0 ? 1 : 0,
            losses: eloChange.change < 0 ? 1 : 0,
          },
          update: {
            rating: eloChange.newRating,
            gamesPlayed: { increment: 1 },
            wins: eloChange.change > 0 ? { increment: 1 } : undefined,
            losses: eloChange.change < 0 ? { increment: 1 } : undefined,
          }
        });
      }

      // 6. Mettre à jour le statut de la partie
      await tx.game.update({
        where: { id: gameId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
          finalResults: {
            winners: results.winners,
            totalPot,
            commission,
            winnerGains,
            eloChanges
          }
        }
      });

      return {
        success: true,
        totalPot,
        commission,
        winnerGains,
        eloChanges
      };
    });
  }

  private calculateWinnerGains(results: GameResult, netPot: number): WinnerGain[] {
    const gains: WinnerGain[] = [];
    const baseGainPerWinner = Math.floor(netPot / results.winners.length);

    for (const winner of results.winners) {
      let finalGain = baseGainPerWinner;

      // Bonus pour victoires spéciales
      const specialVictory = results.specialVictories?.find(sv => sv.playerId === winner.id);
      if (specialVictory) {
        finalGain *= specialVictory.multiplier;
      }

      gains.push({
        playerId: winner.id,
        amount: finalGain,
        reason: specialVictory ? `Victoire ${specialVictory.type}` : 'Victoire normale'
      });
    }

    return gains;
  }
}
```

## 🎨 Animations et transitions (cohérentes avec la charte)

### Système d'animation unifié

```typescript
// lib/animations/card-animations.ts
import { Variants } from "framer-motion";

// Utilise les variables CSS existantes pour les durées
export const cardAnimations: Variants = {
  // Distribution des cartes (effet papier qui tombe)
  dealing: {
    initial: { 
      scale: 0, 
      rotateY: 180, 
      y: -100,
      opacity: 0 
    },
    animate: {
      scale: 1,
      rotateY: 180,
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3, // var(--animation-normal)
        ease: [0.22, 1, 0.36, 1] // Courbe "easeOutCubic" pour effet naturel
      }
    }
  },

  // Révélation des cartes (flip authentique)
  revealing: {
    initial: { rotateY: 180 },
    animate: {
      rotateY: 0,
      transition: {
        duration: 0.4,
        ease: "easeInOut",
        delay: 0.2 // Délai après distribution
      }
    }
  },

  // Cartes jouables (respiration douce)
  playable: {
    y: -8,
    scale: 1.05,
    boxShadow: "0 10px 25px var(--primary)/30", // Utilise la couleur primaire
    transition: {
      duration: 0.15, // var(--animation-fast)
      ease: "easeOut"
    }
  },

  // Carte sélectionnée (elevation pronounced)
  selected: {
    y: -16,
    scale: 1.1,
    rotate: 2,
    boxShadow: "0 15px 35px var(--primary)/40",
    borderColor: "var(--primary)",
    borderWidth: "2px",
    transition: {
      duration: 0.15,
      ease: "easeOut"
    }
  },

  // Animation de jeu vers la table
  playing: {
    scale: 0.9,
    rotate: Math.random() * 20 - 10,
    transition: {
      duration: 0.6,
      ease: [0.32, 0, 0.67, 0] // Courbe pour mouvement naturel
    }
  },

  // Carte gagnante (pulsation dorée)
  winning: {
    scale: [1, 1.1, 1],
    boxShadow: [
      "0 0 0 var(--chart-5)/0",
      "0 0 30px var(--chart-5)/60",
      "0 0 0 var(--chart-5)/0"
    ],
    transition: {
      duration: 0.8,
      repeat: 2,
      ease: "easeInOut"
    }
  }
};

// Animations de page (transitions fluides)
export const pageAnimations: Variants = {
  initial: { 
    opacity: 0, 
    y: 20,
    filter: "blur(4px)" 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.3, // var(--animation-normal)
      ease: "easeOut",
      staggerChildren: 0.1 // Effet cascade
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    filter: "blur(4px)",
    transition: {
      duration: 0.15 // var(--animation-fast)
    }
  }
};
```

### Hook personnalisé pour les animations de cartes

```typescript
// hooks/use-card-animation.ts
import { useCallback, useState } from "react";
import { useGameStore } from "@/stores/gameStore";

export function useCardAnimation() {
  const { gameState, selectedCard } = useGameStore();
  const [animationPhase, setAnimationPhase] = useState<'dealing' | 'playing' | 'resolving'>('dealing');

  const getCardState = useCallback((card: any, isMyCard: boolean): CardState => {
    // Logique d'état basée sur le GameBoard existant mais améliorée
    if (gameState?.phase === 'dealing') {
      return card.dealt ? 'dealing' : 'hidden';
    }

    if (!isMyCard) {
      return card.faceUp ? 'in-hand' : 'hidden';
    }

    if (selectedCard === card.id) {
      return 'selected';
    }

    if (gameState?.isMyTurn && gameState?.playableCards?.includes(card.id)) {
      return 'playable';
    }

    if (gameState?.isMyTurn) {
      return 'disabled';
    }

    return 'in-hand';
  }, [gameState, selectedCard]);

  const playCardAnimation = useCallback(async (cardId: string, targetPosition: { x: number; y: number }) => {
    // Animation vers la table en utilisant Framer Motion
    return new Promise(resolve => {
      // Code d'animation vers la position cible
      setTimeout(resolve, 600); // Durée de l'animation
    });
  }, []);

  return {
    getCardState,
    playCardAnimation,
    animationPhase,
    setAnimationPhase
  };
}
```

## 🔄 Intégration avec le GameBoard existant

### Amélioration progressive du GameTable

```typescript
// components/game/enhanced-game-table.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useCardAnimation } from "@/hooks/use-card-animation";
import { EnhancedPlayingCard } from "./enhanced-playing-card";

// Étend le GameTable existant avec les animations
export function EnhancedGameTable({ 
  gameState, 
  currentPlayerId, 
  playerNames, 
  playerAvatars, 
  onCardClick, 
  className 
}: GameTableProps) {
  const { getCardState, playCardAnimation } = useCardAnimation();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Remplace la logique onClick du GameTable existant
  const handleCardClick = async (cardId: string) => {
    if (selectedCard === cardId) {
      // Jouer la carte avec animation
      const tableCenter = { x: 0, y: 0 }; // Position du centre de table
      await playCardAnimation(cardId, tableCenter);
      onCardClick?.(currentPlayerId, cardId);
      setSelectedCard(null);
    } else {
      setSelectedCard(cardId);
    }
  };

  // Utilise la même structure de positionnement que GameTable
  const positions = getPlayerPositions(gameState.players.size);

  return (
    <motion.div 
      className={cn("relative w-full h-full", className)}
      variants={pageAnimations}
      initial="initial"
      animate="animate"
    >
      {/* Zone centrale - hérite du style existant */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div 
          className="relative w-64 h-40 rounded-xl border-2 border-dashed border-border/30 bg-muted/10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          {/* Cartes sur la table avec animations */}
          <AnimatePresence>
            {gameState.tableCards?.map((tableCard, index) => (
              <motion.div
                key={tableCard.id}
                className="absolute"
                style={{
                  left: `${20 + index * 15}%`,
                  top: `${20 + index * 10}%`,
                }}
                initial={{ 
                  x: tableCard.fromPosition?.x || 0, 
                  y: tableCard.fromPosition?.y || 0,
                  scale: 1.1
                }}
                animate={{ 
                  x: 0, 
                  y: 0,
                  scale: 0.9,
                  rotate: Math.random() * 20 - 10
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <EnhancedPlayingCard
                  suit={tableCard.suit}
                  rank={tableCard.rank}
                  state={tableCard.isWinning ? 'winning' : 'played'}
                  size="md"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Joueurs - utilise la logique existante avec animations */}
      {Array.from(gameState.players.entries()).map(([playerId, player], index) => {
        const isMe = playerId === currentPlayerId;
        const position = positions[index];
        
        return (
          <motion.div
            key={playerId}
            className="absolute"
            style={position}
            initial={{ opacity: 0, y: isMe ? 50 : -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
          >
            {/* Info joueur - garde le style existant */}
            <div className={cn(
              "flex flex-col items-center mb-4",
              !isMe && "mb-0 mt-4"
            )}>
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-primary">
                  <AvatarImage src={playerAvatars?.get(playerId)} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(playerNames.get(playerId) || 'U')[0]}
                  </AvatarFallback>
                </Avatar>
                
                {/* Indicateur de tour animé */}
                {gameState.currentPlayerId === playerId && (
                  <motion.div
                    className="absolute -inset-1 rounded-full border-2 border-primary/60"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </div>
              
              <span className="text-sm font-medium mt-1 text-card-foreground">
                {playerNames.get(playerId) || 'Joueur'}
              </span>
              
              {/* Badges - utilise les couleurs de la charte */}
              <div className="flex gap-2 text-xs">
                <Badge variant="secondary" className="px-2 py-0">
                  {player.hand?.length || 0} cartes
                </Badge>
                {player.hasKora && (
                  <Badge className="px-2 py-0 bg-chart-5 text-white">
                    Kora!
                  </Badge>
                )}
              </div>
            </div>

            {/* Main du joueur avec animations */}
            <div className="flex gap-1 justify-center">
              {(player.hand || []).map((card, cardIndex) => (
                <EnhancedPlayingCard
                  key={card.id}
                  suit={card.suit}
                  rank={card.rank}
                  state={getCardState(card, isMe)}
                  onClick={isMe ? () => handleCardClick(card.id) : undefined}
                  size={isMe ? "md" : "sm"}
                  delay={cardIndex * 0.1}
                />
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Messages contextuels */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg border border-primary/20">
              <p className="text-sm font-medium">
                Appuyez à nouveau pour jouer cette carte
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

## 📋 Checklist d'intégration complète (charte respectée)

### Phase 1: Amélioration GameBoard existant ✅ **TERMINÉ**
- [x] **Animations des cartes**
  - [x] Créer EnhancedPlayingCard avec états animés
  - [x] Intégrer useCardAnimation hook
  - [x] Remplacer les cartes statiques du GameTable
  - [x] Tester toutes les animations (dealing, playable, selected, playing)
  - [x] Respecter les durées CSS existantes (--animation-*)

- [x] **Respect de la charte graphique**
  - [x] Utiliser uniquement les couleurs définies (primary, secondary, chart-*)
  - [x] Appliquer les variables CSS de taille de cartes
  - [x] Garder le style "velours/cartes anciennes"
  - [x] Vérifier cohérence light/dark mode

- [x] **Correction règles Garame**
  - [x] Supprimer option "fold" du jeu
  - [x] Corriger logique de validation des mouvements
  - [x] Mettre à jour interface utilisateur
  - [x] Ajouter message explicatif "Impossible de se coucher au Garame"

### Phase 2: Pages UI/UX cohérentes ✅ **TERMINÉ**
- [x] **Architecture des pages**
  - [x] /games - Sélection avec preview des cartes et animations Framer Motion
  - [x] /games/quick - Configuration IA avec palette cohérente et règles Garame
  - [x] /games/create - Formulaire avec style existant et système d'invitations
  - [x] /games/room/[roomId] - Salle d'attente avec animations et statuts temps réel
  - [x] Navigation intégrée dans sidebar avec icônes cohérentes

- [x] **Composants réutilisables**
  - [x] PlayerCard avec Avatar + statuts (couleurs charte)
  - [x] GameConfigPanel avec Sliders stylés
  - [x] InviteSystem avec design cohérent
  - [x] CountdownTimer avec animations full-screen
  - [x] Configuration modulaire par type de jeu

### Phase 3: Système ELO intégré ✅ **TERMINÉ**
- [x] **Calcul et affichage**
  - [x] EloRankingSystem complet avec 17 rangs (Bronze III → Grand Maître)
  - [x] Badges de rang utilisant chart-colors avec progression visuelle
  - [x] Animations de changement d'ELO avec indicateurs visuels
  - [x] Leaderboard avec design carte/velours et filtres avancés

- [x] **Intégration complète**
  - [x] Page dédiée /ranking avec classement complet
  - [x] Compact leaderboard intégré à la page /games
  - [x] Système de calcul ELO adapté pour parties multijoueur
  - [x] Bonus spéciaux pour victoires Kora (+50 ELO)
  - [x] Navigation intégrée avec lien vers classement
  - [x] Mock data système pour développement et tests

### Phase 4: WebSocket temps réel ✅ **TERMINÉ**
- [x] **Synchronisation état**
  - [x] Statuts joueurs temps réel (couleurs cohérentes)
  - [x] Système WebSocket central avec useWebSocket hook
  - [x] Hook spécialisé useGameRoom pour les salles de jeu
  - [x] Reconnexion automatique avec retry exponential backoff
  - [x] Indicateur de statut de connexion avec animations

- [x] **Chat temps réel**
  - [x] Composant RoomChat avec interface moderne
  - [x] Messages système (join, leave, ready) avec icônes
  - [x] Animations Framer Motion pour les nouveaux messages
  - [x] Auto-scroll et indicateurs de frappe
  - [x] Support pour avatars et timestamps

- [x] **Gestion des salles en temps réel**
  - [x] Synchronisation des joueurs (join/leave)
  - [x] Système ready/unready avec feedback visuel
  - [x] Countdown automatique de démarrage de partie
  - [x] Actions host (kick, start game) en temps réel
  - [x] Codes de salle et invitations

- [x] **Mock server pour développement**
  - [x] MockWebSocketServer simulant le comportement réel
  - [x] Mode mock activable via NEXT_PUBLIC_USE_MOCK
  - [x] Gestion complète des événements de salle
  - [x] Latence réseau simulée pour réalisme

- [x] **Notifications système**
  - [x] Toast avec design shadcn existant (Sonner intégré)
  - [x] Alertes avec couleurs de la charte
  - [x] Feedback visuel pour toutes les actions WebSocket

### Phase 5: Pipeline financier (Semaine 5)
- [ ] **Interface transactions**
  - [ ] Widgets Kora avec IconCoin + couleur chart-5
  - [ ] Animations de gains/pertes
  - [ ] Historique avec style cohérent
  - [ ] Modals de confirmation élégantes

### Phase 6: Tests et polish (Semaine 6)
- [ ] **Qualité visuelle**
  - [ ] Audit complet de cohérence graphique
  - [ ] Tests sur tous breakpoints (mobile-first)
  - [ ] Validation couleurs accessibility
  - [ ] Performance animations (60fps)

- [ ] **User Experience**
  - [ ] Tests flow complet avec vrais utilisateurs
  - [ ] Optimisation animations mobile
  - [ ] Feedback tactile et sonore
  - [ ] Documentation UX pour futurs jeux

## 🎨 Composants réutilisables (style unifié)

### Système de couleurs contextuelles

```typescript
// lib/game-colors.ts
export const gameColors = {
  // Couleurs principales (de la charte)
  primary: "var(--primary)",     // Rouge cartes #B4443E
  secondary: "var(--secondary)", // Marron #A68258
  
  // États de jeu
  playable: "var(--chart-4)",    // Vert pour actions possibles
  selected: "var(--primary)",    // Rouge pour sélection
  disabled: "var(--muted-foreground)", // Gris pour inactif
  winning: "var(--chart-5)",     // Orange/or pour victoire
  
  // Statuts joueurs
  online: "var(--chart-4)",      // Vert
  ready: "var(--chart-5)",       // Orange
  offline: "var(--muted-foreground)", // Gris
  
  // Rangs ELO
  bronze: "oklch(0.45 0.15 35)",   // Bronze
  silver: "oklch(0.75 0.05 220)",  // Argent
  gold: "var(--chart-5)",          // Or (utilise chart-5)
  diamond: "oklch(0.70 0.20 240)", // Diamant
  master: "var(--primary)"         // Rouge maître
} as const;
```

Ce plan d'intégration assure une parfaite cohérence avec votre charte graphique existante tout en ajoutant les animations manquantes au GameBoard et en créant un flow utilisateur complet et fluide ! 🎨✨

## 🎯 Livrables attendus

1. **Flow complet fonctionnel** de /games à distribution des gains
2. **Système ELO** intégré avec classements
3. **Configuration modulaire** pour futurs jeux
4. **Interface responsive** optimisée mobile-first
5. **Règles Garame corrigées** selon spécifications
6. **Pipeline financier** sécurisé et auditable
7. **Documentation** complète du flow utilisateur

Ce plan d'intégration assure une expérience utilisateur fluide et complète, avec toutes les features demandées intégrées de manière cohérente.