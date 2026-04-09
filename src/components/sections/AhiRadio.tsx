import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Radio, Play, Square, Volume2, Loader2, Lock } from 'lucide-react';
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
    setStatusText(lang === 'ru' ? 'Ищу шутку...' : 'Finding a joke...');
    
    // Add a random seed to prevent caching and ensure unique jokes
    const seed = Math.floor(Math.random() * 1000000);
    // Strict prompt to prevent chain-of-thought leaks (like "Let's do something witty...")
    const prompt = lang === 'ru' 
      ? `Сгенерируй ровно одну короткую шутку на русском. ВАЖНО: Выведи ТОЛЬКО текст шутки. ЗАПРЕЩЕНО писать свои мысли, рассуждения, варианты или английские слова. БЕЗ кавычек. Уникальный номер: ${seed}`
      : `Generate exactly one short dad joke. IMPORTANT: Output ONLY the joke text. NO thinking process, NO multiple options, NO quotes. Unique ID: ${seed}`;
    
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
      setStatusText(lang === 'ru' ? 'Озвучивание...' : 'Voicing...');
      
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
      
      // Prefer Google voices as they are usually more expressive
      let voice = voices.find(v => v.lang.startsWith(targetLangPrefix) && v.name.includes('Google'));
      if (!voice) {
        voice = voices.find(v => v.lang.startsWith(targetLangPrefix));
      }
      
      if (voice) {
        utterance.voice = voice;
      }

      // Make it sound more human
      utterance.pitch = Math.random() * 0.1 + 0.95; // 0.95 to 1.05
      utterance.rate = Math.random() * 0.1 + 0.9; // 0.9 to 1.0

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
    
    setStatusText(lang === 'ru' ? 'Думаю...' : 'Thinking...');
    
    // Add a 2.5-second pause to simulate thinking and give a break between jokes
    setTimeout(async () => {
      if (!isPlayingRef.current) return;
      
      const nextJoke = await generateSingleJoke();
      
      if (nextJoke && isPlayingRef.current) {
        setCurrentJoke(nextJoke);
        setStatusText(lang === 'ru' ? 'Воспроизведение...' : 'Playing...');
        await playJokeTTS(nextJoke);
      } else if (isPlayingRef.current) {
        setIsPlaying(false);
        setStatusText(lang === 'ru' ? 'Ошибка радио' : 'Radio Error');
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
      setStatusText(lang === 'ru' ? 'Радио выключено' : 'Radio off');
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
          setStatusText(lang === 'ru' ? 'Воспроизведение...' : 'Playing...');
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
    // Load voices early
    window.speechSynthesis.getVoices();
    
    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 bg-[#2F244F]/40 rounded-3xl border border-[#5C4B8B]/30">
        <div className="w-20 h-20 bg-[#C3A6E6]/10 rounded-full flex items-center justify-center border border-[#C3A6E6]/20">
          <Lock className="w-10 h-10 text-[#C3A6E6]" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {lang === 'ru' ? 'Радиостанция Ахи' : 'Aha Radio Station'}
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {lang === 'ru' 
              ? 'Доступ к самым несмешным шуткам во вселенной возможен только после авторизации через Google.' 
              : 'Access to the least funny jokes in the universe is only available after logging in with Google.'}
          </p>
        </div>
        <button
          onClick={loginWithGoogle}
          className="bg-[#C3A6E6] text-[#2F244F] px-8 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-white transition-colors shadow-[0_0_30px_rgba(195,166,230,0.3)]"
        >
          {lang === 'ru' ? 'Войти через Google' : 'Login with Google'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-[#2F244F]/40 rounded-3xl border border-[#5C4B8B]/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C3A6E6]/10 rounded-full blur-3xl transition-opacity duration-1000 ${isPlaying ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center justify-center gap-3">
            <Radio className={`w-8 h-8 sm:w-10 sm:h-10 ${isPlaying ? 'text-[#C3A6E6] animate-pulse' : 'text-gray-500'}`} />
            {lang === 'ru' ? 'Радиостанция Ахи' : 'Aha Radio Station'}
          </h2>
          <p className="text-gray-400">
            {lang === 'ru' ? 'Самые несмешные шутки во вселенной' : 'The least funny jokes in the universe'}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={toggleRadio}
            disabled={isLoading}
            className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center transition-all duration-500 ${
              isPlaying 
                ? 'bg-[#C3A6E6] text-[#2F244F] shadow-[0_0_50px_rgba(195,166,230,0.5)] scale-105' 
                : 'bg-[#3E3160] text-gray-400 hover:bg-[#4a3b73] hover:text-white border-2 border-[#5C4B8B]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <Loader2 className="w-12 h-12 animate-spin" />
            ) : isPlaying ? (
              <Square className="w-12 h-12 fill-current" />
            ) : (
              <Play className="w-12 h-12 fill-current ml-2" />
            )}
          </button>
          
          {isPlaying && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [10, 24, 10] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                  className="w-1.5 bg-[#C3A6E6] rounded-full"
                />
              ))}
            </div>
          )}
        </div>

        <div className="h-20 flex flex-col items-center justify-center">
          {isPlaying && currentJoke && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={currentJoke}
              className="text-lg sm:text-xl font-medium text-white max-w-2xl italic"
            >
              "{currentJoke}"
            </motion.div>
          )}
          <div className="text-sm text-[#C3A6E6] mt-4 font-mono uppercase tracking-widest flex items-center gap-2">
            {isPlaying && <Volume2 className="w-4 h-4" />}
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
};
