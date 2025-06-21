'use client';

import { useWebSocket } from '@/hooks/use-websocket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TestWebSocket() {
  const {
    status,
    isConnected,
    sendMessage,
    lastMessage,
    reconnect
  } = useWebSocket();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'reconnecting': return 'bg-orange-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connecté';
      case 'connecting': return 'Connexion...';
      case 'reconnecting': return 'Reconnexion...';
      case 'disconnected': return 'Déconnecté';
      default: return 'Inconnu';
    }
  };

  const handleTestMessage = () => {
    sendMessage('test', { message: 'Test message', timestamp: Date.now() });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔌 Test WebSocket
          <Badge className={getStatusColor(status)}>
            {getStatusText(status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut de connexion */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">État:</span> {status}
          </div>
          <div>
            <span className="font-medium">Connecté:</span> {isConnected ? 'Oui' : 'Non'}
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex gap-2">
          <Button 
            onClick={reconnect}
            disabled={isConnected}
            variant="outline"
            size="sm"
          >
            Reconnecter
          </Button>
          <Button 
            onClick={handleTestMessage}
            disabled={!isConnected}
            size="sm"
          >
            Test Message
          </Button>
        </div>

        {/* Dernier message */}
        {lastMessage && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm">
              <strong>Dernier message:</strong> {lastMessage.type}
            </p>
            <pre className="text-xs mt-1 overflow-auto">
              {JSON.stringify(lastMessage.payload, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}