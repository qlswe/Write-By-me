import { doc, getDoc, setDoc, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { vercelFallback } from './vercelFallback';
import { logger } from './logger';

/**
 * DB Query Management Core
 * Optimizes database operations based on network state, quota status, caching, and batching.
 */
class DbQueryCore {
  private cache = new Map<string, { data: any; expiry: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private profileBatchQueue = new Map<string, ((data: any) => void)[]>();
  private batchTimeout: NodeJS.Timeout | null = null;
  
  // Optimization Factors
  private factors = {
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    quotaExceeded: false,
    consecutiveFailures: 0,
    latencyThresholdMs: 1500,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.factors.isOffline = false;
        logger.system('Network online: Re-evaluating DB factors.');
      });
      window.addEventListener('offline', () => {
        this.factors.isOffline = true;
        logger.system('Network offline: Enforcing local/RTDB bypass.');
      });
      
      // Load fallback status
      this.factors.quotaExceeded = localStorage.getItem('aha_quota_fallback') === 'true';
    }
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
   * Optimizes reading a document by checking cache, batching parallel calls,
   * and dynamically choosing between Firestore and backup RTDB.
   */
  public async getDocument(
    collectionName: string,
    docId: string,
    cacheTtlMs: number = 30000 // 30s default cache TTL
  ): Promise<any> {
    const cacheKey = `${collectionName}/${docId}`;
    
    // 1. Check local cache first to save read operations
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      logger.perf(`Cache Hit: ${cacheKey}`, null, 'DbQueryCore');
      return cached.data;
    }

    // 2. De-duplicate identical pending requests to prevent parallel read amplification
    if (this.pendingRequests.has(cacheKey)) {
      logger.perf(`De-duplicating request: ${cacheKey}`, null, 'DbQueryCore');
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
    const startTime = performance.now();

    // 3. Select datasource depending on factors
    const useFallback = this.factors.isOffline || this.factors.quotaExceeded || vercelFallback.isAvailable();

    if (useFallback && vercelFallback.isAvailable()) {
      try {
        logger.system(`Bypassing Firestore -> Fetching ${collectionName}/${docId} from RTDB`);
        const dataStr = await vercelFallback.get(`cache:${collectionName}:${docId}`);
        if (dataStr) {
          const parsed = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
          this.cache.set(cacheKey, { data: parsed, expiry: Date.now() + cacheTtlMs });
          return parsed;
        }
      } catch (e) {
        logger.warn(`RTDB query failed for ${cacheKey}`, e, 'DbQueryCore');
      }
    }

    // 4. Standard Firestore fetch with auto-routing & latency tracking
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      const latency = performance.now() - startTime;
      
      logger.perf(`Firestore Query latency: ${latency.toFixed(1)}ms for ${cacheKey}`, null, 'DbQueryCore');
      
      // If latency is extremely high, flag it
      if (latency > this.factors.latencyThresholdMs) {
        logger.warn(`Slow query detected (${latency.toFixed(0)}ms). Consider pre-fetching or cache extensions.`);
      }

      this.factors.consecutiveFailures = 0;

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.cache.set(cacheKey, { data, expiry: Date.now() + cacheTtlMs });
        
        // Sync back to Vercel RTDB silently to keep cache warm
        if (vercelFallback.isAvailable()) {
          vercelFallback.set(`cache:${collectionName}:${docId}`, JSON.stringify(data)).catch(() => {});
        }
        
        return data;
      }
      return null;
    } catch (error: any) {
      this.factors.consecutiveFailures++;
      logger.error(`Error reading ${cacheKey}`, error, 'DbQueryCore');

      // Detect Quota Exceeded
      if (error.message?.includes('Quota exceeded') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        this.setQuotaExceeded(true);
        window.dispatchEvent(new CustomEvent('aha_toast', {
          detail: 'Достигнуты лимиты БД! Автоматически включен резервный обход.'
        }));
      }

      // If consecutive failures are too high, trigger fallback
      if (this.factors.consecutiveFailures >= 3 && !this.factors.quotaExceeded) {
        logger.warn('Multiple consecutive database failures. Enabling safety bypass mode.');
      }

      // Final fallback to stale cache if database is down entirely
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.system(`Database down. Returning stale cache for ${cacheKey}`);
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
    const cacheKey = `${collectionName}/${docId}`;
    
    // Update local cache instantly for optimistic UI response
    const currentCached = this.cache.get(cacheKey)?.data || {};
    const mergedData = merge ? { ...currentCached, ...data } : data;
    this.cache.set(cacheKey, { data: mergedData, expiry: Date.now() + 60000 }); // 1 min optimistic hold

    // background sync to RTDB if available
    if (vercelFallback.isAvailable()) {
      vercelFallback.set(`cache:${collectionName}:${docId}`, JSON.stringify(mergedData)).catch(() => {});
    }

    if (this.factors.isOffline) {
      logger.system(`Write deferred: Offline. Storing optimistic state for ${cacheKey}`);
      return;
    }

    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data, { merge });
      this.factors.consecutiveFailures = 0;
    } catch (error: any) {
      logger.error(`Error writing document ${cacheKey}`, error, 'DbQueryCore');
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
    return new Promise((resolve) => {
      const cacheKey = `public_profiles/${uid}`;
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
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

    logger.perf(`Batching ${currentQueue.size} user profile requests together`, null, 'DbQueryCore');

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
