import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, ShieldCheck, Cpu } from 'lucide-react';
import { Language, translations } from '../../data/translations';

interface SdkSettingsSectionProps {
  lang: Language;
  productionMode: boolean;
  toggleProductionMode: () => void;
  lowPerfMode: boolean;
  toggleLowPerfMode: () => void;
  showLoadWidget: boolean;
  toggleLoadWidget: () => void;
}

export const SdkSettingsSection: React.FC<SdkSettingsSectionProps> = ({
  lang,
  productionMode,
  toggleProductionMode,
  lowPerfMode,
  toggleLowPerfMode,
  showLoadWidget,
  toggleLoadWidget
}) => {
  const [ahaSecurityHidden, setAhaSecurityHidden] = useState(localStorage.getItem('aha_security_hidden') === 'true');
  const [localTime, setLocalTime] = useState(new Date().toLocaleTimeString());
  const t = translations[lang];

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleAhaSecurity = () => {
    const newValue = !ahaSecurityHidden;
    setAhaSecurityHidden(newValue);
    if (newValue) {
      localStorage.setItem('aha_security_hidden', 'true');
    } else {
      localStorage.removeItem('aha_security_hidden');
    }
    window.location.reload();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="bg-[#251c35] rounded-3xl p-6 md:p-10 border border-[#3d2b4f] shadow-2xl h-[calc(100vh-14rem)] min-h-[600px] overflow-y-auto w-full no-scrollbar">
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-[#3d2b4f]/50">
          <div className="p-4 bg-[#15101e] rounded-2xl border border-[#3d2b4f]">
            <Settings className="text-[#ff4d4d] w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">{t.sdkSettings}</h2>
            <p className="text-gray-400 mt-1">Configure your environment settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#ff4d4d] flex items-center gap-2">
              <Cpu size={16} />
              {t.sdkPerformance}
            </h3>
            
            <button 
              onClick={toggleProductionMode}
              className="w-full flex items-center justify-between p-5 bg-[#15101e] hover:bg-[#15101e]/80 rounded-2xl border border-[#3d2b4f] transition-all hover:border-[#ff4d4d]/50 text-left group"
            >
              <div>
                <div className="font-bold text-white text-base mb-1 group-hover:text-[#ff4d4d] transition-colors">
                  {t.sdkProductionMode}
                </div>
                <div className="text-sm text-gray-500">
                  {t.sdkHighFidelity}
                </div>
              </div>
              <div className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${productionMode ? 'bg-[#ff4d4d]' : 'bg-[#3d2b4f]'}`}>
                <div className={`absolute top-[4px] left-[4px] w-6 h-6 rounded-full bg-white transition-transform ${productionMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>

            <button 
              onClick={toggleLowPerfMode}
              className="w-full flex items-center justify-between p-5 bg-[#15101e] hover:bg-[#15101e]/80 rounded-2xl border border-[#3d2b4f] transition-all hover:border-[#ff4d4d]/50 text-left group"
            >
              <div>
                <div className="font-bold text-white text-base mb-1 group-hover:text-[#ff4d4d] transition-colors">
                  {t.sdkLowPerfMode || (t as any).sdkLowPerformanceMode}
                </div>
                <div className="text-sm text-gray-500">
                  {t.sdkDisableHeavy || (t as any).sdkDisableHeavyAnimations}
                </div>
              </div>
              <div className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${lowPerfMode ? 'bg-[#ff4d4d]' : 'bg-[#3d2b4f]'}`}>
                <div className={`absolute top-[4px] left-[4px] w-6 h-6 rounded-full bg-white transition-transform ${lowPerfMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>

            <button 
              onClick={toggleLoadWidget}
              className="w-full flex items-center justify-between p-5 bg-[#15101e] hover:bg-[#15101e]/80 rounded-2xl border border-[#3d2b4f] transition-all hover:border-[#ff4d4d]/50 text-left group"
            >
              <div>
                <div className="font-bold text-white text-base mb-1 group-hover:text-[#ff4d4d] transition-colors">
                  {t.sdkLoadWidget}
                </div>
                <div className="text-sm text-gray-500">
                  {t.sdkShowPerfWidget || (t as any).sdkShowPerformanceWidget}
                </div>
              </div>
              <div className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${showLoadWidget ? 'bg-[#ff4d4d]' : 'bg-[#3d2b4f]'}`}>
                <div className={`absolute top-[4px] left-[4px] w-6 h-6 rounded-full bg-white transition-transform ${showLoadWidget ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>

            <button 
              onClick={toggleAhaSecurity}
              className="w-full flex items-center justify-between p-5 bg-[#15101e] hover:bg-[#15101e]/80 rounded-2xl border border-[#3d2b4f] transition-all hover:border-[#ff4d4d]/50 text-left group"
            >
              <div>
                <div className="font-bold text-white text-base mb-1 flex items-center gap-2 group-hover:text-green-400 transition-colors">
                  <ShieldCheck size={20} className={!ahaSecurityHidden ? 'text-green-500' : 'text-gray-500'} />
                  {(t as any).securityWidgetTitle || "Aha Security Widget"}
                </div>
                <div className="text-sm text-gray-500">
                  {(t as any).securityWidgetDesc || "Show actively blocked threats panel"}
                </div>
              </div>
              <div className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${!ahaSecurityHidden ? 'bg-green-500' : 'bg-[#3d2b4f]'}`}>
                <div className={`absolute top-[4px] left-[4px] w-6 h-6 rounded-full bg-white transition-transform ${!ahaSecurityHidden ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#ff4d4d]">
              {t.sdkSystem}
            </h3>
            
            <div className="p-6 bg-[#15101e] rounded-2xl border border-[#3d2b4f] font-mono text-sm text-gray-300 space-y-4 shadow-inner">
              <div className="flex justify-between items-center py-2 border-b border-[#3d2b4f]/50">
                <span className="text-gray-500">SDK Version</span>
                <span className="text-[#ff4d4d] font-bold bg-[#ff4d4d]/10 px-3 py-1 rounded-full">v2.0.0-hsr</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#3d2b4f]/50">
                <span className="text-gray-500">Environment</span>
                <span className="text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-full">{process.env.NODE_ENV}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#3d2b4f]/50">
                <span className="text-gray-500">AI Engine</span>
                <span className="text-yellow-400 font-bold">Custom Neural Engine</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500">Local Time</span>
                <span className="text-blue-400 font-medium">{localTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
