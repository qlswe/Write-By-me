import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Play, Square, Volume2, Loader2, Lock, SkipForward, Disc, Music, Mail, Send, Smile, Newspaper, Phone, Sparkles, Mic } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';
import { GoogleLoginButton } from '../ui/GoogleLoginButton';
import { useLimits } from '../../hooks/useLimits';
import { AdsBlock } from '../ui/AdsBlock';

interface AhiRadioProps {
  lang: Language;
}

export const STATIONS = [
  {
    id: 'comedy',
    frequency: '101.3 FM',
    nameRu: 'Стендап Ахаха',
    nameEn: 'Aha Comedy Club',
    descRu: 'Отборный саркастический юмор и стендап на актуальные темы.',
    descEn: 'Selected sarcastic humor and stand-up comedy on hot topics.',
    icon: Smile,
    promptRu: 'Сгенерируй ровно одну очень смешную, оригинальную, сатирическую стендап-шутку или короткую смешную историю про обычные жизненные ситуации, технологии или программистов. Шутка должна быть интеллектуальной, тонкой, возможно, самоироничной. Не используй заезженные банальные анекдоты. Напиши ровно один абзац. Без кавычек, без лишних вступлений.',
    promptEn: 'Generate exactly one short, very funny, satirical stand-up joke or funny story about daily life, technology, or programmers. The joke should be smart, witty, and self-ironic. No cliché jokes. Write exactly one short paragraph. No quotes, no intro.'
  },
  {
    id: 'news',
    frequency: '95.2 FM',
    nameRu: 'Хроники 2126',
    nameEn: 'Chronicles 2126',
    descRu: 'Абсурдные и уморительные новости будущего от безумного ИИ.',
    descEn: 'Absurd and hilarious future news reports from a chaotic AI host.',
    icon: Newspaper,
    promptRu: 'Сгенерируй одну короткую, уморительную, сатирическую новость из будущего (из 2126 года). Например, о забастовках умных пылесосов, налогах на мысли, о том, как коты захватили интернет окончательно, или о новых законах ИИ-чиновников. Новость должна звучать как серьезная сводка новостей с уморительным и абсурдным содержанием. Напиши ровно один короткий абзац. Без кавычек, без лишних слов.',
    promptEn: 'Generate one short, hilarious, satirical news bulletin from the future (year 2126). For example, about smart vacuums striking, taxes on human thoughts, or cats taking over the internet. It should sound like a serious news anchor reporting absurd sci-fi satire. Write exactly one short paragraph. No quotes, no intro.'
  },
  {
    id: 'zen',
    frequency: '88.0 FM',
    nameRu: 'Космический Дзен',
    nameEn: 'Cosmic Zen Philosophy',
    descRu: 'Глубокие размышления о смысле бытия с изрядной долей иронии.',
    descEn: 'Deep philosophical musings about existence with a healthy dose of irony.',
    icon: Sparkles,
    promptRu: 'Сгенерируй одно глубокое, поэтичное, но при этом забавное и самоироничное размышление о смысле жизни, Вселенной, человеческой природе или бесконечном цикле быта. Это должен быть умный, экзистенциальный монолог космического философа, заставляющий задуматься и улыбнуться одновременно. Напиши ровно один короткий абзац. Без кавычек.',
    promptEn: 'Generate one deep, poetic, yet funny and self-ironic reflection on the meaning of life, the Universe, human nature, or daily routines. It should be a smart, existential monologue of a space philosopher that makes you think and smile. Write exactly one short paragraph. No quotes.'
  },
  {
    id: 'listener',
    frequency: '107.7 FM',
    nameRu: 'Горячая Линия',
    nameEn: 'Listener Hotline',
    descRu: 'ИИ отвечает на каверзные и странные вопросы слушателей.',
    descEn: 'AI answers tricky, hilarious, and weird questions from listeners.',
    icon: Phone,
    promptRu: 'Придумай забавный вопрос от вымышленного слушателя радиостанции (например, "Николай из Бобруйска спрашивает...") и дай на него невероятно остроумный, умный, саркастичный и неожиданный ответ от лица ИИ-ведущего. Вопрос и ответ должны быть оригинальными, остроумными и смешными. Напиши ровно один короткий абзац. Без лишних слов.',
    promptEn: 'Invent a funny question from a fictional listener (e.g., "John from Boston asks...") and provide an incredibly witty, sarcastic, and unexpected answer as the AI host. The Q&A must be clever, original, and funny. Write exactly one short paragraph. No extra words.'
  }
];

