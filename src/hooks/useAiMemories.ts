import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  AiMemory, 
  saveMemoryLocal, 
  deleteMemoryLocal, 
  getLocalMemories, 
  addToSyncQueue, 
  syncOfflineData, 
  pullMemoriesFromFirebase,
  clearOldLocalMemories
} from '../utils/aiMemoryDb';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { generatePrefixedId } from '../utils/idGenerator';

export const useAiMemories = () => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<AiMemory[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Background IndexedDB performance auto-cleanup of memories older than 7 days
  useEffect(() => {
    if (!user) return;
    
    const runAutoCleanup = async () => {
      try {
        const clearedCount = await clearOldLocalMemories(7);
        if (clearedCount > 0) {
          const updated = await getLocalMemories(user.uid);
          setMemories(updated);
        }
      } catch (err) {
        console.error('Failed to run automatic IndexedDB cleanup:', err);
      }
    };

    // Run cleanup as a low-priority background task
    const timer = setTimeout(runAutoCleanup, 1000);
    return () => clearTimeout(timer);
  }, [user]);

  // Load memories initially
  const loadMemories = useCallback(async () => {
    if (!user) return;
    try {
      // Pull remote memories when online to update local cache
      const loaded = await pullMemoriesFromFirebase(user.uid);
      setMemories(loaded);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  }, [user]);

  // Sync queue runner
  const runSync = useCallback(async () => {
    if (!user || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      await syncOfflineData(user.uid);
      // Reload memories after sync
      const updated = await getLocalMemories(user.uid);
      setMemories(updated);
    } catch (err) {
      console.error('Error during offline memories sync:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Sync effect and network listener
  useEffect(() => {
    if (!user) {
      setMemories([]);
      return;
    }

    loadMemories();

    // Setup network listeners
    const handleOnline = () => {
      setIsOffline(false);
      runSync();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check and trigger sync if online
    if (navigator.onLine) {
      runSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, loadMemories, runSync]);

  // Save interaction to memory
  const saveMemory = useCallback(async (promptText: string, responseText: string, customTitle?: string) => {
    if (!user) return;

    const memoryId = generatePrefixedId('mem');
    const title = customTitle?.trim() || promptText.slice(0, 30).trim() + (promptText.length > 30 ? '...' : '');

    const newMemory: AiMemory = {
      id: memoryId,
      userId: user.uid,
      title,
      prompt: promptText,
      response: responseText,
      createdAt: Date.now(),
      synced: false
    };

    // Optimistic UI update
    setMemories(prev => [newMemory, ...prev]);

    // Save locally to IndexedDB first
    await saveMemoryLocal(newMemory);

    if (navigator.onLine) {
      try {
        // Direct save to Firebase Firestore
        const { synced, ...firestorePayload } = newMemory;
        await setDoc(doc(db, 'ai_memories', memoryId), firestorePayload);
        
        // Mark as synced
        await saveMemoryLocal({ ...newMemory, synced: true });
        
        // Update local state synced flag
        setMemories(prev => prev.map(m => m.id === memoryId ? { ...m, synced: true } : m));
      } catch (err) {
        console.warn('Failed to save to Firebase, queueing for later sync:', err);
        // Queue it for background sync
        await addToSyncQueue('create', user.uid, newMemory);
      }
    } else {
      // Queue it for background sync
      await addToSyncQueue('create', user.uid, newMemory);
    }
  }, [user]);

  // Delete a saved memory
  const deleteMemory = useCallback(async (memoryId: string) => {
    if (!user) return;

    // Optimistic UI update
    setMemories(prev => prev.filter(m => m.id !== memoryId));

    // Remove locally from IndexedDB
    await deleteMemoryLocal(memoryId);

    if (navigator.onLine) {
      try {
        await deleteDoc(doc(db, 'ai_memories', memoryId));
      } catch (err) {
        console.warn('Failed to delete from Firebase, queueing for later sync:', err);
        await addToSyncQueue('delete', user.uid, memoryId);
      }
    } else {
      await addToSyncQueue('delete', user.uid, memoryId);
    }
  }, [user]);

  // Update a saved memory title
  const updateMemoryTitle = useCallback(async (memoryId: string, newTitle: string) => {
    if (!user || !newTitle.trim()) return;

    let updatedMemory: AiMemory | null = null;

    setMemories(prev => prev.map(m => {
      if (m.id === memoryId) {
        updatedMemory = { ...m, title: newTitle.trim(), synced: false };
        return updatedMemory;
      }
      return m;
    }));

    if (!updatedMemory) return;

    // Save locally
    await saveMemoryLocal(updatedMemory);

    if (navigator.onLine) {
      try {
        const { synced, ...firestorePayload } = updatedMemory;
        await setDoc(doc(db, 'ai_memories', memoryId), firestorePayload);
        
        // Mark as synced
        await saveMemoryLocal({ ...updatedMemory, synced: true });
        setMemories(prev => prev.map(m => m.id === memoryId ? { ...m, synced: true } : m));
      } catch (err) {
        console.warn('Failed to update memory in Firebase, queueing for sync:', err);
        await addToSyncQueue('create', user.uid, updatedMemory);
      }
    } else {
      await addToSyncQueue('create', user.uid, updatedMemory);
    }
  }, [user]);

  return {
    memories,
    saveMemory,
    deleteMemory,
    updateMemoryTitle,
    isSyncing,
    isOffline,
    sync: runSync
  };
};
