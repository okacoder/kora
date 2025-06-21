/**
 * Modal de dépôt de Koras
 * Interface pour effectuer des dépôts via Mobile Money ou carte bancaire
 */

"use client";

import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  IconCoin,
  IconPlus,
  IconDeviceMobile,
  IconCreditCard,
  IconBuildingBank,
  IconCheck,
  IconAlertCircle,
  IconLoader2,
  IconShield,
  IconLock
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DepositModalProps {
  userId: string;
  trigger?: React.ReactNode;
  onSuccess?: (amount: number, newBalance: number) => void;
  onError?: (error: string) => void;
}

type PaymentMethod = 'MOBILE_MONEY' | 'BANK_CARD' | 'BANK_TRANSFER';

interface DepositStep {
  step: number;
  title: string;
  description: string;
}

const DEPOSIT_STEPS: DepositStep[] = [
  { step: 1, title: "Montant", description: "Choisir le montant à déposer" },
  { step: 2, title: "Paiement", description: "Sélectionner le mode de paiement" },
  { step: 3, title: "Confirmation", description: "Confirmer et finaliser" }
];

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000, 100000];

const PAYMENT_METHODS = [
  {
    id: 'MOBILE_MONEY' as PaymentMethod,
    name: 'Mobile Money',
    icon: IconDeviceMobile,
    description: 'Orange Money, MTN MoMo, Express Union',
    fees: '0%',
    instant: true,
    popular: true
  },
  {
    id: 'BANK_CARD' as PaymentMethod,
    name: 'Carte bancaire',
    icon: IconCreditCard,
    description: 'Visa, MasterCard',
    fees: '2.5%',
    instant: true,
    popular: false
  },
  {
    id: 'BANK_TRANSFER' as PaymentMethod,
    name: 'Virement bancaire',
    icon: IconBuildingBank,
    description: 'Virement depuis votre banque',
    fees: '0%',
    instant: false,
    popular: false
  }
];

