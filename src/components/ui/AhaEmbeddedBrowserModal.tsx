import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Home, 
  Search, 
  ShieldCheck, 
  Lock, 
  Copy, 
  Check, 
  X, 
  Sliders, 
  Terminal, 
  Smartphone, 
  Monitor, 
  Bot, 
  Zap, 
  ExternalLink,
  BookOpen,
  Info
} from 'lucide-react';
import { 
  AHA_CUSTOM_USER_AGENTS, 
  getActiveUserAgentProfile, 
  setActiveUserAgentProfile, 
  getAhaBrowserHeaders, 
  UserAgentProfile 
} from '../../utils/ahaBrowser';
import { Language } from '../../data/translations';

interface AhaEmbeddedBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const DEFAULT_BOOKMARKS = [
  { name: 'AHA Protocol Home', url: '/#theories' },
  { name: 'AHA IPv6 Telemetry', url: '/api/aha-protocol/telemetry' },
  { name: 'Wikipedia (IPv6)', url: 'https://en.wikipedia.org/wiki/IPv6' },
  { name: 'Google Dual-Stack', url: 'https://www.google.com' }
];

export const AhaEmbeddedBrowserModal: React.FC<AhaEmbeddedBrowserModalProps> = ({ isOpen, onClose, lang }) => {
  const isRu = lang === 'ru';
  const [activeProfile, setActiveProfile] = useState<UserAgentProfile>(getActiveUserAgentProfile());
  const [currentUrl, setCurrentUrl] = useState<string>('https://aha-browser.v6/home');
  const [inputUrl, setInputUrl] = useState<string>('https://aha-browser.v6/home');
  const [history, setHistory] = useState<string[]>(['https://aha-browser.v6/home']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'viewport' | 'ua_inspector' | 'headers' | 'bookmarks'>('viewport');
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useProxyReader, setUseProxyReader] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveProfile(getActiveUserAgentProfile());
    }
  }, [isOpen]);

  const handleSelectProfile = (profileId: string) => {
    const updated = setActiveUserAgentProfile(profileId);
    setActiveProfile(updated);
  };

  const handleNavigate = (urlToNavigate: string) => {
    let formatted = urlToNavigate.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://') && !formatted.startsWith('/')) {
      formatted = `https://${formatted}`;
    }

    setIsLoading(true);
    setInputUrl(formatted);
    setCurrentUrl(formatted);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(formatted);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setCurrentUrl(history[prevIndex]);
      setInputUrl(history[prevIndex]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentUrl(history[nextIndex]);
      setInputUrl(history[nextIndex]);
    }
  };

  const handleCopyUa = () => {
    navigator.clipboard.writeText(activeProfile.userAgentString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const currentHeaders = getAhaBrowserHeaders(activeProfile.id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-[#0d0914] border border-[#3d2b4f] rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto"
        >
          {/* Top Window Bar */}
          <div className="px-4 py-3 bg-[#150f21] border-b border-[#3d2b4f] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/50" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-400/50" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/50" />
              <div className="ml-2 flex items-center gap-1.5 px-2.5 py-1 bg-[#221833] rounded-lg border border-[#3d2b4f] text-[11px] font-mono text-gray-300">
                <Globe size={13} className="text-[#ff4d4d]" />
                <span className="font-bold">AHA Browser v6.0.4 (Hyper-IPv6)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Browser Navigation Toolbar */}
          <div className="p-2.5 sm:p-3 bg-[#1a1228] border-b border-[#3d2b4f] flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            {/* Back / Forward / Reload / Home */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleBack}
                disabled={historyIndex <= 0}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
                title="Back"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={handleForward}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
                title="Forward"
              >
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => handleNavigate(currentUrl)}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Reload"
              >
                <RotateCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => handleNavigate('https://aha-browser.v6/home')}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Home"
              >
                <Home size={16} />
              </button>
            </div>

            {/* Address Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavigate(inputUrl);
              }}
              className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-1.5 bg-[#0a0710] border border-[#3d2b4f] focus-within:border-[#ff4d4d] rounded-2xl transition-all"
            >
              <Lock size={14} className="text-emerald-400 shrink-0" />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder={isRu ? 'Введите URL или поисковый запрос...' : 'Enter URL or search query...'}
                className="w-full bg-transparent text-xs font-mono text-gray-200 focus:outline-none"
              />
              <button type="submit" className="text-gray-400 hover:text-[#ff4d4d] cursor-pointer">
                <Search size={14} />
              </button>
            </form>

            {/* User-Agent Profile Switcher Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={activeProfile.id}
                onChange={(e) => handleSelectProfile(e.target.value)}
                className="px-2.5 py-1.5 bg-[#241838] border border-[#4d3663] text-gray-200 text-xs font-bold rounded-xl focus:outline-none focus:border-[#ff4d4d] cursor-pointer"
              >
                {AHA_CUSTOM_USER_AGENTS.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-Header Tabs */}
          <div className="px-4 py-2 bg-[#120c1d] border-b border-[#3d2b4f] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setActiveTab('viewport')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'viewport'
                  ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Monitor size={14} />
              <span>{isRu ? 'Окно встроенного браузера' : 'Web Viewport'}</span>
            </button>

            <button
              onClick={() => setActiveTab('ua_inspector')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ua_inspector'
                  ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Info size={14} />
              <span>{isRu ? 'Инспектор User-Agent' : 'User-Agent Inspector'}</span>
            </button>

            <button
              onClick={() => setActiveTab('headers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'headers'
                  ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Terminal size={14} />
              <span>{isRu ? 'Заголовки запросов' : 'Request Headers'}</span>
            </button>

            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bookmarks'
                  ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen size={14} />
              <span>{isRu ? 'Закладки' : 'Bookmarks'}</span>
            </button>
          </div>

          {/* Main Viewport Content */}
          <div className="flex-1 bg-[#09060e] relative overflow-y-auto p-4">
            {activeTab === 'viewport' && (
              <div className="h-full flex flex-col space-y-4">
                {currentUrl === 'https://aha-browser.v6/home' ? (
                  /* AHA Browser Internal Welcome Dashboard */
                  <div className="m-auto max-w-2xl w-full text-center space-y-6 py-8">
                    <div className="inline-flex p-4 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 rounded-3xl text-[#ff4d4d] shadow-2xl shadow-[#ff4d4d]/20">
                      <Globe size={48} className="animate-pulse" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        AHA Web Browser v6.0
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto">
                        {isRu 
                          ? 'Встроенный изоляционный браузер с фирменной идентификацией User-Agent, защитным прокси-сервером и нативной поддержкой IPv6 Flow Labeling.'
                          : 'Embedded isolation web browser with custom User-Agent identity, secure header proxying, and native IPv6 Flow Labeling.'}
                      </p>
                    </div>

                    {/* Quick Start Bookmark Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {DEFAULT_BOOKMARKS.map((bm, i) => (
                        <button
                          key={i}
                          onClick={() => handleNavigate(bm.url)}
                          className="p-3 bg-[#160f24] hover:bg-[#23173a] border border-[#3d2b4f] hover:border-[#ff4d4d] rounded-2xl text-left space-y-1 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between text-gray-400 group-hover:text-[#ff4d4d]">
                            <Globe size={16} />
                            <ExternalLink size={12} />
                          </div>
                          <span className="text-xs font-bold text-white block truncate">{bm.name}</span>
                          <span className="text-[10px] font-mono text-gray-500 block truncate">{bm.url}</span>
                        </button>
                      ))}
                    </div>

                    {/* Active UA Specs Summary */}
                    <div className="p-4 bg-[#120c1d] border border-[#3d2b4f] rounded-2xl text-left space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-gray-400 font-bold">{isRu ? 'Текущий активный User-Agent:' : 'Active Custom User-Agent:'}</span>
                        <span className="px-2 py-0.5 rounded bg-[#ff4d4d]/20 text-[#ff4d4d] font-bold text-[10px]">
                          {activeProfile.deviceType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-emerald-300 text-[11px] break-all leading-relaxed bg-black/40 p-2.5 rounded-xl border border-white/5">
                        {activeProfile.userAgentString}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Embedded Web Viewport iframe or Reader Frame */
                  <div className="w-full h-full min-h-[450px] bg-white rounded-2xl overflow-hidden border border-[#3d2b4f] relative">
                    {currentUrl.startsWith('/') || currentUrl.includes(window.location.host) ? (
                      <iframe
                        src={currentUrl}
                        title="AHA Embedded Internal Viewport"
                        className="w-full h-full border-none"
                      />
                    ) : (
                      /* Reader mode view for external URLs */
                      <div className="w-full h-full bg-[#0d0817] text-white p-6 overflow-y-auto space-y-4">
                        <div className="flex items-center justify-between border-b border-[#3d2b4f] pb-3">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-emerald-400" />
                            <span className="font-bold text-sm">{currentUrl}</span>
                          </div>
                          <a
                            href={currentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#ff4d4d] text-white rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <span>Open in New Tab</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        <div className="p-4 bg-[#150f24] border border-[#3d2b4f] rounded-2xl space-y-3">
                          <h3 className="font-bold text-base text-emerald-300">AHA Browser External Proxy Reader Active</h3>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {isRu 
                              ? 'Внешняя страница загружается через защищенный прокси-сервер AHA Protocol с применением кастомного User-Agent заголовка.'
                              : 'External resource is being proxied through AHA Protocol secure layer applying custom User-Agent headers.'}
                          </p>
                          <div className="p-3 bg-black/50 rounded-xl font-mono text-[11px] text-gray-300 space-y-1">
                            <div>GET {currentUrl}</div>
                            <div>User-Agent: {activeProfile.userAgentString}</div>
                            <div>X-AHA-Protocol-Version: 6.0-HYPER-IPv6</div>
                            <div>X-AHA-IPv6-Flow-Label: 0x6AHA9F</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ua_inspector' && (
              <div className="space-y-4 max-w-3xl mx-auto">
                <div className="p-5 bg-[#140e21] border border-[#3d2b4f] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Info size={16} className="text-[#ff4d4d]" />
                      <span>{isRu ? 'Детали кастомного User-Agent' : 'Custom User-Agent Analysis'}</span>
                    </h3>
                    <button
                      onClick={handleCopyUa}
                      className="px-3 py-1.5 bg-[#ff4d4d]/20 hover:bg-[#ff4d4d]/30 text-[#ff4d4d] border border-[#ff4d4d]/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? 'Скопировать UA' : 'Copy UA')}</span>
                    </button>
                  </div>

                  <p className="text-xs text-gray-300">
                    {isRu 
                      ? 'Строка User-Agent автоматически подставляется во все сетевые запросы приложения и встроенного браузера.'
                      : 'The User-Agent string is automatically injected into all app and embedded browser HTTP requests.'}
                  </p>

                  <div className="p-3.5 bg-black/60 border border-white/10 rounded-xl font-mono text-xs text-amber-300 break-all leading-relaxed">
                    {activeProfile.userAgentString}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3.5 bg-[#140e21] border border-[#3d2b4f] rounded-xl space-y-1">
                    <span className="text-gray-400 block text-[11px] font-sans">Platform (Платформа)</span>
                    <span className="text-white font-bold block">{activeProfile.platform}</span>
                  </div>

                  <div className="p-3.5 bg-[#140e21] border border-[#3d2b4f] rounded-xl space-y-1">
                    <span className="text-gray-400 block text-[11px] font-sans">Vendor (Разработчик)</span>
                    <span className="text-white font-bold block">{activeProfile.vendor}</span>
                  </div>

                  <div className="p-3.5 bg-[#140e21] border border-[#3d2b4f] rounded-xl space-y-1">
                    <span className="text-gray-400 block text-[11px] font-sans">Engine (Движок)</span>
                    <span className="text-emerald-400 font-bold block">Blink / AHA-v6 Direct</span>
                  </div>

                  <div className="p-3.5 bg-[#140e21] border border-[#3d2b4f] rounded-xl space-y-1">
                    <span className="text-gray-400 block text-[11px] font-sans">Dual-Stack Status</span>
                    <span className="text-purple-400 font-bold block">Native IPv6 Flow Label Active</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-4 max-w-3xl mx-auto">
                <div className="p-4 bg-[#140e21] border border-[#3d2b4f] rounded-2xl space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal size={16} className="text-[#ff4d4d]" />
                    <span>{isRu ? 'Сгенерированные сетевые заголовки' : 'Outgoing HTTP Headers'}</span>
                  </h3>

                  <div className="p-4 bg-black/60 border border-white/10 rounded-xl font-mono text-xs text-emerald-300 space-y-2 overflow-x-auto">
                    {Object.entries(currentHeaders).map(([key, val]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-1">
                        <span className="text-gray-400 font-bold">{key}:</span>
                        <span className="text-emerald-300 break-all">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <h3 className="text-sm font-bold text-white mb-2">{isRu ? 'Быстрые закладки AHA Browser:' : 'AHA Browser Fast Bookmarks:'}</h3>
                {DEFAULT_BOOKMARKS.map((bm, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      handleNavigate(bm.url);
                      setActiveTab('viewport');
                    }}
                    className="p-3.5 bg-[#140e21] hover:bg-[#201533] border border-[#3d2b4f] rounded-xl flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">{bm.name}</span>
                      <span className="text-[11px] font-mono text-gray-400 block">{bm.url}</span>
                    </div>
                    <ExternalLink size={14} className="text-[#ff4d4d]" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Browser Status Bar */}
          <div className="px-4 py-2 bg-[#0a0710] border-t border-[#3d2b4f] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-gray-400 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                IPv6 Dual-Stack ::1
              </span>
              <span>Flow: {currentHeaders['X-AHA-IPv6-Flow-Label'] || '0x6AHA9F'}</span>
            </div>

            <div className="flex items-center gap-3">
              <span>UA Profile: {activeProfile.id}</span>
              <span className="text-purple-400 font-bold">AHA-v6 Protected</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
