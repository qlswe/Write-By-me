import { doc, getDoc, setDoc, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { vercelFallback } from './vercelFallback';
import { logger } from './logger';

interface CollectionStat {
  totalTimeMs: number;
  count: number;
  maxTimeMs: number;
}

interface SlowQuery {
  path: string;
  latencyMs: number;
  timestamp: string;
}

/**
 * DB Query Management Core
 * Optimizes database operations based on network state, quota status, caching, and batching.
 * Includes precise query latency monitoring, cache statistics, and query bottleneck analysis.
 */
class DbQueryCore {
  private cache = new Map<string, { data: any; expiry: number; lastAccessed: number }>();
  private readonly MAX_CACHE_SIZE = 150;
  private pendingRequests = new Map<string, Promise<any>>();
  private profileBatchQueue = new Map<string, ((data: any) => void)[]>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private gcInterval: NodeJS.Timeout | null = null;
  
  // Performance & bottleneck statistics
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    rtdbBypasses: 0,
    collectionStats: new Map<string, CollectionStat>(),
    slowQueries: [] as SlowQuery[],
  };

  // Optimization Factors
  private factors = {
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    quotaExceeded: false,
    consecutiveFailures: 0,
    latencyThresholdMs: 300, // Reduced default slow threshold for modern reactive UI (300ms)
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.factors.isOffline = false;
        console.log('%c[DbQueryCore] Network online: Re-evaluating DB factors.', 'color: #50fa7b; font-weight: bold;');
      });
      window.addEventListener('offline', () => {
        this.factors.isOffline = true;
        console.log('%c[DbQueryCore] Network offline: Enforcing local/RTDB bypass.', 'color: #ff5555; font-weight: bold;');
      });
      
      // Load fallback status
      this.factors.quotaExceeded = localStorage.getItem('aha_quota_fallback') === 'true';

      // Start periodic background memory pruning every 60 seconds
      this.gcInterval = setInterval(() => {
        this.pruneExpiredCache();
      }, 60000);

      // Expose diagnostic tools on the window object for easy optimization review
      (window as any).getDbQueryStats = () => {
        return {
          overview: {
            totalRequests: this.stats.totalRequests,
            cacheHits: this.stats.cacheHits,
            cacheMisses: this.stats.cacheMisses,
            cacheHitRatio: this.stats.totalRequests > 0 
              ? `${((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(1)}%` 
              : '0%',
            rtdbBypasses: this.stats.rtdbBypasses,
            offlineMode: this.factors.isOffline,
            quotaExceeded: this.factors.quotaExceeded,
            consecutiveFailures: this.factors.consecutiveFailures,
            cacheSize: this.cache.size,
          },
          collectionBreakdown: Object.fromEntries(
            Array.from(this.stats.collectionStats.entries()).map(([col, data]) => [
              col,
              {
                queriesCount: data.count,
                averageLatencyMs: (data.totalTimeMs / data.count).toFixed(1) + 'ms',
                maxLatencyMs: data.maxTimeMs.toFixed(1) + 'ms',
              }
            ])
          ),
          topBottlenecks: [...this.stats.slowQueries]
            .sort((a, b) => b.latencyMs - a.latencyMs)
            .slice(0, 10),
        };
      };
    }
  }

  /**
   * Memory usage cleanup: prune expired cache entries and enforce MAX_CACHE_SIZE
   */
  public pruneExpiredCache(): number {
    const now = Date.now();
    let prunedCount = 0;
    
    // 1. Remove expired entries
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry <= now) {
        this.cache.delete(key);
        prunedCount++;
      }
    }

    // 2. If still exceeding MAX_CACHE_SIZE, evict LRU (least recently accessed) entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].lastAccessed - b[1].lastAccessed
      );
      const toEvict = this.cache.size - this.MAX_CACHE_SIZE;
      for (let i = 0; i < toEvict; i++) {
        if (sortedEntries[i]) {
          this.cache.delete(sortedEntries[i][0]);
          prunedCount++;
        }
      }
    }

    if (prunedCount > 0) {
      console.log(
        `%c[DbQueryCore 🧹 GC] Pruned ${prunedCount} cache items. Current cache size: ${this.cache.size}/${this.MAX_CACHE_SIZE}`,
        'color: #8be9fd; font-family: monospace; font-size: 11px;'
      );
    }
    return prunedCount;
  }

  /**
   * Clear all memory caches
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('%c[DbQueryCore] All memory caches cleared.', 'color: #8be9fd;');
  }

  /**
   * Set the quota exceeded state
   */
  public setQuotaExceeded(status: boolean) {
    this.factors.quotaExceeded = status;
    if (status) {
      localStorage.setItem('aha_quota_fallback', 'true');
    } else {
      localStorage.removeItem('aha_quota_fallback');
    }
  }

  /**
   * Track latency statistics for a query
   */
  private recordLatency(collectionName: string, docId: string, latencyMs: number) {
    // 1. Update collection stats
    const current = this.stats.collectionStats.get(collectionName) || { totalTimeMs: 0, count: 0, maxTimeMs: 0 };
    current.totalTimeMs += latencyMs;
    current.count += 1;
    if (latencyMs > current.maxTimeMs) {
      current.maxTimeMs = latencyMs;
    }
    this.stats.collectionStats.set(collectionName, current);

    // 2. Track bottlenecks if it exceeds 300ms
    if (latencyMs > this.factors.latencyThresholdMs) {
      const slowQueryEntry: SlowQuery = {
        path: `${collectionName}/${docId}`,
        latencyMs,
        timestamp: new Date().toISOString()
      };
      this.stats.slowQueries.push(slowQueryEntry);
      
      // Keep only top 50 slow queries
      if (this.stats.slowQueries.length > 50) {
        this.stats.slowQueries.shift();
      }

      console.warn(
        `%c[DbQueryCore ⚠️ SLOW QUERY] ${collectionName}/${docId} took ${latencyMs.toFixed(1)}ms. This is a potential performance bottleneck!`,
        'color: #ffb86c; font-weight: bold;'
      );
    }
  }

  /**
   * Optimizes reading a document by checking cache, batching parallel calls,
   * and dynamically choosing between Firestore and backup RTDB.
   */
  public async getDocument(
    collectionName: string,
    docId: string,
    cacheTtlMs: number = 30000 // 30s default cache TTL
  ): Promise<any> {
    // Critical Guard: Prevent invalid document path errors (odd segments count)
    if (!docId || typeof docId !== 'string' || docId.trim() === '') {
      console.warn(
        `%c[DbQueryCore 🛡️ Guarded] Intercepted invalid document read. Collection: '${collectionName}', DocId: '${docId}'. Returning null to prevent app crash.`,
        'color: #ff79c6; font-weight: bold;'
      );
      return null;
    }

    this.stats.totalRequests += 1;
    const cacheKey = `${collectionName}/${docId}`;
    
    // 1. Check local cache first to save read operations
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      cached.lastAccessed = Date.now();
      this.stats.cacheHits += 1;
      // Beautiful fast performance log
      console.log(
        `%c[DbQueryCore ⚡ CACHE HIT] ${cacheKey} [0.0ms]`,
        'color: #50fa7b; font-family: monospace; font-size: 11px;'
      );
      return cached.data;
    }

    this.stats.cacheMisses += 1;

    // 2. De-duplicate identical pending requests to prevent parallel read amplification
    if (this.pendingRequests.has(cacheKey)) {
      console.log(
        `%c[DbQueryCore 🔄 DE-DUPLICATED] Joining existing request for ${cacheKey}`,
        'color: #8be9fd; font-family: monospace; font-size: 11px;'
      );
      return this.pendingRequests.get(cacheKey);
    }

    const requestPromise = this.executeGet(collectionName, docId, cacheTtlMs, cacheKey);
    this.pendingRequests.set(cacheKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async executeGet(
    collectionName: string,
    docId: string,
    cacheTtlMs: number,
    cacheKey: string
  ): Promise<any> {
    if (!docId || typeof docId !== 'string' || docId.trim() === '') {
      return null;
    }

    const startTime = performance.now();

    // 3. Select datasource depending on factors
    const useFallback = this.factors.isOffline || this.factors.quotaExceeded || vercelFallback.isAvailable();

    if (useFallback && vercelFallback.isAvailable()) {
      try {
        const dataStr = await vercelFallback.get(`cache:${collectionName}:${docId}`);
        if (dataStr) {
          const parsed = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
          this.cache.set(cacheKey, { data: parsed, expiry: Date.now() + cacheTtlMs, lastAccessed: Date.now() });
          this.stats.rtdbBypasses += 1;
          
          const latency = performance.now() - startTime;
          this.recordLatency(collectionName, docId, latency);
          
          console.log(
            `%c[DbQueryCore 🍃 RTDB FALLBACK] Fetch completed for ${cacheKey} in ${latency.toFixed(1)}ms`,
            'color: #f1fa8c; font-family: monospace; font-size: 11px;'
          );
          return parsed;
        }
      } catch (e) {
        console.error(`[DbQueryCore] RTDB fallback query failed for ${cacheKey}`, e);
      }
    }

    // 4. Standard Firestore fetch with auto-routing & latency tracking
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      const latency = performance.now() - startTime;
      
      this.recordLatency(collectionName, docId, latency);
      
      console.log(
        `%c[DbQueryCore 🔥 FIRESTORE MISS] Fetch completed for ${cacheKey} in ${latency.toFixed(1)}ms`,
        'color: #ffb86c; font-family: monospace; font-size: 11px;'
      );

      this.factors.consecutiveFailures = 0;

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.cache.set(cacheKey, { data, expiry: Date.now() + cacheTtlMs, lastAccessed: Date.now() });
        
        // Sync back to Vercel RTDB silently to keep cache warm
        if (vercelFallback.isAvailable()) {
          vercelFallback.set(`cache:${collectionName}:${docId}`, JSON.stringify(data)).catch(() => {});
        }
        
        return data;
      }
      return null;
    } catch (error: any) {
      this.factors.consecutiveFailures++;
      console.error(`[DbQueryCore ❌ FIRESTORE ERROR] Reading ${cacheKey} failed:`, error);

      // Detect Quota Exceeded
      if (error.message?.includes('Quota exceeded') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        this.setQuotaExceeded(true);
        window.dispatchEvent(new CustomEvent('aha_toast', {
          detail: 'Достигнуты лимиты БД! Автоматически включен резервный обход.'
        }));
      }

      // If consecutive failures are too high, trigger fallback
      if (this.factors.consecutiveFailures >= 3 && !this.factors.quotaExceeded) {
        console.warn('[DbQueryCore] Multiple consecutive database failures. Enabling safety bypass mode.');
      }

      // Final fallback to stale cache if database is down entirely
      const cached = this.cache.get(cacheKey);
      if (cached) {
        cached.lastAccessed = Date.now();
        console.log(`%c[DbQueryCore 🩹 STALE CACHE] Database unavailable. Returning stale cache for ${cacheKey}`, 'color: #ff5555;');
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Optimized write operation with local cache updates and background syncing.
   */
  public async writeDocument(
    collectionName: string,
    docId: string,
    data: any,
    merge: boolean = true
  ): Promise<void> {
    // Critical Guard: Prevent invalid document path errors (odd segments count)
    if (!docId || typeof docId !== 'string' || docId.trim() === '') {
      console.warn(
        `%c[DbQueryCore 🛡️ Guarded] Intercepted invalid document write. Collection: '${collectionName}', DocId: '${docId}'. Blocked to prevent crash.`,
        'color: #ff79c6; font-weight: bold;'
      );
      throw new Error(`Invalid document ID for write operation: '${docId}'`);
    }

    const startTime = performance.now();
    const cacheKey = `${collectionName}/${docId}`;
    
    // Update local cache instantly for optimistic UI response
    const currentCached = this.cache.get(cacheKey)?.data || {};
    const mergedData = merge ? { ...currentCached, ...data } : data;
    this.cache.set(cacheKey, { data: mergedData, expiry: Date.now() + 60000, lastAccessed: Date.now() }); // 1 min optimistic hold

    // background sync to RTDB if available
    if (vercelFallback.isAvailable()) {
      vercelFallback.set(`cache:${collectionName}:${docId}`, JSON.stringify(mergedData)).catch(() => {});
    }

    if (this.factors.isOffline) {
      console.log(`%c[DbQueryCore 💤 DEFERRED WRITE] Offline. Cached locally: ${cacheKey}`, 'color: #ffb86c;');
      return;
    }

    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data, { merge });
      this.factors.consecutiveFailures = 0;
      
      const latency = performance.now() - startTime;
      console.log(
        `%c[DbQueryCore 📝 WRITE SUCCESS] ${cacheKey} written in ${latency.toFixed(1)}ms`,
        'color: #8be9fd; font-family: monospace; font-size: 11px;'
      );
    } catch (error: any) {
      console.error(`[DbQueryCore ❌ WRITE ERROR] Writing document ${cacheKey} failed:`, error);
      if (error.message?.includes('Quota exceeded') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        this.setQuotaExceeded(true);
      }
      throw error;
    }
  }

  /**
   * Batches multiple public profile requests to avoid sequential Firestore reads.
   * Collates calls made within a 15ms window into a single batch execution.
   */
  public getProfileBatched(uid: string): Promise<any> {
    if (!uid || typeof uid !== 'string' || uid.trim() === '') {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      const cacheKey = `public_profiles/${uid}`;
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        cached.lastAccessed = Date.now();
        this.stats.cacheHits += 1;
        this.stats.totalRequests += 1;
        resolve(cached.data);
        return;
      }

      const queue = this.profileBatchQueue.get(uid) || [];
      queue.push(resolve);
      this.profileBatchQueue.set(uid, queue);

      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      this.batchTimeout = setTimeout(() => this.processProfileBatchQueue(), 15);
    });
  }

  private async processProfileBatchQueue() {
    const currentQueue = new Map(this.profileBatchQueue);
    this.profileBatchQueue.clear();
    this.batchTimeout = null;

    if (currentQueue.size === 0) return;

    console.log(
      `%c[DbQueryCore 📦 BATCHING] Collated ${currentQueue.size} user profile requests together into a micro-batch`,
      'color: #bd93f9; font-weight: bold; font-family: monospace;'
    );

    // Fetch batch
    for (const [uid, resolvers] of currentQueue.entries()) {
      this.executeGet('public_profiles', uid, 60000, `public_profiles/${uid}`)
        .then((data) => {
          resolvers.forEach(resolve => resolve(data));
        })
        .catch(() => {
          resolvers.forEach(resolve => resolve(null));
        });
    }
  }
}

export const dbQueryCore = new DbQueryCore();
