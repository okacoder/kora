"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  IconCoin,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconHistory,
  IconDeviceMobile,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconLoader2,
  IconGift,
  IconTrendingUp,
  IconReceipt
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { paymentService } from "@/lib/garame/core/payment-service";
import { gameStore } from "@/lib/garame/core/game-store";
import type { Player } from "@/lib/garame/core/types";

// Taux de conversion
const FCFA_TO_KORAS_RATE = 10; // 100 FCFA = 10 koras

// Options de recharge prédéfinies
const rechargeOptions = [
  { fcfa: 500, koras: 50, bonus: 0 },
  { fcfa: 1000, koras: 100, bonus: 5 }, // 5% bonus
  { fcfa: 2000, koras: 200, bonus: 20 }, // 10% bonus
  { fcfa: 5000, koras: 500, bonus: 75 }, // 15% bonus
  { fcfa: 10000, koras: 1000, bonus: 200 }, // 20% bonus
  { fcfa: 20000, koras: 2000, bonus: 500 }, // 25% bonus
];

export default function KorasPage() {
  const currentUser = useCurrentUser();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState("buy");
  
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"airtel" | "moov">("airtel");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"airtel" | "moov">("airtel");
  const [withdrawPhone, setWithdrawPhone] = useState("");

  useEffect(() => {
    const fetchPlayer = async () => {
      if (currentUser?.id) {
        const p = await gameStore.getPlayer(currentUser.id);
        setPlayer(p);
      }
    };
    fetchPlayer();
  }, [currentUser]);

  const handleBuyKoras = async () => {
    if (!currentUser) return;
    const amount = selectedAmount === "custom" ? parseInt(customAmount) : parseInt(selectedAmount);
    
    if (!amount || amount < 500) {
      toast.error("Le montant minimum est de 500 FCFA");
      return;
    }
    
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error("Veuillez entrer un numéro de téléphone valide");
      return;
    }
    
    setLoading(true);
    try {
      // This is a simulation. In a real app, this would be a backend call.
      await paymentService.processStake(currentUser.id, -amount, 'deposit'); // Use negative for deposit
      
      const option = rechargeOptions.find(opt => opt.fcfa === amount);
      const baseKoras = Math.floor(amount / FCFA_TO_KORAS_RATE);
      const bonusKoras = option?.bonus || 0;
      const totalKoras = baseKoras + bonusKoras;

      toast.success(
        <div>
          <p className="font-semibold">Achat réussi !</p>
          <p className="text-sm">
            Vous avez reçu {totalKoras} koras
            {bonusKoras > 0 && ` (dont ${bonusKoras} de bonus)`}
          </p>
        </div>
      );
      
      const p = await gameStore.getPlayer(currentUser.id);
      setPlayer(p);
      setSelectedAmount("");
      setCustomAmount("");
      setPhoneNumber("");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'achat");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!currentUser || !player) return;

    const amount = parseInt(withdrawAmount);
    const korasToWithdraw = Math.floor(amount / FCFA_TO_KORAS_RATE);
    
    if (!amount || amount < 1000) {
      toast.error("Le montant minimum de retrait est de 1000 FCFA");
      return;
    }
    
    if (korasToWithdraw > player.balance) {
      toast.error("Solde de koras insuffisant");
      return;
    }
    
    if (!withdrawPhone || withdrawPhone.length < 8) {
      toast.error("Veuillez entrer un numéro de téléphone valide");
      return;
    }
    
    setLoading(true);
    try {
      await paymentService.processWinning(currentUser.id, -amount, 'withdraw'); // Use negative for withdraw

      toast.success(
        <div>
          <p className="font-semibold">Retrait effectué !</p>
          <p className="text-sm">{amount} FCFA ont été envoyés sur votre compte {withdrawMethod}</p>
        </div>
      );
      
      const p = await gameStore.getPlayer(currentUser.id);
      setPlayer(p);
      setWithdrawAmount("");
      setWithdrawPhone("");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du retrait");
    } finally {
      setLoading(false);
    }
  };

  const korasBalance = player?.balance || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCoin className="size-6 text-primary" />
            Mon solde de Koras
          </CardTitle>
          <CardDescription>
            Utilisez vos Koras pour jouer aux jeux ou retirez vos gains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold">{korasBalance.toLocaleString()}</p>
            <span className="text-muted-foreground">Koras</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            ≈ {(korasBalance * FCFA_TO_KORAS_RATE).toLocaleString()} FCFA
          </p>
        </CardContent>
      </Card>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">Acheter des Koras</TabsTrigger>
          <TabsTrigger value="withdraw">Retirer mes gains</TabsTrigger>
        </TabsList>
        <TabsContent value="buy">
          <Card>
            <CardHeader>
              <CardTitle>Recharger votre compte</CardTitle>
              <CardDescription>
                Sélectionnez un montant ou entrez une valeur personnalisée.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {rechargeOptions.map((option) => (
                  <Button
                    key={option.fcfa}
                    variant={selectedAmount === option.fcfa.toString() ? "default" : "outline"}
                    className="h-auto flex flex-col items-center p-3"
                    onClick={() => {
                      setSelectedAmount(option.fcfa.toString());
                      setCustomAmount("");
                    }}
                  >
                    <span className="font-semibold text-lg">{option.koras} Koras</span>
                    <span className="text-xs text-muted-foreground">{option.fcfa} FCFA</span>
                    {option.bonus > 0 && (
                      <Badge variant="secondary" className="mt-1">
                        <IconGift className="size-3 mr-1" />
                        + {option.bonus} Koras
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
              <Separator />
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Montant personnalisé (FCFA)</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder="Ex: 1500"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount("custom");
                    }}
                    min="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone-number">Numéro de téléphone</Label>
                  <Input
                    id="phone-number"
                    type="tel"
                    placeholder="Votre numéro"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Opérateur</Label>
                  <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="moov">Moov Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

               <div className="flex justify-end">
                <Button
                  onClick={handleBuyKoras}
                  disabled={loading || (!selectedAmount && !customAmount) || !phoneNumber}
                  size="lg"
                >
                  {loading ? (
                    <IconLoader2 className="animate-spin mr-2" />
                  ) : (
                    <IconArrowDownLeft className="mr-2" />
                  )}
                  Acheter {selectedAmount === "custom" ? customAmount : selectedAmount} FCFA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle>Retirer vos gains en FCFA</CardTitle>
              <CardDescription>
                Les retraits sont traités sous 24h.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Montant à retirer (FCFA)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="Ex: 5000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdraw-phone">Numéro de téléphone</Label>
                  <Input
                    id="withdraw-phone"
                    type="tel"
                    placeholder="Numéro pour le dépôt"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Opérateur</Label>
                  <Select value={withdrawMethod} onValueChange={(v: any) => setWithdrawMethod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="moov">Moov Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount || !withdrawPhone}
                  size="lg"
                  variant="secondary"
                >
                  {loading ? (
                    <IconLoader2 className="animate-spin mr-2" />
                  ) : (
                    <IconArrowUpRight className="mr-2" />
                  )}
                  Retirer {withdrawAmount} FCFA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}