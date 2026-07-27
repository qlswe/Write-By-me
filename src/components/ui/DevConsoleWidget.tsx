import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Trash2, Download, Search, Copy, Check, Filter, AlertTriangle, AlertCircle, Info, Zap, Shield, Play, Pause, Maximize2, Minimize2 } from 'lucide-react';
import { logger } from '../../utils/logger';

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
  const [logs, setLogs] = useState(() => logger.getLogs());
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogIndex, setExpandedLogIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to logger events
    const unsubscribe = logger.subscribe(() => {
      setLogs(logger.getLogs());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (autoScroll && isOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, autoScroll, isOpen]);

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
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full border shadow-2xl font-mono text-xs font-bold transition-all duration-300 ${
          isOpen
            ? 'bg-[#ff4d4d] text-white border-white/30 shadow-[0_0_20px_rgba(255,77,77,0.6)] scale-105'
            : 'bg-[#150e24]/90 backdrop-blur-md text-gray-200 border-[#3d2b4f] hover:border-[#ff4d4d] hover:shadow-[0_0_15px_rgba(255,77,77,0.4)]'
        }`}
        title="Переключить виджет Консоли Сайта"
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
            <div className="bg-[#120a21] px-4 py-2.5 border-b border-[#291740] flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Title & Stats */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[#ff4d4d] font-bold">
                  <Terminal size={16} />
                  <span className="text-white font-sans font-black tracking-wide uppercase text-xs">
                    КОНСОЛЬ САЙТА
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <span className="px-2 py-0.5 rounded bg-[#1e1035] border border-[#3d2b4f]">
                    Записи: <strong className="text-white">{logs.length}</strong>
                  </span>
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
              </div>

              {/* Filters & Actions */}
              <div className="flex items-center gap-2 overflow-x-auto py-1">
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
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="bg-[#1a0e30] border border-[#3d2b4f] text-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#ff4d4d] text-xs"
                >
                  <option value="ALL">Все уровни</option>
                  <option value="INFO">Info</option>
                  <option value="WARN">Warn</option>
                  <option value="ERROR">Error</option>
                  <option value="PERF">Perf</option>
                  <option value="SYSTEM">System</option>
                  <option value="ACTION">Action</option>
                </select>

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

                {/* Maximize Toggle */}
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 rounded-lg bg-[#1a0e30] border border-[#3d2b4f] text-gray-300 hover:text-white transition-all hidden sm:block"
                  title={isMaximized ? 'Свернуть' : 'Развернуть на весь экран'}
                >
                  {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white transition-all"
                  title="Закрыть консоль"
                >
                  <X size={12} />
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
                        <div className="mt-2 p-2 bg.black/40 rounded border border-[#3d2b4f] text-[11px] text-emerald-300 overflow-x-auto">
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
