import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import { ShieldCheck, X, Activity, EyeOff, Lock, ShieldAlert, Trash2, Siren, Ghost, FileText, FileWarning, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

// Global threat counter
let globalThreatsBlocked = parseInt(localStorage.getItem('aha_threats_blocked') || '0', 10);

// 1. Core Sanitizer
export const sanitizeContent = (dirty: string) => {
  const isStrict = localStorage.getItem('aha_strict_mode') === 'true';
  const isCensored = localStorage.getItem('aha_censor_mode') === 'true';
  
  // Basic bad word filter
  let text = dirty;
  if (isCensored) {
    const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'dick', 'cunt'];
    const rx = new RegExp(badWords.join('|'), 'gi');
    text = text.replace(rx, '***');
  }

  // In strict mode, we strip out images, links, and code blocks to prevent ANY media/external links
  const allowedTags = isStrict 
    ? ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span', 'div'] 
    : ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img', 'span', 'div'];

  const clean = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'className'],
  });

  // Count removed items (DOMPurify.removed is an array of removed elements/attributes)
  if (DOMPurify.removed && DOMPurify.removed.length > 0) {
    globalThreatsBlocked += DOMPurify.removed.length;
    localStorage.setItem('aha_threats_blocked', globalThreatsBlocked.toString());
    
    try {
      const currentLogs = JSON.parse(localStorage.getItem('aha_security_logs') || '[]');
      const newLog = `[${new Date().toLocaleTimeString()}] Blocked ${DOMPurify.removed.length} suspicious elements (XSS/Strict)`;
      const newLogs = [newLog, ...currentLogs].slice(0, 20);
      localStorage.setItem('aha_security_logs', JSON.stringify(newLogs));
    } catch(e) {}

    window.dispatchEvent(new CustomEvent('aha_threat_blocked'));
  }

  return clean;
};

