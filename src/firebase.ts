import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  initializeFirestore, 
  memoryLocalCache 
} from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

// Set local cache to memoryLocalCache to eliminate "FIRESTORE INTERNAL ASSERTION FAILED"
// and "TypeError: Cannot read properties of null (reading 'Te')" crashes.
// These crashes are caused by IndexedDB corruption, partitioned storage limitations in browsers,
// and browser-specific bugs in persistentLocalCache. Memory-based cache is 100% stable,
// private-browsing safe, and iframe-friendly.
const localCacheConfig = memoryLocalCache();

export const db = initializeFirestore(app, {
  localCache: localCacheConfig,
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

// Cleanly delete any legacy persistent cache databases directly via browser native IndexedDB API
// to free up disk space and sweep away any corrupted databases from previous versions.
if (typeof window !== 'undefined' && window.indexedDB && typeof window.indexedDB.databases === 'function') {
  try {
    window.indexedDB.databases()
      .then((dbs) => {
        dbs.forEach((dbInfo) => {
          if (dbInfo.name && dbInfo.name.startsWith('firestore/')) {
            console.log(`[Firebase Init] Deleting legacy persistent cache database: ${dbInfo.name}`);
            window.indexedDB.deleteDatabase(dbInfo.name);
          }
        });
      })
      .catch((err) => {
        console.warn('[Firebase Init] Non-blocking legacy IndexedDB databases listing failed:', err);
      });
  } catch (err) {
    console.warn('[Firebase Init] Non-blocking legacy IndexedDB setup failed:', err);
  }
}

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });


const rtdbUrl = 'https://wbm-static-default-rtdb.europe-west1.firebasedatabase.app';
export const rtdb = getDatabase(app, rtdbUrl);


