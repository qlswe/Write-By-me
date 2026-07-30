/**
 * Utility to manage unique device identifier for Web-App clients.
 * Generates a persistent unique ID stored in localStorage and attached to user documents.
 */

const DEVICE_ID_KEY = 'aha_device_id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server_id';

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    const randomPart = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    deviceId = `dev_${timestamp}_${randomPart}`;
    try {
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    } catch (e) {
      console.warn('Could not save deviceId to localStorage:', e);
    }
  }
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