// 2. Safe HTML Component
export const SafeHtml: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);
  const cleanHtml = sanitizeContent(html);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'IMG') {
      e.preventDefault();
      e.stopPropagation();
      setFullscreenImg((e.target as HTMLImageElement).src);
    }
  };

  return (
    <>
      <div className={className} dangerouslySetInnerHTML={{ __html: cleanHtml }} onClick={handleClick} />
      
      {/* Fullscreen Image Modal for SafeHtml */}
      {typeof document !== 'undefined' && document.body && createPortal(
        <AnimatePresence>
          {fullscreenImg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-4 relative"
              onClick={(e) => { e.stopPropagation(); setFullscreenImg(null); }}
            >
              <button className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors z-[100000]">
                <X size={24} />
              </button>
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={fullscreenImg}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl z-[100000]"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

// 3. Visual Badge & Control Panel
export const AhaSecurityBadge: React.FC = () => {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [globalHidden, setGlobalHidden] = useState(false);
  const [threatsBlocked, setThreatsBlocked] = useState(globalThreatsBlocked);
  const [isStrict, setIsStrict] = useState(localStorage.getItem('aha_strict_mode') === 'true');
  const [isCensored, setIsCensored] = useState(localStorage.getItem('aha_censor_mode') === 'true');
  const [isStealth, setIsStealth] = useState(localStorage.getItem('aha_stealth_mode') === 'true');
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'tools'>('status');
  const [logs, setLogs] = useState<string[]>([]);
  const [isPanicking, setIsPanicking] = useState(false);

  useEffect(() => {
    const hiddenState = localStorage.getItem('aha_security_hidden');
    if (hiddenState === 'true') {
      setIsHidden(true);
    }
    
    try {
      setLogs(JSON.parse(localStorage.getItem('aha_security_logs') || '[]'));
    } catch(e){}

    const handleThreat = () => {
        setThreatsBlocked(globalThreatsBlocked);
        try {
            setLogs(JSON.parse(localStorage.getItem('aha_security_logs') || '[]'));
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
    localStorage.setItem('aha_security_hidden', 'true');
  };

  const toggleToggle = (key: string, setter: any, currentState: boolean) => {
    const newVal = !currentState;
    setter(newVal);
    localStorage.setItem(key, newVal.toString());
    if (key === 'aha_strict_mode' || key === 'aha_censor_mode') {
      window.location.reload(); 
    }
  };

  const clearCache = () => {
    if (window.confirm('Очистить локальный кэш и логи безопасности?')) {
      localStorage.removeItem('aha_threats_blocked');
      localStorage.removeItem('aha_strict_mode');
      localStorage.removeItem('aha_censor_mode');
      localStorage.removeItem('aha_stealth_mode');
      localStorage.removeItem('aha_security_logs');
      window.location.reload();
    }
  };

  const handlePanic = async () => {
    if (window.confirm("АКТИВИРОВАТЬ ПРОТОКОЛ ПАНИКИ? Это приведет к немедленному выходу из системы и очистке данных сессии.")) {
        setIsPanicking(true);
        localStorage.clear();
        sessionStorage.clear();
        await logout();
        window.location.href = 'https://google.com';
    }
  };

  if (isHidden || globalHidden) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-4 w-80 bg-[#15101e]/98 backdrop-blur-xl border border-[#ff4d4d]/30 rounded-xl shadow-[0_10px_40px_-10px_rgba(255,77,77,0.3)] overflow-hidden flex flex-col max-h-[400px]"
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#ff4d4d]/10 to-transparent shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-green-500 w-5 h-5" />
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Aha Security</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-[#ff4d4d] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-[#0d0b14] border-b border-white/5 shrink-0">
                <button onClick={() => setActiveTab('status')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'status' ? 'text-[#ff4d4d] bg-[#ff4d4d]/10 border-b-2 border-[#ff4d4d]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>Статус</button>
                <button onClick={() => setActiveTab('tools')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'tools' ? 'text-[#ff4d4d] bg-[#ff4d4d]/10 border-b-2 border-[#ff4d4d]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>Защита</button>
                <button onClick={() => setActiveTab('logs')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'logs' ? 'text-[#ff4d4d] bg-[#ff4d4d]/10 border-b-2 border-[#ff4d4d]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>Логи</button>
            </div>

            <div className="overflow-y-auto hidden-scrollbar flex-1 p-4">
              {activeTab === 'status' && (
                <div className="space-y-5">
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

                    <div className="grid grid-cols-2 gap-2 mt-2 text-center text-xs">
                        <div className="bg-white/5 rounded-lg p-2 flex flex-col justify-center items-center gap-1">
                            <Lock className={`w-4 h-4 ${isStrict ? 'text-green-400' : 'text-gray-500'}`} />
                            <span className={isStrict ? 'text-green-400' : 'text-gray-500'}>Строгий</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 flex flex-col justify-center items-center gap-1">
                            <Ghost className={`w-4 h-4 ${isStealth ? 'text-purple-400' : 'text-gray-500'}`} />
                            <span className={isStealth ? 'text-purple-400' : 'text-gray-500'}>Стелс</span>
                        </div>
                    </div>
                </div>
              )}

              {activeTab === 'tools' && (
                <div className="space-y-4">
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

                    {/* Stealth Mode Toggle */}
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => toggleToggle('aha_stealth_mode', setIsStealth, isStealth)}>
                        <div className="flex flex-col">
                        <span className="text-white/90 text-xs font-bold flex items-center gap-1.5">
                            <Ghost className={`w-4 h-4 ${isStealth ? 'text-purple-500' : 'text-gray-400'}`} /> Стелс-режим (VPN)
                        </span>
                        <span className="text-white/50 text-[10px] mt-0.5">Маскировка IP и скрытие Origin</span>
                        </div>
                        <button className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${isStealth ? 'bg-purple-500' : 'bg-white/20'}`}>
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isStealth ? 'translate-x-5' : 'translate-x-1'}`} />
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
                        {isPanicking ? 'Уничтожение...' : 'Протокол Паники'}
                    </button>
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
                  onClick={clearCache}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-white/5 hover:bg-[#ff4d4d]/20 text-white/60 hover:text-[#ff4d4d] rounded-lg text-[10px] font-medium transition-colors border border-transparent hover:border-[#ff4d4d]/30"
                >
                  <Trash2 className="w-3 h-3" />
                  Кэш
                </button>
                <button
                  onClick={handleHide}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-[10px] font-medium transition-colors"
                >
                  <EyeOff className="w-3 h-3" />
                  Скрыть виджет
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
