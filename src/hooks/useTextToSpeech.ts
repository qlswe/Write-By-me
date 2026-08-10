import { useState, useEffect, useRef, useCallback } from 'react';
import { Language } from '../data/translations';

export interface UseTextToSpeechOptions {
  lang: Language;
}

export function useTextToSpeech(options: UseTextToSpeechOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRateState] = useState<number>(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  
  const currentTextRef = useRef<string>('');

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  // Clean stop on unmount
  useEffect(() => {
    return () => {
      if (isSupported && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const getLanguageTag = (lang: Language): string => {
    switch (lang) {
      case 'ru': return 'ru-RU';
      case 'en': return 'en-US';
      case 'by': return 'be-BY';
      case 'de': return 'de-DE';
      case 'fr': return 'fr-FR';
      case 'zh': return 'zh-CN';
      default: return 'en-US';
    }
  };

  const findBestVoice = useCallback((lang: Language): SpeechSynthesisVoice | null => {
    if (!voices.length) return null;
    const targetLang = getLanguageTag(lang).toLowerCase().split('-')[0]; // e.g. 'ru'
    const targetFull = getLanguageTag(lang).toLowerCase(); // e.g. 'ru-ru'

    // 1. Exact match (e.g. ru-RU)
    let match = voices.find(v => v.lang.toLowerCase().replace('_', '-') === targetFull);
    if (match) return match;

    // 2. Language prefix match (e.g. ru)
    match = voices.find(v => v.lang.toLowerCase().startsWith(targetLang));
    if (match) return match;

    // 3. Fallback for Belarusian to Russian if no Belarusian voice exists
    if (lang === 'by') {
      match = voices.find(v => v.lang.toLowerCase().startsWith('ru'));
      if (match) return match;
    }

    return null;
  }, [voices]);

  const speak = useCallback((htmlOrMarkdownContent: string, title?: string) => {
    if (!isSupported) {
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: 'Text-To-Speech is not supported in this browser' }));
      return;
    }

    window.speechSynthesis.cancel();

    // Strip HTML tags and markdown formatting to get clean speakable text
    let cleanText = htmlOrMarkdownContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/#+/g, '')
      .replace(/[*_~`]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (title) {
      cleanText = `${title}. ${cleanText}`;
    }

    if (!cleanText) {
      window.dispatchEvent(new CustomEvent('aha_toast', { detail: 'No text available to read aloud' }));
      return;
    }

    currentTextRef.current = cleanText;

    // SpeechSynthesis max length per utterance bug workaround: split by sentences if very long
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.lang = getLanguageTag(options.lang);

    const bestVoice = findBestVoice(options.lang);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, options.lang, rate, findBestVoice]);

  const pause = useCallback(() => {
    if (isSupported && isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isPlaying, isPaused]);

  const resume = useCallback(() => {
    if (isSupported && isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported, isPlaying, isPaused]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [isSupported]);

  const togglePlayPause = useCallback((content: string, title?: string) => {
    if (!isPlaying) {
      speak(content, title);
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPlaying, isPaused, speak, resume, pause]);

  const changeRate = useCallback((newRate: number) => {
    setRateState(newRate);
    if (isPlaying) {
      // Re-trigger speech at new rate if currently playing
      stop();
      setTimeout(() => {
        if (currentTextRef.current) {
          speak(currentTextRef.current);
        }
      }, 50);
    }
  }, [isPlaying, stop, speak]);

  return {
    isSupported,
    isPlaying,
    isPaused,
    rate,
    speak,
    pause,
    resume,
    stop,
    togglePlayPause,
    changeRate
  };
}
