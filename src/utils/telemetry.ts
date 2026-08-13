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
  colorDepth: string;
  orientation: string;
  touchPoints: number;
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;
  cores: string | number;
  memory: string | number;
  gpuVendor: string;
  gpuRenderer: string;
  connectionType: string;
  downlinkMbps: string | number;
  rttMs: string | number;
  saveData: boolean;
  doNotTrack: string;
  cookieEnabled: boolean;
  pdfViewerEnabled: boolean;
  pwaStandalone: boolean;
  batteryLevel: string;
  batteryCharging: string;
  audioSampleRate: string;
  referrer: string;
  localTime: string;
  currentSection: string;
  eventName?: string;
  eventDetails?: string;
  timestamp: any;
  sessionId: string;
}

/**
 * Extracts WebGL unmasked vendor and renderer (GPU graphics hardware)
 */
export const getGpuInfo = (): { vendor: string; renderer: string } => {
  if (typeof window === 'undefined') return { vendor: 'N/A', renderer: 'N/A' };
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { vendor: 'No WebGL', renderer: 'No WebGL' };
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return { vendor: 'Standard GL', renderer: 'Generic Hardware' };
    const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
    return { vendor: String(vendor), renderer: String(renderer) };
  } catch (e) {
    return { vendor: 'WebGL Error', renderer: 'WebGL Error' };
  }
};

/**
 * Reads battery status if supported by browser Battery API
 */
export const getBatteryInfo = async (): Promise<{ level: string; charging: string }> => {
  if (typeof window === 'undefined') return { level: 'N/A', charging: 'N/A' };
  try {
    const nav = navigator as any;
    if (typeof nav.getBattery === 'function') {
      const b = await nav.getBattery();
      return {
        level: `${Math.round((b.level || 0) * 100)}%`,
        charging: b.charging ? 'Charging' : 'Discharging'
      };
    }
  } catch (e) {}
  return { level: 'N/A', charging: 'N/A' };
};

/**
 * Extracts AudioContext hardware capabilities
 */
export const getAudioCapabilities = (): string => {
  if (typeof window === 'undefined') return 'N/A';
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const rate = ctx.sampleRate;
      ctx.close();
      return `${rate} Hz`;
    }
  } catch (e) {}
  return 'Not Supported';
};

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
 * Advanced multi-layer detection for AdGuard, uBlock Origin, Brave Shields,
 * Ghostery, Privacy Badger, DuckDuckGo, and AdGuard DNS / host-level blockers
 * without false positives during offline or slow network states.
 */
let cachedResult: { value: boolean; timestamp: number } | null = null;

