import { useEffect, useCallback } from 'react';

type LogLevel = 'info' | 'warn' | 'error' | 'perf';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isEnabled = true; // Always keep logs in memory for feedback

  private addLog(level: LogLevel, message: string, data?: any, component?: string) {
    if (!this.isEnabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      component
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console in dev
    if (process.env.NODE_ENV !== 'production') {
      const prefix = `[${level.toUpperCase()}]${component ? ` [${component}]` : ''}`;
      switch (level) {
        case 'info': console.log(prefix, message, data || ''); break;
        case 'warn': console.warn(prefix, message, data || ''); break;
        case 'error': console.error(prefix, message, data || ''); break;
      }
    }
  }

  info(message: string, data?: any, component?: string) { this.addLog('info', message, data, component); }
  warn(message: string, data?: any, component?: string) { this.addLog('warn', message, data, component); }
  error(message: string, data?: any, component?: string) { this.addLog('error', message, data, component); }
  perf(message: string, data?: any, component?: string) { this.addLog('perf', message, data, component); }

  getLogs() { return [...this.logs]; }
  getLogsString() { return JSON.stringify(this.logs, null, 2); }
  clear() { this.logs = []; }
  
  exportLogs() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `hsr_logs_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}

export const logger = new Logger();

// Hook for component performance tracking
export function usePerfLogger(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    logger.perf(`Mounted`, null, componentName);

    return () => {
      const duration = performance.now() - startTime;
      logger.perf(`Unmounted (Lifespan: ${duration.toFixed(2)}ms)`, null, componentName);
    };
  }, [componentName]);

  const trackRender = useCallback(() => {
    logger.perf(`Rendered`, null, componentName);
  }, [componentName]);

  return { trackRender };
}
