import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Search, ShieldCheck, Database, Trash2, 
  Monitor, Cpu, Globe, Key, Clock, LogIn, ExternalLink, Mail, Lock,
  TrendingUp, BarChart2, Layers, Users, Calendar, Download, RefreshCw,
  PieChart as PieIcon, Smartphone, Laptop, Eye, X, Filter, ChevronLeft, ChevronRight,
  Printer, FileSpreadsheet, FileText, CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { collection, onSnapshot, query, orderBy, limit, deleteDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Language } from '../../data/translations';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { AdminAuditLogs } from '../admin/AdminAuditLogs';
import { logAdminAction } from '../../utils/auditLogger';
import { printHtmlReport } from '../../utils/printReport';

interface TelemetryLog {
  id: string;
  userId: string;
  userEmail: string;
  displayName: string;
  deviceId?: string;
  fingerprint?: string;
  adblockDetected?: boolean;
  userAgent: string;
  platform: string;
  screen: string;
  viewport: string;
  language: string;
  timezone: string;
  timezoneOffset?: number;
  cores: string | number;
  memory: string | number;
  connectionType: string;
  downlinkMbps?: string | number;
  rttMs?: string | number;
  gpuVendor?: string;
  gpuRenderer?: string;
  batteryLevel?: string;
  batteryCharging?: string;
  audioSampleRate?: string;
  touchPoints?: number;
  colorDepth?: string;
  orientation?: string;
  pwaStandalone?: boolean;
  pdfViewerEnabled?: boolean;
  saveData?: boolean;
  cookieEnabled?: boolean;
  doNotTrack?: string;
  referrer: string;
  localTime: string;
  currentSection: string;
  eventName?: string;
  eventDetails?: string;
  timestamp: any;
  sessionId: string;
}

const SECTION_CONFIG: Record<string, { labelRu: string; labelEn: string; color: string }> = {
  home: { labelRu: 'Главная', labelEn: 'Home', color: '#ff4d4d' },
  chats: { labelRu: 'Чаты', labelEn: 'Chats', color: '#00f0ff' },
  chat: { labelRu: 'Чаты', labelEn: 'Chat', color: '#00f0ff' },
  ai: { labelRu: 'Ahi AI', labelEn: 'Ahi AI', color: '#a855f7' },
  streams: { labelRu: 'Стримы', labelEn: 'Streams', color: '#10b981' },
  forum: { labelRu: 'Форум', labelEn: 'Forum', color: '#f59e0b' },
  canvas: { labelRu: 'Aha Canvas', labelEn: 'Aha Canvas', color: '#ec4899' },
  theories: { labelRu: 'Теории', labelEn: 'Theories', color: '#3b82f6' },
  blog: { labelRu: 'Блог', labelEn: 'Blog', color: '#14b8a6' },
  chronicle: { labelRu: 'Хроника', labelEn: 'Chronicle', color: '#8b5cf6' },
  telemetry: { labelRu: 'Телеметрия', labelEn: 'Telemetry', color: '#f43f5e' },
  users: { labelRu: 'Пользователи', labelEn: 'Users', color: '#6366f1' },
  sdk: { labelRu: 'SDK', labelEn: 'SDK', color: '#eab308' }
};

