/**
 * Composant d'indicateur de statut WebSocket
 * Affiche l'état de la connexion en temps réel avec animations
 */

"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWebSocket, WebSocketStatus } from '@/hooks/use-websocket';
import { 
  IconWifi, 
  IconWifiOff, 
  IconLoader2, 
  IconAlertTriangle,
  IconRefresh
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface WebSocketStatusProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function WebSocketStatusIndicator({ 
  className, 
  showText = false, 
  size = 'md' 
}: WebSocketStatusProps) {
  const { status, isConnected, reconnect } = useWebSocket();

  const getStatusConfig = (status: WebSocketStatus) => {
    switch (status) {
      case 'connected':
        return {
          icon: IconWifi,
          color: 'bg-chart-4 text-white',
          text: 'Connecté',
          pulse: false
        };
      case 'connecting':
        return {
          icon: IconLoader2,
          color: 'bg-chart-5 text-white',
          text: 'Connexion...',
          pulse: true,
          spin: true
        };
      case 'reconnecting':
        return {
          icon: IconRefresh,
          color: 'bg-chart-5 text-white',
          text: 'Reconnexion...',
          pulse: true,
          spin: true
        };
      case 'disconnected':
        return {
          icon: IconWifiOff,
          color: 'bg-muted-foreground text-white',
          text: 'Déconnecté',
          pulse: false
        };
      case 'error':
        return {
          icon: IconAlertTriangle,
          color: 'bg-chart-1 text-white',
          text: 'Erreur',
          pulse: true
        };
      default:
        return {
          icon: IconWifiOff,
          color: 'bg-muted-foreground text-white',
          text: 'Inconnu',
          pulse: false
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const badgeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  if (!showText) {
    // Mode icône seule
    return (
      <motion.div
        className={cn("relative", className)}
        animate={config.pulse ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1, repeat: config.pulse ? Infinity : 0 }}
      >
        <div className={cn(
          "rounded-full p-2 flex items-center justify-center",
          config.color
        )}>
          <Icon 
            className={cn(
              sizeClasses[size],
              config.spin && "animate-spin"
            )} 
          />
        </div>
        
        {/* Indicateur de pulsation pour connexion active */}
        {isConnected && (
          <motion.div
            className="absolute -inset-1 rounded-full bg-chart-4/20 -z-10"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
    );
  }

  // Mode badge avec texte
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        className={cn(
          "flex items-center gap-2 border-0",
          badgeClasses[size],
          config.color
        )}
      >
        <motion.div
          animate={config.pulse ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: config.pulse ? Infinity : 0 }}
        >
          <Icon 
            className={cn(
              sizeClasses[size],
              config.spin && "animate-spin"
            )} 
          />
        </motion.div>
        {config.text}
      </Badge>
      
      {/* Bouton de reconnexion pour les états d'erreur */}
      {(status === 'error' || status === 'disconnected') && (
        <Button
          variant="outline"
          size="sm"
          onClick={reconnect}
          className="h-8 px-2"
        >
          <IconRefresh className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

interface ConnectionToastProps {
  status: WebSocketStatus;
  onReconnect?: () => void;
}

export function ConnectionStatusToast({ status, onReconnect }: ConnectionToastProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {status !== 'connected' && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border",
            "bg-card text-card-foreground border-border"
          )}>
            <Icon 
              className={cn(
                "h-5 w-5",
                config.spin && "animate-spin",
                status === 'error' && "text-chart-1",
                status === 'connecting' && "text-chart-5",
                status === 'reconnecting' && "text-chart-5",
                status === 'disconnected' && "text-muted-foreground"
              )} 
            />
            <span className="font-medium">{config.text}</span>
            
            {(status === 'error' || status === 'disconnected') && onReconnect && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReconnect}
                className="ml-2"
              >
                <IconRefresh className="h-3 w-3 mr-1" />
                Reconnecter
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook pour afficher automatiquement les toasts de connexion
export function useConnectionStatusToast() {
  const { status, reconnect } = useWebSocket();

  return (
    <ConnectionStatusToast 
      status={status} 
      onReconnect={reconnect}
    />
  );
}

function getStatusConfig(status: WebSocketStatus) {
  switch (status) {
    case 'connected':
      return {
        icon: IconWifi,
        color: 'bg-chart-4 text-white',
        text: 'Connexion établie',
        pulse: false
      };
    case 'connecting':
      return {
        icon: IconLoader2,
        color: 'bg-chart-5 text-white',
        text: 'Connexion en cours...',
        pulse: true,
        spin: true
      };
    case 'reconnecting':
      return {
        icon: IconRefresh,
        color: 'bg-chart-5 text-white',
        text: 'Reconnexion...',
        pulse: true,
        spin: true
      };
    case 'disconnected':
      return {
        icon: IconWifiOff,
        color: 'bg-muted-foreground text-white',
        text: 'Connexion perdue',
        pulse: false
      };
    case 'error':
      return {
        icon: IconAlertTriangle,
        color: 'bg-chart-1 text-white',
        text: 'Erreur de connexion',
        pulse: true
      };
    default:
      return {
        icon: IconWifiOff,
        color: 'bg-muted-foreground text-white',
        text: 'État inconnu',
        pulse: false
      };
  }
}