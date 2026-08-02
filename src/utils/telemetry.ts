import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getDeviceId, getDeviceFingerprint } from './deviceId';

export interface TelemetryData {
  userId: string;
  userEmail: string;
  displayName: string;
  deviceId: string;
  fingerprint: string;
  adblockDetected: boolean;
  userAgent: string;
  platform: string;
  screen: string;
  viewport: string;
  language: string;
  timezone: string;
  cores: string | number;
  memory: string | number;
  connectionType: string;
  referrer: string;
  localTime: string;
  currentSection: string;
  timestamp: any;
  sessionId: string;
}

// Generate or retrieve session ID with localStorage & sessionStorage fallback
const getSessionId = (): string => {
  let sessId = null;
  try {
    sessId = sessionStorage.getItem('telemetry_session_id');
  } catch (e) {}
  
  if (!sessId) {
    try {
      sessId = localStorage.getItem('telemetry_session_id');
    } catch (e) {}
  }

  if (!sessId) {
    sessId = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
  }

  try {
    sessionStorage.setItem('telemetry_session_id', sessId);
    localStorage.setItem('telemetry_session_id', sessId);
  } catch (e) {}

  return sessId;
};

/**
 * Checks whether an ad/content blocker is active in the browser
 */
export const checkAdBlockerActive = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  // Test 1: Check DOM honeypot trap
  try {
    const bait = document.createElement('div');
    bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad adBox ad-sponsor banner-ad ad-banner';
    bait.style.position = 'absolute';
    bait.style.left = '-10000px';
    bait.style.top = '-10000px';
    bait.style.width = '1px';
    bait.style.height = '1px';
    document.body.appendChild(bait);
    
    await new Promise(r => setTimeout(r, 60));
    
    const isBlockedDom = 
      bait.offsetParent === null ||
      bait.offsetHeight === 0 ||
      bait.offsetLeft === 0 ||
      bait.clientHeight === 0 ||
      window.getComputedStyle(bait).display === 'none' ||
      window.getComputedStyle(bait).visibility === 'hidden';
      
    document.body.removeChild(bait);
    if (isBlockedDom) return true;
  } catch (e) {
    // ignore
  }

  // Test 2: Check standard analytics script URL interception
  try {
    const res = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store'
    });
    // if fetch fails entirely, it's blocked
  } catch (e) {
    return true;
  }

  return false;
};

export const logUserTelemetry = async (
  userId: string = 'anonymous',
  userEmail: string = 'anonymous',
  displayName: string = 'Guest',
  currentSection: string = 'home'
) => {
  // Prevent duplicate logging in rapid succession within the same session for the same section
  const lastLoggedSectionKey = `telemetry_last_logged_${currentSection}`;
  if (sessionStorage.getItem(lastLoggedSectionKey)) {
    return;
  }

  try {
    const adblockDetected = await checkAdBlockerActive();
    const deviceId = getDeviceId();
    const fingerprint = getDeviceFingerprint();

    const data: Partial<TelemetryData> = {
      userId,
      userEmail,
      displayName,
      deviceId,
      fingerprint,
      adblockDetected,
      userAgent: navigator.userAgent || 'unknown',
      platform: navigator.platform || 'unknown',
      screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
      language: navigator.language || 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      memory: (navigator as any).deviceMemory || 'unknown',
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      referrer: document.referrer || 'direct',
      localTime: new Date().toLocaleString(),
      currentSection,
      timestamp: serverTimestamp(),
      sessionId: getSessionId()
    };

    // Try flushing offline/adblock fallback queue first
    try {
      const queuedStr = localStorage.getItem('aha_telemetry_queue_fallback');
      if (queuedStr) {
        const queue: any[] = JSON.parse(queuedStr);
        if (Array.isArray(queue) && queue.length > 0) {
          const toFlush = queue.splice(0, 5);
          for (const item of toFlush) {
            await addDoc(collection(db, 'telemetry'), {
              ...item,
              timestamp: serverTimestamp(),
              flushedFromQueue: true
            });
          }
          if (queue.length > 0) {
            localStorage.setItem('aha_telemetry_queue_fallback', JSON.stringify(queue));
          } else {
            localStorage.removeItem('aha_telemetry_queue_fallback');
          }
        }
      }
    } catch (e) {}

    await addDoc(collection(db, 'telemetry'), data);
    sessionStorage.setItem(lastLoggedSectionKey, 'true');
  } catch (error) {
    // If request was blocked by AdBlocker or offline, enqueue in persistent fallback storage
    try {
      const deviceId = getDeviceId();
      const fingerprint = getDeviceFingerprint();
      const fallbackItem = {
        userId,
        userEmail,
        displayName,
        deviceId,
        fingerprint,
        adblockDetected: true,
        userAgent: navigator.userAgent || 'unknown',
        platform: navigator.platform || 'unknown',
        screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
        viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
        language: navigator.language || 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
        cores: navigator.hardwareConcurrency || 'unknown',
        memory: (navigator as any).deviceMemory || 'unknown',
        connectionType: (navigator as any).connection?.effectiveType || 'unknown',
        referrer: document.referrer || 'direct',
        localTime: new Date().toLocaleString(),
        currentSection,
        sessionId: getSessionId()
      };
      const queuedStr = localStorage.getItem('aha_telemetry_queue_fallback');
      const queue = queuedStr ? JSON.parse(queuedStr) : [];
      queue.push(fallbackItem);
      // Keep max 50 queued records
      if (queue.length > 50) queue.shift();
      localStorage.setItem('aha_telemetry_queue_fallback', JSON.stringify(queue));
    } catch (e) {}
  }
};