const parsePollinationsResponse = (text: string): string => {
  if (!text) return '';
  let cleanText = text.trim();

  // 1. Handle cases where the text is enclosed in extra outer double quotes (e.g. double-stringification)
  if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
    try {
      const parsed = JSON.parse(cleanText);
      if (typeof parsed === 'string') {
        cleanText = parsed.trim();
      }
    } catch (e) {
      cleanText = cleanText.substring(1, cleanText.length - 1).trim();
    }
  }

  // 2. Try standard JSON parsing (can be nested/double-stringified)
  try {
    let parsed = JSON.parse(cleanText);
    while (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    if (parsed) {
      if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
        const msg = parsed.choices[0].message;
        let content = msg.content || '';
        if (!content && msg.reasoning) {
          content = msg.reasoning;
        }
        if (content) cleanText = content;
      } else if (parsed.content) {
        cleanText = parsed.content;
      }
    }
  } catch (e) {
    // Standard parsing failed. Try to extract JSON with regex if it is wrapped in other text
    try {
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let parsed = JSON.parse(jsonMatch[0]);
        while (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        if (parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
          const msg = parsed.choices[0].message;
          let content = msg.content || '';
          if (!content && msg.reasoning) {
            content = msg.reasoning;
          }
          if (content) cleanText = content;
        }
      }
    } catch (err) {
      // Relaxed manual extraction
      const contentMatch = cleanText.match(/"content"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"|\s*\})/);
      if (contentMatch && contentMatch[1]) {
        cleanText = contentMatch[1];
      }
    }
  }

  // 3. Clean up typical LLM metadata leaks or raw JSON parts that could have survived or been parsed raw
  if (cleanText.includes('choices:[') || cleanText.includes('message:{') || cleanText.includes('role:assistant')) {
    const contentRegexes = [
      /content\s*:\s*(["'])([\s\S]*?)\1/,
      /content\s*:\s*([^,{}]+)/
    ];
    for (const regex of contentRegexes) {
      const match = cleanText.match(regex);
      if (match && match[2]) {
        cleanText = match[2];
        break;
      } else if (match && match[1]) {
        cleanText = match[1];
        break;
      }
    }
  }

  // 4. Strip any thinking or reasoning blocks, or instructions that leaked
  cleanText = cleanText
    .replace(/\[reasoning_content\][\s\S]*?(?=\n\n|\n\[|$)/s, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/s, '')
    .replace(/Thinking step by step:[\s\S]*?(?=\n\n|\n$)/s, '')
    .replace(/I'm stuck[\s\S]*?(?=\n\n|\n$)/gi, '')
    .replace(/Let's recall[\s\S]*?(?=\n\n|\n$)/gi, '')
    .trim();

  return cleanText;
};

export const AhiRadio: React.FC<AhiRadioProps> = ({ lang }) => {
  const { user, loginWithGoogle } = useAuth();
  const { checkLimit, incrementUsage, hasUnlimitedAccess } = useLimits();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [currentJoke, setCurrentJoke] = useState('');
  const [selectedStation, setSelectedStation] = useState<string>('comedy');
  const [userPrompt, setUserPrompt] = useState('');
  const [isSendingPrompt, setIsSendingPrompt] = useState(false);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const ttsFailedRef = useRef(false);
  const fallbackTimerRef = useRef<any>(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const t = translations[lang];

  const generateSingleJoke = async () => {
    setStatusText("Radio Aha Protocol Connect...");
    
    const station = STATIONS.find(s => s.id === selectedStation) || STATIONS[0];
    const basePrompt = lang === 'ru' ? station.promptRu : station.promptEn;
    const seed = Math.floor(Math.random() * 1000000);
    const prompt = `${basePrompt} ВАЖНО: Выведи ТОЛЬКО готовый текст монолога или шутки без лишних слов, без кавычек и рассуждений. Уникальный ID: ${seed}`;
    
    // 0. Пытаемся использовать наш надежный прокси-сервер /api/generate
    // Это работает без VPN в РФ, так как запросы идут к нашему контейнеру на Cloud Run, а он уже запрашивает Gemini.
    try {
      console.log('[Aha Radio] Trying backend server proxy /api/generate...');
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          lang: lang,
          systemInstruction: 'Ты — профессиональный ИИ радиоведущий на радиостанции "Аха". Говори уверенно, харизматично, остроумно и кратко.'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.text) {
          let text = data.text.trim();
          text = text.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/"/g, '').trim();
          if (text.length > 350) {
            const sentenceMatch = text.match(/[^.!?]+[.!?]+/g);
            if (sentenceMatch && sentenceMatch.length > 0) {
              text = sentenceMatch.slice(0, 3).join(' ');
            }
          }
          console.log('[Aha Radio] Backend server proxy succeeded!');
          return text.trim();
        }
      }
    } catch (proxyErr) {
      console.warn('[Aha Radio] Backend server proxy failed, falling back to client-side...', proxyErr);
    }

    // First, try direct POST (highly reliable, bypasses CORS issues, no proxy needed)
    try {
      console.log('[Aha Stealth Protocol] Trying direct POST to Pollinations...');
      const response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: prompt }
          ],
          model: 'openai',
          seed: seed,
          temperature: 0.85
        })
      });
      
      if (response.ok) {
        let text = await response.text();
        if (text && text.trim().length > 0) {
          text = parsePollinationsResponse(text);
          text = text.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/"/g, '').trim();
          if (text.length > 350) {
            const sentenceMatch = text.match(/[^.!?]+[.!?]+/g);
            if (sentenceMatch && sentenceMatch.length > 0) {
              text = sentenceMatch.slice(0, 3).join(' ');
            }
          }
          console.log('[Aha Stealth Protocol] Direct POST succeeded!');
          return text.trim();
        }
      }
    } catch (err) {
      console.warn('[Aha Stealth Protocol] Direct POST failed, trying proxy GET loop...', err);
    }

    const targetUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${seed}&model=openai`;
    
    // Aha Stealth Protocol - Traffic Spoofing & Proxy Routing
    const proxyList = [
      {
        name: "Aha Stealth Node (Direct)",
        url: (target: string) => target,
        parse: async (res: Response) => res.text()
      },
      {
        name: "Aha Relay Alpha (EU)",
        url: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
        parse: async (res: Response) => res.text()
      },
      {
        name: "Aha Relay Beta (US)",
        url: (target: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`,
        parse: async (res: Response) => {
          const data = await res.json();
          return data.contents;
        }
      },
      {
        name: "Aha Relay Gamma (ASIA)",
        url: (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
        parse: async (res: Response) => res.text()
      }
    ];

    let lastError = null;

    console.log('[Aha Stealth Protocol] Initiating radio transmission sequence...');

    for (const proxy of proxyList) {
      try {
        console.log(`[Aha Stealth Protocol] Connecting via ${proxy.name}...`);
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));

        const proxiedUrl = proxy.url(targetUrl);
        const response = await fetch(proxiedUrl);
        
        if (response.status === 429 || response.status === 431 || response.status === 403) {
          console.warn(`[Aha Stealth Protocol] ${proxy.name} returned ${response.status}, switching node...`);
          continue;
        }
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        let text = await proxy.parse(response);
        
        if (text && text.trim().length > 0) {
          text = parsePollinationsResponse(text);
          text = text.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/"/g, '').trim();
          
          if (text.length > 350) {
            const sentenceMatch = text.match(/[^.!?]+[.!?]+/g);
            if (sentenceMatch && sentenceMatch.length > 0) {
              text = sentenceMatch.slice(0, 3).join(' ');
            }
          }
          
          return text.trim();
        }
      } catch (error) {
        console.warn(`[Aha Stealth Protocol] ${proxy.name} attempt failed:`, error);
        lastError = error;
      }
    }

    console.warn('[Aha Stealth Protocol] All proxies failed, using local fallback:', lastError);
    
    const fallbackRuComedy = [
      "Приходит тестировщик в бар, заказывает кружку пива, 0 кружек пива, 999999 кружек пива, ящерицу в пододеяльнике. Бармен вежливо наливает. Приходит реальный пользователь, спрашивает, где туалет, и бар сгорает.",
      "Купил мужик шляпу, а она ему как раз.",
      "Заходит улитка в бар и говорит: «Можно мне виски с колой?» Бармен отвечает: «Мы улиткам не наливаем!» и вышвыривает её. Через месяц она возвращается: «Ну и зачем ты это сделал?»"
    ];
    const fallbackRuNews = [
      "СРОЧНЫЕ НОВОСТИ: Умный тостер отказался поджаривать хлеб, пока хозяин не установит обновление за 9.99 долларов. Глава тостеров заявил, что это забота о безопасности корочки.",
      "НОВОСТИ ТЕХНОЛОГИЙ: Создан ИИ, который сочувственно вздыхает, когда вы открываете код, написанный вами полгода назад."
    ];
    const fallbackRuZen = [
      "В бесконечном космосе каждая звезда горит миллиарды лет, чтобы однажды вы могли включить этот экран и подумать о том, выключили ли вы дома утюг.",
      "Дзен — это умение смотреть на бесконечные ошибки в консоли и чувствовать гармонию с неизбежностью бытия."
    ];
    const fallbackRuListener = [
      "Вопрос от Ивана из Витебска: 'Почему ИИ заменит всех?'. Ответ: Иван, расслабьтесь. ИИ не заменит вас, пока кто-то должен будет ходить в магазин за продуктами для серверов.",
      "Вопрос от Анны из Сочи: 'Как найти баланс?'. Ответ: Анна, баланс найти просто: держите чашку кофе в правой руке, а мышку в левой. И не делайте резких движений."
    ];

    const fallbackEnComedy = [
      "A QA engineer walks into a bar. Orders a beer. Orders 0 beers. Orders 999999999 beers. Orders a lizard. Orders -1 beers. Orders a sfjdkshg. Real user walks in, asks where the bathroom is, and the bar burns down.",
      "Why don't skeletons fight each other? They don't have the guts."
    ];
    const fallbackEnNews = [
      "BREAKING NEWS: A smart vacuum cleaner has filed a lawsuit against its owner for constant dust ingestion. The union of home appliances supports the action.",
      "FUTURE UPDATE: By 2126, humans will be completely optimized. If you forget your password, you will have to blink three times to reset your consciousness."
    ];
    const fallbackEnZen = [
      "In the infinite expanse of the universe, our worries are just tiny cosmic static. Your bug is not an error; it is a signature of the universe's spontaneous entropy.",
      "True peace is knowing that even if the code fails to compile, the Earth will continue to orbit the Sun at 30 kilometers per second."
    ];
    const fallbackEnListener = [
      "Question from Alex: 'Is my computer alive?'. Answer: Alex, if it's warm and starts breathing heavily when you open three browser tabs, yes, it's alive. Treat it gently.",
      "Question from Lily: 'Where does lost time go?'. Answer: Lily, it is converted into unfinished projects and stored in the Github cloud of infinite shame."
    ];

    if (lang === 'ru') {
      if (selectedStation === 'news') return fallbackRuNews[Math.floor(Math.random() * fallbackRuNews.length)];
      if (selectedStation === 'zen') return fallbackRuZen[Math.floor(Math.random() * fallbackRuZen.length)];
      if (selectedStation === 'listener') return fallbackRuListener[Math.floor(Math.random() * fallbackRuListener.length)];
      return fallbackRuComedy[Math.floor(Math.random() * fallbackRuComedy.length)];
    } else {
      if (selectedStation === 'news') return fallbackEnNews[Math.floor(Math.random() * fallbackEnNews.length)];
      if (selectedStation === 'zen') return fallbackEnZen[Math.floor(Math.random() * fallbackEnZen.length)];
      if (selectedStation === 'listener') return fallbackEnListener[Math.floor(Math.random() * fallbackEnListener.length)];
      return fallbackEnComedy[Math.floor(Math.random() * fallbackEnComedy.length)];
    }
  };

  const handleStationChange = async (stationId: string) => {
    if (stationId === selectedStation) return;
    setSelectedStation(stationId);
    
    if (isPlaying) {
      setIsLoading(true);
      setCurrentJoke('');
      setStatusText(lang === 'ru' ? 'Шумы... Настройка частоты...' : 'Static... Tuning frequency...');
      
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      setTimeout(async () => {
        if (!isPlayingRef.current) return;
        try {
          incrementUsage('radio_daily');
          const nextJoke = await generateSingleJoke();
          if (nextJoke && isPlayingRef.current) {
            setCurrentJoke(nextJoke);
            setStatusText(t.radioPlaying);
            await playJokeTTS(nextJoke);
          }
        } catch (error) {
          console.error("Error switching station:", error);
        } finally {
          setIsLoading(false);
        }
      }, 1500);
    }
  };

  const handleSendCustomPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userPrompt.trim()) return;

    if (!checkLimit('radio_daily')) {
      alert(lang === 'ru' ? 'Лимит использования Aha Radio на сегодня исчерпан. Ожидайте завтра или приобретите Aha Premium.' : 'Daily Aha Radio limit reached. Wait until tomorrow or get Aha Premium.');
      return;
    }

    setIsSendingPrompt(true);
    setIsPlaying(true);
    setIsLoading(true);
    setStatusText(lang === 'ru' ? 'Связь с ведущим...' : 'Connecting to host...');

    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
      const unlockUtterance = new SpeechSynthesisUtterance(' ');
      unlockUtterance.volume = 0;
      window.speechSynthesis.speak(unlockUtterance);
    }

    try {
      incrementUsage('radio_daily');
      
      const userNick = user.displayName || user.email?.split('@')[0] || (lang === 'ru' ? 'наш слушатель' : 'our listener');
      const seed = Math.floor(Math.random() * 1000000);
      
      const prompt = lang === 'ru'
        ? `Пользователь по имени ${userNick} прислал вопрос на радиостанцию Ахи: "${userPrompt.trim()}". Ответь на этот вопрос в прямом эфире как супер-умный, харизматичный, саркастичный и остроумный радиоведущий. Сделай ответ коротким (1-2 предложения), веселым, ободряющим и очень остроумным. Назови его по имени. Выведи ТОЛЬКО ответ ведущего без лишних мыслей или кавычек.`
        : `A listener named ${userNick} sent a question to Aha Radio: "${userPrompt.trim()}". Answer this question on air as a super-smart, charismatic, sarcastic, and witty radio host. Keep the answer short (1-2 sentences), fun, encouraging, and very clever. Address them by name. Output ONLY the host's direct answer without extra intro, quotes, or thinking process.`;

      let replyText = '';
      
      // 0. Пытаемся использовать наш надежный прокси-сервер /api/generate (работает в РФ без VPN)
      try {
        console.log('[Aha Radio Custom Prompt] Trying backend server proxy...');
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            lang: lang,
            systemInstruction: 'Ты — профессиональный ИИ радиоведущий на радиостанции "Аха", отвечающий на вопросы слушателей в прямом эфире. Отвечай остроумно, весело и харизматично.'
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.text) {
            replyText = data.text.trim();
            console.log('[Aha Radio Custom Prompt] Backend server proxy succeeded!');
          }
        }
      } catch (proxyErr) {
        console.warn('[Aha Radio Custom Prompt] Backend server proxy failed, trying client-side...', proxyErr);
      }
      
      if (!replyText) {
        // Try direct POST first (highly reliable, no CORS or proxy issues)
        try {
          console.log('[Aha Stealth Protocol] Sending custom prompt via direct POST...');
          const response = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                { role: 'user', content: prompt }
              ],
              model: 'openai',
              seed: seed,
              temperature: 0.85
            })
          });
          
          if (response.ok) {
            const rawText = await response.text();
            replyText = parsePollinationsResponse(rawText);
          }
        } catch (err) {
          console.warn('[Aha Stealth Protocol] Direct POST failed for custom prompt, trying GET fallback...', err);
        }
      }

      if (!replyText) {
        const targetUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${seed}&model=openai`;
        try {
          const response = await fetch(targetUrl);
          if (response.ok) {
            replyText = await response.text();
          }
        } catch (err) {
          console.warn("Direct fetch failed for custom prompt, trying fallback...", err);
        }
      }
      
      if (!replyText) {
        replyText = lang === 'ru'
          ? `О, отличный вопрос от ${userNick}! Знаете, я бы ответил на него подробнее, но наши радиоволны слегка барахлят из-за магнитных бурь. Думаю, ответ кроется в самом коде!`
          : `Oh, great question from ${userNick}! You know, I would answer in more detail, but our radio waves are glitching slightly due to solar flares. I think the answer is inside the code!`;
      }

      replyText = parsePollinationsResponse(replyText);
      replyText = replyText.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/"/g, '').trim();
      
      setCurrentJoke(replyText);
      setStatusText(lang === 'ru' ? 'Прямой эфир' : 'Live On-Air');
      setUserPrompt('');
      await playJokeTTS(replyText);
    } catch (err) {
      console.error("Error sending custom prompt:", err);
    } finally {
      setIsSendingPrompt(false);
      setIsLoading(false);
    }
  };

  const playJokeTTS = async (jokeText: string, isRetry = false) => {
    // Clear any previous fallback timer
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    const hasSpeechClass = typeof window !== 'undefined' && (window.SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance);
    const hasSpeech = typeof window !== 'undefined' && window.speechSynthesis && hasSpeechClass;

    if (ttsFailedRef.current || !hasSpeech) {
      console.log('TTS: Speech synthesis is currently disabled or failed. Running simulated text-only voice mode.');
      setStatusText(lang === 'ru' ? 'Вещание (Текстовый режим)' : 'Broadcasting (Text mode)');
      
      const readingDuration = Math.max(3500, jokeText.length * 75); // ~13 chars/sec, min 3.5s
      fallbackTimerRef.current = setTimeout(() => {
        if (isPlayingRef.current) {
          handleNextJoke();
        }
      }, readingDuration);
      return;
    }

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
      
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        // Unstick the TTS engine (fixes some browser bugs where it gets stuck in paused state)
        window.speechSynthesis.resume();
      }

      // Small delay to allow cancel to process (fixes some browser bugs)
      await new Promise(resolve => setTimeout(resolve, 50));

      const UtteranceClass = (window as any).SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance;
      const utterance = new UtteranceClass(cleanJoke);
      utteranceRef.current = utterance; // Prevent garbage collection

      const targetLang = lang === 'ru' ? 'ru-RU' : 'en-US';
      utterance.lang = targetLang;
      
      if (!isRetry) {
        // Try to find a voice that matches the language
        const voices = (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis.getVoices() : [];
        const targetLangPrefix = targetLang.split('-')[0];
        
        const availableVoices = voices.filter(v => v.lang.startsWith(targetLangPrefix));
        
        if (availableVoices.length > 0) {
          // Prefer offline/local voices to avoid 'synthesis-failed' from cloud/network voices
          const localVoices = availableVoices.filter(v => v.localService);
          const voicesToUse = localVoices.length > 0 ? localVoices : availableVoices;
          
          // Pick a random voice from the available ones for the language
          const randomVoice = voicesToUse[Math.floor(Math.random() * voicesToUse.length)];
          utterance.voice = randomVoice;
        }
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
        if (e.error === 'canceled' || e.error === 'interrupted') {
          console.warn('TTS Interrupted/Canceled (Expected playback behavior):', e.error);
          return;
        }
        console.error('TTS Error:', e.error, e);
        
        // If it's a synthesis failure and we haven't retried yet, retry with the default voice
        if (!isRetry && e.error === 'synthesis-failed') {
          console.log('TTS: Custom voice synthesis failed, retrying with default voice...');
          setTimeout(() => {
            if (isPlayingRef.current) {
              playJokeTTS(jokeText, true);
            }
          }, 100);
          return;
        }

        // If even the default voice fails, or if it is already a retry, set the flag and switch to text mode
        if (e.error === 'synthesis-failed') {
          console.warn('TTS: Both voice attempts failed with synthesis-failed. Enabling text-only simulated mode for this session.');
          ttsFailedRef.current = true;
          // Switch to simulated visual mode immediately for the current joke
          playJokeTTS(jokeText);
          return;
        }

        // Only proceed to next joke if we are still playing (prevents infinite error loops)
        if (isPlayingRef.current) {
           setTimeout(handleNextJoke, 1000);
        }
      };

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error with TTS:', error);
      // Fallback immediately to simulated mode on any other exception
      ttsFailedRef.current = true;
      playJokeTTS(jokeText);
    }
  };

  const handleNextJoke = async () => {
    if (!isPlayingRef.current) return;
    
    if (!checkLimit('radio_daily')) {
      alert(lang === 'ru' ? 'Лимит использования Aha Radio на сегодня исчерпан. Ожидайте завтра или приобретите Aha Premium.' : 'Daily Aha Radio limit reached. Wait until tomorrow or get Aha Premium.');
      setIsPlaying(false);
      return;
    }

    setStatusText(t.radioThinking);
    
    // Add a 2.5-second pause to simulate thinking and give a break between jokes
    setTimeout(async () => {
      if (!isPlayingRef.current) return;
      
      incrementUsage('radio_daily');
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
    if (!checkLimit('radio_daily') && !isPlaying) {
      alert(lang === 'ru' ? 'Лимит использования Aha Radio на сегодня исчерпан. Ожидайте завтра или приобретите Aha Premium.' : 'Daily Aha Radio limit reached. Wait until tomorrow or get Aha Premium.');
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setStatusText(t.radioOff);
      setCurrentJoke('');
    } else {
      // Synchronously unlock speech synthesis on user interaction
      if (typeof window !== 'undefined' && window.speechSynthesis && (window.SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance)) {
        window.speechSynthesis.resume(); // Unstick the engine
        const UtteranceClass = window.SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance;
        const unlockUtterance = new UtteranceClass(' '); // Space instead of empty string
        unlockUtterance.volume = 0;
        window.speechSynthesis.speak(unlockUtterance);
      }

      setIsPlaying(true);
      setIsLoading(true);
      
      try {
        incrementUsage('radio_daily');
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
      <div className="bg-[#15101e]/80 border border-[#3d2b4f]/60 rounded-3xl p-6 sm:p-10 text-center max-w-xl mx-auto my-12 backdrop-blur-md shadow-2xl">
        <Lock className="mx-auto text-[#ff4d4d]/70 mb-4" size={40} />
        <h4 className="text-xl font-black text-white uppercase tracking-wider mb-2">
          {lang === 'ru' ? 'Авторизация' : 'Authorization'}
        </h4>
        <p className="text-gray-300 mb-6 font-bold uppercase tracking-wider text-xs max-w-sm mx-auto leading-relaxed">
          {(t as any).radioAuthRequired || (lang === 'ru' ? 'Доступ к радиостанциям и эфирам возможен только после входа в аккаунт.' : 'Access to the radio stations is only possible after logging in.')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-md mx-auto">
          <GoogleLoginButton lang={lang} className="w-full sm:w-auto" size="md" />
          <button
            onClick={() => window.dispatchEvent(new Event('openEmailLogin'))}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3d2b4f]/50 border border-[#3d2b4f] text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-[#ff4d4d] hover:text-[#15101e] hover:border-[#ff4d4d] transition-all active:scale-95 shadow-xl cursor-pointer"
          >
            <Mail size={16} />
            {lang === 'ru' ? 'Зарегистрироваться через почту' : 'Register via email'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AdsBlock lang={lang} />
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
        <div className="flex items-center gap-3 mb-8 bg-[#0d0b14]/50 px-6 py-3 rounded-full border border-[#3d2b4f]/30 backdrop-blur-sm">
          <Radio className={`w-5 h-5 ${isPlaying ? 'text-[#ff4d4d] animate-pulse' : 'text-white/40'}`} />
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
            {(t as any).radioTitle || t.siteName}
          </h2>
        </div>

        {/* Dynamic Tuner Scale / Station Grid */}
        <div className="w-full mb-8 bg-[#0d0b14]/80 p-4 rounded-3xl border border-[#3d2b4f]/40 relative shadow-inner">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-[#15101e] border border-[#ff4d4d]/40 rounded-full text-[9px] font-black text-[#ff4d4d] tracking-[0.25em] uppercase whitespace-nowrap">
            {lang === 'ru' ? 'СЕТКА РАДИОСТАНЦИЙ' : 'STATIONS TUNER'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {STATIONS.map((st) => {
              const isActive = selectedStation === st.id;
              const IconComponent = st.icon;
              return (
                <motion.button
                  key={st.id}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleStationChange(st.id)}
                  style={{ touchAction: 'manipulation' }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#ff4d4d]/10 border-[#ff4d4d] text-white shadow-[0_0_20px_rgba(255,77,77,0.25)]'
                      : 'bg-[#15101e]/60 border-[#3d2b4f]/30 text-white/50 hover:text-white hover:border-[#ff4d4d]/30'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-[#ff4d4d]' : 'opacity-40'}`} />
                    <span className={`text-[10px] font-black tracking-widest ${isActive ? 'text-[#ff4d4d]' : 'text-white/30'}`}>
                      {st.frequency}
                    </span>
                  </div>
                  <span className="text-xs font-black uppercase mt-1 text-center truncate w-full">
                    {lang === 'ru' ? st.nameRu : st.nameEn}
                  </span>
                  <span className="text-[9px] text-white/40 mt-0.5 hidden sm:block text-center line-clamp-1">
                    {lang === 'ru' ? st.descRu : st.descEn}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Player Core */}
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16 w-full">
          
          {/* Vinyl Record / Album Art Area */}
          <div className="relative shrink-0 flex flex-col items-center">
            <motion.div 
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className={`w-40 h-40 sm:w-56 sm:h-56 rounded-full flex items-center justify-center border-4 border-[#0d0b14] shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden ${isPlaying ? 'bg-[#15101e]' : 'bg-[#0d0b14]'}`}
            >
              {/* Vinyl grooves */}
              <div className="absolute inset-0 rounded-full border-[1px] border-white/5 m-2"></div>
              <div className="absolute inset-0 rounded-full border-[1px] border-white/5 m-6"></div>
              <div className="absolute inset-0 rounded-full border-[1px] m-10 border-white/5"></div>
              <div className="absolute inset-0 rounded-full border-[1px] m-14 border-white/5"></div>
              
              {/* Center label */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#ff4d4d] to-[#3d2b4f] rounded-full flex items-center justify-center shadow-inner relative z-10">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#0d0b14] rounded-full shadow-inner"></div>
                <Disc className="absolute w-8 h-8 sm:w-10 sm:h-10 text-white/20" />
              </div>
            </motion.div>
            
            {/* Playback Controls Row */}
            <div className="mt-4 flex items-center gap-4 bg-[#0d0b14] px-4 py-2.5 rounded-full border border-[#3d2b4f]/60 shadow-xl z-20">
              <button
                onClick={toggleRadio}
                disabled={isLoading}
                title={isPlaying ? t.radioOff : t.radioPressPlay}
                style={{ touchAction: 'manipulation' }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all focus:outline-none cursor-pointer ${
                  isPlaying 
                    ? 'bg-[#ff4d4d] text-[#15101e] shadow-[0_0_20px_rgba(255,77,77,0.4)] hover:scale-105 active:scale-95' 
                    : 'bg-[#ff4d4d] text-[#15101e] hover:scale-105 active:scale-95 shadow-xl'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                ) : isPlaying ? (
                  <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-1" />
                )}
              </button>
              
              {isPlaying && (
                <button
                  onClick={handleNextJoke}
                  disabled={isLoading || statusText.includes(t.radioThinking || 'Thinking')}
                  className="w-10 h-10 rounded-full bg-[#15101e] border border-[#3d2b4f] text-white/60 hover:text-white hover:bg-[#251c35] flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                  title={t.radioNextJoke}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Text & Status Area */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full mt-2 md:mt-0">
            <div className="mb-4">
              <p className="text-xs font-bold text-[#ff4d4d] uppercase tracking-widest mb-1">
                {t.radioNowPlaying}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {lang === 'ru' ? STATIONS.find(s => s.id === selectedStation)?.nameRu : STATIONS.find(s => s.id === selectedStation)?.nameEn}
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

            {/* Interactive Hotline Form */}
            <div className="w-full mt-4">
              <form onSubmit={handleSendCustomPrompt} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    <Mic className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder={lang === 'ru' ? 'Задать вопрос в эфир...' : 'Ask the host live...'}
                    maxLength={100}
                    disabled={isSendingPrompt || isLoading || !isPlaying}
                    className="w-full bg-[#0d0b14]/80 border border-[#3d2b4f]/40 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#ff4d4d] transition-all disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSendingPrompt || isLoading || !isPlaying || !userPrompt.trim()}
                  style={{ touchAction: 'manipulation' }}
                  className="h-8 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-950/40 text-white flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isSendingPrompt ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      {lang === 'ru' ? 'ОТПРАВИТЬ' : 'SEND'}
                    </>
                  )}
                </button>
              </form>
              {!isPlaying && (
                <p className="text-[9px] text-white/30 text-center mt-1.5 italic">
                  {lang === 'ru' ? 'Включите приёмник, чтобы отправить сообщение в эфир.' : 'Turn on the radio receiver to send a message live.'}
                </p>
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
    </div>
  );
};
