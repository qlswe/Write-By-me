/**
 * Utility to manage unique device identifier for Web-App clients.
 * Generates a persistent unique ID strongly bound across localStorage, sessionStorage, cookies,
 * and deterministic browser hardware fingerprinting to resist ad-blocker or cache-clear resets.
 */

const DEVICE_ID_KEY = 'aha_device_id';
const DEVICE_ID_SESSION_KEY = 'aha_device_id_backup';
const DEVICE_ID_COOKIE = 'aha_dev_id_cookie';

/**
 * Computes a deterministic browser & hardware fingerprint hash.
 * Remains stable across normal session storage wipes.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server_fp_000000';
  
  try {
    const nav = navigator as any;
    const components = [
      navigator.userAgent || 'unknown',
      navigator.language || 'unknown',
      navigator.platform || 'unknown',
      `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      `${window.screen?.colorDepth || 24}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      nav.hardwareConcurrency || 4,
      nav.deviceMemory || 4,
      nav.maxTouchPoints || 0
    ].join('###');

    // Simple fast 32-bit FNV-1a hash
    let hash = 2166136261;
    for (let i = 0; i < components.length; i++) {
      hash ^= components.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    const hexHash = (hash >>> 0).toString(16).padStart(8, '0');
    return `fp_${hexHash}`;
  } catch (e) {
    return 'fp_fallback_000';
  }
}

/**
 * Retrieves cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Sets a persistent 1-year cookie
 */
function setCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  try {
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    // Ignore if cookies are disabled
  }
}

/**
 * Gets or creates a strongly bound persistent unique device ID.
 * Synchronizes across localStorage, sessionStorage, cookies, and hardware fingerprint.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server_id';

  // 1. Try localStorage
  let deviceId = null;
  try {
    deviceId = localStorage.getItem(DEVICE_ID_KEY);
  } catch (e) {
    // localStorage may be blocked by privacy settings
  }

  // 2. Try sessionStorage backup if localStorage was cleared
  if (!deviceId) {
    try {
      deviceId = sessionStorage.getItem(DEVICE_ID_SESSION_KEY);
    } catch (e) {}
  }

  // 3. Try cookie backup
  if (!deviceId) {
    deviceId = getCookie(DEVICE_ID_COOKIE);
  }

  // 4. If still missing, generate deterministic anchor tied to hardware fingerprint
  if (!deviceId) {
    const fingerprint = getDeviceFingerprint();
    const randomPart = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now().toString(36);
    deviceId = `dev_${fingerprint.replace('fp_', '')}_${timestamp}_${randomPart}`;
  }

  // Strongly bind / restore across all available storage layers
  try {
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  } catch (e) {}
  try {
    sessionStorage.setItem(DEVICE_ID_SESSION_KEY, deviceId);
  } catch (e) {}
  try {
    setCookie(DEVICE_ID_COOKIE, deviceId);
  } catch (e) {}

  return deviceId;
}

export function getDevicePlatformInfo(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Web Browser';
}

