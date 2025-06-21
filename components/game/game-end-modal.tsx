"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Coins, 
  TrendingUp, 
  Star, 
  Crown,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GameResult {
  winner: {
    id: string;
    name: string;
    isPlayer: boolean;
  };
  players: Array<{
    id: string;
    name: string;
    cardsWon: number;
    korasWon: number;
    finalScore: number;
    winnings: number;
    isPlayer: boolean;
  }>;
  gameStats: {
    totalRounds: number;
    totalPot: number;
    commission: number;
    duration: string;
  };
}

interface GameEndModalProps {
  isOpen: boolean;
  result: GameResult;
  onClose: () => void;
}

export function GameEndModal({ isOpen, result, onClose }: GameEndModalProps) {
  const router = useRouter();
  
  const playerResult = result.players.find(p => p.isPlayer);
  const isWinner = result.winner.isPlayer;

  const handlePlayAgain = () => {
    onClose();
    router.push('/games/lobby');
  };

  const handleBackToGames = () => {
    onClose();
    router.push('/games');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white overflow-hidden">
              
              {/* Header avec animation de victoire/défaite */}
              <CardHeader className="text-center pb-4 relative">
                {isWinner && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="text-yellow-400 opacity-20">
                      <Sparkles className="h-32 w-32" />
                    </div>
                  </motion.div>
                )}
                
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {isWinner ? (
                    <>
                      <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                      <CardTitle className="text-3xl font-bold text-yellow-400 mb-2">
                        🎉 Victoire ! 🎉
                      </CardTitle>
                      <p className="text-slate-300">
                        Félicitations ! Vous avez remporté cette partie de Garame !
                      </p>
                    </>
                  ) : (
                    <>
                      <Star className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                      <CardTitle className="text-3xl font-bold text-blue-400 mb-2">
                        Partie terminée
                      </CardTitle>
                      <p className="text-slate-300">
                        Bonne partie ! Le gagnant est <span className="font-medium text-yellow-400">{result.winner.name}</span>
                      </p>
                    </>
                  )}
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-6">
                
                {/* Résultats détaillés du joueur */}
                {playerResult && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="bg-slate-800/50 border-slate-600">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Crown className="h-5 w-5 text-yellow-400" />
                          Vos résultats
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-blue-400">{playerResult.cardsWon}</p>
                            <p className="text-xs text-slate-400">Cartes gagnées</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-400">{playerResult.korasWon}</p>
                            <p className="text-xs text-slate-400">Koras réalisés</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-400">{playerResult.finalScore}</p>
                            <p className="text-xs text-slate-400">Score final</p>
                          </div>
                          <div>
                            <p className={`text-2xl font-bold ${playerResult.winnings > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {playerResult.winnings > 0 ? '+' : ''}{playerResult.winnings}
                            </p>
                            <p className="text-xs text-slate-400">Koras {playerResult.winnings > 0 ? 'gagnés' : 'perdus'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                <Separator className="bg-slate-600" />

                {/* Classement final */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="font-semibold text-lg mb-3">Classement final</h3>
                  <div className="space-y-2">
                    {result.players
                      .sort((a, b) => b.finalScore - a.finalScore)
                      .map((player, index) => (
                        <motion.div
                          key={player.id}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            player.isPlayer ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-500 text-black' :
                              index === 1 ? 'bg-gray-400 text-black' :
                              index === 2 ? 'bg-amber-600 text-black' :
                              'bg-slate-600 text-white'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{player.name}</p>
                              <p className="text-xs text-slate-400">
                                {player.cardsWon} cartes • {player.korasWon} koras
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{player.finalScore}</p>
                            <p className={`text-sm ${player.winnings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {player.winnings > 0 ? '+' : ''}{player.winnings} Koras
                            </p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>

                {/* Statistiques de la partie */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Card className="bg-slate-800/30 border-slate-600">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Statistiques de la partie
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                        <div>
                          <p className="font-bold text-slate-300">{result.gameStats.totalRounds}</p>
                          <p className="text-slate-500">Tours joués</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-300 flex items-center justify-center gap-1">
                            <Coins className="h-3 w-3" />
                            {result.gameStats.totalPot}
                          </p>
                          <p className="text-slate-500">Pot total</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-300">{result.gameStats.commission}%</p>
                          <p className="text-slate-500">Commission</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-300">{result.gameStats.duration}</p>
                          <p className="text-slate-500">Durée</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex gap-3 pt-4"
                >
                  <Button
                    onClick={handlePlayAgain}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Rejouer
                  </Button>
                  <Button
                    onClick={handleBackToGames}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Retour aux jeux
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 