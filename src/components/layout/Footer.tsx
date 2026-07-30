import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { DailyFortune } from '../ui/DailyFortune';
import { Language, translations } from '../../data/translations';
import { logger, usePerfLogger } from '../../utils/logger';
import { usePWA } from '../../hooks/usePWA';
import { PwaInstallModal } from '../ui/PwaInstallModal';

interface FooterProps {
  lang: Language;
  setFeedbackOpen: (open: boolean) => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, setFeedbackOpen }) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('Footer');
  trackRender();

  const { isInstalled, canInstall, installPWA } = usePWA();
  const [pwaModalOpen, setPwaModalOpen] = useState(false);

  return (
    <>
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
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                  {isInstalled 
                    ? (lang === 'ru' ? 'Web-App: Активно (Standalone)' : 'Web-App: Standalone Active')
                    : (lang === 'ru' ? 'Web-App PWA: Готово к установке' : 'Web-App PWA: Ready to install')}
                </li>
              </ul>
            </div>
            
            <div className="text-sm text-gray-400 md:text-right flex flex-col items-start md:items-end justify-between">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-[#15101e] border border-[#3d2b4f] font-mono text-xs mb-4">
                  Build: BETA-V03 (PWA Supported)
                </div>
                <p className="italic opacity-80 mb-4">«The Conductor always keeps things tidy!»</p>
              </div>

              <button
                onClick={() => {
                  if (canInstall) installPWA();
                  else setPwaModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#15101e] hover:bg-[#3d2b4f] border border-[#3d2b4f] hover:border-[#ff4d4d] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Smartphone size={16} className="text-[#ff4d4d]" />
                <span>{isInstalled ? (lang === 'ru' ? 'Web-App Установлено' : 'Web-App Installed') : (lang === 'ru' ? 'Установить Web-App' : 'Install Web-App')}</span>
              </button>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-[#3d2b4f] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>&copy; 2026 クルシーP. {t.rights}</p>
            <div className="flex items-center gap-6">
              <button onClick={() => logger.exportLogs()} className="hover:text-[#ff4d4d] transition-colors text-xs opacity-50">
                Export Logs
              </button>
              <a href="https://t.me/ministry_aha" target="_blank" rel="noreferrer" className="hover:text-[#ff4d4d] transition-colors">
                Telegram
              </a>
              <a href="https://github.com/qlswe" target="_blank" rel="noreferrer" className="hover:text-[#ff4d4d] transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>

      <PwaInstallModal 
        isOpen={pwaModalOpen} 
        onClose={() => setPwaModalOpen(false)} 
        lang={lang} 
      />
    </>
  );
};
