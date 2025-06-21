/**
 * Système d'analytiques et de suivi des revenus de la plateforme
 * Fournit des métriques détaillées pour l'administration
 */

import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface RevenueMetrics {
  totalCommission: number;
  gamesRevenue: number;
  depositFees: number;
  withdrawalFees: number;
  totalRevenue: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  averageBalance: number;
  totalUserBalance: number;
}

export interface GameMetrics {
  totalGames: number;
  averageBet: number;
  totalVolume: number;
  popularGameTypes: Array<{
    gameType: string;
    count: number;
    volume: number;
  }>;
  koraWins: {
    simple: number;
    double: number;
    triple: number;
    grandSlam: number;
  };
}

export interface FinancialFlow {
  deposits: number;
  withdrawals: number;
  bets: number;
  winnings: number;
  commissions: number;
  netFlow: number;
}

export interface PlatformAnalytics {
  revenue: RevenueMetrics;
  users: UserMetrics;
  games: GameMetrics;
  financial: FinancialFlow;
  trends: Array<{
    date: Date;
    revenue: number;
    users: number;
    games: number;
    volume: number;
  }>;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export class PlatformAnalyticsService {
  
  /**
   * Obtenir les métriques complètes de la plateforme
   */
  static async getPlatformAnalytics(dateRange: DateRange): Promise<PlatformAnalytics> {
    const [revenue, users, games, financial, trends] = await Promise.all([
      this.getRevenueMetrics(dateRange),
      this.getUserMetrics(dateRange),
      this.getGameMetrics(dateRange),
      this.getFinancialFlow(dateRange),
      this.getTrends(dateRange)
    ]);

    return {
      revenue,
      users,
      games,
      financial,
      trends
    };
  }

  /**
   * Calculer les revenus de la plateforme
   */
  static async getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics> {
    // Commissions sur les jeux
    const gameCommissions = await prisma.transaction.aggregate({
      where: {
        type: TransactionType.COMMISSION,
        status: TransactionStatus.COMPLETED,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _sum: { amount: true }
    });

    // Frais sur les dépôts (simulé - à adapter selon votre modèle)
    const depositFeesQuery = await prisma.transaction.findMany({
      where: {
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      select: { amount: true }
    });

    let depositFees = 0;
    for (const deposit of depositFeesQuery) {
      // Calculer les frais selon le mode de paiement (2.5% par défaut)
      if (deposit.amount) {
        depositFees += Math.round(deposit.amount * 0.025);
      }
    }

    // Frais sur les retraits (simulé)
    const withdrawalFeesQuery = await prisma.transaction.findMany({
      where: {
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.COMPLETED,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      select: { amount: true }
    });

    const withdrawalFees = withdrawalFeesQuery.reduce((sum, w) => {
      if (w.amount) {
        return sum + Math.min(Math.abs(w.amount) * 0.01, 1000); // 1% max 1000 Koras
      }
      return sum;
    }, 0);

    const totalCommission = gameCommissions._sum.amount || 0;
    const gamesRevenue = totalCommission;
    const totalRevenue = totalCommission + depositFees + withdrawalFees;

    return {
      totalCommission,
      gamesRevenue,
      depositFees,
      withdrawalFees,
      totalRevenue,
      period: dateRange
    };
  }

  /**
   * Métriques des utilisateurs
   */
  static async getUserMetrics(dateRange: DateRange): Promise<UserMetrics> {
    // Nombre total d'utilisateurs
    const totalUsers = await prisma.user.count();

    // Nouveaux utilisateurs dans la période
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    });

    // Utilisateurs actifs (ayant fait au moins une transaction)
    const activeUserIds = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      select: { userId: true },
      distinct: ['userId']
    });

    const activeUsers = activeUserIds.length;

    // Utilisateurs récurrents (actifs avant la période ET pendant)
    const previousPeriodStart = new Date(dateRange.start);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));

    const previousActiveUsers = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: dateRange.start
        }
      },
      select: { userId: true },
      distinct: ['userId']
    });

    const returningUsers = activeUserIds.filter(current =>
      previousActiveUsers.some(previous => previous.userId === current.userId)
    ).length;

    // Soldes moyens
    const balanceStats = await prisma.user.aggregate({
      _avg: { koras: true },
      _sum: { koras: true }
    });

    return {
      totalUsers,
      activeUsers,
      newUsers,
      returningUsers,
      averageBalance: Math.round(balanceStats._avg.koras || 0),
      totalUserBalance: balanceStats._sum.koras || 0
    };
  }

  /**
   * Métriques des jeux
   */
  static async getGameMetrics(dateRange: DateRange): Promise<GameMetrics> {
    // Total des parties
    const totalGamesQuery = await prisma.transaction.groupBy({
      by: ['gameId'],
      where: {
        type: TransactionType.GAME_STAKE,
        gameId: { not: null },
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    });

    const totalGames = totalGamesQuery.length;

    // Mise moyenne et volume total
    const betStats = await prisma.transaction.aggregate({
      where: {
        type: TransactionType.GAME_STAKE,
        status: TransactionStatus.COMPLETED,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _avg: { amount: true },
      _sum: { amount: true }
    });

    const averageBet = Math.abs(betStats._avg.amount || 0);
    const totalVolume = Math.abs(betStats._sum.amount || 0);

    // Jeux populaires par type (utilise gameId comme proxy)
    const gameTypeStats = await prisma.transaction.groupBy({
      by: ['gameId'],
      where: {
        type: TransactionType.GAME_STAKE,
        gameId: { not: null },
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _count: { _all: true },
      _sum: { amount: true }
    });

    const popularGameTypes = gameTypeStats
      .map(stat => ({
        gameType: stat.gameId || 'unknown',
        count: stat._count._all || 0,
        volume: Math.abs(stat._sum.amount || 0)
      }))
      .filter(game => game.gameType !== 'unknown')
      .sort((a, b) => b.count - a.count);

    // Statistiques des victoires Kora (simulé pour l'instant)
    const koraWins = await prisma.transaction.findMany({
      where: {
        type: TransactionType.GAME_WIN,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      select: { description: true }
    });

    const koraStats = {
      simple: 0,
      double: 0,
      triple: 0,
      grandSlam: 0
    };

    koraWins.forEach(win => {
      const description = win.description || '';
      
      if (description.includes('KORA_SIMPLE')) {
        koraStats.simple++;
      } else if (description.includes('KORA_DOUBLE')) {
        koraStats.double++;
      } else if (description.includes('KORA_TRIPLE')) {
        koraStats.triple++;
      } else if (description.includes('GRAND_SLAM')) {
        koraStats.grandSlam++;
      }
    });

    return {
      totalGames,
      averageBet,
      totalVolume,
      popularGameTypes,
      koraWins: koraStats
    };
  }

  /**
   * Flux financiers
   */
  static async getFinancialFlow(dateRange: DateRange): Promise<FinancialFlow> {
    const [deposits, withdrawals, bets, winnings, commissions] = await Promise.all([
      // Dépôts
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        },
        _sum: { amount: true }
      }),
      
      // Retraits
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.COMPLETED,
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        },
        _sum: { amount: true }
      }),
      
      // Mises
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.GAME_STAKE,
          status: TransactionStatus.COMPLETED,
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        },
        _sum: { amount: true }
      }),
      
      // Gains
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.GAME_WIN,
          status: TransactionStatus.COMPLETED,
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        },
        _sum: { amount: true }
      }),
      
      // Commissions
      prisma.transaction.aggregate({
        where: {
          type: TransactionType.COMMISSION,
          status: TransactionStatus.COMPLETED,
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        },
        _sum: { amount: true }
      })
    ]);

    const depositAmount = deposits._sum.amount || 0;
    const withdrawalAmount = Math.abs(withdrawals._sum.amount || 0);
    const betAmount = Math.abs(bets._sum.amount || 0);
    const winningAmount = winnings._sum.amount || 0;
    const commissionAmount = commissions._sum.amount || 0;

    const netFlow = depositAmount - withdrawalAmount + commissionAmount;

    return {
      deposits: depositAmount,
      withdrawals: withdrawalAmount,
      bets: betAmount,
      winnings: winningAmount,
      commissions: commissionAmount,
      netFlow
    };
  }

  /**
   * Tendances quotidiennes
   */
  static async getTrends(dateRange: DateRange): Promise<Array<{
    date: Date;
    revenue: number;
    users: number;
    games: number;
    volume: number;
  }>> {
    const trends = [];
    const current = new Date(dateRange.start);
    
    while (current <= dateRange.end) {
      const dayStart = new Date(current);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);

      const [revenue, users, games, volume] = await Promise.all([
        // Revenus du jour
        prisma.transaction.aggregate({
          where: {
            type: TransactionType.COMMISSION,
            status: TransactionStatus.COMPLETED,
            createdAt: { gte: dayStart, lte: dayEnd }
          },
          _sum: { amount: true }
        }),
        
        // Utilisateurs actifs du jour
        prisma.transaction.findMany({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd }
          },
          select: { userId: true },
          distinct: ['userId']
        }),
        
        // Parties du jour
        prisma.transaction.groupBy({
          by: ['gameId'],
          where: {
            type: TransactionType.GAME_STAKE,
            gameId: { not: null },
            createdAt: { gte: dayStart, lte: dayEnd }
          }
        }),
        
        // Volume du jour
        prisma.transaction.aggregate({
          where: {
            type: TransactionType.GAME_STAKE,
            status: TransactionStatus.COMPLETED,
            createdAt: { gte: dayStart, lte: dayEnd }
          },
          _sum: { amount: true }
        })
      ]);

      trends.push({
        date: new Date(current),
        revenue: revenue._sum.amount || 0,
        users: users.length,
        games: games.length,
        volume: Math.abs(volume._sum.amount || 0)
      });

      current.setDate(current.getDate() + 1);
    }

    return trends;
  }

  /**
   * Rapport détaillé pour une période
   */
  static async generateDetailedReport(dateRange: DateRange): Promise<{
    summary: PlatformAnalytics;
    topUsers: Array<{
      userId: string;
      userName: string;
      totalBets: number;
      totalWinnings: number;
      gamesPlayed: number;
      netContribution: number;
    }>;
    financialBreakdown: {
      revenueBySource: Record<string, number>;
      expensesByType: Record<string, number>;
      profitMargin: number;
    };
  }> {
    const summary = await this.getPlatformAnalytics(dateRange);

    // Top utilisateurs par contribution
    const topUsersQuery = await prisma.user.findMany({
      include: {
        transactions: {
          where: {
            createdAt: { gte: dateRange.start, lte: dateRange.end },
            status: TransactionStatus.COMPLETED
          }
        }
      },
      take: 10
    });

    const topUsers = topUsersQuery.map(user => {
      const bets = user.transactions
        .filter(t => t.type === TransactionType.GAME_STAKE)
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
      
      const winnings = user.transactions
        .filter(t => t.type === TransactionType.GAME_WIN)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const games = new Set(
        user.transactions
          .filter(t => t.type === TransactionType.GAME_STAKE && t.gameId)
          .map(t => t.gameId)
      ).size;

      return {
        userId: user.id,
        userName: user.name,
        totalBets: bets,
        totalWinnings: winnings,
        gamesPlayed: games,
        netContribution: bets - winnings
      };
    }).sort((a, b) => b.netContribution - a.netContribution);

    // Répartition détaillée des revenus
    const financialBreakdown = {
      revenueBySource: {
        'Commissions jeux': summary.revenue.gamesRevenue,
        'Frais dépôts': summary.revenue.depositFees,
        'Frais retraits': summary.revenue.withdrawalFees
      },
      expensesByType: {
        'Support technique': 0, // À implémenter selon vos besoins
        'Marketing': 0,
        'Opérations': 0
      },
      profitMargin: summary.revenue.totalRevenue > 0 
        ? (summary.revenue.totalRevenue / summary.financial.deposits) * 100 
        : 0
    };

    return {
      summary,
      topUsers,
      financialBreakdown
    };
  }

  /**
   * Prédictions basées sur les tendances
   */
  static async generatePredictions(dateRange: DateRange): Promise<{
    nextMonthRevenue: number;
    expectedUsers: number;
    growthRate: number;
    recommendations: string[];
  }> {
    const trends = await this.getTrends(dateRange);
    const analytics = await this.getPlatformAnalytics(dateRange);

    // Calcul de la tendance de croissance
    const firstWeek = trends.slice(0, 7);
    const lastWeek = trends.slice(-7);

    const firstWeekAvg = firstWeek.reduce((sum, day) => sum + day.revenue, 0) / firstWeek.length;
    const lastWeekAvg = lastWeek.reduce((sum, day) => sum + day.revenue, 0) / lastWeek.length;

    const growthRate = firstWeekAvg > 0 ? ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100 : 0;

    // Prédictions simples (à améliorer avec des modèles plus sophistiqués)
    const dailyAvgRevenue = analytics.revenue.totalRevenue / trends.length;
    const nextMonthRevenue = dailyAvgRevenue * 30 * (1 + growthRate / 100);

    const dailyAvgUsers = analytics.users.activeUsers / trends.length;
    const expectedUsers = Math.round(dailyAvgUsers * 30 * (1 + growthRate / 200));

    // Recommandations basées sur les données
    const recommendations: string[] = [];

    if (growthRate < 0) {
      recommendations.push("Croissance négative détectée - Analyser les causes de la baisse d'activité");
    }

    if (analytics.users.returningUsers / analytics.users.activeUsers < 0.3) {
      recommendations.push("Faible rétention utilisateur - Implémenter des mécanismes de fidélisation");
    }

    if (analytics.revenue.totalRevenue / analytics.financial.deposits < 0.05) {
      recommendations.push("Marge faible - Envisager d'ajuster les taux de commission");
    }

    if (analytics.games.koraWins.simple + analytics.games.koraWins.double > analytics.games.totalGames * 0.1) {
      recommendations.push("Taux de Kora élevé - Vérifier l'équilibrage du jeu");
    }

    return {
      nextMonthRevenue: Math.round(nextMonthRevenue),
      expectedUsers,
      growthRate: Math.round(growthRate * 100) / 100,
      recommendations
    };
  }
}