import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Search, ShieldCheck, Database, Trash2, 
  Monitor, Cpu, Globe, Key, Clock, LogIn, ExternalLink, Mail, Lock,
  TrendingUp, BarChart2, Layers, Users, Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { collection, onSnapshot, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';

interface TelemetryLog {
  id: string;
  userId: string;
  userEmail: string;
  displayName: string;
  userAgent: string;
  platform: string;
  screen: string;
  viewport: string;
  language: string;
  timezone: string;
  cores: string | number;
  memory: string | number;
  connectionType: string;
  referrer: string;
  localTime: string;
  currentSection: string;
  timestamp: any;
  sessionId: string;
}

const SECTION_CONFIG: Record<string, { labelRu: string; labelEn: string; color: string }> = {
  home: { labelRu: 'Главная', labelEn: 'Home', color: '#ff4d4d' },
  chat: { labelRu: 'Чаты', labelEn: 'Chat', color: '#00f0ff' },
  ai: { labelRu: 'Ahi AI', labelEn: 'Ahi AI', color: '#a855f7' },
  games: { labelRu: 'Игры', labelEn: 'Games', color: '#10b981' },
  forum: { labelRu: 'Форум', labelEn: 'Forum', color: '#f59e0b' },
  profile: { labelRu: 'Профиль', labelEn: 'Profile', color: '#ec4899' },
  telemetry: { labelRu: 'Телеметрия', labelEn: 'Telemetry', color: '#3b82f6' },
  security: { labelRu: 'Безопасность', labelEn: 'Security', color: '#14b8a6' },
  admin: { labelRu: 'Админка', labelEn: 'Admin', color: '#f43f5e' }
};

const getSectionColor = (sec: string, index: number) => {
  if (SECTION_CONFIG[sec]) return SECTION_CONFIG[sec].color;
  const fallbackColors = ['#8b5cf6', '#06b6d4', '#eab308', '#f97316', '#64748b'];
  return fallbackColors[index % fallbackColors.length];
};

const getSectionLabel = (sec: string, lang: Language) => {
  if (SECTION_CONFIG[sec]) {
    return lang === 'ru' ? SECTION_CONFIG[sec].labelRu : SECTION_CONFIG[sec].labelEn;
  }
  return sec.toUpperCase();
};

export const TelemetrySection: React.FC<{ lang: Language }> = ({ lang }) => {
  const { user, role, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');

  useEffect(() => {
    if (authLoading) return;
    if (!user || (role !== 'admin' && role !== 'moderator')) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'telemetry'),
      orderBy('timestamp', 'desc'),
      limit(500)
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
  }, [user, role]);

  // Process last 7 days chart data
  const { chartData, activeSections, total7dVisits, topSection, activeUsers7d } = useMemo(() => {
    const daysMap = new Map<string, { label: string; counts: Record<string, number>; total: number }>();
    const daysArray: { key: string; label: string }[] = [];

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
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
    }

    const sectionsSet = new Set<string>();
    const uniqueUsersSet = new Set<string>();
    let totalVisits = 0;
    const sectionTotals: Record<string, number> = {};

    logs.forEach((log) => {
      let logDate: Date | null = null;
      if (log.timestamp) {
        if (typeof log.timestamp.toDate === 'function') {
          logDate = log.timestamp.toDate();
        } else if (log.timestamp.seconds) {
          logDate = new Date(log.timestamp.seconds * 1000);
        } else if (typeof log.timestamp === 'number') {
          logDate = new Date(log.timestamp);
        } else if (typeof log.timestamp === 'string') {
          const d = new Date(log.timestamp);
          if (!isNaN(d.getTime())) logDate = d;
        }
      }
      if (!logDate && log.localTime) {
        const d = new Date(log.localTime);
        if (!isNaN(d.getTime())) logDate = d;
      }

      if (!logDate) return;

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
        totalVisits += 1;

        sectionTotals[sec] = (sectionTotals[sec] || 0) + 1;
      }
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

    // Find top section
    let topSecName = 'home';
    let topSecCount = -1;
    Object.entries(sectionTotals).forEach(([sec, count]) => {
      if (count > topSecCount) {
        topSecCount = count;
        topSecName = sec;
      }
    });

    return {
      chartData: data,
      activeSections: Array.from(sectionsSet),
      total7dVisits: totalVisits,
      topSection: getSectionLabel(topSecName, lang),
      activeUsers7d: uniqueUsersSet.size
    };
  }, [logs, lang]);

  const handleDeleteLog = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись телеметрии?')) {
      try {
        await deleteDoc(doc(db, 'telemetry', id));
      } catch (err) {
        console.error('Failed to delete log:', err);
      }
    }
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = (
      (log.displayName || '').toLowerCase().includes(term) ||
      (log.userEmail || '').toLowerCase().includes(term) ||
      (log.currentSection || '').toLowerCase().includes(term) ||
      (log.platform || '').toLowerCase().includes(term) ||
      (log.timezone || '').toLowerCase().includes(term)
    );

    const matchesSection = selectedSectionFilter === 'ALL' || (log.currentSection || '').toLowerCase() === selectedSectionFilter.toLowerCase();

    return matchesSearch && matchesSection;
  });

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#ff4d4d] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,77,77,0.3)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-[#15101e]/60 border border-[#3d2b4f]/20 rounded-[2.5rem] p-8 sm:p-12 text-center max-w-2xl mx-auto my-12 backdrop-blur-md">
        <Lock className="mx-auto text-[#ff4d4d]/60 mb-5" size={44} />
        <h4 className="text-xl font-black text-white uppercase tracking-wider mb-2">
          {lang === 'ru' ? 'Авторизация' : 'Authorization'}
        </h4>
        <p className="text-white/60 mb-8 font-black uppercase tracking-widest text-xs max-w-md mx-auto">
          {lang === 'ru' ? 'Войдите в систему, чтобы получить доступ к разделу телеметрии.' : 'Please log in to get access to telemetry section.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <GoogleLoginButton lang={lang} />
          <button
            onClick={() => window.dispatchEvent(new Event('openEmailLogin'))}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3d2b4f]/40 border border-[#3d2b4f] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 shadow-xl"
          >
            <Mail size={16} />
            {lang === 'ru' ? 'Зарегистрироваться через почту' : 'Register via email'}
          </button>
        </div>
      </div>
    );
  }

  // Statistics and charts are available for all users.
  // Deleting logs is reserved for admins/moderators.

  return (
    <div className="max-w-6xl mx-auto space-y-6 selection:bg-[#ff4d4d]/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#ff4d4d] uppercase flex items-center gap-3 tracking-widest">
            <Activity className="w-8 h-8 text-[#ff4d4d] animate-pulse" />
            Telemetry & Security Audit
          </h2>
          <p className="text-sm text-gray-400 mt-1">Реальное логирование и интерактивная аналитика активности за 7 дней.</p>
        </div>
        
        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Поиск логов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#15101e] border border-[#3d2b4f] focus:border-[#ff4d4d] text-white pl-10 pr-4 py-2.5 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#251c35] border border-[#3d2b4f] rounded-3xl shadow-xl flex items-center gap-4">
          <div className="p-3 bg-red-500/20 text-[#ff4d4d] rounded-2xl border border-red-500/30">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'Событий за 7 дней' : '7-Day Activity'}
            </div>
            <div className="text-2xl font-black text-white mt-0.5">{total7dVisits}</div>
          </div>
        </div>

        <div className="p-5 bg-[#251c35] border border-[#3d2b4f] rounded-3xl shadow-xl flex items-center gap-4">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'Топ Раздел' : 'Top Section'}
            </div>
            <div className="text-xl font-black text-white mt-0.5 truncate max-w-[140px]">{topSection}</div>
          </div>
        </div>

        <div className="p-5 bg-[#251c35] border border-[#3d2b4f] rounded-3xl shadow-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'Активных Юзеров' : 'Active Users'}
            </div>
            <div className="text-2xl font-black text-white mt-0.5">{activeUsers7d}</div>
          </div>
        </div>

        <div className="p-5 bg-[#251c35] border border-[#3d2b4f] rounded-3xl shadow-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'Период Анализа' : 'Analysis Period'}
            </div>
            <div className="text-sm font-bold text-white mt-1">7 дней (Firebase)</div>
          </div>
        </div>
      </div>

      {/* RECHARTS SECTION ACTIVITY DYNAMICS CHART */}
      <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="text-[#ff4d4d]" size={20} />
              {lang === 'ru' ? 'Динамика активности по разделам (7 дней)' : 'Section Activity Dynamics (7 Days)'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {lang === 'ru' ? 'Распределение посещений разделов приложения по дням' : 'Distribution of app section visits over time'}
            </p>
          </div>

          {/* Chart controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#15101e] border border-[#3d2b4f] rounded-xl p-1">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  chartType === 'area' ? 'bg-[#ff4d4d] text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Область
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  chartType === 'bar' ? 'bg-[#ff4d4d] text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Столбцы
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  chartType === 'line' ? 'bg-[#ff4d4d] text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Линии
              </button>
            </div>

            {/* Filter by Section */}
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="bg-[#15101e] border border-[#3d2b4f] text-gray-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#ff4d4d]"
            >
              <option value="ALL">{lang === 'ru' ? 'Все разделы' : 'All Sections'}</option>
              {activeSections.map((sec) => (
                <option key={sec} value={sec}>{getSectionLabel(sec, lang)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Recharts Container */}
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

      {/* Table Section */}
      <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Database className="text-[#ff4d4d]" size={20} />
          {lang === 'ru' ? 'Записи логов телеметрии' : 'Telemetry Log Records'}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <span className="text-gray-400 animate-pulse text-sm">Загрузка данных телеметрии...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
            <Database className="w-12 h-12 text-gray-600 mb-2" />
            <p className="text-sm">Логи не найдены или список пуст.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#15101e]/60 border-b border-[#3d2b4f]/70 text-gray-400 uppercase tracking-widest text-[10px]">
                  <th className="py-3.5 px-4 font-bold">Пользователь</th>
                  <th className="py-3.5 px-4 font-bold">Раздел</th>
                  <th className="py-3.5 px-4 font-bold">Система & Браузер</th>
                  <th className="py-3.5 px-4 font-bold">Параметры Экрана</th>
                  <th className="py-3.5 px-4 font-bold">Локализация</th>
                  <th className="py-3.5 px-4 font-bold">Сеть & Железо</th>
                  <th className="py-3.5 px-4 font-bold text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d2b4f]/40">
                <AnimatePresence initial={false}>
                  {filteredLogs.map((log) => (
                    <motion.tr 
                      key={log.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-[#15101e]/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-bold text-white max-w-[150px] truncate" title={log.displayName}>
                          {log.displayName || 'Guest'}
                        </div>
                        <div className="text-[10px] text-gray-400 max-w-[150px] truncate" title={log.userEmail}>
                          {log.userEmail || 'anonymous'}
                        </div>
                        <div className="text-[9px] text-[#ff4d4d] max-w-[120px] truncate font-mono">
                          ID: {log.userId || 'anonymous'}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold">
                        <span className="px-2 py-1 bg-[#15101e] text-[#ff4d4d] rounded-md uppercase tracking-wider text-[10px] border border-[#ff4d4d]/10">
                          {log.currentSection}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Monitor size={12} className="text-[#ff4d4d]" />
                          <span className="font-semibold">{log.platform || 'unknown'}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 max-w-[200px] truncate mt-1" title={log.userAgent}>
                          {log.userAgent}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-gray-300">
                        <div>Экран: {log.screen || 'unknown'}</div>
                        <div className="text-[10px] text-gray-500">Окно: {log.viewport || 'unknown'}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        <div className="flex items-center gap-1">
                          <Globe size={12} className="text-gray-400" />
                          <span>{log.language || 'unknown'}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 max-w-[130px] truncate mt-1" title={log.timezone}>
                          {log.timezone}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] flex items-center gap-0.5 text-gray-400">
                            <Cpu size={11} /> {log.cores} Cores
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {log.memory} GB RAM
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-400/80 font-semibold mt-1">
                          Сеть: {log.connectionType || 'unknown'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="text-right mr-2">
                            <div className="text-gray-400 font-bold">{log.localTime?.split(', ')?.[1] || ''}</div>
                            <div className="text-[9px] text-gray-500">{log.localTime?.split(', ')?.[0] || ''}</div>
                          </div>
                          {(role === 'admin' || role === 'moderator') && (
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 text-gray-500 hover:text-red-500 bg-[#15101e] border border-[#3d2b4f]/60 hover:border-red-500/40 rounded-lg transition-colors"
                              title="Удалить запись"
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
    </div>
  );
};

