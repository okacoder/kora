import { LRUCache } from 'lru-cache';

/**
 * Configuration du rate limiting
 */
interface RateLimitConfig {
  windowMs: number;    // Fenêtre de temps en ms
  maxRequests: number; // Nombre max de requêtes
  skipSuccessful?: boolean; // Ignorer les requêtes réussies
}

/**
 * Entrée du cache pour le rate limiting
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  suspiciousActivity: boolean;
}

/**
 * Patterns suspects détectés
 */
interface SuspiciousPattern {
  type: 'RAPID_FIRE' | 'IDENTICAL_TIMING' | 'IMPOSSIBLE_SPEED' | 'BOT_PATTERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
  details: any;
}

/**
 * Rate Limiter avec détection de patterns suspects
 */
export class GameRateLimiter {
  private cache: LRUCache<string, RateLimitEntry>;
  private suspiciousPatterns: LRUCache<string, SuspiciousPattern[]>;
  private configs: Map<string, RateLimitConfig>;

  constructor() {
    this.cache = new LRUCache<string, RateLimitEntry>({
      max: 10000,
      ttl: 60 * 60 * 1000, // 1 heure
    });

    this.suspiciousPatterns = new LRUCache<string, SuspiciousPattern[]>({
      max: 1000,
      ttl: 24 * 60 * 60 * 1000, // 24 heures
    });

    this.configs = new Map([
      // Actions de jeu normales
      ['game_action', { windowMs: 60 * 1000, maxRequests: 100 }], // 100 actions/min
      ['play_card', { windowMs: 60 * 1000, maxRequests: 60 }],    // 60 cartes/min
      ['fold', { windowMs: 60 * 1000, maxRequests: 10 }],        // 10 abandons/min
      
      // Création et gestion de parties
      ['create_game', { windowMs: 60 * 1000, maxRequests: 5 }],   // 5 parties/min
      ['join_game', { windowMs: 60 * 1000, maxRequests: 20 }],    // 20 rejoindre/min
      
      // Actions WebSocket
      ['ws_message', { windowMs: 60 * 1000, maxRequests: 200 }],  // 200 messages/min
      ['chat_message', { windowMs: 60 * 1000, maxRequests: 30 }], // 30 messages chat/min
      
      // Actions sensibles
      ['wallet_transaction', { windowMs: 60 * 1000, maxRequests: 10 }], // 10 transactions/min
      ['password_attempt', { windowMs: 15 * 60 * 1000, maxRequests: 5 }], // 5 tentatives/15min
    ]);
  }

  /**
   * Vérifie si une action est autorisée
   */
  checkLimit(
    userId: string,
    action: string,
    ip?: string,
    metadata?: any
  ): { allowed: boolean; remainingRequests: number; resetTime: number; suspicious?: boolean } {
    const key = `${userId}:${action}`;
    const config = this.configs.get(action);
    
    if (!config) {
      // Action non configurée, autoriser par défaut mais logger
      console.warn(`Rate limit not configured for action: ${action}`);
      return { allowed: true, remainingRequests: 999, resetTime: Date.now() + 60000 };
    }

    const now = Date.now();
    const entry = this.cache.get(key) || { count: 0, resetTime: now + config.windowMs, suspiciousActivity: false };

    // Reset si la fenêtre est expirée
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + config.windowMs;
      entry.suspiciousActivity = false;
    }

    // Analyser les patterns suspects
    const suspicious = this.analyzeSuspiciousPattern(userId, action, now, metadata);
    if (suspicious) {
      entry.suspiciousActivity = true;
      this.recordSuspiciousActivity(userId, suspicious);
    }

