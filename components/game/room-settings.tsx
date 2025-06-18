import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface GameDefinition {
  minPlayers: number;
  maxPlayers: number;
  name: string;
  description: string;
}

interface RoomSettings {
  maxPlayers: number;
  turnDuration: number;
  allowSpectators: boolean;
  isPrivate: boolean;
  aiPlayersAllowed: boolean;
  stake: number;
}

interface RoomSettingsProps {
  game: GameDefinition;
  onCreateRoom: (settings: RoomSettings) => void;
}

export function RoomSettings({ game, onCreateRoom }: RoomSettingsProps) {
  const [settings, setSettings] = useState<RoomSettings>({
    maxPlayers: game.maxPlayers,
    turnDuration: 30,
    allowSpectators: false,
    isPrivate: false,
    aiPlayersAllowed: true,
    stake: 100
  });

  const handleSubmit = () => {
    onCreateRoom(settings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres de la partie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Number of players */}
        {game.minPlayers < game.maxPlayers && (
          <div className="space-y-2">
            <Label>Nombre de joueurs</Label>
            <Select
              value={settings.maxPlayers.toString()}
              onValueChange={(value) => setSettings({ ...settings, maxPlayers: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: game.maxPlayers - game.minPlayers + 1 },
                  (_, i) => game.minPlayers + i
                ).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} joueurs
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Stake */}
        <div className="space-y-2">
          <Label>Mise (koras)</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[settings.stake]}
              onValueChange={([value]) => setSettings({ ...settings, stake: value })}
              min={50}
              max={1000}
              step={50}
              className="flex-1"
            />
            <span className="w-16 text-right font-medium">{settings.stake}</span>
          </div>
        </div>

        {/* Turn duration */}
        <div className="space-y-2">
          <Label>Durée du tour (secondes)</Label>
          <Select
            value={settings.turnDuration.toString()}
            onValueChange={(value) => setSettings({ ...settings, turnDuration: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 secondes</SelectItem>
              <SelectItem value="30">30 secondes</SelectItem>
              <SelectItem value="45">45 secondes</SelectItem>
              <SelectItem value="60">60 secondes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AI players */}
        <div className="flex items-center justify-between">
          <Label htmlFor="ai-players">Autoriser les bots</Label>
          <Switch
            id="ai-players"
            checked={settings.aiPlayersAllowed}
            onCheckedChange={(checked) => setSettings({ ...settings, aiPlayersAllowed: checked })}
          />
        </div>

        {/* Private room */}
        <div className="flex items-center justify-between">
          <Label htmlFor="private-room">Partie privée</Label>
          <Switch
            id="private-room"
            checked={settings.isPrivate}
            onCheckedChange={(checked) => setSettings({ ...settings, isPrivate: checked })}
          />
        </div>

        <Button 
          onClick={handleSubmit}
          className="w-full"
          size="lg"
        >
          Créer la partie
        </Button>
      </CardContent>
    </Card>
  );
}