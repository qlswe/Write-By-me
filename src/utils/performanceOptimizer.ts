import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Performance Optimizer & Memory Management Utilities
 * Optimizes re-renders, throttles network calls, and suspends polling when tab is hidden.
 */

// 1. Debounce hook for smooth search & filtering without UI lag
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

// 2. Throttle callback for high-frequency events (scroll, mousemove, resize)
export function useThrottleCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs = 200
): (...args: Args) => void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Args) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delayMs) {
        lastRunRef.current = now;
        callback(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          timeoutRef.current = null;
          callback(...args);
        }, delayMs - timeSinceLastRun);
      }
    },
    [callback, delayMs]
  );
}

// 3. Tab Visibility Optimizer: pauses background timers/syncs when tab is hidden
type VisibilityCallback = (isVisible: boolean) => void;
const visibilitySubscribers = new Set<VisibilityCallback>();

let visibilityInitialized = false;
export function initPageVisibilityOptimizer() {
  if (visibilityInitialized || typeof document === 'undefined') return;
  visibilityInitialized = true;

  document.addEventListener('visibilitychange', () => {
    const isVisible = document.visibilityState === 'visible';
    visibilitySubscribers.forEach((cb) => {
      try {
        cb(isVisible);
      } catch (e) {
        console.warn('Visibility subscriber error:', e);
      }
    });
  });
}

export function subscribeToPageVisibility(cb: VisibilityCallback): () => void {
  initPageVisibilityOptimizer();
  visibilitySubscribers.add(cb);
  return () => {
    visibilitySubscribers.delete(cb);
  };
}

// 4. LocalStorage & JSON safe parser cache to avoid repetitive parse CPU cycles
const jsonCache = new Map<string, { raw: string; parsed: any }>();

export function cachedJsonParse<T>(key: string, rawJson: string | null, fallback: T): T {
  if (!rawJson) return fallback;
  const existing = jsonCache.get(key);
  if (existing && existing.raw === rawJson) {
    return existing.parsed as T;
  }
  try {
    const parsed = JSON.parse(rawJson);
    jsonCache.set(key, { raw: rawJson, parsed });
    return parsed;
  } catch (e) {
    return fallback;
  }
}

// 5. Cross-Browser Engine & Hardware Diagnostics
export interface BrowserEngineInfo {
  isWebKit: boolean;
  isGecko: boolean;
  isBlink: boolean;
  isSafari: boolean;
  isiOS: boolean;
  isFirefox: boolean;
  supportsBackdropFilter: boolean;
  supportsTouch: boolean;
  isLowEndDevice: boolean;
}

export function getBrowserEngineInfo(): BrowserEngineInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isWebKit: false,
      isGecko: false,
      isBlink: true,
      isSafari: false,
      isiOS: false,
      isFirefox: false,
      supportsBackdropFilter: true,
      supportsTouch: false,
      isLowEndDevice: false,
    };
  }

  const ua = navigator.userAgent;
  const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isFirefox = /firefox|fxios/i.test(ua);
  const isWebKit = /webkit/i.test(ua) && !/chrome|chromium|edg/i.test(ua);
  const isGecko = /gecko/i.test(ua) && !/webkit|trident/i.test(ua);
  const isBlink = /chrome|chromium|edg/i.test(ua);
  const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check hardware concurrency and device memory for low-end adaptation
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const isLowEndDevice = hardwareConcurrency <= 2 || deviceMemory <= 2;

  let supportsBackdropFilter = false;
  try {
    supportsBackdropFilter = 
      (typeof CSS !== 'undefined' && (
        CSS.supports('backdrop-filter', 'blur(1px)') || 
        CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
      ));
  } catch {
    supportsBackdropFilter = true;
  }

  return {
    isWebKit,
    isGecko,
    isBlink,
    isSafari,
    isiOS,
    isFirefox,
    supportsBackdropFilter,
    supportsTouch,
    isLowEndDevice,
  };
}