export const checkAdBlockerActive = async (forceRefresh: boolean = false): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  // Return cached result if checked within last 4 seconds unless forced
  const now = Date.now();
  if (!forceRefresh && cachedResult && (now - cachedResult.timestamp < 4000)) {
    return cachedResult.value;
  }

  let adblockDetected = false;

  // Method 1: Check AdGuard & Extension-injected Global Signatures
  try {
    const win = window as any;
    if (
      win.adguard ||
      win.AdGuard ||
      win.__adguard_user_script ||
      win.adguardUserScripts ||
      win.__adg ||
      win.__ghostery ||
      win.uBlock ||
      win.uBlockOrigin
    ) {
      adblockDetected = true;
    }
  } catch (e) {
    // ignore
  }

  // Method 2: Check Brave Shields API
  if (!adblockDetected) {
    try {
      const nav = navigator as any;
      if (nav.brave && typeof nav.brave.isBrave === 'function') {
        const isBrave = await nav.brave.isBrave();
        if (isBrave) {
          adblockDetected = true;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Method 3: Multi-Element DOM Bait Test (AdGuard, uBlock, EasyList, AdGuard Russian List specific selectors)
  if (!adblockDetected) {
    try {
      const baitContainer = document.createElement('div');
      baitContainer.id = 'adguard-test-container';
      baitContainer.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad adBox ad-sponsor banner-ad ad-banner adsbox ad-placement ad-unit adsbygoogle adguard-ad adguard-banner sponsor-post outbrain-widget';
      baitContainer.style.cssText = 'position: absolute !important; top: -9999px !important; left: -9999px !important; width: 300px !important; height: 250px !important; opacity: 0.01 !important; pointer-events: none !important; z-index: -9999 !important;';

      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle ad-slot ad-unit';
      ins.style.cssText = 'display: inline-block !important; width: 300px !important; height: 250px !important;';
      ins.setAttribute('data-ad-client', 'ca-pub-1234567890123456');

      const adguardBait = document.createElement('div');
      adguardBait.className = 'adguard-placeholder adguard-element-hiding';
      adguardBait.style.cssText = 'width: 100px; height: 100px;';

      baitContainer.appendChild(ins);
      baitContainer.appendChild(adguardBait);
      document.body.appendChild(baitContainer);

      // Allow content scripts & element hiding CSS injections to execute
      await new Promise((r) => setTimeout(r, 80));

      const style = window.getComputedStyle(baitContainer);
      const insStyle = window.getComputedStyle(ins);
      const agStyle = window.getComputedStyle(adguardBait);

      const isDomBlocked =
        !baitContainer.parentNode ||
        baitContainer.offsetHeight === 0 ||
        baitContainer.offsetWidth === 0 ||
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        insStyle.display === 'none' ||
        insStyle.visibility === 'hidden' ||
        agStyle.display === 'none' ||
        agStyle.visibility === 'hidden';

      if (baitContainer.parentNode) {
        baitContainer.parentNode.removeChild(baitContainer);
      }

      if (isDomBlocked) {
        adblockDetected = true;
      }
    } catch (e) {
      // ignore DOM errors
    }
  }

  // Method 4: Multi-Domain Network Endpoint Interception (Google Ads, Yandex Metrika, DoubleClick, Amazon Ads)
  if (!adblockDetected && navigator.onLine) {
    try {
      const controlPromise = fetch(window.location.origin + '/favicon.ico?_t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });

      const adEndpoints = [
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        'https://www.google-analytics.com/analytics.js',
        'https://mc.yandex.ru/metrika/tag.js',
        'https://securepubads.g.doubleclick.net/tag/js/gpt.js'
      ];

      const fetchPromises = adEndpoints.map((url) =>
        fetch(url + '?_t=' + Date.now(), { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
      );

      const [controlRes, ...adResults] = await Promise.allSettled([
        controlPromise,
        ...fetchPromises
      ]);

      const controlOk = controlRes.status === 'fulfilled';

      if (controlOk) {
        const blockedCount = adResults.filter((r) => r.status === 'rejected').length;
        if (blockedCount >= 1) {
          adblockDetected = true;
        }
      }
    } catch (e) {
      // ignore network errors
    }
  }

  // Method 5: Dynamic Script Injection Error Trap (AdGuard / uBlock script filter trap)
  if (!adblockDetected && navigator.onLine) {
    try {
      const scriptUrls = [
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        'https://mc.yandex.ru/metrika/tag.js'
      ];

      for (const url of scriptUrls) {
        if (adblockDetected) break;
        const isBlocked = await new Promise<boolean>((resolve) => {
          const script = document.createElement('script');
          script.src = url + '?_ag=' + Date.now();
          script.async = true;
          let done = false;

          const finish = (failed: boolean) => {
            if (done) return;
            done = true;
            if (script.parentNode) script.parentNode.removeChild(script);
            resolve(failed);
          };

          script.onload = () => finish(false);
          script.onerror = () => finish(true);
          document.head.appendChild(script);

          setTimeout(() => finish(false), 600);
        });

        if (isBlocked) {
          adblockDetected = true;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  cachedResult = { value: adblockDetected, timestamp: Date.now() };
  return adblockDetected;
};

export const logUserTelemetry = async (
  userId: string = 'anonymous',
  userEmail: string = 'anonymous',
  displayName: string = 'Guest',
  currentSection: string = 'home',
  eventName?: string,
  eventDetails?: string | object
) => {
  try {
    const adblockDetected = await checkAdBlockerActive();
    const deviceId = getDeviceId();
    const fingerprint = getDeviceFingerprint();
    const gpu = getGpuInfo();
    const battery = await getBatteryInfo();
    const audioRate = getAudioCapabilities();

    const conn = (navigator as any).connection || {};
    const screenObj = window.screen || ({} as any);

    const formattedDetails = typeof eventDetails === 'object' ? JSON.stringify(eventDetails) : (eventDetails || undefined);

    const data: Partial<TelemetryData> = {
      userId,
      userEmail,
      displayName,
      deviceId,
      fingerprint,
      adblockDetected,
      userAgent: (() => {
        const raw = navigator.userAgent || 'unknown';
        return raw.includes('AHA-Protocol') ? raw : `${raw} AHA-Protocol/6.0-HYPER-IPv6 (AhaBrowser/6.0.4)`;
      })(),
      platform: navigator.platform || 'unknown',
      screen: `${screenObj.width || 0}x${screenObj.height || 0}`,
      viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
      colorDepth: `${screenObj.colorDepth || 24}-bit`,
      orientation: screenObj.orientation?.type || 'unknown',
      touchPoints: navigator.maxTouchPoints || 0,
      language: navigator.language || 'unknown',
      languages: Array.from(navigator.languages || [navigator.language || 'en']),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
      timezoneOffset: new Date().getTimezoneOffset(),
      cores: navigator.hardwareConcurrency || 'unknown',
      memory: (navigator as any).deviceMemory || 'unknown',
      gpuVendor: gpu.vendor,
      gpuRenderer: gpu.renderer,
      connectionType: conn.effectiveType || 'unknown',
      downlinkMbps: conn.downlink || 'N/A',
      rttMs: conn.rtt || 'N/A',
      saveData: Boolean(conn.saveData),
      doNotTrack: String(navigator.doNotTrack || (window as any).doNotTrack || 'unspecified'),
      cookieEnabled: Boolean(navigator.cookieEnabled),
      pdfViewerEnabled: Boolean((navigator as any).pdfViewerEnabled),
      pwaStandalone: Boolean(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone),
      batteryLevel: battery.level,
      batteryCharging: battery.charging,
      audioSampleRate: audioRate,
      referrer: document.referrer || 'direct',
      localTime: new Date().toLocaleString(),
      currentSection,
      eventName: eventName || 'section_visit',
      eventDetails: formattedDetails,
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
  } catch (error) {
    // If request was blocked by AdBlocker or offline, enqueue in persistent fallback storage
    try {
      const deviceId = getDeviceId();
      const fingerprint = getDeviceFingerprint();
      const gpu = getGpuInfo();
      const conn = (navigator as any).connection || {};
      const screenObj = window.screen || ({} as any);

      const fallbackItem = {
        userId,
        userEmail,
        displayName,
        deviceId,
        fingerprint,
        adblockDetected: true,
        userAgent: (() => {
          const raw = navigator.userAgent || 'unknown';
          return raw.includes('AHA-Protocol') ? raw : `${raw} AHA-Protocol/6.0-HYPER-IPv6 (AhaBrowser/6.0.4)`;
        })(),
        platform: navigator.platform || 'unknown',
        screen: `${screenObj.width || 0}x${screenObj.height || 0}`,
        viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
        colorDepth: `${screenObj.colorDepth || 24}-bit`,
        touchPoints: navigator.maxTouchPoints || 0,
        language: navigator.language || 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
        cores: navigator.hardwareConcurrency || 'unknown',
        memory: (navigator as any).deviceMemory || 'unknown',
        gpuVendor: gpu.vendor,
        gpuRenderer: gpu.renderer,
        connectionType: conn.effectiveType || 'unknown',
        downlinkMbps: conn.downlink || 'N/A',
        rttMs: conn.rtt || 'N/A',
        referrer: document.referrer || 'direct',
        localTime: new Date().toLocaleString(),
        currentSection,
        eventName: eventName || 'section_visit',
        eventDetails: typeof eventDetails === 'object' ? JSON.stringify(eventDetails) : (eventDetails || undefined),
        sessionId: getSessionId()
      };
      const queuedStr = localStorage.getItem('aha_telemetry_queue_fallback');
      const queue = queuedStr ? JSON.parse(queuedStr) : [];
      queue.push(fallbackItem);
      if (queue.length > 50) queue.shift();
      localStorage.setItem('aha_telemetry_queue_fallback', JSON.stringify(queue));
    } catch (e) {}
  }
};

/**
 * Helper function to explicitly log a user event immediately to telemetry/statistics
 */
export const logTelemetryEvent = async (
  eventName: string,
  eventDetails?: string | object,
  currentSection: string = 'home',
  userId: string = 'anonymous',
  userEmail: string = 'anonymous',
  displayName: string = 'Guest'
) => {
  return logUserTelemetry(userId, userEmail, displayName, currentSection, eventName, eventDetails);
};
