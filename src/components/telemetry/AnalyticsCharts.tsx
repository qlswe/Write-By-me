import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import {
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  Layers,
  Users,
  Clock,
  Activity,
  Cpu,
  Monitor,
  Wifi,
  Shield,
  Smartphone,
  Laptop,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Language } from '../../data/translations';

export interface TelemetryLogItem {
  id: string;
  userId?: string;
  userEmail?: string;
  displayName?: string;
  deviceId?: string;
  fingerprint?: string;
  adblockDetected?: boolean;
  userAgent?: string;
  platform?: string;
  screen?: string;
  viewport?: string;
  language?: string;
  timezone?: string;
  cores?: string | number;
  memory?: string | number;
  connectionType?: string;
  downlinkMbps?: string | number;
  rttMs?: string | number;
  gpuVendor?: string;
  gpuRenderer?: string;
  batteryLevel?: string;
  batteryCharging?: string;
  currentSection?: string;
  eventName?: string;
  eventDetails?: string;
  timestamp?: any;
  localTime?: string;
  sessionId?: string;
}

interface AnalyticsChartsProps {
  logs: TelemetryLogItem[];
  lang: Language;
  timeRange?: '24h' | '7d' | '30d' | 'all';
  onTimeRangeChange?: (range: '24h' | '7d' | '30d' | 'all') => void;
  selectedSection?: string;
  onSectionChange?: (section: string) => void;
}

const SECTION_THEME: Record<string, { labelRu: string; labelEn: string; color: string }> = {
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
  sdk: { labelRu: 'SDK', labelEn: 'SDK', color: '#eab308' },
  browser: { labelRu: 'AHA-v6 Браузер', labelEn: 'AHA-v6 Browser', color: '#06b6d4' }
};

