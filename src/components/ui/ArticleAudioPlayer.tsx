import React from 'react';
import { Play, Pause, Square, Volume2, Sparkles } from 'lucide-react';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { Language } from '../../data/translations';

interface ArticleAudioPlayerProps {
  title: string;
  content: string;
  summary?: string;
  lang: Language;
  className?: string;
}

export const ArticleAudioPlayer: React.FC<ArticleAudioPlayerProps> = ({
  title,
  content,
  summary,
  lang,
  className = ''
}) => {
  const tts = useTextToSpeech({ lang });

  if (!tts.isSupported) {
    return null;
  }

  const fullTextToRead = summary ? `${summary}. ${content}` : content;

  const getLabel = () => {
    if (!tts.isPlaying) {
      switch (lang) {
        case 'ru': return 'Слушать';
        case 'by': return 'Слухаць';
        case 'de': return 'Anhören';
        case 'fr': return 'Écouter';
        case 'zh': return '朗读';
        default: return 'Listen';
      }
    } else if (tts.isPaused) {
      switch (lang) {
        case 'ru': return 'Продолжить';
        case 'by': return 'Працягнуць';
        case 'de': return 'Fortsetzen';
        case 'fr': return 'Reprendre';
        case 'zh': return '继续';
        default: return 'Resume';
      }
    } else {
      switch (lang) {
        case 'ru': return 'Пауза';
        case 'by': return 'Паўза';
        case 'de': return 'Pause';
        case 'fr': return 'Pause';
        case 'zh': return '暂停';
        default: return 'Pause';
      }
    }
  };

  const cycleRate = () => {
    const rates = [1, 1.25, 1.5, 0.8];
    const currentIndex = rates.indexOf(tts.rate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    tts.changeRate(nextRate);
  };

  return (
    <div className={`inline-flex items-center gap-1.5 p-1 rounded-2xl bg-[#3d2b4f]/30 border border-[#3d2b4f]/60 ${className}`}>
      {/* Play / Pause Toggle Button */}
      <button
        onClick={() => tts.togglePlayPause(fullTextToRead, title)}
        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95 ${
          tts.isPlaying && !tts.isPaused
            ? 'bg-[#ff4d4d] text-[#15101e] shadow-[0_0_15px_rgba(255,77,77,0.4)]'
            : tts.isPaused
            ? 'bg-amber-500 text-[#15101e] shadow-md'
            : 'text-purple-300 hover:text-white hover:bg-purple-500/20'
        }`}
        title={getLabel()}
      >
        {tts.isPlaying && !tts.isPaused ? (
          <>
            <Pause size={16} className="animate-pulse fill-current" />
            <span className="hidden sm:inline uppercase tracking-wider">{getLabel()}</span>
            {/* Animated Equalizer Waves */}
            <span className="flex items-end gap-0.5 h-3 ml-0.5">
              <span className="w-0.5 h-full bg-[#15101e] animate-[bounce_0.6s_infinite_100ms] rounded-full" />
              <span className="w-0.5 h-2/3 bg-[#15101e] animate-[bounce_0.6s_infinite_300ms] rounded-full" />
              <span className="w-0.5 h-full bg-[#15101e] animate-[bounce_0.6s_infinite_200ms] rounded-full" />
            </span>
          </>
        ) : tts.isPaused ? (
          <>
            <Play size={16} className="fill-current" />
            <span className="hidden sm:inline uppercase tracking-wider">{getLabel()}</span>
          </>
        ) : (
          <>
            <Volume2 size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="uppercase tracking-wider">{getLabel()}</span>
          </>
        )}
      </button>

      {/* Stop & Speed controls when active */}
      {tts.isPlaying && (
        <>
          <button
            onClick={tts.stop}
            className="p-2.5 rounded-xl text-white/50 hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-all cursor-pointer active:scale-95"
            title={lang === 'ru' ? 'Остановить' : 'Stop'}
          >
            <Square size={14} className="fill-current" />
          </button>

          <button
            onClick={cycleRate}
            className="px-2 py-1 rounded-lg text-[10px] font-black tracking-widest text-purple-300 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/30 transition-all cursor-pointer"
            title={lang === 'ru' ? 'Скорость воспроизведения' : 'Playback Speed'}
          >
            {tts.rate}x
          </button>
        </>
      )}
    </div>
  );
};
