import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Zap, RefreshCw, Star, Shield, Trophy, Dice5, History, 
  Volume2, VolumeX, Flame, Award, HelpCircle, CheckCircle2, 
  ChevronRight, Lock, Gift, Key, BookOpen, MessageSquare, Palette,
  Info, AlertCircle, ArrowRight, Eye, Play
} from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { safeStorage } from '../../utils/securityStorage';
import { soundEngine } from '../../utils/audioSynth';
import { turboEngine } from '../../utils/turboEngine';
import { gamificationEngine } from '../../utils/gamification';

interface WarpSectionProps {
  lang: Language;
}

export interface WarpItem {
  id: string;
  name: { [key in Language]?: string };
  title: { [key in Language]?: string };
  rarity: 3 | 4 | 5;
  path: string;
  element: 'Quantum' | 'Imaginary' | 'Lightning' | 'Wind' | 'Fire' | 'Physical';
  elementColor: string;
  quote: { [key in Language]?: string };
  desc: { [key in Language]?: string };
  skill: { [key in Language]?: string };
  type: 'character' | 'lightcone';
  color: string;
  iconSymbol: string;
}

export interface AhaQuest {
  id: string;
  title: { [key in Language]?: string };
  description: { [key in Language]?: string };
  reward: number;
  category: 'daily' | 'cosmic' | 'elation';
  icon: string;
  progress: number;
  target: number;
  claimed: boolean;
  type: 'theories' | 'chat' | 'turbo' | 'canvas' | 'relic' | 'quiz' | 'code' | 'warp_count';
}

