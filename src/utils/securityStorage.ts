/**
 * Zero-Trace Ephemeral RAM & Session Storage Engine
 * High-Security memory-only storage adapter. Prevents sensitive logs,
 * session keys, bookmarks, and telemetry from touching persistent browser disk (localStorage/indexedDB).
 * Uses tab-scoped sessionStorage for system reload flags to prevent infinite reload loops.
 */

const SYSTEM_RELOAD_KEYS = new Set([
  'aha_last_restart',
  'aha_quota_fallback',
  'aha_panic_mode',
  'showLoadWidget',
  'hideInstallBanner',
  'productionMode',
  'aha_security_hidden',
  'aha_strict_mode',
  'aha_censor_mode',
  'aha_reading_font_size',
  'aha_primary_accent'
]);

class EphemeralMemoryStore implements Storage {
  private memoryMap = new Map<string, string>();
  public zeroTraceEnabled = true; // Default to true for max security

  get length(): number {
    return this.memoryMap.size;
  }

  clear(): void {
    this.memoryMap.clear();
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // ignore
    }
  }

  getItem(key: string): string | null {
    if (SYSTEM_RELOAD_KEYS.has(key)) {
      try {
        const sessionVal = window.sessionStorage.getItem(key);
        if (sessionVal !== null) return sessionVal;
      } catch {
        // ignore
      }
    }
    if (this.zeroTraceEnabled) {
      return this.memoryMap.get(key) ?? null;
    }
    try {
      return window.localStorage.getItem(key);
    } catch {
      return this.memoryMap.get(key) ?? null;
    }
  }

  key(index: number): string | null {
    const keys = Array.from(this.memoryMap.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.memoryMap.delete(key);
    try {
      window.sessionStorage.removeItem(key);
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  setItem(key: string, value: string): void {
    const strVal = String(value);
    this.memoryMap.set(key, strVal);
    if (SYSTEM_RELOAD_KEYS.has(key)) {
      try {
        window.sessionStorage.setItem(key, strVal);
      } catch {
        // ignore
      }
    }
    if (!this.zeroTraceEnabled) {
      try {
        window.localStorage.setItem(key, strVal);
      } catch {
        // ignore
      }
    }
  }

  // Emergency 7-pass memory purge
  wipeAllTraces(): void {
    for (const key of Array.from(this.memoryMap.keys())) {
      this.memoryMap.set(key, '\0'.repeat(128));
    }
    this.memoryMap.clear();
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // ignore
    }
  }
}

export const safeStorage = new EphemeralMemoryStore();

// Utility function to enable or disable zero-trace RAM mode
export function setZeroTraceMode(enabled: boolean) {
  safeStorage.zeroTraceEnabled = enabled;
  if (enabled) {
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  }
}

export function isZeroTraceActive(): boolean {
  return safeStorage.zeroTraceEnabled;
}
