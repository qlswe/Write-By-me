import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, ArrowDown, CheckCircle2, Sparkles } from 'lucide-react';
import { Language } from '../../data/translations';

interface PullToRefreshProps {
  onRefresh: () => Promise<any> | void;
  children: React.ReactNode;
  disabled?: boolean;
  lang?: Language;
  className?: string;
  contentClassName?: string;
  threshold?: number;
  maxPull?: number;
  showManualButton?: boolean;
  pullDownLabel?: string;
  releaseLabel?: string;
  refreshingLabel?: string;
  completedLabel?: string;
  id?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  lang = 'ru',
  className = '',
  contentClassName = '',
  threshold = 68,
  maxPull = 120,
  showManualButton = false,
  pullDownLabel,
  releaseLabel,
  refreshingLabel,
  completedLabel,
  id = 'pull-to-refresh-container'
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [status, setStatus] = useState<'idle' | 'pulling' | 'ready' | 'refreshing' | 'success'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isPullingRef = useRef(false);
  const isDraggingMouseRef = useRef(false);
  const hasVibratedRef = useRef(false);

  // Localization strings
  const labels = {
    pullDown: pullDownLabel || (
      lang === 'ru' ? 'Потяните вниз для обновления' :
      lang === 'by' ? 'Пацягніце ўніз для абнаўлення' :
      lang === 'de' ? 'Zum Aktualisieren nach unten ziehen' :
      lang === 'fr' ? 'Tirer pour actualiser' :
      lang === 'zh' ? '下拉即可同步刷新' :
      'Pull down to refresh'
    ),
    release: releaseLabel || (
      lang === 'ru' ? 'Отпустите для синхронизации' :
      lang === 'by' ? 'Адпусціце для сінхранізацыі' :
      lang === 'de' ? 'Loslassen zum Synchronisieren' :
      lang === 'fr' ? 'Relâcher pour synchroniser' :
      lang === 'zh' ? '释放立即同步' :
      'Release to sync'
    ),
    refreshing: refreshingLabel || (
      lang === 'ru' ? 'Синхронизация данных...' :
      lang === 'by' ? 'Сінхранізацыя даных...' :
      lang === 'de' ? 'Synchronisiere Daten...' :
      lang === 'fr' ? 'Synchronisation des données...' :
      lang === 'zh' ? '正在同步数据...' :
      'Syncing data...'
    ),
    completed: completedLabel || (
      lang === 'ru' ? 'Данные обновлены!' :
      lang === 'by' ? 'Даныя абноўлены!' :
      lang === 'de' ? 'Daten aktualisiert!' :
      lang === 'fr' ? 'Données actualisées !' :
      lang === 'zh' ? '同步已完成！' :
      'Content synced!'
    )
  };

  const isAtTop = (): boolean => {
    // Check window scroll
    const windowScrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (windowScrollTop > 3) return false;

    // Check parent container scroll
    if (containerRef.current) {
      let currentEl: HTMLElement | null = containerRef.current;
      while (currentEl && currentEl !== document.body) {
        if (currentEl.scrollTop > 3) return false;
        currentEl = currentEl.parentElement;
      }
    }
    return true;
  };

