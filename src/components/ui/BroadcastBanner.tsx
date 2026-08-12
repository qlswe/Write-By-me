import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, AlertTriangle, CheckCircle2, Info, Bell, X, ShieldAlert, Sparkles } from 'lucide-react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Language } from '../../data/translations';

export interface BroadcastData {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'alert' | 'success';
  sender?: string;
  timestamp?: number;
  sticky?: boolean;
}

interface BroadcastBannerProps {
  lang?: Language;
}

export const BroadcastBanner: React.FC<BroadcastBannerProps> = ({ lang = 'ru' }) => {
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastData | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aha_dismissed_broadcasts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const lastNotificationIdRef = useRef<string | null>(null);
  const isRu = lang === 'ru';

  useEffect(() => {
    // Realtime Firestore subscription for instant broadcast alerts
    const unsub = onSnapshot(doc(db, 'settings', 'broadcast'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.activeBroadcast && data.activeBroadcast.id) {
          const broadcast: BroadcastData = data.activeBroadcast;
          
          // Check if user already dismissed this specific broadcast ID
          if (!dismissedIds.includes(broadcast.id)) {
            setActiveBroadcast(broadcast);

            // Play audio chime if it's a new broadcast ID we haven't seen in this session
            if (lastNotificationIdRef.current !== broadcast.id) {
              lastNotificationIdRef.current = broadcast.id;
              playNotificationChime();
            }
          } else {
            setActiveBroadcast(null);
          }
        } else {
          setActiveBroadcast(null);
        }
      }
    }, (err) => {
      console.warn("Broadcast listener error:", err);
    });

    return () => unsub();
  }, [dismissedIds]);

  const playNotificationChime = () => {
    try {
      // 1. Try standard audio asset if available
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.6;
      audio.play().catch(() => {
        // 2. Synthesize Web Audio chime if audio file blocked/missing
        synthesizeChimeSound();
      });
    } catch (e) {
      synthesizeChimeSound();
    }
  };

  const synthesizeChimeSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  const handleDismiss = () => {
    if (!activeBroadcast) return;
    const newDismissed = [...dismissedIds, activeBroadcast.id];
    setDismissedIds(newDismissed);
    try {
      localStorage.setItem('aha_dismissed_broadcasts', JSON.stringify(newDismissed));
    } catch (e) {}
    setActiveBroadcast(null);
  };

  if (!activeBroadcast) return null;

  const getTypeStyle = () => {
    switch (activeBroadcast.type) {
      case 'warning':
      case 'alert':
        return {
          bg: 'from-amber-950/90 via-[#1e1528]/95 to-[#120a1c]/95',
          border: 'border-amber-500/50',
          glow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]',
          icon: <AlertTriangle size={20} className="text-amber-400 shrink-0 animate-bounce" />,
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          titleColor: 'text-amber-200'
        };
      case 'success':
        return {
          bg: 'from-emerald-950/90 via-[#121c18]/95 to-[#0b1411]/95',
          border: 'border-emerald-500/50',
          glow: 'shadow-[0_0_30px_rgba(16,185,129,0.25)]',
          icon: <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />,
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          titleColor: 'text-emerald-200'
        };
      default:
        return {
          bg: 'from-[#2a1338]/95 via-[#180f26]/95 to-[#0f0a1a]/95',
          border: 'border-[#ff4d4d]/50',
          glow: 'shadow-[0_0_35px_rgba(255,77,77,0.3)]',
          icon: <Megaphone size={20} className="text-[#ff4d4d] shrink-0 animate-pulse" />,
          badgeBg: 'bg-[#ff4d4d]/20 text-[#ff4d4d] border-[#ff4d4d]/40',
          titleColor: 'text-white'
        };
    }
  };

  const style = getTypeStyle();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed top-4 left-0 right-0 z-[9999] px-3 sm:px-6 pointer-events-none flex justify-center"
      >
        <div 
          className={`pointer-events-auto max-w-3xl w-full bg-gradient-to-r ${style.bg} backdrop-blur-xl border ${style.border} ${style.glow} rounded-2xl p-4 sm:p-5 text-white shadow-2xl relative overflow-hidden`}
        >
          {/* Subtle animated light streak background */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 shrink-0 mt-0.5">
                {style.icon}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${style.badgeBg}`}>
                    {isRu ? 'Системное оповещение' : 'System Broadcast'}
                  </span>
                  {activeBroadcast.sender && (
                    <span className="text-[11px] text-gray-400 font-mono">
                      • {activeBroadcast.sender}
                    </span>
                  )}
                  {activeBroadcast.timestamp && (
                    <span className="text-[10px] text-gray-500 font-mono">
                      ({new Date(activeBroadcast.timestamp).toLocaleTimeString(isRu ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  )}
                </div>

                {activeBroadcast.title && (
                  <h4 className={`text-base sm:text-lg font-black uppercase tracking-wide leading-snug ${style.titleColor}`}>
                    {activeBroadcast.title}
                  </h4>
                )}

                <p className="text-sm text-gray-200 leading-relaxed font-sans whitespace-pre-wrap break-words">
                  {activeBroadcast.message}
                </p>
              </div>
            </div>

            {/* Close / Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white transition-all shrink-0 cursor-pointer active:scale-90"
              title={isRu ? 'Закрыть уведомление' : 'Dismiss notification'}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
