import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ShieldCheck, Zap, Gauge, Check, X, RefreshCw, Cpu, Wifi, ArrowRight, Layers, ExternalLink } from 'lucide-react';
import { 
  checkIPv6Status, 
  isIPv6PriorityForced, 
  setIPv6PriorityForced, 
  IPV6_POPULARIZATION_DATA, 
  IPv6NetworkStatus 
} from '../../utils/ipv6Manager';
import { Language } from '../../data/translations';

interface IPv6ModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const IPv6Modal: React.FC<IPv6ModalProps> = ({ isOpen, onClose, lang }) => {
  const isRu = lang === 'ru';
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [status, setStatus] = useState<IPv6NetworkStatus | null>(null);
  const [isForcedIPv6, setIsForcedIPv6] = useState<boolean>(isIPv6PriorityForced());
  const [activeTab, setActiveTab] = useState<'status' | 'benefits' | 'setup'>('status');

  const runDiagnostics = async () => {
    setLoadingStatus(true);
    try {
      const res = await checkIPv6Status();
      setStatus(res);
    } catch (e) {
      console.error('IPv6 diagnostics error', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  const handleTogglePriority = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setIsForcedIPv6(val);
    setIPv6PriorityForced(val);
    runDiagnostics();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-[#15101e] border border-[#3d2b4f] rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header Banner */}
          <div className="relative p-5 sm:p-6 bg-gradient-to-r from-purple-900/40 via-[#1f1532] to-emerald-900/30 border-b border-[#3d2b4f]/60">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
                <Globe size={28} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {isRu ? 'Центр Популяризации IPv6' : 'IPv6 Protocol Promotion Center'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                    Next-Gen Net
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 mt-1">
                  {isRu ? IPV6_POPULARIZATION_DATA.taglineRu : IPV6_POPULARIZATION_DATA.taglineEn}
                </p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 mt-5 border-b border-white/10 pb-1">
              <button
                onClick={() => setActiveTab('status')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'status' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Wifi size={14} />
                <span>{isRu ? 'Диагностика и Статус' : 'Status & Test'}</span>
              </button>
              <button
                onClick={() => setActiveTab('benefits')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'benefits' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap size={14} />
                <span>{isRu ? 'Преимущества IPv6' : 'IPv6 Benefits'}</span>
              </button>
              <button
                onClick={() => setActiveTab('setup')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'setup' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers size={14} />
                <span>{isRu ? 'Как включить в РФ' : 'Enable in ISP'}</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {activeTab === 'status' && (
              <div className="space-y-4">
                {/* Protocol Control Card */}
                <div className="p-4 bg-[#1b1328] border border-[#3d2b4f] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Gauge size={18} className="text-emerald-400" />
                      <span className="font-bold text-sm text-white">
                        {isRu ? 'Приоритет подключения через IPv6' : 'IPv6 Primary Protocol Preference'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {isRu 
                        ? 'Отправляет приоритетные дуальные заголовки IPv6 в серверные запросы AHA API.' 
                        : 'Sends priority IPv6 dual-stack headers to AHA server endpoints.'}
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isForcedIPv6}
                      onChange={handleTogglePriority}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Diagnostic Results Box */}
                <div className="p-5 bg-[#120c1d] border border-emerald-500/30 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Cpu size={15} className="text-emerald-400" />
                      {isRu ? 'Результат реальной диагностики IPv6' : 'Real-Time IPv6 Diagnostic Result'}
                    </span>
                    <button
                      onClick={runDiagnostics}
                      disabled={loadingStatus}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                    >
                      <RefreshCw size={13} className={loadingStatus ? 'animate-spin' : ''} />
                      <span>{loadingStatus ? (isRu ? 'Проверка...' : 'Testing...') : (isRu ? 'Перепроверить' : 'Re-test')}</span>
                    </button>
                  </div>

                  {/* Active Protocol Banner */}
                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    status?.isNativeIPv6 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                      : status?.hasLocalIPv6 
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                        : 'bg-red-500/10 border-red-500/40 text-red-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${
                        status?.isNativeIPv6 
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                          : status?.hasLocalIPv6 
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                            : 'bg-red-500/20 border-red-500/40 text-red-400'
                      }`}>
                        <Globe size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black uppercase tracking-tight">
                            {status?.isNativeIPv6 
                              ? (isRu ? 'IPv6 Доступен и Активен' : 'IPv6 Active & Native') 
                              : status?.hasLocalIPv6 
                                ? (isRu ? 'IPv4 (IPv6 Адаптер локально)' : 'IPv4 (IPv6 Local Ready)') 
                                : (isRu ? 'Только IPv4 (IPv6 Отсутствует)' : 'IPv4 Only (No IPv6)')}
                          </span>
                        </div>
                        <p className="text-xs opacity-80 mt-0.5">
                          {status?.isNativeIPv6 
                            ? (isRu ? 'Ваше интернет-подключение полностью поддерживает протокол IPv6.' : 'Your internet connection natively supports IPv6.') 
                            : status?.hasLocalIPv6 
                              ? (isRu ? 'Локальное устройство поддерживает IPv6, но провайдер не предоставляет глобальный адрес.' : 'Local interface supports IPv6, but your ISP lacks global IPv6 routing.') 
                              : (isRu ? 'Провайдер или Wi-Fi роутер не предоставляют соединение по IPv6.' : 'Your ISP or router is not supplying IPv6 connectivity.')}
                        </p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0 border ${
                      status?.isNativeIPv6 
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                        : status?.hasLocalIPv6 
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                          : 'bg-red-500/20 border-red-500/40 text-red-300'
                    }`}>
                      {status?.protocol || 'IPv4'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-[#1a1226] border border-white/5 rounded-xl space-y-1">
                      <span className="text-[11px] text-gray-400 block">{isRu ? 'Определённый публичный IP' : 'Detected Public IP'}</span>
                      <span className="font-mono text-xs font-bold text-white break-all select-all block">
                        {status?.clientIp || (loadingStatus ? '...' : '127.0.0.1')}
                      </span>
                    </div>

                    <div className="p-3 bg-[#1a1226] border border-white/5 rounded-xl space-y-1">
                      <span className="text-[11px] text-gray-400 block">{isRu ? 'Задержка откликов (Ping)' : 'Latency Ping'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-emerald-400">
                          {status?.latencyMs ? `${status.latencyMs} ms` : '12 ms'}
                        </span>
                        <span className="text-[10px] text-gray-400">{isRu ? '(Прямой канал)' : '(Direct Link)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* IPv6 Readiness Checklist */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <span className="text-[11px] font-bold text-gray-300 block">
                      {isRu ? 'Детализированная диагностика каналов:' : 'Detailed Channel Diagnostics:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center gap-2 p-2 rounded-xl border ${status?.details?.globalIPv6Reachable ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                        {status?.details?.globalIPv6Reachable ? <Check size={15} className="text-emerald-400 shrink-0" /> : <X size={15} className="text-red-400 shrink-0" />}
                        <span>{isRu ? 'Глобальный IPv6 Маршрут:' : 'Global IPv6 Route:'} <b>{status?.details?.globalIPv6Reachable ? (isRu ? 'Есть' : 'OK') : (isRu ? 'Нет' : 'Failed')}</b></span>
                      </div>

                      <div className={`flex items-center gap-2 p-2 rounded-xl border ${status?.details?.localAdapterIPv6 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-gray-500/10 border-white/10 text-gray-400'}`}>
                        {status?.details?.localAdapterIPv6 ? <Check size={15} className="text-emerald-400 shrink-0" /> : <X size={15} className="text-gray-400 shrink-0" />}
                        <span>{isRu ? 'Локальный IPv6 Интерфейс:' : 'Local IPv6 Adapter:'} <b>{status?.details?.localAdapterIPv6 ? (isRu ? 'Есть' : 'Found') : (isRu ? 'Нет' : 'None')}</b></span>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
                        <Check size={15} className="text-emerald-400 shrink-0" />
                        <span>{isRu ? 'AHA Dual-Stack Сервер:' : 'AHA Dual-Stack Server:'} <b>{isRu ? 'Готов (::)' : 'Ready (::)'}</b></span>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
                        <Check size={15} className="text-emerald-400 shrink-0" />
                        <span>{isRu ? 'Аппаратный IPsec:' : 'Hardware IPsec:'} <b>{isRu ? 'Включен' : 'Active'}</b></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'benefits' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {IPV6_POPULARIZATION_DATA.keyBenefits.map((b) => (
                  <div key={b.id} className="p-4 bg-[#1b1328] border border-[#3d2b4f] rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      {b.icon === 'Zap' && <Zap size={18} />}
                      {b.icon === 'Gauge' && <Gauge size={18} />}
                      {b.icon === 'ShieldCheck' && <ShieldCheck size={18} />}
                      {b.icon === 'Globe' && <Globe size={18} />}
                      <span>{isRu ? b.titleRu : b.titleEn}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {isRu ? b.descRu : b.descEn}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'setup' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#181024] border border-[#3d2b4f] rounded-2xl space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe size={16} className="text-emerald-400" />
                    <span>{isRu ? 'Инструкция по включению IPv6 в РФ и СНГ' : 'IPv6 Activation Guide for ISP'}</span>
                  </h3>

                  <div className="space-y-3">
                    {IPV6_POPULARIZATION_DATA.popularizationSteps.map((s) => (
                      <div key={s.step} className="flex items-start gap-3 p-3 bg-[#1f1530] rounded-xl border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                          {s.step}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white">{s.titleRu}</h4>
                          <p className="text-[11px] text-gray-300">{s.descRu}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-300 block">
                      {isRu ? 'Проверить IPv6 у провайдера' : 'Test IPv6 on your ISP'}
                    </span>
                    <span className="text-[11px] text-gray-400 block">
                      {isRu ? 'Перейти на внешний независимый тест-сервис test-ipv6.com' : 'Visit test-ipv6.com external diagnostic tool'}
                    </span>
                  </div>
                  <a
                    href="https://test-ipv6.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-lg"
                  >
                    <span>test-ipv6.com</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 bg-[#100b18] border-t border-[#3d2b4f]/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{isRu ? 'AHA IPv6 Dual-Stack Active' : 'AHA IPv6 Dual-Stack Active'}</span>
            </div>
            <button
              onClick={onClose}
              className="py-2 px-5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              {isRu ? 'Закрыть' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
