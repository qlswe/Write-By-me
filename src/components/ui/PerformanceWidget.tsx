import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';

export const PerformanceWidget: React.FC = () => {
  const [memory, setMemory] = useState<number | null>(null);
  const [fps, setFps] = useState<number>(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const updateMetrics = () => {
      const now = performance.now();
      frameCount++;

      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;

        // @ts-ignore - performance.memory is a non-standard Chrome feature
        if (performance.memory) {
          // @ts-ignore
          setMemory(Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)));
        }
      }

      animationFrameId = requestAnimationFrame(updateMetrics);
    };

    animationFrameId = requestAnimationFrame(updateMetrics);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      drag
      dragMomentum={false}
      className="fixed top-20 right-4 z-[100] bg-[#2F244F] border border-[#5C4B8B] rounded-xl p-3 shadow-lg flex flex-col gap-2 cursor-move"
    >
      <div className="flex items-center gap-2 text-[#C3A6E6] text-xs font-bold uppercase tracking-wider pointer-events-none">
        <Activity size={14} />
        System Load
      </div>
      <div className="flex flex-col gap-1 text-[10px] text-gray-300 font-mono pointer-events-none">
        <div className="flex justify-between gap-4">
          <span>FPS:</span>
          <span className={fps < 30 ? 'text-red-400' : fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
            {fps}
          </span>
        </div>
        {memory !== null && (
          <div className="flex justify-between gap-4">
            <span>MEM:</span>
            <span>{memory} MB</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
