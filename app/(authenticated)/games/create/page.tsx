"use client";

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { 
  IconCoin, 
  IconUsers, 
  IconSettings,
  IconDeviceGamepad2} from '@tabler/icons-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentUser } from '@/hooks/use-current-user';
import { GameType } from '@prisma/client';
import { motion } from 'framer-motion';

import { getConfigGameById } from '@/lib/games';
import { routes } from '@/lib/routes';


export default function CreateRoomPage() {
  const searchParams = useSearchParams();
  const gameType = searchParams.get('gameType') as GameType || 'garame';
  const router = useRouter();
  const user = useCurrentUser();
  const config = getConfigGameById(gameType);
  const invitePlayerInputRef = useRef<HTMLInputElement>(null);

  if (!config) {
    return <div className="container mx-auto">
      <h1 className="text-2xl font-bold">Ce jeu n'est pas disponible</h1>
    </div>;
  }

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    betAmount: config.bettingConfig.minBet * 10, // Default bet
    maxPlayers: 4,
    isPrivate: false,
    turnDuration: config.turnConfig.defaultDuration,
    // Invitations will be handled separately
    invitedPlayers: [] as string[]
  });

  const handleInvitePlayer = (username: string) => {
    if (!settings.invitedPlayers.includes(username)) {
      setSettings({
        ...settings,
        invitedPlayers: [...settings.invitedPlayers, username]
      });
    }
  };

  const handleRemoveInvite = (username: string) => {
    setSettings({
      ...settings,
      invitedPlayers: settings.invitedPlayers.filter(u => u !== username)
    });
  };

  const handleCreateRoom = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    // Vérifier le solde
    const userBalance = user.koras || 0;
    if (settings.betAmount > userBalance) {
      toast.error('Solde insuffisant pour cette mise');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual room creation
      const roomId = 'room_' + Date.now();
      
      toast.success('Salle créée avec succès !');
      router.push(routes.gameRoom(roomId));
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container'>
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
              <IconSettings className="size-5 text-primary" />
              Configuration de la partie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mise */}
            <div>
              <Label className="text-card-foreground">Mise par joueur (Koras)</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Slider
                  value={[settings.betAmount]}
                  onValueChange={([value]) => setSettings({ ...settings, betAmount: value })}
                  min={config.bettingConfig.minBet}
                  max={Math.min((user?.koras || 0) / 4, config.bettingConfig.maxBet)}
                  step={10}
                  className="flex-1"
                />
                <div className="flex items-center gap-1 min-w-[80px]">
                  <IconCoin className="w-4 h-4 text-chart-5" />
                  <span className="text-lg font-bold text-card-foreground">{settings.betAmount}</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{config.bettingConfig.minBet}</span>
                <span>Votre solde: {user?.koras || 0}</span>
              </div>
            </div>

            {/* Nombre de joueurs */}
            <div>
              <Label className="text-card-foreground">Nombre de joueurs</Label>
              <Select value={settings.maxPlayers.toString()} onValueChange={v => setSettings({ ...settings, maxPlayers: +v })}>
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

            {/* Durée par tour */}
            <div>
              <Label className="text-card-foreground">
                Durée par tour: {settings.turnDuration}s
              </Label>
              <Slider
                value={[settings.turnDuration]}
                onValueChange={([value]) => setSettings({ ...settings, turnDuration: value })}
                min={config.turnConfig.minDuration}
                max={config.turnConfig.maxDuration}
                step={15}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{config.turnConfig.minDuration}s</span>
                <span>{config.turnConfig.maxDuration}s</span>
              </div>
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
                checked={settings.isPrivate}
                onCheckedChange={(checked) => setSettings({ ...settings, isPrivate: checked })}
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
              <IconUsers className="size-5 text-secondary" />
              Inviter des joueurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Invitation par nom d'utilisateur */}
              <div>
                <Label className="text-card-foreground mb-2 block">
                  Inviter par nom d'utilisateur
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Pseudo..."
                    ref={invitePlayerInputRef}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        handleInvitePlayer(target.value);
                        target.value = '';
                      }
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => {
                    if (invitePlayerInputRef.current) {
                      handleInvitePlayer(invitePlayerInputRef.current.value);
                      invitePlayerInputRef.current.value = '';
                    }
                  }}>
                    Inviter
                  </Button>
                </div>
              </div>

              {/* Liste des joueurs invités */}
              {settings.invitedPlayers.length > 0 && (
                <div>
                  <Label className="text-card-foreground mb-2 block">
                    Joueurs invités ({settings.invitedPlayers.length}/{settings.maxPlayers - 1})
                  </Label>
                  <div className="space-y-2">
                    {settings.invitedPlayers.map((username) => (
                      <div key={username} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                        <span className="font-medium">{username}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInvite(username)}
                        >
                          Retirer
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résumé de la configuration */}
              <div className="mt-6 p-4 bg-secondary/10 rounded-lg">
                <h4 className="font-semibold text-card-foreground mb-3">Résumé de la partie</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jeu:</span>
                    <span className="text-card-foreground font-medium">{config.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mise/joueur:</span>
                    <span className="text-card-foreground font-medium flex items-center gap-1">
                      <IconCoin className="w-3 h-3 text-chart-5" />
                      {settings.betAmount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joueurs:</span>
                    <span className="text-card-foreground font-medium">{settings.maxPlayers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée/tour:</span>
                    <span className="text-card-foreground font-medium">{settings.turnDuration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission:</span>
                    <span className="text-card-foreground font-medium">{config.bettingConfig.commissionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total pot:</span>
                    <span className="text-card-foreground font-medium flex items-center gap-1">
                      <IconCoin className="w-3 h-3 text-chart-5" />
                      {settings.betAmount * settings.maxPlayers}
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
        disabled={loading || settings.betAmount > (user?.koras || 0)}
      >
        <IconDeviceGamepad2 className="size-5 mr-2" />
        {loading ? 'Création...' : 'Créer la salle'}
      </Button>
    </motion.div>
  </div>
  );
} 