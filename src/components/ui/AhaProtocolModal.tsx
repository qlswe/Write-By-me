import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Cpu, 
  Activity, 
  Globe, 
  ShieldCheck, 
  RefreshCw, 
  X, 
  Sliders, 
  CheckCircle2, 
  Layers, 
  BarChart3, 
  Radio, 
  Share2, 
  Terminal,
  Send
} from 'lucide-react';
import { 
  performAhaHandshake, 
  getAhaTelemetry, 
  AhaHandshakeResult, 
  AhaTelemetryData, 
  AHA_PROTOCOL_CONCEPT 
} from '../../utils/ahaProtocol';
import { Language } from '../../data/translations';
import { ModalPortal } from './ModalPortal';

interface AhaProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const AhaProtocolModal: React.FC<AhaProtocolModalProps> = ({ isOpen, onClose, lang }) => {
  const isRu = lang === 'ru';
  const [activeTab, setActiveTab] = useState<'monitor' | 'handshake' | 'concept'>('monitor');
  const [loading, setLoading] = useState(false);
  const [telemetry, setTelemetry] = useState<AhaTelemetryData | null>(null);
  const [handshake, setHandshake] = useState<AhaHandshakeResult | null>(null);
  const [customMtu, setCustomMtu] = useState<number>(1500);
  const [testLog, setTestLog] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tele, hand] = await Promise.all([
        getAhaTelemetry(),
        performAhaHandshake(customMtu)
      ]);
      setTelemetry(tele);
      setHandshake(hand);
      addLog(`[AHA-v6] Handshake OK. Flow Label: ${hand.activeIPv6FlowLabel}, MTU: ${hand.negotiatedMTU}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addLog = (msg: string) => {
    setTestLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleRunHandshake = async () => {
    setLoading(true);
    addLog(`[AHA-v6] Triggering manual protocol handshake with MTU=${customMtu}...`);
    try {
      const res = await performAhaHandshake(customMtu);
      setHandshake(res);
      addLog(`[AHA-v6] Handshake verified! Active IPv6 Flow: ${res.activeIPv6FlowLabel}, Compression: ${res.compressionRatio}`);
    } catch (e) {
      addLog(`[AHA-v6] Handshake error: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <AnimatePresence>
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-3xl bg-[#120d1a] border border-[#3d2b4f] rounded-3xl shadow-2xl overflow-hidden my-auto"
          >
          {/* Header */}
          <div className="relative p-5 sm:p-6 bg-gradient-to-r from-red-950/40 via-[#1f132e] to-purple-950/30 border-b border-[#3d2b4f]">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-[#ff4d4d]/20 border border-[#ff4d4d]/40 rounded-2xl text-[#ff4d4d] shadow-lg shadow-[#ff4d4d]/10">
                <Zap size={28} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {AHA_PROTOCOL_CONCEPT.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40 tracking-wider uppercase">
                    v6.0 HYPER
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 mt-1">
                  {isRu ? 'Адаптивный протокол гигабитной маршрутизации IPv6 без NAT' : 'Adaptive IPv6 Zero-NAT Gigabit Transport Protocol'}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-5 border-b border-white/10 pb-1 overflow-x-auto no-scrollbar whitespace-nowrap">
              <button
                onClick={() => setActiveTab('monitor')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'monitor'
                    ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 size={15} />
                <span>{isRu ? 'Мониторинг сети' : 'Network Telemetry'}</span>
              </button>
              <button
                onClick={() => setActiveTab('handshake')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'handshake'
                    ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders size={15} />
                <span>{isRu ? 'Handshake & MTU' : 'Handshake & MTU'}</span>
              </button>
              <button
                onClick={() => setActiveTab('concept')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'concept'
                    ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers size={15} />
                <span>{isRu ? 'Концепция и Архитектура' : 'Concept & Architecture'}</span>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-5 max-h-[68vh] overflow-y-auto">
            {activeTab === 'monitor' && (
              <div className="space-y-4">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-[#1a1226] border border-[#3d2b4f] rounded-2xl space-y-1">
                    <span className="text-[11px] text-gray-400 block font-medium">{isRu ? 'Flow Label IPv6' : 'Active Flow Label'}</span>
                    <span className="font-mono text-sm font-black text-amber-400 truncate block">
                      {handshake?.activeIPv6FlowLabel || '0x6AHA9F'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#1a1226] border border-[#3d2b4f] rounded-2xl space-y-1">
                    <span className="text-[11px] text-gray-400 block font-medium">{isRu ? 'Эффективность NAT Bypass' : 'NAT Bypass Ratio'}</span>
                    <span className="text-sm font-black text-emerald-400 block">
                      {telemetry?.natBypassEfficiencyPct || 99.8}%
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#1a1226] border border-[#3d2b4f] rounded-2xl space-y-1">
                    <span className="text-[11px] text-gray-400 block font-medium">{isRu ? 'Снижение задержки' : 'Ping Reduction'}</span>
                    <span className="text-sm font-black text-cyan-400 block">
                      -{telemetry?.averagePingReductionPct || 28.5}%
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#1a1226] border border-[#3d2b4f] rounded-2xl space-y-1">
                    <span className="text-[11px] text-gray-400 block font-medium">{isRu ? 'Ускорение потока' : 'Speed Multiplier'}</span>
                    <span className="text-sm font-black text-purple-400 block">
                      {telemetry?.bandwidthBoostMultiplier || '2.4x'}
                    </span>
                  </div>
                </div>

                {/* Live Protocol Inspector Console */}
                <div className="p-4 bg-[#0a0710] border border-[#3d2b4f] rounded-2xl space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400 font-sans font-bold flex items-center gap-2">
                      <Terminal size={14} className="text-[#ff4d4d]" />
                      {isRu ? 'Лог реального времени AHA Protocol v6' : 'Real-time AHA Protocol v6 Log'}
                    </span>
                    <button
                      onClick={loadData}
                      disabled={loading}
                      className="text-[11px] text-[#ff4d4d] hover:text-[#ff6666] font-sans font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                      <span>{isRu ? 'Обновить телеметрию' : 'Refresh Telemetry'}</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-gray-300 max-h-40 overflow-y-auto pr-1">
                    {testLog.length === 0 ? (
                      <p className="text-gray-500 italic">[AHA-v6] Monitoring initialized. Awaiting packet stream...</p>
                    ) : (
                      testLog.map((log, idx) => (
                        <p key={idx} className="leading-relaxed text-[11px] text-emerald-300/90 border-b border-white/5 pb-0.5">
                          {log}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                {/* Active Protocol Features */}
                <div className="p-4 bg-[#181024] border border-[#3d2b4f] rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    {isRu ? 'Активные аппаратные модули AHA Protocol v6:' : 'Active AHA Protocol v6 Hardware Features:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(handshake?.features || [
                      'AHA-IPv6-Flow-Labeling',
                      'Zero-NAT-Bypass',
                      'Dual-Stack-Resilience',
                      'Stream-Header-Compression',
                      'Hardware-IPsec-Acceleration'
                    ]).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-200 p-2 bg-[#1f1530] rounded-xl border border-white/5">
                        <CheckCircle2 size={14} className="text-[#ff4d4d] shrink-0" />
                        <span className="font-mono text-[11px]">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'handshake' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#181024] border border-[#3d2b4f] rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders size={16} className="text-[#ff4d4d]" />
                      <span>{isRu ? 'Настройка кастомного MTU кадра' : 'Configure Custom Frame MTU'}</span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      {isRu 
                        ? 'Адаптивный Jumbo MTU повышает пропускную способность для передачи тяжелых данных и аудио потоков.' 
                        : 'Adaptive Jumbo MTU increases frame throughput for high-bandwidth AI payloads.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[1500, 4096, 9000].map((mtuVal) => (
                      <button
                        key={mtuVal}
                        onClick={() => setCustomMtu(mtuVal)}
                        className={`py-2.5 px-3 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                          customMtu === mtuVal
                            ? 'bg-[#ff4d4d]/20 border-[#ff4d4d] text-white'
                            : 'bg-[#120d1a] border-[#3d2b4f] text-gray-400 hover:text-white'
                        }`}
                      >
                        {mtuVal} B {mtuVal === 9000 ? '(Jumbo)' : mtuVal === 4096 ? '(Medium)' : '(Standard)'}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleRunHandshake}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-[#ff4d4d] to-purple-600 hover:from-[#ff6666] hover:to-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-[#ff4d4d]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send size={15} />
                    <span>{isRu ? 'Выполнить повторный Handshake (AHA-v6)' : 'Execute AHA-v6 Protocol Handshake'}</span>
                  </button>
                </div>

                {/* Handshake Result View */}
                {handshake && (
                  <div className="p-4 bg-[#120c1d] border border-emerald-500/30 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-emerald-400 block">
                      {isRu ? 'Результат согласования параметов (Negotiated Response):' : 'Negotiated Handshake Parameters:'}
                    </span>
                    <pre className="p-3 bg-black/50 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto border border-emerald-500/20">
                      {JSON.stringify(handshake, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'concept' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#181024] border border-[#3d2b4f] rounded-2xl space-y-2">
                  <h3 className="text-sm font-black text-white">{AHA_PROTOCOL_CONCEPT.name}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {isRu ? AHA_PROTOCOL_CONCEPT.descriptionRu : AHA_PROTOCOL_CONCEPT.descriptionEn}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {AHA_PROTOCOL_CONCEPT.architecturalPillars.map((p) => (
                    <div key={p.id} className="p-4 bg-[#1a1226] border border-[#3d2b4f] rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-[#ff4d4d] font-bold text-xs">
                        <Zap size={16} />
                        <span>{isRu ? p.titleRu : p.titleEn}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {isRu ? p.descRu : p.descEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 bg-[#0e0a14] border-t border-[#3d2b4f] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-[#ff4d4d] animate-ping" />
              <span>AHA Protocol v6 Active</span>
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
    </ModalPortal>
  );
};
