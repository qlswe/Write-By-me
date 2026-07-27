import { useEffect, useCallback, useRef } from 'react';

type LogLevel = 'info' | 'warn' | 'error' | 'perf' | 'system' | 'action';

interface LogEntry {
  id?: number;
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
  meta?: any;
}

const DB_NAME = 'AhaConsoleLogsDB';
const DB_VERSION = 1;
const DB_STORE_NAME = 'logs';

/**
 * Safely clone payloads so non-serializable objects (DOM nodes, functions, circular structures)
 * don't cause DataCloneError in IndexedDB.
 */
function safeClone(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'number' || typeof obj === 'string' || typeof obj === 'boolean') return obj;
  if (typeof obj === 'function' || typeof obj === 'symbol') return String(obj);

  try {
    return JSON.parse(
      JSON.stringify(obj, (_key, value) => {
        if (typeof value === 'function' || typeof value === 'symbol') {
          return String(value);
        }
        if (value instanceof Error) {
          return { name: value.name, message: value.message, stack: value.stack };
        }
        if (typeof Element !== 'undefined' && value instanceof Element) {
          return `<${value.tagName.toLowerCase()} class="${value.className}">`;
        }
        return value;
      })
    );
  } catch {
    return String(obj);
  }
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isEnabled = true;
  private sessionStart = performance.now();
  private listeners: ((log: LogEntry) => void)[] = [];
  private hasWarned = false;
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  constructor() {
    this.initSystemInfo();
    this.interceptConsole();
    this.loadHistoricalLogs();
  }

  private getDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return resolve(null);
      }

      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
            db.createObjectStore(DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  private async loadHistoricalLogs() {
    try {
      const db = await this.getDB();
      if (!db) return;

      const storedLogs = await new Promise<LogEntry[]>((resolve) => {
        const tx = db.transaction(DB_STORE_NAME, 'readonly');
        const store = tx.objectStore(DB_STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      if (storedLogs && storedLogs.length > 0) {
        // Merge historical logs before current session startup logs
        const combined = [...storedLogs, ...this.logs];
        // Sort chronologically by timestamp
        combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Limit to maxLogs
        if (combined.length > this.maxLogs) {
          this.logs = combined.slice(combined.length - this.maxLogs);
        } else {
          this.logs = combined;
        }

        this.notifyListeners();
      }
    } catch (e) {
      // Fail gracefully if IndexedDB is blocked or disabled
    }
  }

  private async saveLogToIDB(entry: LogEntry) {
    try {
      const db = await this.getDB();
      if (!db) return;

      const safeEntry: LogEntry = {
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        data: entry.data !== undefined ? safeClone(entry.data) : undefined,
        component: entry.component,
        meta: entry.meta !== undefined ? safeClone(entry.meta) : undefined
      };

      const tx = db.transaction(DB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(DB_STORE_NAME);
      store.add(safeEntry);

      // Periodic pruning if store grows beyond 1.5x maxLogs
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result > this.maxLogs * 1.5) {
          this.pruneOldIDBLogs(db);
        }
      };
    } catch {
      // ignore IndexedDB write errors
    }
  }

  private pruneOldIDBLogs(db: IDBDatabase) {
    try {
      const tx = db.transaction(DB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(DB_STORE_NAME);
      const req = store.openCursor();
      let deletedCount = 0;
      const targetDelete = 500;

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor && deletedCount < targetDelete) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };
    } catch {
      // ignore
    }
  }

  private async clearIDB() {
    try {
      const db = await this.getDB();
      if (!db) return;

      const tx = db.transaction(DB_STORE_NAME, 'readwrite');
      tx.objectStore(DB_STORE_NAME).clear();
    } catch {
      // ignore
    }
  }

  private notifyListeners(entry?: LogEntry) {
    setTimeout(() => {
      this.listeners.forEach((listener) => listener(entry || this.logs[this.logs.length - 1]));
    }, 0);
  }

  private interceptConsole() {
    if (typeof window === 'undefined') return;
    
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    let isCapturing = false;

    console.log = (...args: any[]) => {
      originalLog.apply(console, args);
      if (isCapturing) return;
      isCapturing = true;
      try {
        if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('%c')) {
          // ignore styled internal logger logs
        } else {
          this.info(typeof args[0] === 'string' ? args[0] : 'console.log', args.length > 1 ? args.slice(1) : (typeof args[0] !== 'string' ? args[0] : undefined), 'CONSOLE');
        }
      } catch {}
      isCapturing = false;
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);
      if (isCapturing) return;
      isCapturing = true;
      try {
        this.warn(typeof args[0] === 'string' ? args[0] : 'console.warn', args.length > 1 ? args.slice(1) : (typeof args[0] !== 'string' ? args[0] : undefined), 'CONSOLE');
      } catch {}
      isCapturing = false;
    };

    console.error = (...args: any[]) => {
      originalError.apply(console, args);
      if (isCapturing) return;
      isCapturing = true;
      try {
        this.error(typeof args[0] === 'string' ? args[0] : 'console.error', args.length > 1 ? args.slice(1) : (typeof args[0] !== 'string' ? args[0] : undefined), 'CONSOLE');
      } catch {}
      isCapturing = false;
    };

    console.info = (...args: any[]) => {
      originalInfo.apply(console, args);
      if (isCapturing) return;
      isCapturing = true;
      try {
        this.info(typeof args[0] === 'string' ? args[0] : 'console.info', args.length > 1 ? args.slice(1) : (typeof args[0] !== 'string' ? args[0] : undefined), 'CONSOLE');
      } catch {}
      isCapturing = false;
    };
  }

  subscribe(listener: (log: LogEntry) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private initSystemInfo() {
    if (typeof window === 'undefined') return;
    
    const systemInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: `${window.innerWidth}x${window.innerHeight}`,
      connection: (navigator as any).connection ? (navigator as any).connection.effectiveType : 'unknown',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform
    };

    this.system('SYSTEM BOOT SEQUENCE INITIATED', systemInfo);
  }

  private getStyles(level: LogLevel) {
    const base = 'padding: 2px 6px; border-radius: 4px; font-weight: bold; font-family: "JetBrains Mono", monospace; font-size: 11px;';
    switch (level) {
      case 'info': return `${base} background: #251c35; color: #ff4d4d; border: 1px solid #3d2b4f;`;
      case 'warn': return `${base} background: #4A3B22; color: #FFB86C; border: 1px solid #8A6B32;`;
      case 'error': return `${base} background: #4A2222; color: #FF5555; border: 1px solid #8A3232;`;
      case 'perf': return `${base} background: #224A32; color: #50FA7B; border: 1px solid #328A4A;`;
      case 'system': return `${base} background: #15101e; color: #8BE9FD; border: 1px solid #3d2b4f; text-transform: uppercase; letter-spacing: 1px;`;
      case 'action': return `${base} background: #6272A4; color: #F8F8F2; border: 1px solid #44475A;`;
      default: return base;
    }
  }

  private addLog(level: LogLevel, message: string, data?: any, component?: string) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const uptime = ((performance.now() - this.sessionStart) / 1000).toFixed(2) + 's';
    
    const entry: LogEntry = {
      timestamp,
      level,
      message,
      data,
      component,
      meta: { uptime }
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.saveLogToIDB(entry);

    // Defer the listener notification to avoid React warning:
    // "Cannot update a component while rendering a different component"
    setTimeout(() => {
      this.listeners.forEach(listener => listener(entry));
    }, 0);

    // Only log errors and ONE warning to console to prevent spam
    if (level === 'error' || (level === 'warn' && !this.hasWarned)) {
      if (level === 'warn') this.hasWarned = true;
      
      const style = this.getStyles(level);
      const componentStyle = 'color: #8BE9FD; font-style: italic; font-family: "JetBrains Mono", monospace; padding-left: 4px; font-size: 11px;';
      const timeStyle = 'color: #6272A4; font-family: "JetBrains Mono", monospace; font-size: 10px; margin-left: 8px;';
      const msgStyle = 'color: #E0E0E0; font-family: "Inter", sans-serif; font-size: 12px; margin-left: 6px;';
      
      const prefix = `%c${level.toUpperCase()}%c${component ? `[${component}]` : ''}`;
      
      if (data) {
        console.groupCollapsed(`${prefix}%c${message}%c+${uptime}`, style, componentStyle, msgStyle, timeStyle);
        console.log('%cTimestamp:', 'color: #ff4d4d; font-weight: bold;', timestamp);
        if (component) console.log('%cComponent:', 'color: #ff4d4d; font-weight: bold;', component);
        console.log('%cPayload:', 'color: #ff4d4d; font-weight: bold;', data);
        console.groupEnd();
      } else {
        console.log(`${prefix}%c${message}%c+${uptime}`, style, componentStyle, msgStyle, timeStyle);
      }
    }
  }

  info(message: string, data?: any, component?: string) { this.addLog('info', message, data, component); }
  warn(message: string, data?: any, component?: string) { this.addLog('warn', message, data, component); }
  error(message: string, data?: any, component?: string) { this.addLog('error', message, data, component); }
  perf(message: string, data?: any, component?: string) { this.addLog('perf', message, data, component); }
  system(message: string, data?: any) { this.addLog('system', message, data, 'CORE'); }
  action(message: string, data?: any, component?: string) { this.addLog('action', message, data, component); }

  getLogs() { return [...this.logs]; }
  getLogsString() { return JSON.stringify(this.logs, null, 2); }
  clear() {
    this.logs = [];
    this.clearIDB();
    this.notifyListeners();
  }
  
  exportLogs() {
    try {
      const logsJson = JSON.stringify(this.logs, null, 2);
      const blob = new Blob([logsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute("download", `aha_secure_logs_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url);
      
      window.dispatchEvent(new CustomEvent('aha_toast', { 
        detail: "Логи успешно экспортированы!" 
      }));
    } catch (e) {
      console.error("Error exporting logs, falling back to clipboard:", e);
      try {
        navigator.clipboard.writeText(JSON.stringify(this.logs, null, 2));
        window.dispatchEvent(new CustomEvent('aha_toast', { 
          detail: "Файл заблокирован браузером. Логи скопированы в буфер обмена!" 
        }));
      } catch (err) {
        alert("Не удалось экспортировать логи.");
      }
    }
  }
}

export const logger = new Logger();

// Hook for component performance tracking
export function usePerfLogger(componentName: string) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    const startTime = performance.now();
    logger.perf(`Mounted`, { timestamp: Date.now() }, componentName);

    return () => {
      const duration = performance.now() - startTime;
      logger.perf(`Unmounted`, { 
        lifespanMs: duration.toFixed(2),
        totalRenders: renderCount.current
      }, componentName);
    };
  }, [componentName]);

  const trackRender = useCallback(() => {
    renderCount.current += 1;
    if (renderCount.current === 1) {
      logger.perf(`First Render Complete`, null, componentName);
    }
  }, [componentName]);

  return { trackRender };
}
