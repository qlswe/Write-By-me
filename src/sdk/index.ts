import { Language } from '../data/translations';
import { Theory, BlogPost, GameEvent, PromoCode } from '../data/content';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Ministry of Ahahi SDK
 * Centralized logic for game data, calculations, and security.
 */
export class MinistrySDK {
  private static instance: MinistrySDK;
  private version: string = '1.5.0-hsr';
  private logSubscribers: ((level: string, message: string, data?: any) => void)[] = [];
  private ready: boolean = false;
  private sdkConfig = {
    debug: process.env.NODE_ENV !== 'production',
    apiBase: '',
    theme: 'dark'
  };

  private constructor() {
    this.logging.system(`Ministry of Ahahi SDK v${this.version} initialized.`, {
      timestamp: new Date().toISOString(),
      config: this.sdkConfig
    });
    
    // Stylized terminal message
    console.log(
      `%c ⚡ MINISTRY SDK %c v${this.version} %c BETA EDITION %c`,
      'background: #C3A6E6; color: #2F244F; font-weight: bold; padding: 4px 8px; border-radius: 4px 0 0 4px;',
      'background: #3E3160; color: #C3A6E6; font-weight: bold; padding: 4px 8px;',
      'background: #F27D26; color: #FFFFFF; font-weight: bold; padding: 4px 8px; border-radius: 0 4px 4px 0;',
      'background: transparent;'
    );
    
    this.ready = true;
    this.events.emit('ready');
  }

  public static getInstance(): MinistrySDK {
    if (!MinistrySDK.instance) {
      MinistrySDK.instance = new MinistrySDK();
    }
    return MinistrySDK.instance;
  }

  public isReady(): boolean {
    return this.ready;
  }

  public onReady(callback: () => void) {
    if (this.ready) {
      callback();
    } else {
      this.events.on('ready', callback);
    }
  }

