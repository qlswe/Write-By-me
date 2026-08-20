import { Language } from '../data/translations';
import { safeStorage } from './securityStorage';
import { soundEngine } from './audioSynth';

export interface GamificationChallenge {
  id: string;
  title: { [key in Language]?: string };
  description: { [key in Language]?: string };
  rewardPoints: number; // Stellar Jades
  rewardXp: number;
  category: 'daily' | 'cosmic' | 'elation' | 'explorer';
  icon: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  unlockedAt?: number;
  isNewUnlock?: boolean;
  type: 'theories' | 'chat' | 'turbo' | 'canvas' | 'relic' | 'quiz' | 'code' | 'warp_count' | 'daily_login' | 'forum_post';
}

export interface FloatingPointEvent {
  id: string;
  amount: number;
  label?: string;
  type: 'jades' | 'xp' | 'badge';
  timestamp: number;
}

export interface GamificationState {
  points: number; // Stellar Jades
  xp: number;
  level: number;
  totalEarned: number;
  challenges: GamificationChallenge[];
  unclaimedCount: number;
  newUnlockedCount: number;
  recentFloatingPoints: FloatingPointEvent[];
}

const DEFAULT_CHALLENGES: GamificationChallenge[] = [
  {
    id: 'explore_theories',
    title: {
      ru: 'Изучить 3 Архива Ахи',
      en: 'Study 3 Aha Archives',
      by: 'Вывучыць 3 Архівы Ахі',
      de: 'Studiere 3 Aha-Archive',
      fr: 'Étudier 3 archives d’Aha',
      zh: '探索3个阿哈机密档案'
    },
    description: {
      ru: 'Погрузитесь в секретные хроники и лор Недотёп в масках.',
      en: 'Delve into the classified chronicles and lore of the Masked Fools.',
      by: 'Пагрузіцеся ў сакрэтныя хронікі Недарэк у масках.',
      de: 'Tauche in die Archive der Maskierten Narren ein.',
      fr: 'Explorez les chroniques secrètes des Fous masqués.',
      zh: '潜入假面愚者的机密编年史。'
    },
    rewardPoints: 320,
    rewardXp: 120,
    category: 'explorer',
    icon: '📖',
    progress: 0,
    target: 3,
    completed: false,
    claimed: false,
    type: 'theories'
  },
  {
    id: 'turbo_hyper_boost',
    title: {
      ru: 'Активировать режим AHA Turbo 6.0',
      en: 'Activate AHA Turbo 6.0 Mode',
      by: 'Актываваць рэжым AHA Turbo 6.0',
      de: 'Aktiviere AHA Turbo 6.0 Modus',
      fr: 'Activer le mode AHA Turbo 6.0',
      zh: '启动 AHA Turbo 6.0 极速模式'
    },
    description: {
      ru: 'Включите аппаратный оверклокинг для максимального FPS и скорости.',
      en: 'Enable hardware overclocking for ultimate FPS and rendering speed.',
      by: 'Уключыце апаратны оверклокінг для максімальнай хуткасці.',
      de: 'Schalte die Hardware-Beschleunigung für maximale FPS ein.',
      fr: 'Activez l’accélération matérielle pour un FPS maximal.',
      zh: '开启硬件加速以获得极致FPS与响应速度。'
    },
    rewardPoints: 320,
    rewardXp: 150,
    category: 'daily',
    icon: '⚡',
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    type: 'turbo'
  },
  {
    id: 'relic_max_upgrade',
    title: {
      ru: 'Зароллить реликвию до +15 в Оракуле',
      en: 'Enhance Relic to +15 in Oracle',
      by: 'Прапампаваць рэліквію да +15 у Аракуле',
      de: 'Werte Relikt im Orakel auf +15 auf',
      fr: 'Améliorer une relique à +15 dans l’Oracle',
      zh: '在圣物神谕所将遗器强化至 +15'
    },
    description: {
      ru: 'Испытайте удачу и пробудите божественные саб-статы с максимальным рангом.',
      en: 'Test your luck and awaken god-tier substats at maximum rank.',
      by: 'Абудзіце боскія саб-статы з максімальным рангам.',
      de: 'Erwecke göttliche Sub-Stats auf maximaler Stufe.',
      fr: 'Éveillez des sous-stats divines au rang maximal.',
      zh: '唤醒拥有最高潜能的神级副词条。'
    },
    rewardPoints: 480,
    rewardXp: 250,
    category: 'cosmic',
    icon: '🔮',
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    type: 'relic'
  },
  {
    id: 'laughter_aeon_quiz',
    title: {
      ru: 'Пройти Испытание Смеха Эона',
      en: 'Pass the Aeon’s Trial of Laughter',
      by: 'Прайсці Выпрабаванне Смеху Эона',
      de: 'Bestehe die Prüfung des Lachens',
      fr: 'Réussir l’Épreuve du Rire de l’Éon',
      zh: '通过星神的欢愉智识试炼'
    },
    description: {
      ru: 'Дайте верные ответы на каверзные вопросы Ахи о космосе и Недотёпах.',
      en: 'Answer tricky cosmic questions posed by Aha and the Masked Fools.',
      by: 'Дайце дакладныя адказы на пытанні Ахі пра космас.',
      de: 'Beantworte knifflige Fragen über Aha und das Universum.',
      fr: 'Répondez aux énigmes cosmiques d’Aha.',
      zh: '回答阿哈关于宇宙与欢愉的哲学谜题。'
    },
    rewardPoints: 400,
    rewardXp: 180,
    category: 'elation',
    icon: '🎭',
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    type: 'quiz'
  },
  {
    id: 'masked_promo_decoder',
    title: {
      ru: 'Ввести Промокод Недотёп',
      en: 'Decode Masked Fools Secret Promo',
      by: 'Увесці Промакод Недарэк',
      de: 'Löse geheimen Promo-Code ein',
      fr: 'Activer le code secret des Fous',
      zh: '解码愚者秘令礼品码'
    },
    description: {
      ru: 'Используйте тайный шифр ELATION6 или MASKED_FOOL.',
      en: 'Redeem the cosmic code ELATION6 or MASKED_FOOL for instant spoils.',
      by: 'Выкарыстоўвайце шыфр ELATION6 ці MASKED_FOOL.',
      de: 'Gib den Code ELATION6 oder MASKED_FOOL ein.',
      fr: 'Entrez le code ELATION6 ou MASKED_FOOL.',
      zh: '使用秘令 ELATION6 或 MASKED_FOOL 兑换星石。'
    },
    rewardPoints: 640,
    rewardXp: 300,
    category: 'cosmic',
    icon: '🔑',
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    type: 'code'
  },
  {
    id: 'warp_master_10',
    title: {
      ru: 'Совершить 10 Астральных Варпов',
      en: 'Perform 10 Astral Warps',
      by: 'Здзейсніць 10 Астральных Варпаў',
      de: 'Vollziehe 10 Astrale Sprünge',
      fr: 'Effectuer 10 Sauts Astraux',
      zh: '进行 10 次星际跃迁'
    },
    description: {
      ru: 'Призовите судьбу в баннере «Космический Фарс Ахи».',
      en: 'Summon your fate in the «Aha’s Cosmic Farce» astral banner.',
      by: 'Прызавіце лёс у банэры «Касмічны Фарс Ахі».',
      de: 'Beschwöre dein Schicksal im Event-Banner.',
      fr: 'Invoquez votre destin dans la bannière d’Aha.',
      zh: '在「阿哈的宇宙狂欢」跃迁池中抽取星光。'
    },
    rewardPoints: 480,
    rewardXp: 200,
    category: 'cosmic',
    icon: '✨',
    progress: 0,
    target: 10,
    completed: false,
    claimed: false,
    type: 'warp_count'
  },
  {
    id: 'canvas_art_creation',
    title: {
      ru: 'Создать граффити на Астральном Холсте',
      en: 'Draw Graffiti on Astral Canvas',
      by: 'Стварыць графіці на Астральным Палатне',
      de: 'Erstelle Kunst auf der Astralen Leinwand',
      fr: 'Dessiner sur la Toile Astrale',
      zh: '在星际画板上创作涂鸦'
    },
    description: {
      ru: 'Оставьте свой след в интерактивной галерее Радости.',
      en: 'Leave your creative mark in the collaborative Joy gallery.',
      by: 'Пакіньце свой след у галерэі Радасці.',
      de: 'Hinterlasse dein Kunstwerk in der Galerie.',
      fr: 'Laissez votre empreinte dans la galerie collaborative.',
      zh: '在欢愉协作画廊留下你的独家印记。'
    },
    rewardPoints: 320,
    rewardXp: 120,
    category: 'daily',
    icon: '🎨',
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    type: 'canvas'
  },
  {
    id: 'forum_elation_talk',
    title: {
      ru: 'Опубликовать мысль на Форуме',
      en: 'Publish a Post on the Forum',
      by: 'Апублікаваць думку на Форуме',
      de: 'Veröffentliche einen Beitrag im Forum',
      fr: 'Publier un message sur le Forum',
      zh: '在论坛发表一篇星神论述'
    },
    description: {
      ru: 'Поделитесь теорией или обсудите лор с другими исследователями.',
      en: 'Share your theories or discuss lore with fellow trailblazers.',
      by: 'Падзяліцеся тэорыяй з іншымі даследчыкамі.',
      de: 'Teile Theorien mit anderen Forschern.',
      fr: 'Partagez vos théories avec la communauté.',
      zh: '与其他开拓者分享你的欢愉哲学见解。'
    },
    rewardPoints: 400,
    rewardXp: 160,
    category: 'daily',
    icon: '💬',
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
    type: 'forum_post'
  }
];

