import { Language } from '../data/translations';

export const CATEGORY_MAP: Record<string, Record<Language, string>> = {
  lore: {
    ru: 'Лор',
    en: 'Lore',
    by: 'Лор',
    de: 'Lore',
    fr: 'Lore',
    zh: '剧情'
  },
  characters: {
    ru: 'Персонажи',
    en: 'Characters',
    by: 'Персанажы',
    de: 'Charaktere',
    fr: 'Personnages',
    zh: '角色'
  },
  character: {
    ru: 'Персонажи',
    en: 'Characters',
    by: 'Персанажы',
    de: 'Charaktere',
    fr: 'Personnages',
    zh: '角色'
  },
  gameplay: {
    ru: 'Геймплей',
    en: 'Gameplay',
    by: 'Геймплэй',
    de: 'Gameplay',
    fr: 'Gameplay',
    zh: '玩法'
  },
  infrastructure: {
    ru: 'Инфраструктура',
    en: 'Infrastructure',
    by: 'Інфраструктура',
    de: 'Infrastruktur',
    fr: 'Infrastructure',
    zh: '基础架构'
  },
  updates: {
    ru: 'Обновления',
    en: 'Updates',
    by: 'Абнаўленні',
    de: 'Updates',
    fr: 'Mises à jour',
    zh: '更新'
  },
  personal: {
    ru: 'Личное',
    en: 'Personal',
    by: 'Асобістае',
    de: 'Persönlich',
    fr: 'Personnel',
    zh: '个人'
  },
  general: {
    ru: 'Общее',
    en: 'General',
    by: 'Агульнае',
    de: 'Allgemein',
    fr: 'Général',
    zh: '综合'
  },
  memes: {
    ru: 'Мемы',
    en: 'Memes',
    by: 'Мемы',
    de: 'Memes',
    fr: 'Mèmes',
    zh: '梗/表情包'
  },
  theories: {
    ru: 'Теории',
    en: 'Theories',
    by: 'Тэорыі',
    de: 'Theorien',
    fr: 'Théories',
    zh: '理论'
  },
  favorites: {
    ru: 'Избранное',
    en: 'Favorites',
    by: 'Выбранае',
    de: 'Favoriten',
    fr: 'Favoris',
    zh: '收藏'
  }
};

/**
 * Returns localized category name for display.
 */
export function getLocalizedCategory(category: string | undefined | null, lang: Language = 'ru'): string {
  if (!category) {
    return CATEGORY_MAP.general[lang] || 'Общее';
  }
  const key = category.trim().toLowerCase();
  if (CATEGORY_MAP[key] && CATEGORY_MAP[key][lang]) {
    return CATEGORY_MAP[key][lang];
  }
  // Capitalize first letter if not found in dictionary
  return category.charAt(0).toUpperCase() + category.slice(1);
}
