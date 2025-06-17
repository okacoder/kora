"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardBack } from "@/components/game-card";
import {
  IconCoin,
  IconUsers,
  IconPlus,
  IconCards,
  IconClock,
  IconAlertCircle,
  IconLoader2
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useGameEngine } from "@/lib/garame/hooks/use-game-engine";
import { useCurrentUser } from "@/hooks/use-current-user";
import { gameStore } from "@/lib/garame/core/game-store";
import { gameRegistry } from "@/lib/garame/core/game-registry";
import { GameRoom } from "@/lib/garame/core/types";
import { routes } from "@/lib/routes";
import GamePlayPage from "./_components/game-play";
import GameRoomPage from "./_components/game-room";

export default function GamePageContent() {
  const { gameLabel } = useParams<{ gameLabel: string }>();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const gameId = searchParams.get("gameId");
  
  if (gameId) {
    return <GamePlayPage gameLabel={gameLabel} gameId={gameId} />;
  }

  if (roomId) {
    return <GameRoomPage gameLabel={gameLabel} roomId={roomId} />;
  }

  return <GamePage gameLabel={gameLabel} />;
}





const predefinedStakes = [50, 100, 200, 500, 1000];

type GamePageProps = {
  gameLabel: string;
}

function GamePage({ gameLabel }: GamePageProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { createRoom, joinRoom, loading } = useGameEngine(gameLabel);
  const gameInfo = gameRegistry.get(gameLabel);

  const [selectedTab, setSelectedTab] = useState("join");
  const [selectedStake, setSelectedStake] = useState<string>("");
  const [customStake, setCustomStake] = useState("");
  const [availableGames, setAvailableGames] = useState<GameRoom[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  const userBalance = currentUser?.koras || 5000;

  // Load available games
  useEffect(() => {
    const loadAvailableGames = () => {
      gameStore.getAvailableRooms(gameLabel)
        .then(games => {
          setAvailableGames(games);
        })
        .catch(error => {
          console.error("Erreur lors du chargement des parties:", error);
        })
        .finally(() => {
          setLoadingGames(false);
        });
    };

    loadAvailableGames();
    const interval = setInterval(loadAvailableGames, 5000);
    return () => clearInterval(interval);
  }, [gameLabel]);

  const handleCreateGame = async () => {
    const stake = selectedStake === "custom" ?
      parseInt(customStake) :
      parseInt(selectedStake);

    if (!stake || stake < 50) {
      toast.error("La mise minimum est de 50 koras");
      return;
    }

    if (stake > userBalance) {
      toast.error("Solde insuffisant");
      return;
    }

    try {
      const gameRoom = await createRoom(stake);
      console.log("gameRoom", gameRoom);
      router.push(routes.gameRoom(gameLabel, gameRoom.id));
    } catch (error) {
      // toast is handled inside useGameEngine
    }
  };

  const handleJoinGame = async (roomId: string) => {
    try {
      const room = await joinRoom(roomId);
      router.push(routes.gameRoom(gameLabel, room.id));
    } catch (error) {
      // toast is handled inside useGameEngine
    }
  };
  
  if (!gameInfo) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
          <IconAlertCircle className="size-12 mb-4 text-destructive" />
          <h2 className="text-xl font-semibold">Jeu Introuvable</h2>
          <p className="mb-4">Le jeu "{gameLabel}" n'existe pas ou n'est pas enregistré.</p>
          <Button onClick={() => router.push(routes.games)} variant="outline">
            Retour à la liste des jeux
          </Button>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-full px-4 lg:px-6">
      {/* Header with title and balance - more compact */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">{gameInfo.name}</h1>
          <p className="text-sm text-muted-foreground">{gameInfo.description}</p>
        </div>
        
        {/* Balance display - inline and compact */}
        <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-2 border">
          <IconCoin className="size-5 text-primary" />
          <div className="flex flex-col">
            <p className="text-sm font-semibold">{userBalance.toLocaleString()} koras</p>
            <p className="text-xs text-muted-foreground">≈ {(userBalance * 10).toLocaleString()} FCFA</p>
          </div>
        </div>
      </div>

      {/* Tabs with content - optimized height */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2 mb-3">
          <TabsTrigger value="join">Rejoindre une partie</TabsTrigger>
          <TabsTrigger value="create">Créer une partie</TabsTrigger>
        </TabsList>

        {/* Join Tab - scrollable list */}
        <TabsContent value="join" className="flex-1 min-h-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="py-3">
              <CardTitle className="text-lg">Parties disponibles</CardTitle>
              <CardDescription className="text-sm">
                Choisissez une partie selon votre mise préférée
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loadingGames ? (
                <div className="flex items-center justify-center h-32">
                  <IconLoader2 className="animate-spin" />
                </div>
              ) : availableGames.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <IconCards className="size-8 mb-2" />
                  <p className="text-sm">Aucune partie disponible</p>
                  <p className="text-xs">Créez une nouvelle partie</p>
                </div>
              ) : (
                <div className="divide-y space-y-4">
                  {availableGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-3 bg-card rounded-lg shadow-sm border border-border hover:bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary/40 min-h-[64px]"
                      tabIndex={0}
                    >
                      {/* Game card preview - smaller */}
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          <CardBack width={32} height={45} className="shadow-sm" />
                          <CardBack width={32} height={45} className="shadow-sm" />
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[100px]">{game.creatorName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Mise: {game.stake} koras</span>
                            {game.createdAt && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <IconClock className="size-3 align-middle inline-block" />
                                  Il y a {Math.round((Date.now() - new Date(game.createdAt).getTime()) / 60000)} min
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs min-h-[28px] flex items-center">
                          <IconUsers className="size-3 mr-1 align-middle inline-block" />
                          {game.players.length}/{game.maxPlayers} joueurs
                        </Badge>
                        <Button 
                          size="sm"
                          onClick={() => handleJoinGame(game.id)}
                          disabled={loading}
                          className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          Rejoindre
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Tab - compact form */}
        <TabsContent value="create" className="flex-1 min-h-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="py-3">
              <CardTitle className="text-lg">Créer une partie</CardTitle>
              <CardDescription className="text-sm">
                Définissez votre mise et attendez un adversaire
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              {/* Predefined stakes - responsive grid */}
              <div>
                <Label className="text-sm mb-2 block">Mise rapide</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {predefinedStakes.map((stake) => (
                    <Button
                      key={stake}
                      variant={selectedStake === stake.toString() ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedStake(stake.toString());
                        setCustomStake("");
                      }}
                      disabled={stake > userBalance}
                      className="w-full"
                    >
                      {stake}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom stake - inline on desktop */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Label htmlFor="custom-stake" className="text-sm">Mise personnalisée</Label>
                  <Input
                    id="custom-stake"
                    type="number"
                    placeholder="Montant en koras"
                    value={customStake}
                    onChange={(e) => {
                      setCustomStake(e.target.value);
                      setSelectedStake("custom");
                    }}
                    min="50"
                    max={userBalance}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleCreateGame}
                    disabled={!selectedStake || loading}
                    className="w-full sm:w-auto"
                  >
                    {loading ? (
                      <IconLoader2 className="animate-spin mr-2 size-4" />
                    ) : (
                      <IconPlus className="mr-2 size-4" />
                    )}
                    Créer la partie
                  </Button>
                </div>
              </div>

              {/* Info alert - compact */}
              <div className="bg-muted/50 rounded-lg p-3 mt-auto">
                <div className="flex gap-2">
                  <IconAlertCircle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• La mise sera bloquée jusqu'à la fin de la partie</p>
                    <p>• Le gagnant remporte 90% de la mise totale</p>
                    <p>• 10% de commission pour la plateforme</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}