"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayingCard } from './playing-card';
import { GameEndModal } from './game-end-modal';
import { GameNotifications, useGameNotifications } from './game-notifications';
import { GarameCard } from '@/lib/game-engine/games/garame/GarameState';

// Données de démonstration
const demoCards: GarameCard[] = [
  { id: '1', rank: 3, suit: 'hearts' },
  { id: '2', rank: 7, suit: 'spades' },
  { id: '3', rank: 10, suit: 'diamonds' },
  { id: '4', rank: 5, suit: 'clubs' },
  { id: '5', rank: 3, suit: 'spades' },
];

const demoTableCards: GarameCard[] = [
  { id: '6', rank: 8, suit: 'hearts' },
  { id: '7', rank: 4, suit: 'diamonds' },
];

const demoGameResult = {
  winner: {
    id: 'player1',
    name: 'Vous',
    isPlayer: true,
  },
  players: [
    {
      id: 'player1',
      name: 'Vous',
      cardsWon: 12,
      korasWon: 2,
      finalScore: 245,
      winnings: 850,
      isPlayer: true,
    },
    {
      id: 'ai1',
      name: 'IA Difficile',
      cardsWon: 8,
      korasWon: 0,
      finalScore: 180,
      winnings: -450,
      isPlayer: false,
    },
  ],
  gameStats: {
    totalRounds: 5,
    totalPot: 1000,
    commission: 10,
    duration: '8:42',
  },
};

export function DemoGameInterface() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [gamePhase, setGamePhase] = useState<'playing' | 'waiting' | 'ended'>('playing');
  
  const {
    notifications,
    notifyKora,
    notifyTurnWin,
    notifyPlayerJoin,
    notifyGameStart,
    removeNotification,
  } = useGameNotifications();

  const handleCardClick = (cardId: string) => {
    if (selectedCard === cardId) {
      // Simuler jouer la carte
      setSelectedCard(null);
      notifyTurnWin('Vous', 3);
      
      // Simuler fin de partie après 2 secondes
      setTimeout(() => {
        setGamePhase('ended');
        setShowEndModal(true);
      }, 2000);
    } else {
      setSelectedCard(cardId);
    }
  };

  const triggerDemoNotifications = () => {
    notifyGameStart();
    
    setTimeout(() => {
      notifyPlayerJoin('IA Difficile');
    }, 1000);
    
    setTimeout(() => {
      notifyKora('Vous', 'double');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* En-tête de démonstration */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            🎮 Démonstration Interface Garame
          </h1>
          <p className="text-white/70 mb-4">
            Interface de jeu complète avec animations et notifications en temps réel
          </p>
          <Button
            onClick={triggerDemoNotifications}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Déclencher notifications de démonstration
          </Button>
        </motion.div>

        {/* Interface de jeu simulée */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Zone de jeu principale */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Adversaire */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        IA
                      </div>
                      <div>
                        <p className="text-white font-medium">IA Difficile</p>
                        <p className="text-white/60 text-xs">Position 2</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cartes de l'adversaire (cachées) */}
                  <div className="flex gap-1 justify-center">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="w-12 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg flex items-center justify-center"
                      >
                        <div className="text-white text-xs font-bold opacity-50">K</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Zone centrale - Cartes jouées */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="text-center mb-4">
                <h3 className="text-white font-medium">Cartes jouées ce tour</h3>
                <p className="text-white/60 text-sm">Tour 3 sur 5</p>
              </div>
              
              <div className="flex justify-center gap-4 min-h-32">
                {demoTableCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <PlayingCard
                      card={card}
                      isPlayable={false}
                      size="md"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Ma main */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Votre main</h3>
                {selectedCard && (
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                    Carte sélectionnée
                  </div>
                )}
              </div>
              
              <div className="flex justify-center gap-2 mb-4">
                {demoCards.map((card) => (
                  <PlayingCard
                    key={card.id}
                    card={card}
                    isPlayable={gamePhase === 'playing'}
                    isSelected={selectedCard === card.id}
                    onClick={() => handleCardClick(card.id)}
                    size="lg"
                  />
                ))}
              </div>

              {/* Actions */}
              {gamePhase === 'playing' && (
                <div className="flex justify-center gap-3">
                  {selectedCard && (
                    <Button className="bg-green-600 hover:bg-green-700">
                      Jouer la carte
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                  >
                    Se coucher
                  </Button>
                </div>
              )}

              {gamePhase === 'waiting' && (
                <div className="text-center">
                  <div className="animate-pulse text-white/60">
                    En attente du tour de l'adversaire...
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            
            {/* Statistiques */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-white">
                  <div className="flex justify-between text-sm">
                    <span>Cartes gagnées:</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Koras gagnés:</span>
                    <span className="font-medium text-yellow-400">2</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Score actuel:</span>
                    <span className="font-medium text-green-400">185</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions de démonstration */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Démonstration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => setShowEndModal(true)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                  size="sm"
                >
                  Afficher résultats
                </Button>
                <Button
                  onClick={() => notifyKora('Vous', 'triple')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  Kora Triple !
                </Button>
                <Button
                  onClick={triggerDemoNotifications}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Composants overlay */}
        <GameNotifications 
          notifications={notifications}
          onNotificationExpire={removeNotification}
        />

        <GameEndModal
          isOpen={showEndModal}
          result={demoGameResult}
          onClose={() => {
            setShowEndModal(false);
            setGamePhase('playing');
            setSelectedCard(null);
          }}
        />
      </div>
    </div>
  );
} 