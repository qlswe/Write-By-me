import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager, 
  memoryLocalCache 
} from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

// Configure robust localCache settings to eliminate "FIRESTORE INTERNAL ASSERTION FAILED"
// and "TypeError: Cannot read properties of null (reading 'Te')" lock-acquisition crashes.
// These crashes occur when multi-tab locking (persistentMultipleTabManager) is blocked by
// partitioned storage inside iframe sandboxes (e.g. AI Studio previews) or private-browsing frames.
let localCacheConfig;
try {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  if (isIframe) {
    console.log('[Firebase Init] Running inside an iframe. Initializing memoryLocalCache to bypass iframe storage-lock restrictions.');
    localCacheConfig = memoryLocalCache();
  } else {
    console.log('[Firebase Init] Initializing persistentLocalCache with persistentSingleTabManager.');
    localCacheConfig = persistentLocalCache({
      tabManager: persistentSingleTabManager({})
    });
  }
} catch (err) {
  console.warn('[Firebase Init] Offline cache initialization failed. Falling back to memoryLocalCache:', err);
  localCacheConfig = memoryLocalCache();
}

export const db = initializeFirestore(app, {
  localCache: localCacheConfig,
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

const rtdbUrl = 'https://wbm-static-default-rtdb.europe-west1.firebasedatabase.app';
export const rtdb = getDatabase(app, rtdbUrl);

