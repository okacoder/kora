import { Prisma } from '@prisma/client';
import { getRedisClient } from '@/lib/cache/redis-client';

/**
 * Configuration des optimisations Prisma
 */
interface QueryOptimizationConfig {
  cacheEnabled: boolean;
  cacheTTL: number;
  includeOptimizations: boolean;
  batchingEnabled: boolean;
}

/**
 * Optimiseur de requêtes Prisma pour les jeux
 */
export class PrismaOptimizer {
  private redis = getRedisClient();
  private queryCache = new Map<string, { data: any; expiry: number }>();
  private batchedQueries = new Map<string, Promise<any>>();

  constructor(private config: QueryOptimizationConfig = {
    cacheEnabled: true,
    cacheTTL: 300, // 5 minutes
    includeOptimizations: true,
    batchingEnabled: true,
  }) {}

  /**
   * Optimise les requêtes de parties disponibles
   */
  getOptimizedAvailableGamesQuery(): Prisma.GameRoomFindManyArgs {
    return {
      where: {
        status: 'WAITING',
      },
      select: {
        id: true,
        gameType: true,
        stake: true,
        maxPlayers: true,
        creatorName: true,
        status: true,
        createdAt: true,
        // Optimisation: Ne pas charger gameState (lourd)
        players: {
          select: {
            id: true,
            name: true,
            isAI: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limiter à 50 parties maximum
    };
  }

  /**
   * Optimise les requêtes d'état de jeu
   */
  getOptimizedGameStateQuery(gameId: string): Prisma.GameRoomFindUniqueArgs {
    return {
      where: { id: gameId },
      select: {
        id: true,
        gameType: true,
        status: true,
        stake: true,
        totalPot: true,
        gameState: true, // Nécessaire pour l'état du jeu
        players: {
          select: {
            id: true,
            name: true,
            position: true,
            isReady: true,
            isAI: true,
            aiDifficulty: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    };
  }

  /**
   * Optimise les requêtes de statistiques utilisateur
   */
  getOptimizedUserStatsQuery(userId: string): Prisma.userFindUniqueArgs {
    return {
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        koras: true,
        totalWins: true,
        totalGames: true,
        // Optimisation: Pas de relations lourdes
      },
    };
  }

  /**
   * Cache intelligent pour les requêtes fréquentes
   */
  async withCache<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    if (!this.config.cacheEnabled) {
      return await queryFn();
    }

    const ttl = ttlSeconds || this.config.cacheTTL;
    
    // Vérifier le cache local d'abord (plus rapide)
    const localCached = this.queryCache.get(cacheKey);
    if (localCached && Date.now() < localCached.expiry) {
      return localCached.data;
    }

    // Vérifier Redis
    const redisCached = await this.redis.getGameState(cacheKey);
    if (redisCached) {
      // Mettre à jour le cache local
      this.queryCache.set(cacheKey, {
        data: redisCached,
        expiry: Date.now() + (ttl * 1000),
      });
      return redisCached;
    }

    // Exécuter la requête
    const result = await queryFn();

    // Mettre en cache
    this.queryCache.set(cacheKey, {
      data: result,
      expiry: Date.now() + (ttl * 1000),
    });

    await this.redis.cacheGameState(cacheKey, result, ttl);

    return result;
  }

  /**
   * Batching des requêtes pour éviter N+1
   */
  async withBatching<T>(
    batchKey: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    if (!this.config.batchingEnabled) {
      return await queryFn();
    }

    // Vérifier si une requête similaire est déjà en cours
    const existingPromise = this.batchedQueries.get(batchKey);
    if (existingPromise) {
      return await existingPromise;
    }

    // Créer et stocker la promesse
    const promise = queryFn();
    this.batchedQueries.set(batchKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Nettoyer après 100ms pour permettre le batching
      setTimeout(() => {
        this.batchedQueries.delete(batchKey);
      }, 100);
    }
  }

  /**
   * Optimise les requêtes de transactions
   */
  getOptimizedTransactionQuery(userId: string): Prisma.TransactionFindManyArgs {
    return {
      where: { userId },
      select: {
        id: true,
        type: true,
        amount: true,
        koras: true,
        description: true,
        status: true,
        createdAt: true,
        // Pas de relations lourdes
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limiter à 100 transactions récentes
    };
  }

  /**
   * Optimise les requêtes de mouvements de jeu
   */
  getOptimizedGameMovesQuery(gameId: string): Prisma.GameMoveFindManyArgs {
    return {
      where: { gameId },
      select: {
        id: true,
        playerId: true,
        playerName: true,
        moveNumber: true,
        moveType: true,
        moveData: true,
        timestamp: true,
      },
      orderBy: {
        moveNumber: 'asc',
      },
      take: 1000, // Limiter pour éviter les gros résultats
    };
  }

  /**
   * Invalidation intelligente du cache
   */
  async invalidateCache(patterns: string[]): Promise<void> {
    // Invalider le cache local
    for (const pattern of patterns) {
      for (const [key] of this.queryCache) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    }

    // Invalider Redis par tags
    for (const pattern of patterns) {
      await this.redis.invalidateByTag(pattern);
    }
  }

  /**
   * Préchargement intelligent des données
   */
  async preloadGameData(gameId: string): Promise<void> {
    const promises = [
      // Précharger l'état du jeu
      this.withCache(
        `game:${gameId}:state`,
        async () => {
          // Simulation de requête Prisma optimisée
          return null; // Remplacer par vraie requête
        }
      ),
      
      // Précharger les mouvements récents
      this.withCache(
        `game:${gameId}:moves`,
        async () => {
          // Simulation de requête Prisma optimisée
          return [];
        },
        60 // Cache plus court pour les mouvements
      ),
    ];

    await Promise.all(promises);
  }

  /**
   * Optimisation des requêtes de recherche
   */
  getOptimizedSearchQuery(searchTerm: string): Prisma.GameRoomFindManyArgs {
    return {
      where: {
        AND: [
          { status: 'WAITING' },
          {
            OR: [
              { creatorName: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        gameType: true,
        stake: true,
        maxPlayers: true,
        creatorName: true,
        status: true,
        createdAt: true,
        players: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { stake: 'asc' },
      ],
      take: 20,
    };
  }

  /**
   * Optimisation des requêtes de classement
   */
  getOptimizedLeaderboardQuery(): Prisma.userFindManyArgs {
    return {
      where: {
        totalGames: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        username: true,
        totalWins: true,
        totalGames: true,
        koras: true,
      },
      orderBy: [
        { totalWins: 'desc' },
        { totalGames: 'desc' },
      ],
      take: 100,
    };
  }

  /**
   * Compression des données pour le cache
   */
  private compressData(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Erreur compression données:', error);
      return '{}';
    }
  }

  /**
   * Décompression des données du cache
   */
  private decompressData(compressed: string): any {
    try {
      return JSON.parse(compressed);
    } catch (error) {
      console.error('Erreur décompression données:', error);
      return null;
    }
  }

  /**
   * Analyse des performances des requêtes
   */
  async analyzeQueryPerformance(queryName: string, queryFn: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      // Logger les requêtes lentes
      if (duration > 1000) { // Plus de 1 seconde
        console.warn(`Requête lente détectée: ${queryName} (${duration}ms)`);
      }
      
      // Incrémenter les compteurs Redis
      await this.redis.incrementCounter(`query:${queryName}:count`);
      await this.redis.incrementCounter(`query:${queryName}:duration`, duration);
      
      return result;
    } catch (error) {
      await this.redis.incrementCounter(`query:${queryName}:errors`);
      throw error;
    }
  }

  /**
   * Nettoyage du cache local
   */
  cleanupLocalCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.queryCache) {
      if (now >= cached.expiry) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Obtient les statistiques d'optimisation
   */
  getOptimizationStats(): any {
    return {
      localCacheSize: this.queryCache.size,
      batchedQueriesCount: this.batchedQueries.size,
      config: this.config,
    };
  }

  /**
   * Configuration dynamique
   */
  updateConfig(newConfig: Partial<QueryOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Instance singleton
let prismaOptimizer: PrismaOptimizer | null = null;

/**
 * Obtient l'instance PrismaOptimizer singleton
 */
export function getPrismaOptimizer(): PrismaOptimizer {
  if (!prismaOptimizer) {
    prismaOptimizer = new PrismaOptimizer();
  }
  return prismaOptimizer;
}

/**
 * Helpers pour les requêtes optimisées courantes
 */
export const OptimizedQueries = {
  /**
   * Requête optimisée pour les parties disponibles
   */
  async getAvailableGames() {
    const optimizer = getPrismaOptimizer();
    return optimizer.withCache(
      'games:available',
      async () => {
        // Ici on utiliserait Prisma avec la requête optimisée
        // return prisma.gameRoom.findMany(optimizer.getOptimizedAvailableGamesQuery());
        return [];
      },
      30 // Cache de 30 secondes pour les parties disponibles
    );
  },

  /**
   * Requête optimisée pour l'état d'une partie
   */
  async getGameState(gameId: string) {
    const optimizer = getPrismaOptimizer();
    return optimizer.withCache(
      `game:${gameId}:state`,
      async () => {
        // return prisma.gameRoom.findUnique(optimizer.getOptimizedGameStateQuery(gameId));
        return null;
      },
      60 // Cache de 1 minute pour l'état du jeu
    );
  },

  /**
   * Requête optimisée pour les statistiques utilisateur
   */
  async getUserStats(userId: string) {
    const optimizer = getPrismaOptimizer();
    return optimizer.withCache(
      `user:${userId}:stats`,
      async () => {
        // return prisma.user.findUnique(optimizer.getOptimizedUserStatsQuery(userId));
        return null;
      },
      300 // Cache de 5 minutes pour les stats
    );
  },
};

/**
 * Middleware pour l'optimisation automatique
 */
export function withOptimization<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const optimizer = getPrismaOptimizer();
  return optimizer.analyzeQueryPerformance(queryName, queryFn);
} 