  const triggerRefresh = useCallback(async () => {
    if (status === 'refreshing') return;
    setStatus('refreshing');
    setPullDistance(threshold);

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(15); } catch (e) {}
      }
      await Promise.resolve(onRefresh());
      setStatus('success');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([10, 30, 15]); } catch (e) {}
      }
      setTimeout(() => {
        setPullDistance(0);
        setStatus('idle');
        hasVibratedRef.current = false;
      }, 700);
    } catch (err) {
      console.warn('[PullToRefresh] Refresh failed:', err);
      setPullDistance(0);
      setStatus('idle');
      hasVibratedRef.current = false;
    }
  }, [onRefresh, status, threshold]);

  // Touch Event Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || status === 'refreshing' || status === 'success') return;
    if (isAtTop()) {
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isPullingRef.current = true;
      hasVibratedRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPullingRef.current || disabled || status === 'refreshing' || status === 'success') return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - startYRef.current;
    const deltaX = currentX - startXRef.current;

    // If scrolling sideways more than downwards, ignore
    if (Math.abs(deltaX) > Math.abs(deltaY) && pullDistance === 0) {
      isPullingRef.current = false;
      return;
    }

    if (deltaY > 0 && isAtTop()) {
      // Elastic log dampening
      const distance = Math.min(maxPull, Math.pow(deltaY, 0.82) * 0.95);
      setPullDistance(distance);

      if (distance >= threshold) {
        if (!hasVibratedRef.current) {
          hasVibratedRef.current = true;
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(12); } catch (err) {}
          }
        }
        setStatus('ready');
      } else {
        setStatus('pulling');
        hasVibratedRef.current = false;
      }

      // Prevent native overscroll browser bounce if pulling down
      if (e.cancelable && distance > 10) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
      setStatus('idle');
    }
  };

  const handleTouchEnd = () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (status === 'ready' || pullDistance >= threshold) {
      triggerRefresh();
    } else {
      setPullDistance(0);
      setStatus('idle');
      hasVibratedRef.current = false;
    }
  };

  // Mouse Drag Fallback (Desktop drag-to-refresh)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || status === 'refreshing' || status === 'success') return;
    // Only primary mouse button and at top
    if (e.button === 0 && isAtTop()) {
      startYRef.current = e.clientY;
      startXRef.current = e.clientX;
      isDraggingMouseRef.current = true;
      hasVibratedRef.current = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingMouseRef.current || disabled || status === 'refreshing' || status === 'success') return;
    const deltaY = e.clientY - startYRef.current;
    
    if (deltaY > 5 && isAtTop()) {
      const distance = Math.min(maxPull, Math.pow(deltaY, 0.82) * 0.9);
      setPullDistance(distance);

      if (distance >= threshold) {
        setStatus('ready');
      } else {
        setStatus('pulling');
      }
    } else {
      setPullDistance(0);
      setStatus('idle');
    }
  };

  const handleMouseUp = () => {
    if (!isDraggingMouseRef.current) return;
    isDraggingMouseRef.current = false;

    if (status === 'ready' || pullDistance >= threshold) {
      triggerRefresh();
    } else {
      setPullDistance(0);
      setStatus('idle');
    }
  };

  const progressPercent = Math.min(100, Math.round((pullDistance / threshold) * 100));
  const circleRadius = 13;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      id={id}
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full ${className}`}
    >
      {/* Pull Down Indicator Badge */}
      <div 
        className="pointer-events-none w-full flex justify-center items-center overflow-hidden transition-all duration-150"
        style={{
          height: status === 'refreshing' ? `${threshold}px` : `${pullDistance}px`,
          opacity: pullDistance > 8 || status === 'refreshing' || status === 'success' ? 1 : 0
        }}
      >
        <div className={`px-4 py-2 rounded-2xl border backdrop-blur-xl flex items-center gap-3 shadow-2xl transition-all ${
          status === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            : status === 'ready'
            ? 'bg-[#25152f]/95 border-[#ff4d4d]/60 text-white shadow-[0_0_25px_rgba(255,77,77,0.4)] scale-105'
            : status === 'refreshing'
            ? 'bg-[#1e132c]/95 border-purple-500/50 text-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.35)]'
            : 'bg-[#181124]/90 border-[#3d2b4f] text-white/70'
        }`}>
          {/* Status Icon & Progress Ring */}
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            {status === 'success' ? (
              <CheckCircle2 size={20} className="text-emerald-400 animate-bounce" />
            ) : status === 'refreshing' ? (
              <RefreshCw size={18} className="text-purple-400 animate-spin" />
            ) : (
              <>
                <svg className="w-8 h-8 transform -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r={circleRadius}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="2.5"
                    fill="transparent"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r={circleRadius}
                    stroke={status === 'ready' ? '#ff4d4d' : '#a855f7'}
                    strokeWidth="2.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-75"
                  />
                </svg>
                <div 
                  className="absolute inset-0 flex items-center justify-center transition-transform duration-150"
                  style={{
                    transform: status === 'ready' ? 'rotate(180deg) scale(1.1)' : `rotate(${pullDistance * 2.5}deg)`
                  }}
                >
                  <ArrowDown size={14} className={status === 'ready' ? 'text-[#ff4d4d]' : 'text-purple-300'} />
                </div>
              </>
            )}
          </div>

          {/* Status Label */}
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black uppercase tracking-wider">
              {status === 'success' ? labels.completed :
               status === 'refreshing' ? labels.refreshing :
               status === 'ready' ? labels.release :
               labels.pullDown}
            </span>
            {status === 'pulling' && (
              <span className="text-[9px] text-white/40 font-mono">
                {progressPercent}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content wrapper with natural pull translation */}
      <div 
        className={`w-full transition-transform duration-100 ease-out ${contentClassName}`}
        style={{
          transform: status === 'refreshing'
            ? `translateY(${Math.min(18, threshold * 0.25)}px)`
            : pullDistance > 0
            ? `translateY(${pullDistance * 0.25}px)`
            : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};