export function DepositModal({ userId, trigger, onSuccess, onError }: DepositModalProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Données du formulaire
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [accountName, setAccountName] = useState('');

  const resetForm = () => {
    setCurrentStep(1);
    setAmount(0);
    setPaymentMethod(null);
    setPhoneNumber('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setAccountName('');
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const validateStep1 = () => {
    return amount >= 500 && amount <= 1000000;
  };

  const validateStep2 = () => {
    if (!paymentMethod) return false;
    
    switch (paymentMethod) {
      case 'MOBILE_MONEY':
        return phoneNumber.length >= 9;
      case 'BANK_CARD':
        return cardNumber.length >= 16 && expiryDate.length === 5 && cvv.length >= 3;
      case 'BANK_TRANSFER':
        return accountName.length >= 2;
      default:
        return false;
    }
  };

  const calculateFees = () => {
    if (!paymentMethod) return 0;
    const method = PAYMENT_METHODS.find(m => m.id === paymentMethod);
    if (!method) return 0;
    
    const feeRate = parseFloat(method.fees.replace('%', '')) / 100;
    return Math.round(amount * feeRate);
  };

  const getTotalAmount = () => {
    return amount + calculateFees();
  };

  const handleDeposit = async () => {
    setProcessing(true);

    try {
      // Ici on ferait l'appel API réel
      // const response = await fetch('/api/wallet/deposit', { ... });
      
      // Simulation d'un traitement
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simuler un taux de succès de 95%
      if (Math.random() < 0.95) {
        const newBalance = 15000 + amount; // Mock nouveau solde
        onSuccess?.(amount, newBalance);
        handleClose();
      } else {
        throw new Error('Échec du traitement du paiement');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      onError?.(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {DEPOSIT_STEPS.map((step, index) => (
        <div key={step.step} className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            currentStep >= step.step
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            {currentStep > step.step ? (
              <IconCheck className="w-4 h-4" />
            ) : (
              step.step
            )}
          </div>
          
          {index < DEPOSIT_STEPS.length - 1 && (
            <div className={cn(
              "w-12 h-0.5 mx-2",
              currentStep > step.step ? "bg-primary" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <Label htmlFor="amount">Montant à déposer (Koras)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Entrez le montant"
          value={amount || ''}
          onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
          className="text-lg font-medium"
          min={500}
          max={1000000}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Minimum: 500 Koras • Maximum: 1,000,000 Koras
        </p>
      </div>

      <div>
        <Label>Montants rapides</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {QUICK_AMOUNTS.map((quickAmount) => (
            <Button
              key={quickAmount}
              variant={amount === quickAmount ? "default" : "outline"}
              onClick={() => setAmount(quickAmount)}
              className="text-sm"
            >
              {quickAmount.toLocaleString()}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <IconCoin className="w-5 h-5 text-primary" />
          <span className="font-medium">Récapitulatif</span>
        </div>
        <p className="text-2xl font-bold text-primary">
          {amount.toLocaleString()} Koras
        </p>
        <p className="text-sm text-muted-foreground">
          Équivalent à {(amount / 100).toLocaleString()} FCFA
        </p>
      </div>

      <Button 
        onClick={() => setCurrentStep(2)} 
        disabled={!validateStep1()}
        className="w-full"
      >
        Continuer
      </Button>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <Label>Mode de paiement</Label>
        <div className="grid gap-3 mt-2">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            return (
              <div
                key={method.id}
                className={cn(
                  "relative p-4 border rounded-lg cursor-pointer transition-all",
                  paymentMethod === method.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setPaymentMethod(method.id)}
              >
                {method.popular && (
                  <Badge className="absolute -top-2 -right-2 bg-chart-5 text-white">
                    Populaire
                  </Badge>
                )}
                
                <div className="flex items-start gap-3">
                  <Icon className="w-6 h-6 text-primary mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{method.name}</span>
                      {method.instant && (
                        <Badge variant="outline" className="text-xs">
                          Instantané
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {method.description}
                    </p>
                    <p className="text-sm text-primary font-medium">
                      Frais: {method.fees}
                    </p>
                  </div>
                  
                  {paymentMethod === method.id && (
                    <IconCheck className="w-5 h-5 text-primary" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Champs spécifiques au mode de paiement */}
      {paymentMethod === 'MOBILE_MONEY' && (
        <div>
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <Input
            id="phone"
            placeholder="+237 6XX XXX XXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
      )}

      {paymentMethod === 'BANK_CARD' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Numéro de carte</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
              maxLength={16}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry">Date d'expiration</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                maxLength={5}
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                maxLength={4}
                type="password"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-chart-4/10 rounded-lg">
            <IconShield className="w-4 h-4 text-chart-4" />
            <p className="text-sm text-chart-4">
              Paiement sécurisé par SSL 256-bit
            </p>
          </div>
        </div>
      )}

      {paymentMethod === 'BANK_TRANSFER' && (
        <div>
          <Label htmlFor="accountName">Nom du titulaire du compte</Label>
          <Input
            id="accountName"
            placeholder="Votre nom complet"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Le traitement peut prendre 1-3 jours ouvrables
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep(1)}
          className="flex-1"
        >
          Retour
        </Button>
        <Button 
          onClick={() => setCurrentStep(3)} 
          disabled={!validateStep2()}
          className="flex-1"
        >
          Continuer
        </Button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => {
    const fees = calculateFees();
    const total = getTotalAmount();
    const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="text-center">
          <IconLock className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Confirmer le dépôt</h3>
          <p className="text-sm text-muted-foreground">
            Vérifiez les détails avant de finaliser
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Montant:</span>
              <span className="font-medium">{amount.toLocaleString()} Koras</span>
            </div>
            
            {fees > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Frais:</span>
                <span className="font-medium">{fees.toLocaleString()} Koras</span>
              </div>
            )}
            
            <Separator className="my-2" />
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Total à payer:</span>
              <span className="text-lg font-bold text-primary">
                {total.toLocaleString()} Koras
              </span>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <selectedMethod.icon className="w-6 h-6 text-primary" />
              <div>
                <p className="font-medium">{selectedMethod?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {paymentMethod === 'MOBILE_MONEY' && phoneNumber}
                  {paymentMethod === 'BANK_CARD' && `**** **** **** ${cardNumber.slice(-4)}`}
                  {paymentMethod === 'BANK_TRANSFER' && accountName}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(2)}
            disabled={processing}
            className="flex-1"
          >
            Retour
          </Button>
          <Button 
            onClick={handleDeposit}
            disabled={processing}
            className="flex-1"
          >
            {processing ? (
              <>
                <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <IconCheck className="w-4 h-4 mr-2" />
                Confirmer
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <IconPlus className="w-4 h-4 mr-2" />
            Déposer des Koras
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconCoin className="w-5 h-5 text-primary" />
            Dépôt de Koras
          </DialogTitle>
          <DialogDescription>
            {DEPOSIT_STEPS[currentStep - 1].description}
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <AnimatePresence mode="wait">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}