import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Zap, Award, RotateCcw, Volume2, VolumeX, Trophy, Flame, Target, Star, CheckCircle } from 'lucide-react';
import { Language } from '../../data/translations';
import { generatePrefixedId, generateUUID } from '../../utils/idGenerator';

interface NatoGameSectionProps {
  lang: Language;
}

interface Recruit {
  id: string | number;
  x: number; // percentage
  y: number; // percentage
  speedX: number;
  speedY: number;
  type: 'recruit' | 'fast' | 'boss' | 'golden';
  transformed: boolean;
  size: number;
  name: string;
}

interface Particle {
  id: string | number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

interface LaserBeam {
  id: string | number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

interface FloatingScore {
  id: string | number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
}

const INSTRUCTOR_QUOTES = [
  "Хеллоу, кандидат! Время вступать в ряды НАТО! 🪖✨",
  "Выдаю стильный радужный берет и тактический блеск! 🌈💥",
  "Трансформация в солдата НАТО прошла на 100%! ⚡",
  "Генератор толерантности перезаряжен! Лови лазер! ✨🎯",
  "Отличная выправка! Элегантный камуфляж вам к лицу! 💅🪖",
  "Никто не уклонится от нашего модного инструктажа! 🚀",
  "Тактический глиттер активирован! 🌟",
  "Вот это точность! Настоящий генералиссимус НАТО! 🏆",
];

const RECRUIT_NAMES = [
  "Призывник Игнат",
  "Кандидат Вася",
  "Новичок Петя",
  "Курсант Олега",
  "Уклонист Дрон",
  "Кадет Гриша",
  "Рядовой Сеня"
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_recruit', title: 'Первый Призыв', desc: 'Трансформируйте первого кандидата', icon: '🪖', unlocked: false },
  { id: 'combo_5', title: 'Серийный Инструктор', desc: 'Достигните комбо 5x', icon: '⚡', unlocked: false },
  { id: 'super_pulse', title: 'Радужный Залп', desc: 'Активируйте Супер-Импульс НАТО', icon: '🌈', unlocked: false },
  { id: 'score_3000', title: 'Тактический Мастер', desc: 'Наберите 3,000+ очков', icon: '🏆', unlocked: false },
  { id: 'wave_10', title: 'Генерал НАТО', desc: 'Пройдите все 10 волн инструктажа', icon: '🎖️', unlocked: false },
];

export const NatoGameSection: React.FC<NatoGameSectionProps> = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showWaveSummary, setShowWaveSummary] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('nato_game_highscore') || '0', 10));
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [transformedCount, setTransformedCount] = useState(0);
  const [wave, setWave] = useState(1);
  const [waveTimeLeft, setWaveTimeLeft] = useState(25);
  const [speedSetting, setSpeedSetting] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [quote, setQuote] = useState(INSTRUCTOR_QUOTES[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('nato_achievements');
    if (!saved) return INITIAL_ACHIEVEMENTS;
    try {
      const unlockedIds: string[] = JSON.parse(saved);
      return INITIAL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlockedIds.includes(a.id) }));
    } catch {
      return INITIAL_ACHIEVEMENTS;
    }
  });
  const [newUnlockedAch, setNewUnlockedAch] = useState<Achievement | null>(null);

  // Wave stats tracking
  const [waveTransformed, setWaveTransformed] = useState(0);
  const [waveTotal, setWaveTotal] = useState(0);

  // Powerups & Special abilities
  const [rainbowFieldCharge, setRainbowFieldCharge] = useState(100);
  const [activePowerup, setActivePowerup] = useState<string | null>(null);

  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [lasers, setLasers] = useState<LaserBeam[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Cleanup Web Audio Context on unmount to optimize memory
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const target = prev.find(a => a.id === id);
      if (!target || target.unlocked) return prev;

      const next = prev.map(a => a.id === id ? { ...a, unlocked: true } : a);
      const unlockedIds = next.filter(a => a.unlocked).map(a => a.id);
      localStorage.setItem('nato_achievements', JSON.stringify(unlockedIds));

      setNewUnlockedAch(target);
      setTimeout(() => setNewUnlockedAch(null), 3500);
      return next;
    });
  }, []);

  // Speed multiplier based on setting
  const getSpeedMultiplier = () => {
    switch (speedSetting) {
      case 'slow': return 0.22;
      case 'normal': return 0.42;
      case 'fast': return 0.70;
    }
  };

  // Web Audio Synth for sound effects
  const playSound = (type: 'laser' | 'transform' | 'super' | 'start' | 'over' | 'wave_win') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'transform') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'super' || type === 'wave_win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(950, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'start') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.08);
        osc.frequency.setValueAtTime(880, now + 0.16);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'over') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // Audio fallback
    }
  };

  // Start entire game session
  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setShowWaveSummary(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTransformedCount(0);
    setWave(1);
    setRainbowFieldCharge(100);
    setQuote(INSTRUCTOR_QUOTES[Math.floor(Math.random() * INSTRUCTOR_QUOTES.length)]);
    playSound('start');

    startWave(1);
  };

  // Start specific wave
  const startWave = (waveNum: number) => {
    setWave(waveNum);
    setWaveTimeLeft(25);
    setShowWaveSummary(false);
    setWaveTransformed(0);

    const count = 5 + waveNum * 2;
    setWaveTotal(count);

    const mult = getSpeedMultiplier();
    const newRecruits: Recruit[] = [];
    for (let i = 0; i < count; i++) {
      const isGolden = Math.random() < 0.18;
      const isBoss = !isGolden && i === 0 && waveNum % 2 === 0;
      const isFast = !isGolden && !isBoss && Math.random() > 0.6;
      const baseSpd = isFast ? 1.2 : (isGolden ? 1.0 : 0.6);

      newRecruits.push({
        id: generatePrefixedId('rec'),
        x: 12 + (i * 14) % 76 + Math.random() * 5,
        y: 15 + Math.random() * 65,
        speedX: (Math.random() > 0.5 ? 1 : -1) * baseSpd * mult,
        speedY: (Math.random() > 0.5 ? 1 : -1) * baseSpd * mult,
        type: isGolden ? 'golden' : (isBoss ? 'boss' : (isFast ? 'fast' : 'recruit')),
        transformed: false,
        size: isBoss ? 75 : (isGolden ? 60 : (isFast ? 48 : 58)),
        name: isGolden ? 'Элитный Призывник 👑' : RECRUIT_NAMES[Math.floor(Math.random() * RECRUIT_NAMES.length)]
      });
    }
    setRecruits(newRecruits);
  };

  // Wave timer countdown
  useEffect(() => {
    if (!isPlaying || isGameOver || showWaveSummary) return;

    const timer = setInterval(() => {
      setWaveTimeLeft(prev => {
        if (prev <= 1) {
          handleWaveEnd();
          return 0;
        }
        return prev - 1;
      });

      setRainbowFieldCharge(prev => Math.min(100, prev + 3));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isGameOver, showWaveSummary, wave]);

  const handleWaveEnd = () => {
    playSound('wave_win');
    setShowWaveSummary(true);
    setQuote(`Волна ${wave} завершена! Посмотрите результаты инструктажа! 🪖✨`);
  };

  const nextWave = () => {
    if (wave >= 10) {
      setIsGameOver(true);
      setIsPlaying(false);
      setShowWaveSummary(false);
      unlockAchievement('wave_10');
      playSound('super');
    } else {
      startWave(wave + 1);
    }
  };

  // High score & rank tracker
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('nato_game_highscore', score.toString());
    }
    if (score >= 3000) {
      unlockAchievement('score_3000');
    }
  }, [score, highScore, unlockAchievement]);

  // Movement animation loop (Memory optimized: capped particle/laser updates)
  useEffect(() => {
    if (!isPlaying || isGameOver || showWaveSummary) return;

    let animFrame: number;
    const updatePhysics = () => {
      setRecruits(prevRecruits => {
        const updated = prevRecruits.map(r => {
          let newX = r.x + r.speedX;
          let newY = r.y + r.speedY;
          let newSpeedX = r.speedX;
          let newSpeedY = r.speedY;

          if (newX < 6 || newX > 88) newSpeedX *= -1;
          if (newY < 12 || newY > 82) newSpeedY *= -1;

          return {
            ...r,
            x: Math.max(6, Math.min(88, newX)),
            y: Math.max(12, Math.min(82, newY)),
            speedX: newSpeedX,
            speedY: newSpeedY
          };
        });

        if (updated.length > 0 && updated.every(r => r.transformed)) {
          setTimeout(() => handleWaveEnd(), 300);
        }

        return updated;
      });

      // Update particles & cap length to max 35 to prevent memory churn
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          alpha: p.alpha - 0.04
        }))
        .filter(p => p.alpha > 0)
        .slice(-35)
      );

      // Update lasers fade
      setLasers(prev => prev
        .map(l => ({ ...l, alpha: l.alpha - 0.15 }))
        .filter(l => l.alpha > 0)
        .slice(-6)
      );

      animFrame = requestAnimationFrame(updatePhysics);
    };

    animFrame = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, isGameOver, showWaveSummary]);

  // Handle clicking / shooting at a recruit
  const handleShootRecruit = (e: React.MouseEvent, recruit: Recruit) => {
    e.stopPropagation();
    if (!isPlaying || isGameOver || showWaveSummary || recruit.transformed) return;

    // Create Laser Beam
    if (gameAreaRef.current) {
      const rect = gameAreaRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;

      setLasers(prev => [
        ...prev.slice(-5),
        { id: generatePrefixedId('lz'), x1: 50, y1: 95, x2: clickX, y2: clickY, alpha: 1 }
      ]);
    }

    playSound('laser');

    // Trigger Transformation
    setRecruits(prev => prev.map(r => {
      if (r.id === recruit.id) {
        return { ...r, transformed: true };
      }
      return r;
    }));

    playSound('transform');

    // Bonus time for golden recruits!
    if (recruit.type === 'golden') {
      setWaveTimeLeft(t => Math.min(30, t + 4));
    }

    // Stats & Score calculation
    const basePts = recruit.type === 'boss' ? 500 : (recruit.type === 'golden' ? 400 : (recruit.type === 'fast' ? 250 : 100));
    const roundPoints = Math.round(basePts * (1 + combo * 0.2));

    setScore(s => s + roundPoints);
    setTransformedCount(tc => tc + 1);
    setWaveTransformed(wt => wt + 1);

    // Floating score popup
    setFloatingScores(prev => [
      ...prev.slice(-5),
      {
        id: generatePrefixedId('fs'),
        x: recruit.x,
        y: recruit.y,
        text: `+${roundPoints}`,
        color: recruit.type === 'golden' ? '#ffea00' : (recruit.type === 'boss' ? '#ff4d4d' : '#00f0ff')
      }
    ]);
    setTimeout(() => {
      setFloatingScores(prev => prev.slice(1));
    }, 800);

    // Combo handling & achievements
    setCombo(c => {
      const newC = c + 1;
      if (newC > maxCombo) setMaxCombo(newC);
      if (newC >= 5) unlockAchievement('combo_5');
      return newC;
    });

    unlockAchievement('first_recruit');

    if (Math.random() > 0.5) {
      setQuote(INSTRUCTOR_QUOTES[Math.floor(Math.random() * INSTRUCTOR_QUOTES.length)]);
    }

    // Spawn Capped Rainbow Particles
    const colors = ['#ff4d4d', '#ff00ff', '#00f0ff', '#00ff88', '#ffea00', '#ffffff'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 1.5;
      newParticles.push({
        id: generatePrefixedId('p'),
        x: recruit.x,
        y: recruit.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 4,
        alpha: 1
      });
    }
    setParticles(p => [...p.slice(-20), ...newParticles]);
  };

  // Trigger Rainbow Super Pulse (Powerup)
  const handleTriggerSuperPulse = () => {
    if (rainbowFieldCharge < 100 || !isPlaying || isGameOver || showWaveSummary) return;

    setRainbowFieldCharge(0);
    playSound('super');
    setActivePowerup('rainbow_pulse');
    setTimeout(() => setActivePowerup(null), 1000);

    unlockAchievement('super_pulse');
    setQuote("АКТИВАЦИЯ РАДУЖНОГО ИМПУЛЬСА НАТО! ВСЕ В СТРОЙ! 🌈💥✨");

    setRecruits(prev => prev.map(r => {
      if (!r.transformed) {
        setScore(s => s + 150);
        setTransformedCount(tc => tc + 1);
        setWaveTransformed(wt => wt + 1);
        return { ...r, transformed: true };
      }
      return r;
    }));
  };

  const getRankTitle = (pts: number) => {
    if (pts >= 5000) return 'Генерал НАТО 🎖️';
    if (pts >= 2500) return 'Капитан Погона 👨‍✈️';
    if (pts >= 1000) return 'Сержант Инструктажа 🪖';
    return 'Рядовой Кадет 🔰';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Banner for New Unlocked Achievement */}
      <AnimatePresence>
        {newUnlockedAch && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-purple-600 p-0.5 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.6)]"
          >
            <div className="bg-[#120a1f] px-4 py-3 rounded-[14px] flex items-center gap-3">
              <span className="text-3xl">{newUnlockedAch.icon}</span>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 block">
                  НОВОЕ ДОСТИЖЕНИЕ!
                </span>
                <h4 className="text-sm font-black text-white">{newUnlockedAch.title}</h4>
                <p className="text-xs text-gray-300">{newUnlockedAch.desc}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Header Banner */}
      <div className="bg-gradient-to-r from-[#1b112c] via-[#2a1745] to-[#120a1f] p-6 rounded-3xl border border-[#ff4d4d]/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff4d4d]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00f0ff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#ff4d4d] via-purple-500 to-[#00f0ff] p-0.5 rounded-2xl shadow-[0_0_25px_rgba(255,77,77,0.4)]">
              <div className="w-full h-full bg-[#120a1f] rounded-[14px] flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#00f0ff] animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 rounded-full">
                  МИНИ-ИГРА AHA STATION 🎮
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
                  Звание: {getRankTitle(score)}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase mt-1">
                Инструктор из НАТО 🪖✨
              </h1>
              <p className="text-xs text-gray-300 font-medium max-w-md mt-0.5">
                Проходи волны за 25 секунд! Повышай звание и собирай все достижения!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Speed Selector */}
            <div className="flex bg-[#120a1f] border border-[#3e245a] p-1 rounded-2xl">
              <button
                onClick={() => setSpeedSetting('slow')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-xl transition-all ${
                  speedSetting === 'slow' ? 'bg-[#00f0ff] text-black shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Медленно
              </button>
              <button
                onClick={() => setSpeedSetting('normal')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-xl transition-all ${
                  speedSetting === 'normal' ? 'bg-purple-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Норма
              </button>
              <button
                onClick={() => setSpeedSetting('fast')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-xl transition-all ${
                  speedSetting === 'fast' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Быстро
              </button>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3 bg-[#170e28] hover:bg-[#281845] border border-[#3d245c] rounded-2xl text-gray-300 transition-all active:scale-95"
              title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
            >
              {soundEnabled ? <Volume2 size={20} className="text-[#00f0ff]" /> : <VolumeX size={20} className="text-gray-500" />}
            </button>

            {!isPlaying && (
              <button
                onClick={startGame}
                className="px-6 py-3.5 bg-gradient-to-r from-[#ff4d4d] via-purple-600 to-[#00f0ff] text-white font-black uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(255,77,77,0.5)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 text-sm"
              >
                <Zap className="fill-white" size={18} />
                {isGameOver ? 'Играть Снова' : 'Начать Инструктаж'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instructor Speech Bubble */}
      <div className="bg-[#170e28]/90 border border-[#3e245c] p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center shrink-0 border border-white/20 text-xl shadow-md">
          🪖
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[9px] font-black uppercase text-[#00f0ff] tracking-widest block">
            Инструктор из НАТО говорит:
          </span>
          <p className="text-sm font-bold text-white italic truncate md:whitespace-normal">
            "{quote}"
          </p>
        </div>
      </div>

      {/* Game Dashboard Stats */}
      {isPlaying && (
        <div className="space-y-3">
          {/* Wave Time Progress Bar */}
          <div className="bg-[#150d24] border border-[#382054] p-3 rounded-2xl">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider mb-1.5">
              <span className="text-purple-400">🌊 Волна {wave} из 10</span>
              <span className={`font-mono text-sm ${waveTimeLeft <= 5 ? 'text-red-500 animate-pulse font-bold' : 'text-amber-400'}`}>
                ⏱️ Время волны: {waveTimeLeft}с
              </span>
            </div>
            <div className="w-full bg-[#0a0512] h-3 rounded-full overflow-hidden border border-[#3d245c]">
              <div
                className="h-full bg-gradient-to-r from-[#00f0ff] via-purple-500 to-[#ff4d4d] transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(waveTimeLeft / 25) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-[#150d24] border border-[#382054] p-3 rounded-2xl text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Очки</span>
              <span className="text-xl font-black text-[#00f0ff]">{score}</span>
            </div>

            <div className="bg-[#150d24] border border-[#382054] p-3 rounded-2xl text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">На волне</span>
              <span className="text-xl font-black text-emerald-400">{waveTransformed} / {waveTotal}</span>
            </div>

            <div className="bg-[#150d24] border border-[#382054] p-3 rounded-2xl text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Всего Сомкнуто</span>
              <span className="text-xl font-black text-pink-400">{transformedCount}</span>
            </div>

            <div className="bg-[#150d24] border border-[#382054] p-3 rounded-2xl text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Комбо</span>
              <span className="text-xl font-black text-amber-400">{combo}x</span>
            </div>

            <div className="col-span-2 md:col-span-1 bg-[#150d24] border border-[#382054] p-3 rounded-2xl text-center flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Супер-Импульс</span>
              <button
                disabled={rainbowFieldCharge < 100 || showWaveSummary}
                onClick={handleTriggerSuperPulse}
                className={`w-full py-1 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                  rainbowFieldCharge >= 100 && !showWaveSummary
                    ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white shadow-[0_0_12px_rgba(0,240,255,0.6)] animate-pulse'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {rainbowFieldCharge >= 100 ? '🌈 РАДУЖНЫЙ ЗАЛП!' : `${rainbowFieldCharge}%`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Game Arena */}
      <div
        ref={gameAreaRef}
        className={`relative w-full h-[420px] bg-[#0c0714] rounded-3xl border-2 overflow-hidden select-none cursor-crosshair transition-all ${
          activePowerup === 'rainbow_pulse' ? 'border-[#00f0ff] shadow-[0_0_50px_rgba(0,240,255,0.8)]' : 'border-[#2d1b42]'
        }`}
      >
        {/* Tactical Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b102e_1px,transparent_1px),linear-gradient(to_bottom,#1b102e_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none" />

        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#ff4d4d] to-[#00f0ff] p-0.5 rounded-3xl shadow-[0_0_30px_rgba(0,240,255,0.4)]">
              <div className="w-full h-full bg-[#0d0714] rounded-[22px] flex items-center justify-center text-3xl">
                🪖
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                Полигон НАТО Готов!
              </h2>
              <p className="text-xs text-gray-400 max-w-sm">
                Проходи волны за 25 секунд! Выбивай особых элитных призывников (👑) и забирай значки!
              </p>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-[#ff4d4d] to-[#00f0ff] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              СТАРТ ИГРЫ
            </button>
          </div>
        )}

        {/* Wave Summary Overlay */}
        {showWaveSummary && (
          <div className="absolute inset-0 z-30 bg-[#0d0714]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-cyan-400 p-0.5 rounded-2xl shadow-[0_0_25px_rgba(0,240,255,0.5)]"
            >
              <div className="w-full h-full bg-[#140a21] rounded-[14px] flex items-center justify-center text-2xl">
                🎖️
              </div>
            </motion.div>

            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest">
                РЕЗУЛЬТАТЫ ВОЛНЫ {wave}
              </span>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                Волна Пройдена!
              </h2>
              <p className="text-xs text-gray-300">
                Трансформировано: <span className="text-emerald-400 font-bold">{waveTransformed} из {waveTotal}</span>
              </p>
            </div>

            <button
              onClick={nextWave}
              className="px-8 py-3 bg-gradient-to-r from-[#ff4d4d] via-purple-600 to-[#00f0ff] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            >
              <Zap size={14} /> {wave >= 10 ? 'Итоговый Финал' : `Перейти к Волне ${wave + 1}`}
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="absolute inset-0 z-30 bg-[#0d0714]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-5">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5 rounded-3xl shadow-[0_0_35px_rgba(255,180,0,0.5)]"
            >
              <div className="w-full h-full bg-[#140a21] rounded-[22px] flex items-center justify-center text-3xl">
                🏆
              </div>
            </motion.div>

            <div className="space-y-1">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                ИНСТРУКТАЖ УСПЕШНО ЗАВЕРШЕН!
              </span>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                Итоговый Счет: {score}
              </h2>
              <p className="text-xs text-gray-300">
                Звание: <span className="text-amber-400 font-bold">{getRankTitle(score)}</span> | Всего трансформировано: <span className="text-[#00f0ff] font-bold">{transformedCount}</span>
              </p>
            </div>

            <div className="bg-[#1a0e2e] border border-[#3c225e] px-6 py-3 rounded-2xl">
              <span className="text-[9px] font-black uppercase text-gray-400 block tracking-widest">Рекорд Инструктора</span>
              <span className="text-lg font-black text-amber-400">{highScore}</span>
            </div>

            <button
              onClick={startGame}
              className="px-8 py-3 bg-gradient-to-r from-[#ff4d4d] via-purple-600 to-[#00f0ff] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            >
              <RotateCcw size={14} /> Начать Заново
            </button>
          </div>
        )}

        {/* Lasers Rendering */}
        {lasers.map(l => (
          <svg key={l.id} className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <line
              x1={`${l.x1}%`}
              y1={`${l.y1}%`}
              x2={`${l.x2}%`}
              y2={`${l.y2}%`}
              stroke="url(#rainbowGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ opacity: l.alpha }}
            />
            <defs>
              <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff0000" />
                <stop offset="25%" stopColor="#ff00ff" />
                <stop offset="50%" stopColor="#00f0ff" />
                <stop offset="75%" stopColor="#00ff88" />
                <stop offset="100%" stopColor="#ffea00" />
              </linearGradient>
            </defs>
          </svg>
        ))}

        {/* Particles Rendering */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none z-15 shadow-sm"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.alpha,
              boxShadow: `0 0 8px ${p.color}`
            }}
          />
        ))}

        {/* Floating score popups */}
        {floatingScores.map(fs => (
          <motion.div
            key={fs.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -25, scale: 1.2 }}
            transition={{ duration: 0.7 }}
            className="absolute pointer-events-none z-25 font-black text-sm tracking-wider"
            style={{
              left: `${fs.x}%`,
              top: `${fs.y}%`,
              color: fs.color,
              textShadow: '0 0 10px rgba(0,0,0,0.8)'
            }}
          >
            {fs.text}
          </motion.div>
        ))}

        {/* Recruits / NATO Soldiers */}
        {isPlaying && !showWaveSummary && recruits.map(recruit => (
          <motion.div
            key={recruit.id}
            onClick={(e) => handleShootRecruit(e, recruit)}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
            style={{
              left: `${recruit.x}%`,
              top: `${recruit.y}%`,
              width: `${recruit.size}px`,
              height: `${recruit.size}px`
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <div
              className={`w-full h-full rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 border ${
                recruit.transformed
                  ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 border-white shadow-[0_0_20px_rgba(255,0,255,0.7)] animate-bounce'
                  : recruit.type === 'boss'
                  ? 'bg-amber-900/80 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : recruit.type === 'golden'
                  ? 'bg-gradient-to-tr from-amber-600 to-yellow-400 border-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-pulse'
                  : recruit.type === 'fast'
                  ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'bg-gray-800/90 border-gray-600 hover:border-[#00f0ff]'
              }`}
            >
              {!recruit.transformed && (
                <div className="absolute inset-0 rounded-2xl border border-[#00f0ff]/30 group-hover:border-[#00f0ff] animate-ping pointer-events-none" />
              )}

              <span className="text-2xl select-none">
                {recruit.transformed ? '🏳️‍🌈🪖' : recruit.type === 'boss' ? '👺' : recruit.type === 'golden' ? '👑' : recruit.type === 'fast' ? '🏃‍♂️' : '😐'}
              </span>

              <span
                className={`text-[8px] font-black uppercase tracking-tight px-1 rounded mt-0.5 max-w-[90%] truncate ${
                  recruit.transformed
                    ? 'bg-black/60 text-white font-bold'
                    : 'bg-black/40 text-gray-300'
                }`}
              >
                {recruit.transformed ? 'Солдат НАТО ✨' : recruit.name}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Achievements Card */}
      <div className="bg-[#150e24] border border-[#331c4e] p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
          <Trophy size={16} /> Тактические Достижения НАТО
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {achievements.map(ach => (
            <div
              key={ach.id}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                ach.unlocked
                  ? 'bg-[#1e1038] border-amber-500/50 text-white shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                  : 'bg-[#10081d] border-[#291740] text-gray-500 opacity-60'
              }`}
            >
              <span className="text-2xl">{ach.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-black truncate">{ach.title}</h4>
                  {ach.unlocked && <CheckCircle size={12} className="text-emerald-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-gray-400 truncate">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