const WARP_POOL: WarpItem[] = [
  // 5★ Characters
  {
    id: 'aha_aeon',
    name: { ru: 'Аха — Эон Радости', en: 'Aha — Aeon of Elation', by: 'Аха — Эон Радасці', de: 'Aha — Äon der Freude', fr: 'Aha — Éon de l’Allégresse', zh: '阿哈 — 欢愉星神' },
    title: { ru: 'Владыка Вечного Смеха и Недотёп', en: 'Lord of Eternal Laughter & Masked Fools', by: 'Уладар Вечнага Смеху', de: 'Herr des ewigen Lachens', fr: 'Seigneur du Rire Éternel', zh: '欢愉与假面愚者之主' },
    rarity: 5,
    path: 'Elation',
    element: 'Quantum',
    elementColor: '#a855f7',
    quote: { 
      ru: '«Смех — единственное лекарство против вселенской скуки и оков судьбы!»', 
      en: '«Laughter is the only cure against universal boredom and the shackles of destiny!»',
      by: '«Смех — адзіныя лекі супраць сусветнай нуды і кайданоў лёсу!»',
      de: '«Lachen ist das einzige Heilmittel gegen universelle Langeweile!»',
      fr: '«Le rire est le seul remède contre l’ennui universel !»',
      zh: '«欢笑是对抗宇宙无聊与命运枷锁的唯一解药！»'
    },
    desc: {
      ru: 'Эон Радости, постигший абсурдность вселенной. Дарует невероятную силу тем, кто способен посмеяться над законами космоса.',
      en: 'The Aeon of Elation who grasped cosmic absurdity. Grants immense fortune to those bold enough to mock the cosmos.'
    },
    skill: {
      ru: 'Сверхспособность: «Вселенская Комедия» — наносит квантовый урон всем врагам и обращает любой негативный эффект в взрыв конфетти.',
      en: 'Ultimate: «Universal Comedy» — Deals Quantum DMG to all enemies and converts debuffs into exploding confetti.'
    },
    type: 'character',
    color: '#ff4d4d',
    iconSymbol: '🎭'
  },
  {
    id: 'sparkle',
    name: { ru: 'Искорка', en: 'Sparkle', by: 'Іскарка', de: 'Sparkle', fr: 'Sparkle', zh: '花火' },
    title: { ru: 'Мастер Тысячи Иллюзий', en: 'Master of a Thousand Illusions', by: 'Майстар Тысячы Ілюзій', de: 'Meisterin der Illusionen', fr: 'Maîtresse des Illusions', zh: '千面戏子' },
    rarity: 5,
    path: 'Harmony',
    element: 'Quantum',
    elementColor: '#a855f7',
    quote: { 
      ru: '«Вся жизнь — грандиозный спектакль! Кому нужны унылые правила?»', 
      en: '«All of life is a grand stage! Who cares about dull rules?»',
      by: '«Усё жыццё — грандыёзны спектакль! Каму патрэбныя правілы?»',
      de: '«Das ganze Leben ist ein großes Schauspiel!»',
      fr: '«Toute la vie est une grande scène !»',
      zh: '«人生如戏，全靠演技！谁在乎什么枯燥的规则？»'
    },
    desc: {
      ru: 'Актриса из общества «Недотёпы в масках». Виртуозно манипулирует очками навыков и реальностью.',
      en: 'A celebrated actress among the Masked Fools. Manipulates reality and skill points with dramatic flair.'
    },
    skill: {
      ru: 'Сверхспособность: «Драматургия Абсурда» — мгновенно восстанавливает 4 очка навыков и повышает критический урон команды.',
      en: 'Ultimate: «Theater of Absurdity» — Instantly recovers 4 Skill Points and drastically amplifies team CRIT DMG.'
    },
    type: 'character',
    color: '#ff2e63',
    iconSymbol: '🎆'
  },
  {
    id: 'black_swan',
    name: { ru: 'Чёрный Лебедь', en: 'Black Swan', by: 'Чорны Лебедзь', de: 'Schwarzer Schwan', fr: 'Cygne Noir', zh: '黑天鹅' },
    title: { ru: 'Хранитель Памяти Сада Воспоминаний', en: 'Memokeeper of the Garden of Recollection', by: 'Захавальнік Памяці', de: 'Erinnerungshüterin', fr: 'Gardienne des Souvenirs', zh: '忆者' },
    rarity: 5,
    path: 'Nihility',
    element: 'Wind',
    elementColor: '#10b981',
    quote: { 
      ru: '«Каждое воспоминание оставляет неизгладимый след в ткани звёзд...»', 
      en: '«Every memory weaves an indelible mark upon the tapestry of stars...»',
      by: '«Кожны ўспамін пакідае след у тканцы зорак...»',
      de: '«Jede Erinnerung hinterlässt Spuren im Sternenmeer...»',
      fr: '«Chaque souvenir tisse la toile des étoiles...»',
      zh: '«每一段记忆，都在星空的织锦上留下不朽印记……»'
    },
    desc: {
      ru: 'Таинственная гадалка, исследующая тайны чужой памяти и насылающая неисцелимое Арканум-увядание.',
      en: 'Mysterious diviner exploring forgotten realms of consciousness and weaving Arcana stacks.'
    },
    skill: {
      ru: 'Сверхспособность: «Объятия Вечного Сна» — накладывает статус Прозрение и взрывает накопленные уровни Арканума.',
      en: 'Ultimate: «Embrace of Eternal Slumber» — Inflicts Epiphany and triggers explosive multi-target Wind DMG.'
    },
    type: 'character',
    color: '#a855f7',
    iconSymbol: '🃏'
  },
  {
    id: 'aventurine',
    name: { ru: 'Авантюрин', en: 'Aventurine', by: 'Авантурын', de: 'Aventurin', fr: 'Aventurine', zh: '砂金' },
    title: { ru: 'Топ-менеджер КММ: Десять Каменных Сердец', en: 'IPC Senior Manager: Ten Stonehearts', by: 'Топ-менеджар КММ', de: 'IPC-Direktor', fr: 'Directeur de la CPI', zh: '星际和平公司十人石心' },
    rarity: 5,
    path: 'Preservation',
    element: 'Imaginary',
    elementColor: '#eab308',
    quote: { 
      ru: '«Всё или ничего! Ставлю золотые фишки на мою абсолютную победу!»', 
      en: '«All or nothing! Stacking all my chips upon destiny’s hand!»',
      by: '«Усё альбо нічога! Стаўлю фішкі на сваю перамогу!»',
      de: '«Alles oder nichts! Ich setze auf den ultimativen Sieg!»',
      fr: '«Tout ou rien ! Je mise tout sur mon triomphe !»',
      zh: '«赢家通吃！把所有黄金筹码全部押在我的胜利之上！»'
    },
    desc: {
      ru: 'Мастер рискованных сделок. Предоставляет союзникам непробиваемый Щит Укреплённой Ставки.',
      en: 'Master gambler and strategist, granting impenetrable Fortified Wager shields to entire team.'
    },
    skill: {
      ru: 'Сверхспособность: «Рулетка Джекпота» — выбрасывает до 7 Слепых Ставок и наносит мнимый урон по уязвимости.',
      en: 'Ultimate: «Jackpot Roulette» — Randomly gains up to 7 Blind Bet points and inflicts massive Imaginary blast.'
    },
    type: 'character',
    color: '#eab308',
    iconSymbol: '🎲'
  },
  {
    id: 'acheron',
    name: { ru: 'Ахерон', en: 'Acheron', by: 'Ахерон', de: 'Acheron', fr: 'Achéron', zh: '黄泉' },
    title: { ru: 'Безымянная Галактическая Странница', en: 'Self-Annihilator Galaxy Ranger', by: 'Галактычны Вандроўнік', de: 'Galaktische Wanderin', fr: 'Rôdeuse Galactique', zh: '巡海游侠' },
    rarity: 5,
    path: 'Nihility',
    element: 'Lightning',
    elementColor: '#8b5cf6',
    quote: { 
      ru: '«Слёзы багрового дождя смывают все бренные тени бытия...»', 
      en: '«Crimson rain washes away all transient shadows of existence...»',
      by: '«Слёзы чырвонага дажджу змываюць усе цені быцця...»',
      de: '«Der rote Regen wäscht alle Schatten fort...»',
      fr: '«La pluie pourpre efface les ombres éphémères...»',
      zh: '«我为逝者哀哭，为生者挥下斩断虚无的一刀……»'
    },
    desc: {
      ru: 'Эманатор Небытия с длинным клинком. Не использует энергию для ультимейта, питаясь дебаффами врагов.',
      en: 'Emanator of Nihility bypassing normal Energy requirements, unleashed by status afflictions.'
    },
    skill: {
      ru: 'Сверхспособность: «Смертный Сон в Каплях Дождя» — производит 4 сокрушительных рассекающих удара сквозь все типы уязвимостей.',
      en: 'Ultimate: «Slashed Dream in Crimson Rain» — 4 devastating slashes ignoring all enemy Weakness types.'
    },
    type: 'character',
    color: '#8b5cf6',
    iconSymbol: '⚡'
  },
  // 4★ Characters
  {
    id: 'sampo',
    name: { ru: 'Сампо Коски', en: 'Sampo Koski', by: 'Сампа Коскі', de: 'Sampo', fr: 'Sampo', zh: '桑博' },
    title: { ru: 'Торговец Редкостями Белобога', en: 'Belobog Relic Merchant', by: 'Гандляр Белабога', de: 'Händler aus Belobog', fr: 'Marchand de Belobog', zh: '贝洛伯格倒爷' },
    rarity: 4,
    path: 'Nihility',
    element: 'Wind',
    elementColor: '#10b981',
    quote: { 
      ru: '«Эй, дружище! Для тебя у меня всегда особая космическая скидка!»', 
      en: '«Hey buddy! Exclusive VIP discount just between friends!»',
      by: '«Гэй, дружа! Для цябе ў мяне заўсёды асаблівая зніжка!»',
      de: '«Hey Kumpel! Sonderangebot nur für dich!»',
      fr: '«Hé l’ami ! Une réduction spéciale rien que pour toi !»',
      zh: '«老朋友，老客户！给你算内部最高特惠价！»'
    },
    desc: { ru: 'Харизматичный шут и агент Недотёп.', en: 'Charismatic jester and undercover Masked Fool.' },
    skill: { ru: 'Сверхспособность: «Внезапный Сюрприз» — увеличивает периодический урон.', en: 'Ultimate: «Surprise Present» — Boosts DoT intake on all enemies.' },
    type: 'character',
    color: '#10b981',
    iconSymbol: '💰'
  },
  {
    id: 'guinaifen',
    name: { ru: 'Гуйнайфэнь', en: 'Guinaifen', by: 'Гуйнайфэнь', de: 'Guinaifen', fr: 'Guinaifen', zh: '桂乃芬' },
    title: { ru: 'Уличная Артистка Лофу Сяньчжоу', en: 'Luofu Xianzhou Street Performer', by: 'Вулічная Артыстка', de: 'Straßenkünstlerin', fr: 'Artiste de Rue', zh: '仙舟杂技主播' },
    rarity: 4,
    path: 'Nihility',
    element: 'Fire',
    elementColor: '#f97316',
    quote: { 
      ru: '«Шоу с огненными факелами начинается! Жмите на колокольчик стрима!»', 
      en: '«Fire-juggling spectacle begins! Hit that follow button!»',
      by: '«Шоў з паходнямі пачынаецца! Падпісвайцеся на стрым!»',
      de: '«Die Show beginnt! Abonniert den Stream!»',
      fr: '«Le spectacle commence ! Likez et partagez !»',
      zh: '«吞剑杂技开演！老铁们记得双击点赞送火箭！»'
    },
    desc: { ru: 'Жонглёр пламенем и видеоблогер Сяньчжоу.', en: 'Fire juggler and top streamer of Xianzhou.' },
    skill: { ru: 'Сверхспособность: «Первоклассное Шоу» — наносит огненный урон и поджигает врагов.', en: 'Ultimate: «Top-Notch Show» — Massive Fire DoT blast.' },
    type: 'character',
    color: '#f97316',
    iconSymbol: '🔥'
  },
  {
    id: 'gallagher',
    name: { ru: 'Галлахер', en: 'Gallagher', by: 'Галахер', de: 'Gallagher', fr: 'Gallagher', zh: '加拉赫' },
    title: { ru: 'Офицер Безопасности Пенаконии', en: 'Penacony Security Officer & Bartender', by: 'Афіцэр Бяспекі', de: 'Sicherheitsoffizier', fr: 'Officier de Sécurité', zh: '猎犬家系治安官' },
    rarity: 4,
    path: 'Abundance',
    element: 'Fire',
    elementColor: '#ef4444',
    quote: { 
      ru: '«Смешать каплю горечи со сладкой шипучкой... Идеальный напиток для грешников.»', 
      en: '«A dash of bitterness with sweet soda... the perfect blend for dreamers.»',
      by: '«Змяшаць горыч з кропляй шыпучкі... Выдатны кактэйль.»',
      de: '«Ein bitter-süßer Cocktail für müde Seelen.»',
      fr: '«Une pointe d’amertume avec des bulles... cocktail parfait.»',
      zh: '«调制一丝苦涩与汽水的甘甜……献给所有做梦者。»'
    },
    desc: { ru: 'Бармен Клана Гончих, исцеляющий союзников при атаке.', en: 'Hound family bartender healing allies upon attacks.' },
    skill: { ru: 'Сверхспособность: «Шампанский Залп» — накладывает статус Опьянение и лечит команду.', en: 'Ultimate: «Champagne Etiquette» — Inflicts Besotted state and heals upon hitting.' },
    type: 'character',
    color: '#ef4444',
    iconSymbol: '🍸'
  },
  // 3★ Light Cones
  {
    id: 'lc_3_1',
    name: { ru: 'Стрелы Астрала (3★)', en: 'Astral Arrows (3★)', by: 'Стрэлы Астралу (3★)', de: 'Astralpfeile (3★)', fr: 'Flèches Astrales (3★)', zh: '星界之箭 (3★)' },
    title: { ru: 'Световой Конус Охоты', en: 'Hunt Light Cone', by: 'Светлавы Конус', de: 'Lichtkegel', fr: 'Cône de Lumière', zh: '光锥' },
    rarity: 3,
    path: 'The Hunt',
    element: 'Physical',
    elementColor: '#94a3b8',
    quote: { ru: '«Стремительный полёт сквозь звёздные туманности.»', en: '«A swift flight across the celestial nebulae.»' },
    desc: { ru: 'Базовый 3★ световой конус.', en: 'Standard 3-star Hunt Light Cone.' },
    skill: { ru: 'Повышает силу атаки на 12%.', en: 'Increases ATK by 12%.' },
    type: 'lightcone',
    color: '#38bdf8',
    iconSymbol: '🏹'
  },
  {
    id: 'lc_3_2',
    name: { ru: 'Хор Звёзд (3★)', en: 'Chorus of Stars (3★)', by: 'Хор Зорак (3★)', de: 'Sternenchor (3★)', fr: 'Chœur des Étoiles (3★)', zh: '星之合唱 (3★)' },
    title: { ru: 'Световой Конус Гармонии', en: 'Harmony Light Cone', by: 'Светлавы Конус', de: 'Lichtkegel', fr: 'Cône de Lumière', zh: '光锥' },
    rarity: 3,
    path: 'Harmony',
    element: 'Imaginary',
    elementColor: '#94a3b8',
    quote: { ru: '«Голоса гармонии разносятся в бесконечном эфире.»', en: '«Harmonic resonance resounding in the eternal void.»' },
    desc: { ru: 'Базовый 3★ световой конус.', en: 'Standard 3-star Harmony Light Cone.' },
    skill: { ru: 'Повышает скорость отряда на 6%.', en: 'Increases team SPD by 6%.' },
    type: 'lightcone',
    color: '#38bdf8',
    iconSymbol: '📜'
  }
];

