import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations } from './data/translations';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: Object.keys(translations).reduce((acc, lang) => {
      acc[lang] = { translation: translations[lang as keyof typeof translations] };
      return acc;
    }, {} as any),
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