const PALETTE = ['#ff4d4d', '#00f0ff', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e'];

const getSectionColor = (sec: string, index: number) => {
  const s = (sec || '').toLowerCase();
  if (SECTION_THEME[s]) return SECTION_THEME[s].color;
  return PALETTE[index % PALETTE.length];
};

const getSectionLabel = (sec: string, lang: Language) => {
  const s = (sec || '').toLowerCase();
  if (SECTION_THEME[s]) {
    return lang === 'ru' ? SECTION_THEME[s].labelRu : SECTION_THEME[s].labelEn;
  }
  return (sec || 'UNKNOWN').toUpperCase();
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  logs,
  lang,
  timeRange = '7d',
  onTimeRangeChange,
  selectedSection = 'ALL',
  onSectionChange
}) => {
  const [activeView, setActiveView] = useState<'timeline' | 'features' | 'devices' | 'hardware'>('timeline');
  const [chartType, setChartType] = useState<'composed' | 'area' | 'bar' | 'line'>('composed');

  // Filter logs by time range
  const filteredLogs = useMemo(() => {
    if (timeRange === 'all') return logs;
    const now = Date.now();
    let limitMs = 7 * 24 * 60 * 60 * 1000;
    if (timeRange === '24h') limitMs = 24 * 60 * 60 * 1000;
    if (timeRange === '30d') limitMs = 30 * 24 * 60 * 60 * 1000;

    return logs.filter((log) => {
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
      return now - timeMs <= limitMs;
    });
  }, [logs, timeRange]);

  // Aggregate statistics and recharts datasets
  const analytics = useMemo(() => {
    const numDays = timeRange === '24h' ? 1 : timeRange === '30d' ? 30 : 7;
    const now = new Date();

    const daysMap = new Map<string, { label: string; counts: Record<string, number>; total: number }>();
    const daysUserMap = new Map<string, { activeUsers: Set<string>; sessions: Set<string> }>();
    const userSessionMap = new Map<string, Set<string>>();
    const daysArray: { key: string; label: string }[] = [];

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
    const deviceTypeMap: Record<string, number> = {
      Desktop: 0,
      Mobile: 0,
      Tablet: 0
    };
    const networkMap: Record<string, number> = {};
    const coresMap: Record<string, number> = {};
    const hoursCount = new Array(24).fill(0);
    const sectionTotals: Record<string, number> = {};
    let adblockCount = 0;

    filteredLogs.forEach((log) => {
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

      if (log.userId && log.userId !== 'anonymous') {
        uniqueUsersSet.add(log.userId);
      } else if (log.deviceId) {
        uniqueUsersSet.add(log.deviceId);
      }

      if (log.adblockDetected) {
        adblockCount++;
      }

      if (logDate) {
        hoursCount[logDate.getHours()]++;

        const year = logDate.getFullYear();
        const month = String(logDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(logDate.getDate()).padStart(2, '0');
        const dayKey = `${year}-${month}-${dayStr}`;

        if (daysMap.has(dayKey)) {
          const sec = (log.currentSection || 'home').toLowerCase();
          sectionsSet.add(sec);

          const dayData = daysMap.get(dayKey)!;
          dayData.counts[sec] = (dayData.counts[sec] || 0) + 1;
          dayData.total += 1;

          sectionTotals[sec] = (sectionTotals[sec] || 0) + 1;

          const dayUserEntry = daysUserMap.get(dayKey);
          if (dayUserEntry) {
            dayUserEntry.activeUsers.add(userIdentifier);
            dayUserEntry.sessions.add(sessionIdentifier);
          }
        }
      }

      // OS & Platform detection
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

      // Device category detection
      const uaLower = (log.userAgent || '').toLowerCase();
      if (uaLower.includes('tablet') || uaLower.includes('ipad')) {
        deviceTypeMap.Tablet++;
      } else if (uaLower.includes('mobile') || uaLower.includes('android') || uaLower.includes('iphone')) {
        deviceTypeMap.Mobile++;
      } else {
        deviceTypeMap.Desktop++;
      }

      // Network Connection Type
      const conn = (log.connectionType || 'Unknown').toUpperCase();
      networkMap[conn] = (networkMap[conn] || 0) + 1;

      // CPU Cores distribution
      if (log.cores) {
        const coresKey = `${log.cores} Cores`;
        coresMap[coresKey] = (coresMap[coresKey] || 0) + 1;
      }
    });

    // Timeline Composed Chart dataset
    const timelineData = daysArray.map((day) => {
      const entry = daysMap.get(day.key)!;
      const userEntry = daysUserMap.get(day.key)!;
      const item: Record<string, any> = {
        date: day.label,
        totalEvents: entry.total,
        activeUsers: userEntry.activeUsers.size,
        uniqueSessions: userEntry.sessions.size
      };
      sectionsSet.forEach((sec) => {
        item[sec] = entry.counts[sec] || 0;
      });
      return item;
    });

    // Feature Engagement Breakdown
    const totalEventsCount = filteredLogs.length;
    const featureRanking = Object.entries(sectionTotals)
      .map(([sec, count], idx) => ({
        section: sec,
        name: getSectionLabel(sec, lang),
        events: count,
        share: totalEventsCount > 0 ? Math.round((count / totalEventsCount) * 100) : 0,
        fill: getSectionColor(sec, idx)
      }))
      .sort((a, b) => b.events - a.events);

    // OS Distribution dataset
    const osData = Object.entries(osMap).map(([name, value], idx) => ({
      name,
      value,
      color: PALETTE[idx % PALETTE.length]
    }));

    // Device Category dataset
    const deviceCategoryData = [
      { name: lang === 'ru' ? 'ПК / Ноутбуки' : 'Desktop', value: deviceTypeMap.Desktop, color: '#00f0ff' },
      { name: lang === 'ru' ? 'Смартфоны' : 'Mobile', value: deviceTypeMap.Mobile, color: '#ff4d4d' },
      { name: lang === 'ru' ? 'Планшеты' : 'Tablet', value: deviceTypeMap.Tablet, color: '#a855f7' }
    ].filter((d) => d.value > 0);

    // Hourly Activity dataset
    const hourlyData = hoursCount.map((count, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      events: count
    }));

    // Network Distribution dataset
    const networkData = Object.entries(networkMap).map(([name, value], idx) => ({
      name,
      value,
      color: PALETTE[(idx + 2) % PALETTE.length]
    }));

    // Session frequency metrics
    const sessionFrequencyBuckets = { single: 0, returning: 0, power: 0 };
    userSessionMap.forEach((sessions) => {
      if (sessions.size === 1) sessionFrequencyBuckets.single++;
      else if (sessions.size <= 5) sessionFrequencyBuckets.returning++;
      else sessionFrequencyBuckets.power++;
    });

    const retentionData = [
      { name: lang === 'ru' ? 'Новые (1 сессия)' : 'New (1 session)', value: sessionFrequencyBuckets.single, color: '#3b82f6' },
      { name: lang === 'ru' ? 'Возвращающиеся (2-5)' : 'Returning (2-5)', value: sessionFrequencyBuckets.returning, color: '#10b981' },
      { name: lang === 'ru' ? 'Постоянные (6+)' : 'Loyal (6+)', value: sessionFrequencyBuckets.power, color: '#a855f7' }
    ].filter((r) => r.value > 0);

    return {
      totalEvents: totalEventsCount,
      uniqueUsers: uniqueUsersSet.size,
      totalSessions: Array.from(userSessionMap.values()).reduce((sum, s) => sum + s.size, 0),
      adblockRate: totalEventsCount > 0 ? Math.round((adblockCount / totalEventsCount) * 100) : 0,
      topSection: featureRanking[0]?.name || (lang === 'ru' ? 'Главная' : 'Home'),
      activeSections: Array.from(sectionsSet),
      timelineData,
      featureRanking,
      osData,
      deviceCategoryData,
      hourlyData,
      networkData,
      retentionData
    };
  }, [filteredLogs, timeRange, lang]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-[#1e152d] border border-[#3d2b4f] rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#ff4d4d]/15 border border-[#ff4d4d]/30 text-[#ff4d4d] rounded-2xl">
            <BarChart2 size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>{lang === 'ru' ? 'Аналитика активности в реальном времени' : 'Live Activity & Telemetry Analytics'}</span>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Firestore Live
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {lang === 'ru'
                ? 'Визуализация телеметрии, вовлеченности разделов и системных метрик'
                : 'Interactive Recharts visualization for user visits, devices, and engagement'}
            </p>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center gap-1.5 bg-[#15101e] border border-[#3d2b4f] p-1.5 rounded-2xl flex-wrap">
          <button
            onClick={() => setActiveView('timeline')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'timeline'
                ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg font-black'
                : 'text-gray-400 hover:text-white hover:bg-[#251c35]'
            }`}
          >
            <TrendingUp size={14} />
            {lang === 'ru' ? 'Динамика' : 'Timeline'}
          </button>
          <button
            onClick={() => setActiveView('features')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'features'
                ? 'bg-[#00f0ff] text-[#15101e] shadow-lg font-black'
                : 'text-gray-400 hover:text-white hover:bg-[#251c35]'
            }`}
          >
            <Layers size={14} />
            {lang === 'ru' ? 'Разделы' : 'Sections'}
          </button>
          <button
            onClick={() => setActiveView('devices')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'devices'
                ? 'bg-[#a855f7] text-white shadow-lg font-black'
                : 'text-gray-400 hover:text-white hover:bg-[#251c35]'
            }`}
          >
            <PieIcon size={14} />
            {lang === 'ru' ? 'Устройства & ОС' : 'Devices'}
          </button>
          <button
            onClick={() => setActiveView('hardware')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'hardware'
                ? 'bg-[#10b981] text-[#15101e] shadow-lg font-black'
                : 'text-gray-400 hover:text-white hover:bg-[#251c35]'
            }`}
          >
            <Cpu size={14} />
            {lang === 'ru' ? 'Сеть & Железо' : 'Hardware'}
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#251c35] border border-[#3d2b4f] hover:border-[#ff4d4d]/60 transition-all p-4 rounded-3xl shadow-xl flex items-center gap-3.5">
          <div className="p-3 bg-red-500/20 text-[#ff4d4d] rounded-2xl border border-red-500/30">
            <Activity size={20} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'Всего событий' : 'Total Logs'}
            </div>
            <div className="text-2xl font-black text-white mt-0.5">{analytics.totalEvents}</div>
          </div>
        </div>

        <div className="bg-[#251c35] border border-[#3d2b4f] hover:border-cyan-500/60 transition-all p-4 rounded-3xl shadow-xl flex items-center gap-3.5">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'Уникальные пользователи' : 'Unique Users'}
            </div>
            <div className="text-2xl font-black text-white mt-0.5">{analytics.uniqueUsers}</div>
          </div>
        </div>

        <div className="bg-[#251c35] border border-[#3d2b4f] hover:border-purple-500/60 transition-all p-4 rounded-3xl shadow-xl flex items-center gap-3.5">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'Топ раздел' : 'Top Section'}
            </div>
            <div className="text-base font-black text-white mt-0.5 truncate max-w-[130px]" title={analytics.topSection}>
              {analytics.topSection}
            </div>
          </div>
        </div>

        <div className="bg-[#251c35] border border-[#3d2b4f] hover:border-emerald-500/60 transition-all p-4 rounded-3xl shadow-xl flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'AdBlock защита' : 'AdBlock Rate'}
            </div>
            <div className="text-2xl font-black text-white mt-0.5">{analytics.adblockRate}%</div>
          </div>
        </div>
      </div>

      {/* Main Visualizer Body depending on activeView */}
      <AnimatePresence mode="wait">
        {activeView === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Primary Activity Chart */}
            <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="text-[#ff4d4d]" size={18} />
                    {lang === 'ru' ? 'Динамика событий, пользователей и сессий' : 'Timeline: Events, Users & Sessions'}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lang === 'ru'
                      ? 'Временной график плотности пользовательских действий из Firestore'
                      : 'Time series activity trend with multi-metric correlation'}
                  </p>
                </div>

                <div className="flex items-center bg-[#15101e] border border-[#3d2b4f] rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => setChartType('composed')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chartType === 'composed' ? 'bg-[#ff4d4d] text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {lang === 'ru' ? 'Комбо' : 'Composed'}
                  </button>
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

              <div className="w-full h-80 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'composed' ? (
                    <ComposedChart data={analytics.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0.0} />
                        </linearGradient>
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
                      <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
                      <Area
                        type="monotone"
                        dataKey="totalEvents"
                        name={lang === 'ru' ? 'Всего событий' : 'Total Events'}
                        stroke="#ff4d4d"
                        fill="url(#areaGrad)"
                        strokeWidth={2.5}
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
                  ) : chartType === 'area' ? (
                    <AreaChart data={analytics.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGradOnly" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3d2b4f" opacity={0.5} />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#120a21',
                          borderColor: '#3d2b4f',
                          borderRadius: '16px',
                          fontSize: '12px',
                          color: '#fff'
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
                      <Area
                        type="monotone"
                        dataKey="totalEvents"
                        name={lang === 'ru' ? 'События' : 'Events'}
                        stroke="#00f0ff"
                        fill="url(#areaGradOnly)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  ) : chartType === 'bar' ? (
                    <BarChart data={analytics.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3d2b4f" opacity={0.5} />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#120a21',
                          borderColor: '#3d2b4f',
                          borderRadius: '16px',
                          fontSize: '12px',
                          color: '#fff'
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
                      <Bar
                        dataKey="totalEvents"
                        name={lang === 'ru' ? 'События' : 'Events'}
                        fill="#ff4d4d"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="uniqueSessions"
                        name={lang === 'ru' ? 'Сессии' : 'Sessions'}
                        fill="#a855f7"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={analytics.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3d2b4f" opacity={0.5} />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#120a21',
                          borderColor: '#3d2b4f',
                          borderRadius: '16px',
                          fontSize: '12px',
                          color: '#fff'
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="totalEvents"
                        name={lang === 'ru' ? 'События' : 'Events'}
                        stroke="#ff4d4d"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#ff4d4d' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="activeUsers"
                        name={lang === 'ru' ? 'Пользователи' : 'Users'}
                        stroke="#00f0ff"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#00f0ff' }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sub Grid: Hourly Peak Hours & Retention Rates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Peak Activity */}
              <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                    <Clock className="text-purple-400" size={16} />
                    {lang === 'ru' ? 'Почасовая активность (24ч цикл)' : 'Hourly Peak Activity (24h)'}
                  </h4>
                  <p className="text-xs text-gray-400 mb-4">
                    {lang === 'ru' ? 'Распределение посещений по времени суток' : 'Distribution of visits by time of day'}
                  </p>
                </div>

                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.hourlyData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
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
                      <Bar dataKey="events" name={lang === 'ru' ? 'События' : 'Events'} fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Retention & Session Frequency */}
              <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                    <RefreshCw className="text-[#10b981]" size={16} />
                    {lang === 'ru' ? 'Частота возвратов и удержание' : 'Session Frequency & Loyalty'}
                  </h4>
                  <p className="text-xs text-gray-400 mb-4">
                    {lang === 'ru' ? 'Доля пользователей по количеству зафиксированных сессий' : 'User breakdown by repeat visits and sessions count'}
                  </p>
                </div>

                <div className="w-full h-56">
                  {analytics.retentionData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-gray-500">
                      {lang === 'ru' ? 'Недостаточно данных' : 'No retention data'}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.retentionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analytics.retentionData.map((entry, index) => (
                            <Cell key={`retention-${index}`} fill={entry.color} />
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
          </motion.div>
        )}

        {activeView === 'features' && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Feature Ranking Chart */}
            <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl">
              <div className="mb-6">
                <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="text-[#00f0ff]" size={18} />
                  {lang === 'ru' ? 'Рейтинг вовлеченности разделов' : 'Section Engagement & Popularity'}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  {lang === 'ru'
                    ? 'Сравнение количества посещений и переходов между инструментами платформы'
                    : 'Comparison of interaction volume across all station components'}
                </p>
              </div>

              <div className="w-full h-80">
                {analytics.featureRanking.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-gray-500">
                    {lang === 'ru' ? 'Нет данных по разделам' : 'No section data'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={analytics.featureRanking}
                      margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#3d2b4f" opacity={0.3} horizontal={false} />
                      <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} tickLine={false} width={110} />
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
                      <Bar dataKey="events" name={lang === 'ru' ? 'События' : 'Visits'} radius={[0, 8, 8, 0]}>
                        {analytics.featureRanking.map((entry, index) => (
                          <Cell key={`feat-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {analytics.featureRanking.map((item) => (
                <div
                  key={item.section}
                  onClick={() => onSectionChange && onSectionChange(item.section)}
                  className="bg-[#1e152d] border border-[#3d2b4f] hover:border-[#00f0ff] p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                    <div className="truncate">
                      <div className="text-xs font-bold text-white group-hover:text-[#00f0ff] transition-colors truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-gray-400">{item.events} {lang === 'ru' ? 'логов' : 'logs'}</div>
                    </div>
                  </div>
                  <div className="text-xs font-black text-gray-300 group-hover:text-white shrink-0 ml-2">
                    {item.share}%
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeView === 'devices' && (
          <motion.div
            key="devices"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* OS & Platform Distribution */}
            <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
              <div>
                <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                  <Monitor className="text-cyan-400" size={18} />
                  {lang === 'ru' ? 'Операционные системы (ОС)' : 'Operating Systems & Platforms'}
                </h4>
                <p className="text-xs text-gray-400 mb-4">
                  {lang === 'ru' ? 'Доли операционных систем среди зафиксированных сессий' : 'Breakdown of client operating systems'}
                </p>
              </div>

              <div className="w-full h-64">
                {analytics.osData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-gray-500">
                    {lang === 'ru' ? 'Нет данных по ОС' : 'No OS data'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.osData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {analytics.osData.map((entry, index) => (
                          <Cell key={`os-cell-${index}`} fill={entry.color} />
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

            {/* Device Form Factor (Desktop vs Mobile vs Tablet) */}
            <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
              <div>
                <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                  <Smartphone className="text-[#ff4d4d]" size={18} />
                  {lang === 'ru' ? 'Типы клиентских устройств' : 'Device Form Factors'}
                </h4>
                <p className="text-xs text-gray-400 mb-4">
                  {lang === 'ru' ? 'Соотношение настольных компьютеров и мобильных устройств' : 'Ratio of Desktop, Mobile, and Tablet traffic'}
                </p>
              </div>

              <div className="w-full h-64">
                {analytics.deviceCategoryData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-gray-500">
                    {lang === 'ru' ? 'Нет данных' : 'No device data'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.deviceCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {analytics.deviceCategoryData.map((entry, index) => (
                          <Cell key={`device-cat-${index}`} fill={entry.color} />
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
          </motion.div>
        )}

        {activeView === 'hardware' && (
          <motion.div
            key="hardware"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Network Connection Types */}
            <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
              <div>
                <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                  <Wifi className="text-emerald-400" size={18} />
                  {lang === 'ru' ? 'Типы сетевого соединения' : 'Network Connection Types'}
                </h4>
                <p className="text-xs text-gray-400 mb-4">
                  {lang === 'ru' ? 'Каналы связи (4g, 3g, Wi-Fi, Ethernet)' : 'Client effective network throughput'}
                </p>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.networkData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3d2b4f" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#120a21',
                        borderColor: '#3d2b4f',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="value" name={lang === 'ru' ? 'Пользователи' : 'Users'} fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AdBlock & Privacy Protection Status */}
            <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
              <div>
                <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                  <Shield className="text-[#ff4d4d]" size={18} />
                  {lang === 'ru' ? 'Статус AdBlock и защиты приватности' : 'Privacy & AdBlock Protection'}
                </h4>
                <p className="text-xs text-gray-400 mb-4">
                  {lang === 'ru' ? 'Детектирование блокировщиков рекламы и трекеров' : 'Multi-layer client adblock detection stats'}
                </p>
              </div>

              <div className="w-full h-64 flex flex-col justify-center items-center gap-4">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#3d2b4f]"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#ff4d4d]"
                      strokeDasharray={`${analytics.adblockRate}, 100`}
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{analytics.adblockRate}%</span>
                    <span className="text-[9px] uppercase font-bold text-gray-400">AdBlock</span>
                  </div>
                </div>

                <div className="text-center text-xs text-gray-300">
                  <span className="font-bold text-white">{Math.round((analytics.adblockRate * analytics.totalEvents) / 100)}</span>{' '}
                  {lang === 'ru' ? 'из' : 'of'}{' '}
                  <span className="font-bold text-white">{analytics.totalEvents}</span>{' '}
                  {lang === 'ru' ? 'событий зафиксированы с блокировщиком' : 'events were recorded with active adblock'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
