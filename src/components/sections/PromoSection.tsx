import React, { useState, useMemo } from 'react';
import { Copy, Ticket, Settings, Edit2, Trash2, ExternalLink, Check, CheckCircle2, Search, Sparkles, Filter, Gift, Zap, Share2, Award, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { ConfirmModal } from '../ui/ConfirmModal';

interface PromoSectionProps {
  lang: Language;
  handleCopy: (text: string) => void;
  promoCodes: any[];
  role?: string;
  onOpenEditor?: () => void;
  onEdit?: (promo: any) => void;
}

// Reward category detection helper
function parseRewardBadge(reward: string) {
  const lower = reward.toLowerCase();
  if (lower.includes('нефрит') || lower.includes('jade') || lower.includes('星琼') || lower.includes('нефрыт')) {
    return { icon: '💎', type: 'jade', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10 text-cyan-300' };
  }
  if (lower.includes('кредит') || lower.includes('credit') || lower.includes('信用点') || lower.includes('крэдыт')) {
    return { icon: '🪙', type: 'credits', border: 'border-amber-500/40', bg: 'bg-amber-500/10 text-amber-300' };
  }
  if (lower.includes('топливо') || lower.includes('fuel') || lower.includes('treibstoff') || lower.includes('carburant') || lower.includes('燃料') || lower.includes('паліва')) {
    return { icon: '⛽', type: 'fuel', border: 'border-orange-500/40', bg: 'bg-orange-500/10 text-orange-300' };
  }
  if (lower.includes('путеводитель') || lower.includes('guide') || lower.includes('tagebuch') || lower.includes('指南') || lower.includes('дапаможнік')) {
    return { icon: '📜', type: 'guide', border: 'border-purple-500/40', bg: 'bg-purple-500/10 text-purple-300' };
  }
  return { icon: '✨', type: 'item', border: 'border-pink-500/40', bg: 'bg-pink-500/10 text-pink-300' };
}

const PromoCard = React.memo(({ 
  promo, 
  index, 
  t, 
  lang,
  isAdmin, 
  isClaimed,
  onToggleClaim,
  handleCopy, 
  onEdit, 
  onDelete 
}: { 
  promo: any, 
  index: number, 
  t: any, 
  lang: Language,
  isAdmin: boolean, 
  isClaimed: boolean,
  onToggleClaim: (code: string) => void,
  handleCopy: (text: string) => void, 
  onEdit?: (promo: any) => void, 
  onDelete: (id: string) => void 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const loc = (ru: string, en: string) => lang === 'ru' ? ru : en;

  const onCopyClick = () => {
    handleCopy(promo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rawRewards = typeof promo.rewards === 'string' 
    ? promo.rewards 
    : (promo.rewards?.[lang] || promo.rewards?.['ru'] || promo.rewards?.['en'] || promo.reward || '');
  
  const rewardsList = rawRewards ? rawRewards.split(',').map((r: string) => r.trim()).filter(Boolean) : [];
  const hoyoRedeemUrl = `https://hsr.hoyoverse.com/gift?code=${encodeURIComponent(promo.code)}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 25, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.4, type: 'spring', stiffness: 120 }}
      whileHover={{ y: -6, scale: 1.015 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group relative bg-gradient-to-br from-[#241a35] via-[#1a1327] to-[#120d1c] p-6 sm:p-7 rounded-3xl shadow-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
        promo.isActive === false 
          ? 'border-red-500/20 opacity-60 grayscale-[0.4]' 
          : isClaimed 
            ? 'border-emerald-500/30 shadow-emerald-950/20' 
            : 'border-[#3d2b4f] hover:border-[#ff4d4d]'
      }`}
    >
      {/* Decorative Glow */}
      <motion.div 
        animate={{ 
          scale: isHovered ? [1, 1.25, 1.1] : 1,
          opacity: isHovered ? 0.7 : 0.35
        }}
        transition={{ duration: 2, repeat: isHovered ? Infinity : 0, repeatType: 'reverse' }}
        className="absolute -top-20 -right-20 w-56 h-56 bg-[#ff4d4d]/15 rounded-full blur-[50px] pointer-events-none" 
      />

      <div>
        {/* Card Header: Badge & Status */}
        <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#15101e]/80 border border-[#3d2b4f]/70 text-[10px] font-mono text-[#ff4d4d] uppercase tracking-wider font-black shadow-inner">
              <Ticket size={11} />
              <span>{t.activationCode || 'ПРОМОКОД'}</span>
            </div>

            {isClaimed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                <CheckCircle2 size={11} />
                {loc('Использован', 'Claimed')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => onEdit?.(promo)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#3d2b4f] transition-all cursor-pointer"
                  title={t.editBtn || 'Edit'}
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(promo.id); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/20 transition-all cursor-pointer"
                  title={t.deleteBtn || 'Delete'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            <button
              onClick={() => onToggleClaim(promo.code)}
              className={`p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isClaimed
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-[#15101e]/60 border-[#3d2b4f] text-gray-400 hover:text-white hover:border-[#ff4d4d]'
              }`}
              title={isClaimed ? loc('Снять отметку об активации', 'Mark as unclaimed') : loc('Отметить как активированный в игре', 'Mark as claimed in game')}
            >
              <Check size={14} className={isClaimed ? 'text-emerald-400' : 'opacity-40'} />
            </button>
          </div>
        </div>

        {/* Big Promo Code Display */}
        <div className="mb-5 relative z-10">
          <div className="flex items-baseline justify-between gap-2">
            <code className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider group-hover:text-[#ff4d4d] transition-colors drop-shadow-[0_0_12px_rgba(255,77,77,0.3)] select-all break-all">
              {promo.code}
            </code>
          </div>
          {promo.description && (
            <p className="text-xs text-gray-400 mt-1 italic">
              {promo.description}
            </p>
          )}
        </div>

        {/* Rewards Chips */}
        <div className="space-y-2 mb-6 relative z-10">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-black flex items-center gap-1.5">
            <Gift size={12} className="text-[#ff4d4d]" />
            <span>{t.rewards || 'Награды'}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {rewardsList.map((reward: string, i: number) => {
              const badge = parseRewardBadge(reward);
              return (
                <motion.span 
                  key={i} 
                  whileHover={{ scale: 1.04, y: -2 }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shadow-sm transition-all ${badge.bg} ${badge.border}`}
                >
                  <span>{badge.icon}</span>
                  <span>{reward}</span>
                </motion.span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons: Hoyoverse Redeem + Quick Copy */}
      <div className="pt-4 border-t border-[#3d2b4f]/60 flex flex-wrap items-center justify-between gap-2 relative z-10">
        <a
          href={hoyoRedeemUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ff4d4d]/10 hover:bg-[#ff4d4d]/20 border border-[#ff4d4d]/30 text-[#ff4d4d] text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
          title={loc('Активировать на официальном сайте Hoyoverse', 'Redeem on official Hoyoverse website')}
        >
          <ExternalLink size={13} />
          <span>{loc('Активировать', 'Redeem Site')}</span>
        </a>

        <motion.button 
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onCopyClick}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer ${
            copied 
              ? 'bg-emerald-500 text-[#15101e] shadow-emerald-500/30' 
              : 'bg-[#ff4d4d] text-[#15101e] hover:bg-white hover:text-[#15101e] shadow-[#ff4d4d]/20'
          }`}
          title={t.copyToClipboard || 'Copy to clipboard'}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? loc('Скопировано!', 'Copied!') : (t.copyCode || loc('Скопировать', 'Copy'))}</span>
        </motion.button>
      </div>
    </motion.div>
  );
});

export const PromoSection: React.FC<PromoSectionProps> = ({ 
  lang, 
  handleCopy, 
  promoCodes, 
  role, 
  onOpenEditor, 
  onEdit 
}) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('PromoSection');
  const [promoToDelete, setPromoToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'jade' | 'unclaimed'>('all');
  const [copiedAll, setCopiedAll] = useState(false);
  const [claimedTestCode, setClaimedTestCode] = useState('');
  const [claimFeedback, setClaimFeedback] = useState<{ status: 'success' | 'error' | 'already' | null; message: string }>({ status: null, message: '' });

  // Claimed Promo Codes in localStorage
  const [claimedCodes, setClaimedCodes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('aha_claimed_promos');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  trackRender();
  const isAdmin = role === 'admin';
  const loc = (ru: string, en: string) => lang === 'ru' ? ru : en;

  const toggleClaim = (code: string) => {
    setClaimedCodes(prev => {
      const next = prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code];
      try {
        localStorage.setItem('aha_claimed_promos', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleDelete = async () => {
    if (!promoToDelete) return;
    try {
      await deleteDoc(doc(db, 'promo_codes', promoToDelete));
      setPromoToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `promo_codes/${promoToDelete}`);
    }
  };

  // Quick In-App Code Tester / Simulator
  const handleTestRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = claimedTestCode.trim().toUpperCase();
    if (!cleanCode) return;

    const matched = promoCodes.find(p => p.code?.toUpperCase() === cleanCode);
    if (!matched) {
      setClaimFeedback({
        status: 'error',
        message: loc('❌ Неизвестный или устаревший промокод.', '❌ Unknown or expired promo code.')
      });
      return;
    }

    if (claimedCodes.includes(matched.code)) {
      setClaimFeedback({
        status: 'already',
        message: loc(`ℹ️ Промокод "${matched.code}" уже отмечен как использованный.`, `ℹ️ Promo code "${matched.code}" is already marked as claimed.`)
      });
      return;
    }

    toggleClaim(matched.code);
    const rawRewards = typeof matched.rewards === 'string' 
      ? matched.rewards 
      : (matched.rewards?.[lang] || matched.rewards?.['ru'] || matched.rewards?.['en'] || matched.reward || '');

    setClaimFeedback({
      status: 'success',
      message: loc(`🎉 Код ${matched.code} успешно активирован! Награда: ${rawRewards}`, `🎉 Code ${matched.code} claimed! Rewards: ${rawRewards}`)
    });
    setClaimedTestCode('');
    setTimeout(() => {
      setClaimFeedback({ status: null, message: '' });
    }, 6000);
  };

  // Copy all active promo codes formatted cleanly
  const handleCopyAll = () => {
    const activeList = promoCodes.filter(p => p.isActive !== false);
    const text = activeList.map(p => p.code).join('\n');
    handleCopy(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Total Stellar Jade calculation
  const totalStellarJade = useMemo(() => {
    let sum = 0;
    promoCodes.forEach(p => {
      if (p.isActive === false) return;
      const str = typeof p.rewards === 'string' ? p.rewards : JSON.stringify(p.rewards || {});
      const match = str.match(/(?:нефрит|jade|星琼|нефрыт)[^\d]*(\d+)/i) || str.match(/(\d+)[^\d]*(?:нефрит|jade|星琼|нефрыт)/i);
      if (match && match[1]) {
        sum += parseInt(match[1], 10);
      }
    });
    return sum;
  }, [promoCodes]);

  // Filtering
  const filteredPromos = useMemo(() => {
    return promoCodes.filter(promo => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = (promo.code || '').toLowerCase().includes(q);
        const descMatch = (promo.description || '').toLowerCase().includes(q);
        const rewardStr = typeof promo.rewards === 'string' ? promo.rewards : JSON.stringify(promo.rewards || '');
        const rewardMatch = rewardStr.toLowerCase().includes(q);
        if (!codeMatch && !descMatch && !rewardMatch) return false;
      }

      // Filter tabs
      if (activeFilter === 'active' && promo.isActive === false) return false;
      if (activeFilter === 'unclaimed' && claimedCodes.includes(promo.code)) return false;
      if (activeFilter === 'jade') {
        const str = typeof promo.rewards === 'string' ? promo.rewards : JSON.stringify(promo.rewards || {});
        if (!str.toLowerCase().includes('нефрит') && !str.toLowerCase().includes('jade') && !str.toLowerCase().includes('星琼') && !str.toLowerCase().includes('нефрыт')) {
          return false;
        }
      }
      return true;
    });
  }, [promoCodes, searchQuery, activeFilter, claimedCodes]);

  const claimedCount = promoCodes.filter(p => claimedCodes.includes(p.code)).length;
  const progressPercent = promoCodes.length > 0 ? Math.round((claimedCount / promoCodes.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ff4d4d]/10 flex items-center justify-center border border-[#ff4d4d]/30 text-[#ff4d4d] shadow-[0_0_25px_rgba(255,77,77,0.15)]">
              <Ticket size={28} />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                <span>{t.navPromo || 'Промокоды'}</span>
                <span className="text-xs px-2.5 py-0.5 bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40 rounded-full font-mono">
                  {promoCodes.length}
                </span>
              </h2>
              <p className="text-gray-400 font-semibold tracking-wide text-xs">
                {t.promoCodesSubtitle || loc('Актуальные коды на Звёздный Нефрит, Топливо и Кредиты', 'Active codes for Stellar Jade, Fuel and Credits')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Header Right Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleCopyAll}
            className="inline-flex items-center gap-2 bg-[#251c35] hover:bg-[#322547] text-gray-200 hover:text-white px-4 py-2.5 rounded-2xl font-black uppercase tracking-wider text-xs border border-[#3d2b4f] hover:border-[#ff4d4d] transition-all shadow-lg cursor-pointer"
            title={loc('Скопировать все активные коды в буфер обмена', 'Copy all active promo codes')}
          >
            {copiedAll ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-[#ff4d4d]" />}
            <span>{copiedAll ? loc('Все скопированы!', 'All Copied!') : loc('Скопировать все', 'Copy All')}</span>
          </motion.button>

          <a
            href="https://hsr.hoyoverse.com/gift"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#ff4d4d] hover:bg-white text-[#15101e] px-4 py-2.5 rounded-2xl font-black uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(255,77,77,0.25)] transition-all hover:scale-105 active:scale-95"
          >
            <ExternalLink size={14} />
            <span>{loc('Сайт Hoyoverse', 'Hoyoverse Site')}</span>
          </a>

          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenEditor}
              className="flex items-center gap-2 bg-[#ff4d4d]/10 hover:bg-[#ff4d4d]/20 text-[#ff4d4d] px-4 py-2.5 rounded-2xl font-black uppercase tracking-widest text-xs border border-[#ff4d4d]/30 transition-all cursor-pointer"
            >
              <Settings size={14} />
              <span>{t.manageBtn || 'Управление'}</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Summary Stats & Progress Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Stellar Jade card */}
        <div className="bg-gradient-to-br from-[#251c35] to-[#171222] p-4 sm:p-5 rounded-2xl border border-cyan-500/30 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl shrink-0">
            💎
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase font-black tracking-wider">
              {loc('Всего в кодах', 'Total In Codes')}
            </div>
            <div className="text-2xl font-black text-white">
              +{totalStellarJade} <span className="text-xs text-cyan-300 font-normal">{loc('Нефрита', 'Jade')}</span>
            </div>
          </div>
        </div>

        {/* Claimed Tracker */}
        <div className="bg-gradient-to-br from-[#251c35] to-[#171222] p-4 sm:p-5 rounded-2xl border border-emerald-500/30 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 uppercase font-black tracking-wider mb-1">
              <span>{loc('Использовано вами', 'Claimed by you')}</span>
              <span>{claimedCount} / {promoCodes.length} ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2 bg-[#15101e] rounded-full overflow-hidden border border-[#3d2b4f]">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hoyoverse Direct Auto-Sync Info */}
        <div className="bg-gradient-to-br from-[#251c35] to-[#171222] p-4 sm:p-5 rounded-2xl border border-[#3d2b4f] flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 flex items-center justify-center text-[#ff4d4d] shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-wider">
              {loc('Авто-Активация', 'Auto-Redeem')}
            </div>
            <div className="text-xs text-gray-200 font-bold leading-relaxed">
              {loc('Нажмите «Активировать» для перехода с кодом на Hoyoverse', 'Click "Redeem" for 1-click gift injection')}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Test / In-App Claim Terminal Bar */}
      <div className="bg-[#1b1427] p-4 rounded-2xl border border-[#3d2b4f] shadow-xl">
        <form onSubmit={handleTestRedeem} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={claimedTestCode}
              onChange={(e) => setClaimedTestCode(e.target.value)}
              placeholder={loc('Введите код для быстрой проверки и отметки (например, CREATIONNYMPH)...', 'Enter promo code to check and mark as claimed...')}
              className="w-full bg-[#15101e] border border-[#3d2b4f] focus:border-[#ff4d4d] rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none uppercase font-mono tracking-wider transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#ff4d4d] hover:bg-white text-[#15101e] text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shrink-0 flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            <span>{loc('Проверить / Отметить', 'Verify & Claim')}</span>
          </button>
        </form>

        {claimFeedback.status && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              claimFeedback.status === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : claimFeedback.status === 'already'
                  ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300'
                  : 'bg-red-500/15 border border-red-500/30 text-red-300'
            }`}
          >
            <span>{claimFeedback.message}</span>
          </motion.div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { id: 'all' as const, labelRu: 'Все коды', labelEn: 'All Codes', count: promoCodes.length },
            { id: 'active' as const, labelRu: 'Только активные', labelEn: 'Active Only', count: promoCodes.filter(p => p.isActive !== false).length },
            { id: 'jade' as const, labelRu: '💎 С Нефритом', labelEn: '💎 With Jade' },
            { id: 'unclaimed' as const, labelRu: 'Не использованные', labelEn: 'Unclaimed', count: promoCodes.length - claimedCount }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                activeFilter === f.id
                  ? 'bg-[#ff4d4d] border-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20'
                  : 'bg-[#1b1427] border-[#3d2b4f] text-gray-400 hover:text-white hover:border-[#ff4d4d]/50'
              }`}
            >
              <span>{loc(f.labelRu, f.labelEn)}</span>
              {f.count !== undefined && (
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-md text-[10px] ${activeFilter === f.id ? 'bg-[#15101e]/30 text-[#15101e]' : 'bg-[#15101e] text-gray-400'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={loc('Поиск по коду или награде...', 'Search by code or reward...')}
            className="w-full bg-[#1b1427] border border-[#3d2b4f] focus:border-[#ff4d4d] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Promo Codes Grid */}
      {filteredPromos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPromos.map((promo, index) => (
            <PromoCard 
              key={promo.id || promo.code}
              promo={promo}
              index={index}
              t={t}
              lang={lang}
              isAdmin={isAdmin}
              isClaimed={claimedCodes.includes(promo.code)}
              onToggleClaim={toggleClaim}
              handleCopy={handleCopy}
              onEdit={onEdit}
              onDelete={setPromoToDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#1b1427] rounded-3xl p-12 text-center border border-[#3d2b4f] space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] flex items-center justify-center mx-auto">
            <Ticket size={32} />
          </div>
          <h3 className="text-lg font-black text-white">
            {loc('Коды не найдены', 'No promo codes found')}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {loc('Попробуйте изменить параметры поиска или фильтрации.', 'Try changing your search parameters or active filters.')}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
            className="mt-2 px-4 py-2 rounded-xl bg-[#ff4d4d] text-[#15101e] text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            {loc('Сбросить фильтры', 'Reset filters')}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!promoToDelete}
        onClose={() => setPromoToDelete(null)}
        onConfirm={handleDelete}
        title={t.confirmDeletePromoTitle || "Delete Promo Code"}
        message={t.confirmDeletePromoMessage || "Are you sure you want to delete this promo code? This action cannot be undone."}
        confirmText={t.delete || "Delete"}
        cancelText={t.cancelBtn || "Cancel"}
        isDestructive={true}
      />
    </div>
  );
};
