import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';

/**
 * PresenceManager handles real-time online status and lastSeen heartbeats.
 * - Sends immediate heartbeat upon login and tab activation.
 * - Heartbeats every 30 seconds while the page is visible and active.
 * - Immediately updates lastSeen timestamp on page unload, tab hide, and user activity.
 */

let heartbeatInterval: any = null;
let lastHeartbeatTime = 0;
let activeUid: string | null = null;
let isInitialized = false;

const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds
const ACTIVITY_THROTTLE_MS = 30 * 1000; // 30 seconds

async function sendHeartbeat(uid: string) {
  if (!uid || !db) return;
  const now = new Date().toISOString();
  lastHeartbeatTime = Date.now();

  try {
    const userRef = doc(db, 'users', uid);
    const profileRef = doc(db, 'public_profiles', uid);
    
    // Non-blocking writes with catch
    await Promise.allSettled([
      setDoc(profileRef, { lastSeen: now }, { merge: true }),
      setDoc(userRef, { lastSeen: now }, { merge: true })
    ]);
  } catch (err) {
    // Silent fail on network transient
  }
}

function handleVisibilityChange() {
  if (!activeUid) return;

  if (document.visibilityState === 'visible') {
    // Immediate heartbeat when user comes back to the tab
    sendHeartbeat(activeUid);
    startHeartbeatTimer();
  } else {
    // When user hides tab / switches away, write the exact exit timestamp
    sendHeartbeat(activeUid);
    stopHeartbeatTimer();
  }
}

function handleUserActivity() {
  if (!activeUid || document.visibilityState !== 'visible') return;

  const now = Date.now();
  if (now - lastHeartbeatTime > ACTIVITY_THROTTLE_MS) {
    sendHeartbeat(activeUid);
  }
}

function handlePageExit() {
  if (!activeUid) return;
  sendHeartbeat(activeUid);
}

function startHeartbeatTimer() {
  stopHeartbeatTimer();
  if (!activeUid) return;

  heartbeatInterval = setInterval(() => {
    if (activeUid && document.visibilityState === 'visible') {
      sendHeartbeat(activeUid);
    }
  }, HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeatTimer() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

export const PresenceManager = {
  init(user: User | null) {
    if (!user) {
      this.cleanup();
      return;
    }

    activeUid = user.uid;

    // Send immediate presence update
    sendHeartbeat(user.uid);
    startHeartbeatTimer();

    if (!isInitialized && typeof window !== 'undefined') {
      isInitialized = true;

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handlePageExit);
      window.addEventListener('pagehide', handlePageExit);

      // Throttled activity listeners
      window.addEventListener('mousemove', handleUserActivity, { passive: true });
      window.addEventListener('keydown', handleUserActivity, { passive: true });
      window.addEventListener('touchstart', handleUserActivity, { passive: true });
      window.addEventListener('scroll', handleUserActivity, { passive: true });
    }
  },

  touch(uid?: string) {
    const targetUid = uid || activeUid;
    if (targetUid) {
      sendHeartbeat(targetUid);
    }
  },

  cleanup() {
    stopHeartbeatTimer();
    activeUid = null;
  }
};
