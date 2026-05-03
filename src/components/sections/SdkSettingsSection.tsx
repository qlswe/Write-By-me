import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, ShieldCheck, Cpu } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sdk } from '../../sdk';

interface SdkSettingsSectionProps {
  lang: Language;
  productionMode: boolean;
  toggleProductionMode: () => void;
  lowPerfMode: boolean;
  toggleLowPerfMode: () => void;
  showLoadWidget: boolean;
  toggleLoadWidget: () => void;
  role?: 'admin' | 'moderator' | 'user' | 'beta-tester';
}

export const SdkSettingsSection: React.FC<SdkSettingsSectionProps> = ({
  lang,
  productionMode,
  toggleProductionMode,
  lowPerfMode,
  toggleLowPerfMode,
  showLoadWidget,
  toggleLoadWidget,
  role
}) => {
  const [ahaSecurityHidden, setAhaSecurityHidden] = useState(localStorage.getItem('aha_security_hidden') === 'true');
  const [localTime, setLocalTime] = useState(new Date().toLocaleTimeString());
  const t = translations[lang];

  const [globalFallbackState, setGlobalFallbackState] = useState(false);
  const [adSettings, setAdSettings] = useState<any>({
    enabled: false,
    provider: 'yandex',
    blockId: '',
    clientId: '',
    slotId: ''
  });
  const [isSavingAds, setIsSavingAds] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (role === 'admin' || role === 'moderator') {
      const getSettings = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'settings', 'general'));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setGlobalFallbackState(data.forceKVFallback || false);
            if (data.ads) {
              setAdSettings({ ...adSettings, ...data.ads });
            }
          }
        } catch (e) {
          // Setting unavailable
        }
      };
      getSettings();
    }
  }, [role]);

  const saveAdSettings = async () => {
    setIsSavingAds(true);
    try {
      await updateDoc(doc(db, 'settings', 'general'), {
        ads: adSettings
      });
      alert(lang === 'ru' ? 'Настройки рекламы сохранены' : 'Ad settings saved');
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsSavingAds(false);
    }
  };

  const toggleGlobalFallback = async () => {
    try {
      const newState = !globalFallbackState;
      setGlobalFallbackState(newState); // Optimistic update
      await updateDoc(doc(db, 'settings', 'general'), {
        forceKVFallback: newState
      });
      // Optionally reload to apply local changes immediately
      if (newState) {
        localStorage.setItem('aha_quota_fallback', Date.now().toString());
      } else {
        localStorage.removeItem('aha_quota_fallback');
      }
      setTimeout(() => window.location.reload(), 500);
    } catch (e) {
      console.error("Failed to update global routing", e);
    }
  };

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
            <p className="text-gray-400 mt-1">{t.sdkSettingsDesc}</p>
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
                  {(t as any).securityWidgetTitle || t.securityWidgetTitle}
                </div>
                <div className="text-sm text-gray-500">
                  {(t as any).securityWidgetDesc || t.securityWidgetDesc}
                </div>
              </div>
              <div className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${!ahaSecurityHidden ? 'bg-green-500' : 'bg-[#3d2b4f]'}`}>
                <div className={`absolute top-[4px] left-[4px] w-6 h-6 rounded-full bg-white transition-transform ${!ahaSecurityHidden ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>

          {(role === 'admin' || role === 'moderator') && (
            <div className="space-y-4 pt-6 mt-6 border-t border-[#3d2b4f]/50">
               <h3 className="text-sm font-black uppercase tracking-widest text-[#ff4d4d]">
                {lang === 'ru' ? 'Инструменты администратора' : 'Admin Tools'}
              </h3>
              
              <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
                <p className="text-xs text-red-400 mb-2 uppercase tracking-widest font-bold">Опасная зона / Danger Zone</p>
                <button
                  onClick={async () => {
                    if (window.confirm('Вы уверены, что хотите перезагрузить страницу у всех пользователей прямо сейчас? / Are you sure you want to restart the page for all users right now?')) {
                      try {
                        await updateDoc(doc(db, 'settings', 'general'), {
                          massRestartTimestamp: Date.now()
                        });
                        alert('Команда перезагрузки отправлена / Restart command sent');
                      } catch (e: any) {
                        alert('Ошибка / Error: ' + e.message);
                      }
                    }
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  Массовый перезапуск сайта (Все пользователи)
                </button>
              </div>

              <div className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-4 space-y-3">
                <p className="text-xs text-purple-400 uppercase tracking-widest font-bold">Управление Premium / Premium Management</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    id="premium_uid_input"
                    placeholder="UID пользователя (User UID)"
                    className="flex-1 bg-[#15101e] border border-[#3d2b4f] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={async () => {
                      const input = document.getElementById('premium_uid_input') as HTMLInputElement;
                      if (!input.value.trim()) return;
                      try {
                        await updateDoc(doc(db, 'users', input.value.trim()), {
                          isPremium: true
                        });
                        alert('Премиум успешно выдан / Premium granted successfully');
                        input.value = '';
                      } catch (e: any) {
                        alert('Ошибка / Error: ' + e.message);
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-xl transition-all whitespace-nowrap text-sm shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                  >
                    Выдать (Grant)
                  </button>
                </div>
              </div>

               <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 mt-6 pt-4 border-t border-[#3d2b4f]/30">
                {t.sdkDatabaseRoutingAdmin}
              </h3>
              <button 
                onClick={toggleGlobalFallback}
                className="w-full flex items-center justify-between p-5 bg-[#15101e] hover:bg-[#15101e]/80 rounded-2xl border border-[#3d2b4f] transition-all hover:border-indigo-500/50 text-left group gap-4"
              >
                <div>
                  <div className="font-bold text-white text-base mb-1 group-hover:text-indigo-400 transition-colors">
                    {t.sdkGlobalVercelFallback}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t.sdkGlobalVercelFallbackDesc}
                  </div>
                </div>
                <div className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${globalFallbackState ? 'bg-indigo-500' : 'bg-[#3d2b4f]'}`}>
                  <div className={`absolute top-[4px] left-[4px] w-6 h-6 rounded-full bg-white transition-transform ${globalFallbackState ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </button>

              {/* Ad settings UI */}
              <h3 className="text-sm font-black uppercase tracking-widest text-[#ff4d4d] mt-6 pt-4 border-t border-[#3d2b4f]/30">
                Управление рекламой / Ad Settings
              </h3>
              <div className="p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl mb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-yellow-400">Включить рекламу</span>
                  <button 
                    onClick={() => setAdSettings({ ...adSettings, enabled: !adSettings.enabled })}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${adSettings.enabled ? 'bg-yellow-500' : 'bg-[#3d2b4f]'}`}
                  >
                    <div className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white transition-transform ${adSettings.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                
                {adSettings.enabled && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Провайдер / Provider</label>
                      <select 
                        value={adSettings.provider}
                        onChange={e => setAdSettings({ ...adSettings, provider: e.target.value })}
                        className="w-full bg-[#15101e] border border-[#3d2b4f] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                      >
                        <option value="yandex">Yandex RTB</option>
                        <option value="adsense">Google AdSense</option>
                      </select>
                    </div>

                    {adSettings.provider === 'yandex' ? (
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">R-A Block ID</label>
                        <input 
                          type="text" 
                          placeholder="R-A-1234567-1"
                          value={adSettings.blockId}
                          onChange={e => setAdSettings({ ...adSettings, blockId: e.target.value })}
                          className="w-full bg-[#15101e] border border-[#3d2b4f] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Client ID (ca-pub-...)</label>
                          <input 
                            type="text" 
                            placeholder="ca-pub-1234567890123456"
                            value={adSettings.clientId}
                            onChange={e => setAdSettings({ ...adSettings, clientId: e.target.value })}
                            className="w-full bg-[#15101e] border border-[#3d2b4f] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Slot ID</label>
                          <input 
                            type="text" 
                            placeholder="1234567890"
                            value={adSettings.slotId}
                            onChange={e => setAdSettings({ ...adSettings, slotId: e.target.value })}
                            className="w-full bg-[#15101e] border border-[#3d2b4f] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
                
                <button
                  onClick={saveAdSettings}
                  disabled={isSavingAds}
                  className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-xl transition-all disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(202,138,4,0.3)]"
                >
                  {isSavingAds ? '...' : (lang === 'ru' ? 'Сохранить настройки' : 'Save ad settings')}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#ff4d4d]">
              {t.sdkSystem}
            </h3>
            
            <div className="p-6 bg-[#15101e] rounded-2xl border border-[#3d2b4f] font-mono text-sm text-gray-300 space-y-4 shadow-inner">
              <div className="flex justify-between items-center py-2 border-b border-[#3d2b4f]/50">
                <span className="text-gray-500">{t.sdkVersion}</span>
                <span className="text-[#ff4d4d] font-bold bg-[#ff4d4d]/10 px-3 py-1 rounded-full">{sdk.getVersion()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#3d2b4f]/50">
                <span className="text-gray-500">{t.sdkEnvironment}</span>
                <span className="text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-full">{process.env.NODE_ENV}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#3d2b4f]/50">
                <span className="text-gray-500">{t.sdkAiEngine}</span>
                <span className="text-yellow-400 font-bold">{t.sdkCustomNeuralEngine}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500">{t.sdkLocalTime}</span>
                <span className="text-blue-400 font-medium">{localTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
