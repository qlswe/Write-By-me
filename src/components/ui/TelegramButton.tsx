import React from 'react';
import { Send, ExternalLink, Sparkles } from 'lucide-react';
import { Language } from '../../data/translations';

interface TelegramButtonProps {
  lang?: Language;
  variant?: 'full' | 'compact' | 'pill' | 'card';
  className?: string;
  channelUrl?: string;
  handle?: string;
}

export const TelegramButton: React.FC<TelegramButtonProps> = ({
  lang = 'ru',
  variant = 'compact',
  className = '',
  channelUrl = 'https://t.me/radio_aha',
  handle = '@radio_aha'
}) => {
  if (variant === 'card') {
    return (
      <a
        href={channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative overflow-hidden flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#1c2e42] via-[#1a3854] to-[#0e273f] border border-[#229ED9]/40 hover:border-[#229ED9] transition-all shadow-lg hover:shadow-[0_0_30px_rgba(34,158,217,0.35)] cursor-pointer ${className}`}
      >
        {/* Glow backdrop effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#229ED9]/20 rounded-full blur-2xl group-hover:bg-[#229ED9]/40 transition-all pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-[#0088cc] to-[#229ED9] text-white shadow-md group-hover:scale-110 transition-transform">
            <Send size={22} className="-rotate-12 translate-x-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-wide">
                {lang === 'ru' ? 'Telegram Канал' : 'Telegram Channel'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#229ED9]/20 text-[#229ED9] border border-[#229ED9]/30">
                LIVE
              </span>
            </div>
            <p className="text-xs text-cyan-200/70 font-mono mt-0.5">
              {handle} • {lang === 'ru' ? 'Новости, релизы и сообщество' : 'News, releases & community'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#229ED9]/20 group-hover:bg-[#229ED9] text-[#229ED9] group-hover:text-white font-bold text-xs transition-all relative z-10 shrink-0">
          <span>{lang === 'ru' ? 'Подписаться' : 'Join Channel'}</span>
          <ExternalLink size={14} />
        </div>
      </a>
    );
  }

  if (variant === 'pill' || variant === 'full') {
    return (
      <a
        href={channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0088cc] to-[#229ED9] hover:from-[#229ED9] hover:to-[#0088cc] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-[0_0_20px_rgba(34,158,217,0.5)] transition-all transform hover:-translate-y-0.5 cursor-pointer ${className}`}
      >
        <Send size={15} className="-rotate-12" />
        <span>Telegram</span>
        <span className="text-[10px] opacity-80 font-mono">({handle})</span>
      </a>
    );
  }

  // Compact default button
  return (
    <a
      href={channelUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#229ED9]/15 hover:bg-[#229ED9] text-[#229ED9] hover:text-white border border-[#229ED9]/30 hover:border-[#229ED9] font-bold text-xs transition-all shadow-sm hover:shadow-[0_0_15px_rgba(34,158,217,0.4)] cursor-pointer ${className}`}
      title={lang === 'ru' ? 'Официальный Telegram-канал Министерства Ахахи' : 'Official Telegram Channel'}
    >
      <Send size={14} className="-rotate-12" />
      <span>Telegram</span>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
    </a>
  );
};
