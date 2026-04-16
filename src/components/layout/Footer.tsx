import React from 'react';
import { MessageSquare } from 'lucide-react';
import { DailyFortune } from '../ui/DailyFortune';
import { Language, translations } from '../../data/translations';
import { logger, usePerfLogger } from '../../utils/logger';

interface FooterProps {
  lang: Language;
  setFeedbackOpen: (open: boolean) => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, setFeedbackOpen }) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('Footer');
  trackRender();

  return (
    <footer className="bg-[#251c35] border-t border-[#3d2b4f] mt-auto relative z-10">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <DailyFortune lang={lang} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div>
            <h4 className="text-[#ff4d4d] font-bold uppercase tracking-wider text-sm mb-4">{t.systemStatus}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                {t.statusExpress}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                {t.statusDb}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff4d4d] animate-pulse shadow-[0_0_8px_#ff4d4d]"></span>
                {t.statusSignal}
              </li>
            </ul>
          </div>
          
          <div className="text-sm text-gray-400 md:text-right">
            <div className="inline-block px-3 py-1 rounded-full bg-[#251c35] border border-[#3d2b4f] font-mono text-xs mb-4">
              Build: BETA-V03
            </div>
            <p className="italic opacity-80">«The Conductor always keeps things tidy!»</p>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-[#3d2b4f] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>&copy; 2026 クルシーP. {t.rights}</p>
          <div className="flex items-center gap-6">
            <button onClick={() => logger.exportLogs()} className="hover:text-[#ff4d4d] transition-colors text-xs opacity-50">
              Export Logs
            </button>
            <button onClick={() => setFeedbackOpen(true)} className="hover:text-[#ff4d4d] transition-colors flex items-center gap-2">
              <MessageSquare size={16} />
              {t.feedback || "Feedback"}
            </button>
            <a href="https://github.com/qlswe" target="_blank" rel="noreferrer" className="hover:text-[#ff4d4d] transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
