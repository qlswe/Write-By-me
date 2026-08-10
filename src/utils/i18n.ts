import { Language, translations } from '../data/translations';

export type LocalizedMap = Record<Language, string>;

export interface MultiLangText {
  ru: string;
  en: string;
  by?: string;
  de?: string;
  fr?: string;
  zh?: string;
}

export function loc(textObj: MultiLangText, lang: Language): string {
  if (!textObj) return '';
  if (textObj[lang]) return textObj[lang]!;
  if (lang === 'by' && textObj.ru) return textObj.ru; // or fallback
  return textObj.ru || textObj.en || '';
}

export function getT(lang: Language) {
  const t = translations[lang] || translations.en;
  return (key: keyof typeof translations.ru, fallback?: string): string => {
    return (t as any)[key] || (translations.en as any)[key] || fallback || (key as string);
  };
}
