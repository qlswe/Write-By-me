import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createRoot, Root } from 'react-dom/client';
import DOMPurify from 'dompurify';
import { ShieldCheck, X, Activity, EyeOff, Lock, ShieldAlert, Trash2, Siren, Ghost, FileText, FileWarning, Eye, Cpu, Network, CheckCircle, Copy, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { KuruVideoPlayer } from '../ui/KuruVideoPlayer';
import { safeStorage, setZeroTraceMode, isZeroTraceActive } from '../../utils/securityStorage';
import { sanitizeContent, getThreatsBlockedCount } from '../../utils/sanitizer';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

export { sanitizeContent, getThreatsBlockedCount };

// 2. Safe HTML / Markdown Component
export const SafeHtml: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  return <MarkdownRenderer content={html} className={className} allowHtml={true} />;
};

// 3. Visual Badge & Control Panel
export const AhaSecurityBadge: React.FC<{ autoHide?: boolean }> = ({ autoHide }) => {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [globalHidden, setGlobalHidden] = useState(false);
  const [threatsBlocked, setThreatsBlocked] = useState(getThreatsBlockedCount());
  const [isStrict, setIsStrict] = useState(safeStorage.getItem('aha_strict_mode') === 'true');
  const [isCensored, setIsCensored] = useState(safeStorage.getItem('aha_censor_mode') === 'true');
  const [zeroTrace, setZeroTrace] = useState(isZeroTraceActive());
  const [activeTab, setActiveTab] = useState<'status' | 'tools' | 'ipv6' | 'logs'>('status');
  const [logs, setLogs] = useState<string[]>([]);
  const [isPanicking, setIsPanicking] = useState(false);
  const [copiedVercelConfig, setCopiedVercelConfig] = useState(false);

  useEffect(() => {
    const hiddenState = safeStorage.getItem('aha_security_hidden');
    if (hiddenState === 'true') {
      setIsHidden(true);
    }
    
    try {
      setLogs(JSON.parse(safeStorage.getItem('aha_security_logs') || '[]'));
    } catch(e){}

    const handleThreat = () => {
        setThreatsBlocked(getThreatsBlockedCount());
        try {
            setLogs(JSON.parse(safeStorage.getItem('aha_security_logs') || '[]'));
        } catch(e){}
    };
    window.addEventListener('aha_threat_blocked', handleThreat);
    
    // Listen for global admin hidden state
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalHidden(data.securityHidden || false);
      }
    });

    return () => {
      window.removeEventListener('aha_threat_blocked', handleThreat);
      unsub();
    };
  }, []);

  const handleHide = () => {
    setIsHidden(true);
    setIsOpen(false);
    safeStorage.setItem('aha_security_hidden', 'true');
  };

  const toggleToggle = (key: string, setter: any, currentState: boolean) => {
    const newVal = !currentState;
    setter(newVal);
    safeStorage.setItem(key, newVal.toString());
    if (key === 'aha_strict_mode' || key === 'aha_censor_mode') {
      window.location.reload(); 
    }
  };

  const toggleZeroTrace = () => {
    const nextVal = !zeroTrace;
    setZeroTrace(nextVal);
    setZeroTraceMode(nextVal);
  };

  const clearCacheAndRAM = () => {
    if (window.confirm('Очистить локальный кэш и провести 7-проходную очистку RAM? Все данные будут стёрты без следов.')) {
      safeStorage.wipeAllTraces();
      window.location.reload();
    }
  };

  const handlePanic = async () => {
    if (window.confirm("Включить режим маскировки? Это скроет текущий интерфейс сайта.")) {
        setIsPanicking(true);
        safeStorage.setItem('aha_panic_mode', 'true');
        window.location.href = window.location.origin;
    }
  };

  const copyVercelConfig = () => {
    const config = `{
  "version": 2,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-[#AHA]-Protocol-Version", "value": "6.0-HYPER-IPv6" },
        { "key": "X-Forwarded-Proto", "value": "https" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    }
  ]
}`;
    navigator.clipboard.writeText(config);
    setCopiedVercelConfig(true);
    setTimeout(() => setCopiedVercelConfig(false), 2000);
  };

  if (isHidden || globalHidden || autoHide) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-4 w-96 bg-[#15101e]/98 backdrop-blur-xl border border-[#ff4d4d]/30 rounded-xl shadow-[0_10px_40px_-10px_rgba(255,77,77,0.3)] overflow-hidden flex flex-col max-h-[460px]"
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#ff4d4d]/10 to-transparent shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-green-500 w-5 h-5" />
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Aha Security Suite</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-[#ff4d4d] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-[#0d0b14] border-b border-white/5 shrink-0">
                <button onClick={() => setActiveTab('status')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'status' ? 'text-[#ff4d4d] bg-[#ff4d4d]/10 border-b-2 border-[#ff4d4d]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>Статус</button>
                <button onClick={() => setActiveTab('tools')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'tools' ? 'text-[#ff4d4d] bg-[#ff4d4d]/10 border-b-2 border-[#ff4d4d]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>Защита</button>
                <button onClick={() => setActiveTab('ipv6')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'ipv6' ? 'text-[#ff4d4d] bg-[#ff4d4d]/10 border-b-2 border-[#ff4d4d]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>Vercel IPv6</button>
                <button onClick={() => setActiveTab('logs')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'logs' ? 'text-[#ff4d4d] bg-[#ff4d4d]/10 border-b-2 border-[#ff4d4d]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>Логи</button>
            </div>

            <div className="overflow-y-auto hidden-scrollbar flex-1 p-4">
              {activeTab === 'status' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white/60 text-xs font-medium">Статус системы:</span>
                        <span className="text-green-400 font-mono text-xs font-bold flex items-center gap-1.5">
                        <Activity className="w-4 h-4 animate-pulse" /> АКТИВЕН
                        </span>
                    </div>
                
                    <div className="flex items-center justify-between p-3 bg-[#ff4d4d]/10 rounded-xl border border-[#ff4d4d]/20">
                        <span className="text-[#ff4d4d] text-xs font-medium">Заблокировано угроз:</span>
                        <span className="text-[#ff4d4d] font-black text-xl">{threatsBlocked}</span>
                    </div>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-xs font-bold text-emerald-300">Режим RAM-Only (Zero-Trace)</p>
                          <p className="text-[10px] text-emerald-400/70">Дисковое localStorage отключено</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                        {zeroTrace ? 'RAM ACTIVE' : 'DISK ON'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="bg-white/5 rounded-lg p-2 flex flex-col justify-center items-center gap-1">
                            <Lock className={`w-4 h-4 ${isStrict ? 'text-green-400' : 'text-gray-500'}`} />
                            <span className={isStrict ? 'text-green-400' : 'text-gray-500'}>Строгий</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 flex flex-col justify-center items-center gap-1">
                            <Eye className={`w-4 h-4 ${isCensored ? 'text-blue-400' : 'text-gray-500'}`} />
                            <span className={isCensored ? 'text-blue-400' : 'text-gray-500'}>Антимат</span>
                        </div>
                    </div>
                </div>
              )}

              {activeTab === 'tools' && (
                <div className="space-y-4">
                    {/* Zero Trace RAM Storage Toggle */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer" onClick={toggleZeroTrace}>
                        <div className="flex flex-col">
                          <span className="text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-emerald-400" /> Zero-Trace Memory Mode
                          </span>
                          <span className="text-emerald-400/70 text-[10px] mt-0.5">Не сохраняет ничего в localStorage (ОЗУ)</span>
                        </div>
                        <button className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${zeroTrace ? 'bg-emerald-500' : 'bg-white/20'}`}>
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${zeroTrace ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Strict Mode Toggle */}
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleToggle('aha_strict_mode', setIsStrict, isStrict)}>
                        <div className="flex flex-col">
                        <span className="text-white/90 text-xs font-bold flex items-center gap-1.5">
                            <ShieldAlert className={`w-4 h-4 ${isStrict ? 'text-green-500' : 'text-yellow-500'}`} /> Строгий режим
                        </span>
                        <span className="text-white/50 text-[10px] mt-0.5">Блокирует картинки и скрипты</span>
                        </div>
                        <button className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${isStrict ? 'bg-green-500' : 'bg-white/20'}`}>
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isStrict ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Censor Mode Toggle */}
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleToggle('aha_censor_mode', setIsCensored, isCensored)}>
                        <div className="flex flex-col">
                        <span className="text-white/90 text-xs font-bold flex items-center gap-1.5">
                            <Eye className={`w-4 h-4 ${isCensored ? 'text-blue-400' : 'text-gray-400'}`} /> Антимат фильтр
                        </span>
                        <span className="text-white/50 text-[10px] mt-0.5">Цензурирует ненормативную лексику</span>
                        </div>
                        <button className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${isCensored ? 'bg-blue-500' : 'bg-white/20'}`}>
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isCensored ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="h-px bg-white/5 w-full my-2"></div>

                    {/* Panic Button */}
                    <button
                        onClick={handlePanic}
                        disabled={isPanicking}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/30 hover:border-transparent group"
                    >
                        <Siren className={`w-4 h-4 ${isPanicking ? 'animate-spin' : 'group-hover:animate-pulse'}`} />
                        {isPanicking ? 'Маскировка...' : 'Режим маскировки'}
                    </button>
                </div>
              )}

              {activeTab === 'ipv6' && (
                <div className="space-y-3 text-xs text-gray-300">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                    <p className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
                      <Network className="w-4 h-4" /> Vercel Native IPv6 Transfer Guide
                    </p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Чтобы перевести Vercel-проект на IPv6, добавьте AAAA-записи и конфигурацию двойного стека.
                    </p>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-lg border border-white/10 space-y-1.5 font-mono text-[11px]">
                    <div className="text-cyan-400 font-bold">1. DNS AAAA (Cloudflare / Reg.ru):</div>
                    <p className="text-gray-300">Тип: <span className="text-emerald-400 font-bold">AAAA</span></p>
                    <p className="text-gray-300">Имя: <span className="text-emerald-400">@</span> или <span className="text-emerald-400">subdomain</span></p>
                    <p className="text-gray-300">Значение: <span className="text-emerald-300 select-all">2606:4700:3030::6815:102d</span></p>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-lg border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-bold font-mono text-[11px]">2. vercel.json config:</span>
                      <button onClick={copyVercelConfig} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-black rounded text-[10px] font-bold flex items-center gap-1 transition-colors">
                        {copiedVercelConfig ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedVercelConfig ? 'Скопировано!' : 'Копировать'}
                      </button>
                    </div>
                    <pre className="text-[10px] text-gray-400 font-mono bg-black/70 p-2 rounded overflow-x-auto">
{`{
  "version": 2,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-AHA-Protocol-Version", "value": "6.0-HYPER-IPv6" }
      ]
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === 'logs' && (
                  <div className="space-y-3">
                      {logs.length === 0 ? (
                          <div className="text-center py-6 text-white/30 text-xs flex flex-col items-center gap-2 border border-dashed border-white/10 rounded-xl">
                              <ShieldCheck className="w-8 h-8 opacity-50" />
                              Угроз не обнаружено
                          </div>
                      ) : (
                          <div className="space-y-2">
                              {logs.map((log, i) => (
                                  <div key={i} className="bg-black/30 p-2 rounded border border-[#ff4d4d]/20 text-[10px] font-mono text-gray-400 flex items-start gap-2">
                                      <FileWarning className="w-3 h-3 text-[#ff4d4d] shrink-0 mt-0.5" />
                                      {log}
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-white/5 bg-[#0d0b14] flex gap-2 shrink-0">
                <button
                  onClick={clearCacheAndRAM}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-white/5 hover:bg-[#ff4d4d]/20 text-white/60 hover:text-[#ff4d4d] rounded-lg text-[10px] font-medium transition-colors border border-transparent hover:border-[#ff4d4d]/30"
                  title="Очистить память RAM и диск"
                >
                  <Trash2 className="w-3 h-3 text-[#ff4d4d]" />
                  RAM / Disk Purge
                </button>
                <button
                  onClick={handleHide}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-[10px] font-medium transition-colors"
                >
                  <EyeOff className="w-3 h-3" />
                  Скрыть
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-[#15101e]/90 backdrop-blur-xl border px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:scale-105 transition-all outline-none focus:outline-none ${isOpen ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border-green-500/30'}`}
        title="Aha Security: Active Threat Protection"
      >
        <ShieldCheck className="text-green-500 w-4 h-4" />
        <span className="text-green-500 border-l border-green-500/30 pl-2 text-[10px] font-black uppercase tracking-widest">Aha Security</span>
      </button>
    </div>
  );
};

export const AhaSecurityConsole: React.FC<{ lang?: string }> = ({ lang = 'ru' }) => {
  const { logout } = useAuth();
  const [threatsBlocked, setThreatsBlocked] = useState(getThreatsBlockedCount());
  const [isStrict, setIsStrict] = useState(safeStorage.getItem('aha_strict_mode') === 'true');
  const [isCensored, setIsCensored] = useState(safeStorage.getItem('aha_censor_mode') === 'true');
  const [zeroTrace, setZeroTrace] = useState(isZeroTraceActive());
  const [activeTab, setActiveTab] = useState<'status' | 'tools' | 'logs'>('status');
  const [logs, setLogs] = useState<string[]>([]);
  const [isPanicking, setIsPanicking] = useState(false);

  useEffect(() => {
    try {
      setLogs(JSON.parse(safeStorage.getItem('aha_security_logs') || '[]'));
    } catch(e){}

    const handleThreat = () => {
      setThreatsBlocked(getThreatsBlockedCount());
      try {
        setLogs(JSON.parse(safeStorage.getItem('aha_security_logs') || '[]'));
      } catch(e){}
    };
    window.addEventListener('aha_threat_blocked', handleThreat);
    return () => window.removeEventListener('aha_threat_blocked', handleThreat);
  }, []);

  const toggleToggle = (key: string, setter: any, currentState: boolean) => {
    const newVal = !currentState;
    setter(newVal);
    safeStorage.setItem(key, newVal.toString());
    if (key === 'aha_strict_mode' || key === 'aha_censor_mode') {
      window.location.reload(); 
    }
  };

  const clearCache = () => {
    const confirmMsg = lang === 'ru' 
      ? 'Очистить RAM и дисковый кэш?' 
      : 'Clear RAM and disk cache?';
    if (window.confirm(confirmMsg)) {
      safeStorage.wipeAllTraces();
      window.location.reload();
    }
  };

  const handlePanic = async () => {
    const confirmMsg = lang === 'ru'
      ? "Включить режим маскировки? Это скроет текущий интерфейс сайта."
      : "Enable panic mode? This will hide the current interface.";
    if (window.confirm(confirmMsg)) {
      setIsPanicking(true);
      safeStorage.setItem('aha_panic_mode', 'true');
      window.location.href = window.location.origin;
    }
  };

  const loc = (ruStr: string, enStr: string, byStr: string, deStr: string, frStr: string, zhStr: string) => {
    switch (lang) {
      case 'ru': return ruStr;
      case 'by': return byStr;
      case 'de': return deStr;
      case 'fr': return frStr;
      case 'zh': return zhStr;
      default: return enStr;
    }
  };

  return (
    <div className="bg-[#15101e] border border-[#ff4d4d]/30 rounded-3xl overflow-hidden flex flex-col shadow-xl">
      <div className="p-5 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#ff4d4d]/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
            <ShieldCheck className="text-green-500 w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-wider">
              {loc('Панель безопасности AHA', 'AHA Security Panel', 'Панель бяспекі AHA', 'AHA Sicherheitspanel', 'Panneau de sécurité AHA', 'AHA 安全面板')}
            </h3>
            <p className="text-[10px] text-green-400 font-mono tracking-widest uppercase">
              {loc('Активная защита от угроз', 'Active Threat Protection', 'Актыўная абарона ад пагроз', 'Aktiver Bedrohungsschutz', 'Protection active contre les menaces', '主动威胁防护')}
            </p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex bg-[#0d0b14] border-b border-white/5 shrink-0">
          <button onClick={() => setActiveTab('status')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'status' ? 'text-[#ff4d4d] bg-[#ff4d4d]/10 border-b-2 border-[#ff4d4d]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            {loc('Статус', 'Status', 'Статус', 'Status', 'Statut', '状态')}
          </button>
          <button onClick={() => setActiveTab('tools')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'tools' ? 'text-[#ff4d4d] bg-[#ff4d4d]/10 border-b-2 border-[#ff4d4d]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            {loc('Защита', 'Protection', 'Абарона', 'Schutz', 'Protection', '防护')}
          </button>
          <button onClick={() => setActiveTab('logs')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${activeTab === 'logs' ? 'text-[#ff4d4d] bg-[#ff4d4d]/10 border-b-2 border-[#ff4d4d]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            {loc('Логи', 'Logs', 'Логі', 'Protokolle', 'Journaux', '日志')}
          </button>
      </div>

      <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
        {activeTab === 'status' && (
          <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-white/60 text-xs font-medium">
                    {loc('Статус системы:', 'System status:', 'Статус сістэмы:', 'Systemstatus:', 'Statut du système :', '系统状态：')}
                  </span>
                  <span className="text-green-400 font-mono text-xs font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 animate-pulse" /> {loc('АКТИВЕН', 'ACTIVE', 'АКТЫЎНЫ', 'AKTIV', 'ACTIF', '活跃')}
                  </span>
              </div>
          
              <div className="flex items-center justify-between p-3.5 bg-[#ff4d4d]/10 rounded-xl border border-[#ff4d4d]/20">
                  <span className="text-[#ff4d4d] text-xs font-medium">
                    {loc('Заблокировано угроз:', 'Threats blocked:', 'Заблакавана пагроз:', 'Blockierte Bedrohungen:', 'Menaces bloquées :', '已拦截威胁：')}
                  </span>
                  <span className="text-[#ff4d4d] font-black text-xl">{threatsBlocked}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-center items-center gap-1.5 border border-white/5">
                      <Lock className={`w-4 h-4 ${isStrict ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className={isStrict ? 'text-green-400 font-bold' : 'text-gray-500'}>
                        {loc('Строгий режим', 'Strict Mode', 'Строгі рэжым', 'Strikter Modus', 'Mode strict', '严格模式')}
                      </span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-center items-center gap-1.5 border border-white/5">
                      <Eye className={`w-4 h-4 ${isCensored ? 'text-blue-400' : 'text-gray-500'}`} />
                      <span className={isCensored ? 'text-blue-400 font-bold' : 'text-gray-500'}>
                        {loc('Антимат фильтр', 'Profanity Filter', 'Антымат фільтр', 'Schimpfwortfilter', 'Filtre d\'insultes', '亵渎过滤')}
                      </span>
                  </div>
              </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-4">
              {/* Strict Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer" onClick={() => toggleToggle('aha_strict_mode', setIsStrict, isStrict)}>
                  <div className="flex flex-col">
                  <span className="text-white/90 text-xs font-bold flex items-center gap-1.5">
                      <ShieldAlert className={`w-4 h-4 ${isStrict ? 'text-green-500' : 'text-yellow-500'}`} /> {loc('Строгий режим', 'Strict Mode', 'Строгі рэжым', 'Strikter Modus', 'Mode strict', '严格模式')}
                  </span>
                  <span className="text-white/50 text-[10px] mt-0.5">
                    {loc('Блокирует картинки и скрипты', 'Blocks external images and scripts', 'Блакуе малюнкі і скрыпты', 'Blockiert externe Bilder und Skripte', 'Bloque les images et scripts externes', '拦截外部图片与脚本')}
                  </span>
                  </div>
                  <button className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${isStrict ? 'bg-green-500' : 'bg-white/20'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isStrict ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
              </div>

              {/* Censor Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer" onClick={() => toggleToggle('aha_censor_mode', setIsCensored, isCensored)}>
                  <div className="flex flex-col">
                  <span className="text-white/90 text-xs font-bold flex items-center gap-1.5">
                      <Eye className={`w-4 h-4 ${isCensored ? 'text-blue-400' : 'text-gray-400'}`} /> {loc('Антимат фильтр', 'Profanity Filter', 'Антымат фільтр', 'Schimpfwortfilter', 'Filtre d\'insultes', '亵渎过滤')}
                  </span>
                  <span className="text-white/50 text-[10px] mt-0.5">
                    {loc('Цензурирует ненормативную лексику', 'Censors inappropriate language', 'Цэнзуруе ненарматыўную лексіку', 'Zensiert unangebrachte Sprache', 'Censure le langage inapproprié', '过滤不当言论')}
                  </span>
                  </div>
                  <button className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${isCensored ? 'bg-blue-500' : 'bg-white/20'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isCensored ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
              </div>

              <div className="h-px bg-white/5 w-full my-1"></div>

              {/* Panic Button */}
              <button
                  onClick={handlePanic}
                  disabled={isPanicking}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/30 hover:border-transparent group"
              >
                  <Siren className={`w-4 h-4 ${isPanicking ? 'animate-spin' : 'group-hover:animate-pulse'}`} />
                  {isPanicking ? loc('Маскировка...', 'Masking...', 'Маскіроўка...', 'Maskierung...', 'Masquage...', '伪装中...') : loc('Режим маскировки', 'Panic Mode', 'Рэжым маскіроўкі', 'Panikmodus', 'Mode panique', '恐慌模式')}
              </button>
          </div>
        )}

        {activeTab === 'logs' && (
            <div className="space-y-3">
                {logs.length === 0 ? (
                    <div className="text-center py-6 text-white/30 text-xs flex flex-col items-center gap-2 border border-dashed border-white/10 rounded-xl">
                        <ShieldCheck className="w-8 h-8 opacity-50" />
                        {loc('Угроз не обнаружено', 'No threats detected', 'Пагроз не выяўлена', 'Keine Bedrohungen erkannt', 'Aucune menace détectée', '未发现威胁')}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto no-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className="bg-black/30 p-2.5 rounded-lg border border-[#ff4d4d]/10 text-[10px] font-mono text-gray-400 flex items-start gap-2">
                                <FileWarning className="w-3 h-3 text-[#ff4d4d] shrink-0 mt-0.5" />
                                {log}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/5 bg-[#0d0b14] flex gap-3">
          <button
            onClick={clearCache}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/5 hover:bg-[#ff4d4d]/20 text-white/60 hover:text-[#ff4d4d] rounded-xl text-xs font-black uppercase tracking-wider transition-colors border border-transparent hover:border-[#ff4d4d]/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {loc('Очистить логи', 'Clear logs', 'Ачысціць логі', 'Protokolle löschen', 'Effacer les journaux', '清除日志')}
          </button>
      </div>
    </div>
  );
};
