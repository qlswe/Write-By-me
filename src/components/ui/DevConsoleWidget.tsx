import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal, X, Trash2, Download, Search, Copy, Check, Filter,
  AlertTriangle, AlertCircle, Info, Zap, Shield, Play, Pause,
  Maximize2, Minimize2, Database, Key, Cpu, Activity, RefreshCw,
  Layers, HardDrive, Smartphone, Globe, Bug, Flame, ClipboardCheck,
  Wifi, WifiOff, Timer, Clock
} from 'lucide-react';
import { logger } from '../../utils/logger';
import { useAuth } from '../../hooks/useAuth';
import { auth, db } from '../../firebase';
import { getDeviceId } from '../../utils/deviceId';
import { doc, getDoc, disableNetwork, enableNetwork } from 'firebase/firestore';
import { AhaQueryMonitor } from '../monitoring/AhaQueryMonitor';
import { purgeNonAdminDataAndResetPlatform, purgeTelemetryOnly } from '../../utils/platformReset';
import { CustomSelect } from './CustomSelect';

interface DevConsoleWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export const DevConsoleWidget: React.FC<DevConsoleWidgetProps> = ({
  isOpen,
  onClose,
  onToggle
}) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState(() => logger.getLogs());
  const [activeTab, setActiveTab] = useState<'logs' | 'auth_db' | 'env_state' | 'tests' | 'queries'>('logs');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogIndex, setExpandedLogIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Debug inspector state
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [testingDb, setTestingDb] = useState<boolean>(false);
  const [tokenCopied, setTokenCopied] = useState<boolean>(false);
  const [uidCopied, setUidCopied] = useState<boolean>(false);
  const [reportCopied, setReportCopied] = useState<boolean>(false);

  // Firestore Network Controller State
  const [isFirestoreNetworkOnline, setIsFirestoreNetworkOnline] = useState<boolean>(true);
  const [isTogglingNetwork, setIsTogglingNetwork] = useState<boolean>(false);
  const [isSimulatingTimeout, setIsSimulatingTimeout] = useState<boolean>(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState<number>(0);

  // Toggle Firestore Network (disableNetwork / enableNetwork)
  const handleToggleFirestoreNetwork = async () => {
    setIsTogglingNetwork(true);
    try {
      if (isFirestoreNetworkOnline) {
        await disableNetwork(db);
        setIsFirestoreNetworkOnline(false);
        logger.warn('Firestore network connection DISABLED via DevConsole Network Controller (disableNetwork executed)', {
          timestamp: new Date().toISOString()
        }, 'DevConsole');
      } else {
        await enableNetwork(db);
        setIsFirestoreNetworkOnline(true);
        logger.info('Firestore network connection ENABLED via DevConsole Network Controller (enableNetwork executed)', {
          timestamp: new Date().toISOString()
        }, 'DevConsole');
      }
    } catch (err: any) {
      logger.error(`Firestore network toggle error: ${err?.message}`, { error: err?.message }, 'DevConsole');
    } finally {
      setIsTogglingNetwork(false);
    }
  };

  // Simulate a 5-second network connection timeout
  const handleSimulateTimeout = async () => {
    if (isSimulatingTimeout || isTogglingNetwork) return;
    setIsSimulatingTimeout(true);
    setIsTogglingNetwork(true);
    setTimeoutCountdown(5);

    try {
      if (isFirestoreNetworkOnline) {
        await disableNetwork(db);
        setIsFirestoreNetworkOnline(false);
      }
      logger.warn('Simulating 5s connection timeout: Firestore network DISABLED for 5s', {
        durationMs: 5000,
        timestamp: new Date().toISOString()
      }, 'DevConsole');

      const interval = setInterval(() => {
        setTimeoutCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(async () => {
        try {
          await enableNetwork(db);
          setIsFirestoreNetworkOnline(true);
          logger.info('5s connection timeout simulation completed: Firestore network restored (enableNetwork)', {
            timestamp: new Date().toISOString()
          }, 'DevConsole');
        } catch (err: any) {
          logger.error(`Failed to restore network after timeout simulation: ${err?.message}`, null, 'DevConsole');
        } finally {
          setIsSimulatingTimeout(false);
          setIsTogglingNetwork(false);
        }
      }, 5000);
    } catch (err: any) {
      logger.error(`Failed to initiate timeout simulation: ${err?.message}`, null, 'DevConsole');
      setIsSimulatingTimeout(false);
      setIsTogglingNetwork(false);
    }
  };

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to logger events & hotkey Alt+D
  useEffect(() => {
    const unsubscribe = logger.subscribe(() => {
      setLogs(logger.getLogs());
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || (e.ctrlKey && e.shiftKey)) && (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В')) {
        e.preventDefault();
        onToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggle]);

  useEffect(() => {
    if (autoScroll && isOpen && activeTab === 'logs' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, autoScroll, isOpen, activeTab]);

  const handleClear = () => {
    logger.clear();
    setLogs([]);
  };

  const handleCopyLogs = () => {
    try {
      const text = logger.getLogsString();
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleExport = () => {
    logger.exportLogs();
  };

  // Test Firestore Read latency
  const handleTestFirestore = async () => {
    setTestingDb(true);
    const start = performance.now();
    try {
      await getDoc(doc(db, 'chats', 'group_ahi_radio_room'));
      const end = performance.now();
      const duration = Math.round(end - start);
      setDbLatency(duration);
      logger.perf(`Firestore Ping successful`, { durationMs: duration }, 'DevConsole');
    } catch (err: any) {
      setDbLatency(-1);
      logger.error(`Firestore Ping failed`, { error: err?.message }, 'DevConsole');
    } finally {
      setTestingDb(false);
    }
  };

  // Copy JWT Token
  const handleCopyToken = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await navigator.clipboard.writeText(token);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    } catch (err) {
      console.warn(err);
    }
  };

  const [isResettingPlatform, setIsResettingPlatform] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleBulkPlatformReset = async () => {
    if (!window.confirm('ВНИМАНИЕ! Это действие выполнит массовую перезапись/обнуление данных платформы. Все комментарии, сообщения, посты и телеметрия будут удалены. РИСУНКИ И АДМИН-АККАУНТЫ СОХРАНЯТСЯ. Продолжить?')) {
      return;
    }

    setIsResettingPlatform(true);
    try {
      const stats = await purgeNonAdminDataAndResetPlatform();
      const msg = `Сброс выполнен: удалено ${stats.deletedDocsCount} документов, телеметрия очищена. Сохранено ${stats.preservedAdminCount} профилей админа.`;
      setResetSuccessMessage(msg);
      logger.info('Bulk platform reset executed from DevConsole', stats, 'DevConsole');
      setTimeout(() => setResetSuccessMessage(null), 7000);
    } catch (err: any) {
      logger.error('Failed to execute bulk platform reset', { error: err?.message }, 'DevConsole');
    } finally {
      setIsResettingPlatform(false);
    }
  };

  const handlePurgeTelemetry = async () => {
    try {
      await purgeTelemetryOnly();
      setResetSuccessMessage('Телеметрия полностью очищена (локально и в Firestore)!');
      setTimeout(() => setResetSuccessMessage(null), 5000);
    } catch (err: any) {
      logger.error('Failed to purge telemetry', { error: err?.message }, 'DevConsole');
    }
  };

  // Copy User UID
  const handleCopyUid = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setUidCopied(true);
      setTimeout(() => setUidCopied(false), 2000);
    } catch (err) {
      console.warn(err);
    }
  };

  // Copy Markdown Diagnostics Bundle
  const handleCopyDiagnosticsReport = async () => {
    try {
      const report = [
        `# 🛠️ AHI CYBER SITE DIAGNOSTICS REPORT`,
        `**Generated At:** ${new Date().toISOString()}`,
        `**URL:** ${window.location.href}`,
        ``,
        `## 💻 System & Environment`,
        `- **User-Agent:** \`${navigator.userAgent}\``,
        `- **Screen:** \`${window.innerWidth}x${window.innerHeight} (DevicePixelRatio: ${window.devicePixelRatio})\``,
        `- **Online Status:** \`${navigator.onLine ? 'ONLINE' : 'OFFLINE'}\``,
        `- **CPU Threads:** \`${navigator.hardwareConcurrency || 'N/A'}\``,
        `- **Memory (RAM):** \`${(navigator as any).deviceMemory || 'N/A'} GB\``,
        `- **Device ID:** \`${getDeviceId()}\``,
        ``,
        `## 🔐 Authentication & Session`,
        `- **User Auth Status:** \`${user ? 'AUTHENTICATED' : 'ANONYMOUS/GUEST'}\``,
        `- **UID:** \`${user?.uid || 'N/A'}\``,
        `- **Email:** \`${user?.email || 'N/A'}\``,
        `- **DisplayName:** \`${user?.displayName || 'N/A'}\``,
        `- **Email Verified:** \`${user?.emailVerified ? 'Yes' : 'No'}\``,
        ``,
        `## 📊 Log Statistics`,
        `- **Total Logs Recorded:** \`${logs.length}\``,
        `- **Errors:** \`${logs.filter(l => l.level === 'error').length}\``,
        `- **Warnings:** \`${logs.filter(l => l.level === 'warn').length}\``,
        ``,
        `## 📜 Recent Log Entries (Last 10)`,
        '```json',
        JSON.stringify(logs.slice(-10), null, 2),
        '```'
      ].join('\n');

      await navigator.clipboard.writeText(report);
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2000);
      logger.info('Copied full markdown diagnostic report to clipboard', null, 'DevConsole');
    } catch (e) {
      console.warn(e);
    }
  };

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const msgMatch = log.message.toLowerCase().includes(query);
      const compMatch = log.component?.toLowerCase().includes(query);
      const dataMatch = log.data ? JSON.stringify(log.data).toLowerCase().includes(query) : false;
      return msgMatch || compMatch || dataMatch;
    }
    return true;
  });

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'warn':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'perf':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'system':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'action':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      default:
        return 'bg-[#ff4d4d]/10 text-[#ff4d4d] border-[#ff4d4d]/30';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle size={12} className="text-red-400 shrink-0" />;
      case 'warn': return <AlertTriangle size={12} className="text-amber-400 shrink-0" />;
      case 'perf': return <Zap size={12} className="text-emerald-400 shrink-0" />;
      case 'system': return <Shield size={12} className="text-cyan-400 shrink-0" />;
      default: return <Info size={12} className="text-[#ff4d4d] shrink-0" />;
    }
  };

  return (
    <>
      {/* Floating Toggle Button Badge */}
      <button
        onClick={onToggle}
        className={`fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full border shadow-2xl font-mono text-xs font-bold transition-all duration-300 ${
          isOpen
            ? 'bg-[#ff4d4d] text-white border-white/30 shadow-[0_0_20px_rgba(255,77,77,0.6)] scale-105'
            : 'bg-[#150e24]/90 backdrop-blur-md text-gray-200 border-[#3d2b4f] hover:border-[#ff4d4d] hover:shadow-[0_0_15px_rgba(255,77,77,0.4)]'
        }`}
        title="Переключить Консоль (Alt+D / Ctrl+Shift+D)"
      >
        <Terminal size={16} className={isOpen ? 'animate-pulse' : 'text-[#ff4d4d]'} />
        <span className="hidden sm:inline font-sans">Консоль</span>
        {(errorCount > 0 || warnCount > 0) && (
          <div className="flex items-center gap-1">
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-black">
                {errorCount}
              </span>
            )}
            {warnCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-black rounded-full text-[10px] font-black">
                {warnCount}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Main Console Drawer Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0c0717]/95 backdrop-blur-xl border-t border-[#3d2b4f] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] flex flex-col font-mono text-xs ${
              isMaximized ? 'h-[85vh]' : 'h-80 md:h-96'
            }`}
          >
            {/* Header Control Bar */}
            <div className="bg-[#120a21] px-4 py-2 border-b border-[#291740] flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Title & Tab Bar */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[#ff4d4d] font-bold">
                  <Terminal size={16} />
                  <span className="text-white font-sans font-black tracking-wide uppercase text-xs">
                    КОНСОЛЬ САЙТА
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-[#1a0e30] p-1 rounded-xl border border-[#3d2b4f]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('logs')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'logs'
                        ? 'bg-[#ff4d4d] text-[#15101e] shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Terminal size={12} />
                    <span>Логи ({logs.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('auth_db')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'auth_db'
                        ? 'bg-[#ff4d4d] text-[#15101e] shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Key size={12} />
                    <span>Auth & DB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('env_state')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'env_state'
                        ? 'bg-[#ff4d4d] text-[#15101e] shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Cpu size={12} />
                    <span>Система & Env</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('tests')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'tests'
                        ? 'bg-[#ff4d4d] text-[#15101e] shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Bug size={12} />
                    <span>Тесты</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('queries')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'queries'
                        ? 'bg-[#ff4d4d] text-[#15101e] shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Activity size={12} />
                    <span>Запросы (Aha)</span>
                  </button>
                </div>
              </div>

              {/* Top Window Actions (Max/Close) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 hidden sm:inline mr-2">
                  Alt+D для быстрого входа
                </span>
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 rounded-lg bg-[#1a0e30] border border-[#3d2b4f] text-gray-300 hover:text-white transition-all hidden sm:block cursor-pointer"
                  title={isMaximized ? 'Свернуть' : 'Развернуть на весь экран'}
                >
                  {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                  title="Закрыть консоль"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* TAB CONTENT: 1. LOGS */}
            {activeTab === 'logs' && (
              <>
                {/* Filters & Actions Bar for Logs */}
                <div className="bg-[#150d26] px-4 py-1.5 border-b border-[#291740] flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    {errorCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                        ERR: {errorCount}
                      </span>
                    )}
                    {warnCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                        WARN: {warnCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                    {/* Search Box */}
                    <div className="relative flex items-center">
                      <Search size={12} className="absolute left-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск логов..."
                        className="pl-7 pr-2 py-1 bg-[#1a0e30] border border-[#3d2b4f] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] w-28 sm:w-40 text-xs"
                      />
                    </div>

                    {/* Level Filter Dropdown */}
                    <div className="w-32 sm:w-36">
                      <CustomSelect
                        value={filterLevel}
                        onChange={(val) => setFilterLevel(val)}
                        className="!bg-[#1a0e30] !border-[#3d2b4f] !text-gray-200 !rounded-lg !px-2.5 !py-1 !text-xs !font-medium"
                        options={[
                          { value: "ALL", label: "Все уровни" },
                          { value: "INFO", label: "Info" },
                          { value: "WARN", label: "Warn" },
                          { value: "ERROR", label: "Error" },
                          { value: "PERF", label: "Perf" },
                          { value: "SYSTEM", label: "System" },
                          { value: "ACTION", label: "Action" }
                        ]}
                      />
                    </div>

                    {/* Auto Scroll Toggle */}
                    <button
                      onClick={() => setAutoScroll(!autoScroll)}
                      className={`p-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                        autoScroll
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-[#1a0e30] text-gray-400 border-[#3d2b4f]'
                      }`}
                      title={autoScroll ? 'Автопрокрутка включена' : 'Автопрокрутка выключена'}
                    >
                      {autoScroll ? <Play size={12} /> : <Pause size={12} />}
                    </button>

                    {/* Copy Logs */}
                    <button
                      onClick={handleCopyLogs}
                      className="p-1.5 rounded-lg bg-[#1a0e30] border border-[#3d2b4f] text-gray-300 hover:text-white hover:border-[#ff4d4d] transition-all"
                      title="Скопировать логи"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>

                    {/* Export JSON */}
                    <button
                      onClick={handleExport}
                      className="p-1.5 rounded-lg bg-[#1a0e30] border border-[#3d2b4f] text-gray-300 hover:text-white hover:border-[#ff4d4d] transition-all"
                      title="Экспорт логов в JSON"
                    >
                      <Download size={12} />
                    </button>

                    {/* Clear */}
                    <button
                      onClick={handleClear}
                      className="p-1.5 rounded-lg bg-[#1a0e30] border border-[#3d2b4f] text-gray-300 hover:text-red-400 hover:border-red-500/40 transition-all"
                      title="Очистить консоль"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Logs Output List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 selection:bg-[#ff4d4d]/30">
                  {filteredLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-1 py-8">
                      <Terminal size={24} className="opacity-40" />
                      <p className="text-xs">Логи отсутствуют или отфильтрованы</p>
                    </div>
                  ) : (
                    filteredLogs.map((log, index) => {
                      const isExpanded = expandedLogIndex === index;
                      const timeStr = new Date(log.timestamp).toLocaleTimeString();

                      return (
                        <div
                          key={index}
                          onClick={() => setExpandedLogIndex(isExpanded ? null : index)}
                          className="p-2 rounded-lg bg-[#130b24] hover:bg-[#1c1035] border border-[#2a1845] transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-2 leading-relaxed">
                            {getLevelIcon(log.level)}
                            <span className="text-[10px] text-gray-500 shrink-0 pt-0.5">{timeStr}</span>

                            <span
                              className={`px-1.5 py-0.2 rounded border text-[9px] font-bold uppercase shrink-0 ${getLevelBadgeClass(
                                log.level
                              )}`}
                            >
                              {log.level}
                            </span>

                            {log.component && (
                              <span className="text-cyan-400 font-bold shrink-0 text-[10px]">
                                [{log.component}]
                              </span>
                            )}

                            <span className="text-gray-200 break-all flex-1">{log.message}</span>

                            {log.data && (
                              <span className="text-[10px] text-purple-400 font-bold group-hover:underline shrink-0">
                                {isExpanded ? 'Свернуть' : 'Payload'}
                              </span>
                            )}
                          </div>

                          {/* Expandable Payload Viewer */}
                          {isExpanded && log.data && (
                            <div className="mt-2 p-2 bg-black/40 rounded border border-[#3d2b4f] text-[11px] text-emerald-300 overflow-x-auto">
                              <pre className="whitespace-pre-wrap break-words">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={logsEndRef} />
                </div>
              </>
            )}

            {/* TAB CONTENT: 2. AUTH & DB DEBUG */}
            {activeTab === 'auth_db' && (
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Auth Inspector Box */}
                <div className="bg-[#150d26] border border-[#3d2b4f] rounded-2xl p-4">
                  <div className="flex items-center justify-between border-b border-[#3d2b4f] pb-3 mb-3">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <Key size={16} className="text-[#ff4d4d]" />
                      <span>АВТОРИЗАЦИЯ И СЕССИЯ</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      user ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {user ? 'AUTHENTICATED' : 'ANONYMOUS / GUEST'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#3d2b4f]/40">
                      <span className="text-gray-400">UID:</span>
                      <span className="text-cyan-300 font-mono font-bold truncate max-w-[200px]">
                        {user?.uid || 'Не авторизован'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#3d2b4f]/40">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white truncate max-w-[200px]">
                        {user?.email || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#3d2b4f]/40">
                      <span className="text-gray-400">Имя:</span>
                      <span className="text-white truncate max-w-[200px]">
                        {user?.displayName || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#3d2b4f]/40">
                      <span className="text-gray-400">Email подтвержден:</span>
                      <span className={user?.emailVerified ? 'text-emerald-400' : 'text-amber-400'}>
                        {user ? (user.emailVerified ? 'Да (Verified)' : 'Нет') : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-3">
                      <button
                        type="button"
                        onClick={handleCopyUid}
                        disabled={!user}
                        className="flex-1 py-1.5 px-3 bg-[#251c35] hover:bg-[#3d2b4f] disabled:opacity-40 text-white rounded-lg text-[11px] font-bold border border-[#3d2b4f] transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {uidCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{uidCopied ? 'UID скопирован' : 'Скопировать UID'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyToken}
                        disabled={!user}
                        className="flex-1 py-1.5 px-3 bg-[#251c35] hover:bg-[#3d2b4f] disabled:opacity-40 text-white rounded-lg text-[11px] font-bold border border-[#3d2b4f] transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {tokenCopied ? <Check size={14} className="text-emerald-400" /> : <Key size={14} />}
                        <span>{tokenCopied ? 'JWT скопирован' : 'Скопировать JWT'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Firestore & DB Inspector Box */}
                <div className="bg-[#150d26] border border-[#3d2b4f] rounded-2xl p-4">
                  <div className="flex items-center justify-between border-b border-[#3d2b4f] pb-3 mb-3">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <Database size={16} className="text-[#a855f7]" />
                      <span>FIRESTORE & CONNECTIVITY</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isFirestoreNetworkOnline
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {isFirestoreNetworkOnline ? 'SDK ONLINE' : 'SDK OFFLINE'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dbLatency !== null && dbLatency >= 0
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : dbLatency === -1
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {dbLatency !== null && dbLatency >= 0
                          ? `${dbLatency}ms latency`
                          : dbLatency === -1
                          ? 'ERR'
                          : 'IDLE'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#3d2b4f]/40">
                      <span className="text-gray-400">Пинг до базы данных:</span>
                      <span className="text-white font-mono">
                        {dbLatency !== null && dbLatency >= 0 ? `${dbLatency} ms` : 'Не проверялось'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#3d2b4f]/40">
                      <span className="text-gray-400">Сетевой статус браузера:</span>
                      <span className={navigator.onLine ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {navigator.onLine ? '🟢 ОНЛАЙН (Browser)' : '🔴 ОФФЛАЙН (Browser)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#3d2b4f]/40">
                      <span className="text-gray-400">Статус Firestore SDK:</span>
                      <span className={isFirestoreNetworkOnline ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {isFirestoreNetworkOnline ? '🟢 ОНЛАЙН (enableNetwork)' : '🔴 ОФФЛАЙН (disableNetwork)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#3d2b4f]/40">
                      <span className="text-gray-400">ID Устройства (AHI):</span>
                      <span className="text-cyan-300 font-mono truncate max-w-[180px]">
                        {getDeviceId()}
                      </span>
                    </div>

                    {/* Network Controller Toggle Box */}
                    <div className="mt-3 p-3 bg-[#110820] border border-[#3d2b4f] rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          {isFirestoreNetworkOnline ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-red-400 animate-pulse" />}
                          Контроллер Сети Firestore
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {isFirestoreNetworkOnline ? 'Синхронизация активна' : 'Эмуляция сбоя сети'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleToggleFirestoreNetwork}
                          disabled={isTogglingNetwork}
                          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            isFirestoreNetworkOnline
                              ? 'bg-amber-500/10 hover:bg-red-500/20 text-amber-300 hover:text-red-300 border-amber-500/30 hover:border-red-500/40'
                              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 animate-pulse'
                          }`}
                        >
                          {isTogglingNetwork && !isSimulatingTimeout ? (
                            <RefreshCw size={14} className="animate-spin text-white" />
                          ) : isFirestoreNetworkOnline ? (
                            <WifiOff size={14} className="text-red-400" />
                          ) : (
                            <Wifi size={14} className="text-emerald-400" />
                          )}
                          <span>
                            {isTogglingNetwork && !isSimulatingTimeout
                              ? 'Переключение...'
                              : isFirestoreNetworkOnline
                              ? 'Отключить Сеть (disableNetwork)'
                              : 'Включить Сеть (enableNetwork)'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSimulateTimeout}
                          disabled={isTogglingNetwork || isSimulatingTimeout}
                          className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                            isSimulatingTimeout
                              ? 'bg-amber-500/30 border-amber-500/60 text-amber-200 animate-pulse'
                              : 'bg-purple-950/60 hover:bg-purple-900/80 border-purple-500/40 text-purple-200'
                          }`}
                          title="Симуляция временно отключит сеть на 5 секунд и автоматически возобновит работу"
                        >
                          <Timer size={14} className={isSimulatingTimeout ? 'animate-spin text-amber-400' : 'text-purple-400'} />
                          <span>
                            {isSimulatingTimeout ? `Таймаут 5с (${timeoutCountdown}с)` : 'Симулировать таймаут 5с'}
                          </span>
                        </button>
                      </div>

                      <p className="text-[10px] text-gray-400 leading-tight">
                        {isFirestoreNetworkOnline
                          ? 'disableNetwork() приостанавливает сетевой обмен. Firestore переходит в офлайн-режим и читает данные из кэша.'
                          : 'enableNetwork() возобновляет онлайн-синхронизацию Firestore с сервером Google Cloud.'}
                      </p>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={handleTestFirestore}
                        disabled={testingDb}
                        className="w-full py-2 bg-gradient-to-r from-[#ff4d4d]/20 to-[#a855f7]/20 hover:from-[#ff4d4d] hover:to-[#a855f7] hover:text-[#15101e] text-white font-bold rounded-xl border border-[#ff4d4d]/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                      >
                        <RefreshCw size={14} className={testingDb ? 'animate-spin' : ''} />
                        <span>{testingDb ? 'Тестируем Firestore...' : 'Пинг Firestore (Test DB Read)'}</span>
                      </button>

                      {/* Bulk Platform Reset & Telemetry Purge Panel */}
                      <div className="p-3 bg-[#110820] border border-red-500/30 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between border-b border-red-500/20 pb-1.5">
                          <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Flame size={14} className="text-red-400" />
                            Администрирование БД & Телеметрии
                          </span>
                          <span className="text-[10px] text-gray-400">Сохраняет рисунки и админов</span>
                        </div>

                        {resetSuccessMessage && (
                          <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-[11px] font-bold animate-pulse">
                            {resetSuccessMessage}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleBulkPlatformReset}
                            disabled={isResettingPlatform}
                            className="py-2 px-3 bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/50 hover:border-red-400 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                            title="Массовая перезапись БД: удаление комментариев, постов, телеметрии. Рисунки и админы остаются."
                          >
                            <Trash2 size={13} className={isResettingPlatform ? 'animate-spin' : ''} />
                            <span>{isResettingPlatform ? 'Перезапись БД...' : '🔥 Сброс Платформы'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handlePurgeTelemetry}
                            className="py-2 px-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 hover:border-amber-400 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                            title="Очистить только сохранённые логи телеметрии локально и в Firestore"
                          >
                            <Zap size={13} className="text-amber-400" />
                            <span>🧹 Очистить Телеметрию</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. ENV & STATE */}
            {activeTab === 'env_state' && (
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* System Hardware & Screen Box */}
                <div className="bg-[#150d26] border border-[#3d2b4f] rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-white font-bold text-xs border-b border-[#3d2b4f] pb-3 mb-3">
                    <Cpu size={16} className="text-cyan-400" />
                    <span>АППАРАТНАЯ СРЕДА И БРАУЗЕР</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#3d2b4f]/40">
                      <span className="text-gray-400">Сетевой протокол:</span>
                      <span className="text-emerald-400 font-bold font-mono flex items-center gap-1">
                        <Globe size={12} />
                        IPv6 Dual-Stack Primary
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#3d2b4f]/40">
                      <span className="text-gray-400">Экран:</span>
                      <span className="text-white font-mono">
                        {window.innerWidth}x{window.innerHeight} (DPR: {window.devicePixelRatio})
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#3d2b4f]/40">
                      <span className="text-gray-400">Процессорные потоки:</span>
                      <span className="text-white font-mono">
                        {navigator.hardwareConcurrency || 'N/A'} cores
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#3d2b4f]/40">
                      <span className="text-gray-400">ОЗУ (RAM):</span>
                      <span className="text-white font-mono">
                        {(navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 py-1">
                      <span className="text-gray-400">User-Agent:</span>
                      <span className="text-[10px] text-gray-400 bg-[#1c1130] p-2 rounded-lg font-mono break-all border border-[#3d2b4f]">
                        {navigator.userAgent}
                      </span>
                    </div>
                  </div>
                </div>

                {/* LocalStorage & Session Cache Inspector */}
                <div className="bg-[#150d26] border border-[#3d2b4f] rounded-2xl p-4">
                  <div className="flex items-center justify-between border-b border-[#3d2b4f] pb-3 mb-3">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <HardDrive size={16} className="text-emerald-400" />
                      <span>LOCALSTORAGE КЛЮЧИ</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.clear();
                        logger.info('localStorage cleared by DevConsole', null, 'DevConsole');
                        window.location.reload();
                      }}
                      className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                    >
                      Сбросить все хранилище
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {Object.keys(localStorage).length === 0 ? (
                      <p className="text-gray-500 text-xs py-4 text-center">LocalStorage пуст</p>
                    ) : (
                      Object.keys(localStorage).map((key) => {
                        const val = localStorage.getItem(key) || '';
                        return (
                          <div key={key} className="p-2 bg-[#1c1130] rounded-lg border border-[#3d2b4f]/60 flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <span className="text-cyan-300 font-bold block truncate">{key}</span>
                              <span className="text-gray-400 text-[10px] truncate block">{val}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                localStorage.removeItem(key);
                                logger.info(`Removed key ${key} from localStorage`, null, 'DevConsole');
                              }}
                              className="text-gray-400 hover:text-red-400 p-1 rounded transition-colors"
                              title="Удалить ключ"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 4. TESTS & REPORTS */}
            {activeTab === 'tests' && (
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trigger Logging Test Entries */}
                <div className="bg-[#150d26] border border-[#3d2b4f] rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-white font-bold text-xs border-b border-[#3d2b4f] pb-3 mb-3">
                    <Bug size={16} className="text-[#ff4d4d]" />
                    <span>ГЕНЕРАТОР ТЕСТОВЫХ ЛОГОВ (QA)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => logger.error('Test Error event from DevConsole QA', { code: 'TEST_ERR_500', time: Date.now() }, 'QA_Test')}
                      className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-left transition-all cursor-pointer font-bold"
                    >
                      <AlertCircle size={16} className="mb-1" />
                      <span>Error Лог</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => logger.warn('Test Warning event from DevConsole QA', { memoryUsage: 'high', cpu: 85 }, 'QA_Test')}
                      className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-left transition-all cursor-pointer font-bold"
                    >
                      <AlertTriangle size={16} className="mb-1" />
                      <span>Warn Лог</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => logger.perf('UI Render Benchmark Test', { durationMs: 12.4, fps: 60 }, 'QA_Test')}
                      className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-left transition-all cursor-pointer font-bold"
                    >
                      <Zap size={16} className="mb-1" />
                      <span>Perf Лог</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => logger.system('Cyber UI engine initialized correctly', { version: '2.5.0-ahi' })}
                      className="p-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-left transition-all cursor-pointer font-bold"
                    >
                      <Shield size={16} className="mb-1" />
                      <span>System Лог</span>
                    </button>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        logger.info('Stress Test Entry #1: Init', null, 'QA_Stress');
                        logger.perf('Stress Test Entry #2: Render', { durationMs: 4.8 }, 'QA_Stress');
                        logger.warn('Stress Test Entry #3: High Cache Size', { cacheMB: 120 }, 'QA_Stress');
                        logger.action('Stress Test Entry #4: User Clicked Button', { btnId: 'dev_stress' }, 'QA_Stress');
                        logger.error('Stress Test Entry #5: Simulated API Timeout', { status: 408 }, 'QA_Stress');
                      }}
                      className="w-full py-2 bg-[#251c35] hover:bg-[#ff4d4d] hover:text-[#15101e] text-white font-bold rounded-xl border border-[#3d2b4f] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Flame size={14} className="text-[#ff4d4d] group-hover:text-[#15101e]" />
                      <span>Сгенерировать 5 тестовых записей разом</span>
                    </button>
                  </div>
                </div>

                {/* Markdown Diagnostics Bundle Export */}
                <div className="bg-[#150d26] border border-[#3d2b4f] rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-white font-bold text-xs border-b border-[#3d2b4f] pb-3 mb-3">
                      <ClipboardCheck size={16} className="text-purple-400" />
                      <span>ОТЧЕТ ДЛЯ БАГТРЕКЕРА И РАЗРАБОТЧИКОВ</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Генерирует полный Markdown отчёт со всеми характеристиками системы, данными пользователя, ошибками и последними логами для быстрой вставки в GitHub Issues или чат поддержки.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleCopyDiagnosticsReport}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-[#ff4d4d] hover:opacity-90 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {reportCopied ? <Check size={18} className="text-emerald-300" /> : <Copy size={18} />}
                      <span>{reportCopied ? 'ОТЧЕТ СКОПИРОВАН В БУФЕР!' : 'СКОПИРОВАТЬ MARKDOWN ОТЧЕТ'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 5. QUERY MONITOR */}
            {activeTab === 'queries' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Network Controller Header Bar inside Query Monitor */}
                <div className="bg-[#150d26] border border-[#3d2b4f] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isFirestoreNetworkOnline ? (
                      <Wifi size={16} className="text-emerald-400 shrink-0" />
                    ) : (
                      <WifiOff size={16} className="text-red-400 animate-pulse shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Контроллер Сети Firestore:{' '}
                        <span className={isFirestoreNetworkOnline ? 'text-emerald-400' : 'text-red-400'}>
                          {isFirestoreNetworkOnline ? 'ОНЛАЙН (enableNetwork)' : 'ОФФЛАЙН (disableNetwork)'}
                        </span>
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {isFirestoreNetworkOnline
                          ? 'Запросы обращаются к сети и локальному кэшу'
                          : 'Сеть отключена — все запросы обслуживаются исключительно из кэша DbQueryCore / Firestore'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleFirestoreNetwork}
                      disabled={isTogglingNetwork}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isFirestoreNetworkOnline
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 animate-pulse'
                      }`}
                    >
                      {isTogglingNetwork && !isSimulatingTimeout ? (
                        <RefreshCw size={12} className="animate-spin text-white" />
                      ) : isFirestoreNetworkOnline ? (
                        <WifiOff size={12} className="text-red-400" />
                      ) : (
                        <Wifi size={12} className="text-emerald-400" />
                      )}
                      <span>
                        {isFirestoreNetworkOnline
                          ? 'Симулировать обрыв'
                          : 'Восстановить связь'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulateTimeout}
                      disabled={isTogglingNetwork || isSimulatingTimeout}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSimulatingTimeout
                          ? 'bg-amber-500/30 border-amber-500/60 text-amber-200 animate-pulse'
                          : 'bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border-purple-500/40'
                      }`}
                      title="Отключает Firestore на 5 секунд для проверки устойчивости к сбоям соединения"
                    >
                      <Timer size={12} className={isSimulatingTimeout ? 'animate-spin text-amber-400' : 'text-purple-400'} />
                      <span>
                        {isSimulatingTimeout ? `Таймаут (${timeoutCountdown}с)` : 'Таймаут 5с'}
                      </span>
                    </button>
                  </div>
                </div>

                <AhaQueryMonitor />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

