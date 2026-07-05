import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface TelemetryData {
  userId: string;
  userEmail: string;
  displayName: string;
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

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessId = sessionStorage.getItem('telemetry_session_id');
  if (!sessId) {
    sessId = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
    sessionStorage.setItem('telemetry_session_id', sessId);
  }
  return sessId;
};

let hasLoggedThisSession = false;

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
    const data: Partial<TelemetryData> = {
      userId,
      userEmail,
      displayName,
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

    await addDoc(collection(db, 'telemetry'), data);
    sessionStorage.setItem(lastLoggedSectionKey, 'true');
  } catch (error) {
    console.warn('Failed to record permitted telemetry:', error);
  }
};
