import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Search, ShieldCheck, Database, Trash2, 
  Monitor, Cpu, Globe, Key, Clock, LogIn, ExternalLink, Mail, Lock 
} from 'lucide-react';
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

export const TelemetrySection: React.FC<{ lang: Language }> = ({ lang }) => {
  const { user, role, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const t = translations[lang] as any;

  useEffect(() => {
    if (authLoading) return;
    if (!user || (role !== 'admin' && role !== 'moderator')) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'telemetry'),
      orderBy('timestamp', 'desc'),
      limit(150)
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
    return (
      (log.displayName || '').toLowerCase().includes(term) ||
      (log.userEmail || '').toLowerCase().includes(term) ||
      (log.currentSection || '').toLowerCase().includes(term) ||
      (log.platform || '').toLowerCase().includes(term) ||
      (log.timezone || '').toLowerCase().includes(term)
    );
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

  if (role !== 'admin' && role !== 'moderator') {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#251c35] rounded-3xl p-8 border border-[#3d2b4f] shadow-2xl text-center">
        <ShieldCheck className="w-16 h-16 text-[#ff4d4d] mb-4" />
        <h2 className="text-2xl font-black text-[#ff4d4d] uppercase mb-2 tracking-widest">ДОСТУП ЗАПРЕЩЕН</h2>
        <p className="text-gray-400">У вас нет необходимых прав доступа для просмотра телеметрии пользователей.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#ff4d4d] uppercase flex items-center gap-3 tracking-widest">
            <Activity className="w-8 h-8 text-[#ff4d4d] animate-pulse" />
            Telemetry & Security Audit
          </h2>
          <p className="text-sm text-gray-400 mt-1">Реальное логирование разрешенных параметров пользователей.</p>
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

      <div className="bg-[#251c35] border border-[#3d2b4f] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
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
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 text-gray-500 hover:text-red-500 bg-[#15101e] border border-[#3d2b4f]/60 hover:border-red-500/40 rounded-lg transition-colors"
                            title="Удалить запись"
                          >
                            <Trash2 size={13} />
                          </button>
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
