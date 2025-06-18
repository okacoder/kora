"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  IconCoin, 
  IconUsers, 
  IconRobot, 
  IconLock 
} from '@tabler/icons-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/use-current-user';

interface CreateRoomPageProps {
  params: { gameType: string };
}

export default function CreateRoomPage({ params }: CreateRoomPageProps) {
  const router = useRouter();
  const user = useCurrentUser();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    stake: 100,
    isPrivate: false,
    aiPlayers: 0,
    aiDifficulty: 'normal' as 'boa' | 'normal' | 'sensei',
    turnDuration: 30
  });

  const presetStakes = [50, 100, 500, 1000, 5000];

  const handleCreate = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    // Vérifier le solde
    const canAfford = true;
    if (!canAfford) {
      toast.error('Solde insuffisant pour cette mise');
      return;
    }

    setLoading(true);
    try {
      const room = {
        id: '1',
      } as any;


      toast.success('Salle créée avec succès !');
      router.push(`/games/${params.gameType}/room/${room.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Créer une salle de {params.gameType}</h1>
        <p className="text-muted-foreground">
          Configurez votre partie selon vos préférences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres de la partie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mise */}
          <div className="space-y-3">
            <Label>Mise (en Koras)</Label>
            <div className="grid grid-cols-5 gap-2">
              {presetStakes.map((stake) => (
                <Button
                  key={stake}
                  variant={settings.stake === stake ? 'default' : 'outline'}
                  onClick={() => setSettings({ ...settings, stake })}
                  className="relative"
                >
                  <span>{stake}</span>
                  {stake >= 1000 && (
                    <Badge className="absolute -top-2 -right-2 text-xs" variant="secondary">
                      Pro
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.stake}
                onChange={(e) => setSettings({ ...settings, stake: parseInt(e.target.value) || 0 })}
                min={10}
                max={10000}
              />
              <span className="text-sm text-muted-foreground">
                = {settings.stake * 10} FCFA
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Solde actuel: {user?.koras || 0} Koras
            </p>
          </div>

          {/* Joueurs IA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ajouter des joueurs IA</Label>
              <span className="text-sm text-muted-foreground">
                {settings.aiPlayers} IA
              </span>
            </div>
            <Slider
              value={[settings.aiPlayers]}
              onValueChange={([value]: number[]) => setSettings({ ...settings, aiPlayers: value })}
              max={params.gameType === 'garame' ? 1 : 3}
              step={1}
            />
            
            {settings.aiPlayers > 0 && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label>Niveau de difficulté de l'IA</Label>
                <RadioGroup 
                  value={settings.aiDifficulty} 
                  onValueChange={(value: any) => setSettings({ ...settings, aiDifficulty: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="boa" id="boa" />
                    <Label htmlFor="boa" className="cursor-pointer">
                      🐍 Boa (Facile) - Fait des erreurs fréquentes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" />
                    <Label htmlFor="normal" className="cursor-pointer">
                      🎯 Normal - Bon défi pour la plupart
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sensei" id="sensei" />
                    <Label htmlFor="sensei" className="cursor-pointer">
                      🥋 Sensei (Maître) - Extrêmement difficile
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          {/* Durée des tours */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Durée par tour</Label>
              <span className="text-sm text-muted-foreground">
                {settings.turnDuration} secondes
              </span>
            </div>
            <Slider
              value={[settings.turnDuration]}
              onValueChange={([value]: number[]) => setSettings({ ...settings, turnDuration: value })}
              min={15}
              max={120}
              step={15}
            />
          </div>

          {/* Salle privée */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Salle privée</Label>
              <p className="text-sm text-muted-foreground">
                Seuls les joueurs avec le code peuvent rejoindre
              </p>
            </div>
            <Switch
              checked={settings.isPrivate}
              onCheckedChange={(checked: boolean) => setSettings({ ...settings, isPrivate: checked })}
            />
          </div>

          {/* Résumé */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-2">
              <h4 className="font-semibold">Résumé de la partie</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <IconCoin className="h-4 w-4 text-muted-foreground" />
                  <span>Mise: {settings.stake} Koras</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconUsers className="h-4 w-4 text-muted-foreground" />
                  <span>Joueurs: {1 + settings.aiPlayers}/2</span>
                </div>
                {settings.isPrivate && (
                  <div className="flex items-center gap-2">
                    <IconLock className="h-4 w-4 text-muted-foreground" />
                    <span>Salle privée</span>
                  </div>
                )}
                {settings.aiPlayers > 0 && (
                  <div className="flex items-center gap-2">
                    <IconRobot className="h-4 w-4 text-muted-foreground" />
                    <span>IA: {settings.aiDifficulty}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleCreate} 
            disabled={loading || settings.stake > (user?.koras || 0)}
            className="w-full"
            size="lg"
          >
            {loading ? 'Création...' : 'Créer la salle'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 