class GamificationManager {
  private challenges: GamificationChallenge[] = [];
  private points: number = 800; // Default starter Stellar Jades
  private xp: number = 0;
  private listeners: Set<() => void> = new Set();
  private floatingPoints: FloatingPointEvent[] = [];
  private lastAwardedTimestamp: number = 0;

  constructor() {
    this.loadState();
    this.setupGlobalEventListeners();
  }

  private loadState() {
    try {
      const savedPoints = safeStorage.getItem('aha_stellar_jades');
      if (savedPoints !== null) {
        this.points = Math.max(0, parseInt(savedPoints, 10) || 800);
      } else {
        this.points = 800;
        safeStorage.setItem('aha_stellar_jades', String(this.points));
      }

      const savedXp = safeStorage.getItem('aha_gamification_xp');
      if (savedXp !== null) {
        this.xp = Math.max(0, parseInt(savedXp, 10) || 0);
      }

      const savedChallenges = safeStorage.getItem('aha_gamification_quests');
      if (savedChallenges) {
        try {
          const parsed = JSON.parse(savedChallenges) as GamificationChallenge[];
          // Merge with DEFAULT_CHALLENGES to ensure new challenges are preserved
          this.challenges = DEFAULT_CHALLENGES.map(def => {
            const existing = parsed.find(p => p.id === def.id);
            if (existing) {
              return {
                ...def,
                progress: existing.progress || 0,
                completed: existing.completed || false,
                claimed: existing.claimed || false,
                isNewUnlock: existing.isNewUnlock || false,
                unlockedAt: existing.unlockedAt
              };
            }
            return { ...def, isNewUnlock: true, unlockedAt: Date.now() };
          });
        } catch (e) {
          this.challenges = [...DEFAULT_CHALLENGES];
        }
      } else {
        this.challenges = [...DEFAULT_CHALLENGES];
        this.saveChallenges();
      }
    } catch (e) {
      this.challenges = [...DEFAULT_CHALLENGES];
    }
  }

