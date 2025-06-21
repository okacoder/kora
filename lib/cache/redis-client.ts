import Redis from 'ioredis';
import { z } from 'zod';

/**
 * Configuration Redis
 */
const RedisConfigSchema = z.object({
  url: z.string().optional(),
  host: z.string().default('localhost'),
  port: z.number().default(6379),
  password: z.string().optional(),
  db: z.number().default(0),
  maxRetriesPerRequest: z.number().default(3),
  retryDelayOnFailover: z.number().default(100),
});

type RedisConfig = z.infer<typeof RedisConfigSchema>;

/**
 * Client Redis optimisé pour le cache de jeu
 */
export class GameRedisClient {
  private client: Redis;
  private isConnected: boolean = false;
  private readonly keyPrefix: string = 'kora:';

  constructor(config?: Partial<RedisConfig>) {
    const validatedConfig = RedisConfigSchema.parse(config || {});
    
    // Configuration optimisée pour les jeux
    this.client = new Redis({
      ...validatedConfig,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      // Optimisations pour la latence
      keepAlive: 30000,
      family: 4,
    });

    this.setupEventHandlers();
  }

  /**
   * Configuration des gestionnaires d'événements
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('📡 Redis: Connexion établie');
    });

    this.client.on('ready', () => {
      console.log('✅ Redis: Prêt pour les requêtes');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis: Erreur de connexion:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('🔌 Redis: Connexion fermée');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis: Reconnexion en cours...');
    });
  }

  /**
   * Connexion au serveur Redis
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('🚀 Redis: Client connecté avec succès');
    } catch (error) {
      console.error('💥 Redis: Échec de la connexion:', error);
      throw error;
    }
  }

  /**
   * Déconnexion du serveur Redis
   */
  async disconnect(): Promise<void> {
    await this.client.quit();
    this.isConnected = false;
    console.log('👋 Redis: Client déconnecté');
  }

  /**
   * Génère une clé avec préfixe
   */
  private key(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Cache des états de jeu
   */
  async cacheGameState(gameId: string, state: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const key = this.key(`game:${gameId}:state`);
      const serialized = JSON.stringify(state);
      await this.client.setex(key, ttlSeconds, serialized);
    } catch (error) {
      console.error('Redis: Erreur cache game state:', error);
    }
  }

  /**
   * Récupère un état de jeu du cache
   */
  async getGameState(gameId: string): Promise<any | null> {
    if (!this.isConnected) return null;
    
    try {
      const key = this.key(`game:${gameId}:state`);
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis: Erreur get game state:', error);
      return null;
    }
  }

