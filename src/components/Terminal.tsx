import React, { useState, useRef, useEffect } from 'react';
import { Language, translations } from '../data/translations';

interface TerminalProps {
  lang: Language;
}

export const Terminal: React.FC<TerminalProps> = ({ lang }) => {
  const t = translations[lang];
  
  const termStrings = {
    ru: {
      help: "Доступные команды:",
      helpDesc: "Показать этот список",
      warpDesc: "Симулятор гачи",
      pityDesc: "Показать счетчик гаранта",
      quoteDesc: "Случайная цитата",
      pompomDesc: "Показать маскота",
      feedbackDesc: "Показать сохраненный фидбек",
      clearDesc: "Очистить терминал",
      dateDesc: "Текущая дата",
      pityText: "Текущий гарант:",
      errorText: "Команда не найдена:",
      typeHelp: "Введите 'help'.",
      noFeedback: "Фидбека пока нет."
    },
    en: {
      help: "Available commands:",
      helpDesc: "Show this list",
      warpDesc: "Gacha simulator",
      pityDesc: "Show pity counter",
      quoteDesc: "Random quote",
      pompomDesc: "Show mascot",
      feedbackDesc: "Show saved feedback",
      clearDesc: "Clear terminal",
      dateDesc: "Current date",
      pityText: "Current Pity:",
      errorText: "Command not found:",
      typeHelp: "Type 'help'.",
      noFeedback: "No feedback yet."
    },
    by: {
      help: "Даступныя каманды:",
      helpDesc: "Паказаць гэты спіс",
      warpDesc: "Сімулятар гачы",
      pityDesc: "Паказаць лічыльнік гаранта",
      quoteDesc: "Выпадковая цытата",
      pompomDesc: "Паказаць маскота",
      feedbackDesc: "Паказаць захаваны фідбэк",
      clearDesc: "Ачысціць тэрмінал",
      dateDesc: "Бягучая дата",
      pityText: "Бягучы гарант:",
      errorText: "Каманда не знойдзена:",
      typeHelp: "Увядзіце 'help'.",
      noFeedback: "Фідбэка пакуль няма."
    },
    jp: {
      help: "利用可能なコマンド:",
      helpDesc: "このリストを表示",
      warpDesc: "ガチャシミュレーター",
      pityDesc: "天井カウンターを表示",
      quoteDesc: "ランダムな名言",
      pompomDesc: "マスコットを表示",
      feedbackDesc: "保存されたフィードバックを表示",
      clearDesc: "端末をクリア",
      dateDesc: "現在の日付",
      pityText: "現在の天井:",
      errorText: "コマンドが見つかりません:",
      typeHelp: "「help」と入力してください。",
      noFeedback: "フィードバックはまだありません。"
    },
    de: {
      help: "Verfügbare Befehle:",
      helpDesc: "Diese Liste anzeigen",
      warpDesc: "Gacha-Simulator",
      pityDesc: "Pity-Zähler anzeigen",
      quoteDesc: "Zufälliges Zitat",
      pompomDesc: "Maskottchen anzeigen",
      feedbackDesc: "Gespeichertes Feedback anzeigen",
      clearDesc: "Terminal leeren",
      dateDesc: "Aktuelles Datum",
      pityText: "Aktuelles Pity:",
      errorText: "Befehl nicht gefunden:",
      typeHelp: "Geben Sie 'help' ein.",
      noFeedback: "Noch kein Feedback."
    },
    fr: {
      help: "Commandes disponibles:",
      helpDesc: "Afficher cette liste",
      warpDesc: "Simulateur de gacha",
      pityDesc: "Afficher le compteur de pity",
      quoteDesc: "Citation aléatoire",
      pompomDesc: "Afficher la mascotte",
      feedbackDesc: "Afficher les retours enregistrés",
      clearDesc: "Effacer le terminal",
      dateDesc: "Date actuelle",
      pityText: "Pity actuelle:",
      errorText: "Commande introuvable:",
      typeHelp: "Tapez 'help'.",
      noFeedback: "Aucun retour pour le moment."
    },
    zh: {
      help: "可用命令:",
      helpDesc: "显示此列表",
      warpDesc: "抽卡模拟器",
      pityDesc: "显示保底计数",
      quoteDesc: "随机名言",
      pompomDesc: "显示吉祥物",
      feedbackDesc: "显示已保存的反馈",
      clearDesc: "清除终端",
      dateDesc: "当前日期",
      pityText: "当前保底:",
      errorText: "未找到命令:",
      typeHelp: "输入 'help'。",
      noFeedback: "暂无反馈。"
    }
  };

  const ts = termStrings[lang] || termStrings['en'];

  const [history, setHistory] = useState<{ type: 'command' | 'response' | 'error', content: string | React.ReactNode }[]>([
    { type: 'response', content: t.terminalWelcome }
  ]);
  const [input, setInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    if (!trimmed) return;

    const newHistory = [...history, { type: 'command' as const, content: `> ${cmd}` }];

    switch (trimmed) {
      case 'help':
        newHistory.push({
          type: 'response',
          content: (
            <div className="flex flex-col gap-1">
              <div>{ts.help}</div>
              <div><span className="text-purple-400">help</span> - {ts.helpDesc}</div>
              <div><span className="text-purple-400">warp</span> - {ts.warpDesc}</div>
              <div><span className="text-purple-400">pity</span> - {ts.pityDesc}</div>
              <div><span className="text-purple-400">quote</span> - {ts.quoteDesc}</div>
              <div><span className="text-purple-400">pompom</span> - {ts.pompomDesc}</div>
              <div><span className="text-purple-400">feedback</span> - {ts.feedbackDesc}</div>
              <div><span className="text-purple-400">clear</span> - {ts.clearDesc}</div>
              <div><span className="text-purple-400">date</span> - {ts.dateDesc}</div>
            </div>
          )
        });
        break;
      case 'clear':
        setHistory([{ type: 'response', content: t.terminalWelcome }]);
        setInput('');
        return;
      case 'date':
        newHistory.push({ type: 'response', content: new Date().toLocaleString() });
        break;
      case 'warp':
        const pity = parseInt(localStorage.getItem('warpPity') || '0') + 1;
        let chance = 0.6;
        if (pity > 75) chance += (pity - 75) * 10;
        
        const rand = Math.random() * 100;
        if (rand <= chance || pity >= 90) {
          localStorage.setItem('warpPity', '0');
          newHistory.push({ type: 'response', content: <span className="text-yellow-400 font-bold">★ ★ ★ ★ ★ [LEGENDARY] (Pity: {pity})</span> });
        } else if (rand <= 5.1 + chance) {
          localStorage.setItem('warpPity', pity.toString());
          newHistory.push({ type: 'response', content: <span className="text-purple-400 font-bold">★ ★ ★ ★ [EPIC]</span> });
        } else {
          localStorage.setItem('warpPity', pity.toString());
          newHistory.push({ type: 'response', content: <span className="text-gray-400">★ ★ ★ [RARE]</span> });
        }
        break;
      case 'pity':
        const currentPity = localStorage.getItem('warpPity') || '0';
        newHistory.push({ type: 'response', content: `${ts.pityText} ${currentPity} / 90` });
        break;
      case 'quote':
        const quotes = [
          "Rules are made to be broken!",
          "If you don't want to regret, make sure you have nothing to regret.",
          "Sometimes silence hurts more than the cruelest words.",
          "The universe is vast and full of interesting things."
        ];
        newHistory.push({ type: 'response', content: `"${quotes[Math.floor(Math.random() * quotes.length)]}"` });
        break;
      case 'pompom':
        newHistory.push({ 
          type: 'response', 
          content: (
            <pre className="text-purple-400 text-xs leading-tight">
{`
            /\\_/\\
           ( o.o )
            >   <
`}
            </pre>
          )
        });
        break;
      case 'feedback':
        const fbData = JSON.parse(localStorage.getItem('hsr_feedback') || '[]');
        if (fbData.length === 0) {
          newHistory.push({ type: 'response', content: ts.noFeedback });
        } else {
          const fbContent = fbData.map((fb: any) => (
            <div key={fb.id} className="mb-2 border-b border-[#5C4B8B] pb-2 last:border-0">
              <span className={fb.type === 'bug' ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                [{fb.type.toUpperCase()}]
              </span>
              <span className="text-gray-500 text-xs ml-2">{new Date(fb.date).toLocaleString()}</span>
              <div className="text-gray-300 mt-1 whitespace-pre-wrap">{fb.text}</div>
            </div>
          ));
          newHistory.push({ type: 'response', content: <div className="flex flex-col gap-2">{fbContent}</div> });
        }
        break;
      default:
        newHistory.push({ type: 'error', content: `${ts.errorText} ${cmd}. ${ts.typeHelp}` });
    }

    setHistory(newHistory);
    setInput('');
  };

  return (
    <div className="bg-[#3E3160] dark:bg-[#221A3D] rounded-xl overflow-hidden border border-[#5C4B8B] shadow-xl font-mono text-sm mt-8">
      <div className="bg-[#2F244F] dark:bg-[#1A1333] px-4 py-2 flex items-center gap-2 border-b border-[#5C4B8B]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs text-gray-400 ml-2">{t.terminalTitle}</div>
      </div>
      <div ref={containerRef} className="p-4 h-48 overflow-y-auto text-gray-300 flex flex-col gap-2">
        {history.map((item, i) => (
          <div key={i} className={
            item.type === 'command' ? 'text-gray-400' :
            item.type === 'error' ? 'text-red-400' : 'text-gray-200'
          }>
            {item.content}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-purple-400 font-bold">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommand(input)}
            className="flex-1 bg-transparent outline-none text-gray-200"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
};
