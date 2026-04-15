import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Play, Square, Volume2, Loader2, Lock, SkipForward, Disc, Music } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';

interface AhiRadioProps {
  lang: Language;
}

export const AhiRadio: React.FC<AhiRadioProps> = ({ lang }) => {
  const { user, loginWithGoogle } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [currentJoke, setCurrentJoke] = useState('');
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const t = translations[lang];

  const generateSingleJoke = async () => {
    setStatusText(t.radioFindingJoke);
    
    // Add a random seed to prevent caching and ensure unique jokes
    const seed = Math.floor(Math.random() * 1000000);
    
    const topicsRu = ['про животных', 'про работу', 'про технологии', 'про еду', 'про отношения', 'про спорт', 'про путешествия', 'абсурдную', 'про космос', 'про врачей', 'про школу', 'про студентов', 'про программистов', 'про музыку', 'про кино', 'про историю', 'про будущее', 'про инопланетян', 'про роботов', 'про супергероев'];
    const topicsEn = ['about animals', 'about work', 'about technology', 'about food', 'about relationships', 'about sports', 'about travel', 'absurd', 'about space', 'about doctors', 'about school', 'about students', 'about programmers', 'about music', 'about movies', 'about history', 'about the future', 'about aliens', 'about robots', 'about superheroes'];
    const topic = lang === 'ru' ? topicsRu[Math.floor(Math.random() * topicsRu.length)] : topicsEn[Math.floor(Math.random() * topicsEn.length)];

    // Strict prompt to prevent chain-of-thought leaks (like "Let's do something witty...")
    const prompt = lang === 'ru' 
      ? `Сгенерируй ровно одну короткую, смешную шутку на тему: ${topic}. ВАЖНО: Выведи ТОЛЬКО текст шутки. ЗАПРЕЩЕНО писать свои мысли, рассуждения, варианты или английские слова. БЕЗ кавычек. Уникальный номер: ${seed}`
      : `Generate exactly one short, funny joke about: ${topic}. IMPORTANT: Output ONLY the joke text. NO thinking process, NO multiple options, NO quotes. Unique ID: ${seed}`;
    
    // Use a specific model that is less prone to chain-of-thought leaks if possible, or just rely on the strict prompt
    const targetUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${seed}&model=openai`;
    
    // Advanced proxy list that handles different response formats to bypass CORS
    const proxyList = [
      {
        url: (target: string) => target, // 1. Direct connection
        parse: async (res: Response) => res.text()
      },
      {
        url: (target: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`, // 2. AllOrigins (JSON mode bypasses CORS)
        parse: async (res: Response) => {
          const data = await res.json();
          return data.contents;
        }
      },
      {
        url: (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`, // 3. CodeTabs Proxy
        parse: async (res: Response) => res.text()
      }
    ];

    let lastError = null;

    for (const proxy of proxyList) {
      try {
        const proxiedUrl = proxy.url(targetUrl);
        const response = await fetch(proxiedUrl);
        
        // If we hit rate limits or header errors, try the next proxy
        if (response.status === 429 || response.status === 431 || response.status === 403) {
          console.warn(`Endpoint returned ${response.status}, switching proxy...`);
          continue;
        }
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        let text = await proxy.parse(response);
        
        if (text && text.trim().length > 0) {
          // Cleanup common hallucination artifacts
          text = text.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
          
          // If the text is suspiciously long, it's likely a chain-of-thought leak.
          // We'll try to extract just the last quoted part, or fallback.
          if (text.length > 250) {
            const quotes = text.match(/"([^"]+)"/g);
            if (quotes && quotes.length > 0) {
              // Take the last quote, assuming it's the final chosen joke
              text = quotes[quotes.length - 1].replace(/"/g, '');
            } else {
               throw new Error("Text too long, likely hallucination");
            }
          }
          
          return text.trim();
        }
      } catch (error) {
        console.warn('Proxy attempt failed:', error);
        lastError = error;
      }
    }

    console.error('All proxies failed, using local fallback:', lastError);
    
    // Local fallback array if all network requests fail (e.g. strict rate limit)
    const fallbackRu = [
      "Колобок повесился.",
      "Русалка села на шпагат.",
      "Купил мужик шляпу, а она ему как раз.",
      "Буратино утонул.",
      "Шел медведь по лесу, видит машина горит. Сел в нее и сгорел.",
      "Приходит программист к окулисту. Тот говорит: «Закройте правый глаз, теперь левый». Программист: «А можно я просто монитор выключу?»",
      "Заходит улитка в бар и говорит: «Можно мне виски с колой?» Бармен отвечает: «Мы улиткам не наливаем!» и вышвыривает её. Через месяц улитка возвращается и спрашивает: «Ну и зачем ты это сделал?»"
    ];
    const fallbackEn = [
      "Why did the chicken cross the road? To get to the other side.",
      "What do you call a fake noodle? An impasta.",
      "Why don't skeletons fight each other? They don't have the guts.",
      "What do you call cheese that isn't yours? Nacho cheese.",
      "Why did the scarecrow win an award? Because he was outstanding in his field."
    ];
    
    const fallbacks = lang === 'ru' ? fallbackRu : fallbackEn;
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  };

  const playJokeTTS = async (jokeText: string) => {
    try {
      setStatusText(t.radioVoicing);
      
      // Sanitize text for TTS: remove emojis, markdown, and ensure it ends with punctuation
      let cleanJoke = jokeText
        .replace(/[*_~`]/g, '')
        .replace(/[^\p{L}\p{N}\s.,!?\-:;'"()]/gu, '') // Keep only letters, numbers, spaces, and basic punctuation
        .trim();
        
      if (!cleanJoke || cleanJoke === '.') {
        console.warn('TTS: Joke was empty after sanitization, skipping.');
        if (isPlayingRef.current) {
          handleNextJoke();
        }
        return;
      }

      if (!cleanJoke.match(/[.!?]$/)) {
        cleanJoke += '.';
      }

      // Cancel any ongoing speech
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
      
      // Unstick the TTS engine (fixes some browser bugs where it gets stuck in paused state)
      window.speechSynthesis.resume();

      // Small delay to allow cancel to process (fixes some browser bugs)
      await new Promise(resolve => setTimeout(resolve, 50));

      const utterance = new SpeechSynthesisUtterance(cleanJoke);
      utteranceRef.current = utterance; // Prevent garbage collection

      const targetLang = lang === 'ru' ? 'ru-RU' : 'en-US';
      utterance.lang = targetLang;
      
      // Try to find a voice that matches the language
      const voices = window.speechSynthesis.getVoices();
      const targetLangPrefix = targetLang.split('-')[0];
      
      const availableVoices = voices.filter(v => v.lang.startsWith(targetLangPrefix));
      
      if (availableVoices.length > 0) {
        // Pick a random voice from the available ones for the language
        const randomVoice = availableVoices[Math.floor(Math.random() * availableVoices.length)];
        utterance.voice = randomVoice;
      }

      // Make it sound more human with wider variations
      utterance.pitch = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
      utterance.rate = Math.random() * 0.2 + 0.9; // 0.9 to 1.1

      utterance.onend = () => {
        if (isPlayingRef.current) {
          handleNextJoke();
        }
      };

      utterance.onerror = (e) => {
        console.error('TTS Error:', e.error, e);
        if (e.error === 'canceled' || e.error === 'interrupted') return;
        
        // Only proceed to next joke if we are still playing (prevents infinite error loops)
        if (isPlayingRef.current) {
           setTimeout(handleNextJoke, 1000);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error with TTS:', error);
      if (isPlayingRef.current) {
        setTimeout(handleNextJoke, 1000);
      }
    }
  };

  const handleNextJoke = async () => {
    if (!isPlayingRef.current) return;
    
    setStatusText(t.radioThinking);
    
    // Add a 2.5-second pause to simulate thinking and give a break between jokes
    setTimeout(async () => {
      if (!isPlayingRef.current) return;
      
      const nextJoke = await generateSingleJoke();
      
      if (nextJoke && isPlayingRef.current) {
        setCurrentJoke(nextJoke);
        setStatusText(t.radioPlaying);
        await playJokeTTS(nextJoke);
      } else if (isPlayingRef.current) {
        setIsPlaying(false);
        setStatusText(t.radioError);
      }
    }, 2500);
  };

  const toggleRadio = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
      setStatusText(t.radioOff);
      setCurrentJoke('');
    } else {
      // Synchronously unlock speech synthesis on user interaction
      window.speechSynthesis.resume(); // Unstick the engine
      const unlockUtterance = new SpeechSynthesisUtterance(' '); // Space instead of empty string
      unlockUtterance.volume = 0;
      window.speechSynthesis.speak(unlockUtterance);

      setIsPlaying(true);
      setIsLoading(true);
      
      try {
        const firstJoke = await generateSingleJoke();
        
        if (firstJoke && isPlayingRef.current) {
          setCurrentJoke(firstJoke);
          setStatusText(t.radioPlaying);
          await playJokeTTS(firstJoke);
        }
      } catch (error) {
        console.error('Error starting radio:', error);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Load voices early if supported
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
    
    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 bg-[#15101e]/40 rounded-3xl border border-[#3d2b4f]/30">
        <div className="w-20 h-20 bg-[#ff4d4d]/10 rounded-full flex items-center justify-center border border-[#ff4d4d]/20">
          <Lock className="w-10 h-10 text-[#ff4d4d]" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {(t as any).radioTitle || t.siteName}
          </h3>
          <p className="text-white/40 max-w-md mx-auto">
            {(t as any).radioAuthRequired || "Access to the most unfunny jokes in the universe is only possible after logging in with Google."}
          </p>
        </div>
        <button
          onClick={loginWithGoogle}
          className="bg-[#ff4d4d] text-[#15101e] px-8 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-white transition-colors shadow-[0_0_30px_rgba(255,77,77,0.3)]"
        >
          {t.loginWithGoogle}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-[#0d0b14] to-[#15101e] rounded-[2.5rem] border border-[#3d2b4f]/40 relative overflow-hidden shadow-2xl">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-[#ff4d4d]/10 rounded-full blur-[100px] transition-all duration-1000 ${isPlaying ? 'opacity-100 scale-110' : 'opacity-30 scale-90'}`} />
        
        {/* Floating music notes when playing */}
        <AnimatePresence>
          {isPlaying && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 50, x: -50 }}
                animate={{ opacity: [0, 0.5, 0], y: -100, x: -100 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/4 left-1/4"
              >
                <Music className="w-8 h-8 text-[#ff4d4d]/30" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 50, x: 50 }}
                animate={{ opacity: [0, 0.5, 0], y: -150, x: 100 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
                className="absolute top-1/3 right-1/4"
              >
                <Music className="w-6 h-6 text-[#ff4d4d]/20" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10 bg-[#0d0b14]/50 px-6 py-3 rounded-full border border-[#3d2b4f]/30 backdrop-blur-sm">
          <Radio className={`w-5 h-5 ${isPlaying ? 'text-[#ff4d4d] animate-pulse' : 'text-white/40'}`} />
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
            {(t as any).radioTitle || t.siteName}
          </h2>
        </div>

        {/* Player Core */}
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 w-full">
          
          {/* Vinyl Record / Album Art Area */}
          <div className="relative shrink-0 mb-8 md:mb-0">
            <motion.div 
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center border-4 border-[#0d0b14] shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden ${isPlaying ? 'bg-[#15101e]' : 'bg-[#0d0b14]'}`}
            >
              {/* Vinyl grooves */}
              <div className="absolute inset-0 rounded-full border-[1px] border-white/5 m-2"></div>
              <div className="absolute inset-0 rounded-full border-[1px] border-white/5 m-6"></div>
              <div className="absolute inset-0 rounded-full border-[1px] border-white/5 m-10"></div>
              <div className="absolute inset-0 rounded-full border-[1px] border-white/5 m-14"></div>
              
              {/* Center label */}
              <div className="w-20 h-20 bg-gradient-to-br from-[#ff4d4d] to-[#3d2b4f] rounded-full flex items-center justify-center shadow-inner relative z-10">
                <div className="w-4 h-4 bg-[#0d0b14] rounded-full shadow-inner"></div>
                <Disc className="absolute w-10 h-10 text-white/20" />
              </div>
            </motion.div>
            
            {/* Playback Controls Overlay */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#0d0b14] p-2 rounded-full border border-[#3d2b4f]/50 shadow-xl z-20">
              <button
                onClick={toggleRadio}
                disabled={isLoading}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isPlaying 
                    ? 'bg-[#ff4d4d] text-[#15101e] shadow-[0_0_20px_rgba(255,77,77,0.4)] hover:scale-105' 
                    : 'bg-[#251c35] text-white hover:bg-[#ff4d4d] hover:text-[#15101e]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isPlaying ? (
                  <Square className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </button>
              
              {isPlaying && (
                <button
                  onClick={handleNextJoke}
                  disabled={isLoading || statusText.includes(t.radioThinking || 'Thinking')}
                  className="w-10 h-10 rounded-full bg-[#15101e] text-white/40 hover:text-white hover:bg-[#251c35] flex items-center justify-center transition-all disabled:opacity-50"
                  title={t.radioNextJoke}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Text & Status Area */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full mt-8 md:mt-0">
            <div className="mb-4">
              <p className="text-xs font-bold text-[#ff4d4d] uppercase tracking-widest mb-1">
                {t.radioNowPlaying}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {t.radioAiStandup}
              </h3>
            </div>

            <div className="bg-[#0d0b14]/60 border border-[#3d2b4f]/30 rounded-2xl p-5 w-full min-h-[8rem] flex flex-col justify-center relative">
              {isPlaying && currentJoke ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={currentJoke}
                  className="text-sm sm:text-base font-medium text-white/90 italic leading-relaxed"
                >
                  "{currentJoke}"
                </motion.div>
              ) : (
                <div className="text-white/40 text-sm italic flex items-center justify-center md:justify-start gap-2">
                  {isPlaying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.radioPreparing}
                    </>
                  ) : (
                    t.radioPressPlay
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-wider bg-[#0d0b14] px-3 py-1.5 rounded-lg border border-[#3d2b4f]/30">
                {isPlaying ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#ff4d4d]" />
                    <span className="text-[#ff4d4d]">{statusText}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 opacity-50" />
                    <span>{t.radioOffline}</span>
                  </>
                )}
              </div>

              {/* Visualizer bars */}
              <div className="flex gap-1 items-end h-6">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={isPlaying ? { height: [4, 20, 4] } : { height: 4 }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                    className={`w-1.5 rounded-full ${isPlaying ? 'bg-[#ff4d4d]' : 'bg-[#3d2b4f]/50'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
