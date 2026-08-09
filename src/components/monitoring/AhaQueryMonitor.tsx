import React, { useState, useEffect, useRef } from 'react';
import { dbQueryCore, DbQueryEvent } from '../../utils/dbQueryCore';
import { logger } from '../../utils/logger';
import { Zap, Activity, Clock, Database, RefreshCw, BarChart2, ShieldCheck, Play, Flame, Trash2, Eraser, Download } from 'lucide-react';

interface ProfileQueryStats {
  totalRequests: number;
  cacheHits: number;
  networkFetches: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  freqPerMinute: number;
}

export const AhaQueryMonitor: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [events, setEvents] = useState<DbQueryEvent[]>([]);
  const [isStressTesting, setIsStressTesting] = useState<boolean>(false);
  const [stats, setStats] = useState<ProfileQueryStats>({
    totalRequests: 0,
    cacheHits: 0,
    networkFetches: 0,
    avgLatencyMs: 0,
    minLatencyMs: 0,
    maxLatencyMs: 0,
    freqPerMinute: 0,
  });

  const timestampsRef = useRef<number[]>([]);

  // Run 10 parallel batched queries to test micro-batching & cache performance
  const handleRunStressTest = async () => {
    if (isStressTesting) return;
    setIsStressTesting(true);
    logger.info('⚡ Starting Micro-Batch Burst Test (10 concurrent profile queries)...', null, 'AhaQueryMonitor');

    const sampleUids = Array.from({ length: 10 }, (_, i) => `test_user_${(i % 3) + 1}`);
    const startTime = performance.now();

    try {
      await Promise.all(sampleUids.map(uid => dbQueryCore.getProfileBatched(uid)));
      const duration = performance.now() - startTime;
      logger.perf(`⚡ Micro-Batch Burst Test finished in ${duration.toFixed(1)}ms for 10 requests`, {
        requestsCount: 10,
        durationMs: duration
      }, 'AhaQueryMonitor');
    } catch (err: any) {
      logger.error(`Micro-Batch Burst Test error: ${err?.message}`, null, 'AhaQueryMonitor');
    } finally {
      setIsStressTesting(false);
    }
  };

  const handleWarmupCache = async () => {
    logger.info('🔥 Warming up public_profiles cache for test users...', null, 'AhaQueryMonitor');
    const uids = ['system_admin', 'demo_user_1', 'demo_user_2'];
    await Promise.all(uids.map(uid => dbQueryCore.getProfileBatched(uid)));
    logger.info('🔥 Cache warmup complete! Subsequent requests for these UIDs will hit 0ms cache.', null, 'AhaQueryMonitor');
  };

  const handleClearCache = () => {
    const cleared = dbQueryCore.clearCache();
    logger.warn(`🧹 Cache Evicted: Cleared ${cleared} items from DbQueryCore cache memory`, null, 'AhaQueryMonitor');
  };

  const handleExportTelemetry = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: {
        totalRequests: stats.totalRequests,
        cacheHits: stats.cacheHits,
        networkFetches: stats.networkFetches,
        cacheRatioPercent: Number(cacheRatio),
        avgLatencyMs: Number(stats.avgLatencyMs.toFixed(2)),
        minLatencyMs: Number(stats.minLatencyMs.toFixed(2)),
        maxLatencyMs: Number(stats.maxLatencyMs.toFixed(2)),
        freqPerMinute: stats.freqPerMinute,
      },
      recentEvents: events.slice(0, 10),
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    logger.info('📋 Telemetry Diagnostic Report copied to clipboard!', report, 'AhaQueryMonitor');
  };

  const handleResetStats = () => {
    setEvents([]);
    setStats({
      totalRequests: 0,
      cacheHits: 0,
      networkFetches: 0,
      avgLatencyMs: 0,
      minLatencyMs: 0,
      maxLatencyMs: 0,
      freqPerMinute: 0,
    });
    timestampsRef.current = [];
  };

  useEffect(() => {
    const unsubscribe = dbQueryCore.subscribe((event) => {
      // Focus on public_profiles queries specifically
      if (event.collection === 'public_profiles' || event.docId.includes('public_profiles')) {
        const now = Date.now();
        timestampsRef.current.push(now);
        // Retain only timestamps from the last 60 seconds
        timestampsRef.current = timestampsRef.current.filter((t) => now - t <= 60000);

        setEvents((prev) => [event, ...prev].slice(0, 50));

        setStats((prev) => {
          const newTotal = prev.totalRequests + 1;
          const newHits = prev.cacheHits + (event.cached ? 1 : 0);
          const newNet = prev.networkFetches + (event.cached ? 0 : 1);

          let newMin = prev.minLatencyMs === 0 ? event.latencyMs : Math.min(prev.minLatencyMs, event.latencyMs);
          let newMax = Math.max(prev.maxLatencyMs, event.latencyMs);

          // Calculate running average
          const totalLatency = prev.avgLatencyMs * prev.totalRequests + event.latencyMs;
          const newAvg = totalLatency / newTotal;

          return {
            totalRequests: newTotal,
            cacheHits: newHits,
            networkFetches: newNet,
            avgLatencyMs: newAvg,
            minLatencyMs: newMin,
            maxLatencyMs: newMax,
            freqPerMinute: timestampsRef.current.length,
          };
        });

        // Directly log performance telemetry to DevConsoleWidget via logger
        const statusText = event.cached ? '⚡ CACHE HIT (0.0ms)' : `🔥 NETWORK (${event.latencyMs.toFixed(1)}ms)`;
        logger.perf(
          `[AhaQueryMonitor] public_profiles/${event.docId} -> ${statusText}`,
          {
            docId: event.docId,
            latencyMs: event.latencyMs,
            cached: event.cached,
            action: event.action,
            freqPerMin: timestampsRef.current.length,
          },
          'AhaQueryMonitor'
        );
      }
    });

    // Frequency recalculation timer every 5 seconds
    const timer = setInterval(() => {
      const now = Date.now();
      timestampsRef.current = timestampsRef.current.filter((t) => now - t <= 60000);
      setStats((prev) => ({
        ...prev,
        freqPerMinute: timestampsRef.current.length,
      }));
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const cacheRatio = stats.totalRequests > 0 ? ((stats.cacheHits / stats.totalRequests) * 100).toFixed(1) : '100.0';

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-[#1b132a] border border-[#3d2b4f] px-2.5 py-1 rounded-xl text-xs font-mono">
        <Activity size={13} className="text-cyan-400 animate-pulse" />
        <span className="text-gray-300 font-bold">public_profiles:</span>
        <span className="text-emerald-400 font-bold">{stats.freqPerMinute}/мин</span>
        <span className="text-gray-500">|</span>
        <span className="text-amber-300">{stats.avgLatencyMs.toFixed(0)}ms ср.</span>
        <span className="text-gray-500">|</span>
        <span className="text-purple-300">{cacheRatio}% кэш</span>
      </div>
    );
  }

  return (
    <div className="bg-[#150e24] border border-[#3d2b4f] rounded-2xl p-4 text-gray-200 space-y-4 font-sans shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3d2b4f]/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Activity size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">AhaQueryMonitor</h4>
            <p className="text-[11px] text-gray-400">Мониторинг задержки и частоты для <code className="text-cyan-300">public_profiles</code></p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>LIVE</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-[#1c1330] border border-[#3d2b4f] p-2.5 rounded-xl">
          <span className="text-[10px] text-gray-400 uppercase font-bold block flex items-center gap-1">
            <Clock size={11} className="text-cyan-400" /> Частота
          </span>
          <div className="text-lg font-black font-mono text-cyan-300 mt-0.5">
            {stats.freqPerMinute} <span className="text-[10px] font-normal text-gray-400">запр/мин</span>
          </div>
        </div>

        <div className="bg-[#1c1330] border border-[#3d2b4f] p-2.5 rounded-xl">
          <span className="text-[10px] text-gray-400 uppercase font-bold block flex items-center gap-1 justify-between">
            <span className="flex items-center gap-1"><Zap size={11} className="text-amber-400" /> Ср. Задержка</span>
            <span className="text-[9px] text-gray-500 font-mono">
              {stats.minLatencyMs.toFixed(0)}-{stats.maxLatencyMs.toFixed(0)}ms
            </span>
          </span>
          <div className="text-lg font-black font-mono text-amber-300 mt-0.5">
            {stats.avgLatencyMs.toFixed(1)} <span className="text-[10px] font-normal text-gray-400">мс</span>
          </div>
        </div>

        <div className="bg-[#1c1330] border border-[#3d2b4f] p-2.5 rounded-xl">
          <span className="text-[10px] text-gray-400 uppercase font-bold block flex items-center gap-1">
            <ShieldCheck size={11} className="text-emerald-400" /> Эффективность Кэша
          </span>
          <div className="text-lg font-black font-mono text-emerald-300 mt-0.5">
            {cacheRatio}%
          </div>
        </div>

        <div className="bg-[#1c1330] border border-[#3d2b4f] p-2.5 rounded-xl">
          <span className="text-[10px] text-gray-400 uppercase font-bold block flex items-center gap-1">
            <Database size={11} className="text-purple-400" /> Всего Запросов
          </span>
          <div className="text-lg font-black font-mono text-purple-300 mt-0.5">
            {stats.totalRequests}
          </div>
        </div>
      </div>

      {/* Visual Cache Hit vs Network Distribution Bar */}
      <div className="bg-[#110820] border border-[#3d2b4f] p-2.5 rounded-xl space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-gray-300 flex items-center gap-1.5">
            <BarChart2 size={13} className="text-emerald-400" />
            Распределение: Кэш vs Сеть
          </span>
          <span className="font-mono text-[10px]">
            <span className="text-emerald-400 font-bold">{stats.cacheHits} кэш</span>
            <span className="text-gray-500 mx-1">/</span>
            <span className="text-cyan-400 font-bold">{stats.networkFetches} сеть</span>
          </span>
        </div>

        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${stats.totalRequests > 0 ? (stats.cacheHits / stats.totalRequests) * 100 : 100}%` }}
            title={`Кэш: ${stats.cacheHits} запросов (${cacheRatio}%)`}
          />
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${stats.totalRequests > 0 ? (stats.networkFetches / stats.totalRequests) * 100 : 0}%` }}
            title={`Сеть: ${stats.networkFetches} запросов`}
          />
        </div>
      </div>

      {/* Interactive Testing Toolbar */}
      <div className="pt-2 border-t border-[#3d2b4f]/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleRunStressTest}
            disabled={isStressTesting}
            className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isStressTesting ? (
              <RefreshCw size={12} className="animate-spin text-cyan-400" />
            ) : (
              <Play size={12} className="text-cyan-400 fill-cyan-400/20" />
            )}
            <span>{isStressTesting ? 'Тестирование...' : '⚡ Нагрузка (10 Micro-Batch)'}</span>
          </button>

          <button
            type="button"
            onClick={handleWarmupCache}
            className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-200 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Flame size={12} className="text-amber-400" />
            <span>🔥 Прогреть Кэш</span>
          </button>

          <button
            type="button"
            onClick={handleClearCache}
            className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-200 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Очистить память локального кэша для тестирования холодных сетевых запросов"
          >
            <Eraser size={12} className="text-rose-400" />
            <span>🧹 Сбросить Кэш</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportTelemetry}
            className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            title="Скопировать JSON отчёт телеметрии в буфер обмена"
          >
            <Download size={11} className="text-purple-400" />
            <span>Экспорт JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetStats}
            className="px-2 py-1 bg-[#1c1330] hover:bg-[#2e1d4d] border border-[#3d2b4f] text-gray-400 hover:text-white text-[11px] rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            title="Сбросить счетчики вызовов"
          >
            <Trash2 size={11} />
            <span>Сброс</span>
          </button>
        </div>
      </div>

      {/* Recent public_profiles Query Events Log */}
      <div>
        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1">
          <BarChart2 size={12} className="text-cyan-400" /> Живой поток событий public_profiles
        </span>

        {events.length === 0 ? (
          <div className="bg-[#19102a] border border-dashed border-[#3d2b4f] rounded-xl p-3 text-center text-xs text-gray-500 font-mono">
            Ожидание запросов к public_profiles...
          </div>
        ) : (
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] scrollbar-thin">
            {events.map((evt, idx) => (
              <div
                key={idx}
                className={`p-1.5 rounded-lg border flex items-center justify-between transition-all ${
                  evt.cached
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                    : evt.latencyMs > 1000
                    ? 'bg-red-950/30 border-red-500/30 text-red-300'
                    : 'bg-cyan-950/20 border-cyan-500/20 text-cyan-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] text-gray-500">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="font-bold truncate">public_profiles/{evt.docId}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    evt.cached ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {evt.cached ? 'КЭШ (0мс)' : `${evt.latencyMs.toFixed(0)}мс`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
