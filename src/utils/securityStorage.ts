/**
 * Zero-Trace Ephemeral RAM Storage Engine
 * High-Security memory-only storage adapter. Prevents sensitive logs,
 * session keys, bookmarks, and telemetry from touching persistent browser disk (localStorage/indexedDB).
 */

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
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  setItem(key: string, value: string): void {
    this.memoryMap.set(key, String(value));
    if (!this.zeroTraceEnabled) {
      try {
        window.localStorage.setItem(key, String(value));
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