const PIE_COLORS = ['#ff4d4d', '#00f0ff', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

const getSectionColor = (sec: string, index: number) => {
  if (SECTION_CONFIG[sec]) return SECTION_CONFIG[sec].color;
  return PIE_COLORS[index % PIE_COLORS.length];
};

const getSectionLabel = (sec: string, lang: Language) => {
  if (SECTION_CONFIG[sec]) {
    return lang === 'ru' ? SECTION_CONFIG[sec].labelRu : SECTION_CONFIG[sec].labelEn;
  }
  return sec.toUpperCase();
};

export const TelemetrySection: React.FC<{ lang: Language }> = ({ lang }) => {
  const { user, role, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'telemetry' | 'audit_logs'>('telemetry');
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [selectedLog, setSelectedLog] = useState<TelemetryLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(15);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (role !== 'admin' && role !== 'moderator')) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'telemetry'),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedLogs: TelemetryLog[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedLogs.push({
          id: docSnap.id,
          ...data
        } as TelemetryLog);
      });
      setLogs(loadedLogs);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to telemetry logs:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, role, authLoading]);

  // Filter logs by timeRange first
  const timeFilteredLogs = useMemo(() => {
    if (timeRange === 'all') return logs;
    const now = Date.now();
    let limitMs = 7 * 24 * 60 * 60 * 1000; // default 7d
    if (timeRange === '24h') limitMs = 24 * 60 * 60 * 1000;
    if (timeRange === '30d') limitMs = 30 * 24 * 60 * 60 * 1000;

    return logs.filter(log => {
      let timeMs: number | null = null;
      if (log.timestamp) {
        if (typeof log.timestamp.toDate === 'function') timeMs = log.timestamp.toDate().getTime();
        else if (log.timestamp.seconds) timeMs = log.timestamp.seconds * 1000;
        else if (typeof log.timestamp === 'number') timeMs = log.timestamp;
      }
      if (!timeMs && log.localTime) {
        const d = new Date(log.localTime);
        if (!isNaN(d.getTime())) timeMs = d.getTime();
      }
      if (!timeMs) return true;
      return (now - timeMs) <= limitMs;
    });
  }, [logs, timeRange]);

  // Process activity over time, OS distribution, Browser distribution, Hourly peak & Engagement metrics
  const { 
    chartData, 
    activeSections, 
    totalVisits, 
    topSection, 
    activeUsersCount,
    osDistribution,
    hourlyActivity,
    userActivityTimeline,
    featureEngagementData,
    sessionFrequencyData
  } = useMemo(() => {
    const daysMap = new Map<string, { label: string; counts: Record<string, number>; total: number }>();
    const daysUserMap = new Map<string, { activeUsers: Set<string>; sessions: Set<string> }>();
    const userSessionMap = new Map<string, Set<string>>();
    const daysArray: { key: string; label: string }[] = [];

    const numDays = timeRange === '24h' ? 1 : timeRange === '30d' ? 30 : 7;
    const now = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${dayStr}`;
      
      const label = d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
        day: 'numeric',
        month: 'short'
      });
      daysArray.push({ key, label });
      daysMap.set(key, { label, counts: {}, total: 0 });
      daysUserMap.set(key, { activeUsers: new Set(), sessions: new Set() });
    }

    const sectionsSet = new Set<string>();
    const uniqueUsersSet = new Set<string>();
    const osMap: Record<string, number> = {};
    const hoursCount = new Array(24).fill(0);
    let totalVisitsCount = 0;
    const sectionTotals: Record<string, number> = {};

    timeFilteredLogs.forEach((log) => {
      let logDate: Date | null = null;
      if (log.timestamp) {
        if (typeof log.timestamp.toDate === 'function') logDate = log.timestamp.toDate();
        else if (log.timestamp.seconds) logDate = new Date(log.timestamp.seconds * 1000);
        else if (typeof log.timestamp === 'number') logDate = new Date(log.timestamp);
        else if (typeof log.timestamp === 'string') {
          const d = new Date(log.timestamp);
          if (!isNaN(d.getTime())) logDate = d;
        }
      }
      if (!logDate && log.localTime) {
        const d = new Date(log.localTime);
        if (!isNaN(d.getTime())) logDate = d;
      }

      const userIdentifier = log.userId || log.userEmail || log.deviceId || log.fingerprint || 'anonymous';
      const sessionIdentifier = log.sessionId || (logDate ? `${userIdentifier}_${logDate.toDateString()}` : 'session');

      if (!userSessionMap.has(userIdentifier)) {
        userSessionMap.set(userIdentifier, new Set());
      }
      userSessionMap.get(userIdentifier)!.add(sessionIdentifier);

      if (logDate) {
        // Hour peak
        hoursCount[logDate.getHours()]++;

        const year = logDate.getFullYear();
        const month = String(logDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(logDate.getDate()).padStart(2, '0');
        const dayKey = `${year}-${month}-${dayStr}`;

        if (daysMap.has(dayKey)) {
          const sec = (log.currentSection || 'home').toLowerCase();
          sectionsSet.add(sec);
          if (log.userId) uniqueUsersSet.add(log.userId);

          const dayData = daysMap.get(dayKey)!;
          dayData.counts[sec] = (dayData.counts[sec] || 0) + 1;
          dayData.total += 1;
          totalVisitsCount += 1;

          sectionTotals[sec] = (sectionTotals[sec] || 0) + 1;

          const dayUserEntry = daysUserMap.get(dayKey);
          if (dayUserEntry) {
            dayUserEntry.activeUsers.add(userIdentifier);
            dayUserEntry.sessions.add(sessionIdentifier);
          }
        }
      }

      // OS / Platform parse
      let platformName = log.platform || 'Unknown';
      if (log.userAgent) {
        const ua = log.userAgent.toLowerCase();
        if (ua.includes('windows')) platformName = 'Windows';
        else if (ua.includes('macintosh') || ua.includes('mac os')) platformName = 'macOS';
        else if (ua.includes('android')) platformName = 'Android';
        else if (ua.includes('iphone') || ua.includes('ipad')) platformName = 'iOS';
        else if (ua.includes('linux')) platformName = 'Linux';
      }
      osMap[platformName] = (osMap[platformName] || 0) + 1;
    });

    const data = daysArray.map((day) => {
      const entry = daysMap.get(day.key)!;
      const item: Record<string, any> = {
        date: day.label,
        total: entry.total
      };
      sectionsSet.forEach((sec) => {
        item[sec] = entry.counts[sec] || 0;
      });
      return item;
    });

    // Timeline for user activity & sessions over time
    const userActivityTimelineData = daysArray.map((day) => {
      const entry = daysMap.get(day.key)!;
      const userEntry = daysUserMap.get(day.key)!;
      return {
        date: day.label,
        totalEvents: entry.total,
        activeUsers: userEntry.activeUsers.size,
        uniqueSessions: userEntry.sessions.size
      };
    });

    // Feature Engagement List
    const featureEngagementList = Object.entries(sectionTotals)
      .map(([sec, visits], idx) => ({
        section: sec,
        label: getSectionLabel(sec, lang),
        visits,
        percentage: totalVisitsCount > 0 ? Math.round((visits / totalVisitsCount) * 100) : 0,
        fill: getSectionColor(sec, idx)
      }))
      .sort((a, b) => b.visits - a.visits);

    // Session Frequency Buckets
    const sessionBuckets = {
      single: 0,
      returning: 0,
      frequent: 0,
      power: 0
    };

    userSessionMap.forEach((sessionsSet) => {
      const count = sessionsSet.size;
      if (count === 1) sessionBuckets.single++;
      else if (count <= 4) sessionBuckets.returning++;
      else if (count <= 10) sessionBuckets.frequent++;
      else sessionBuckets.power++;
    });

    const sessionFreqList = [
      { name: lang === 'ru' ? '1 Визит' : '1 Session', value: sessionBuckets.single, color: '#3b82f6' },
      { name: lang === 'ru' ? '2-4 Визита' : '2-4 Sessions', value: sessionBuckets.returning, color: '#10b981' },
      { name: lang === 'ru' ? '5-10 Визитов' : '5-10 Sessions', value: sessionBuckets.frequent, color: '#a855f7' },
      { name: lang === 'ru' ? '11+ Визитов' : '11+ Sessions', value: sessionBuckets.power, color: '#ff4d4d' },
    ].filter(b => b.value > 0);

    let topSecName = 'home';
    let topSecCount = -1;
    Object.entries(sectionTotals).forEach(([sec, count]) => {
      if (count > topSecCount) {
        topSecCount = count;
        topSecName = sec;
      }
    });

    const osData = Object.entries(osMap).map(([name, value]) => ({ name, value }));
    const hourData = hoursCount.map((count, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      visits: count
    }));

    return {
      chartData: data,
      activeSections: Array.from(sectionsSet),
      totalVisits: totalVisitsCount,
      topSection: getSectionLabel(topSecName, lang),
      activeUsersCount: uniqueUsersSet.size,
      osDistribution: osData,
      hourlyActivity: hourData,
      userActivityTimeline: userActivityTimelineData,
      featureEngagementData: featureEngagementList,
      sessionFrequencyData: sessionFreqList
    };
  }, [timeFilteredLogs, timeRange, lang]);

  const handleDeleteLog = async (id: string) => {
    if (window.confirm(lang === 'ru' ? 'Вы уверены, что хотите удалить эту запись телеметрии?' : 'Delete this telemetry log?')) {
      try {
        await deleteDoc(doc(db, 'telemetry', id));
        logAdminAction(user, 'DELETE_TELEMETRY_LOG', 'system', {
          targetId: id,
          details: `Удалена запись телеметрии ${id}`
        });
      } catch (err) {
        console.error('Failed to delete log:', err);
      }
    }
  };

  const handleClearAllLogs = async () => {
    if (!window.confirm(lang === 'ru' ? 'ВНИМАНИЕ: Очистить все записи телеметрии в базе данных?' : 'WARNING: Purge all telemetry logs from Firestore?')) return;
    setIsDeletingAll(true);
    try {
      const snap = await getDocs(collection(db, 'telemetry'));
      const batch = writeBatch(db);
      snap.docs.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();

      logAdminAction(user, 'CLEAR_TELEMETRY', 'system', {
        details: `Очищено ${snap.docs.length} записей телеметрии`
      });
    } catch (err) {
      console.error('Failed to purge logs:', err);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = [
      'ID записи',
      'Дата и Время (UTC)',
      'Локальное Время Устройства',
      'ID Пользователя',
      'Email Пользователя',
      'Имя Пользователя',
      'Код Раздела',
      'Название Раздела',
      'Платформа / ОС',
      'Разрешение Экран',
      'Размер Viewport',
      'Язык Браузера',
      'Часовой Пояс',
      'Ядра CPU',
      'ОЗУ Память (ГБ)',
      'Тип Сети',
      'Скорость Загрузки (Mbps)',
      'Задержка RTT (ms)',
      'GPU Производитель',
      'GPU Видеокарта',
      'Батарея (%)',
      'Батарея Зарядка',
      'Аудио Сэмплрейт',
      'Точек Сенсора (Touch)',
      'Глубина Цвета',
      'PWA Standalone',
      'Do Not Track',
      'AdBlock Активен',
      'Device ID',
      'Fingerprint',
      'ID Сессии',
      'User Agent'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.map(escapeCsv).join(';')];

    filteredLogs.forEach(log => {
      let utcFormatted = '';
      if (log.timestamp) {
        if (typeof log.timestamp.toDate === 'function') utcFormatted = log.timestamp.toDate().toISOString();
        else if (log.timestamp.seconds) utcFormatted = new Date(log.timestamp.seconds * 1000).toISOString();
        else if (typeof log.timestamp === 'number') utcFormatted = new Date(log.timestamp).toISOString();
        else if (typeof log.timestamp === 'string') utcFormatted = log.timestamp;
      }

      const secLabel = getSectionLabel(log.currentSection || 'home', lang);

      const row = [
        log.id,
        utcFormatted,
        log.localTime || '',
        log.userId || '',
        log.userEmail || '',
        log.displayName || '',
        log.currentSection || '',
        secLabel,
        log.platform || '',
        log.screen || '',
        log.viewport || '',
        log.language || '',
        log.timezone || '',
        log.cores ?? '',
        log.memory ?? '',
        log.connectionType || '',
        log.downlinkMbps ?? '',
        log.rttMs ?? '',
        log.gpuVendor || '',
        log.gpuRenderer || '',
        log.batteryLevel || '',
        log.batteryCharging || '',
        log.audioSampleRate || '',
        log.touchPoints ?? '',
        log.colorDepth || '',
        log.pwaStandalone ? 'Да' : 'Нет',
        log.doNotTrack || '',
        log.adblockDetected ? (lang === 'ru' ? 'Да' : 'Yes') : (lang === 'ru' ? 'Нет' : 'No'),
        log.deviceId || '',
        log.fingerprint || '',
        log.sessionId || '',
        log.userAgent || ''
      ].map(escapeCsv);

      csvRows.push(row.join(';'));
    });

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `telemetry_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrintTelemetry = () => {
    if (filteredLogs.length === 0) return;

    const dateStr = new Date().toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US');
    const adBlockPct = filteredLogs.length > 0
      ? Math.round((filteredLogs.filter(l => l.adblockDetected).length / filteredLogs.length) * 100)
      : 0;

    const osRows = osDistribution.map(os => {
      const pct = totalVisits > 0 ? Math.round((os.value / totalVisits) * 100) : 0;
      return `<tr>
        <td style="font-weight: 500;">${os.name}</td>
        <td style="text-align: right; font-weight: bold;">${os.value}</td>
        <td style="text-align: right; color: #4b5563;">${pct}%</td>
      </tr>`;
    }).join('');

    const tableRows = filteredLogs.slice(0, 200).map((log, idx) => {
      let formattedTime = log.localTime || '';
      if (log.timestamp?.toDate) formattedTime = log.timestamp.toDate().toISOString().replace('T', ' ').slice(0, 19);
      else if (log.timestamp?.seconds) formattedTime = new Date(log.timestamp.seconds * 1000).toISOString().replace('T', ' ').slice(0, 19);

      const secName = getSectionLabel(log.currentSection || 'home', lang);
      const userDisplay = log.displayName || log.userEmail ? `${log.displayName || 'Guest'} (${log.userEmail || ''})` : 'Guest';

      return `<tr>
        <td style="color: #6b7280;">${idx + 1}</td>
        <td style="font-weight: bold; white-space: nowrap;">${formattedTime}</td>
        <td><strong>${userDisplay}</strong></td>
        <td style="font-weight: bold; color: #dc2626;">${secName}</td>
        <td>${log.platform || '-'}</td>
        <td>${log.screen || log.viewport || '-'}</td>
        <td>${log.timezone || '-'}</td>
        <td>${log.adblockDetected ? '<span class="badge" style="background: #fee2e2; color: #991b1b;">AdBlock</span>' : '<span class="badge" style="background: #dcfce7; color: #166534;">Clean</span>'}</td>
      </tr>`;
    }).join('');

    const html = `
      <div class="header-box">
        <div>
          <div style="font-size: 10px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 1px;">AHA RADIO STATION — CYBER TELEMETRY & ANALYTICS</div>
          <h1>${lang === 'ru' ? 'Официальный Статистический Отчет' : 'Official Analytics & Telemetry Report'}</h1>
          <div style="font-size: 10px; color: #4b5563; margin-top: 2px;">
            ${lang === 'ru' ? 'Дата формирования:' : 'Generated:'} ${dateStr} | ${lang === 'ru' ? 'Оператор:' : 'Operator:'} ${user?.email || 'Admin'}
          </div>
        </div>
        <div style="text-align: right; font-size: 10px; font-family: monospace;">
          <div>${lang === 'ru' ? 'Период:' : 'Period:'} <strong>${timeRange.toUpperCase()}</strong></div>
          <div>${lang === 'ru' ? 'Записей в отчете:' : 'Records count:'} <strong>${filteredLogs.length}</strong></div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">${lang === 'ru' ? 'Всего визитов' : 'Total Visits'}</div>
          <div class="kpi-val">${totalVisits}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">${lang === 'ru' ? 'Уникальные юзеры' : 'Unique Users'}</div>
          <div class="kpi-val">${activeUsersCount}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">${lang === 'ru' ? 'Топ раздел' : 'Top Section'}</div>
          <div class="kpi-val" style="font-size: 13px;">${topSection}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">${lang === 'ru' ? 'Доля AdBlock' : 'AdBlock Share'}</div>
          <div class="kpi-val">${adBlockPct}%</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h2>${lang === 'ru' ? 'Распределение по ОС / Платформам' : 'OS & Platform Distribution'}</h2>
          <table>
            <thead>
              <tr>
                <th>${lang === 'ru' ? 'Операционная система' : 'OS'}</th>
                <th style="text-align: right;">${lang === 'ru' ? 'Визиты' : 'Visits'}</th>
                <th style="text-align: right;">${lang === 'ru' ? 'Доля' : 'Share'}</th>
              </tr>
            </thead>
            <tbody>
              ${osRows}
            </tbody>
          </table>
        </div>

        <div class="card">
          <h2>${lang === 'ru' ? 'Параметры фильтрации' : 'Filtering Parameters'}</h2>
          <div style="font-size: 10px; line-height: 1.8; color: #374151; font-family: monospace;">
            <div>• <strong>Общее число логов:</strong> ${logs.length}</div>
            <div>• <strong>Записей в текущей выборке:</strong> ${filteredLogs.length}</div>
            <div>• <strong>Интервал времени:</strong> ${timeRange}</div>
            <div>• <strong>Поисковый запрос:</strong> "${searchQuery || '—'}"</div>
            <div>• <strong>Обнаружен AdBlock:</strong> ${filteredLogs.filter(l => l.adblockDetected).length} пользователей</div>
          </div>
        </div>
      </div>

      <h2>${lang === 'ru' ? 'Детализированный Реестр Телеметрии' : 'Detailed Telemetry Log Registry'}</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>${lang === 'ru' ? 'Дата / Время' : 'Date / Time'}</th>
            <th>${lang === 'ru' ? 'Пользователь' : 'User'}</th>
            <th>${lang === 'ru' ? 'Раздел' : 'Section'}</th>
            <th>${lang === 'ru' ? 'ОС' : 'OS'}</th>
            <th>${lang === 'ru' ? 'Экран' : 'Screen'}</th>
            <th>${lang === 'ru' ? 'Часовой Пояс' : 'Timezone'}</th>
            <th>${lang === 'ru' ? 'Статус' : 'Status'}</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="footer">
        <div>Aha Radio Station Cyber Telemetry System &copy; 2026</div>
        <div>CONFIDENTIAL — FOR INTERNAL ADMINISTRATIVE USE ONLY</div>
      </div>
    `;

    printHtmlReport(html, `Aha_Telemetry_Report_${new Date().toISOString().slice(0, 10)}`);
  };

  const filteredLogs = timeFilteredLogs.filter((log) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = (
      (log.displayName || '').toLowerCase().includes(term) ||
      (log.userEmail || '').toLowerCase().includes(term) ||
      (log.currentSection || '').toLowerCase().includes(term) ||
      (log.platform || '').toLowerCase().includes(term) ||
      (log.timezone || '').toLowerCase().includes(term) ||
      (log.userAgent || '').toLowerCase().includes(term)
    );

    const matchesSection = selectedSectionFilter === 'ALL' || (log.currentSection || '').toLowerCase() === selectedSectionFilter.toLowerCase();

    return matchesSearch && matchesSection;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * logsPerPage;
    return filteredLogs.slice(start, start + logsPerPage);
  }, [filteredLogs, currentPage, logsPerPage]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#ff4d4d] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,77,77,0.3)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-[#15101e]/80 border border-[#3d2b4f]/60 rounded-3xl p-6 sm:p-10 text-center max-w-xl mx-auto my-12 backdrop-blur-md shadow-2xl">
        <Lock className="mx-auto text-[#ff4d4d]/70 mb-4" size={40} />
        <h4 className="text-xl font-black text-white uppercase tracking-wider mb-2">
          {lang === 'ru' ? 'Авторизация' : 'Authorization'}
        </h4>
        <p className="text-gray-300 mb-6 font-bold uppercase tracking-wider text-xs max-w-sm mx-auto leading-relaxed">
          {lang === 'ru' ? 'Войдите в систему, чтобы получить доступ к разделу телеметрии.' : 'Please log in to get access to telemetry section.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-md mx-auto">
          <GoogleLoginButton lang={lang} className="w-full sm:w-auto" size="md" />
          <button
            onClick={() => window.dispatchEvent(new Event('openEmailLogin'))}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3d2b4f]/50 border border-[#3d2b4f] text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 shadow-xl cursor-pointer"
          >
            <Mail size={16} />
            {lang === 'ru' ? 'Зарегистрироваться через почту' : 'Register via email'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 selection:bg-[#ff4d4d]/30 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#ff4d4d] uppercase flex items-center gap-3 tracking-widest">
            <Activity className="w-8 h-8 text-[#ff4d4d] animate-pulse shrink-0" />
            Telemetry & Analytics Center
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {lang === 'ru' ? 'Мониторинг пользовательской активности, устройств и посещаемости раздела.' : 'Real-time user monitoring, device audit, and section engagement analytics.'}
          </p>
        </div>
        
        {/* Actions & Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={lang === 'ru' ? 'Поиск по логам...' : 'Search logs...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#15101e] border border-[#3d2b4f] focus:border-[#ff4d4d] text-white pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium outline-none transition-all placeholder:text-gray-500"
            />
          </div>

          <button
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="px-4 py-2.5 bg-[#251c35] hover:bg-[#ff4d4d] text-gray-200 hover:text-[#15101e] border border-[#3d2b4f] hover:border-[#ff4d4d] rounded-2xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg"
            title={lang === 'ru' ? 'Скачать данные в формате CSV' : 'Export data in CSV format'}
          >
            <FileSpreadsheet size={15} />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={triggerPrintTelemetry}
            disabled={filteredLogs.length === 0}
            className="px-4 py-2.5 bg-[#251c35] hover:bg-[#a855f7] text-gray-200 hover:text-white border border-[#3d2b4f] hover:border-[#a855f7] rounded-2xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg"
            title={lang === 'ru' ? 'Распечатать отчет на принтере или сохранить в PDF' : 'Print report or save to PDF'}
          >
            <Printer size={15} />
            <span className="hidden sm:inline">{lang === 'ru' ? 'Печать' : 'Print'}</span>
          </button>

          {role === 'admin' && (
            <button
              onClick={handleClearAllLogs}
              disabled={isDeletingAll || logs.length === 0}
              className="px-3.5 py-2.5 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg"
              title={lang === 'ru' ? 'Очистить все логи' : 'Purge All Logs'}
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">{lang === 'ru' ? 'Очистить' : 'Purge'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tab Switcher */}
      <div className="flex items-center gap-2 bg-[#15101e] border border-[#3d2b4f]/60 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'telemetry'
              ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg font-black'
              : 'text-gray-400 hover:text-white hover:bg-[#251c35]'
          }`}
        >
          <BarChart2 size={16} />
          {lang === 'ru' ? 'Телеметрия и Визиты' : 'Telemetry & Engagement'}
        </button>
        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'audit_logs'
              ? 'bg-[#a855f7] text-white shadow-lg font-black'
              : 'text-gray-400 hover:text-white hover:bg-[#251c35]'
          }`}
        >
          <ShieldCheck size={16} />
          {lang === 'ru' ? 'Журнал Действий Админов' : 'Admin Audit Log'}
        </button>
      </div>

      {activeTab === 'audit_logs' ? (
        <AdminAuditLogs lang={lang} />
      ) : (
        <>
          {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1e152d] border border-[#3d2b4f] p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-[#ff4d4d] ml-1" />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{lang === 'ru' ? 'Период:' : 'Period:'}</span>
          <div className="flex items-center bg-[#15101e] border border-[#3d2b4f] rounded-xl p-1">
            {(['24h', '7d', '30d', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => {
                  setTimeRange(p);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeRange === p ? 'bg-[#ff4d4d] text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{lang === 'ru' ? 'Раздел:' : 'Section:'}</span>
          <select
            value={selectedSectionFilter}
            onChange={(e) => {
              setSelectedSectionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#15101e] border border-[#3d2b4f] text-gray-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#ff4d4d] cursor-pointer"
          >
            <option value="ALL">{lang === 'ru' ? 'Все разделы' : 'All Sections'}</option>
            {activeSections.map((sec) => (
              <option key={sec} value={sec}>{getSectionLabel(sec, lang)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#251c35] border border-[#3d2b4f] rounded-3xl shadow-xl flex items-center gap-4 hover:border-[#ff4d4d]/50 transition-all">
          <div className="p-3 bg-red-500/20 text-[#ff4d4d] rounded-2xl border border-red-500/30">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'Всего событий' : 'Total Events'}
            </div>
            <div className="text-2xl font-black text-white mt-0.5">{totalVisits}</div>
          </div>
        </div>

        <div className="p-5 bg-[#251c35] border border-[#3d2b4f] rounded-3xl shadow-xl flex items-center gap-4 hover:border-cyan-500/50 transition-all">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'Популярный раздел' : 'Popular Section'}
            </div>
            <div className="text-xl font-black text-white mt-0.5 truncate max-w-[140px]">{topSection}</div>
          </div>
        </div>

        <div className="p-5 bg-[#251c35] border border-[#3d2b4f] rounded-3xl shadow-xl flex items-center gap-4 hover:border-purple-500/50 transition-all">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'Активные пользователи' : 'Active Users'}
            </div>
            <div className="text-2xl font-black text-white mt-0.5">{activeUsersCount}</div>
          </div>
        </div>

        <div className="p-5 bg-[#251c35] border border-[#3d2b4f] rounded-3xl shadow-xl flex items-center gap-4 hover:border-emerald-500/50 transition-all">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Database size={24} />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'Записей в выборке' : 'Filtered Logs'}
            </div>
            <div className="text-2xl font-black text-white mt-0.5">{filteredLogs.length}</div>
          </div>
        </div>
      </div>

      {/* MAIN CHART: Section Activity Dynamics */}
      <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="text-[#ff4d4d]" size={20} />
              {lang === 'ru' ? 'Динамика активности по разделам' : 'Section Activity Dynamics'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {lang === 'ru' ? 'Количество переходов и просмотров в разрезе времени' : 'Visual breakdown of user events by section over time'}
            </p>
          </div>

          <div className="flex items-center bg-[#15101e] border border-[#3d2b4f] rounded-xl p-1 shrink-0">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartType === 'area' ? 'bg-[#ff4d4d] text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              {lang === 'ru' ? 'Область' : 'Area'}
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartType === 'bar' ? 'bg-[#ff4d4d] text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              {lang === 'ru' ? 'Столбцы' : 'Bar'}
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartType === 'line' ? 'bg-[#ff4d4d] text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              {lang === 'ru' ? 'Линии' : 'Line'}
            </button>
          </div>
        </div>

        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {activeSections.map((sec, idx) => (
                    <linearGradient key={sec} id={`grad_${sec}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getSectionColor(sec, idx)} stopOpacity={0.6}/>
                      <stop offset="95%" stopColor={getSectionColor(sec, idx)} stopOpacity={0.0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d2b4f" opacity={0.5} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#120a21',
                    borderColor: '#3d2b4f',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Legend
                  formatter={(value) => getSectionLabel(value, lang)}
                  wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }}
                />
                {activeSections
                  .filter((sec) => selectedSectionFilter === 'ALL' || selectedSectionFilter.toLowerCase() === sec)
                  .map((sec, idx) => (
                    <Area
                      key={sec}
                      type="monotone"
                      dataKey={sec}
                      name={sec}
                      stroke={getSectionColor(sec, idx)}
                      fill={`url(#grad_${sec})`}
                      strokeWidth={2}
                    />
                  ))}
              </AreaChart>
            ) : chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d2b4f" opacity={0.5} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#120a21',
                    borderColor: '#3d2b4f',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Legend
                  formatter={(value) => getSectionLabel(value, lang)}
                  wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }}
                />
                {activeSections
                  .filter((sec) => selectedSectionFilter === 'ALL' || selectedSectionFilter.toLowerCase() === sec)
                  .map((sec, idx) => (
                    <Bar
                      key={sec}
                      dataKey={sec}
                      name={sec}
                      fill={getSectionColor(sec, idx)}
                      radius={[6, 6, 0, 0]}
                    />
                  ))}
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d2b4f" opacity={0.5} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#120a21',
                    borderColor: '#3d2b4f',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Legend
                  formatter={(value) => getSectionLabel(value, lang)}
                  wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }}
                />
                {activeSections
                  .filter((sec) => selectedSectionFilter === 'ALL' || selectedSectionFilter.toLowerCase() === sec)
                  .map((sec, idx) => (
                    <Line
                      key={sec}
                      type="monotone"
                      dataKey={sec}
                      name={sec}
                      stroke={getSectionColor(sec, idx)}
                      strokeWidth={3}
                      dot={{ r: 4, fill: getSectionColor(sec, idx) }}
                    />
                  ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECONDARY CHARTS GRID: OS Distribution & Hourly Peak Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OS & Platform Distribution */}
        <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
              <PieIcon className="text-cyan-400" size={18} />
              {lang === 'ru' ? 'Распределение по ОС и платформам' : 'OS & Platform Breakdown'}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              {lang === 'ru' ? 'Операционные системы активных пользователей' : 'Operating systems detected in session logs'}
            </p>
          </div>

          <div className="w-full h-56">
            {osDistribution.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500 text-xs">Нет данных</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={osDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {osDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#120a21',
                      borderColor: '#3d2b4f',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Hourly Peak Activity */}
        <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
              <Clock className="text-purple-400" size={18} />
              {lang === 'ru' ? 'Пиковая активность по часам (24h)' : 'Peak Activity Hours (24h)'}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              {lang === 'ru' ? 'Распределение посещений по времени суток' : 'Events distribution throughout 24-hour cycle'}
            </p>
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyActivity} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d2b4f" opacity={0.3} />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} interval={3} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#120a21',
                    borderColor: '#3d2b4f',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="visits" name={lang === 'ru' ? 'События' : 'Visits'} fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TERTIARY CHARTS GRID: User Activity Timeline & Session Return Frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Activity & Session Frequency Composed Chart */}
        <div className="lg:col-span-2 bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
              <Users className="text-[#00f0ff]" size={18} />
              {lang === 'ru' ? 'Динамика активности пользователей и сессий' : 'User Activity & Session Frequency Over Time'}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              {lang === 'ru' ? 'Соотношение общего объема событий, уникальных пользователей и активных сессий' : 'Correlation between total telemetry events, active users, and sessions'}
            </p>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={userActivityTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d2b4f" opacity={0.4} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#120a21',
                    borderColor: '#3d2b4f',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="totalEvents"
                  name={lang === 'ru' ? 'Всего событий' : 'Total Events'}
                  fill="#ff4d4d"
                  stroke="#ff4d4d"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="uniqueSessions"
                  name={lang === 'ru' ? 'Уникальные сессии' : 'Unique Sessions'}
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#a855f7' }}
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  name={lang === 'ru' ? 'Активные пользователи' : 'Active Users'}
                  stroke="#00f0ff"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#00f0ff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session Frequency / Return Rate Pie Chart */}
        <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
              <RefreshCw className="text-[#10b981]" size={18} />
              {lang === 'ru' ? 'Частота возврата сессий' : 'Session Return Frequency'}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              {lang === 'ru' ? 'Распределение по количеству повторных сессий на пользователя' : 'Distribution of user visit counts and retention'}
            </p>
          </div>

          <div className="w-full h-64">
            {sessionFrequencyData.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500 text-xs">
                {lang === 'ru' ? 'Нет данных по сессиям' : 'No session data available'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sessionFrequencyData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sessionFrequencyData.map((entry, index) => (
                      <Cell key={`freq-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#120a21',
                      borderColor: '#3d2b4f',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* FEATURE ENGAGEMENT BAR CHART */}
      <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
              <TrendingUp className="text-[#f59e0b]" size={18} />
              {lang === 'ru' ? 'Вовлеченность пользователей по функциям и разделам' : 'Feature & Section Engagement Ranking'}
            </h3>
            <p className="text-xs text-gray-400">
              {lang === 'ru' ? 'Сравнение количества кликов и переходов между инструментами платформы' : 'Comparison of total interactions across platform features'}
            </p>
          </div>
        </div>

        <div className="w-full h-64">
          {featureEngagementData.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500 text-xs">
              {lang === 'ru' ? 'Нет данных вовлеченности' : 'No feature engagement data'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={featureEngagementData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3d2b4f" opacity={0.3} horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis dataKey="label" type="category" stroke="#9ca3af" fontSize={11} tickLine={false} width={100} />
                <Tooltip
                  formatter={(val: any) => [`${val} ${lang === 'ru' ? 'событий' : 'events'}`, lang === 'ru' ? 'Посещения' : 'Visits']}
                  contentStyle={{
                    backgroundColor: '#120a21',
                    borderColor: '#3d2b4f',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="visits" name={lang === 'ru' ? 'События' : 'Visits'} radius={[0, 8, 8, 0]}>
                  {featureEngagementData.map((entry, index) => (
                    <Cell key={`feat-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="text-[#ff4d4d]" size={20} />
            {lang === 'ru' ? 'Записи логов телеметрии' : 'Telemetry Audit Logs'}
            <span className="text-xs font-mono font-normal text-gray-400 ml-2">({filteredLogs.length})</span>
          </h3>

          {/* Pagination status */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {lang === 'ru' ? `Страница ${currentPage} из ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 bg-[#15101e] border border-[#3d2b4f] hover:border-[#ff4d4d] text-gray-300 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 bg-[#15101e] border border-[#3d2b4f] hover:border-[#ff4d4d] text-gray-300 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <span className="text-gray-400 animate-pulse text-sm">
              {lang === 'ru' ? 'Загрузка логов телеметрии...' : 'Loading telemetry records...'}
            </span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
            <Database className="w-12 h-12 text-gray-600 mb-2" />
            <p className="text-sm">{lang === 'ru' ? 'Логи не найдены или список пуст.' : 'No logs found for selected query.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#15101e]/60 border-b border-[#3d2b4f]/70 text-gray-400 uppercase tracking-widest text-[10px]">
                  <th className="py-3.5 px-4 font-bold">{lang === 'ru' ? 'Пользователь' : 'User'}</th>
                  <th className="py-3.5 px-4 font-bold">{lang === 'ru' ? 'Раздел' : 'Section'}</th>
                  <th className="py-3.5 px-4 font-bold">{lang === 'ru' ? 'Платформа & ОС' : 'Platform & OS'}</th>
                  <th className="py-3.5 px-4 font-bold">{lang === 'ru' ? 'Параметры Экрана' : 'Screen & Viewport'}</th>
                  <th className="py-3.5 px-4 font-bold">{lang === 'ru' ? 'Язык & Таймзона' : 'Locale'}</th>
                  <th className="py-3.5 px-4 font-bold">{lang === 'ru' ? 'Железо & Сеть' : 'Hardware'}</th>
                  <th className="py-3.5 px-4 font-bold text-right">{lang === 'ru' ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d2b4f]/40">
                <AnimatePresence initial={false}>
                  {paginatedLogs.map((log) => (
                    <motion.tr 
                      key={log.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-[#15101e]/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white max-w-[150px] truncate group-hover:text-[#ff4d4d] transition-colors" title={log.displayName}>
                          {log.displayName || 'Guest User'}
                        </div>
                        <div className="text-[10px] text-gray-400 max-w-[150px] truncate" title={log.userEmail}>
                          {log.userEmail || 'anonymous'}
                        </div>
                        {log.deviceId && (
                          <div className="text-[9px] text-purple-400 max-w-[150px] truncate font-mono mt-0.5" title={log.deviceId}>
                            DEV: {log.deviceId}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-2 py-0.5 bg-[#15101e] text-[#ff4d4d] rounded-md uppercase tracking-wider text-[10px] border border-[#ff4d4d]/20">
                            {getSectionLabel(log.currentSection || 'home', lang)}
                          </span>
                          {log.eventName && (
                            <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-300 rounded text-[9px] border border-cyan-500/30 max-w-[130px] truncate" title={log.eventName}>
                              ⚡ {log.eventName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Monitor size={12} className="text-[#ff4d4d]" />
                          <span className="font-semibold">{log.platform || 'unknown'}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 max-w-[180px] truncate mt-0.5" title={log.userAgent}>
                          {log.userAgent}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-300">
                        <div>{log.screen || 'unknown'}</div>
                        <div className="text-[10px] text-gray-500">{log.viewport || 'unknown'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        <div className="flex items-center gap-1">
                          <Globe size={12} className="text-gray-400" />
                          <span>{log.language || 'unknown'}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 max-w-[120px] truncate mt-0.5" title={log.timezone}>
                          {log.timezone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] flex items-center gap-0.5 text-gray-400">
                            <Cpu size={11} /> {log.cores || '?'} Cores
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {log.memory || '?'} GB RAM
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <div className="text-right mr-1">
                            <div className="text-gray-300 font-bold text-[11px]">{log.localTime?.split(', ')?.[1] || ''}</div>
                            <div className="text-[9px] text-gray-500">{log.localTime?.split(', ')?.[0] || ''}</div>
                          </div>
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 text-gray-400 hover:text-cyan-400 bg-[#15101e] border border-[#3d2b4f]/60 hover:border-cyan-500/40 rounded-lg transition-colors cursor-pointer"
                            title="Inspect Log"
                          >
                            <Eye size={13} />
                          </button>
                          {(role === 'admin' || role === 'moderator') && (
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 text-gray-500 hover:text-red-500 bg-[#15101e] border border-[#3d2b4f]/60 hover:border-red-500/40 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILED LOG INSPECTION MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1c1429] border border-[#3d2b4f] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#3d2b4f] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] rounded-2xl">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">
                      {lang === 'ru' ? 'Детали лога телеметрии' : 'Telemetry Log Details'}
                    </h3>
                    <p className="text-xs text-mono text-gray-400">ID: {selectedLog.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 text-gray-400 hover:text-white bg-[#15101e] border border-[#3d2b4f] rounded-xl hover:bg-[#ff4d4d] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#15101e] border border-[#3d2b4f]/60 p-3.5 rounded-2xl space-y-1">
                  <span className="text-gray-500 uppercase tracking-widest text-[10px] block font-sans font-bold">User Information</span>
                  <div className="text-white font-bold">{selectedLog.displayName || 'Guest'}</div>
                  <div className="text-gray-400">{selectedLog.userEmail || 'N/A'}</div>
                  <div className="text-[#ff4d4d] text-[10px]">UID: {selectedLog.userId || 'anonymous'}</div>
                  {selectedLog.deviceId && (
                    <div className="text-purple-400 text-[10px] break-all">Device ID: {selectedLog.deviceId}</div>
                  )}
                  {selectedLog.fingerprint && (
                    <div className="text-cyan-400 text-[10px]">Fingerprint: {selectedLog.fingerprint}</div>
                  )}
                  {selectedLog.adblockDetected !== undefined && (
                    <div className={`text-[10px] font-bold ${selectedLog.adblockDetected ? 'text-amber-400' : 'text-emerald-400'}`}>
                      AdBlock: {selectedLog.adblockDetected ? (lang === 'ru' ? 'Обнаружен / Активен' : 'Detected / Active') : (lang === 'ru' ? 'Отсутствует' : 'Not Detected')}
                    </div>
                  )}
                </div>

                <div className="bg-[#15101e] border border-[#3d2b4f]/60 p-3.5 rounded-2xl space-y-1">
                  <span className="text-gray-500 uppercase tracking-widest text-[10px] block font-sans font-bold">Session & Environment</span>
                  <div className="text-cyan-400 font-bold">Section: {selectedLog.currentSection}</div>
                  <div className="text-gray-400">Time: {selectedLog.localTime}</div>
                  <div className="text-purple-400 text-[10px]">Session ID: {selectedLog.sessionId || 'N/A'}</div>
                </div>

                {(selectedLog.eventName || selectedLog.eventDetails) && (
                  <div className="bg-[#15101e] border border-cyan-500/40 p-3.5 rounded-2xl col-span-1 sm:col-span-2 space-y-1">
                    <span className="text-cyan-400 uppercase tracking-widest text-[10px] block font-sans font-bold flex items-center gap-1">
                      ⚡ Recorded Event Data
                    </span>
                    {selectedLog.eventName && (
                      <div className="text-white font-bold text-xs">Event Name: <span className="text-cyan-300 font-mono">{selectedLog.eventName}</span></div>
                    )}
                    {selectedLog.eventDetails && (
                      <pre className="text-cyan-200 text-[11px] bg-[#0d0b14] p-2.5 rounded-xl border border-cyan-500/20 whitespace-pre-wrap font-mono overflow-x-auto mt-1 max-h-40">
                        {selectedLog.eventDetails}
                      </pre>
                    )}
                  </div>
                )}

                <div className="bg-[#15101e] border border-[#3d2b4f]/60 p-3.5 rounded-2xl space-y-1">
                  <span className="text-gray-500 uppercase tracking-widest text-[10px] block font-sans font-bold">Display & Touch</span>
                  <div className="text-gray-200">Screen: {selectedLog.screen} ({selectedLog.colorDepth || '24-bit'})</div>
                  <div className="text-gray-400">Viewport: {selectedLog.viewport}</div>
                  <div className="text-gray-400">Orientation: {selectedLog.orientation || 'N/A'}</div>
                  <div className="text-cyan-400 text-[10px]">Touch Points: {selectedLog.touchPoints ?? '0'}</div>
                  <div className="text-gray-400 text-[10px]">Timezone: {selectedLog.timezone} (Offset: {selectedLog.timezoneOffset ?? '0'}m)</div>
                </div>

                <div className="bg-[#15101e] border border-[#3d2b4f]/60 p-3.5 rounded-2xl space-y-1">
                  <span className="text-gray-500 uppercase tracking-widest text-[10px] block font-sans font-bold">Hardware & GPU Acceleration</span>
                  <div className="text-emerald-400">CPU Cores: {selectedLog.cores} | RAM: {selectedLog.memory} GB</div>
                  <div className="text-cyan-300 text-[10px] break-all">GPU Vendor: {selectedLog.gpuVendor || 'N/A'}</div>
                  <div className="text-cyan-300 text-[10px] break-all">GPU Renderer: {selectedLog.gpuRenderer || 'N/A'}</div>
                  <div className="text-purple-300 text-[10px]">Audio Context: {selectedLog.audioSampleRate || 'N/A'}</div>
                </div>

                <div className="bg-[#15101e] border border-[#3d2b4f]/60 p-3.5 rounded-2xl space-y-1">
                  <span className="text-gray-500 uppercase tracking-widest text-[10px] block font-sans font-bold">Network & Battery Capabilities</span>
                  <div className="text-amber-300">Type: {selectedLog.connectionType || 'Unknown'} ({selectedLog.downlinkMbps || '?'} Mbps)</div>
                  <div className="text-amber-300/80 text-[10px]">RTT Latency: {selectedLog.rttMs || '?'} ms | SaveData: {selectedLog.saveData ? 'Active' : 'Off'}</div>
                  <div className="text-emerald-400 text-[10px]">Battery: {selectedLog.batteryLevel || 'N/A'} ({selectedLog.batteryCharging || 'N/A'})</div>
                  <div className="text-gray-400 text-[10px]">Standalone PWA: {selectedLog.pwaStandalone ? 'Yes' : 'No'} | PDF: {selectedLog.pdfViewerEnabled ? 'Yes' : 'No'}</div>
                  <div className="text-gray-400 text-[10px]">DNT Header: {selectedLog.doNotTrack || 'Unspecified'} | Cookies: {selectedLog.cookieEnabled ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>

              <div className="bg-[#15101e] border border-[#3d2b4f]/60 p-3.5 rounded-2xl">
                <span className="text-gray-500 uppercase tracking-widest text-[10px] block font-sans font-bold mb-1">User Agent</span>
                <p className="text-gray-300 font-mono text-[11px] break-all leading-relaxed">{selectedLog.userAgent}</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-6 py-2.5 bg-[#ff4d4d] hover:bg-white text-[#15101e] font-black uppercase text-xs rounded-2xl transition-all cursor-pointer shadow-lg"
                >
                  {lang === 'ru' ? 'Закрыть' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable Analytics Report Modal */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            {/* Embedded Print CSS Rules */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-telemetry-report, #printable-telemetry-report * {
                  visibility: visible !important;
                }
                #printable-telemetry-report {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  background: white !important;
                  color: black !important;
                  padding: 24px !important;
                  margin: 0 !important;
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                  box-sizing: border-box !important;
                }
                .no-print {
                  display: none !important;
                }
                .print-border {
                  border: 1px solid #d1d5db !important;
                }
                .print-[#ff4d4d] {
                  color: #000000 !important;
                }
              }
            `}</style>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[#1a1326] border border-[#3d2b4f] rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-gray-200"
            >
              {/* Modal Control Bar (Hidden on print) */}
              <div className="flex items-center justify-between p-4 bg-[#15101e] border-b border-[#3d2b4f] shrink-0 no-print">
                <div className="flex items-center gap-2.5">
                  <Printer className="text-[#a855f7]" size={20} />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {lang === 'ru' ? 'Печать аналитического отчета' : 'Printable Analytics Report'}
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      {lang === 'ru' ? 'Готовая версия для принтера или сохранения в PDF' : 'Ready for printing or PDF document export'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={triggerPrintTelemetry}
                    className="px-4 py-2 bg-[#ff4d4d] hover:bg-white text-[#15101e] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
                  >
                    <Printer size={16} />
                    {lang === 'ru' ? 'Печать / PDF' : 'Print / PDF'}
                  </button>

                  <button
                    type="button"
                    onClick={exportToCSV}
                    className="px-3.5 py-2 bg-[#251c35] hover:bg-[#a855f7] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet size={15} />
                    CSV
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPrintModal(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer ml-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Printable Document Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6" id="printable-telemetry-report">
                {/* Document Header */}
                <div className="border-b-2 border-gray-700 print:border-black pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="text-[#ff4d4d] print:text-black font-black text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <Activity size={14} />
                      Aha Radio Station — Cyber Telemetry & Analytics
                    </div>
                    <h1 className="text-2xl font-black text-white print:text-black uppercase tracking-wide">
                      {lang === 'ru' ? 'ОФИЦИАЛЬНЫЙ СТАТИСТИЧЕСКИЙ ОТЧЕТ' : 'OFFICIAL STATISTICAL REPORT'}
                    </h1>
                    <p className="text-xs text-gray-400 print:text-gray-700 mt-0.5">
                      {lang === 'ru' 
                        ? `Дата формирования: ${new Date().toLocaleString('ru-RU')} | Составитель: ${user?.email || 'Администратор'}`
                        : `Generated: ${new Date().toLocaleString()} | Operator: ${user?.email || 'Admin'}`}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-300 print:text-black font-mono bg-[#15101e] print:bg-gray-100 p-3 rounded-2xl border border-[#3d2b4f] print:border-gray-400">
                    <div>Период фильтра: <span className="font-black text-white print:text-black">{timeRange.toUpperCase()}</span></div>
                    <div>Записей в отчете: <span className="font-black text-white print:text-black">{filteredLogs.length}</span></div>
                  </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
                  <div className="bg-[#15101e] print:bg-gray-50 border border-[#3d2b4f] print:border-gray-400 p-3.5 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-700">Всего визитов</div>
                    <div className="text-xl font-black text-[#ff4d4d] print:text-black mt-1">{totalVisits}</div>
                  </div>
                  <div className="bg-[#15101e] print:bg-gray-50 border border-[#3d2b4f] print:border-gray-400 p-3.5 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-700">Уникальные пользователи</div>
                    <div className="text-xl font-black text-[#00f0ff] print:text-black mt-1">{activeUsersCount}</div>
                  </div>
                  <div className="bg-[#15101e] print:bg-gray-50 border border-[#3d2b4f] print:border-gray-400 p-3.5 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-700">Топ раздел</div>
                    <div className="text-base font-black text-[#a855f7] print:text-black mt-1 truncate">{topSection}</div>
                  </div>
                  <div className="bg-[#15101e] print:bg-gray-50 border border-[#3d2b4f] print:border-gray-400 p-3.5 rounded-2xl">
                    <div className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-700">Доля AdBlock</div>
                    <div className="text-xl font-black text-amber-400 print:text-black mt-1">
                      {filteredLogs.length > 0
                        ? `${Math.round((filteredLogs.filter(l => l.adblockDetected).length / filteredLogs.length) * 100)}%`
                        : '0%'}
                    </div>
                  </div>
                </div>

                {/* OS Breakdown & Hourly Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
                  {/* OS Distribution Table */}
                  <div className="bg-[#15101e] print:bg-white border border-[#3d2b4f] print:border-gray-400 p-4 rounded-2xl">
                    <h4 className="text-xs font-black uppercase text-gray-300 print:text-black mb-3">
                      {lang === 'ru' ? 'Распределение по ОС и платформам' : 'OS & Platform Distribution'}
                    </h4>
                    <table className="w-full text-xs text-left print:text-black font-mono">
                      <thead>
                        <tr className="border-b border-[#3d2b4f] print:border-gray-400 text-[10px] text-gray-400 print:text-gray-700 uppercase">
                          <th className="pb-2 font-bold">Операционная система</th>
                          <th className="pb-2 text-right font-bold">Кол-во</th>
                          <th className="pb-2 text-right font-bold">Доля</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3d2b4f]/40 print:divide-gray-300">
                        {osDistribution.map((os) => {
                          const pct = totalVisits > 0 ? Math.round((os.value / totalVisits) * 100) : 0;
                          return (
                            <tr key={os.name}>
                              <td className="py-1.5 font-medium">{os.name}</td>
                              <td className="py-1.5 text-right font-bold text-cyan-400 print:text-black">{os.value}</td>
                              <td className="py-1.5 text-right text-gray-400 print:text-gray-700">{pct}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Hourly peak activity */}
                  <div className="bg-[#15101e] print:bg-white border border-[#3d2b4f] print:border-gray-400 p-4 rounded-2xl">
                    <h4 className="text-xs font-black uppercase text-gray-300 print:text-black mb-3">
                      {lang === 'ru' ? 'Почасовая активность (Пиковые часы)' : 'Hourly Peak Activity'}
                    </h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 font-mono">
                      {hourlyActivity.filter(h => h.visits > 0).map((h) => (
                        <div key={h.hour} className="flex items-center justify-between text-xs py-0.5">
                          <span className="text-gray-400 print:text-black">{h.hour}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-28 bg-[#251c35] print:bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#ff4d4d] print:bg-black h-full"
                                style={{ width: `${Math.min(100, (h.visits / (Math.max(...hourlyActivity.map(x => x.visits)) || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="font-bold text-white print:text-black text-xs min-w-[24px] text-right">{h.visits}</span>
                          </div>
                        </div>
                      ))}
                      {hourlyActivity.every(h => h.visits === 0) && (
                        <p className="text-xs text-gray-500 py-4 text-center">Нет зафиксированной активности</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Session Logs Detailed Table */}
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-300 print:text-black mb-2 flex items-center justify-between">
                    <span>{lang === 'ru' ? 'Детализированный реестр сессий' : 'Detailed Session Registry'}</span>
                    <span className="text-[10px] font-mono text-gray-400 print:text-gray-700">
                      {lang === 'ru' ? `(Первые ${Math.min(filteredLogs.length, 100)} из ${filteredLogs.length})` : `(First ${Math.min(filteredLogs.length, 100)} of ${filteredLogs.length})`}
                    </span>
                  </h4>
                  <div className="border border-[#3d2b4f] print:border-gray-400 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-[11px] print:text-black font-mono">
                      <thead className="bg-[#15101e] print:bg-gray-100 text-gray-400 print:text-black text-[10px] uppercase border-b border-[#3d2b4f] print:border-gray-400">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Дата и время (UTC / Local)</th>
                          <th className="p-2.5">Пользователь</th>
                          <th className="p-2.5">Посещенный раздел</th>
                          <th className="p-2.5">ОС / Платформа</th>
                          <th className="p-2.5">Экран / Viewport</th>
                          <th className="p-2.5">Часовой пояс</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3d2b4f]/40 print:divide-gray-300">
                        {filteredLogs.slice(0, 100).map((log, idx) => {
                          let formattedTime = log.localTime || '';
                          if (log.timestamp?.toDate) formattedTime = log.timestamp.toDate().toISOString().replace('T', ' ').slice(0, 19);
                          else if (log.timestamp?.seconds) formattedTime = new Date(log.timestamp.seconds * 1000).toISOString().replace('T', ' ').slice(0, 19);

                          return (
                            <tr key={log.id} className="hover:bg-white/5 print:hover:bg-transparent">
                              <td className="p-2.5 text-gray-500 print:text-gray-600">{idx + 1}</td>
                              <td className="p-2.5 text-cyan-400 print:text-black font-bold whitespace-nowrap">{formattedTime}</td>
                              <td className="p-2.5 text-white print:text-black font-bold">
                                {log.displayName || 'Guest'}
                                {log.userEmail && <div className="text-[9px] text-gray-400 print:text-gray-600 font-normal">{log.userEmail}</div>}
                              </td>
                              <td className="p-2.5 text-[#ff4d4d] print:text-black font-bold">{getSectionLabel(log.currentSection || 'home', lang)}</td>
                              <td className="p-2.5 text-gray-300 print:text-black">{log.platform || 'Unknown'}</td>
                              <td className="p-2.5 text-gray-400 print:text-black">{log.screen || log.viewport || '-'}</td>
                              <td className="p-2.5 text-gray-400 print:text-black">{log.timezone || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Print Document Sign-off Footer */}
                <div className="pt-6 border-t-2 border-gray-700 print:border-black flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-gray-500 print:text-black font-mono gap-2">
                  <div>Aha Radio Station Cyber Telemetry System &copy; 2026. All rights reserved.</div>
                  <div>Секретно / Автоматический отчет административной панели</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
};


