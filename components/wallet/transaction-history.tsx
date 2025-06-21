/**
 * Composant d'historique des transactions
 * Affiche l'historique complet avec filtres et pagination
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  IconFilter, 
  IconSearch, 
  IconArrowUp, 
  IconArrowDown, 
  IconCoin,
  IconTrophy,
  IconCreditCard,
  IconBuildingBank,
  IconDeviceGamepad2,
  IconPercentage,
  IconRefresh,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET' | 'WIN' | 'COMMISSION';
  amount: number;
  balanceAfter: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'LOCKED';
  description: string;
  createdAt: Date;
  gameId?: string;
  metadata?: any;
}

export interface TransactionHistoryProps {
  userId: string;
  className?: string;
  showFilters?: boolean;
  compactMode?: boolean;
  limit?: number;
}

export function TransactionHistory({ 
  userId, 
  className, 
  showFilters = true,
  compactMode = false,
  limit = 50
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Charger les transactions
  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Ici on ferait l'appel API réel
      // const response = await fetch('/api/wallet/transactions', { ... });
      
      // Mock data pour la démo
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'DEPOSIT',
          amount: 10000,
          balanceAfter: 15000,
          status: 'COMPLETED',
          description: 'Dépôt Mobile Money',
          createdAt: new Date(Date.now() - 86400000),
          metadata: { paymentMethod: 'MOBILE_MONEY', phoneNumber: '+237123456789' }
        },
        {
          id: '2',
          type: 'BET',
          amount: -500,
          balanceAfter: 14500,
          status: 'COMPLETED',
          description: 'Mise - Partie Garame #abc123',
          createdAt: new Date(Date.now() - 82800000),
          gameId: 'abc123'
        },
        {
          id: '3',
          type: 'WIN',
          amount: 1800,
          balanceAfter: 16300,
          status: 'COMPLETED',
          description: 'Gain KORA_SIMPLE - Partie Garame #abc123',
          createdAt: new Date(Date.now() - 82740000),
          gameId: 'abc123',
          metadata: { victoryType: 'KORA_SIMPLE', koraMultiplier: 2 }
        },
        {
          id: '4',
          type: 'WITHDRAWAL',
          amount: -5000,
          balanceAfter: 11300,
          status: 'PENDING',
          description: 'Retrait Mobile Money',
          createdAt: new Date(Date.now() - 3600000),
          metadata: { paymentMethod: 'MOBILE_MONEY' }
        }
      ];

      // Appliquer les filtres
      let filtered = mockTransactions;
      
      if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === typeFilter);
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(t => t.status === statusFilter);
      }
      
      if (searchTerm) {
        filtered = filtered.filter(t => 
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setTransactions(filtered);
      setTotal(filtered.length);
      setTotalPages(Math.ceil(filtered.length / limit));

    } catch (err) {
      setError('Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [userId, typeFilter, statusFilter, searchTerm, currentPage]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return IconArrowDown;
      case 'WITHDRAWAL': return IconArrowUp;
      case 'BET': return IconDeviceGamepad2;
      case 'WIN': return IconTrophy;
      case 'COMMISSION': return IconPercentage;
      default: return IconCoin;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    switch (type) {
      case 'DEPOSIT':
      case 'WIN':
        return 'text-chart-4'; // Vert
      case 'WITHDRAWAL':
      case 'BET':
        return 'text-chart-1'; // Rouge
      case 'COMMISSION':
        return 'text-chart-5'; // Orange
      default:
        return amount >= 0 ? 'text-chart-4' : 'text-chart-1';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'COMPLETED': 'bg-chart-4 text-white',
      'PENDING': 'bg-chart-5 text-white',
      'FAILED': 'bg-chart-1 text-white',
      'CANCELLED': 'bg-muted-foreground text-white',
      'LOCKED': 'bg-chart-3 text-white'
    };

    const labels = {
      'COMPLETED': 'Complété',
      'PENDING': 'En attente',
      'FAILED': 'Échec',
      'CANCELLED': 'Annulé',
      'LOCKED': 'Verrouillé'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-muted'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = amount >= 0 ? '+' : '';
    const color = getTransactionColor(type, amount);
    
    return (
      <span className={cn("font-semibold", color)}>
        {prefix}{amount.toLocaleString()} <IconCoin className="inline w-4 h-4" />
      </span>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <IconRefresh className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Chargement...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-chart-1 mb-2">{error}</p>
            <Button onClick={loadTransactions} size="sm">
              <IconRefresh className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCoin className="w-5 h-5 text-chart-5" />
          Historique des transactions
          {total > 0 && (
            <Badge variant="outline" className="ml-auto">
              {total} transaction{total > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        
        {/* Filtres */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="DEPOSIT">Dépôts</SelectItem>
                <SelectItem value="WITHDRAWAL">Retraits</SelectItem>
                <SelectItem value="BET">Mises</SelectItem>
                <SelectItem value="WIN">Gains</SelectItem>
                <SelectItem value="COMMISSION">Commissions</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="COMPLETED">Complété</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="FAILED">Échec</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
                <SelectItem value="LOCKED">Verrouillé</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              <IconFilter className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <IconCoin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune transaction trouvée</p>
          </div>
        ) : (
          <>
            {/* Mode compact pour mobile */}
            {compactMode ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {transactions.map((transaction, index) => {
                    const Icon = getTransactionIcon(transaction.type);
                    
                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(transaction.createdAt, 'dd MMM yyyy HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {formatAmount(transaction.amount, transaction.type)}
                          <div className="mt-1">
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              /* Mode tableau pour desktop */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Solde après</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {transactions.map((transaction, index) => {
                      const Icon = getTransactionIcon(transaction.type);
                      
                      return (
                        <motion.tr
                          key={transaction.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{transaction.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm">{transaction.description}</p>
                            {transaction.gameId && (
                              <p className="text-xs text-muted-foreground">
                                Partie: {transaction.gameId}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatAmount(transaction.amount, transaction.type)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {transaction.balanceAfter.toLocaleString()} <IconCoin className="inline w-4 h-4" />
                            </span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(transaction.status)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(transaction.createdAt, 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages} • {total} résultat{total > 1 ? 's' : ''}
                </p>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                  >
                    <IconChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    <IconChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}