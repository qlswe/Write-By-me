import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, ShieldAlert, ShieldX, Clock, Laptop, Smartphone, 
  Globe, Copy, Check, Filter, Search, Download, Trash2, RefreshCw, 
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Eye, Sparkles,
  Layers, HardDrive, Key, Lock, ExternalLink
} from 'lucide-react';
import { Language } from '../../data/translations';
import { 
  SecurityCheckpointAttempt, 
  fetchSecurityCheckpointLogs, 
  clearSecurityCheckpointLogs, 
  logSecurityCheckpointAttempt,
  formatSecurityRelativeTime 
} from '../../utils/securityActivityLogger';
import { openAccountSecurityCheckpoint } from '../../utils/accountSecurity';

interface SecurityActivityLogSectionProps {
  userId: string;
  lang: Language;
  onToast?: (message: string) => void;
}

type FilterStatus = 'all' | 'success' | 'failed' | 'totp' | 'device';

export const SecurityActivityLogSection: React.FC<SecurityActivityLogSectionProps> = ({
  userId,
  lang,
  onToast
}) => {
  const [logs, setLogs] = useState<SecurityCheckpointAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await fetchSecurityCheckpointLogs(userId);
      setLogs(data);
    } catch (e) {
      console.warn('Failed to load security activity logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [userId]);

  // Listen to live broadcast events
  useEffect(() => {
    const handleLogRecorded = () => {
      loadLogs();
    };
    window.addEventListener('aha_security_log_recorded', handleLogRecorded);
    return () => window.removeEventListener('aha_security_log_recorded', handleLogRecorded);
  }, [userId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLogs();
    setTimeout(() => setIsRefreshing(false), 400);
    if (onToast) onToast(lang === 'ru' ? 'Журнал обновлен' : 'Activity log refreshed');
  };

  const handleCopyDeviceId = (devId: string, eventId: string) => {
    navigator.clipboard.writeText(devId);
    setCopiedId(eventId);
    if (onToast) onToast(lang === 'ru' ? 'Device ID скопирован в буфер' : 'Device ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleClearHistory = async () => {
    const confirm = window.confirm(
      lang === 'ru'
        ? 'Вы действительно хотите очистить всю историю проверок безопасности аккаунта?'
        : 'Are you sure you want to clear all account security checkpoint logs?'
    );
    if (!confirm) return;

    setIsClearing(true);
    await clearSecurityCheckpointLogs(userId);
    setLogs([]);
    setIsClearing(false);
    if (onToast) onToast(lang === 'ru' ? 'История активности очищена' : 'Security logs cleared');
  };

  const handleSimulateTestCheckpoint = async (status: 'success' | 'failed') => {
    if (!userId) return;
    if (status === 'success') {
      await logSecurityCheckpointAttempt(userId, {
        status: 'success',
        actionType: 'checkpoint_accessed',
        actionName: 'Manual Security Verification',
        details: 'User initiated diagnostic test. Device signature and biometric markers verified successfully.',
        detailsRu: 'Пользователь запустил диагностический тест. Подпись устройства и маркеры успешно проверены.',
        score: 95,
        isTrusted: true
      });
      if (onToast) onToast(lang === 'ru' ? 'Записана успешная проверка' : 'Logged successful test checkpoint');
    } else {
      await logSecurityCheckpointAttempt(userId, {
        status: 'failed',
        actionType: 'totp_failed',
        actionName: 'Simulated Security Challenge',
        details: 'Simulated security trigger: Invalid authentication token provided during audit check.',
        detailsRu: 'Имитация проверки: Передан недействительный токен аутентификации при аудите.',
        score: 45,
        isTrusted: false
      });
      if (onToast) onToast(lang === 'ru' ? 'Записана неудачная проверка' : 'Logged failed test attempt');
    }
    await loadLogs();
  };

  const handleExportLogs = (format: 'json' | 'txt') => {
    if (logs.length === 0) return;

    let content = '';
    let filename = `security_activity_logs_${new Date().toISOString().split('T')[0]}`;

    if (format === 'json') {
      content = JSON.stringify(logs, null, 2);
      filename += '.json';
    } else {
      content = `==========================================================\n` +
        `AHA THEORY VAULT - SECURITY CHECKPOINT AUDIT LOG\n` +
        `User ID: ${userId}\n` +
        `Exported: ${new Date().toLocaleString()}\n` +
        `Total Attempts: ${logs.length}\n` +
        `==========================================================\n\n` +
        logs.map((log, idx) => {
          return `[#${idx + 1}] ${log.status.toUpperCase()} | ${log.actionName} (${log.actionType})\n` +
            `Timestamp: ${new Date(log.timestamp).toLocaleString()} (${log.isoDate})\n` +
            `Details (EN): ${log.details}\n` +
            `Details (RU): ${log.detailsRu}\n` +
            `Score: ${log.score !== undefined ? log.score + '/100' : 'N/A'}\n` +
            `Device ID: ${log.deviceInfo.deviceId}\n` +
            `OS / Browser: ${log.deviceInfo.os} / ${log.deviceInfo.browser}\n` +
            `Trusted Device: ${log.deviceInfo.isTrustedDevice ? 'YES' : 'NO'}\n` +
            `Screen: ${log.deviceInfo.screenResolution}\n` +
            `----------------------------------------------------------\n`;
        }).join('\n');
      filename += '.txt';
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    if (onToast) onToast(lang === 'ru' ? 'Журнал экспортирован' : 'Audit logs exported');
  };

  // Filter & Search Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Status/Category filter
      if (filter === 'success' && log.status !== 'success') return false;
      if (filter === 'failed' && (log.status !== 'failed' && log.status !== 'blocked')) return false;
      if (filter === 'totp' && !['totp_verified', 'totp_failed', 'backup_code_used', 'totp_activated', 'totp_disabled'].includes(log.actionType)) return false;
      if (filter === 'device' && !['device_trusted', 'biometric_verified'].includes(log.actionType)) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (log.actionName || '').toLowerCase().includes(q);
        const matchDetailsEn = (log.details || '').toLowerCase().includes(q);
        const matchDetailsRu = (log.detailsRu || '').toLowerCase().includes(q);
        const matchDevId = (log.deviceInfo?.deviceId || '').toLowerCase().includes(q);
        const matchBrowser = (log.deviceInfo?.browser || '').toLowerCase().includes(q);
        const matchOs = (log.deviceInfo?.os || '').toLowerCase().includes(q);
        return matchName || matchDetailsEn || matchDetailsRu || matchDevId || matchBrowser || matchOs;
      }

      return true;
    });
  }, [logs, filter, searchQuery]);

  const stats = useMemo(() => {
    const total = logs.length;
    const successes = logs.filter(l => l.status === 'success').length;
    const failures = logs.filter(l => l.status === 'failed' || l.status === 'blocked').length;
    const lastAttempt = logs[0] || null;
    return { total, successes, failures, lastAttempt };
  }, [logs]);

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-[#1c152a]/60 border border-[#3d2b4f]/40 flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
          {lang === 'ru' ? 'Загрузка журнала безопасности...' : 'Loading security activity logs...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Total Activity */}
        <div className="p-3 sm:p-4 rounded-2xl bg-[#1c152a] border border-[#3d2b4f] flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] sm:text-[10px] font-black text-white/50 uppercase tracking-wider block mb-0.5 truncate">
              {lang === 'ru' ? 'Всего проверок' : 'Total Checks'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {stats.total}
            </span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
            <Layers size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Successful Passes */}
        <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] sm:text-[10px] font-black text-emerald-400/90 uppercase tracking-wider block mb-0.5 truncate">
              {lang === 'ru' ? 'Успешно' : 'Passed'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {stats.successes}
            </span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
            <ShieldCheck size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Failed / Blocked Attempts */}
        <div className={`p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-2 min-w-0 ${
          stats.failures > 0 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-[#1c152a] border-[#3d2b4f]'
        }`}>
          <div className="min-w-0 flex-1">
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider block mb-0.5 truncate ${
              stats.failures > 0 ? 'text-red-400/90' : 'text-white/50'
            }`}>
              {lang === 'ru' ? 'Ошибки' : 'Failed'}
            </span>
            <span className={`text-xl sm:text-2xl font-black font-mono ${
              stats.failures > 0 ? 'text-red-400' : 'text-white/60'
            }`}>
              {stats.failures}
            </span>
          </div>
          <div className={`p-2 sm:p-2.5 rounded-xl border shrink-0 ${
            stats.failures > 0 
              ? 'bg-red-500/20 text-red-400 border-red-500/30' 
              : 'bg-white/5 text-white/40 border-white/10'
          }`}>
            <ShieldAlert size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#15101e] border border-[#3d2b4f] space-y-5 shadow-xl">
        {/* Header and Action Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3d2b4f] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-purple-400" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                {lang === 'ru' ? 'Журнал Контрольных Точек Безопасности' : 'Security Checkpoint Activity & Audit Log'}
              </h4>
            </div>
            <p className="text-xs text-white/50 mt-1">
              {lang === 'ru' 
                ? 'История успешных и отклоненных попыток авторизации, 2FA подтверждений и доверенных устройств' 
                : 'Timeline of successful and blocked access attempts, 2FA verifications, and device telemetry'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-white/10"
              title={lang === 'ru' ? 'Обновить список' : 'Refresh list'}
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{lang === 'ru' ? 'Обновить' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => handleExportLogs('json')}
              className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>JSON</span>
            </button>

            <button
              onClick={() => handleExportLogs('txt')}
              className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>TXT</span>
            </button>

            <button
              onClick={handleClearHistory}
              disabled={isClearing || logs.length === 0}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 disabled:opacity-40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title={lang === 'ru' ? 'Очистить историю' : 'Clear log'}
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">{lang === 'ru' ? 'Очистить' : 'Clear'}</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'
              }`}
            >
              {lang === 'ru' ? 'Все' : 'All'} ({logs.length})
            </button>

            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'success'
                  ? 'bg-emerald-500 text-[#15101e] shadow-md shadow-emerald-500/20 font-black'
                  : 'bg-white/5 text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/10'
              }`}
            >
              <Check size={12} />
              <span>{lang === 'ru' ? 'Успешные' : 'Passed'}</span>
            </button>

            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'failed'
                  ? 'bg-red-500 text-[#15101e] shadow-md shadow-red-500/20 font-black'
                  : 'bg-white/5 text-red-400/70 hover:text-red-300 hover:bg-red-500/10'
              }`}
            >
              <AlertTriangle size={12} />
              <span>{lang === 'ru' ? 'Ошибки' : 'Failed'}</span>
            </button>

            <button
              onClick={() => setFilter('totp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'totp'
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                  : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'
              }`}
            >
              <Key size={12} />
              <span>2FA</span>
            </button>

            <button
              onClick={() => setFilter('device')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'device'
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                  : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'
              }`}
            >
              <Laptop size={12} />
              <span>{lang === 'ru' ? 'Устройства' : 'Devices'}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ru' ? 'Поиск по устройству, ОС или действию...' : 'Search logs or device ID...'}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0e0a16] border border-[#3d2b4f] rounded-xl text-xs text-white placeholder-white/30 focus:border-purple-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Live Test Trigger Bar */}
        <div className="p-3 bg-[#1a1228] border border-purple-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-white/70">
            <Sparkles size={14} className="text-amber-400 shrink-0" />
            <span>
              {lang === 'ru' 
                ? 'Проверить работу логирования в реальном времени:' 
                : 'Trigger real-time diagnostic checkpoint simulation:'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSimulateTestCheckpoint('success')}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 size={12} />
              <span>{lang === 'ru' ? '+ Успешный тест' : '+ Log Success'}</span>
            </button>

            <button
              onClick={() => handleSimulateTestCheckpoint('failed')}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
            >
              <AlertTriangle size={12} />
              <span>{lang === 'ru' ? '+ Ошибка' : '+ Log Failure'}</span>
            </button>

            <button
              onClick={() => openAccountSecurityCheckpoint(lang === 'ru' ? 'Диагностика из профиля' : 'Profile Security Audit')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <ExternalLink size={12} />
              <span>{lang === 'ru' ? 'Запустить Gate' : 'Open Gate'}</span>
            </button>
          </div>
        </div>

        {/* Log Entries List */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="py-12 px-4 rounded-2xl bg-[#0e0a16] border border-dashed border-[#3d2b4f] text-center space-y-2">
              <ShieldCheck size={32} className="mx-auto text-white/20" />
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
                {lang === 'ru' ? 'Записей активности не найдено' : 'No checkpoint activity recorded'}
              </p>
              <p className="text-[11px] text-white/30 max-w-sm mx-auto">
                {searchQuery 
                  ? (lang === 'ru' ? 'Попробуйте изменить поисковый запрос или фильтр.' : 'Try changing your search keywords or filter tab.') 
                  : (lang === 'ru' ? 'Здесь будут появляться все попытки прохождения контрольной точки безопасности.' : 'All security checkpoint interactions and 2FA verifications will appear here.')}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isSuccess = log.status === 'success';
              const isExpanded = expandedLogId === log.id;
              const relativeTime = formatSecurityRelativeTime(log.timestamp, lang === 'ru' ? 'ru' : 'en');
              const formattedDate = new Date(log.timestamp).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSuccess
                      ? 'bg-[#181324] border-[#3d2b4f] hover:border-emerald-500/40'
                      : 'bg-red-950/20 border-red-500/30 hover:border-red-500/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Status Icon & Main Title */}
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isSuccess
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-lg shadow-red-500/10'
                      }`}>
                        {isSuccess ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-white uppercase tracking-wider">
                            {log.actionName || 'Account Security Gate'}
                          </span>
                          
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest ${
                            isSuccess
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border-red-500/40'
                          }`}>
                            {isSuccess 
                              ? (lang === 'ru' ? 'УСПЕШНО' : 'PASSED') 
                              : (lang === 'ru' ? 'ОТКЛОНЕНО' : 'BLOCKED')}
                          </span>

                          {log.score !== undefined && (
                            <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                              Score: {log.score}/100
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-white/80 leading-relaxed">
                          {lang === 'ru' ? log.detailsRu || log.details : log.details}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp Tag */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 text-right">
                      <span className="text-[11px] font-bold text-white/70">
                        {relativeTime}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Device Telemetry Pill Strip */}
                  <div className="mt-3 pt-3 border-t border-[#3d2b4f]/60 flex flex-wrap items-center gap-2 text-[11px]">
                    {/* OS Tag */}
                    <div className="px-2.5 py-1 bg-[#0e0a16] border border-[#3d2b4f] rounded-lg text-white/70 flex items-center gap-1.5 font-mono">
                      <Laptop size={12} className="text-purple-400" />
                      <span>{log.deviceInfo.os || 'Unknown OS'}</span>
                    </div>

                    {/* Browser Tag */}
                    <div className="px-2.5 py-1 bg-[#0e0a16] border border-[#3d2b4f] rounded-lg text-white/70 flex items-center gap-1.5 font-mono">
                      <Globe size={12} className="text-blue-400" />
                      <span>{log.deviceInfo.browser || 'Browser'}</span>
                    </div>

                    {/* Device ID with Copy */}
                    <div className="px-2.5 py-1 bg-[#0e0a16] border border-[#3d2b4f] rounded-lg text-white/60 flex items-center gap-1.5 font-mono">
                      <HardDrive size={12} className="text-amber-400" />
                      <span className="truncate max-w-[120px]">{log.deviceInfo.deviceId}</span>
                      <button
                        onClick={() => handleCopyDeviceId(log.deviceInfo.deviceId, log.id)}
                        className="text-purple-400 hover:text-purple-300 ml-1 cursor-pointer transition-colors"
                        title={lang === 'ru' ? 'Копировать Device ID' : 'Copy Device ID'}
                      >
                        {copiedId === log.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Trusted device indicator */}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      log.deviceInfo.isTrustedDevice
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}>
                      {log.deviceInfo.isTrustedDevice 
                        ? (lang === 'ru' ? 'Доверенное' : 'Trusted') 
                        : (lang === 'ru' ? 'Временное' : 'Transient')}
                    </span>

                    {/* Expand Details Toggle */}
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="ml-auto text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? (lang === 'ru' ? 'Свернуть' : 'Less') : (lang === 'ru' ? 'Подробнее' : 'Details')}</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>

                  {/* Expanded Technical Details Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-[#3d2b4f]/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-[#0e0a16] p-3 rounded-xl border border-purple-500/20"
                      >
                        <div>
                          <span className="text-white/40">Action Type:</span>{' '}
                          <span className="text-purple-300">{log.actionType}</span>
                        </div>
                        <div>
                          <span className="text-white/40">Event ID:</span>{' '}
                          <span className="text-white/70 select-all">{log.id}</span>
                        </div>
                        <div>
                          <span className="text-white/40">Screen & Scale:</span>{' '}
                          <span className="text-white/70">{log.deviceInfo.screenResolution}</span>
                        </div>
                        <div>
                          <span className="text-white/40">Time Zone / Lang:</span>{' '}
                          <span className="text-white/70">{log.deviceInfo.timeZone} ({log.deviceInfo.language})</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-white/40">Full Device Fingerprint:</span>{' '}
                          <span className="text-amber-300 break-all select-all">{log.deviceInfo.deviceId}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
