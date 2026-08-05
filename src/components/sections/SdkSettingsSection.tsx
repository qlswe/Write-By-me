import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, ShieldCheck, Cpu, RotateCw, Palette, Check, Save, RefreshCw, Type, Minus, Plus, RotateCcw } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { sdk } from '../../sdk';
import { AhaSecurityConsole } from '../security/AhaSecurity';
import { ACCENT_COLOR_PRESETS, applyPrimaryAccentColor } from '../../utils/theme';
import { useFontSize } from '../../hooks/useFontSize';

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
  const t = translations[lang] as any;
  const { fontSizePercent, setFontSize, increaseFontSize, decreaseFontSize, resetFontSize, presets } = useFontSize();

  const [globalFallbackState, setGlobalFallbackState] = useState(false);
  const [adSettings, setAdSettings] = useState<any>({
    enabled: false,
    provider: 'a-ads',
    blockId: '',
    clientId: '',
    slotId: ''
  });
  const [isSavingAds, setIsSavingAds] = useState(false);

  const [currentAccentColor, setCurrentAccentColor] = useState<string>('#ff4d4d');
  const [customHexInput, setCustomHexInput] = useState<string>('#ff4d4d');
  const [isSavingColor, setIsSavingColor] = useState<boolean>(false);

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
            if (data.primaryAccentColor) {
              setCurrentAccentColor(data.primaryAccentColor);
              setCustomHexInput(data.primaryAccentColor);
            }
          }
        } catch (e) {
          // Setting unavailable
        }
      };
      getSettings();
    }
  }, [role]);

  const handleSaveAccentColor = async (colorHex: string) => {
    setIsSavingColor(true);
    try {
      const formattedColor = (colorHex || '#ff4d4d').trim().toLowerCase();
      await setDoc(doc(db, 'settings', 'general'), {
        primaryAccentColor: formattedColor
      }, { merge: true });
      setCurrentAccentColor(formattedColor);
      setCustomHexInput(formattedColor);
      applyPrimaryAccentColor(formattedColor);
      alert(lang === 'ru' ? 'Акцентный цвет сайта успешно обновлен!' : 'Primary accent color updated successfully!');
    } catch (e: any) {
      alert((lang === 'ru' ? 'Ошибка сохранения: ' : 'Error saving: ') + e.message);
    } finally {
      setIsSavingColor(false);
    }
  };

  const saveAdSettings = async () => {
    setIsSavingAds(true);
    try {
      await updateDoc(doc(db, 'settings', 'general'), {
        ads: adSettings
      });
      alert(t.adSettingsSaved || 'Ad settings saved');
    } catch (e: any) {
      alert((t.adminPremiumGrantError || 'Error') + ': ' + e.message);
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

            {/* ACCESSIBILITY & FONT SIZE SECTION */}
            <div className="space-y-4 pt-6 border-t border-[#3d2b4f]/50">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#ff4d4d] flex items-center gap-2">
                <Type size={16} />
                {t.accessibilitySettings || (lang === 'ru' ? "Доступность и Текст" : "Accessibility & Text")}
              </h3>

              <div id="font-size-toggle-card" className="p-5 bg-[#15101e] border border-[#3d2b4f] hover:border-[#ff4d4d]/50 rounded-2xl space-y-4 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-white text-base">
                      {t.fontSizeTitle || (lang === 'ru' ? "Размер шрифта для чтения" : "Reading Font Size")}
                    </h4>
                    <span className="px-2.5 py-0.5 bg-[#251c35] border border-[#ff4d4d]/30 text-[#ff4d4d] font-mono text-xs font-bold rounded-lg">
                      {fontSizePercent}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {t.fontSizeDesc || (lang === 'ru' ? "Увеличьте или уменьшите размер текста на всем сайте для более удобного чтения." : "Increase or decrease text size across the application for better reading accessibility.")}
                  </p>
                </div>

                {/* Step controls + reset */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={decreaseFontSize}
                    disabled={fontSizePercent <= 80}
                    className="p-2.5 bg-[#251c35] hover:bg-[#3d2b4f] disabled:opacity-40 text-white rounded-xl border border-[#3d2b4f] transition-all cursor-pointer flex items-center justify-center shrink-0"
                    title={lang === 'ru' ? "Уменьшить шрифт" : "Decrease Font Size"}
                  >
                    <Minus size={16} />
                  </button>

                  <div className="flex-1 bg-[#1a1326] border border-[#3d2b4f] rounded-xl px-4 py-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      {lang === 'ru' ? "Масштаб чтения:" : "Reading Scale:"}
                    </span>
                    <span className="text-sm font-black text-white font-mono">
                      {fontSizePercent}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={increaseFontSize}
                    disabled={fontSizePercent >= 150}
                    className="p-2.5 bg-[#251c35] hover:bg-[#3d2b4f] disabled:opacity-40 text-white rounded-xl border border-[#3d2b4f] transition-all cursor-pointer flex items-center justify-center shrink-0"
                    title={lang === 'ru' ? "Увеличить шрифт" : "Increase Font Size"}
                  >
                    <Plus size={16} />
                  </button>

                  {fontSizePercent !== 100 && (
                    <button
                      type="button"
                      onClick={resetFontSize}
                      className="p-2.5 bg-[#251c35] hover:bg-red-500/20 text-red-400 rounded-xl border border-[#3d2b4f] transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title={t.fontSizeReset || (lang === 'ru' ? "Сбросить размер" : "Reset Size")}
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                </div>

                {/* Quick Presets Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {presets.map((preset) => {
                    const isActive = fontSizePercent === preset.percentage;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFontSize(preset.percentage)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                          isActive
                            ? 'bg-[#ff4d4d] border-[#ff4d4d] text-[#15101e] shadow-[0_0_12px_rgba(255,77,77,0.4)]'
                            : 'bg-[#251c35] border-[#3d2b4f] text-gray-300 hover:text-white hover:border-[#ff4d4d]/40'
                        }`}
                      >
                        {lang === 'ru' ? preset.labelRu : preset.labelEn}
                      </button>
                    );
                  })}
                </div>

                {/* Live Preview Sample */}
                <div className="p-3.5 bg-[#1a1326]/80 border border-[#3d2b4f]/60 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">
                    {lang === 'ru' ? "Предпросмотр текста:" : "Text Preview:"}
                  </span>
                  <p className="text-gray-200 leading-relaxed italic" style={{ fontSize: `${fontSizePercent}%` }}>
                    {t.fontSizePreview || (lang === 'ru'
                      ? "Пример текста: Все путешественники равны перед Ахой. Настройте размер шрифта для удобства чтения."
                      : "Sample text: All Trailblazers are equal before Aha. Adjust the font size for optimal reading comfort.")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(role === 'admin' || role === 'moderator') && (
            <div className="space-y-4 pt-6 mt-6 border-t border-[#3d2b4f]/50">
               <h3 className="text-sm font-black uppercase tracking-widest text-[#ff4d4d]">
                {t.adminTools || (lang === 'ru' ? 'ИНСТРУМЕНТЫ АДМИНИСТРАТОРА' : 'ADMIN TOOLS')}
              </h3>
              
              {/* PRIMARY ACCENT COLOR CUSTOMIZATION (ADMIN FIRESTORE UI) */}
              <div id="admin-accent-color-panel" className="p-5 bg-[#15101e] border border-[#3d2b4f] hover:border-[#ff4d4d]/50 rounded-2xl mb-4 space-y-4 transition-all">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Palette className="text-[#ff4d4d] w-5 h-5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {lang === 'ru' ? 'Цветовой акцент сайта' : 'Primary Accent Color (Admin)'}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {lang === 'ru'
                          ? 'Настройте главный акцентный цвет приложения для всех пользователей (сохраняется в Firestore)'
                          : 'Customize primary application accent color for all users (saved to Firestore)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-6 h-6 rounded-full border border-white/20 shadow-md"
                      style={{ backgroundColor: currentAccentColor }}
                    />
                    <span className="text-xs font-mono text-gray-300 uppercase">
                      {currentAccentColor}
                    </span>
                  </div>
                </div>

                {/* Preset color swatches */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {ACCENT_COLOR_PRESETS.map((preset) => {
                    const isSelected = currentAccentColor.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => {
                          setCurrentAccentColor(preset.hex);
                          setCustomHexInput(preset.hex);
                          applyPrimaryAccentColor(preset.hex);
                        }}
                        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-[#251c35] border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                            : 'bg-[#15101e] border-[#3d2b4f] text-gray-400 hover:text-white hover:border-[#ff4d4d]/50'
                        }`}
                        title={lang === 'ru' ? preset.nameRu : preset.name}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/30"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{lang === 'ru' ? preset.nameRu.split(' ')[0] : preset.name.split(' ')[0]}</span>
                        {isSelected && <Check size={12} className="text-white" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom HEX input + Color Picker + Save to Firestore */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-[#3d2b4f]/40">
                  <div className="flex items-center gap-2 flex-1 bg-[#1a1326] border border-[#3d2b4f] rounded-xl px-3 py-1.5">
                    <input
                      type="color"
                      value={customHexInput.startsWith('#') && customHexInput.length === 7 ? customHexInput : '#ff4d4d'}
                      onChange={(e) => {
                        setCustomHexInput(e.target.value);
                        setCurrentAccentColor(e.target.value);
                        applyPrimaryAccentColor(e.target.value);
                      }}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={customHexInput}
                      onChange={(e) => {
                        setCustomHexInput(e.target.value);
                        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                          setCurrentAccentColor(e.target.value);
                          applyPrimaryAccentColor(e.target.value);
                        }
                      }}
                      placeholder="#FF4D4D"
                      className="flex-1 bg-transparent border-none text-xs font-mono text-white focus:outline-none uppercase"
                      maxLength={7}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveAccentColor('#ff4d4d')}
                      disabled={isSavingColor}
                      className="px-3 py-2 bg-[#251c35] hover:bg-[#3d2b4f] text-gray-300 hover:text-white text-xs font-bold rounded-xl border border-[#3d2b4f] transition-all cursor-pointer"
                    >
                      {lang === 'ru' ? 'Сброс (#ff4d4d)' : 'Reset (#ff4d4d)'}
                    </button>

                    <button
                      id="save-accent-color-btn"
                      type="button"
                      onClick={() => handleSaveAccentColor(currentAccentColor)}
                      disabled={isSavingColor}
                      className="px-4 py-2 bg-[#ff4d4d] hover:bg-[#ff3333] text-[#15101e] text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,77,77,0.3)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingColor ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>{lang === 'ru' ? 'Сохранить в Firestore' : 'Save to Firestore'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
                <p className="text-xs text-red-400 mb-2 uppercase tracking-widest font-bold">{t.adminDangerZone || (lang === 'ru' ? "Опасная зона" : "Danger Zone")}</p>
                <button
                  onClick={async () => {
                    if (window.confirm(t.adminMassRestartDesc || (lang === 'ru' ? "Вы уверены, что хотите перезагрузить страницу для всех пользователей прямо сейчас?" : "Are you sure you want to restart the page for all users right now?"))) {
                      try {
                        await updateDoc(doc(db, 'settings', 'general'), {
                          massRestartTimestamp: Date.now()
                        });
                        alert(t.adminMassRestartSent || (lang === 'ru' ? 'Команда перезагрузки отправлена' : 'Restart command sent'));
                      } catch (e: any) {
                        alert((t.adminPremiumGrantError || (lang === 'ru' ? 'Ошибка' : 'Error')) + ': ' + e.message);
                      }
                    }
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  {t.adminMassRestartBtn || (lang === 'ru' ? "Массовая перезагрузка сайта (для всех)" : "Mass website restart (All users)")}
                </button>
              </div>

              <div className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-4 space-y-3">
                <p className="text-xs text-purple-400 uppercase tracking-widest font-bold">{t.adminPremiumTitle || (lang === 'ru' ? "Управление Premium" : "Premium Management")}</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    id="premium_uid_input"
                    placeholder={t.adminPremiumInput || (lang === 'ru' ? "UID пользователя" : "User UID")}
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
                        alert(t.adminPremiumGrantSuccess || (lang === 'ru' ? 'Premium успешно выдан' : 'Premium granted successfully'));
                        input.value = '';
                      } catch (e: any) {
                        alert((t.adminPremiumGrantError || (lang === 'ru' ? 'Ошибка' : 'Error')) + ': ' + e.message);
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-xl transition-all whitespace-nowrap text-sm shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                  >
                    {t.adminPremiumGrant || (lang === 'ru' ? "Выдать" : "Grant")}
                  </button>
                </div>
              </div>

               <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 mt-6 pt-4 border-t border-[#3d2b4f]/30">
                {t.sdkDatabaseRoutingAdmin || (lang === 'ru' ? "Маршрутизация базы данных" : "Database Routing")}
              </h3>
              <button 
                onClick={toggleGlobalFallback}
                className="w-full flex items-center justify-between p-5 bg-[#15101e] hover:bg-[#15101e]/80 rounded-2xl border border-[#3d2b4f] transition-all hover:border-indigo-500/50 text-left group gap-4"
              >
                <div>
                  <div className="font-bold text-white text-base mb-1 group-hover:text-indigo-400 transition-colors">
                    {t.sdkGlobalVercelFallback || (lang === 'ru' ? "Глобальный резервный режим Vercel" : "Global Vercel Fallback")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t.sdkGlobalVercelFallbackDesc || (lang === 'ru' ? "Переключение трафика на резервную БД для всех пользователей" : "Switch traffic to fallback DB for all users")}
                  </div>
                </div>
                <div className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${globalFallbackState ? 'bg-indigo-500' : 'bg-[#3d2b4f]'}`}>
                  <div className={`absolute top-[4px] left-[4px] w-6 h-6 rounded-full bg-white transition-transform ${globalFallbackState ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </button>

              {/* Ad settings UI */}
              <h3 className="text-sm font-black uppercase tracking-widest text-[#ff4d4d] mt-6 pt-4 border-t border-[#3d2b4f]/30">
                {t.adSettings || (lang === 'ru' ? "НАСТРОЙКИ РЕКЛАМЫ" : "AD SETTINGS")}
              </h3>
              <div className="p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl mb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-yellow-400">{t.adSettingsEnable || (lang === 'ru' ? "Включить рекламу" : "Enable ads")}</span>
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
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t.adSettingsProvider || (lang === 'ru' ? "Провайдер" : "Provider")}</label>
                      <select 
                        value={adSettings.provider}
                        onChange={e => setAdSettings({ ...adSettings, provider: e.target.value })}
                        className="w-full bg-[#15101e] border border-[#3d2b4f] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                      >
                        <option value="a-ads">A-Ads (Crypto/Global)</option>
                        <option value="adsense">Google AdSense</option>
                      </select>
                      {adSettings.provider === 'a-ads' ? (
                        <p className="text-xs text-gray-500">
                          {lang === 'ru' ? 'API для мира/РФ: ' : 'API globally: '}
                          <a href="https://a-ads.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">a-ads.com</a>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {lang === 'ru' ? 'API для мира: ' : 'API globally: '}
                          <a href="https://adsense.google.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">adsense.google.com</a>
                        </p>
                      )}
                    </div>

                    {adSettings.provider === 'a-ads' ? (
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t.adSettingsBlockId || (lang === 'ru' ? "ID рекламного блока" : "Ad Unit ID")}</label>
                        <input 
                          type="text" 
                          placeholder="2200000"
                          value={adSettings.blockId}
                          onChange={e => setAdSettings({ ...adSettings, blockId: e.target.value })}
                          className="w-full bg-[#15101e] border border-[#3d2b4f] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t.adSettingsClient || (lang === 'ru' ? "ID клиента (ca-pub-...)" : "Client ID (ca-pub-...)")}</label>
                          <input 
                            type="text" 
                            placeholder="ca-pub-1234567890123456"
                            value={adSettings.clientId}
                            onChange={e => setAdSettings({ ...adSettings, clientId: e.target.value })}
                            className="w-full bg-[#15101e] border border-[#3d2b4f] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t.adSettingsSlot || (lang === 'ru' ? "ID слота" : "Slot ID")}</label>
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
                  {isSavingAds ? '...' : (t.adSettingsSave || (lang === 'ru' ? "Сохранить настройки рекламы" : "Save ad settings"))}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <AhaSecurityConsole lang={lang} />

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