  /**
   * Cache des sessions utilisateur
   */
  async cacheUserSession(userId: string, sessionData: any, ttlSeconds: number = 86400): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const key = this.key(`user:${userId}:session`);
      const serialized = JSON.stringify(sessionData);
      await this.client.setex(key, ttlSeconds, serialized);
    } catch (error) {
      console.error('Redis: Erreur cache user session:', error);
    }
  }

  /**
   * Cache des parties disponibles
   */
  async cacheAvailableGames(games: any[], ttlSeconds: number = 30): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const key = this.key('games:available');
      const serialized = JSON.stringify(games);
      await this.client.setex(key, ttlSeconds, serialized);
    } catch (error) {
      console.error('Redis: Erreur cache available games:', error);
    }
  }

  /**
   * Récupère les parties disponibles du cache
   */
  async getAvailableGames(): Promise<any[] | null> {
    if (!this.isConnected) return null;
    
    try {
      const key = this.key('games:available');
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis: Erreur get available games:', error);
      return null;
    }
  }

  /**
   * Système de verrous distribués pour éviter les conditions de course
   */
  async acquireLock(resource: string, ttlSeconds: number = 10): Promise<string | null> {
    if (!this.isConnected) return null;
    
    try {
      const lockKey = this.key(`lock:${resource}`);
      const lockValue = `${Date.now()}-${Math.random()}`;
      
      const result = await this.client.set(lockKey, lockValue, 'EX', ttlSeconds, 'NX');
      return result === 'OK' ? lockValue : null;
    } catch (error) {
      console.error('Redis: Erreur acquire lock:', error);
      return null;
    }
  }

  /**
   * Libère un verrou distribué
   */
  async releaseLock(resource: string, lockValue: string): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      const lockKey = this.key(`lock:${resource}`);
      
      // Script Lua pour libération atomique
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.client.eval(script, 1, lockKey, lockValue);
      return result === 1;
    } catch (error) {
      console.error('Redis: Erreur release lock:', error);
      return false;
    }
  }

  /**
   * Cache des statistiques de jeu
   */
  async cachePlayerStats(userId: string, stats: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const key = this.key(`stats:${userId}`);
      const serialized = JSON.stringify(stats);
      await this.client.setex(key, ttlSeconds, serialized);
    } catch (error) {
      console.error('Redis: Erreur cache player stats:', error);
    }
  }

  /**
   * Incrémente un compteur atomique
   */
  async incrementCounter(counterName: string, amount: number = 1): Promise<number> {
    if (!this.isConnected) return 0;
    
    try {
      const key = this.key(`counter:${counterName}`);
      return await this.client.incrby(key, amount);
    } catch (error) {
      console.error('Redis: Erreur increment counter:', error);
      return 0;
    }
  }

  /**
   * Système de pub/sub pour les notifications temps réel
   */
  async publishGameEvent(gameId: string, event: any): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const channel = `game:${gameId}:events`;
      const message = JSON.stringify(event);
      await this.client.publish(channel, message);
    } catch (error) {
      console.error('Redis: Erreur publish game event:', error);
    }
  }

  /**
   * S'abonne aux événements d'une partie
   */
  subscribeToGameEvents(gameId: string, callback: (event: any) => void): void {
    if (!this.isConnected) return;
    
    const subscriber = this.client.duplicate();
    const channel = `game:${gameId}:events`;
    
    subscriber.subscribe(channel);
    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const event = JSON.parse(message);
          callback(event);
        } catch (error) {
          console.error('Redis: Erreur parse game event:', error);
        }
      }
    });
  }

  /**
   * Cache avec invalidation automatique par tags
   */
  async cacheWithTags(key: string, data: any, tags: string[], ttlSeconds: number = 3600): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const cacheKey = this.key(key);
      const serialized = JSON.stringify(data);
      
      // Pipeline pour atomicité
      const pipeline = this.client.pipeline();
      pipeline.setex(cacheKey, ttlSeconds, serialized);
      
      // Associer les tags
      for (const tag of tags) {
        const tagKey = this.key(`tag:${tag}`);
        pipeline.sadd(tagKey, cacheKey);
        pipeline.expire(tagKey, ttlSeconds + 60); // Expiration légèrement plus longue
      }
      
      await pipeline.exec();
    } catch (error) {
      console.error('Redis: Erreur cache with tags:', error);
    }
  }

  /**
   * Invalide le cache par tags
   */
  async invalidateByTag(tag: string): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      const tagKey = this.key(`tag:${tag}`);
      const keys = await this.client.smembers(tagKey);
      
      if (keys.length > 0) {
        const pipeline = this.client.pipeline();
        for (const key of keys) {
          pipeline.del(key);
        }
        pipeline.del(tagKey);
        await pipeline.exec();
        
        console.log(`Redis: Invalidé ${keys.length} clés pour le tag ${tag}`);
      }
    } catch (error) {
      console.error('Redis: Erreur invalidate by tag:', error);
    }
  }

  /**
   * Nettoyage périodique des données expirées
   */
  async cleanup(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      // Nettoyer les verrous expirés
      const lockPattern = this.key('lock:*');
      const lockKeys = await this.client.keys(lockPattern);
      
      if (lockKeys.length > 0) {
        const pipeline = this.client.pipeline();
        for (const key of lockKeys) {
          const ttl = await this.client.ttl(key);
          if (ttl <= 0) {
            pipeline.del(key);
          }
        }
        await pipeline.exec();
      }
      
      console.log('Redis: Nettoyage terminé');
    } catch (error) {
      console.error('Redis: Erreur cleanup:', error);
    }
  }

  /**
   * Obtient les statistiques Redis
   */
  async getStats(): Promise<any> {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.client.info('memory');
      const dbsize = await this.client.dbsize();
      
      return {
        connected: this.isConnected,
        dbsize,
        memory: this.parseRedisInfo(info),
        keyPrefix: this.keyPrefix,
      };
    } catch (error) {
      console.error('Redis: Erreur get stats:', error);
      return null;
    }
  }

  /**
   * Parse les informations Redis
   */
  private parseRedisInfo(info: string): any {
    const result: any = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }
    
    return result;
  }

  /**
   * Vérifie la santé de la connexion
   */
  async healthCheck(): Promise<boolean> {
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (error) {
      console.error('Redis: Health check failed:', error);
      return false;
    }
  }
}

// Instance singleton
let redisClient: GameRedisClient | null = null;

/**
 * Obtient l'instance Redis singleton
 */
export function getRedisClient(): GameRedisClient {
  if (!redisClient) {
    const config = {
      url: process.env.REDIS_URL,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    };
    
    redisClient = new GameRedisClient(config);
  }
  
  return redisClient;
}

/**
 * Initialise la connexion Redis
 */
export async function initializeRedis(): Promise<void> {
  const client = getRedisClient();
  await client.connect();
  
  // Nettoyage périodique toutes les 5 minutes
  setInterval(async () => {
    await client.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Ferme la connexion Redis
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
} 