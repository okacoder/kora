"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Bot, Zap, Brain } from 'lucide-react';
import { EnhancedPlayingCard } from '@/components/game/enhanced-playing-card';
import { getConfigGameById } from '@/lib/games';
import { GameType } from '@prisma/client';


export default function QuickGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameType = searchParams.get('gameType') as GameType || 'garame';
  const config = getConfigGameById(gameType);

  if (!config) {
    return <div className="container mx-auto">
      <h1 className="text-2xl font-bold">Ce jeu n'est pas disponible</h1>
    </div>;
  }

  const [aiLevel, setAiLevel] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [turnDuration, setTurnDuration] = useState(config.turnConfig.defaultDuration);

  const handleStartQuickGame = async () => {
    // TODO: Implement game creation logic
    console.log('Starting quick game:', { gameType, aiLevel, turnDuration });
    
    // For now, navigate to a test game
    router.push('/games/test-ai');
  };

  return (
    <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
            Partie rapide - {config.name}
          </h1>
          
          <Card className="bg-card border-border">
            <CardContent>
              {/* Niveau IA - utilise les couleurs de la charte */}
              <div className="mb-6">
                <Label className="text-base font-semibold text-card-foreground">
                  Niveau de l'IA
                </Label>
                <RadioGroup 
                  value={aiLevel} 
                  onValueChange={(value) => setAiLevel(value as 'EASY' | 'MEDIUM' | 'HARD')} 
                  className="mt-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="EASY" id="easy" />
                    <Label htmlFor="easy" className="flex items-center gap-2 cursor-pointer">
                      <Bot className="w-4 h-4 text-chart-4" />
                      <span>Facile</span>
                      <Badge variant="secondary" className="bg-chart-4/20 text-chart-4">
                        Débutant
                      </Badge>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="MEDIUM" id="medium" />
                    <Label htmlFor="medium" className="flex items-center gap-2 cursor-pointer">
                      <Zap className="w-4 h-4 text-chart-5" />
                      <span>Moyen</span>
                      <Badge variant="secondary" className="bg-chart-5/20 text-chart-5">
                        Intermédiaire
                      </Badge>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="HARD" id="hard" />
                    <Label htmlFor="hard" className="flex items-center gap-2 cursor-pointer">
                      <Brain className="w-4 h-4 text-primary" />
                      <span>Difficile</span>
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        Expert
                      </Badge>
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

              {/* Preview des cartes et règles */}
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <Label className="text-sm font-medium text-card-foreground mb-2 block">
                  Aperçu du jeu
                </Label>
                <div className="flex justify-center gap-1 mb-3">
                  <EnhancedPlayingCard suit="hearts" rank="3" state="in-hand" size="sm" />
                  <EnhancedPlayingCard suit="clubs" rank="7" state="in-hand" size="sm" />
                  <EnhancedPlayingCard suit="diamonds" rank="10" state="in-hand" size="sm" />
                  <EnhancedPlayingCard state="hidden" size="sm" />
                  <EnhancedPlayingCard state="hidden" size="sm" />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• 19 cartes (3-10 sauf 10♠)</p>
                  <p>• 5 cartes par joueur</p>
                  <p>• Victoires Kora possibles avec les 3</p>
                  <p>• <strong>Impossible de se coucher</strong> au Garame</p>
                </div>
              </div>

              {/* Description de l'IA selon le niveau */}
              <div className="mb-6 p-3 bg-secondary/10 rounded-lg">
                <h4 className="text-sm font-medium text-card-foreground mb-2">
                  Comportement de l'IA - {aiLevel}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {aiLevel === 'EASY' && "L'IA joue des coups aléatoires mais valides. Parfait pour débuter."}
                  {aiLevel === 'MEDIUM' && "L'IA suit les couleurs et compte les cartes. Bon niveau de défi."}
                  {aiLevel === 'HARD' && "L'IA utilise des stratégies avancées et modélise les adversaires. Expert."}
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
  );
}