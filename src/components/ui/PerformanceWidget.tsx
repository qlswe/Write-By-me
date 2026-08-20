import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Zap, Trash2 } from 'lucide-react';
import { turboEngine, TurboStats } from '../../utils/turboEngine';

export const PerformanceWidget: React.FC = () => {
  const [stats, setStats] = useState<TurboStats>(() => turboEngine.getStats());

  useEffect(() => {
    const unsubscribe = turboEngine.subscribe((newStats) => {
      setStats(newStats);
    });
    return unsubscribe;
  }, []);

  const handleToggleTurbo = () => {
    turboEngine.toggleTurbo();
  };

  const handleCleanMemory = () => {
    const res = turboEngine.cleanMemory();
    window.dispatchEvent(new CustomEvent('aha_toast', {
      detail: `⚡ Очищено ${res.itemsCleaned} элементов кэша (${(res.freedBytes / 1024).toFixed(1)} KB)`
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      drag
      dragMomentum={false}
      className="fixed top-20 right-4 z-[100] bg-[#15101e]/95 backdrop-blur-md border border-[#3d2b4f] rounded-2xl p-3 shadow-2xl flex flex-col gap-2 cursor-move min-w-[160px]"
    >
      <div className="flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 text-[#ff4d4d] text-xs font-black uppercase tracking-wider">
          <Activity size={14} />
          <span>AHA TURBO</span>
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${stats.turboActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'}`}>
          {stats.turboActive ? 'TURBO' : 'STD'}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-[10px] text-white/90 font-mono pointer-events-none">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">FPS:</span>
          <span className={`font-black ${stats.fps < 30 ? 'text-red-400' : stats.fps < 55 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {stats.fps} {stats.turboActive ? '⚡' : ''}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">MEM:</span>
          <span>{stats.memoryMb} MB</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">LATENCY:</span>
          <span className="text-cyan-400 font-bold">{stats.latencyScore}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-[#3d2b4f]/60">
        <button
          onClick={handleToggleTurbo}
          className={`flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
            stats.turboActive 
              ? 'bg-[#ff4d4d] text-[#15101e] shadow-md shadow-[#ff4d4d]/30' 
              : 'bg-[#251c35] text-gray-300 hover:text-white border border-[#3d2b4f]'
          }`}
          title="Toggle AHA Turbo Acceleration"
        >
          <Zap size={10} />
          <span>{stats.turboActive ? 'ON' : 'BOOST'}</span>
        </button>

        <button
          onClick={handleCleanMemory}
          className="p-1 bg-[#251c35] hover:bg-[#342749] text-gray-400 hover:text-white rounded-lg border border-[#3d2b4f] transition-all cursor-pointer"
          title="Purge stale cache and optimize DOM memory"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </motion.div>
  );
};

