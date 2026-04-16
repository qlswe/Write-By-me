import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { ShieldCheck, X, Activity, EyeOff, Lock, ShieldAlert, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global threat counter
let globalThreatsBlocked = parseInt(localStorage.getItem('aha_threats_blocked') || '0', 10);

// 1. Core Sanitizer
export const sanitizeContent = (dirty: string) => {
  const isStrict = localStorage.getItem('aha_strict_mode') === 'true';
  
  // In strict mode, we strip out images, links, and code blocks to prevent ANY media/external links
  const allowedTags = isStrict 
    ? ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span', 'div'] 
    : ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img', 'span', 'div'];

  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'className'],
  });

  // Count removed items (DOMPurify.removed is an array of removed elements/attributes)
  if (DOMPurify.removed && DOMPurify.removed.length > 0) {
    globalThreatsBlocked += DOMPurify.removed.length;
    localStorage.setItem('aha_threats_blocked', globalThreatsBlocked.toString());
    window.dispatchEvent(new CustomEvent('aha_threat_blocked'));
  }

  return clean;
};

// 2. Safe HTML Component
export const SafeHtml: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  const cleanHtml = sanitizeContent(html);
  return <div className={className} dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
};

// 3. Visual Badge & Control Panel
export const AhaSecurityBadge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [threatsBlocked, setThreatsBlocked] = useState(globalThreatsBlocked);
  const [isStrict, setIsStrict] = useState(localStorage.getItem('aha_strict_mode') === 'true');

  useEffect(() => {
    const hiddenState = localStorage.getItem('aha_security_hidden');
    if (hiddenState === 'true') {
      setIsHidden(true);
    }

    const handleThreat = () => setThreatsBlocked(globalThreatsBlocked);
    window.addEventListener('aha_threat_blocked', handleThreat);
    return () => window.removeEventListener('aha_threat_blocked', handleThreat);
  }, []);

  const handleHide = () => {
    setIsHidden(true);
    setIsOpen(false);
    localStorage.setItem('aha_security_hidden', 'true');
  };

  const toggleStrictMode = () => {
    const newVal = !isStrict;
    setIsStrict(newVal);
    localStorage.setItem('aha_strict_mode', newVal.toString());
    window.location.reload(); // Reload to apply changes to all rendered content
  };

  const clearCache = () => {
    if (window.confirm('Очистить локальный кэш и перезагрузить приложение? Это может решить проблемы с загрузкой.')) {
      localStorage.removeItem('aha_threats_blocked');
      localStorage.removeItem('aha_strict_mode');
      // We don't clear everything to avoid logging the user out, just app-specific cache
      window.location.reload();
    }
  };

  if (isHidden) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-4 w-80 bg-[#15101e]/95 backdrop-blur-xl border border-[#ff4d4d]/30 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#ff4d4d]/10 to-transparent">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-green-500 w-5 h-5" />
                <h3 className="text-white font-bold text-sm">Панель безопасности Aha</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Статус системы:</span>
                <span className="text-green-400 font-mono font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" /> АКТИВЕН
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Заблокировано угроз:</span>
                <span className="text-[#ff4d4d] font-mono font-bold">{threatsBlocked}</span>
              </div>

              <div className="h-px bg-white/5 w-full my-2"></div>

              {/* Strict Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-white/90 text-xs font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-yellow-500" /> Строгий режим
                  </span>
                  <span className="text-white/50 text-[10px]">Блокирует все картинки и ссылки</span>
                </div>
                <button 
                  onClick={toggleStrictMode}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isStrict ? 'bg-green-500' : 'bg-white/20'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isStrict ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Clear Cache Button */}
              <button
                onClick={clearCache}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-[#ff4d4d]/20 text-white/80 hover:text-[#ff4d4d] rounded-lg text-xs font-medium transition-colors border border-transparent hover:border-[#ff4d4d]/30"
              >
                <Trash2 className="w-3 h-3" />
                Очистить кэш приложения
              </button>

              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={handleHide}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <EyeOff className="w-3 h-3" />
                  Скрыть панель навсегда
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-[#15101e]/80 backdrop-blur-md border px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:scale-105 transition-all ${isOpen ? 'border-green-500' : 'border-green-500/30'}`}
        title="Aha Security: Active Threat Protection"
      >
        <ShieldCheck className="text-green-500 w-4 h-4" />
        <span className="text-green-500/90 text-[10px] font-black uppercase tracking-widest">Aha Security</span>
      </button>
    </div>
  );
};