// Initial Quest Definitions
const DEFAULT_QUESTS: AhaQuest[] = [
  {
    id: 'q_theories',
    title: { 
      ru: 'Изучить 3 теории Ахи', 
      en: 'Read 3 Aha Theories', 
      by: 'Вывучыць 3 тэорыі Ахі', 
      de: 'Lies 3 Aha-Theorien', 
      fr: 'Lire 3 théories d’Aha', 
      zh: '阅读3篇阿哈理论' 
    },
    description: {
      ru: 'Погрузитесь в космические теории заговоров Масок Недотёп.',
      en: 'Delve into the cosmic lore and conspiratorial archives of the Fools.'
    },
    reward: 320,
    category: 'daily',
    icon: 'BookOpen',
    progress: 1,
    target: 3,
    claimed: false,
    type: 'theories'
  },
  {
    id: 'q_turbo',
    title: { 
      ru: 'Активировать режим AHA Turbo 6.0', 
      en: 'Engage AHA Turbo 6.0 Engine', 
      by: 'Актываваць рэжым AHA Turbo 6.0', 
      de: 'Aktiviere AHA Turbo 6.0 Modus', 
      fr: 'Activer le mode AHA Turbo 6.0', 
      zh: '激活 AHA Turbo 6.0 极速引擎' 
    },
    description: {
      ru: 'Включите аппаратное ускорение 120 FPS через виджет системы.',
      en: 'Switch on hardware acceleration via the top-right system widget.'
    },
    reward: 320,
    category: 'daily',
    icon: 'Zap',
    progress: 0,
    target: 1,
    claimed: false,
    type: 'turbo'
  },
  {
    id: 'q_relic',
    title: { 
      ru: 'Зароллить реликвию до +15 в Оракуле', 
      en: 'Upgrade a Relic to +15 in Oracle', 
      by: 'Пракачаць рэліквію да +15 у Аракуле', 
      de: 'Verstärke ein Relikt auf +15', 
      fr: 'Améliorer une relique à +15', 
      zh: '在圣遗物占卜中强化至 +15' 
    },
    description: {
      ru: 'Испытайте рандом в Оракуле Реликвий и докачайте предмет до максимума.',
      en: 'Enhance any 5★ relic to max level in the Relic Oracle tab.'
    },
    reward: 480,
    category: 'elation',
    icon: 'Dice5',
    progress: 0,
    target: 1,
    claimed: false,
    type: 'relic'
  },
  {
    id: 'q_quiz',
    title: { 
      ru: 'Пройти Испытание Смеха Эона', 
      en: 'Pass the Aeon’s Riddle Trial', 
      by: 'Прайсці Выпрабаванне Смеху Эона', 
      de: 'Bestehe die Prüfung der Freude', 
      fr: 'Réussir l’Énigme de l’Allégresse', 
      zh: '通过欢愉星神的智慧试炼' 
    },
    description: {
      ru: 'Ответьте на каверзный вопрос Недотёпы прямо во вкладке заданий.',
      en: 'Answer the jester’s cosmic trivia riddle directly in this tab.'
    },
    reward: 400,
    category: 'daily',
    icon: 'HelpCircle',
    progress: 0,
    target: 1,
    claimed: false,
    type: 'quiz'
  },
  {
    id: 'q_code',
    title: { 
      ru: 'Расшифровать Космический Промокод', 
      en: 'Decode the Cosmic Secret Cipher', 
      by: 'Расшыфраваць Касмічны Промакод', 
      de: 'Entschlüssele den geheimen Code', 
      fr: 'Décoder le Code Secret Astral', 
      zh: '解密宇宙专属欢愉秘码' 
    },
    description: {
      ru: 'Введите секретный шифр «ELATION6» или «MASKED_FOOL» в поле расшифровки.',
      en: 'Enter secret code «ELATION6» or «MASKED_FOOL» in the cipher decoder below.'
    },
    reward: 640,
    category: 'cosmic',
    icon: 'Key',
    progress: 0,
    target: 1,
    claimed: false,
    type: 'code'
  },
  {
    id: 'q_warps',
    title: { 
      ru: 'Совершить 10 Астральных Варпов', 
      en: 'Perform 10 Astral Warps', 
      by: 'Здзейсніць 10 Астральных Варпаў', 
      de: 'Führe 10 Astral-Warps durch', 
      fr: 'Effectuer 10 Sauts Astraux', 
      zh: '进行10次星际跃迁' 
    },
    description: {
      ru: 'Крутите баннер и соберите свою команду героев Радости.',
      en: 'Pull characters on the event banner to earn bonus rebate jades.'
    },
    reward: 480,
    category: 'elation',
    icon: 'Sparkles',
    progress: 0,
    target: 10,
    claimed: false,
    type: 'warp_count'
  }
];

// Relic Types & Sub-stats
interface RelicSubStat {
  name: string;
  value: number;
  rolls: number;
  unit: '%' | 'pts';
  isCrit: boolean;
}

interface Relic {
  type: string;
  name: string;
  mainStat: { name: string; value: string };
  level: number;
  subStats: RelicSubStat[];
}

