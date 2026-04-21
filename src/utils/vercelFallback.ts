import { getDatabase, ref, push, get as rtdbGet, set as rtdbSet, query, limitToLast } from 'firebase/database';
import { app } from '../firebase';

let dbFallback: ReturnType<typeof getDatabase> | null = null;
let consecutiveFailures = 0;
let circuitBreakerTripped = false;

try {
  // To avoid errors if RTDB is not enabled immediately, we still initialize it.
  // We use a custom URL in case it's not present in the config, guessing by project ID.
  const rtdbUrl = 'https://wbm-static-default-rtdb.europe-west1.firebasedatabase.app';
  dbFallback = getDatabase(app, rtdbUrl);
} catch (e) {
  console.error("Failed to initialize RTDB fallback", e);
}

const handleDbError = (err: any) => {
  console.warn("RTDB Fallback connection error:", err);
  consecutiveFailures++;
  if (consecutiveFailures >= 3) {
    console.error("Fallback circuit breaker tripped. Disabling.");
    circuitBreakerTripped = true;
    window.dispatchEvent(new CustomEvent('aha_toast', { detail: 'Fallback is unavailable. Reverting to Firestore.' }));
    localStorage.removeItem('aha_quota_fallback'); 
  }
};

export const vercelFallback = {
  isAvailable: () => !!dbFallback && !circuitBreakerTripped && !!localStorage.getItem('aha_quota_fallback'),
  isConfigured: () => !!dbFallback && !circuitBreakerTripped,
  
  async get(key: string) {
    if (!this.isAvailable()) return null;
    try {
      const dbRef = ref(dbFallback!, `fallback/${key.replace(/[:.#$[\]]/g, '_')}`);
      const snapshot = await rtdbGet(dbRef);
      consecutiveFailures = 0;
      return snapshot.val();
    } catch(e) {
      handleDbError(e);
      return null;
    }
  },
  
  async set(key: string, value: any) {
    if (!this.isAvailable()) return;
    try {
      const dbRef = ref(dbFallback!, `fallback/${key.replace(/[:.#$[\]]/g, '_')}`);
      await rtdbSet(dbRef, value);
      consecutiveFailures = 0;
    } catch(e) {
      handleDbError(e);
    }
  },

  async lpush(key: string, value: any) {
    if (!this.isAvailable()) return;
    try {
      const dbRef = ref(dbFallback!, `fallback/${key.replace(/[:.#$[\]]/g, '_')}`);
      await push(dbRef, value);
      consecutiveFailures = 0;
    } catch(e) {
      handleDbError(e);
    }
  },

  async lrange(key: string, start: number, stop: number) {
    if (!this.isAvailable()) return [];
    try {
      const dbRef = ref(dbFallback!, `fallback/${key.replace(/[:.#$[\]]/g, '_')}`);
      const q = query(dbRef, limitToLast(stop + 1));
      const snapshot = await rtdbGet(q);
      consecutiveFailures = 0;
      if (!snapshot.exists()) return [];
      
      const results: any[] = [];
      snapshot.forEach((child) => {
        results.push(child.val());
      });
      // push appends to the end. lrange 0, stop from upstash returned newest first if we used lpush.
      // So we reverse the chronological RTDB results.
      return results.reverse();
    } catch(e) {
      handleDbError(e);
      return [];
    }
  }
};
