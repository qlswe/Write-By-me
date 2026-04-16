import { useEffect, useCallback, useRef } from 'react';

type LogLevel = 'info' | 'warn' | 'error' | 'perf' | 'system' | 'action';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
  meta?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isEnabled = true;
  private sessionStart = performance.now();
  private listeners: ((log: LogEntry) => void)[] = [];
  private hasWarned = false;

  constructor() {
    this.initSystemInfo();
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
  clear() { this.logs = []; }
  
  exportLogs() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `write_by_me_logs_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
