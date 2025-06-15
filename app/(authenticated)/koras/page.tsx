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
import { useGarameServices } from "@/lib/garame/infrastructure/garame-provider";
import { ITransaction } from "@/lib/garame/domain/interfaces";

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
  const { paymentService } = useGarameServices();
  
  const [balance, setBalance] = useState<number>(0);
  const [korasBalance, setKorasBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  
  // Onglet actif
  const [activeTab, setActiveTab] = useState("buy");
  
  // Formulaire d'achat
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"airtel" | "moov">("airtel");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Formulaire de retrait
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"airtel" | "moov">("airtel");
  const [withdrawPhone, setWithdrawPhone] = useState("");

  // Charger les données au montage
  useEffect(() => {
    loadUserData();
    loadTransactions();
  }, []);

  const loadUserData = async () => {
    try {
      const userBalance = await paymentService.getBalance();
      setBalance(userBalance);
      // Calculer les koras depuis le solde (simulation)
      setKorasBalance(Math.floor(userBalance / FCFA_TO_KORAS_RATE));
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  };

  const loadTransactions = async () => {
    try {
      const history = await paymentService.getTransactionHistory();
      setTransactions(history);
    } catch (error) {
      console.error("Erreur lors du chargement des transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleBuyKoras = async () => {
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
      // Calculer les koras avec bonus
      const option = rechargeOptions.find(opt => opt.fcfa === amount);
      const baseKoras = Math.floor(amount / FCFA_TO_KORAS_RATE);
      const bonusKoras = option?.bonus || 0;
      const totalKoras = baseKoras + bonusKoras;
      
      // Simuler le paiement
      await paymentService.deposit(amount, paymentMethod);
      
      toast.success(
        <div>
          <p className="font-semibold">Achat réussi !</p>
          <p className="text-sm">
            Vous avez reçu {totalKoras} koras
            {bonusKoras > 0 && ` (dont ${bonusKoras} de bonus)`}
          </p>
        </div>
      );
      
      // Recharger les données
      await loadUserData();
      await loadTransactions();
      
      // Réinitialiser le formulaire
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
    const amount = parseInt(withdrawAmount);
    const korasToWithdraw = Math.floor(amount / FCFA_TO_KORAS_RATE);
    
    if (!amount || amount < 1000) {
      toast.error("Le montant minimum de retrait est de 1000 FCFA");
      return;
    }
    
    if (korasToWithdraw > korasBalance) {
      toast.error("Solde de koras insuffisant");
      return;
    }
    
    if (!withdrawPhone || withdrawPhone.length < 8) {
      toast.error("Veuillez entrer un numéro de téléphone valide");
      return;
    }
    
    setLoading(true);
    try {
      await paymentService.withdraw(amount, withdrawMethod);
      
      toast.success(
        <div>
          <p className="font-semibold">Retrait effectué !</p>
          <p className="text-sm">{amount} FCFA ont été envoyés sur votre compte {withdrawMethod}</p>
        </div>
      );
      
      // Recharger les données
      await loadUserData();
      await loadTransactions();
      
      // Réinitialiser le formulaire
      setWithdrawAmount("");
      setWithdrawPhone("");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du retrait");
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: ITransaction['type']) => {
    switch (type) {
      case 'deposit':
        return <IconArrowDownLeft className="size-4 text-green-600" />;
      case 'withdrawal':
        return <IconArrowUpRight className="size-4 text-red-600" />;
      case 'game_stake':
        return <IconCoin className="size-4 text-orange-600" />;
      case 'game_win':
        return <IconTrendingUp className="size-4 text-green-600" />;
      default:
        return <IconReceipt className="size-4" />;
    }
  };

  const getTransactionLabel = (type: ITransaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'Dépôt';
      case 'withdrawal':
        return 'Retrait';
      case 'game_stake':
        return 'Mise de jeu';
      case 'game_win':
        return 'Gain de partie';
      default:
        return 'Transaction';
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Header avec soldes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solde en Koras</p>
                <p className="text-3xl font-bold text-primary">{korasBalance.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {(korasBalance * FCFA_TO_KORAS_RATE).toLocaleString()} FCFA
                </p>
              </div>
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <IconCoin className="size-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solde FCFA</p>
                <p className="text-3xl font-bold">{balance.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Disponible pour retrait
                </p>
              </div>
              <div className="size-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <IconDeviceMobile className="size-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs pour acheter/retirer/historique */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="buy">Acheter des Koras</TabsTrigger>
          <TabsTrigger value="withdraw">Retirer</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Acheter des Koras */}
        <TabsContent value="buy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acheter des Koras</CardTitle>
              <CardDescription>
                Rechargez votre compte avec Mobile Money et recevez des bonus !
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Options de recharge */}
              <div className="space-y-3">
                <Label>Choisir un montant</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {rechargeOptions.map((option) => (
                    <Card 
                      key={option.fcfa}
                      className={`cursor-pointer transition-all hover:shadow-md relative ${
                        selectedAmount === option.fcfa.toString() 
                          ? 'border-primary shadow-md' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedAmount(option.fcfa.toString());
                        setCustomAmount("");
                      }}
                    >
                      {option.bonus > 0 && (
                        <Badge className="absolute -top-2 -right-2 text-xs">
                          +{Math.round((option.bonus / option.koras) * 100)}%
                        </Badge>
                      )}
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold">{option.fcfa.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">FCFA</p>
                        <Separator className="my-2" />
                        <p className="text-lg font-semibold text-primary">
                          {(option.koras + option.bonus).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">koras</p>
                        {option.bonus > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            +{option.bonus} bonus
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Montant personnalisé */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedAmount === 'custom' 
                        ? 'border-primary shadow-md' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedAmount('custom')}
                  >
                    <CardContent className="p-4 text-center h-full flex flex-col justify-center">
                      <IconCoin className="size-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Autre montant</p>
                    </CardContent>
                  </Card>
                </div>
                
                {selectedAmount === 'custom' && (
                  <div className="mt-4">
                    <Label htmlFor="custom-amount">Montant personnalisé (min. 500 FCFA)</Label>
                    <Input
                      id="custom-amount"
                      type="number"
                      min="500"
                      step="100"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Entrez un montant"
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              {/* Méthode de paiement */}
              <div className="space-y-3">
                <Label>Méthode de paiement</Label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airtel">
                      <div className="flex items-center gap-2">
                        <div className="size-4 rounded-full bg-red-600" />
                        Airtel Money
                      </div>
                    </SelectItem>
                    <SelectItem value="moov">
                      <div className="flex items-center gap-2">
                        <div className="size-4 rounded-full bg-blue-600" />
                        Moov Money
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Numéro de téléphone */}
              <div className="space-y-3">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="077 XX XX XX"
                />
              </div>

              {/* Résumé */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-semibold">
                    {selectedAmount === 'custom' 
                      ? (customAmount ? `${parseInt(customAmount).toLocaleString()} FCFA` : '—')
                      : `${parseInt(selectedAmount || '0').toLocaleString()} FCFA`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Koras à recevoir</span>
                  <span className="font-semibold text-primary">
                    {(() => {
                      const amount = selectedAmount === 'custom' ? parseInt(customAmount || '0') : parseInt(selectedAmount || '0');
                      const option = rechargeOptions.find(opt => opt.fcfa === amount);
                      const baseKoras = Math.floor(amount / FCFA_TO_KORAS_RATE);
                      const bonusKoras = option?.bonus || 0;
                      return `${(baseKoras + bonusKoras).toLocaleString()} koras`;
                    })()}
                  </span>
                </div>
              </div>

              {/* Bouton d'achat */}
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleBuyKoras}
                disabled={!selectedAmount || (selectedAmount === 'custom' && !customAmount) || !phoneNumber || loading}
              >
                {loading ? (
                  <IconLoader2 className="mr-2 animate-spin" />
                ) : (
                  <IconCoin className="mr-2" />
                )}
                Acheter des Koras
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retirer */}
        <TabsContent value="withdraw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retirer vos gains</CardTitle>
              <CardDescription>
                Convertissez vos koras en argent réel sur votre compte Mobile Money
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Montant à retirer */}
              <div className="space-y-3">
                <Label htmlFor="withdraw-amount">Montant à retirer (min. 1000 FCFA)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min="1000"
                  step="100"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Entrez le montant"
                />
                <p className="text-sm text-muted-foreground">
                  Koras nécessaires : {withdrawAmount ? Math.floor(parseInt(withdrawAmount) / FCFA_TO_KORAS_RATE) : 0}
                </p>
              </div>

              {/* Méthode de retrait */}
              <div className="space-y-3">
                <Label>Recevoir sur</Label>
                <Select value={withdrawMethod} onValueChange={(value: any) => setWithdrawMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airtel">
                      <div className="flex items-center gap-2">
                        <div className="size-4 rounded-full bg-red-600" />
                        Airtel Money
                      </div>
                    </SelectItem>
                    <SelectItem value="moov">
                      <div className="flex items-center gap-2">
                        <div className="size-4 rounded-full bg-blue-600" />
                        Moov Money
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Numéro de téléphone */}
              <div className="space-y-3">
                <Label htmlFor="withdraw-phone">Numéro de téléphone</Label>
                <Input
                  id="withdraw-phone"
                  type="tel"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="077 XX XX XX"
                />
              </div>

              {/* Avertissement */}
              <div className="flex gap-2 p-3 bg-amber-500/10 rounded-lg">
                <IconAlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900 dark:text-amber-400">
                  <p className="font-semibold mb-1">Informations importantes</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Les retraits sont traités sous 24h</li>
                    <li>Des frais de 2% sont appliqués</li>
                    <li>Minimum de retrait : 1000 FCFA</li>
                  </ul>
                </div>
              </div>

              {/* Bouton de retrait */}
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseInt(withdrawAmount) < 1000 || !withdrawPhone || loading}
              >
                {loading ? (
                  <IconLoader2 className="mr-2 animate-spin" />
                ) : (
                  <IconArrowUpRight className="mr-2" />
                )}
                Effectuer le retrait
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des transactions</CardTitle>
              <CardDescription>
                Toutes vos transactions des 30 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="flex justify-center py-8">
                  <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <IconHistory className="size-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune transaction</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium">{getTransactionLabel(transaction.type)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} FCFA
                        </p>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' : 
                          transaction.status === 'pending' ? 'secondary' : 
                          'destructive'
                        } className="text-xs">
                          {transaction.status === 'completed' && <IconCheck className="size-3 mr-1" />}
                          {transaction.status === 'failed' && <IconX className="size-3 mr-1" />}
                          {transaction.status === 'pending' && <IconLoader2 className="size-3 mr-1 animate-spin" />}
                          {transaction.status === 'completed' ? 'Complété' : 
                           transaction.status === 'pending' ? 'En cours' : 
                           'Échoué'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Carte bonus */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center">
              <IconGift className="size-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Bonus de bienvenue</h3>
              <p className="text-sm text-muted-foreground">
                Recevez 50 koras gratuits lors de votre premier dépôt de 1000 FCFA ou plus !
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}