  private saveChallenges() {
    try {
      safeStorage.setItem('aha_gamification_quests', JSON.stringify(this.challenges));
    } catch (e) {}
  }

  private savePoints() {
    try {
      safeStorage.setItem('aha_stellar_jades', String(this.points));
      safeStorage.setItem('aha_gamification_xp', String(this.xp));
    } catch (e) {}
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Error in gamification listener:', err);
      }
    });
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public getState(): GamificationState {
    const unclaimedCount = this.challenges.filter(c => c.completed && !c.claimed).length;
    const newUnlockedCount = this.challenges.filter(c => c.isNewUnlock && !c.completed).length;
    const level = Math.floor(this.xp / 500) + 1;
    const totalEarned = this.challenges.filter(c => c.claimed).reduce((acc, curr) => acc + curr.rewardPoints, 0);

    return {
      points: this.points,
      xp: this.xp,
      level,
      totalEarned,
      challenges: [...this.challenges],
      unclaimedCount,
      newUnlockedCount,
      recentFloatingPoints: [...this.floatingPoints]
    };
  }

  public getBadgeCount(): number {
    const state = this.getState();
    return state.unclaimedCount + (state.newUnlockedCount > 0 ? 1 : 0);
  }

  public clearNewUnlockBadges() {
    let changed = false;
    this.challenges = this.challenges.map(c => {
      if (c.isNewUnlock) {
        changed = true;
        return { ...c, isNewUnlock: false };
      }
      return c;
    });

    if (changed) {
      this.saveChallenges();
      this.notify();
    }
  }

  /**
   * Award points in real time with floating animations, audio, and avatar notification triggers
   */
  public awardPoints(amount: number, reason: string = '', type: 'jades' | 'xp' | 'badge' = 'jades') {
    if (amount <= 0) return;

    if (type === 'jades') {
      this.points += amount;
      this.xp += Math.round(amount * 0.4);
    } else if (type === 'xp') {
      this.xp += amount;
    }

    this.savePoints();
    this.lastAwardedTimestamp = Date.now();

    // Spawn floating points animation event
    const eventId = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newFp: FloatingPointEvent = {
      id: eventId,
      amount,
      label: reason,
      type,
      timestamp: Date.now()
    };
    this.floatingPoints = [...this.floatingPoints.slice(-5), newFp];

    // Play points sparkle sound
    soundEngine.playPointsAwarded();

    // Dispatch global custom events so all components re-render immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aha_points_awarded', {
        detail: { amount, reason, type, totalPoints: this.points }
      }));
      window.dispatchEvent(new CustomEvent('aha_jades_changed', {
        detail: { jades: this.points }
      }));
    }

    this.notify();

    // Remove floating item after 3.5s
    setTimeout(() => {
      this.floatingPoints = this.floatingPoints.filter(f => f.id !== eventId);
      this.notify();
    }, 3500);
  }

  /**
   * Spend points (e.g. for Warp summons)
   */
  public spendPoints(amount: number): boolean {
    if (this.points < amount) return false;
    this.points -= amount;
    this.savePoints();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aha_jades_changed', {
        detail: { jades: this.points }
      }));
    }
    this.notify();
    return true;
  }

  /**
   * Update challenge progress in real-time
   */
  public updateProgress(type: GamificationChallenge['type'], delta: number = 1, specificId?: string) {
    let hasChanged = false;
    let newlyCompletedChallenge: GamificationChallenge | null = null;

    this.challenges = this.challenges.map(quest => {
      if (quest.completed) return quest;
      if (specificId && quest.id !== specificId) return quest;
      if (!specificId && quest.type !== type) return quest;

      const newProgress = Math.min(quest.target, quest.progress + delta);
      const isCompleted = newProgress >= quest.target;

      if (newProgress !== quest.progress || isCompleted !== quest.completed) {
        hasChanged = true;
        const updated = {
          ...quest,
          progress: newProgress,
          completed: isCompleted,
          isNewUnlock: isCompleted ? true : quest.isNewUnlock
        };
        if (isCompleted && !quest.completed) {
          newlyCompletedChallenge = updated;
        }
        return updated;
      }
      return quest;
    });

    if (hasChanged) {
      this.saveChallenges();
      this.notify();

      if (newlyCompletedChallenge) {
        soundEngine.playChallengeUnlocked();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('aha_challenge_unlocked', {
            detail: {
              challengeId: (newlyCompletedChallenge as GamificationChallenge).id,
              title: (newlyCompletedChallenge as GamificationChallenge).title.ru,
              reward: (newlyCompletedChallenge as GamificationChallenge).rewardPoints
            }
          }));
        }
      }
    }
  }

  /**
   * Claim reward for a completed challenge
   */
  public claimChallenge(challengeId: string): boolean {
    const quest = this.challenges.find(q => q.id === challengeId);
    if (!quest || !quest.completed || quest.claimed) return false;

    quest.claimed = true;
    quest.isNewUnlock = false;
    this.saveChallenges();

    // Award rewards
    this.awardPoints(quest.rewardPoints, `Задание: ${quest.title.ru || quest.title.en}`, 'jades');
    soundEngine.playQuestClaim();

    this.notify();
    return true;
  }

  /**
   * Claim all completed quests
   */
  public claimAll(): number {
    let totalClaimed = 0;
    this.challenges.forEach(q => {
      if (q.completed && !q.claimed) {
        q.claimed = true;
        q.isNewUnlock = false;
        totalClaimed += q.rewardPoints;
      }
    });

    if (totalClaimed > 0) {
      this.saveChallenges();
      this.awardPoints(totalClaimed, 'Сбор всех наград заданий', 'jades');
      soundEngine.playQuestClaim();
      this.notify();
    }
    return totalClaimed;
  }

  /**
   * Setup global browser event listeners
   */
  private setupGlobalEventListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('aha_trigger_quest_progress', (e: any) => {
      if (e.detail?.type) {
        this.updateProgress(e.detail.type, e.detail.delta || 1, e.detail.id);
      }
    });

    window.addEventListener('aha_turbo_toggled', (e: any) => {
      if (e.detail?.enabled) {
        this.updateProgress('turbo', 1, 'turbo_hyper_boost');
      }
    });

    window.addEventListener('aha_relic_upgraded', (e: any) => {
      if (e.detail?.level >= 15) {
        this.updateProgress('relic', 1, 'relic_max_upgrade');
      }
    });

    window.addEventListener('aha_theory_read', () => {
      this.updateProgress('theories', 1, 'explore_theories');
    });

    window.addEventListener('aha_canvas_drawn', () => {
      this.updateProgress('canvas', 1, 'canvas_art_creation');
    });

    window.addEventListener('aha_forum_posted', () => {
      this.updateProgress('forum_post', 1, 'forum_elation_talk');
    });

    window.addEventListener('aha_warp_pulled', (e: any) => {
      const count = e.detail?.count || 1;
      this.updateProgress('warp_count', count, 'warp_master_10');
    });

    window.addEventListener('aha_sync_jades', (e: any) => {
      if (typeof e.detail?.jades === 'number') {
        this.points = e.detail.jades;
        this.savePoints();
        this.notify();
      }
    });
  }
}

export const gamificationEngine = new GamificationManager();
