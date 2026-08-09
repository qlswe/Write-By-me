import { collection, getDocs, deleteDoc, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from './logger';

/**
 * Collections to be cleared during platform reset.
 * NOTE: 'drawings', 'canvas', and admin documents in 'public_profiles' are explicitly PRESERVED.
 */
const TARGET_RESET_COLLECTIONS = [
  'comments',
  'forumPosts',
  'events',
  'theories',
  'promos',
  'telemetry',
  'chronicles',
  'chat_messages',
  'chats',
  'user_status'
];

export interface ResetStats {
  deletedDocsCount: number;
  collectionsCleared: string[];
  preservedAdminCount: number;
  telemetryCleared: boolean;
  errors: string[];
}

/**
 * Executes a bulk platform reset:
 * 1. Purges all user data across non-art collections.
 * 2. Purges non-admin user profiles (retains admin profiles).
 * 3. Preserves all drawings, canvas art, and pixel templates.
 * 4. Clears all telemetry logs from Firestore and local storage.
 */
export async function purgeNonAdminDataAndResetPlatform(): Promise<ResetStats> {
  const stats: ResetStats = {
    deletedDocsCount: 0,
    collectionsCleared: [],
    preservedAdminCount: 0,
    telemetryCleared: false,
    errors: []
  };

  logger.warn('🚀 [Platform Reset] Initiating bulk database purge...', null, 'PlatformReset');

  // 1. Purge standard data collections
  for (const colName of TARGET_RESET_COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        stats.deletedDocsCount += snap.size;
        stats.collectionsCleared.push(colName);
        logger.info(`🧹 Cleared collection '${colName}': ${snap.size} documents deleted`, null, 'PlatformReset');
      }
    } catch (err: any) {
      const errorMsg = `Failed to purge collection ${colName}: ${err?.message || err}`;
      stats.errors.push(errorMsg);
      logger.error(errorMsg, err, 'PlatformReset');
    }
  }

  // 2. Filter public_profiles: delete non-admin, keep admin profiles
  try {
    const profilesSnap = await getDocs(collection(db, 'public_profiles'));
    let profilesDeleted = 0;
    
    for (const docSnap of profilesSnap.docs) {
      const data = docSnap.data();
      if (data.role === 'admin') {
        stats.preservedAdminCount++;
      } else {
        await deleteDoc(docSnap.ref);
        profilesDeleted++;
        stats.deletedDocsCount++;
      }
    }
    if (profilesDeleted > 0) {
      stats.collectionsCleared.push(`public_profiles (${profilesDeleted} non-admin deleted)`);
    }
  } catch (err: any) {
    const errorMsg = `Failed filtering public_profiles: ${err?.message || err}`;
    stats.errors.push(errorMsg);
    logger.error(errorMsg, err, 'PlatformReset');
  }

  // 3. Clear Telemetry storage (Local + Session)
  try {
    stats.telemetryCleared = await purgeTelemetryOnly();
  } catch (err: any) {
    stats.errors.push(`Telemetry purge error: ${err?.message || err}`);
  }

  // 4. Clear non-essential localStorage items (preserving auth, drawings, panic mode)
  try {
    const keysToKeep = ['aha_panic_mode', 'showLoadWidget', 'drawing_canvas', 'personal_drawings'];
    Object.keys(localStorage).forEach((key) => {
      if (!keysToKeep.includes(key) && !key.startsWith('drawing_')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
  } catch (e) {
    console.warn('LocalStorage cleanup warning:', e);
  }

  logger.info('✅ [Platform Reset] Bulk platform reset completed successfully!', stats, 'PlatformReset');
  return stats;
}

/**
 * Clears telemetry from local/session storage and Firestore telemetry collection.
 */
export async function purgeTelemetryOnly(): Promise<boolean> {
  try {
    // Session and Local storage keys
    sessionStorage.removeItem('telemetry_session_id');
    localStorage.removeItem('telemetry_session_id');
    localStorage.removeItem('aha_telemetry_queue_fallback');

    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith('telemetry_')) sessionStorage.removeItem(k);
    });
    Object.keys(localStorage).forEach((k) => {
      if (k.includes('telemetry')) localStorage.removeItem(k);
    });

    // Firestore telemetry docs
    const snap = await getDocs(collection(db, 'telemetry'));
    if (!snap.empty) {
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    }

    logger.info('🧹 [Telemetry Purge] All local and cloud telemetry records removed', null, 'TelemetryPurge');
    return true;
  } catch (err: any) {
    logger.error('Failed to purge telemetry', err, 'TelemetryPurge');
    return false;
  }
}
