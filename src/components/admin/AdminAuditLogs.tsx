import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Search, Filter, ShieldAlert, UserX, UserCheck, 
  Trash2, FileText, Video, MessageSquare, Database, Ban, Shield, 
  Clock, Download, RefreshCw, X, AlertCircle, ChevronLeft, ChevronRight, User, Printer, FileSpreadsheet
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit, deleteDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Language } from '../../data/translations';
import { AuditLogItem } from '../../utils/auditLogger';
import { printHtmlReport } from '../../utils/printReport';

interface AdminAuditLogsProps {
  lang: Language;
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ lang }) => {
  const { user, role, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'user_management' | 'content_management' | 'system'>('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 15;

  useEffect(() => {
    if (authLoading) return;
    if (!user || (role !== 'admin' && role !== 'moderator')) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'admin_audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(500)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: AuditLogItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          ...data
        } as AuditLogItem);
      });
      setLogs(loaded);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to admin audit logs:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, role, authLoading]);

  // Filter by time range
  const timeFilteredLogs = useMemo(() => {
    if (timeRange === 'all') return logs;
    const now = Date.now();
    let limitMs = 7 * 24 * 60 * 60 * 1000;
    if (timeRange === '24h') limitMs = 24 * 60 * 60 * 1000;
    if (timeRange === '30d') limitMs = 30 * 24 * 60 * 60 * 1000;

    return logs.filter(log => {
      let timeMs: number | null = null;
      if (log.timestamp) {
        if (typeof log.timestamp.toDate === 'function') timeMs = log.timestamp.toDate().getTime();
        else if (log.timestamp.seconds) timeMs = log.timestamp.seconds * 1000;
        else if (typeof log.timestamp === 'number') timeMs = log.timestamp;
      }
      if (!timeMs) return true;
      return (now - timeMs) <= limitMs;
    });
  }, [logs, timeRange]);

  // Filter by search query and category
  const filteredLogs = useMemo(() => {
    return timeFilteredLogs.filter(log => {
      const term = searchQuery.toLowerCase();
      const matchesSearch = (
        (log.adminName || '').toLowerCase().includes(term) ||
        (log.adminEmail || '').toLowerCase().includes(term) ||
        (log.action || '').toLowerCase().includes(term) ||
        (log.targetName || '').toLowerCase().includes(term) ||
        (log.targetId || '').toLowerCase().includes(term) ||
        (log.details || '').toLowerCase().includes(term)
      );

      const matchesCategory = categoryFilter === 'all' || log.actionType === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [timeFilteredLogs, searchQuery, categoryFilter]);

  // Metrics summary
  const stats = useMemo(() => {
    const total = logs.length;
    const userActions = logs.filter(l => l.actionType === 'user_management').length;
    const contentActions = logs.filter(l => l.actionType === 'content_management').length;
    const systemActions = logs.filter(l => l.actionType === 'system').length;
    const uniqueAdmins = new Set(logs.map(l => l.adminEmail)).size;

    return { total, userActions, contentActions, systemActions, uniqueAdmins };
  }, [logs]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * logsPerPage;
    return filteredLogs.slice(start, start + logsPerPage);
  }, [filteredLogs, currentPage, logsPerPage]);

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = [
      'ID записи', 
      'Дата и Время UTC', 
      'Имя Администратора', 
      'Email Администратора', 
      'Код Действия', 
      'Категория', 
      'Целевой объект', 
      'ID объекта', 
      'Детали / Подробности'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = [headers.map(escapeCsv).join(';')];

    filteredLogs.forEach(log => {
      let formattedTime = '';
      if (log.timestamp?.toDate) formattedTime = log.timestamp.toDate().toISOString();
      else if (log.timestamp?.seconds) formattedTime = new Date(log.timestamp.seconds * 1000).toISOString();
      else if (typeof log.timestamp === 'number') formattedTime = new Date(log.timestamp).toISOString();

      const row = [
        log.id,
        formattedTime,
        log.adminName || '',
        log.adminEmail || '',
        log.action || '',
        log.actionType || '',
        log.targetName || '',
        log.targetId || '',
        log.details || ''
      ].map(escapeCsv);

      rows.push(row.join(';'));
    });

    const bom = '\uFEFF';
    const blob = new Blob([bom + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `admin_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrintAuditLogs = () => {
    if (filteredLogs.length === 0) return;

    const dateStr = new Date().toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US');

    const rowsHtml = filteredLogs.map((log, idx) => {
      let formattedTime = '';
      if (log.timestamp?.toDate) formattedTime = log.timestamp.toDate().toISOString().replace('T', ' ').slice(0, 19);
      else if (log.timestamp?.seconds) formattedTime = new Date(log.timestamp.seconds * 1000).toISOString().replace('T', ' ').slice(0, 19);
      else if (typeof log.timestamp === 'number') formattedTime = new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19);

      return `<tr>
        <td style="color: #6b7280;">${idx + 1}</td>
        <td style="font-weight: bold; white-space: nowrap;">${formattedTime}</td>
        <td><strong>${log.adminName || 'Admin'}</strong><br/><span style="color: #6b7280; font-size: 9px;">${log.adminEmail || ''}</span></td>
        <td style="font-weight: bold; color: #7c3aed;">${log.action || '-'}</td>
        <td><span class="badge">${log.actionType || '-'}</span></td>
        <td>${log.targetName || log.targetId || '-'}</td>
        <td>${log.details || '-'}</td>
      </tr>`;
    }).join('');

    const html = `
      <div class="header-box">
        <div>
          <div style="font-size: 10px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px;">AHA RADIO STATION — ADMIN SECURITY AUDIT</div>
          <h1>${lang === 'ru' ? 'Журнал Аудита Действий Администрации' : 'Administrative Audit Log Report'}</h1>
          <div style="font-size: 10px; color: #4b5563; margin-top: 2px;">
            ${lang === 'ru' ? 'Сформировано:' : 'Generated:'} ${dateStr} | ${lang === 'ru' ? 'Всего записей:' : 'Total entries:'} ${filteredLogs.length} | ${lang === 'ru' ? 'Оператор:' : 'Operator:'} ${user?.email || 'Admin'}
          </div>
        </div>
        <div style="text-align: right; font-size: 10px; font-family: monospace;">
          <div>${lang === 'ru' ? 'Фильтр категории:' : 'Category filter:'} <strong>${categoryFilter.toUpperCase()}</strong></div>
          <div>${lang === 'ru' ? 'Временной интервал:' : 'Time filter:'} <strong>${timeRange.toUpperCase()}</strong></div>
        </div>
      </div>

      <h2>${lang === 'ru' ? 'Реестр вызовов и действий' : 'Action Registry'}</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>${lang === 'ru' ? 'Дата / Время' : 'Timestamp'}</th>
            <th>${lang === 'ru' ? 'Администратор' : 'Admin'}</th>
            <th>${lang === 'ru' ? 'Действие' : 'Action'}</th>
            <th>${lang === 'ru' ? 'Категория' : 'Category'}</th>
            <th>${lang === 'ru' ? 'Объект' : 'Target'}</th>
            <th>${lang === 'ru' ? 'Подробности' : 'Details'}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <div>Aha Radio Station Security Audit &copy; 2026</div>
        <div>CONFIDENTIAL — FOR INTERNAL ADMINISTRATIVE USE ONLY</div>
      </div>
    `;

    printHtmlReport(html, `Aha_Audit_Logs_${new Date().toISOString().slice(0, 10)}`);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'DELETE_USER':
        return { label: lang === 'ru' ? 'Удаление юзера' : 'Delete User', bg: 'bg-red-500/20 text-red-400 border-red-500/30', icon: UserX };
      case 'BAN_USER':
        return { label: lang === 'ru' ? 'Блокировка юзера' : 'Ban User', bg: 'bg-red-600/20 text-red-300 border-red-600/30', icon: Ban };
      case 'UNBAN_USER':
        return { label: lang === 'ru' ? 'Разблокировка' : 'Unban User', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: UserCheck };
      case 'CHANGE_ROLE':
        return { label: lang === 'ru' ? 'Смена роли' : 'Role Change', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Shield };
      case 'DELETE_AVATAR':
        return { label: lang === 'ru' ? 'Сброс аватара' : 'Reset Avatar', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Trash2 };
      case 'BLOCK_EMAIL':
        return { label: lang === 'ru' ? 'Черный список Email' : 'Blacklist Email', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: ShieldAlert };
      case 'UNBLOCK_EMAIL':
        return { label: lang === 'ru' ? 'Удален из ЧС' : 'Unblocked Email', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: UserCheck };
      case 'DELETE_STREAM':
        return { label: lang === 'ru' ? 'Удаление стрима' : 'Delete Stream', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: Video };
      case 'DELETE_FORUM_THREAD':
        return { label: lang === 'ru' ? 'Удаление темы' : 'Delete Thread', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: FileText };
      case 'DELETE_FORUM_COMMENT':
        return { label: lang === 'ru' ? 'Удаление коммента' : 'Delete Comment', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: MessageSquare };
      case 'CLEAR_TELEMETRY':
        return { label: lang === 'ru' ? 'Очистка телеметрии' : 'Clear Telemetry', bg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30', icon: Database };
      default:
        return { label: action, bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: ShieldCheck };
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return lang === 'ru' ? 'Только что' : 'Just now';
    let d: Date | null = null;
    if (typeof ts.toDate === 'function') d = ts.toDate();
    else if (ts.seconds) d = new Date(ts.seconds * 1000);
    else if (typeof ts === 'number') d = new Date(ts);
    else if (typeof ts === 'string') d = new Date(ts);

    if (!d || isNaN(d.getTime())) return lang === 'ru' ? 'Неизвестно' : 'Unknown';
    return d.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <RefreshCw className="animate-spin text-[#a855f7]" size={36} />
        <p className="text-gray-400 text-sm font-medium animate-pulse">
          {lang === 'ru' ? 'Загрузка журнала действий администраторов...' : 'Loading administrator audit logs...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#15101e] border border-[#3d2b4f]/40 rounded-2xl p-4 flex flex-col gap-1 shadow-lg relative overflow-hidden group hover:border-[#a855f7]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
            <span>{lang === 'ru' ? 'Всего Записей' : 'Total Audit Logs'}</span>
            <ShieldCheck size={18} className="text-[#a855f7]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">
            {stats.total}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">
            {lang === 'ru' ? 'Зафиксировано действий' : 'Recorded admin actions'}
          </div>
        </div>

        <div className="bg-[#15101e] border border-[#3d2b4f]/40 rounded-2xl p-4 flex flex-col gap-1 shadow-lg relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
            <span>{lang === 'ru' ? 'Юзер-Менеджмент' : 'User Mgmt'}</span>
            <UserX size={18} className="text-red-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-400 mt-1">
            {stats.userActions}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">
            {lang === 'ru' ? 'Удаления, баны, роли' : 'Deletions, bans, roles'}
          </div>
        </div>

        <div className="bg-[#15101e] border border-[#3d2b4f]/40 rounded-2xl p-4 flex flex-col gap-1 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
            <span>{lang === 'ru' ? 'Управление Контентом' : 'Content Mgmt'}</span>
            <FileText size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
            {stats.contentActions}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">
            {lang === 'ru' ? 'Стримы, темы, комменты' : 'Streams, threads, comments'}
          </div>
        </div>

        <div className="bg-[#15101e] border border-[#3d2b4f]/40 rounded-2xl p-4 flex flex-col gap-1 shadow-lg relative overflow-hidden group hover:border-[#00f0ff]/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
            <span>{lang === 'ru' ? 'Администраторы' : 'Active Admins'}</span>
            <Shield size={18} className="text-[#00f0ff]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#00f0ff] mt-1">
            {stats.uniqueAdmins}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">
            {lang === 'ru' ? 'Активных администраторов' : 'Unique logging admins'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#15101e] border border-[#3d2b4f]/50 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ru' ? 'Поиск по администратору, действию, цели или деталям...' : 'Search by admin, action, target or details...'}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0b0813] border border-[#3d2b4f]/60 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#a855f7] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#0b0813] p-1 rounded-xl border border-[#3d2b4f]/60">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                categoryFilter === 'all'
                  ? 'bg-[#a855f7] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {lang === 'ru' ? 'Все' : 'All'}
            </button>
            <button
              onClick={() => setCategoryFilter('user_management')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                categoryFilter === 'user_management'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {lang === 'ru' ? '👥 Юзеры' : 'Users'}
            </button>
            <button
              onClick={() => setCategoryFilter('content_management')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                categoryFilter === 'content_management'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {lang === 'ru' ? '📝 Контент' : 'Content'}
            </button>
            <button
              onClick={() => setCategoryFilter('system')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                categoryFilter === 'system'
                  ? 'bg-fuchsia-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {lang === 'ru' ? '⚙️ Система' : 'System'}
            </button>
          </div>

          {/* Time range picker */}
          <select
            value={timeRange}
            onChange={(e: any) => setTimeRange(e.target.value)}
            className="bg-[#0b0813] border border-[#3d2b4f]/60 rounded-xl px-3 py-2 text-xs font-bold text-gray-300 outline-none focus:border-[#a855f7]"
          >
            <option value="all">{lang === 'ru' ? 'За все время' : 'All time'}</option>
            <option value="24h">{lang === 'ru' ? 'За 24 часа' : 'Last 24 hours'}</option>
            <option value="7d">{lang === 'ru' ? 'За 7 дней' : 'Last 7 days'}</option>
            <option value="30d">{lang === 'ru' ? 'За 30 дней' : 'Last 30 days'}</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 bg-[#251c35] hover:bg-[#3d2b4f] disabled:opacity-40 text-white text-xs font-bold px-3 py-2 rounded-xl border border-[#3d2b4f] transition-all cursor-pointer"
            title={lang === 'ru' ? 'Экспорт истории действий в CSV' : 'Export audit log to CSV'}
          >
            <FileSpreadsheet size={14} className="text-[#00f0ff]" />
            <span className="hidden sm:inline">{lang === 'ru' ? 'Экспорт CSV' : 'Export CSV'}</span>
          </button>

          {/* Print */}
          <button
            onClick={triggerPrintAuditLogs}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 bg-[#251c35] hover:bg-[#a855f7] disabled:opacity-40 text-white text-xs font-bold px-3 py-2 rounded-xl border border-[#3d2b4f] transition-all cursor-pointer"
            title={lang === 'ru' ? 'Печать журнала' : 'Print audit logs'}
          >
            <Printer size={14} className="text-[#a855f7]" />
            <span className="hidden sm:inline">{lang === 'ru' ? 'Печать' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table / List */}
      <div className="bg-[#15101e] border border-[#3d2b4f]/40 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#3d2b4f]/40 bg-[#0d0b14]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-[#a855f7]" />
            <h3 className="text-white font-black text-sm uppercase tracking-wider">
              {lang === 'ru' ? 'История Критических Действий' : 'Critical Action Audit History'}
            </h3>
            <span className="bg-[#3d2b4f]/50 text-gray-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {filteredLogs.length}
            </span>
          </div>
        </div>

        {paginatedLogs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <ShieldCheck size={48} className="text-gray-600 mb-3" />
            <p className="text-white font-bold text-base">
              {lang === 'ru' ? 'Записи действий не найдены' : 'No admin audit logs found'}
            </p>
            <p className="text-gray-400 text-xs mt-1 max-w-sm">
              {searchQuery || categoryFilter !== 'all' 
                ? (lang === 'ru' ? 'Попробуйте изменить параметры поиска или фильтры.' : 'Try adjusting your search criteria or category filters.')
                : (lang === 'ru' ? 'Все действия администраторов будут отображаться здесь в реальном времени.' : 'All administrator actions will be logged here in real-time.')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#3d2b4f]/30 overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#0e0b16] text-[10px] uppercase tracking-wider font-black text-gray-400 border-b border-[#3d2b4f]/30">
                <tr>
                  <th className="py-3 px-4">{lang === 'ru' ? 'Время' : 'Timestamp'}</th>
                  <th className="py-3 px-4">{lang === 'ru' ? 'Администратор' : 'Admin'}</th>
                  <th className="py-3 px-4">{lang === 'ru' ? 'Тип Действия' : 'Action'}</th>
                  <th className="py-3 px-4">{lang === 'ru' ? 'Цель / Объект' : 'Target'}</th>
                  <th className="py-3 px-4">{lang === 'ru' ? 'Подробности' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d2b4f]/20 font-medium">
                {paginatedLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-[#251c35]/50 transition-colors cursor-pointer group"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-[#a855f7] shrink-0" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </td>

                      {/* Admin Info */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#3d2b4f] flex items-center justify-center text-[10px] font-black text-white shrink-0 uppercase">
                            {log.adminName ? log.adminName.charAt(0) : 'A'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-xs group-hover:text-[#00f0ff] transition-colors">
                              {log.adminName}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {log.adminEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${badge.bg}`}>
                          <BadgeIcon size={12} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Target */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.targetName || log.targetId ? (
                          <div className="flex flex-col max-w-[180px] truncate">
                            <span className="text-gray-200 font-semibold truncate" title={log.targetName || log.targetId}>
                              {log.targetName || log.targetId}
                            </span>
                            {log.targetId && log.targetName && (
                              <span className="text-[9px] text-gray-500 font-mono truncate">
                                ID: {log.targetId}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-gray-300">
                        <span title={log.details}>
                          {log.details || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#3d2b4f]/30 bg-[#0d0b14]/50 flex items-center justify-between text-xs text-gray-400">
            <div>
              {lang === 'ru' ? 'Страница' : 'Page'} <span className="font-bold text-white">{currentPage}</span> {lang === 'ru' ? 'из' : 'of'} <span className="font-bold text-white">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-[#251c35] hover:bg-[#3d2b4f] disabled:opacity-30 text-white transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-[#251c35] hover:bg-[#3d2b4f] disabled:opacity-30 text-white transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div 
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#15101e] border border-[#3d2b4f] rounded-3xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] relative space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedLog(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#251c35] transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-[#3d2b4f]/50 pb-4">
                <div className="p-3 rounded-2xl bg-[#a855f7]/20 border border-[#a855f7]/30 text-[#a855f7]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-white font-black text-base uppercase tracking-wider">
                    {lang === 'ru' ? 'Детали Записи Лога' : 'Audit Log Entry Details'}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-[#0b0813] p-3 rounded-xl border border-[#3d2b4f]/40 flex justify-between items-center">
                  <span className="text-gray-400 font-bold uppercase">{lang === 'ru' ? 'Время:' : 'Time:'}</span>
                  <span className="text-white font-mono font-bold">{formatTimestamp(selectedLog.timestamp)}</span>
                </div>

                <div className="bg-[#0b0813] p-3 rounded-xl border border-[#3d2b4f]/40 flex justify-between items-center">
                  <span className="text-gray-400 font-bold uppercase">{lang === 'ru' ? 'Администратор:' : 'Admin:'}</span>
                  <div className="text-right">
                    <span className="text-white font-bold block">{selectedLog.adminName}</span>
                    <span className="text-gray-400 font-mono text-[10px]">{selectedLog.adminEmail}</span>
                  </div>
                </div>

                <div className="bg-[#0b0813] p-3 rounded-xl border border-[#3d2b4f]/40 flex justify-between items-center">
                  <span className="text-gray-400 font-bold uppercase">{lang === 'ru' ? 'Действие:' : 'Action:'}</span>
                  <span className="text-[#a855f7] font-black uppercase tracking-wider">{selectedLog.action}</span>
                </div>

                {selectedLog.targetName && (
                  <div className="bg-[#0b0813] p-3 rounded-xl border border-[#3d2b4f]/40 flex justify-between items-center">
                    <span className="text-gray-400 font-bold uppercase">{lang === 'ru' ? 'Цель:' : 'Target:'}</span>
                    <span className="text-white font-semibold">{selectedLog.targetName}</span>
                  </div>
                )}

                {selectedLog.details && (
                  <div className="bg-[#0b0813] p-3 rounded-xl border border-[#3d2b4f]/40 space-y-1">
                    <span className="text-gray-400 font-bold uppercase block">{lang === 'ru' ? 'Подробное описание:' : 'Details:'}</span>
                    <p className="text-gray-200 leading-relaxed">{selectedLog.details}</p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-full py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                >
                  {lang === 'ru' ? 'Закрыть' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
