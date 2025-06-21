"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Clock,
  Zap,
  Target
} from 'lucide-react';

export interface GameNotification {
  id: string;
  type: 'kora' | 'turn_win' | 'player_join' | 'player_leave' | 'game_start' | 'round_end' | 'special_move';
  title: string;
  message: string;
  playerName?: string;
  timestamp: Date;
  duration?: number; // en millisecondes
  priority?: 'low' | 'medium' | 'high';
}

interface GameNotificationsProps {
  notifications: GameNotification[];
  onNotificationExpire?: (id: string) => void;
}

export function GameNotifications({ notifications, onNotificationExpire }: GameNotificationsProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<GameNotification[]>([]);

  useEffect(() => {
    // Ajouter les nouvelles notifications
    const newNotifications = notifications.filter(
      n => !visibleNotifications.some(v => v.id === n.id)
    );
    
    if (newNotifications.length > 0) {
      setVisibleNotifications(prev => [...prev, ...newNotifications]);
      
      // Programmer l'expiration automatique
      newNotifications.forEach(notification => {
        const duration = notification.duration || 4000;
        setTimeout(() => {
          setVisibleNotifications(prev => prev.filter(n => n.id !== notification.id));
          onNotificationExpire?.(notification.id);
        }, duration);
      });
    }
  }, [notifications, visibleNotifications, onNotificationExpire]);

  const getNotificationIcon = (type: GameNotification['type']) => {
    switch (type) {
      case 'kora':
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 'turn_win':
        return <Target className="h-5 w-5 text-green-400" />;
      case 'player_join':
        return <Users className="h-5 w-5 text-blue-400" />;
      case 'player_leave':
        return <Users className="h-5 w-5 text-red-400" />;
      case 'game_start':
        return <Zap className="h-5 w-5 text-purple-400" />;
      case 'round_end':
        return <Clock className="h-5 w-5 text-orange-400" />;
      case 'special_move':
        return <Sparkles className="h-5 w-5 text-pink-400" />;
      default:
        return <TrendingUp className="h-5 w-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: GameNotification['type']) => {
    switch (type) {
      case 'kora':
        return 'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30';
      case 'turn_win':
        return 'from-green-500/20 to-green-600/20 border-green-400/30';
      case 'player_join':
        return 'from-blue-500/20 to-blue-600/20 border-blue-400/30';
      case 'player_leave':
        return 'from-red-500/20 to-red-600/20 border-red-400/30';
      case 'game_start':
        return 'from-purple-500/20 to-purple-600/20 border-purple-400/30';
      case 'round_end':
        return 'from-orange-500/20 to-orange-600/20 border-orange-400/30';
      case 'special_move':
        return 'from-pink-500/20 to-pink-600/20 border-pink-400/30';
      default:
        return 'from-gray-500/20 to-gray-600/20 border-gray-400/30';
    }
  };

  const getPriorityBadge = (priority: GameNotification['priority']) => {
    if (!priority || priority === 'low') return null;
    
    return (
      <Badge 
        variant={priority === 'high' ? 'destructive' : 'secondary'}
        className="text-xs px-1.5 py-0.5 h-5"
      >
        {priority === 'high' ? 'Important' : 'Info'}
      </Badge>
    );
  };

  return (
    <div className="fixed top-4 right-4 z-40 space-y-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                delay: index * 0.1
              }
            }}
            exit={{ 
              opacity: 0, 
              x: 300, 
              scale: 0.8,
              transition: {
                duration: 0.2
              }
            }}
            layout
          >
            <Card className={`
              bg-gradient-to-r backdrop-blur-sm border
              ${getNotificationColor(notification.type)}
              shadow-lg
            `}>
              <div className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {notification.title}
                      </h4>
                      {getPriorityBadge(notification.priority)}
                    </div>
                    
                    <p className="text-xs text-white/80 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    {notification.playerName && (
                      <p className="text-xs text-white/60 mt-1 font-medium">
                        {notification.playerName}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Barre de progression pour l'expiration */}
                <motion.div
                  className="h-0.5 bg-white/20 rounded-full mt-2 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div
                    className="h-full bg-white/60 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ 
                      duration: (notification.duration || 4000) / 1000,
                      ease: "linear"
                    }}
                  />
                </motion.div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook pour gérer les notifications de jeu
export function useGameNotifications() {
  const [notifications, setNotifications] = useState<GameNotification[]>([]);

  const addNotification = (notification: Omit<GameNotification, 'id' | 'timestamp'>) => {
    const newNotification: GameNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Notifications prédéfinies pour différents événements
  const notifyKora = (playerName: string, koraType: 'simple' | 'double' | 'triple') => {
    const koraNames = {
      simple: 'Kora Simple',
      double: 'Kora Double', 
      triple: 'Kora Triple'
    };
    
    addNotification({
      type: 'kora',
      title: `🎉 ${koraNames[koraType]} !`,
      message: `${playerName} a réalisé un ${koraNames[koraType]} !`,
      playerName,
      priority: 'high',
      duration: 6000
    });
  };

  const notifyTurnWin = (playerName: string, cardsWon: number) => {
    addNotification({
      type: 'turn_win',
      title: 'Pli remporté',
      message: `${playerName} remporte le pli avec ${cardsWon} carte${cardsWon > 1 ? 's' : ''}`,
      playerName,
      priority: 'medium',
      duration: 3000
    });
  };

  const notifyPlayerJoin = (playerName: string) => {
    addNotification({
      type: 'player_join',
      title: 'Nouveau joueur',
      message: `${playerName} a rejoint la partie`,
      playerName,
      priority: 'low',
      duration: 3000
    });
  };

  const notifyPlayerLeave = (playerName: string) => {
    addNotification({
      type: 'player_leave',
      title: 'Joueur parti',
      message: `${playerName} a quitté la partie`,
      playerName,
      priority: 'medium',
      duration: 4000
    });
  };

  const notifyGameStart = () => {
    addNotification({
      type: 'game_start',
      title: 'Partie commencée !',
      message: 'La partie de Garame commence maintenant',
      priority: 'high',
      duration: 4000
    });
  };

  const notifyRoundEnd = (roundNumber: number, totalRounds: number) => {
    addNotification({
      type: 'round_end',
      title: `Tour ${roundNumber} terminé`,
      message: `Tour ${roundNumber}/${totalRounds} terminé`,
      priority: 'low',
      duration: 2000
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    // Helpers
    notifyKora,
    notifyTurnWin,
    notifyPlayerJoin,
    notifyPlayerLeave,
    notifyGameStart,
    notifyRoundEnd,
  };
} 