  public debug(enabled: boolean = true) {
    this.sdkConfig.debug = enabled;
    this.logging.system(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    return this;
  }

  public async error(message: string, data?: any, report: boolean = false) {
    this.logging.error(message, data);
    if (report) {
      await this.reporting.sendReport('bug', { message, data });
    }
    return this;
  }

  public log(message: string, data?: any) {
    this.logging.info(message, data);
    return this;
  }

  public warn(message: string, data?: any) {
    this.logging.warn(message, data);
    return this;
  }

  public perf(label: string, duration: number) {
    this.logging.perf(label, duration);
    return this;
  }

  public track(element: string, action: string) {
    this.analytics.interaction(element, action);
    return this;
  }

  public notify(title: string, body: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    this.notifications.send(title, body, type);
    return this;
  }

  public async copy(text: string) {
    return await this.hardware.copyToClipboard(text);
  }

  public async share(data: ShareData) {
    return await this.hardware.share(data);
  }

  public vibrate(pattern: number | number[] = 200) {
    return this.hardware.vibrate(pattern);
  }

  public scroll(id: string) {
    this.ui.scrollTo(id);
    return this;
  }

  public debounce(fn: Function, ms: number) {
    return this.optimization.debounce(fn, ms);
  }

  public memo(fn: Function) {
    return this.optimization.memoize(fn);
  }

  public async sleep(ms: number) {
    return await this.utils.sleep(ms);
  }

  public clone<T>(obj: T): T {
    return this.utils.deepClone(obj);
  }

  public id(prefix?: string) {
    return this.utils.generateId(prefix);
  }

  public format(date: any, lang?: Language) {
    return this.data.formatDate(date, lang);
  }

  public get(key: string) {
    return this.storage.get(key);
  }

  public set(key: string, value: any, ttl?: number) {
    this.storage.set(key, value, ttl);
    return this;
  }

  public on(event: string, callback: Function) {
    return this.events.on(event, callback);
  }

  public emit(event: string, data?: any) {
    this.events.emit(event, data);
    return this;
  }

  public async request(url: string, options?: RequestInit) {
    return await this.network.request(url, options);
  }

  public async report(type: 'bug' | 'feedback' | 'system', data: any) {
    return await this.reporting.sendReport(type, data);
  }

  public validate(input: string, maxLength?: number) {
    return this.security.validateInput(input, maxLength);
  }

  public isMobile() {
    return this.device.isMobile();
  }

  public isOnline() {
    return this.device.isOnline();
  }

  public random(min: number, max: number) {
    return this.math.randomInt(min, max);
  }

  public slug(text: string) {
    return this.string.slugify(text);
  }

  public capitalize(text: string) {
    return this.string.capitalize(text);
  }

  public truncate(text: string, len: number) {
    return this.string.truncate(text, len);
  }

  public strip(text: string) {
    return this.string.stripHtml(text);
  }

  public deepMerge(target: any, source: any) {
    return this.utils.merge(target, source);
  }

  public omit(obj: any, keys: string[]) {
    return this.utils.omit(obj, keys);
  }

  public pick(obj: any, keys: string[]) {
    return this.utils.pick(obj, keys);
  }

  public sort<T>(list: T[], key: keyof T, order?: 'asc' | 'desc') {
    return this.data.sort(list, key, order);
  }

  public filter<T>(list: T[], predicate: (item: T) => boolean) {
    return this.data.filter(list, predicate);
  }

  public isBot() {
    return this.security.isBot();
  }

  /**
   * Initialize SDK with custom configuration
   */
  public init(config: Partial<typeof this.sdkConfig>) {
    this.sdkConfig = { ...this.sdkConfig, ...config };
    this.logging.system('SDK re-initialized with custom config', this.sdkConfig);
    return this;
  }

  /**
   * Configuration module
   */
  public config = {
    set: (key: keyof typeof this.sdkConfig, value: any) => {
      (this.sdkConfig as any)[key] = value;
      this.logging.system(`Config updated: ${key} = ${value}`);
    },
    get: (key: keyof typeof this.sdkConfig) => this.sdkConfig[key],
    all: () => ({ ...this.sdkConfig })
  };

  /**
   * Hardware and Browser features
   */
  public hardware = {
    vibrate: (pattern: number | number[] = 200) => {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
        return true;
      }
      return false;
    },
    copyToClipboard: async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        this.logging.action('Copied to clipboard', { text });
        return true;
      } catch (err) {
        this.logging.error('Failed to copy to clipboard', err);
        return false;
      }
    },
    share: async (data: ShareData) => {
      if (navigator.share) {
        try {
          await navigator.share(data);
          this.logging.action('Shared content', data);
          return true;
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            this.logging.error('Share failed', err);
          }
          return false;
        }
      }
      return false;
    }
  };

  /**
   * Notification system (logic only, UI should subscribe)
   */
  public notifications = {
    send: (title: string, body: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      this.events.emit('notification', { title, body, type, id: this.utils.generateId('notif') });
    },
    success: (msg: string) => this.notifications.send('Success', msg, 'success'),
    error: (msg: string) => this.notifications.send('Error', msg, 'error'),
    warn: (msg: string) => this.notifications.send('Warning', msg, 'warning')
  };

  /**
   * Storage module for persistent data
   */
  public storage = {
    set: (key: string, value: any, ttl?: number) => {
      const item = {
        value,
        expiry: ttl ? Date.now() + ttl : null
      };
      localStorage.setItem(`min_${key}`, JSON.stringify(item));
    },
    get: (key: string): any | null => {
      const raw = localStorage.getItem(`min_${key}`);
      if (!raw) return null;
      try {
        const item = JSON.parse(raw);
        if (item.expiry && Date.now() > item.expiry) {
          localStorage.removeItem(`min_${key}`);
          return null;
        }
        return item.value;
      } catch {
        return null;
      }
    },
    remove: (key: string) => localStorage.removeItem(`min_${key}`),
    clear: () => {
      Object.keys(localStorage)
        .filter(key => key.startsWith('min_'))
        .forEach(key => localStorage.removeItem(key));
    }
  };

  /**
   * Network module for API calls
   */
  public network = {
    request: async (url: string, options: RequestInit = {}) => {
      const start = performance.now();
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          }
        });
        const duration = performance.now() - start;
        this.logging.perf(`Request to ${url}`, duration);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        this.logging.error(`Network request failed: ${url}`, error);
        throw error;
      }
    },
    get: (url: string) => this.network.request(url, { method: 'GET' }),
    post: (url: string, data: any) => this.network.request(url, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    })
  };

  /**
   * Event Bus for cross-component communication
   */
  private eventListeners: Map<string, Function[]> = new Map();
  public events = {
    on: (event: string, callback: Function) => {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event)?.push(callback);
      return () => this.events.off(event, callback);
    },
    off: (event: string, callback: Function) => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        this.eventListeners.set(event, listeners.filter(l => l !== callback));
      }
    },
    emit: (event: string, data?: any) => {
      this.logging.action(`Event Emitted: ${event}`, data);
      this.eventListeners.get(event)?.forEach(callback => callback(data));
    }
  };

  /**
   * Device and Environment information
   */
  public device = {
    isMobile: () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: () => /Android/.test(navigator.userAgent),
    getScreenSize: () => ({ width: window.innerWidth, height: window.innerHeight }),
    getLanguage: () => navigator.language,
    isOnline: () => navigator.onLine
  };

  /**
   * Math and Logic utilities
   */
  public math = {
    randomInt: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
    clamp: (val: number, min: number, max: number) => Math.max(min, Math.min(max, val)),
    lerp: (start: number, end: number, t: number) => start * (1 - t) + end * t,
    round: (val: number, precision: number = 0) => {
      const multiplier = Math.pow(10, precision);
      return Math.round(val * multiplier) / multiplier;
    }
  };

  public getVersion(): string {
    return this.version;
  }

  /**
   * Firebase Reporting module
   */
  public reporting = {
    sendReport: async (type: 'bug' | 'feedback' | 'system', data: any) => {
      try {
        await addDoc(collection(db, 'sdk_reports'), {
          type,
          data,
          timestamp: serverTimestamp(),
          version: this.version,
          userAgent: window.navigator.userAgent,
          url: window.location.href
        });
        this.logging.system(`Report sent to Firebase: ${type}`);
        return true;
      } catch (error) {
        this.logging.error(`Failed to send report to Firebase: ${error}`);
        return false;
      }
    }
  };

  /**
   * Security module for client-side protection
   */
  public security = {
    rateLimit: (action: string, limit: number = 5, windowMs: number = 10000): boolean => {
      const now = Date.now();
      const storageKey = `ratelimit_${action}`;
      const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const recentHistory = history.filter((timestamp: number) => now - timestamp < windowMs);
      if (recentHistory.length >= limit) return false;
      recentHistory.push(now);
      localStorage.setItem(storageKey, JSON.stringify(recentHistory));
      return true;
    },
    isBot: (): boolean => {
      return /HeadlessChrome/.test(window.navigator.userAgent);
    },
    checkOrigin: (origin: string) => {
      return [window.location.origin].includes(origin);
    },
    validateInput: (input: string, maxLength: number = 1000) => {
      if (input.length > maxLength) return false;
      return !/<script\b[^>]*>([\s\S]*?)<\/script>/gim.test(input);
    }
  };

  /**
   * Data module for formatting and processing
   */
  public data = {
    formatDate: (date: any, lang: Language = 'ru'): string => {
      if (!date) return '---';
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '---';
        return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        return '---';
      }
    },
    truncate: (text: string, length: number): string => {
      if (!text) return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
    },
    filter: <T>(list: T[], predicate: (item: T) => boolean) => {
      return list.filter(predicate);
    },
    sort: <T>(list: T[], key: keyof T, order: 'asc' | 'desc' = 'asc') => {
      return [...list].sort((a, b) => {
        if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }
  };

  /**
   * UI module for common interface actions
   */
  public ui = {
    scrollTo: (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    },
    applyOffset: (id: string, offset: string = '1rem') => {
      const el = document.getElementById(id);
      if (el) el.style.marginLeft = offset;
    }
  };

  /**
   * Logging module for system tracking and debugging
   */
  public logging = {
    info: (message: string, data?: any) => {
      console.log(`%c[MINISTRY_INFO] %c${message}`, 'color: #C3A6E6; font-weight: bold;', 'color: white;', data || '');
      this.notifyLogSubscribers('info', message, data);
    },
    warn: (message: string, data?: any) => {
      console.warn(`%c[MINISTRY_WARN] %c${message}`, 'color: #F27D26; font-weight: bold;', 'color: white;', data || '');
      this.notifyLogSubscribers('warn', message, data);
    },
    error: (message: string, data?: any) => {
      console.error(`%c[MINISTRY_ERROR] %c${message}`, 'color: #FF4444; font-weight: bold;', 'color: white;', data || '');
      this.notifyLogSubscribers('error', message, data);
    },
    perf: (label: string, duration: number) => {
      console.log(`%c[MINISTRY_PERF] %c${label}: %c${duration.toFixed(2)}ms`, 'color: #00FF00; font-weight: bold;', 'color: white;', 'color: #00FF00;', '');
      this.notifyLogSubscribers('perf', label, { duration });
    },
    system: (message: string, data?: any) => {
      console.log(`%c[MINISTRY_SYSTEM] %c${message}`, 'color: #4A90E2; font-weight: bold;', 'color: white;', data || '');
      this.notifyLogSubscribers('system', message, data);
    },
    action: (action: string, details?: any) => {
      console.log(`%c[MINISTRY_ACTION] %c${action}`, 'color: #F8E71C; font-weight: bold;', 'color: white;', details || '');
      this.notifyLogSubscribers('action', action, details);
    },
    trackEvent: (eventName: string, properties?: any) => {
      this.logging.info(`Event Tracked: ${eventName}`, properties);
    }
  };

  public subscribeToLogs(callback: (level: string, message: string, data?: any) => void) {
    this.logSubscribers.push(callback);
    return () => {
      this.logSubscribers = this.logSubscribers.filter(s => s !== callback);
    };
  }

  private notifyLogSubscribers(level: string, message: string, data?: any) {
    this.logSubscribers.forEach(s => s(level, message, data));
  }

  /**
   * DOM manipulation helpers
   */
  public dom = {
    addClass: (el: HTMLElement | string, className: string) => {
      const element = typeof el === 'string' ? document.getElementById(el) : el;
      element?.classList.add(className);
    },
    removeClass: (el: HTMLElement | string, className: string) => {
      const element = typeof el === 'string' ? document.getElementById(el) : el;
      element?.classList.remove(className);
    },
    toggleClass: (el: HTMLElement | string, className: string) => {
      const element = typeof el === 'string' ? document.getElementById(el) : el;
      element?.classList.toggle(className);
    },
    isVisible: (el: HTMLElement | string) => {
      const element = typeof el === 'string' ? document.getElementById(el) : el;
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }
  };

  /**
   * Time and Date helpers
   */
  public time = {
    now: () => Date.now(),
    seconds: (s: number) => s * 1000,
    minutes: (m: number) => m * 60 * 1000,
    hours: (h: number) => h * 60 * 60 * 1000,
    days: (d: number) => d * 24 * 60 * 60 * 1000,
    formatRelative: (date: any) => {
      const now = Date.now();
      const diff = now - new Date(date).getTime();
      const sec = Math.floor(diff / 1000);
      if (sec < 60) return 'just now';
      const min = Math.floor(sec / 60);
      if (min < 60) return `${min}m ago`;
      const hr = Math.floor(min / 60);
      if (hr < 24) return `${hr}h ago`;
      const day = Math.floor(hr / 24);
      return `${day}d ago`;
    }
  };

  /**
   * Validation module for data integrity
   */
  public validation = {
    isEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    isUrl: (url: string) => {
      try { new URL(url); return true; } catch { return false; }
    },
    isNumeric: (val: any) => !isNaN(parseFloat(val)) && isFinite(val),
    minLength: (val: string, min: number) => val.length >= min,
    maxLength: (val: string, max: number) => val.length <= max,
    matches: (val: string, regex: RegExp) => regex.test(val)
  };

  /**
   * String manipulation helpers
   */
  public string = {
    capitalize: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
    slugify: (s: string) => s.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'),
    camelCase: (s: string) => s.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, ''),
    truncate: (s: string, len: number) => s.length > len ? s.substring(0, len) + '...' : s,
    stripHtml: (s: string) => s.replace(/<[^>]*>?/gm, '')
  };

  /**
   * Utility functions for common tasks
   */
  public utils = {
    deepClone: <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),
    merge: (target: any, source: any) => ({ ...target, ...source }),
    generateId: (prefix: string = 'id') => `${prefix}_${Math.random().toString(36).substr(2, 9)}`,
    sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
    omit: (obj: any, keys: string[]) => {
      const result = { ...obj };
      keys.forEach(key => delete result[key]);
      return result;
    },
    pick: (obj: any, keys: string[]) => {
      const result: any = {};
      keys.forEach(key => { if (key in obj) result[key] = obj[key]; });
      return result;
    }
  };

  /**
   * Analytics module for tracking user behavior
   */
  public analytics = {
    pageView: (page: string) => {
      this.logging.system(`Page View: ${page}`);
    },
    interaction: (element: string, action: string) => {
      this.logging.action(`Interaction: ${action} on ${element}`);
    }
  };

  /**
   * Optimization module for performance and loading
   */
  public optimization = {
    debounce: (fn: Function, ms: number) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return function(this: any, ...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), ms);
      };
    },
    memoize: (fn: Function) => {
      const cache = new Map();
      return (...args: any[]) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) return cache.get(key);
        const result = fn(...args);
        cache.set(key, result);
        return result;
      };
    }
  };

  /**
   * HSR Lore and Data module
   */
  public hsr = {
    getAeonInfo: (name: string) => {
      const aeons: Record<string, string> = {
        nanook: 'Aeon of Destruction. Wants to destroy the universe.',
        lan: 'Aeon of The Hunt. Chasing the Abundance.',
        ix: 'Aeon of Nihility. Believes existence is meaningless.',
        yaoshi: 'Aeon of Abundance. Grants immortality (with a price).',
        nous: 'Aeon of Erudition. The ultimate computer.',
      };
      return aeons[name.toLowerCase()] || 'Aeon not found in current database.';
    },
    getPathInfo: (name: string) => {
      const paths: Record<string, string> = {
        destruction: 'High damage, high survivability.',
        hunt: 'Single-target damage specialists.',
        nihility: 'Debuffers and DOT dealers.',
        abundance: 'Healers and sustain.',
        preservation: 'Shielders and tanks.',
        erudition: 'AOE damage specialists.',
        harmony: 'Buffs and support.',
      };
      return paths[name.toLowerCase()] || 'Path not found.';
    }
  };

  /**
   * Generative AI module using Gemini
   */
  public genai = {
    generate: async (prompt: string, lang: Language = 'ru', systemInstruction?: string) => {
      try {
        const response = await fetch('https://ais-dev-g6mk2usjcbx5fep6hun7ul-492067002163.europe-west2.run.app/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, lang, systemInstruction })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API Error');
        }

        const data = await response.json();
        return data.text;
      } catch (error) {
        // Silence the error in console to avoid user panic, just log a system warning
        this.logging.system('Switching to Local Lore Engine due to API restriction.');
        return this.localAi.generate(prompt, lang);
      }
    }
  };

  /**
   * Local Lore Engine (Enhanced with Keyword Matching)
   */
  public localAi = {
    generate: (prompt: string, lang: Language = 'ru') => {
      const p = prompt.toLowerCase();
      const isRu = lang === 'ru';

      const database = {
        aeon: isRu 
          ? "Эоны — это высшие существа, воплощающие концепции Путей. Министерство считает их продвинутым ИИ вселенной. Нанук (Разрушение), Лань (Охота), IX (Небытие) — главные объекты наблюдения."
          : "Aeons are supreme beings embodying the concepts of Paths. The Ministry views them as the universe's advanced AI. Nanook (Destruction), Lan (Hunt), IX (Nihility) are key subjects.",
        stellaron: isRu
          ? "Стелларон («Опухоль всех миров») — это источник хаоса. Мы изучаем способы его программной изоляции. Кафка и Охотники за Стелларонами — наши коллеги (или конкуренты)."
          : "Stellaron ('The Cancer of All Worlds') is a source of chaos. We are studying ways to isolate it. Kafka and the Stellaron Hunters are our colleagues (or competitors).",
        hsr: isRu
          ? "Honkai: Star Rail — это симуляция космического путешествия. Министерство одобряет Путь Освоения. Пом-Пом — лучший проводник."
          : "Honkai: Star Rail is a space travel simulation. The Ministry approves the Path of Trailblaze. Pom-Pom is the best conductor.",
        acheron: isRu
          ? "Ахерон — эманатор Небытия. Её данные зашифрованы. Она часто забывает дорогу, но никогда не забывает свой меч."
          : "Acheron is an Emanator of Nihility. Her data is encrypted. She often forgets the way, but never her sword.",
        express: isRu
          ? "Звездный Экспресс — это мобильная база данных Освоения. Акивили был его создателем. Мы следим за расписанием."
          : "The Astral Express is the mobile database of Trailblaze. Akivili was its creator. We monitor the schedule.",
        help: isRu
          ? "Я — локальный модуль Министерства. Могу рассказать о лоре HSR, персонажах или выдать системную справку."
          : "I am a local Ministry module. I can tell you about HSR lore, characters, or provide system info.",
        default: isRu
          ? "Запрос принят. Анализ лора подтверждает: Путь Освоения бесконечен. (Локальный движок v1.5)"
          : "Request received. Lore analysis confirms: The Path of Trailblaze is infinite. (Local Engine v1.5)"
      };

      let response = database.default;
      if (p.includes('эон') || p.includes('aeon')) response = database.aeon;
      else if (p.includes('стелларон') || p.includes('stellaron')) response = database.stellaron;
      else if (p.includes('ахерон') || p.includes('acheron')) response = database.acheron;
      else if (p.includes('экспресс') || p.includes('express')) response = database.express;
      else if (p.includes('hsr') || p.includes('хср') || p.includes('star rail')) response = database.hsr;
      else if (p.includes('помощь') || p.includes('help')) response = database.help;

      return `[LOCAL_AI] ${response}`;
    }
  };

  /**
   * Terminal simulation module
   */
  private terminalMode: 'normal' | 'ai' | 'local' = 'normal';
  public terminal = {
    setMode: (mode: 'normal' | 'ai' | 'local') => {
      this.terminalMode = mode;
      this.logging.system(`Terminal mode changed to: ${mode}`);
    },
    getMode: () => this.terminalMode,
    execute: async (command: string, lang: Language = 'ru'): Promise<string> => {
      const parts = command.trim().split(' ');
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      // Handle mode switching
      if (cmd === 'regim') {
        if (args[0] === 'ai') {
          this.terminalMode = 'ai';
          return lang === 'ru' ? 'РЕЖИМ ИИ АКТИВИРОВАН (Gemini Flash - Бесплатно).' : 'AI MODE ACTIVATED (Gemini Flash - Free).';
        }
        if (args[0] === 'local') {
          this.terminalMode = 'local';
          return lang === 'ru' ? 'ЛОКАЛЬНЫЙ РЕЖИМ АКТИВИРОВАН (Без API).' : 'LOCAL MODE ACTIVATED (No API).';
        }
      }
      
      if (cmd === 'exit') {
        this.terminalMode = 'normal';
        return lang === 'ru' ? 'РЕЖИМ ДЕАКТИВИРОВАН.' : 'MODE DEACTIVATED.';
      }

      // Execution logic
      if (this.terminalMode === 'ai') {
        return await this.genai.generate(command, lang);
      }
      if (this.terminalMode === 'local') {
        return this.localAi.generate(command, lang);
      }

      switch (cmd) {
        case 'help':
          return lang === 'ru' 
            ? 'Доступные команды: help, version, status, echo [текст], gen [запрос], regim ai, exit ai, clear, ping'
            : 'Available commands: help, version, status, echo [text], gen [prompt], regim ai, exit ai, clear, ping';
        case 'version':
          return `Ministry SDK v${this.version} (BETA EDITION)`;
        case 'status':
          const statusRes = `SDK Status: ${this.ready ? 'READY' : 'INITIALIZING'}\nEnvironment: ${process.env.NODE_ENV}\nMode: ${this.terminalMode.toUpperCase()}`;
          return statusRes;
        case 'echo':
          return args.join(' ');
        case 'gen':
          if (args.length === 0) return lang === 'ru' ? 'Использование: gen [запрос]' : 'Usage: gen [prompt]';
          return await this.genai.generate(args.join(' '), lang);
        case 'ping':
          return 'pong';
        case 'clear':
          return 'CLEAR_TERMINAL';
        default:
          return lang === 'ru' 
            ? `Неизвестная команда: ${cmd}. Введите 'help' для списка команд.`
            : `Unknown command: ${cmd}. Type 'help' for available commands.`;
      }
    }
  };

  /**
   * SDK Usage Explanation
   */
  public help = {
    getUsage: (lang: Language = 'ru') => {
      if (lang === 'ru') {
        return {
          title: "Министерство Ахахи SDK (BETA)",
          description: "Комплексный набор инструментов для разработчиков и системных администраторов в экосистеме Ахахи.",
          useCases: [
            "Синхронизация данных: Синхронизация состояния игры между клиентами через Firebase.",
            "Интеграция ИИ: Использование Gemini AI для динамических диалогов и анализа контента.",
            "Логирование и Мониторинг: Отслеживание производительности и взаимодействий в реальном времени.",
            "Безопасность: Валидация ввода и ограничение частоты запросов.",
            "Доступ к оборудованию: Управление вибрацией, буфером обмена и функциями обмена."
          ],
          gettingStarted: "Импортируйте экземпляр 'sdk' из '@sdk' и вызывайте методы модулей, например: sdk.logging.info('Hello')."
        };
      }
      return {
        title: "Ministry of Ahahi SDK (BETA)",
        description: "A comprehensive toolkit for game developers and system administrators within the Ahahi ecosystem.",
        useCases: [
          "Data Synchronization: Sync game state across multiple clients using Firebase.",
          "AI Integration: Leverage Gemini AI for dynamic dialogue, theory generation, and content analysis.",
          "Logging & Monitoring: Track performance and user interactions in real-time.",
          "Security: Validate user input and enforce rate limits on critical actions.",
          "Hardware Access: Control device vibration, clipboard, and sharing features."
        ],
        gettingStarted: "Import the 'sdk' instance from '@sdk' and call any module method, e.g., sdk.logging.info('Hello')."
      };
    }
  };
}

export const sdk = MinistrySDK.getInstance();
