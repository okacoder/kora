"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayingCard, CardBack } from "@/components/game-card";
import { 
  IconCoin, 
  IconUsers, 
  IconTrophy, 
  IconPlus,
  IconCards,
  IconClock,
  IconAlertCircle,
  IconLoader2
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { IGameRoom } from "@/lib/garame/domain/interfaces";
import { useGarameServices } from "@/lib/garame/infrastructure/garame-provider";
import { routes } from "@/lib/routes";

const predefinedStakes = [10, 50, 100, 200, 500, 1000];

export default function GamePage() {
  const router = useRouter();
  const { gameId } = useParams<{ gameId: string }>();
  const { gameService, paymentService } = useGarameServices();
  const [selectedTab, setSelectedTab] = useState("join");
  const [selectedStake, setSelectedStake] = useState<string>("");
  const [customStake, setCustomStake] = useState("");
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userKoras, setUserKoras] = useState<number>(0);
  const [availableGames, setAvailableGames] = useState<IGameRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGames, setLoadingGames] = useState(true);

  // Charger le solde de l'utilisateur
  useEffect(() => {
     const loadUserBalance = async () => {
    try {
      const balance = await paymentService.getBalance();
      setUserBalance(balance);
      // Calculer les koras (10 FCFA = 1 kora)
      setUserKoras(Math.floor(balance / 10));
    } catch (error) {
      console.error("Erreur lors du chargement du solde:", error);
      toast.error("Impossible de charger votre solde");
    }
  };

  loadUserBalance();
  }, []);

  // Charger les parties disponibles
  useEffect(() => {
    loadAvailableGames();
    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(loadAvailableGames, 5000);
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
    }
  };

  const handleCreateGame = async () => {
    const stake = selectedStake === "custom" ? parseInt(customStake) : parseInt(selectedStake);
    
    if (!stake || stake < 10) {
      toast.error("La mise minimum est de 10 koras");
      return;
    }
    
    if (stake > userKoras) {
      toast.error("Solde de koras insuffisant");
      return;
    }
    
    setLoading(true);
    try {
      const room = await gameService.createGame(stake);
      toast.success(`Partie créée avec une mise de ${stake} koras`);
      
      // Rediriger vers la salle d'attente
      router.push(routes.gameRoom(room.id));
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de la partie");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (roomId: string) => {
    const game = availableGames.find(g => g.id === roomId);
    
    if (!game) return;
    
    if (game.stake > userKoras) {
      toast.error("Solde de koras insuffisant pour rejoindre cette partie");
      return;
    }
    
    setLoading(true);
    try {
      await gameService.joinGame(roomId);
      toast.success("Vous avez rejoint la partie");

      // Rediriger vers la partie
      router.push(routes.gamePlay(gameId!, roomId));
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la connexion à la partie");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (minutes < 1440) return `Il y a ${Math.floor(minutes / 60)} h`;
    return `Il y a ${Math.floor(minutes / 1440)} j`;
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Header avec infos du joueur */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Garame - Jeu de cartes</h1>
          <p className="text-muted-foreground">Affrontez d'autres joueurs et remportez la mise</p>
        </div>
        
        <Card className="border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <IconCoin className="size-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Vos koras</p>
              <p className="text-2xl font-bold">{userKoras.toLocaleString()} koras</p>
              <p className="text-xs text-muted-foreground">≈ {userBalance.toLocaleString()} FCFA</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs pour créer ou rejoindre */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="join">Rejoindre une partie</TabsTrigger>
          <TabsTrigger value="create">Créer une partie</TabsTrigger>
        </TabsList>

        {/* Rejoindre une partie */}
        <TabsContent value="join" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parties disponibles</CardTitle>
              <CardDescription>
                Choisissez une partie selon votre mise préférée
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGames ? (
                <div className="flex items-center justify-center py-8">
                  <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {availableGames.map((game) => (
                    <Card key={game.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Aperçu des cartes */}
                            <div className="flex -space-x-4">
                              <div className="w-12 h-16">
                                <CardBack width={48} height={64} className="shadow-sm" />
                              </div>
                              <div className="w-12 h-16">
                                <PlayingCard suit="hearts" rank="K" width={48} height={64} className="shadow-sm" />
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{game.creatorName}</p>
                                <Badge variant="outline" className="text-xs">
                                  {game.players}/{game.maxPlayers} joueurs
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <IconCoin className="size-4" />
                                  Mise: {game.stake} koras
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconClock className="size-4" />
                                  {formatTimeAgo(game.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={() => handleJoinGame(game.id)}
                            disabled={game.stake > userBalance || loading}
                          >
                            {loading ? <IconLoader2 className="animate-spin" /> : "Rejoindre"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {availableGames.length === 0 && (
                    <div className="text-center py-8">
                      <IconCards className="size-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucune partie disponible pour le moment</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setSelectedTab("create")}
                      >
                        Créer une partie
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Créer une partie */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Créer une nouvelle partie</CardTitle>
              <CardDescription>
                Définissez votre mise et attendez qu'un joueur vous rejoigne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sélection de la mise */}
              <div className="space-y-3">
                <Label>Choisir la mise</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {predefinedStakes.map((stake) => (
                    <Card 
                      key={stake}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedStake === stake.toString() 
                          ? 'border-primary shadow-md' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedStake(stake.toString());
                        setCustomStake("");
                      }}
                    >
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold">{stake.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">koras</p>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Mise personnalisée */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedStake === 'custom' 
                        ? 'border-primary shadow-md' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedStake('custom')}
                  >
                    <CardContent className="p-4 text-center">
                      <IconPlus className="size-6 mx-auto mb-1" />
                      <p className="text-sm font-medium">Personnalisée</p>
                    </CardContent>
                  </Card>
                </div>
                
                {selectedStake === 'custom' && (
                  <div className="mt-4">
                    <Label htmlFor="custom-stake">Montant personnalisé (min. 10 koras)</Label>
                    <Input
                      id="custom-stake"
                      type="number"
                      min="10"
                      value={customStake}
                      onChange={(e) => setCustomStake(e.target.value)}
                      placeholder="Entrez votre mise en koras"
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Résumé */}
              <div className="space-y-4">
                <h3 className="font-semibold">Résumé de la partie</h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Votre mise</span>
                    <span className="font-semibold">
                      {selectedStake === 'custom' 
                        ? (customStake ? `${parseInt(customStake).toLocaleString()} koras` : '—')
                        : `${parseInt(selectedStake || '0').toLocaleString()} koras`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gain potentiel (90%)</span>
                    <span className="font-semibold text-green-600">
                      {selectedStake === 'custom' 
                        ? (customStake ? `${Math.floor(parseInt(customStake) * 1.8).toLocaleString()} koras` : '—')
                        : selectedStake ? `${Math.floor(parseInt(selectedStake) * 1.8).toLocaleString()} koras` : '—'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission (10%)</span>
                    <span className="text-sm">
                      {selectedStake === 'custom' 
                        ? (customStake ? `${Math.floor(parseInt(customStake) * 0.2).toLocaleString()} koras` : '—')
                        : selectedStake ? `${Math.floor(parseInt(selectedStake) * 0.2).toLocaleString()} koras` : '—'
                      }
                    </span>
                  </div>
                </div>
                
                {/* Avertissement */}
                <div className="flex gap-2 p-3 bg-amber-500/10 rounded-lg">
                  <IconAlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900 dark:text-amber-400">
                    Une fois la partie créée, votre mise sera bloquée jusqu'à la fin de la partie
                  </p>
                </div>
              </div>

              {/* Bouton de création */}
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleCreateGame}
                disabled={!selectedStake || (selectedStake === 'custom' && !customStake) || loading}
              >
                {loading ? (
                  <IconLoader2 className="mr-2 animate-spin" />
                ) : (
                  <IconTrophy className="mr-2" />
                )}
                Créer la partie
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}