    // Vérifier la limite
    if (entry.count >= config.maxRequests) {
      this.cache.set(key, entry);
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime,
        suspicious: entry.suspiciousActivity
      };
    }

    // Incrémenter le compteur
    entry.count++;
    this.cache.set(key, entry);

    return {
      allowed: true,
      remainingRequests: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
      suspicious: entry.suspiciousActivity
    };
  }

  /**
   * Analyse les patterns suspects
   */
  private analyzeSuspiciousPattern(
    userId: string,
    action: string,
    timestamp: number,
    metadata?: any
  ): SuspiciousPattern | null {
    const recentActions = this.getRecentActions(userId, action);
    
    // Pattern 1: Trop d'actions en très peu de temps (bot)
    if (this.detectRapidFire(recentActions, timestamp)) {
      return {
        type: 'RAPID_FIRE',
        severity: 'HIGH',
        timestamp,
        details: { actionCount: recentActions.length, timeWindow: 5000 }
      };
    }

    // Pattern 2: Timing identique entre actions (script)
    if (this.detectIdenticalTiming(recentActions)) {
      return {
        type: 'IDENTICAL_TIMING',
        severity: 'HIGH',
        timestamp,
        details: { intervals: this.calculateIntervals(recentActions) }
      };
    }

    // Pattern 3: Vitesse de réaction impossible
    if (action === 'play_card' && this.detectImpossibleSpeed(metadata)) {
      return {
        type: 'IMPOSSIBLE_SPEED',
        severity: 'MEDIUM',
        timestamp,
        details: { reactionTime: metadata?.reactionTime }
      };
    }

    // Pattern 4: Pattern de bot (actions trop régulières)
    if (this.detectBotPattern(recentActions)) {
      return {
        type: 'BOT_PATTERN',
        severity: 'MEDIUM',
        timestamp,
        details: { regularityScore: this.calculateRegularityScore(recentActions) }
      };
    }

    return null;
  }

  /**
   * Récupère les actions récentes d'un utilisateur
   */
  private getRecentActions(userId: string, action: string): number[] {
    // Simulation - dans un vrai système, on utiliserait Redis ou une DB
    const key = `${userId}:${action}:history`;
    const history = this.cache.get(key) as any || [];
    return history.filter((ts: number) => Date.now() - ts < 60000); // 1 minute
  }

  /**
   * Détecte les actions trop rapides
   */
  private detectRapidFire(recentActions: number[], currentTime: number): boolean {
    const actions = [...recentActions, currentTime];
    const recentWindow = actions.filter(ts => currentTime - ts < 5000); // 5 secondes
    return recentWindow.length > 10; // Plus de 10 actions en 5 secondes
  }

  /**
   * Détecte les intervalles de temps identiques (script)
   */
  private detectIdenticalTiming(recentActions: number[]): boolean {
    if (recentActions.length < 3) return false;
    
    const intervals = this.calculateIntervals(recentActions);
    const uniqueIntervals = new Set(intervals);
    
    // Si plus de 70% des intervalles sont identiques, c'est suspect
    return uniqueIntervals.size / intervals.length < 0.3;
  }

  /**
   * Calcule les intervalles entre actions
   */
  private calculateIntervals(timestamps: number[]): number[] {
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    return intervals;
  }

  /**
   * Détecte une vitesse de réaction impossible
   */
  private detectImpossibleSpeed(metadata?: any): boolean {
    if (!metadata?.reactionTime) return false;
    
    // Temps de réaction humain minimum : ~150ms
    return metadata.reactionTime < 150;
  }

  /**
   * Détecte un pattern de bot (trop régulier)
   */
  private detectBotPattern(recentActions: number[]): boolean {
    if (recentActions.length < 5) return false;
    
    const regularityScore = this.calculateRegularityScore(recentActions);
    return regularityScore > 0.8; // Score de régularité trop élevé
  }

  /**
   * Calcule un score de régularité des actions
   */
  private calculateRegularityScore(timestamps: number[]): number {
    const intervals = this.calculateIntervals(timestamps);
    if (intervals.length < 2) return 0;
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Score de régularité inversement proportionnel à l'écart-type
    return Math.max(0, 1 - (stdDev / avgInterval));
  }

  /**
   * Enregistre une activité suspecte
   */
  private recordSuspiciousActivity(userId: string, pattern: SuspiciousPattern): void {
    const existing = this.suspiciousPatterns.get(userId) || [];
    existing.push(pattern);
    
    // Garder seulement les 50 derniers patterns
    if (existing.length > 50) {
      existing.splice(0, existing.length - 50);
    }
    
    this.suspiciousPatterns.set(userId, existing);

    // Logger pour monitoring
    console.warn('Suspicious activity detected:', {
      userId,
      pattern: pattern.type,
      severity: pattern.severity,
      timestamp: pattern.timestamp,
      details: pattern.details
    });

    // Déclencher des alertes pour les patterns sévères
    if (pattern.severity === 'HIGH') {
      this.triggerSecurityAlert(userId, pattern);
    }
  }

  /**
   * Déclenche une alerte de sécurité
   */
  private triggerSecurityAlert(userId: string, pattern: SuspiciousPattern): void {
    // Dans un vrai système, on enverrait des notifications
    console.error('SECURITY ALERT:', {
      userId,
      pattern: pattern.type,
      timestamp: pattern.timestamp,
      details: pattern.details
    });

    // Possibles actions automatiques :
    // - Bloquer temporairement l'utilisateur
    // - Demander une vérification CAPTCHA
    // - Notifier les administrateurs
    // - Augmenter le niveau de monitoring
  }

  /**
   * Obtient les statistiques d'activité suspecte
   */
  getSuspiciousActivity(userId: string): SuspiciousPattern[] {
    return this.suspiciousPatterns.get(userId) || [];
  }

  /**
   * Vérifie si un utilisateur est actuellement suspect
   */
  isUserSuspicious(userId: string): boolean {
    const patterns = this.getSuspiciousActivity(userId);
    const recentPatterns = patterns.filter(p => Date.now() - p.timestamp < 60 * 60 * 1000); // 1 heure
    
    // Suspect si plus de 3 patterns récents ou 1 pattern HIGH récent
    return recentPatterns.length > 3 || 
           recentPatterns.some(p => p.severity === 'HIGH' && Date.now() - p.timestamp < 15 * 60 * 1000);
  }

  /**
   * Bloque temporairement un utilisateur
   */
  temporaryBlock(userId: string, durationMs: number = 15 * 60 * 1000): void {
    const blockKey = `block:${userId}`;
    this.cache.set(blockKey, { blocked: true, until: Date.now() + durationMs } as any);
    
    console.warn(`User ${userId} temporarily blocked for ${durationMs}ms`);
  }

  /**
   * Vérifie si un utilisateur est bloqué
   */
  isBlocked(userId: string): boolean {
    const blockKey = `block:${userId}`;
    const blockInfo = this.cache.get(blockKey) as any;
    
    if (!blockInfo) return false;
    
    if (Date.now() >= blockInfo.until) {
      this.cache.delete(blockKey);
      return false;
    }
    
    return true;
  }

  /**
   * Nettoie les données anciennes
   */
  cleanup(): void {
    // Le LRUCache se nettoie automatiquement
    console.log('Rate limiter cleanup completed');
  }

  /**
   * Obtient les statistiques globales
   */
  getStats(): any {
    return {
      cacheSize: this.cache.size,
      suspiciousPatternsCount: this.suspiciousPatterns.size,
      configuredActions: Array.from(this.configs.keys()),
    };
  }
}

// Instance singleton
export const rateLimiter = new GameRateLimiter();

/**
 * Middleware pour tRPC
 */
export function checkRateLimit(
  userId: string,
  action: string,
  ip?: string,
  metadata?: any
): void {
  // Vérifier si l'utilisateur est bloqué
  if (rateLimiter.isBlocked(userId)) {
    throw new Error('Utilisateur temporairement bloqué pour activité suspecte');
  }

  // Vérifier les limites
  const result = rateLimiter.checkLimit(userId, action, ip, metadata);
  
  if (!result.allowed) {
    const message = result.suspicious 
      ? 'Limite dépassée - activité suspecte détectée'
      : 'Trop de requêtes - veuillez patienter';
    
    throw new Error(message);
  }

  // Bloquer automatiquement si activité très suspecte
  if (result.suspicious && rateLimiter.isUserSuspicious(userId)) {
    rateLimiter.temporaryBlock(userId);
    throw new Error('Activité suspecte détectée - compte temporairement suspendu');
  }
} 