export const WarpSection: React.FC<WarpSectionProps> = ({ lang }) => {
  const t = translations[lang];

  // Warp & Currency State (Starter Jades: 320 for first test, then earned purely via tasks!)
  const [jades, setJades] = useState(() => {
    return parseInt(safeStorage.getItem('aha_stellar_jades_v2') || '480', 10);
  });
  const [pity5, setPity5] = useState(() => {
    return parseInt(safeStorage.getItem('aha_pity_5') || '14', 10);
  });
  const [pity4, setPity4] = useState(() => {
    return parseInt(safeStorage.getItem('aha_pity_4') || '4', 10);
  });
  const [totalWarps, setTotalWarps] = useState(() => {
    return parseInt(safeStorage.getItem('aha_total_warps') || '10', 10);
  });
  const [warpHistory, setWarpHistory] = useState<WarpItem[]>(() => {
    try {
      return JSON.parse(safeStorage.getItem('aha_warp_history') || '[]');
    } catch {
      return [];
    }
  });

  // Quests State
  const [quests, setQuests] = useState<AhaQuest[]>(() => {
    try {
      const saved = safeStorage.getItem('aha_warp_quests_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults in case of new quests
        return DEFAULT_QUESTS.map(def => {
          const match = parsed.find((p: any) => p.id === def.id);
          return match ? { ...def, ...match } : def;
        });
      }
    } catch (e) {}
    return DEFAULT_QUESTS;
  });

  const [activeTab, setActiveTab] = useState<'warp' | 'quests' | 'relic' | 'history'>('warp');
  const [isWarping, setIsWarping] = useState(false);
  const [warpAnimationType, setWarpAnimationType] = useState<'3star' | '4star' | '5star'>('3star');
  const [currentPulls, setCurrentPulls] = useState<WarpItem[]>([]);
  const [showPullModal, setShowPullModal] = useState(false);
  const [selectedCharDetail, setSelectedCharDetail] = useState<WarpItem | null>(null);
  const [soundMuted, setSoundMuted] = useState(soundEngine.getMuted());

  // Quest Interactive states
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [quizError, setQuizError] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Relic Oracle State
  const [relic, setRelic] = useState<Relic>(() => generateNewRelic('body'));
  const [oracleComment, setOracleComment] = useState<string>(
    lang === 'ru' 
      ? '🎭 Аха наблюдает за твоими реликвиями! Посмотрим, упадет ли всё в плоскую защиту...' 
      : '🎭 Aha is watching your relic rolls! Let’s see if it all goes into flat DEF...'
  );

  function generateNewRelic(type: string): Relic {
    let mainStat = { name: 'Крит. Урон', value: '64.8%' };
    let relicName = 'Маска Озорного Шута';
    if (type === 'head') {
      mainStat = { name: 'HP', value: '705' };
      relicName = 'Шляпа Первопроходца';
    } else if (type === 'hands') {
      mainStat = { name: 'Сила Атаки', value: '352' };
      relicName = 'Перчатки Маски Недотёпы';
    } else if (type === 'feet') {
      mainStat = { name: 'Скорость', value: '25' };
      relicName = 'Сапоги Танцора Ахи';
    } else if (type === 'sphere') {
      mainStat = { name: 'Квантовый Урон', value: '38.8%' };
      relicName = 'Сфера Радости Эона';
    } else if (type === 'rope') {
      mainStat = { name: 'Восст. Энергии', value: '19.4%' };
      relicName = 'Нить Космического Смеха';
    }

    const possibleSubs: RelicSubStat[] = [
      { name: 'Крит. Шанс', value: 3.2, rolls: 0, unit: '%', isCrit: true },
      { name: 'Крит. Урон', value: 6.4, rolls: 0, unit: '%', isCrit: true },
      { name: 'Скорость', value: 2.3, rolls: 0, unit: 'pts', isCrit: false },
      { name: 'Защита', value: 19, rolls: 0, unit: 'pts', isCrit: false },
    ];

    return {
      type,
      name: relicName,
      mainStat,
      level: 0,
      subStats: possibleSubs
    };
  }

  // Count ready-to-claim quests
  const readyQuestsCount = useMemo(() => {
    return quests.filter(q => q.progress >= q.target && !q.claimed).length;
  }, [quests]);

  // Persist State
  useEffect(() => {
    safeStorage.setItem('aha_stellar_jades_v2', jades.toString());
    safeStorage.setItem('aha_pity_5', pity5.toString());
    safeStorage.setItem('aha_pity_4', pity4.toString());
    safeStorage.setItem('aha_total_warps', totalWarps.toString());
    safeStorage.setItem('aha_warp_history', JSON.stringify(warpHistory.slice(0, 50)));
    safeStorage.setItem('aha_warp_quests_v2', JSON.stringify(quests));
  }, [jades, pity5, pity4, totalWarps, warpHistory, quests]);

  // Track Turbo mode quest automatically
  useEffect(() => {
    if (turboEngine.isTurboActive()) {
      updateQuestProgress('q_turbo', 1);
    }
  }, []);

  const updateQuestProgress = (questId: string, value: number) => {
    setQuests(prev => prev.map(q => {
      if (q.id === questId) {
        const nextVal = Math.min(q.target, Math.max(q.progress, value));
        return { ...q, progress: nextVal };
      }
      return q;
    }));
  };

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    soundEngine.setMuted(next);
  };

  // Claim Quest Reward Handler
  const handleClaimQuest = (quest: AhaQuest) => {
    if (quest.progress < quest.target || quest.claimed) return;

    soundEngine.playQuestClaim();
    setJades(prev => prev + quest.reward);
    gamificationEngine.awardPoints(quest.reward, quest.title[lang] || quest.title.ru || 'Quest Completed');

    setQuests(prev => prev.map(q => {
      if (q.id === quest.id) {
        return { ...q, claimed: true };
      }
      return q;
    }));

    window.dispatchEvent(new CustomEvent('aha_toast', {
      detail: lang === 'ru' 
        ? `🎁 +${quest.reward} Звёздного Нефрита получено за задание «${quest.title[lang] || quest.title.ru}»!` 
        : `🎁 +${quest.reward} Stellar Jades earned from quest «${quest.title[lang] || quest.title.en}»!`
    }));
  };

  // Secret code verification
  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    const clean = inputCode.trim().toUpperCase();

    if (clean === 'ELATION6' || clean === 'MASKED_FOOL' || clean === 'SPARKLE' || clean === 'AHA2026') {
      updateQuestProgress('q_code', 1);
      setCodeSuccess(lang === 'ru' ? '✨ Шифр принят! Задание выполнено, заберите награду выше!' : '✨ Cipher accepted! Quest completed, claim reward above!');
      setCodeError(null);
    } else {
      setCodeError(lang === 'ru' ? 'Неверный шифр! Подсказка: ELATION6 или MASKED_FOOL' : 'Invalid code! Hint: try ELATION6 or MASKED_FOOL');
      setCodeSuccess(null);
    }
  };

  // Mini Quiz Answer handler
  const handleAnswerQuiz = (optionIdx: number) => {
    soundEngine.playClick();
    setQuizAnswered(optionIdx);
    if (optionIdx === 1) { // Correct answer: "Смех и Хаос"
      setQuizError(false);
      updateQuestProgress('q_quiz', 1);
      window.dispatchEvent(new CustomEvent('aha_toast', {
        detail: lang === 'ru' ? '🎭 Верно! Аха заливается хохотом! Задание завершено!' : '🎭 Correct! Aha bursts into laughter! Quest completed!'
      }));
    } else {
      setQuizError(true);
    }
  };

  // Perform Gacha Pull
  const doWarp = (count: 1 | 10) => {
    const cost = count * 160;
    if (jades < cost) {
      soundEngine.playClick();
      window.dispatchEvent(new CustomEvent('aha_toast', {
        detail: lang === 'ru' 
          ? `❌ Недостаточно Звёздного Нефрита (${jades}/${cost})! Выполняйте задания во вкладке «Задания Эона»!` 
          : `❌ Not enough Stellar Jades (${jades}/${cost})! Complete quests in the «Aeon Quests» tab!`
      }));
      setActiveTab('quests');
      return;
    }

    soundEngine.playClick();
    setJades(prev => prev - cost);
    setIsWarping(true);

    let tempPity5 = pity5;
    let tempPity4 = pity4;
    const pulls: WarpItem[] = [];
    let highestRarity: 3 | 4 | 5 = 3;

    for (let i = 0; i < count; i++) {
      tempPity5++;
      tempPity4++;

      // Soft pity starts at 74 pulls (drastically increases 5★ chance up to 100% at 90)
      let fiveStarChance = 0.006;
      if (tempPity5 >= 74) {
        fiveStarChance += (tempPity5 - 73) * 0.06;
      }
      if (tempPity5 >= 90) {
        fiveStarChance = 1.0;
      }

      // 4★ Chance
      let fourStarChance = 0.051;
      if (tempPity4 >= 10) {
        fourStarChance = 1.0;
      }

      const roll = Math.random();

      if (roll < fiveStarChance) {
        // Won 5★
        const fiveStarPool = WARP_POOL.filter(w => w.rarity === 5);
        const item = fiveStarPool[Math.floor(Math.random() * fiveStarPool.length)];
        pulls.push(item);
        tempPity5 = 0;
        highestRarity = 5;
      } else if (roll < fiveStarChance + fourStarChance) {
        // Won 4★
        const fourStarPool = WARP_POOL.filter(w => w.rarity === 4);
        const item = fourStarPool[Math.floor(Math.random() * fourStarPool.length)];
        pulls.push(item);
        tempPity4 = 0;
        if (highestRarity < 4) highestRarity = 4;
      } else {
        // Won 3★
        const threeStarPool = WARP_POOL.filter(w => w.rarity === 3);
        const item = threeStarPool[Math.floor(Math.random() * threeStarPool.length)];
        pulls.push(item);
      }
    }

    const nextWarps = totalWarps + count;
    setPity5(tempPity5);
    setPity4(tempPity4);
    setTotalWarps(nextWarps);
    setWarpHistory(prev => [...pulls, ...prev].slice(0, 100));

    // Update warp quest progress
    updateQuestProgress('q_warps', Math.min(10, nextWarps));

    setWarpAnimationType(highestRarity === 5 ? '5star' : highestRarity === 4 ? '4star' : '3star');
    soundEngine.playWarpLaunch(highestRarity === 5);

    setTimeout(() => {
      setIsWarping(false);
      setCurrentPulls(pulls);
      setShowPullModal(true);
      if (highestRarity === 5) {
        soundEngine.playFiveStarReveal();
      }
    }, 1100);
  };

  // Relic Upgrade Handler
  const handleUpgradeRelic = (targetLevel: number) => {
    if (relic.level >= targetLevel) return;

    soundEngine.playClick();
    const levelsToAdd = targetLevel - relic.level;
    const upgradeSteps = Math.floor(levelsToAdd / 3);

    let updatedSubs = [...relic.subStats];
    let critUpgradesCount = 0;

    for (let step = 0; step < upgradeSteps; step++) {
      // Pick random sub-stat to roll
      const randIdx = Math.floor(Math.random() * updatedSubs.length);
      const sub = { ...updatedSubs[randIdx] };

      let increase = 0;
      if (sub.name === 'Крит. Шанс') increase = Number((2.6 + Math.random() * 0.6).toFixed(1));
      else if (sub.name === 'Крит. Урон') increase = Number((5.1 + Math.random() * 1.3).toFixed(1));
      else if (sub.name === 'Скорость') increase = Number((2.0 + Math.random() * 0.6).toFixed(1));
      else increase = Math.floor(16 + Math.random() * 6);

      sub.value = Number((sub.value + increase).toFixed(1));
      sub.rolls += 1;
      if (sub.isCrit) critUpgradesCount++;
      updatedSubs[randIdx] = sub;
    }

    const newLevel = targetLevel;
    const isCritHeavy = updatedSubs[0].rolls + updatedSubs[1].rolls >= 3;
    const isDefHeavy = updatedSubs[3].rolls >= 3;

    soundEngine.playRelicUpgrade(isCritHeavy);

    // Track Relic quest if reached +15
    if (newLevel >= 15) {
      updateQuestProgress('q_relic', 1);
    }

    let comment = '';
    if (isCritHeavy) {
      comment = lang === 'ru'
        ? '🌟 НЕВЕРОЯТНО! Аха аплодирует стоя! 3+ ролла в Крит — твоя Искорка будет стирать боссов в пыль!'
        : '🌟 INCREDIBLE! Aha gives a standing ovation! 3+ Crit rolls — your build is god-tier!';
    } else if (isDefHeavy) {
      comment = lang === 'ru'
        ? '🛡️ ХА-ХА-ХА! +100 к плоской Защите! Аха благословляет твоего саппорта стать бессмертным танком!'
        : '🛡️ HAHAHA! All rolls into flat DEF! Aha has turned your support into an unkillable brick!';
    } else {
      comment = lang === 'ru'
        ? '🎭 Сбалансированный ролл! Недотёпы одобряют этот космический рандом!'
        : '🎭 Balanced rolls! The Masked Fools approve of this cosmic RNG!';
    }

    setOracleComment(comment);
    setRelic({
      ...relic,
      level: newLevel,
      subStats: updatedSubs
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header Banner & Currency Bar */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#1b1228] via-[#241738] to-[#160f22] border-2 border-[#ff4d4d]/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full bg-[#ff4d4d]/20 border border-[#ff4d4d]/50 text-[#ff4d4d] text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles size={13} />
              ASTRAL WARP MATRIX v6.0
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-mono text-xs font-bold">
              5★ Pity: {pity5}/90
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold">
              4★ Pity: {pity4}/10
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-md">
            🎭 {lang === 'ru' ? 'Астральный Варп & Задания Эона' : 'Aha Astral Warp & Cosmic Quests'}
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl mt-1.5 leading-relaxed">
            {lang === 'ru' 
              ? 'Крутки не даются даром! Выполняйте космические испытания Недотёп, зарабатывайте Звёздный Нефрит и выбивайте 5★ персонажей с честной системой гаранта.' 
              : 'Jades are earned through merit! Complete Fool quests, earn Stellar Jades, and pull legendary 5★ characters with authentic pity guarantees.'}
          </p>
        </div>

        {/* Currency & Actions Area */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Stellar Jades Balance Badge */}
          <div className="px-4 py-2.5 bg-black/60 border border-[#3d2b4f] rounded-2xl flex items-center gap-3 shadow-inner backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md text-sm font-black">
              ✦
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-extrabold tracking-wider">
                {lang === 'ru' ? 'Звёздный Нефрит' : 'Stellar Jades'}
              </div>
              <div className="text-lg font-black text-cyan-300 font-mono tracking-tight">
                {jades.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quests Shortcut Button with Unclaimed Counter */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('quests');
            }}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg relative ${
              readyQuestsCount > 0 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-orange-500/30' 
                : 'bg-[#251c35] hover:bg-[#342749] text-gray-200 border border-[#ff4d4d]/40'
            }`}
          >
            <Gift size={16} className={readyQuestsCount > 0 ? 'animate-bounce' : ''} />
            <span>{lang === 'ru' ? 'Задания' : 'Quests'}</span>
            {readyQuestsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-black text-yellow-300 text-[10px] font-black font-mono">
                +{readyQuestsCount}
              </span>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-3 bg-black/40 hover:bg-[#251c35] border border-[#3d2b4f] rounded-2xl text-gray-300 hover:text-white transition-all cursor-pointer shadow"
            title={soundMuted ? "Включить звук" : "Выключить звук"}
          >
            {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* Ambient background aura */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-[#ff4d4d]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#3d2b4f] pb-3">
        <button
          onClick={() => { setActiveTab('warp'); soundEngine.playClick(); }}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'warp' 
              ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/25' 
              : 'bg-[#1f172e] text-gray-400 hover:text-white border border-[#3d2b4f]'
          }`}
        >
          <Sparkles size={16} />
          {lang === 'ru' ? 'Варп Эона (Баннер)' : 'Warp Banner'}
        </button>

        <button
          onClick={() => { setActiveTab('quests'); soundEngine.playClick(); }}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'quests' 
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25' 
              : 'bg-[#1f172e] text-gray-400 hover:text-white border border-[#3d2b4f]'
          }`}
        >
          <Trophy size={16} />
          <span>{lang === 'ru' ? 'Задания Эона (Фарм Нефрита)' : 'Aeon Quests (Earn Jades)'}</span>
          {readyQuestsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black font-mono animate-pulse">
              {readyQuestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('relic'); soundEngine.playClick(); }}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'relic' 
              ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/25' 
              : 'bg-[#1f172e] text-gray-400 hover:text-white border border-[#3d2b4f]'
          }`}
        >
          <Dice5 size={16} />
          {lang === 'ru' ? 'Оракул Реликвий' : 'Relic Oracle'}
        </button>

        <button
          onClick={() => { setActiveTab('history'); soundEngine.playClick(); }}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history' 
              ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/25' 
              : 'bg-[#1f172e] text-gray-400 hover:text-white border border-[#3d2b4f]'
          }`}
        >
          <History size={16} />
          {lang === 'ru' ? 'История & Гарант' : 'History & Pity'}
        </button>
      </div>

      {/* TAB 1: WARP BANNER */}
      {activeTab === 'warp' && (
        <div className="space-y-6">
          {/* Main Visual Banner Card */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-[#ff4d4d]/40 bg-gradient-to-b from-[#1e132c] via-[#140d20] to-[#0d0715] p-6 sm:p-8 shadow-2xl min-h-[440px] flex flex-col justify-between">
            {/* Top Info */}
            <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-[#ff4d4d] to-[#ff2e63] text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-md">
                    EVENT WARP: ELATION SPECTACLE
                  </span>
                  <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded-md text-[10px] font-bold font-mono">
                    RATE UP 50%
                  </span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-3 drop-shadow-lg">
                  🎭 {lang === 'ru' ? 'Смех Сквозь Звёзды: Аха & Искорка' : 'Laughter Across Stars: Aha & Sparkle'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl leading-relaxed">
                  {lang === 'ru' 
                    ? 'Повышенный шанс получения легендарных 5★ персонажей Пути Радости и Гармонии! 1 крутка = 160 ✦' 
                    : 'Drastically increased drop rates for 5★ Aha & 5★ Sparkle! 1 Warp = 160 ✦'}
                </p>
              </div>

              {/* Guarantees Pity Box */}
              <div className="p-4 bg-black/60 border border-[#3d2b4f] rounded-2xl backdrop-blur-md text-right shadow-inner min-w-[180px]">
                <div className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">
                  {lang === 'ru' ? 'До 5★ Гаранта' : '5★ Pity Counter'}
                </div>
                <div className="text-2xl font-black text-yellow-400 font-mono mt-0.5">
                  {pity5} <span className="text-sm text-gray-500 font-normal">/ 90</span>
                </div>
                <div className="text-[11px] text-gray-300 mt-1 flex items-center justify-end gap-1">
                  <span>4★ Гарант:</span>
                  <span className="text-purple-400 font-bold font-mono">{pity4}/10</span>
                </div>
              </div>
            </div>

            {/* Featured Character Showcase Grid */}
            <div className="my-6 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Star size={12} className="text-yellow-400" />
                  {lang === 'ru' ? 'Персонажи баннера (нажмите для досье):' : 'Banner Lineup (click for lore):'}
                </span>
                <span className="text-[11px] text-gray-400 italic">
                  {lang === 'ru' ? 'Гарантированный 5★ на 90-й крутке' : 'Guaranteed 5★ on 90th pull'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {WARP_POOL.filter(w => w.rarity === 5).map(char => (
                  <button
                    key={char.id}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedCharDetail(char);
                    }}
                    className="p-3.5 rounded-2xl bg-[#170f24]/90 border-2 border-yellow-500/30 hover:border-yellow-400 transition-all flex flex-col items-center text-center shadow-lg group hover:scale-[1.03] cursor-pointer relative overflow-hidden"
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-2 bg-gradient-to-tr from-yellow-500/20 to-amber-500/10 border border-yellow-500/40 shadow-inner group-hover:scale-110 transition-transform">
                      {char.iconSymbol}
                    </div>

                    <div className="text-xs font-black text-white leading-tight line-clamp-1 group-hover:text-yellow-300 transition-colors">
                      {char.name[lang] || char.name.en}
                    </div>

                    <div className="flex items-center gap-0.5 mt-1 text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={10} fill="currentColor" />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-cyan-300 font-bold">
                        {char.element}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-purple-300 font-bold">
                        {char.path}
                      </span>
                    </div>

                    {/* Foil shine bar */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-yellow-400/10 rounded-full blur-xl group-hover:bg-yellow-400/20 transition-all pointer-events-none" />
                  </button>
                ))}
              </div>
            </div>

            {/* Pull Buttons & Warning */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 pt-5 border-t border-[#3d2b4f]/70">
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <Info size={14} className="text-cyan-400" />
                <span>
                  {lang === 'ru' 
                    ? 'Закончился нефрит? Перейдите во вкладку «Задания Эона»!' 
                    : 'Out of jades? Head over to the «Aeon Quests» tab!'}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => doWarp(1)}
                  disabled={isWarping}
                  className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl bg-[#251c35] hover:bg-[#342749] border border-[#ff4d4d]/40 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  <span>{lang === 'ru' ? '1 Варп' : '1 Warp'}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-black/50 text-cyan-300 font-mono text-xs font-bold">
                    160 ✦
                  </span>
                </button>

                <button
                  onClick={() => doWarp(10)}
                  disabled={isWarping}
                  className="flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#ff4d4d] via-[#ff2e63] to-[#e11d48] hover:from-[#ff6666] hover:to-[#ff4777] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xl shadow-[#ff4d4d]/30"
                >
                  <Sparkles size={18} />
                  <span>{lang === 'ru' ? '10 Варпов' : '10 Warps'}</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-black/60 text-cyan-200 font-mono text-xs font-black">
                    1600 ✦
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AEON QUESTS (Earn Jades through Quests) */}
      {activeTab === 'quests' && (
        <div className="space-y-6">
          {/* Quests Overview Header */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#1e132c] to-[#120a1c] border-2 border-amber-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg">
                  QUEST BOARD
                </span>
                <span className="text-xs text-amber-300 font-bold">
                  {lang === 'ru' ? 'Без халявы: только за заслуги!' : 'No free handouts: earn by merit!'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mt-1">
                📜 {lang === 'ru' ? 'Задания и Испытания Эона Радости' : 'Aeon of Elation Quests & Trials'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
                {lang === 'ru' 
                  ? 'Выполняйте интерактивные задачи, решайте загадки Ахи и получайте Звёздный Нефрит для круток!' 
                  : 'Complete interactive missions, solve Aha’s riddles, and claim Stellar Jades for warps!'}
              </p>
            </div>

            <div className="px-5 py-3 bg-black/50 border border-amber-500/40 rounded-2xl text-center">
              <div className="text-[10px] text-gray-400 font-bold uppercase">
                {lang === 'ru' ? 'Готово к получению' : 'Ready to Claim'}
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {readyQuestsCount} <span className="text-xs text-gray-500">/ {quests.length}</span>
              </div>
            </div>
          </div>

          {/* Quests Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quests.map(quest => {
              const isReady = quest.progress >= quest.target && !quest.claimed;
              const isDone = quest.claimed;

              return (
                <div
                  key={quest.id}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4 ${
                    isDone 
                      ? 'bg-[#15101e]/60 border-[#3d2b4f] opacity-75' 
                      : isReady 
                      ? 'bg-gradient-to-r from-[#2a1b38] to-[#1d122b] border-amber-400 shadow-lg shadow-amber-500/10' 
                      : 'bg-[#1f172e] border-[#3d2b4f]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isDone 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : isReady 
                            ? 'bg-amber-500 text-black shadow-md' 
                            : 'bg-[#251c35] text-gray-300'
                        }`}>
                          {quest.icon === 'BookOpen' && <BookOpen size={20} />}
                          {quest.icon === 'Zap' && <Zap size={20} />}
                          {quest.icon === 'Dice5' && <Dice5 size={20} />}
                          {quest.icon === 'HelpCircle' && <HelpCircle size={20} />}
                          {quest.icon === 'Key' && <Key size={20} />}
                          {quest.icon === 'Sparkles' && <Sparkles size={20} />}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white leading-snug">
                            {quest.title[lang] || quest.title.ru}
                          </h4>
                          <span className="text-[10px] text-gray-400 uppercase font-mono">
                            {quest.category} • {quest.progress}/{quest.target}
                          </span>
                        </div>
                      </div>

                      {/* Reward Badge */}
                      <div className="px-2.5 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-cyan-300 font-mono text-xs font-black flex items-center gap-1">
                        <span>+{quest.reward}</span>
                        <span className="text-cyan-400">✦</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 mt-2.5 leading-relaxed">
                      {quest.description[lang] || quest.description.ru}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-black/40 h-2 rounded-full overflow-hidden border border-[#3d2b4f]/40">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isDone 
                            ? 'bg-emerald-500' 
                            : isReady 
                            ? 'bg-amber-400' 
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#3d2b4f]/40">
                    <span className="text-[11px] text-gray-400 font-mono">
                      {isDone 
                        ? '✅ ' + (lang === 'ru' ? 'Награда получена' : 'Reward Claimed') 
                        : isReady 
                        ? '🎁 ' + (lang === 'ru' ? 'Готово к сбору!' : 'Ready to collect!') 
                        : (lang === 'ru' ? 'В процессе...' : 'In progress...')}
                    </span>

                    {isDone ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        {lang === 'ru' ? 'Выполнено' : 'Completed'}
                      </span>
                    ) : isReady ? (
                      <button
                        onClick={() => handleClaimQuest(quest)}
                        className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <Gift size={14} />
                        {lang === 'ru' ? 'Забрать награду' : 'Claim Reward'}
                      </button>
                    ) : (
                      <div>
                        {quest.type === 'theories' && (
                          <button
                            onClick={() => {
                              soundEngine.playClick();
                              updateQuestProgress('q_theories', 3);
                              window.dispatchEvent(new CustomEvent('aha_toast', {
                                detail: lang === 'ru' ? '📚 Теории изучены! Заберите награду!' : '📚 Theories studied! Claim reward!'
                              }));
                            }}
                            className="px-3.5 py-1.5 bg-[#251c35] hover:bg-[#342749] text-gray-200 text-xs font-bold rounded-xl border border-[#3d2b4f] transition-all cursor-pointer"
                          >
                            {lang === 'ru' ? 'Изучить сейчас' : 'Study Now'}
                          </button>
                        )}
                        {quest.type === 'turbo' && (
                          <button
                            onClick={() => {
                              turboEngine.toggleTurbo();
                              updateQuestProgress('q_turbo', 1);
                            }}
                            className="px-3.5 py-1.5 bg-[#251c35] hover:bg-[#342749] text-gray-200 text-xs font-bold rounded-xl border border-[#3d2b4f] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Zap size={12} className="text-yellow-400" />
                            {lang === 'ru' ? 'Включить Turbo' : 'Toggle Turbo'}
                          </button>
                        )}
                        {quest.type === 'relic' && (
                          <button
                            onClick={() => {
                              setActiveTab('relic');
                              soundEngine.playClick();
                            }}
                            className="px-3.5 py-1.5 bg-[#251c35] hover:bg-[#342749] text-gray-200 text-xs font-bold rounded-xl border border-[#3d2b4f] transition-all cursor-pointer"
                          >
                            {lang === 'ru' ? 'В Оракул' : 'Go to Oracle'}
                          </button>
                        )}
                        {quest.type === 'warp_count' && (
                          <button
                            onClick={() => {
                              setActiveTab('warp');
                              soundEngine.playClick();
                            }}
                            className="px-3.5 py-1.5 bg-[#251c35] hover:bg-[#342749] text-gray-200 text-xs font-bold rounded-xl border border-[#3d2b4f] transition-all cursor-pointer"
                          >
                            {lang === 'ru' ? 'К баннеру' : 'To Banner'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Mini-Games for Quests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* 1. Riddle of Aha Mini-game */}
            <div className="p-6 rounded-3xl bg-[#1f172e] border-2 border-purple-500/30 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-purple-400 font-black text-sm uppercase tracking-wider">
                <HelpCircle size={18} />
                <span>{lang === 'ru' ? 'Космическая Загадка Недотёпы' : 'The Fool’s Cosmic Riddle'}</span>
              </div>

              <p className="text-xs sm:text-sm text-gray-200 italic leading-relaxed">
                «Что способно заставить вселенную двигаться, разрушить самые скучные законы физики и превратить строгого Эона в гигантский взрыв конфетти?»
              </p>

              <div className="space-y-2">
                {[
                  { idx: 0, text: 'Строгая математическая симметрия' },
                  { idx: 1, text: 'Истинный Смех, Радость и Абсурд (Аха)' },
                  { idx: 2, text: 'Договор с Межзвёздным Банком' }
                ].map(opt => (
                  <button
                    key={opt.idx}
                    onClick={() => handleAnswerQuiz(opt.idx)}
                    className={`w-full p-3 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                      quizAnswered === opt.idx 
                        ? opt.idx === 1 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                          : 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-[#15101e] hover:bg-[#251c35] border-[#3d2b4f] text-gray-300'
                    }`}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>

              {quizError && (
                <div className="text-[11px] text-red-400 font-bold flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{lang === 'ru' ? 'Аха качает головой! Попробуйте другой ответ!' : 'Aha shakes head! Try another answer!'}</span>
                </div>
              )}
            </div>

            {/* 2. Cosmic Cipher Decoder */}
            <div className="p-6 rounded-3xl bg-[#1f172e] border-2 border-cyan-500/30 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-black text-sm uppercase tracking-wider">
                <Key size={18} />
                <span>{lang === 'ru' ? 'Декодер Промокодов Недотёп' : 'Fool’s Cipher Decoder'}</span>
              </div>

              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                {lang === 'ru' 
                  ? 'Введите скрытый пароль «ELATION6» или «MASKED_FOOL», чтобы разблокировать +640 Нефрита за задание!' 
                  : 'Enter the hidden cipher «ELATION6» or «MASKED_FOOL» to unlock +640 Stellar Jades!'}
              </p>

              <form onSubmit={handleRedeemCode} className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="ELATION6"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#15101e] border border-[#3d2b4f] text-white text-xs font-mono tracking-widest uppercase focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    {lang === 'ru' ? 'Ввод' : 'Apply'}
                  </button>
                </div>

                {codeSuccess && (
                  <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>{codeSuccess}</span>
                  </div>
                )}
                {codeError && (
                  <div className="text-[11px] text-red-400 font-bold flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{codeError}</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RELIC ORACLE */}
      {activeTab === 'relic' && (
        <div className="space-y-6">
          {/* Relic Chooser */}
          <div className="p-4 rounded-2xl bg-[#1f172e] border border-[#3d2b4f] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              {lang === 'ru' ? 'Выберите слот реликвии:' : 'Select Relic Slot:'}
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'body', label: 'Тело (Body)' },
                { id: 'head', label: 'Голова (Head)' },
                { id: 'hands', label: 'Руки (Hands)' },
                { id: 'feet', label: 'Сапоги (Feet)' },
                { id: 'sphere', label: 'Сфера (Sphere)' },
                { id: 'rope', label: 'Верёвка (Rope)' }
              ].map(slot => (
                <button
                  key={slot.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setRelic(generateNewRelic(slot.id));
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    relic.type === slot.id 
                      ? 'bg-[#ff4d4d] text-[#15101e] shadow-md' 
                      : 'bg-[#15101e] text-gray-400 hover:text-white border border-[#3d2b4f]'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          {/* Relic Card & Enhancement Simulator */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Relic Card */}
            <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#251c35] to-[#15101e] border-2 border-yellow-500/40 shadow-2xl relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-[10px] font-black uppercase">
                      5★ LEGENDARY RELIC
                    </span>
                    <span className="text-yellow-400 font-bold font-mono text-sm">+{relic.level}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">{relic.name}</h3>
                </div>
                <div className="flex gap-0.5 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>

              {/* Main Stat */}
              <div className="my-6 p-4 rounded-2xl bg-black/40 border border-[#3d2b4f] flex items-center justify-between shadow-inner">
                <div className="text-xs uppercase text-gray-400 font-bold">{relic.mainStat.name}</div>
                <div className="text-2xl font-black text-yellow-400 font-mono">{relic.mainStat.value}</div>
              </div>

              {/* Sub-stats List */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {lang === 'ru' ? 'Дополнительные характеристики (Sub-stats):' : 'Sub-stats:'}
                </div>
                {relic.subStats.map((sub, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      sub.rolls > 0 
                        ? 'bg-[#ff4d4d]/10 border-[#ff4d4d]/40 text-white' 
                        : 'bg-[#15101e]/60 border-[#3d2b4f] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{sub.name}</span>
                      {sub.rolls > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#ff4d4d] text-[#15101e] text-[10px] font-black">
                          +{sub.rolls} {lang === 'ru' ? 'ролл' : 'roll'}
                        </span>
                      )}
                    </div>
                    <div className={`font-mono text-base font-black ${sub.isCrit ? 'text-yellow-400' : 'text-cyan-400'}`}>
                      +{sub.value}{sub.unit}
                    </div>
                  </div>
                ))}
              </div>

              {/* Step Upgrade Controls */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleUpgradeRelic(Math.min(15, relic.level + 3))}
                  disabled={relic.level >= 15}
                  className="flex-1 px-4 py-3 bg-[#251c35] hover:bg-[#342749] border border-[#ff4d4d]/40 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow"
                >
                  +3 {lang === 'ru' ? 'Уровня' : 'Levels'}
                </button>

                <button
                  onClick={() => handleUpgradeRelic(15)}
                  disabled={relic.level >= 15}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  ✨ {lang === 'ru' ? 'Сразу до +15' : 'Instant +15'}
                </button>

                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setRelic(generateNewRelic(relic.type));
                    setOracleComment(lang === 'ru' ? '🎭 Новая заготовка получена! Ролль заново!' : '🎭 New relic generated! Roll again!');
                  }}
                  className="px-4 py-3 bg-black/40 hover:bg-black/60 border border-[#3d2b4f] text-gray-300 hover:text-white font-black text-xs uppercase rounded-xl transition-all cursor-pointer"
                  title="Generate Fresh Base Relic"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Aha Oracle Reaction Panel */}
            <div className="p-6 rounded-3xl bg-[#1f172e] border border-[#ff4d4d]/30 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#ff4d4d]/20 text-[#ff4d4d] flex items-center justify-center text-lg">
                    🎭
                  </div>
                  <h4 className="font-black text-white text-base">
                    {lang === 'ru' ? 'Комментарий Ахи' : 'Aha’s Commentary'}
                  </h4>
                </div>
                <div className="p-4 rounded-2xl bg-[#15101e] border border-[#3d2b4f] text-gray-200 text-xs sm:text-sm leading-relaxed italic">
                  {oracleComment}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-black/30 border border-[#3d2b4f]/60 text-[11px] text-gray-400 space-y-1">
                <div className="font-bold text-gray-300 mb-1">
                  💡 {lang === 'ru' ? 'Шансы на роллы:' : 'Sub-stat Roll Chances:'}
                </div>
                <div>• Крит. Шанс / Крит. Урон: 25%</div>
                <div>• Скорость: 25%</div>
                <div>• Плоская Защита (Любимица Ахи): 25%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HISTORY & STATS */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#1f172e] border border-[#3d2b4f]">
              <div className="text-xs text-gray-400 font-bold uppercase">Всего круток / Total Warps</div>
              <div className="text-3xl font-black text-white font-mono mt-1">{totalWarps}</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#1f172e] border border-[#3d2b4f]">
              <div className="text-xs text-gray-400 font-bold uppercase">5★ Выбито / 5★ Won</div>
              <div className="text-3xl font-black text-yellow-400 font-mono mt-1">
                {warpHistory.filter(w => w.rarity === 5).length}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-[#1f172e] border border-[#3d2b4f]">
              <div className="text-xs text-gray-400 font-bold uppercase">Гарант 5★ / Next Pity</div>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-1">{90 - pity5}</div>
            </div>
          </div>

          {/* History List */}
          <div className="p-6 rounded-2xl bg-[#1f172e] border border-[#3d2b4f] space-y-3">
            <h4 className="font-black text-white text-base mb-4 flex items-center gap-2">
              <History size={18} className="text-[#ff4d4d]" />
              {lang === 'ru' ? 'Журнал выпадений персонажей и конусов:' : 'Recent Warp Drops Journal:'}
            </h4>

            {warpHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {lang === 'ru' ? 'Пока нет истории круток. Сделайте свой первый варп!' : 'No warp history yet. Make your first pull!'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {warpHistory.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
                      item.rarity === 5 
                        ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300 font-bold' 
                        : item.rarity === 4 
                        ? 'bg-purple-500/10 border-purple-500/40 text-purple-300' 
                        : 'bg-[#15101e]/60 border-[#3d2b4f] text-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] text-gray-500">#{warpHistory.length - idx}</span>
                      <span className="text-lg">{item.iconSymbol}</span>
                      <span>{item.name[lang] || item.name.en}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs text-yellow-400">
                      {Array.from({ length: item.rarity }).map((_, i) => (
                        <Star key={i} size={11} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHARACTER DETAIL MODAL */}
      <AnimatePresence>
        {selectedCharDetail && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-[#1c1228] border-2 border-yellow-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-4xl shadow-inner">
                    {selectedCharDetail.iconSymbol}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase font-mono">
                        5★ {selectedCharDetail.element} • {selectedCharDetail.path}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      {selectedCharDetail.name[lang] || selectedCharDetail.name.en}
                    </h3>
                    <div className="text-xs text-gray-400">
                      {selectedCharDetail.title[lang] || selectedCharDetail.title.en}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCharDetail(null)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-[#3d2b4f] text-xs sm:text-sm text-gray-200 leading-relaxed italic">
                  {selectedCharDetail.quote[lang] || selectedCharDetail.quote.ru}
                </div>

                <div>
                  <h5 className="text-xs font-black uppercase text-yellow-400 tracking-wider mb-1">
                    {lang === 'ru' ? 'Описание героя' : 'Lore Overview'}
                  </h5>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    {selectedCharDetail.desc[lang] || selectedCharDetail.desc.ru}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#15101e] border border-yellow-500/30">
                  <h5 className="text-xs font-black uppercase text-cyan-400 tracking-wider mb-1">
                    {lang === 'ru' ? 'Сверхспособность (Ultimate)' : 'Ultimate Ability'}
                  </h5>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    {selectedCharDetail.skill[lang] || selectedCharDetail.skill.ru}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedCharDetail(null)}
                  className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'ru' ? 'Понятно' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PULL REVEAL MODAL */}
      <AnimatePresence>
        {showPullModal && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-4xl bg-gradient-to-b from-[#1c1228] to-[#0d0817] border-2 border-[#ff4d4d]/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              <h3 className="text-xl sm:text-2xl font-black text-white text-center mb-6 flex items-center justify-center gap-2">
                <Sparkles size={20} className="text-yellow-400" />
                <span>{lang === 'ru' ? 'Результаты Астрального Варпа' : 'Astral Warp Results'}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 max-h-[60vh] overflow-y-auto p-1">
                {currentPulls.map((pull, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.06 }}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center relative ${
                      pull.rarity === 5 
                        ? 'bg-gradient-to-b from-yellow-500/25 via-amber-950/40 to-black/60 border-yellow-400 shadow-xl shadow-yellow-500/30' 
                        : pull.rarity === 4 
                        ? 'bg-purple-950/40 border-purple-500/60 text-purple-200' 
                        : 'bg-[#15101e] border-[#3d2b4f] text-gray-300'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-2 bg-black/50 shadow-inner">
                      {pull.iconSymbol}
                    </div>

                    <div className={`text-xs font-black line-clamp-1 ${pull.rarity === 5 ? 'text-yellow-300' : 'text-white'}`}>
                      {pull.name[lang] || pull.name.en}
                    </div>

                    <div className="flex gap-0.5 text-yellow-400 my-1.5">
                      {Array.from({ length: pull.rarity }).map((_, i) => (
                        <Star key={i} size={10} fill="currentColor" />
                      ))}
                    </div>

                    <span className="text-[9px] font-mono text-gray-400 uppercase font-bold">
                      {pull.element} • {pull.path}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => {
                    setShowPullModal(false);
                    soundEngine.playClick();
                  }}
                  className="px-8 py-3.5 bg-gradient-to-r from-[#ff4d4d] to-[#ff2e63] hover:from-[#ff6666] hover:to-[#ff4777] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  {lang === 'ru' ? 'Забрать добычу & Закрыть' : 'Collect & Dismiss'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
