/**
 * IndexedDB Local Avatar Cache Utility
 * Prevents redundant network re-fetching of user avatars across chat sessions, comments, and profile lists.
 */

const DB_NAME = 'AhaAvatarCacheDB';
const DB_VERSION = 1;
const STORE_NAME = 'avatars';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days TTL

interface CachedAvatarEntry {
  url: string;
  blob: Blob;
  contentType: string;
  timestamp: number;
}

class AvatarCache {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private objectUrlMap = new Map<string, string>(); // url -> objectUrl memory map

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Retrieve cached avatar Object URL from IndexedDB, or fetch & cache from network.
   */
  async getAvatarUrl(url: string | undefined | null): Promise<string> {
    if (!url) return '';

    // Direct data URIs or local blobs don't need IndexedDB caching
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }

    // Check memory map first for ultra-fast render
    if (this.objectUrlMap.has(url)) {
      return this.objectUrlMap.get(url)!;
    }

    try {
      const db = await this.getDB();
      const entry = await this.getFromIDB(db, url);

      const now = Date.now();
      if (entry && (now - entry.timestamp < CACHE_TTL_MS)) {
        const objectUrl = URL.createObjectURL(entry.blob);
        this.objectUrlMap.set(url, objectUrl);
        return objectUrl;
      }

      // Not cached or stale: fetch from network
      const fetchedBlob = await this.fetchAndCache(db, url);
      if (fetchedBlob) {
        const objectUrl = URL.createObjectURL(fetchedBlob);
        this.objectUrlMap.set(url, objectUrl);
        return objectUrl;
      }
    } catch (e) {
      // Quietly fall back to raw network URL if IndexedDB or fetch fails
    }

    return url;
  }

  private getFromIDB(db: IDBDatabase, url: string): Promise<CachedAvatarEntry | null> {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(url);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async fetchAndCache(db: IDBDatabase, url: string): Promise<Blob | null> {
    try {
      const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
      if (!response.ok) return null;

      const blob = await response.blob();
      const entry: CachedAvatarEntry = {
        url,
        blob,
        contentType: blob.type || 'image/png',
        timestamp: Date.now()
      };

      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(entry);

      return blob;
    } catch {
      return null;
    }
  }

  /**
   * Clear all cached avatars from IndexedDB & free memory
   */
  async clearCache(): Promise<void> {
    this.objectUrlMap.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    this.objectUrlMap.clear();

    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    } catch {
      // ignore
    }
  }

  /**
   * Return number of cached avatars in IndexedDB
   */
  async getCacheSize(): Promise<number> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }
}

export const avatarCache = new AvatarCache();
