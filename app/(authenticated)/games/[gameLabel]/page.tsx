"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameCard } from "@/components/game-card";
import { CurrencyDisplay } from "@/components/currency-display";
import { GameListItem } from "@/components/game-list-item";
import { QuickStakeSelector } from "@/components/quick-stake-selector";
import { 
  IconCoin, 
  IconUsers, 
  IconPlus,
  IconCards,
  IconClock,
  IconAlertCircle,
  IconLoader2,
  IconRefresh
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { IGameRoom } from "@/lib/garame/domain/interfaces";
import { useGarameServices } from "@/lib/garame/infrastructure/garame-provider";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const QUICK_STAKES = [50, 100, 200, 500, 1000];

export default function GamePage() {
  const router = useRouter();
  const { gameLabel } = useParams<{ gameLabel: string }>();
  const { gameService, paymentService } = useGarameServices();
  const [selectedTab, setSelectedTab] = useState("join");
  const [selectedStake, setSelectedStake] = useState<number | null>(null);
  const [customStake, setCustomStake] = useState("");
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userKoras, setUserKoras] = useState<number>(0);
  const [availableGames, setAvailableGames] = useState<IGameRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGames, setLoadingGames] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load user balance
  useEffect(() => {
    const loadUserBalance = async () => {
      try {
        const balance = await paymentService.getBalance();
        setUserBalance(balance);
        setUserKoras(Math.floor(balance / 10));
      } catch (error) {
        console.error("Erreur lors du chargement du solde:", error);
        toast.error("Impossible de charger votre solde");
      }
    };
    loadUserBalance();
  }, [paymentService]);

  // Load available games
  useEffect(() => {
    loadAvailableGames();
    const interval = setInterval(loadAvailableGames, 10000); // Reduced frequency
    return () => clearInterval(interval);
  }, []);

  const loadAvailableGames = async () => {
    try {
      const games = await gameService.getAvailableGames();
      setAvailableGames(games);
    } catch (error) {
      console.error("Erreur lors du chargement des parties:", error);
    } finally {
      setLoadingGames(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAvailableGames();
  };

  const handleCreateGame = async () => {
    const stake = customStake ? parseInt(customStake) : selectedStake;
    
    if (!stake || stake < 50) {
      toast.error("La mise minimum est de 50 koras");
      return;
    }

    if (stake * 10 > userBalance) {
      toast.error("Solde insuffisant");
      return;
    }

    setLoading(true);
    try {
      const gameRoom = await gameService.createGame(gameLabel, stake * 10);
      toast.success("Partie créée avec succès!");
      router.push(routes.gameRoom(gameLabel, gameRoom.id));
    } catch (error) {
      toast.error("Erreur lors de la création de la partie");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (roomId: string) => {
    setLoading(true);
    try {
      await gameService.joinGame(roomId);
      toast.success("Vous avez rejoint la partie!");
      router.push(routes.gameRoom(gameLabel, roomId));
    } catch (error) {
      toast.error("Impossible de rejoindre cette partie");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-container">
      {/* Compact Header */}
      <header className="game-header safe-top">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-bold">Garame</h1>
            <p className="text-game-xs text-muted-foreground">Jeu de cartes</p>
          </div>
          
          <CurrencyDisplay 
            koras={userKoras} 
            fcfa={userBalance} 
            size="compact"
            className="ml-4"
          />
        </div>
      </header>

      {/* Game Content */}
      <div className="game-content px-game">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mt-3 mb-2">
            <TabsTrigger value="join" className="text-game-sm">
              Rejoindre
            </TabsTrigger>
            <TabsTrigger value="create" className="text-game-sm">
              Créer
            </TabsTrigger>
          </TabsList>

          {/* Join Tab */}
          <TabsContent value="join" className="flex-1 mt-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-game-sm text-muted-foreground">
                {availableGames.length} partie{availableGames.length > 1 ? 's' : ''} disponible{availableGames.length > 1 ? 's' : ''}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-7 px-2 text-game-xs"
              >
                <IconRefresh className={cn("h-3 w-3", refreshing && "animate-spin")} />
                <span className="ml-1.5">Actualiser</span>
              </Button>
            </div>

            {loadingGames ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-game h-16 rounded-lg" />
                ))}
              </div>
            ) : availableGames.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <IconCards className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-game-sm text-muted-foreground text-center">
                    Aucune partie disponible
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setSelectedTab("create")}
                  >
                    Créer une partie
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-1.5">
                {availableGames.map((game) => (
                  <GameListItem
                    key={game.id}
                    game={game}
                    onJoin={() => handleJoinGame(game.id)}
                    disabled={loading}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create" className="flex-1 mt-0 space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nouvelle partie</CardTitle>
                <CardDescription className="text-game-xs">
                  Définissez votre mise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <QuickStakeSelector
                  stakes={QUICK_STAKES}
                  selectedStake={selectedStake}
                  onSelectStake={setSelectedStake}
                  userBalance={userBalance}
                />

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Mise personnalisée"
                      value={customStake}
                      onChange={(e) => {
                        setCustomStake(e.target.value);
                        setSelectedStake(null);
                      }}
                      min="50"
                      max={Math.floor(userBalance / 10)}
                      className="h-9 text-game-sm"
                    />
                  </div>
                  <Button
                    onClick={handleCreateGame}
                    disabled={(!selectedStake && !customStake) || loading}
                    className="btn-game-primary h-9 px-4"
                  >
                    {loading ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <IconPlus className="h-4 w-4 mr-1.5" />
                        Créer
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-muted/30 rounded-lg p-2.5">
                  <div className="flex gap-2">
                    <IconAlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-game-xs text-muted-foreground space-y-0.5">
                      <p>• Mise bloquée jusqu'à la fin</p>
                      <p>• Gagnant: 90% du pot total</p>
                      <p>• Commission: 10%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Safe area for bottom navigation */}
      <div className="safe-bottom" />
    </div>
  );
}