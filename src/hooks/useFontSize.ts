import { useState, useEffect } from 'react';

export type FontSizeLevel = 'small' | 'normal' | 'large' | 'xlarge';

export interface FontSizePreset {
  id: FontSizeLevel;
  percentage: number;
  labelRu: string;
  labelEn: string;
}

export const FONT_SIZE_PRESETS: FontSizePreset[] = [
  { id: 'small', percentage: 90, labelRu: 'Мелкий (90%)', labelEn: 'Small (90%)' },
  { id: 'normal', percentage: 100, labelRu: 'Обычный (100%)', labelEn: 'Normal (100%)' },
  { id: 'large', percentage: 112, labelRu: 'Крупный (112%)', labelEn: 'Large (112%)' },
  { id: 'xlarge', percentage: 125, labelRu: 'Очень крупный (125%)', labelEn: 'Extra Large (125%)' },
];

const STORAGE_KEY = 'aha_reading_font_size';

export function applyFontSizeToDocument(percentage: number) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = `${percentage}%`;
    document.documentElement.setAttribute('data-font-size-scale', `${percentage}`);
    window.dispatchEvent(new CustomEvent('aha_font_size_changed', { detail: percentage }));
  }
}

export function useFontSize() {
  const [fontSizePercent, setFontSizePercent] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 80 && parsed <= 150) {
          return parsed;
        }
      }
    }
    return 100;
  });

  useEffect(() => {
    applyFontSizeToDocument(fontSizePercent);
  }, [fontSizePercent]);

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === 'number') {
        setFontSizePercent(customEvent.detail);
      }
    };
    window.addEventListener('aha_font_size_changed', handleEvent);
    return () => {
      window.removeEventListener('aha_font_size_changed', handleEvent);
    };
  }, []);

  const setFontSize = (newPercent: number) => {
    const clamped = Math.min(150, Math.max(80, newPercent));
    setFontSizePercent(clamped);
    localStorage.setItem(STORAGE_KEY, clamped.toString());
    applyFontSizeToDocument(clamped);
  };

  const increaseFontSize = () => {
    setFontSize(Math.min(150, fontSizePercent + 10));
  };

  const decreaseFontSize = () => {
    setFontSize(Math.max(80, fontSizePercent - 10));
  };

  const resetFontSize = () => {
    setFontSize(100);
  };

  return {
    fontSizePercent,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    presets: FONT_SIZE_PRESETS,
  };
}
