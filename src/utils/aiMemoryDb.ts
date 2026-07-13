import { db } from '../firebase';
import { doc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './errorHandlers';

export interface AiMemory {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  response: string;
  createdAt: number;
  synced?: boolean;
}

export interface SyncQueueItem {
  id?: number;
  actionType: 'create' | 'delete';
  userId: string;
  data: any; // Contains the full AiMemory object for 'create' or just the string id for 'delete'
  createdAt: number;
}

const DB_NAME = 'AhaAiMemoryDB';
const DB_VERSION = 1;

/**
 * Native IndexedDB Initialization
 */
export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store for AI Memories
      if (!db.objectStoreNames.contains('ai_memories')) {
        db.createObjectStore('ai_memories', { keyPath: 'id' });
      }
      
      // Store for offline operations queue
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Save memory locally in IndexedDB
 */
export async function saveMemoryLocal(memory: AiMemory): Promise<void> {
  const dbInstance = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction('ai_memories', 'readwrite');
    const store = transaction.objectStore('ai_memories');
    const request = store.put(memory);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete memory locally from IndexedDB
 */
export async function deleteMemoryLocal(id: string): Promise<void> {
  const dbInstance = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction('ai_memories', 'readwrite');
    const store = transaction.objectStore('ai_memories');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Fetch all local memories for a specific user from IndexedDB
 */
export async function getLocalMemories(userId: string): Promise<AiMemory[]> {
  const dbInstance = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction('ai_memories', 'readonly');
    const store = transaction.objectStore('ai_memories');
    const request = store.getAll();

    request.onsuccess = () => {
      const allMemories = request.result as AiMemory[];
      // Filter by userId
      resolve(allMemories.filter(m => m.userId === userId).sort((a, b) => b.createdAt - a.createdAt));
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add an action to the synchronization queue
 */
export async function addToSyncQueue(actionType: 'create' | 'delete', userId: string, data: any): Promise<void> {
  const dbInstance = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction('sync_queue', 'readwrite');
    const store = transaction.objectStore('sync_queue');
    const item: SyncQueueItem = {
      actionType,
      userId,
      data,
      createdAt: Date.now()
    };
    const request = store.add(item);

    request.onsuccess = () => {
      console.log(`[Offline Sync] Added ${actionType} action to the offline sync queue.`);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all sync items for a user
 */
export async function getSyncQueue(userId: string): Promise<SyncQueueItem[]> {
  const dbInstance = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction('sync_queue', 'readonly');
    const store = transaction.objectStore('sync_queue');
    const request = store.getAll();

    request.onsuccess = () => {
      const items = request.result as SyncQueueItem[];
      resolve(items.filter(item => item.userId === userId));
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete an item from the sync queue
 */
export async function deleteSyncQueueItem(id: number): Promise<void> {
  const dbInstance = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction('sync_queue', 'readwrite');
    const store = transaction.objectStore('sync_queue');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Replays all queued actions to Firebase when connection restores
 */
export async function syncOfflineData(userId: string, onSyncProgress?: () => void): Promise<void> {
  if (!navigator.onLine) {
    console.log('[Offline Sync] Sync aborted - browser is currently offline.');
    return;
  }

  const queue = await getSyncQueue(userId);
  if (queue.length === 0) {
    return;
  }

  console.log(`[Offline Sync] Processing ${queue.length} offline operations for user: ${userId}`);

  for (const item of queue) {
    try {
      if (item.actionType === 'create') {
        const memory = item.data as AiMemory;
        // Strip out the 'synced' field for FireStore
        const { synced, ...firestorePayload } = memory;
        
        await setDoc(doc(db, 'ai_memories', memory.id), firestorePayload);
        
        // Mark as synced locally
        await saveMemoryLocal({ ...memory, synced: true });
        console.log(`[Offline Sync] Synchronized created memory: ${memory.id}`);
      } else if (item.actionType === 'delete') {
        const memoryId = item.data as string;
        await deleteDoc(doc(db, 'ai_memories', memoryId));
        console.log(`[Offline Sync] Synchronized deleted memory: ${memoryId}`);
      }

      // Remove from queue
      if (item.id !== undefined) {
        await deleteSyncQueueItem(item.id);
      }
    } catch (error) {
      console.error('[Offline Sync] Error executing sync item:', error);
      // If permission error or other permanent fail, remove from queue to avoid blockages
      if (error instanceof Error && (error.message.includes('permission') || error.message.includes('Permission'))) {
        if (item.id !== undefined) {
          await deleteSyncQueueItem(item.id);
        }
      }
      break; // stop replaying queue on connection errors
    }
  }

  if (onSyncProgress) {
    onSyncProgress();
  }
}

/**
 * Double-sync of Firebase memories down to IndexedDB for offline access
 */
export async function pullMemoriesFromFirebase(userId: string): Promise<AiMemory[]> {
  if (!navigator.onLine) {
    return getLocalMemories(userId);
  }

  try {
    const q = query(collection(db, 'ai_memories'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const remoteMemories: AiMemory[] = [];

    snapshot.forEach((docSnapshot) => {
      remoteMemories.push({ ...docSnapshot.data(), id: docSnapshot.id } as AiMemory);
    });

    // Save fetched items to IndexedDB
    for (const memory of remoteMemories) {
      await saveMemoryLocal({ ...memory, synced: true });
    }

    return getLocalMemories(userId);
  } catch (err) {
    console.warn('[Offline Sync] Failed to pull from Firestore, using local data', err);
    return getLocalMemories(userId);
  }
}

/**
 * Automatically clear local memories older than 7 days to maintain performance.
 * We only clear memories that have been successfully synced (synced === true)
 * so that we don't accidentally delete unsynced offline data.
 */
export async function clearOldLocalMemories(daysLimit: number = 7): Promise<number> {
  const dbInstance = await openDb();
  const cutoffTime = Date.now() - (daysLimit * 24 * 60 * 60 * 1000);
  let clearedCount = 0;

  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction('ai_memories', 'readwrite');
    const store = transaction.objectStore('ai_memories');
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        const memory = cursor.value as AiMemory;
        // Clean up if older than daysLimit AND is already synced
        if (memory.createdAt < cutoffTime && memory.synced === true) {
          cursor.delete();
          clearedCount++;
        }
        cursor.continue();
      } else {
        if (clearedCount > 0) {
          console.log(`[Offline Sync] Cleared ${clearedCount} local memories older than ${daysLimit} days to maintain performance.`);
        }
        resolve(clearedCount);
      }
    };

    request.onerror = (event) => {
      console.error('[Offline Sync] Error clearing old local memories:', request.error);
      reject(request.error);
    };
  });
}

