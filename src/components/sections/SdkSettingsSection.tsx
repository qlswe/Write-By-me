import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, ShieldCheck, Cpu, RotateCw, Palette, Check, Save, RefreshCw, Type, Minus, Plus, RotateCcw, Volume2, Activity, Terminal, Download, Shield, Globe, Sparkles, BookOpen, Layers, Code2, PackageCheck, Search, CheckCircle2, AlertTriangle, AlertCircle, ShieldAlert, Wrench, Copy, Play, Trash2, Database, Flame, Wifi, WifiOff, Radio, Zap } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, setDoc, collection, getDocs, deleteDoc, writeBatch, enableNetwork, disableNetwork } from 'firebase/firestore';
import { sdk } from '../../sdk';
import { dbQueryCore } from '../../utils/dbQueryCore';
import { AhaSecurityConsole } from '../security/AhaSecurity';
import { ACCENT_COLOR_PRESETS, applyPrimaryAccentColor } from '../../utils/theme';
import { useFontSize } from '../../hooks/useFontSize';
import { AntiAdblockBanner } from '../ui/AntiAdblockBanner';
import { CustomSelect } from '../ui/CustomSelect';

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

  // New SDK v3.0.0 Pro features state
  const [diagResults, setDiagResults] = useState<{ test: string; status: 'ok' | 'warn' | 'error'; value: string }[] | null>(null);
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [sdkLogs, setSdkLogs] = useState<{ level: string; message: string; data?: any; time: string }[]>([]);
  const [logFilter, setLogFilter] = useState<string>('all');

  // Automated SDK Reference & Registry Explorer state
  const [refTab, setRefTab] = useState<'registry' | 'deps' | 'modules' | 'json'>('registry');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('platform');
  const [registrySearch, setRegistrySearch] = useState<string>('');
  const [simulateConflict, setSimulateConflict] = useState<boolean>(false);
  const [showAutoFixPanel, setShowAutoFixPanel] = useState<boolean>(false);
  const [activeFixTool, setActiveFixTool] = useState<'npm' | 'yarn' | 'pnpm' | 'script'>('npm');
  const [isPurgingCollection, setIsPurgingCollection] = useState<string | null>(null);
  const [isFirestoreOnline, setIsFirestoreOnline] = useState<boolean>(true);
  const [slowThresholdMs, setSlowThresholdMs] = useState<number>(1200);

  const handleToggleFirestoreNetwork = async () => {
    try {
      if (isFirestoreOnline) {
        await disableNetwork(db);
        setIsFirestoreOnline(false);
        sdk.notify(
          lang === 'ru' ? 'Firestore Офлайн' : 'Firestore Offline',
          lang === 'ru' ? 'Сетевое подключение к Firestore приостановлено. Приложение работает из локального кэша.' : 'Firestore network suspended. Operating from local cache.',
          'info'
        );
      } else {
        await enableNetwork(db);
        setIsFirestoreOnline(true);
        sdk.notify(
          lang === 'ru' ? 'Firestore Онлайн' : 'Firestore Online',
          lang === 'ru' ? 'Сетевая синхронизация Firestore успешно возобновлена.' : 'Firestore network sync restored successfully.',
          'success'
        );
      }
    } catch (err: any) {
      alert((lang === 'ru' ? 'Ошибка изменения сетевого состояния: ' : 'Network toggle error: ') + err.message);
    }
  };

  const handleFlushCache = () => {
    dbQueryCore.clearCache();
    sdk.notify(
      lang === 'ru' ? 'Кэш Очищен' : 'Cache Flushed',
      lang === 'ru' ? 'Локальный кэш DbQueryCore успешно сброшен.' : 'DbQueryCore query cache successfully flushed.',
      'success'
    );
  };

  const handleSetSlowThreshold = (ms: number) => {
    setSlowThresholdMs(ms);
    dbQueryCore.setSlowQueryThreshold(ms);
    sdk.notify(
      lang === 'ru' ? 'Порог Запросов Изменен' : 'Query Threshold Updated',
      lang === 'ru' ? `Порог медленного запроса установлен на ${ms}мс` : `Slow query warning threshold set to ${ms}ms`,
      'info'
    );
  };

  const handlePurgeCollection = async (collectionName: string) => {
    if (!window.confirm(lang === 'ru' ? `Удалить ВСЕ записи в коллекции "${collectionName}"? Это действие необратимо!` : `Delete ALL records in collection "${collectionName}"? This action cannot be undone!`)) {
      return;
    }
    setIsPurgingCollection(collectionName);
    try {
      const snap = await getDocs(collection(db, collectionName));
      let count = 0;
      const batch = writeBatch(db);
      snap.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        count++;
      });
      if (count > 0) {
        await batch.commit();
      }
      dbQueryCore.clearCache();
      sdk.notify(
        lang === 'ru' ? 'Коллекция очищена' : 'Collection Purged',
        lang === 'ru' ? `Удалено ${count} документов из "${collectionName}"` : `Deleted ${count} documents from "${collectionName}"`,
        'success'
      );
    } catch (err: any) {
      alert((lang === 'ru' ? 'Ошибка очистки: ' : 'Purge Error: ') + err.message);
    } finally {
      setIsPurgingCollection(null);
    }
  };

  const handlePurgeFullDatabase = async () => {
    if (!window.confirm(lang === 'ru' ? 'ВНИМАНИЕ! Полная очистка Базы Данных (БД). Будут удалены все теории, блоги, сообщения форума, чаты и телеметрия. Продолжить?' : 'WARNING! Full Database Purge. This will delete all theories, blogs, forum topics, chats, and telemetry. Continue?')) {
      return;
    }
    setIsPurgingCollection('ALL');
    try {
      const collectionsToPurge = ['telemetry', 'comments', 'forum_topics', 'chats', 'blog', 'theories', 'events'];
      let totalDeleted = 0;
      for (const colName of collectionsToPurge) {
        const snap = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        snap.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
          totalDeleted++;
        });
        if (snap.docs.length > 0) {
          await batch.commit();
        }
      }
      dbQueryCore.clearCache();
      localStorage.clear();
      sdk.notify(
        lang === 'ru' ? 'БД Полностью Очищена' : 'Full Database Purged',
        lang === 'ru' ? `Очищено ${totalDeleted} записей. Система переведена в автономный режим.` : `Cleared ${totalDeleted} records. Autonomous state re-initialized.`,
        'success'
      );
    } catch (err: any) {
      alert((lang === 'ru' ? 'Ошибка очистки БД: ' : 'Full Purge Error: ') + err.message);
    } finally {
      setIsPurgingCollection(null);
    }
  };

  useEffect(() => {
    const unsub = sdk.subscribeToLogs((level, message, data) => {
      setSdkLogs(prev => [
        { level, message, data, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 49)
      ]);
    });
    return () => unsub();
  }, []);

  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    const results = await sdk.diagnostics.runSuite();
    setDiagResults(results);
    setIsRunningDiag(false);
  };

  const handleExportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      version: sdk.getVersion(),
      devicePerformanceScore: sdk.hardware.getDevicePerformanceScore(),
      fontSizePercent,
      adSettings,
      primaryAccentColor: currentAccentColor,
      timestamp: new Date().toISOString()
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aha_sdk_config_v${sdk.getVersion()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

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
                        <span>{lang === 'ru' ? (preset.shortRu || preset.nameRu) : (preset.shortEn || preset.name)}</span>
                        {isSelected && <Check size={12} className="text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom HEX input + Color Picker + Save to Firestore */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#3d2b4f]/40 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-[#1a1326] border border-[#3d2b4f] rounded-xl px-3 py-1.5">
                    <input
                      type="color"
                      value={customHexInput.startsWith('#') && customHexInput.length === 7 ? customHexInput : '#ff4d4d'}
                      onChange={(e) => {
                        setCustomHexInput(e.target.value);
                        setCurrentAccentColor(e.target.value);
                        applyPrimaryAccentColor(e.target.value);
                      }}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 shrink-0"
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
                      className="flex-1 bg-transparent border-none text-xs font-mono text-white focus:outline-none uppercase min-w-0"
                      maxLength={7}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSaveAccentColor('#ff4d4d')}
                      disabled={isSavingColor}
                      className="px-3 py-2 bg-[#251c35] hover:bg-[#3d2b4f] text-gray-300 hover:text-white text-xs font-bold rounded-xl border border-[#3d2b4f] transition-all cursor-pointer whitespace-nowrap"
                    >
                      {lang === 'ru' ? 'Сброс (#ff4d4d)' : 'Reset (#ff4d4d)'}
                    </button>

                    <button
                      id="save-accent-color-btn"
                      type="button"
                      onClick={() => handleSaveAccentColor(currentAccentColor)}
                      disabled={isSavingColor}
                      className="px-3.5 py-2 bg-[#ff4d4d] hover:bg-[#ff3333] text-[#15101e] text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,77,77,0.3)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      {isSavingColor ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>{lang === 'ru' ? 'Сохранить в Firestore' : 'Save to Firestore'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* AUTONOMOUS DATABASE MANAGEMENT & PURGE PANEL */}
              <div className="p-5 bg-[#15101e] border border-amber-500/30 hover:border-amber-500/60 rounded-2xl mb-4 space-y-4 transition-all">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Database className="text-amber-400 w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{lang === 'ru' ? 'Автономный Контроль и Очистка БД' : 'Autonomous DB Control & Purge'}</span>
                        <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                          {lang === 'ru' ? 'АВТОНОМНО' : 'AUTONOMOUS'}
                        </span>
                      </h4>
                      <p className="text-xs text-gray-400">
                        {lang === 'ru'
                          ? 'Полное управление коллекциями Firestore: выборочное удаление данных или полный сброс БД'
                          : 'Complete Firestore collection management: selective data purge or full DB reset'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Network & Firestore Request Controls */}
                <div className="pt-3 border-t border-[#3d2b4f]/60 space-y-3">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                    {lang === 'ru' ? 'Сетевое Подключение и Оптимизация Запросов:' : 'Network State & Query Optimization:'}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Online / Offline Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleFirestoreNetwork}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isFirestoreOnline
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80'
                          : 'bg-red-950/60 border-red-500/40 text-red-300 hover:bg-red-900/80'
                      }`}
                    >
                      {isFirestoreOnline ? <Wifi size={13} className="text-emerald-400" /> : <WifiOff size={13} className="text-red-400" />}
                      <span>
                        {isFirestoreOnline
                          ? (lang === 'ru' ? 'Сеть Firestore: ОНЛАЙН' : 'Firestore: ONLINE')
                          : (lang === 'ru' ? 'Сеть Firestore: ОФЛАЙН (Кэш)' : 'Firestore: OFFLINE (Cache)')}
                      </span>
                    </button>

                    {/* Flush Query Cache */}
                    <button
                      type="button"
                      onClick={handleFlushCache}
                      className="px-3 py-1.5 bg-[#251c35] hover:bg-[#3d2b4f] text-gray-200 hover:text-white text-xs font-bold rounded-xl border border-[#3d2b4f] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={12} className="text-cyan-400 shrink-0" />
                      <span>{lang === 'ru' ? 'Очистить Кэш Запросов' : 'Flush Query Cache'}</span>
                    </button>

                    {/* Slow Query Warning Threshold Selector */}
                    <div className="flex items-center gap-1 bg-[#251c35] border border-[#3d2b4f] rounded-xl px-2 py-1">
                      <Zap size={12} className="text-amber-400 shrink-0" />
                      <span className="text-[11px] text-gray-400 font-bold mr-1">
                        {lang === 'ru' ? 'Порог Задержки:' : 'Slow Threshold:'}
                      </span>
                      {[500, 1200, 3000].map(ms => (
                        <button
                          key={ms}
                          type="button"
                          onClick={() => handleSetSlowThreshold(ms)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            slowThresholdMs === ms
                              ? 'bg-amber-500 text-black font-black'
                              : 'bg-[#15101e] text-gray-400 hover:text-white'
                          }`}
                        >
                          {ms}мс
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Individual collection purge buttons */}
                <div className="space-y-2">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                    {lang === 'ru' ? 'Выборочная очистка коллекций:' : 'Selective Collection Purge:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'telemetry', labelRu: 'Телеметрия', labelEn: 'Telemetry' },
                      { id: 'comments', labelRu: 'Комментарии', labelEn: 'Comments' },
                      { id: 'forum_topics', labelRu: 'Темы Форума', labelEn: 'Forum Topics' },
                      { id: 'chats', labelRu: 'Чаты', labelEn: 'Live Chats' },
                      { id: 'blog', labelRu: 'Статьи Блога', labelEn: 'Blog Posts' },
                      { id: 'theories', labelRu: 'Теории', labelEn: 'Theories' },
                      { id: 'events', labelRu: 'События', labelEn: 'Events' },
                    ].map(col => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => handlePurgeCollection(col.id)}
                        disabled={isPurgingCollection !== null}
                        className="px-3 py-1.5 bg-[#251c35] hover:bg-red-950/60 text-gray-300 hover:text-red-300 text-xs font-bold rounded-xl border border-[#3d2b4f] hover:border-red-500/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isPurgingCollection === col.id ? (
                          <RefreshCw size={12} className="animate-spin text-amber-400" />
                        ) : (
                          <Trash2 size={12} className="text-red-400 shrink-0" />
                        )}
                        <span>{lang === 'ru' ? col.labelRu : col.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Full DB Purge Master Action */}
                <div className="pt-3 border-t border-[#3d2b4f]/60 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-amber-200/80 max-w-md">
                    {lang === 'ru'
                      ? 'Полный сброс удалит ВСЕ пользовательские записи во всех коллекциях и очистит локальный кэш'
                      : 'Full reset deletes ALL user records across all collections and flushes local cache'}
                  </p>
                  <button
                    type="button"
                    onClick={handlePurgeFullDatabase}
                    disabled={isPurgingCollection !== null}
                    className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-950/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isPurgingCollection === 'ALL' ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Flame size={14} className="animate-pulse" />
                    )}
                    <span>{lang === 'ru' ? 'ПОЛНАЯ ОЧИСТКА И СБРОС БД' : 'PURGE ALL DB DATA'}</span>
                  </button>
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
                      <CustomSelect 
                        value={adSettings.provider}
                        onChange={val => setAdSettings({ ...adSettings, provider: val })}
                        className="w-full !bg-[#15101e] !border-[#3d2b4f] !rounded-xl !px-4 !py-2 !text-sm !text-white"
                        options={[
                          { value: 'a-ads', label: 'A-Ads (Crypto/Global)' },
                          { value: 'adsense', label: 'Google AdSense' }
                        ]}
                      />
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

              {/* AntiAdblockBanner strictly contained inside SDK Settings */}
              <div className="mt-4">
                <AntiAdblockBanner lang={lang} />
              </div>
            </div>
          )}

          <div className="space-y-6">
            <AhaSecurityConsole lang={lang} />

            {/* SDK DIAGNOSTICS & HARDWARE TOOLKIT */}
            <div className="p-6 bg-[#15101e] rounded-2xl border border-[#3d2b4f] hover:border-[#ff4d4d]/50 transition-all space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#ff4d4d] flex items-center gap-2">
                  <Activity size={16} />
                  {lang === 'ru' ? "Диагностика и Оборудование SDK" : "SDK Diagnostics & Hardware"}
                </h3>
                <span className="text-[10px] font-mono uppercase bg-[#ff4d4d]/10 text-[#ff4d4d] px-2 py-0.5 rounded font-bold border border-[#ff4d4d]/20">
                  v{sdk.getVersion()}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunDiagnostics}
                  disabled={isRunningDiag}
                  className="flex-1 py-2 px-3 bg-[#ff4d4d] hover:bg-[#ff3333] text-[#15101e] font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={14} className={isRunningDiag ? 'animate-spin' : ''} />
                  <span>{isRunningDiag ? (lang === 'ru' ? 'Тестирование...' : 'Testing...') : (lang === 'ru' ? 'Запустить Диагностику' : 'Run Suite')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => sdk.audio.playJingle()}
                  className="py-2 px-3 bg-[#251c35] hover:bg-[#3d2b4f] text-gray-200 hover:text-white font-bold text-xs rounded-xl border border-[#3d2b4f] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title={lang === 'ru' ? 'Проверить звук SDK' : 'Test SDK Audio Jingle'}
                >
                  <Volume2 size={14} className="text-[#ff4d4d]" />
                  <span>{lang === 'ru' ? 'Звук SDK' : 'Test Sound'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportConfig}
                  className="py-2 px-3 bg-[#251c35] hover:bg-[#3d2b4f] text-gray-200 hover:text-white font-bold text-xs rounded-xl border border-[#3d2b4f] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title={lang === 'ru' ? 'Экспортировать конфиг SDK' : 'Export SDK Config'}
                >
                  <Download size={14} className="text-[#ff4d4d]" />
                  <span>JSON</span>
                </button>
              </div>

              {diagResults && (
                <div className="p-3 bg-[#1a1326] rounded-xl border border-[#3d2b4f] space-y-1.5 font-mono text-xs">
                  {diagResults.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-[#3d2b4f]/30 last:border-0">
                      <span className="text-gray-400">{r.test}</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        r.status === 'ok' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        r.status === 'warn' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STANDALONE SDK SITE & DEVELOPER PORTAL GUIDE */}
            <div className="p-6 bg-[#15101e] rounded-2xl border border-[#ff4d4d]/40 shadow-[0_0_20px_rgba(255,77,77,0.1)] space-y-5">
              <div className="flex items-center justify-between border-b border-[#3d2b4f] pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <Globe size={18} className="text-[#ff4d4d]" />
                    {lang === 'ru' ? "Портал Разработчика и Отдельный Сайт SDK" : "SDK Standalone Site & Developer Portal"}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {lang === 'ru' 
                      ? "Руководство по созданию отдельного домена/сайта, CDN встраиванию и экспорту библиотеки"
                      : "Guide for creating a standalone domain/site, CDN embedding, and publishing as an NPM library"}
                  </p>
                </div>
                <span className="bg-[#ff4d4d] text-[#15101e] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">
                  SDK v3.0 PRO
                </span>
              </div>

              {/* Step by Step Standalone Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-[#1f172e] rounded-xl border border-[#3d2b4f] space-y-2">
                  <div className="flex items-center gap-2 font-black text-xs text-[#ff4d4d]">
                    <span className="w-5 h-5 rounded-full bg-[#ff4d4d] text-[#15101e] text-[10px] flex items-center justify-center font-black">1</span>
                    {lang === 'ru' ? "Создание репозитория" : "Repository Setup"}
                  </div>
                  <p className="text-[11px] text-gray-300 leading-snug">
                    {lang === 'ru' 
                      ? "Выделите папку src/sdk/ в отдельный GitHub репозиторий (например aha-sdk-js)."
                      : "Separate src/sdk/ into its own GitHub repo (e.g. aha-sdk-js)."}
                  </p>
                  <div className="p-2 bg-[#120d1c] rounded font-mono text-[10px] text-emerald-400">
                    git subtree push --prefix src/sdk origin main
                  </div>
                </div>

                <div className="p-3.5 bg-[#1f172e] rounded-xl border border-[#3d2b4f] space-y-2">
                  <div className="flex items-center gap-2 font-black text-xs text-[#ff4d4d]">
                    <span className="w-5 h-5 rounded-full bg-[#ff4d4d] text-[#15101e] text-[10px] flex items-center justify-center font-black">2</span>
                    {lang === 'ru' ? "Публикация в NPM & CDN" : "NPM & CDN Publishing"}
                  </div>
                  <p className="text-[11px] text-gray-300 leading-snug">
                    {lang === 'ru' 
                      ? "Соберите бандл через Vite/esbuild в формате UMD/ESM и опубликуйте в npm."
                      : "Bundle via Vite/esbuild to UMD/ESM format and publish to npm."}
                  </p>
                  <div className="p-2 bg-[#120d1c] rounded font-mono text-[10px] text-amber-300">
                    npm publish --access public
                  </div>
                </div>

                <div className="p-3.5 bg-[#1f172e] rounded-xl border border-[#3d2b4f] space-y-2">
                  <div className="flex items-center gap-2 font-black text-xs text-[#ff4d4d]">
                    <span className="w-5 h-5 rounded-full bg-[#ff4d4d] text-[#15101e] text-[10px] flex items-center justify-center font-black">3</span>
                    {lang === 'ru' ? "Хостинг Документации" : "Documentation Hosting"}
                  </div>
                  <p className="text-[11px] text-gray-300 leading-snug">
                    {lang === 'ru' 
                      ? "Разверните отдельный сайт на Vercel, Netlify, Cloudflare Pages или GitHub Pages."
                      : "Deploy a separate portal site on Vercel, Netlify, Cloudflare Pages, or GitHub Pages."}
                  </p>
                  <div className="p-2 bg-[#120d1c] rounded font-mono text-[10px] text-blue-300">
                    https://sdk.aha-radio.app
                  </div>
                </div>
              </div>

              {/* Ready Code Snippets Generator */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-gray-200 tracking-wider flex items-center gap-1.5">
                    <Terminal size={14} className="text-[#ff4d4d]" />
                    {lang === 'ru' ? "Готовые фрагменты кода интеграции" : "Integration Code Snippets"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      sdk.hardware.copyToClipboard(sdk.snippets.cdnScriptTag());
                      alert(lang === 'ru' ? "Тег CDN скопирован!" : "CDN script tag copied!");
                    }}
                    className="px-2.5 py-1 bg-[#251c35] hover:bg-[#3d2b4f] text-xs text-[#ff4d4d] font-bold rounded-lg border border-[#3d2b4f] transition-all cursor-pointer"
                  >
                    {lang === 'ru' ? "Скопировать HTML тег" : "Copy HTML Tag"}
                  </button>
                </div>

                <div className="p-3 bg-[#100b17] rounded-xl border border-[#3d2b4f] font-mono text-[11px] text-gray-300 space-y-2 overflow-x-auto">
                  <div className="text-[10px] text-[#ff4d4d] font-bold uppercase tracking-wider">// HTML5 CDN Script Tag</div>
                  <pre className="text-emerald-400 whitespace-pre-wrap">{sdk.snippets.cdnScriptTag()}</pre>
                </div>
              </div>

              {/* Interactive API Playground */}
              <div className="pt-2 border-t border-[#3d2b4f] space-y-3">
                <h4 className="text-xs font-black uppercase text-gray-200 tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#ff4d4d]" />
                  {lang === 'ru' ? "Интерактивная песочница функций SDK" : "Interactive SDK API Playground"}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const snap = sdk.store.getState();
                      sdk.store.setState({ testCounter: (snap.testCounter || 0) + 1 });
                      alert(JSON.stringify(sdk.store.getState(), null, 2));
                    }}
                    className="p-2.5 bg-[#251c35] hover:bg-[#3d2b4f] text-white text-[11px] font-bold rounded-xl border border-[#3d2b4f] transition-all text-center cursor-pointer"
                  >
                    ⚡ Store State
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const uuid = sdk.crypto.generateUUID();
                      const signed = sdk.crypto.signPayload({ user: 'demo', event: 'click' });
                      alert(`UUID: ${uuid}\n\nSigned Payload: ${JSON.stringify(signed)}`);
                    }}
                    className="p-2.5 bg-[#251c35] hover:bg-[#3d2b4f] text-white text-[11px] font-bold rounded-xl border border-[#3d2b4f] transition-all text-center cursor-pointer"
                  >
                    🔐 Crypto & Hash
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const bench = await sdk.benchmark.runBenchmark();
                      alert(`CPU & DOM Benchmark:\nMath Ops: ${bench.mathOpsDurationMs}ms\nDOM Ops: ${bench.domOpsDurationMs}ms\nRating: ${bench.overallRating}`);
                    }}
                    className="p-2.5 bg-[#251c35] hover:bg-[#3d2b4f] text-white text-[11px] font-bold rounded-xl border border-[#3d2b4f] transition-all text-center cursor-pointer"
                  >
                    🚀 Run Benchmark
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sdk.hardware.vibrate([100, 50, 100]);
                      sdk.notify(
                        lang === 'ru' ? 'Тест уведомления' : 'Test Notification',
                        lang === 'ru' ? 'Интерактивное событие сработало!' : 'Interactive event triggered!',
                        'success'
                      );
                    }}
                    className="p-2.5 bg-[#251c35] hover:bg-[#3d2b4f] text-white text-[11px] font-bold rounded-xl border border-[#3d2b4f] transition-all text-center cursor-pointer"
                  >
                    🔔 Notify & Vibrate
                  </button>
                </div>
              </div>

              {/* Platform Core Dependencies & Feature Flags */}
              <div className="pt-3 border-t border-[#3d2b4f] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-gray-200 tracking-wider flex items-center gap-1.5">
                    <Shield size={14} className="text-[#ff4d4d]" />
                    {lang === 'ru' ? "Флаги фичей платформы & Плагины SDK" : "Platform Feature Flags & SDK Plugins"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const platformInfo = sdk.platform.getPlatformInfo();
                      alert(`Platform Status:\nRuntime: ${platformInfo.runtime}\nOnline: ${platformInfo.online}\nVersion: ${platformInfo.version}`);
                    }}
                    className="px-2 py-1 bg-[#251c35] hover:bg-[#3d2b4f] text-[10px] font-extrabold text-[#ff4d4d] rounded-lg border border-[#3d2b4f] cursor-pointer"
                  >
                    {lang === 'ru' ? "Статус Платформы" : "Platform Status"}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {Object.entries(sdk.features.getAll()).map(([feature, enabled]) => (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => {
                        sdk.features.set(feature, !enabled);
                        // Force re-render
                        setLocalTime(new Date().toLocaleTimeString());
                      }}
                      className={`p-2 rounded-xl text-[10px] font-bold text-left border transition-all cursor-pointer ${
                        enabled 
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      <div className="font-mono truncate">{feature}</div>
                      <div className="text-[9px] opacity-75 uppercase mt-0.5">{enabled ? 'ENABLED' : 'DISABLED'}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* AUTOMATED SDK REFERENCE & PLATFORM DEPENDENCY EXPLORER */}
              <div className="pt-4 border-t border-[#3d2b4f] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#120d1c] p-4 rounded-xl border border-[#3d2b4f]">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <BookOpen size={18} className="text-[#ff4d4d] shrink-0" />
                      <h4 className="text-xs font-black uppercase text-white tracking-widest">
                        {lang === 'ru' ? "Автоматический Справочник SDK & Зависимостей" : "Automated SDK Reference & Dependencies"}
                      </h4>
                      <span className="text-[9px] font-bold uppercase bg-[#ff4d4d]/20 text-[#ff4d4d] px-2 py-0.5 rounded border border-[#ff4d4d]/30 shrink-0">
                        Auto-Generated
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {lang === 'ru' 
                        ? "Динамический генератор метаданных кодовой базы и структуры платформных модулей" 
                        : "Dynamic metadata generator for codebase architecture and SDK module specifications"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const docs = sdk.reference.generateFullDocs(lang);
                        sdk.hardware.copyToClipboard(JSON.stringify(docs, null, 2));
                        sdk.notify(
                          lang === 'ru' ? 'Документация скопирована' : 'Docs Copied',
                          lang === 'ru' ? 'Полная схема SDK скопирована в буфер' : 'Full SDK schema copied to clipboard',
                          'success'
                        );
                      }}
                      className="px-2.5 py-1.5 bg-[#251c35] hover:bg-[#3d2b4f] text-xs font-bold text-gray-200 hover:text-white rounded-lg border border-[#3d2b4f] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Code2 size={13} className="text-[#ff4d4d] shrink-0" />
                      <span>{lang === 'ru' ? "Скопировать JSON" : "Copy JSON"}</span>
                    </button>
                  </div>
                </div>

                {/* Explorer Sub-Tabs */}
                <div className="flex items-center gap-2 border-b border-[#3d2b4f] pb-2 overflow-x-auto no-scrollbar max-w-full">
                  <button
                    type="button"
                    onClick={() => setRefTab('registry')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                      refTab === 'registry'
                        ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20 font-black'
                        : 'bg-[#251c35] text-gray-400 hover:text-white border border-[#3d2b4f]'
                    }`}
                  >
                    <PackageCheck size={14} className="shrink-0" />
                    <span>{lang === 'ru' ? "Реестр Зависимостей SDK" : "SDK Package Registry"} ({sdk.registry.getRegistryEntries().length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefTab('deps')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                      refTab === 'deps'
                        ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20 font-black'
                        : 'bg-[#251c35] text-gray-400 hover:text-white border border-[#3d2b4f]'
                    }`}
                  >
                    <Layers size={14} className="shrink-0" />
                    <span>{lang === 'ru' ? "Обзор Зависимостей" : "Platform Overview"} ({sdk.reference.getPlatformDependencies().length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefTab('modules')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                      refTab === 'modules'
                        ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20 font-black'
                        : 'bg-[#251c35] text-gray-400 hover:text-white border border-[#3d2b4f]'
                    }`}
                  >
                    <Cpu size={14} className="shrink-0" />
                    <span>{lang === 'ru' ? "Модули & Методы SDK" : "SDK Modules & APIs"} ({sdk.reference.getSdkModules().length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefTab('json')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                      refTab === 'json'
                        ? 'bg-[#ff4d4d] text-[#15101e] shadow-lg shadow-[#ff4d4d]/20 font-black'
                        : 'bg-[#251c35] text-gray-400 hover:text-white border border-[#3d2b4f]'
                    }`}
                  >
                    <Code2 size={14} className="shrink-0" />
                    <span>{lang === 'ru' ? "Полный JSON Документ" : "Live JSON Schema"}</span>
                  </button>
                </div>

                {/* Tab Content: SDK Package Registry */}
                {refTab === 'registry' && (
                  <div className="space-y-3">
                    {/* Registry Audit & Health Check Header Bar */}
                    {(() => {
                      const health = sdk.registry.checkDependencyHealth(simulateConflict);
                      const audit = sdk.registry.auditRegistry(simulateConflict);
                      return (
                        <div className={`p-3.5 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                          health.healthy 
                            ? 'bg-[#161024] border-[#3d2b4f]' 
                            : 'bg-red-950/30 border-red-500/60 shadow-lg shadow-red-950/50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                              health.healthy
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                            }`}>
                              {health.healthy ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                            </div>
                            <div>
                              <div className="text-xs font-black text-white flex items-center gap-2">
                                <span>{audit.platformStatus}</span>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                  health.healthy
                                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                    : 'text-red-400 bg-red-500/20 border-red-500/40 font-bold'
                                }`}>
                                  {health.systemHealthRating}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                {health.healthyDependenciesCount}/{health.totalDependencies} {lang === 'ru' ? 'зависимостей исправны' : 'dependencies healthy'}
                                {health.conflictCount > 0 && (
                                  <span className="text-red-400 font-bold ml-1">
                                    ({health.conflictCount} {lang === 'ru' ? 'конфликт(а) обнаружено' : 'conflict(s) detected'})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAutoFixPanel(!showAutoFixPanel)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                health.conflictCount > 0
                                  ? 'bg-amber-500 text-black border-amber-400 hover:bg-amber-400 shadow-md shadow-amber-500/30 animate-pulse'
                                  : showAutoFixPanel
                                  ? 'bg-[#3d2b4f] text-white border-[#ff4d4d]'
                                  : 'bg-[#251c35] text-gray-200 border-[#3d2b4f] hover:bg-[#3d2b4f]'
                              }`}
                            >
                              <Wrench size={13} />
                              <span>
                                {lang === 'ru' ? 'Консоль Auto-Fix' : 'Auto-Fix Console'}
                                {health.conflictCount > 0 && (
                                  <span className="ml-1.5 px-1.5 py-0.2 bg-black/40 text-amber-200 rounded text-[10px] font-mono">
                                    {health.conflictCount}
                                  </span>
                                )}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const nextState = !simulateConflict;
                                setSimulateConflict(nextState);
                                if (nextState) {
                                  setShowAutoFixPanel(true);
                                }
                                sdk.notify(
                                  nextState 
                                    ? (lang === 'ru' ? 'Конфликт сгенерирован' : 'Conflict Simulated')
                                    : (lang === 'ru' ? 'Конфликт сброшен' : 'Conflict Resolved'),
                                  nextState
                                    ? (lang === 'ru' ? 'Обнаружено несоответствие минимальным версиям Express и Tailwind' : 'Express & Tailwind minimum version mismatch injected')
                                    : (lang === 'ru' ? 'Все пакеты соответствуют требованиям среды' : 'All packages verified against minimum supported standards'),
                                  nextState ? 'error' : 'success'
                                );
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                simulateConflict
                                  ? 'bg-red-500 text-white border-red-400 hover:bg-red-600 shadow-md shadow-red-500/30'
                                  : 'bg-[#251c35] text-amber-300 border-amber-500/40 hover:bg-[#3d2b4f] hover:text-amber-200'
                              }`}
                            >
                              <AlertCircle size={13} />
                              <span>
                                {simulateConflict 
                                  ? (lang === 'ru' ? "Сбросить Симуляцию" : "Clear Conflict Simulation") 
                                  : (lang === 'ru' ? "Симулировать Конфликт" : "Simulate Version Conflict")
                                }
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const res = sdk.registry.checkDependencyHealth(simulateConflict);
                                sdk.notify(
                                  lang === 'ru' ? 'Проверка здоровья выполнена' : 'Dependency Health Check Complete',
                                  res.healthy 
                                    ? (lang === 'ru' ? 'Все пакеты соответствуют минимальным версиям' : '100% dependencies meet minimum requirements')
                                    : (lang === 'ru' ? `Найдено ${res.conflictCount} несоответствий версий` : `Found ${res.conflictCount} package version conflicts`),
                                  res.healthy ? 'success' : 'error'
                                );
                              }}
                              className="px-3 py-1.5 bg-[#251c35] hover:bg-[#3d2b4f] text-xs font-bold text-[#ff4d4d] rounded-lg border border-[#3d2b4f] transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <RefreshCw size={12} />
                              <span>{lang === 'ru' ? "Запустить Диагностику" : "Run Health Check"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Auto-Fix Shell Command Generator Console */}
                    {showAutoFixPanel && (() => {
                      const fixScript = sdk.registry.generateAutoFixScript(simulateConflict);
                      const currentCommand = 
                        activeFixTool === 'npm' ? fixScript.npmCommand :
                        activeFixTool === 'yarn' ? fixScript.yarnCommand :
                        activeFixTool === 'pnpm' ? fixScript.pnpmCommand :
                        fixScript.shellScript;

                      return (
                        <div className="p-4 bg-[#100a1a] rounded-xl border border-[#ff4d4d]/40 space-y-3 shadow-xl">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3d2b4f] pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[#ff4d4d]/20 text-[#ff4d4d] flex items-center justify-center border border-[#ff4d4d]/30">
                                <Terminal size={15} />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-white flex items-center gap-2">
                                  <span>{lang === 'ru' ? 'Генератор команд Auto-Fix Зависимостей' : 'Auto-Fix Shell Resolution Generator'}</span>
                                  {fixScript.hasFixes ? (
                                    <span className="text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-bold">
                                      {fixScript.conflictPackages.length} {lang === 'ru' ? 'исправлений' : 'fix(es) required'}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                                      {lang === 'ru' ? 'Исправен' : 'Healthy'}
                                    </span>
                                  )}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-mono">
                                  {lang === 'ru' 
                                    ? 'Сгенерированные консольные команды для устранения конфликтов минимальных версий' 
                                    : 'Auto-generated shell commands to resolve package version conflicts via package manager'
                                  }
                                </p>
                              </div>
                            </div>

                            {/* PackageManager Selector Tabs */}
                            <div className="flex items-center gap-1 bg-[#181024] p-1 rounded-lg border border-[#3d2b4f]">
                              {(['npm', 'yarn', 'pnpm', 'script'] as const).map(tool => (
                                <button
                                  key={tool}
                                  type="button"
                                  onClick={() => setActiveFixTool(tool)}
                                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                                    activeFixTool === tool
                                      ? 'bg-[#ff4d4d] text-white shadow-sm'
                                      : 'text-gray-400 hover:text-white hover:bg-[#251c35]'
                                  }`}
                                >
                                  {tool.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Command / Code Output Block */}
                          <div className="relative bg-[#090510] rounded-lg border border-[#3d2b4f] p-3 font-mono text-xs text-amber-300 overflow-x-auto">
                            <pre className="whitespace-pre-wrap break-all leading-relaxed">
                              {currentCommand}
                            </pre>

                            {/* Actions overlay */}
                            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#251c35]">
                              <button
                                type="button"
                                onClick={() => {
                                  sdk.hardware.copyToClipboard(currentCommand);
                                  sdk.notify(
                                    lang === 'ru' ? 'Команда скопирована' : 'Command Copied to Clipboard',
                                    lang === 'ru' ? 'Вставьте команду в ваш терминал для установки' : 'Paste command into your console terminal to update dependencies',
                                    'info'
                                  );
                                }}
                                className="px-3 py-1.5 bg-[#251c35] hover:bg-[#3d2b4f] text-white text-xs font-bold rounded-lg border border-[#3d2b4f] transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Copy size={13} />
                                <span>{lang === 'ru' ? 'Скопировать команду' : 'Copy Command'}</span>
                              </button>

                              {fixScript.hasFixes && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    sdk.logging.info('Auto-Fix Executed from SDK Settings UI', { command: currentCommand });
                                    sdk.notify(
                                      lang === 'ru' ? 'Auto-Fix выполнен' : 'Auto-Fix Executed',
                                      lang === 'ru' ? 'Все конфликты зависимостей успешно устранены' : 'Package version conflicts successfully resolved in system state',
                                      'success'
                                    );
                                    setSimulateConflict(false);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg border border-emerald-400 shadow-md shadow-emerald-950/50 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Play size={13} />
                                  <span>{lang === 'ru' ? 'Применить исправление (Выполнить)' : 'Execute Resolution'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Filter / Search Bar */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={registrySearch}
                        onChange={(e) => setRegistrySearch(e.target.value)}
                        placeholder={lang === 'ru' ? "Поиск пакетов, версий, лицензий и систем..." : "Search packages, versions, licenses, runtimes..."}
                        className="w-full pl-9 pr-3 py-2 bg-[#100b17] border border-[#3d2b4f] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ff4d4d] transition-all"
                      />
                    </div>

                    {/* Registry Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sdk.registry.getRegistryEntries(simulateConflict)
                        .filter(item => 
                          item.package.toLowerCase().includes(registrySearch.toLowerCase()) ||
                          item.runtime.toLowerCase().includes(registrySearch.toLowerCase()) ||
                          item.desc.toLowerCase().includes(registrySearch.toLowerCase())
                        )
                        .map((entry, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3.5 rounded-xl border transition-all space-y-2.5 flex flex-col justify-between ${
                              entry.hasConflict || entry.healthStatus === 'conflict'
                                ? 'bg-red-950/20 border-red-500/80 shadow-lg shadow-red-950/40 hover:border-red-400'
                                : 'bg-[#120d1c] border-[#3d2b4f] hover:border-[#ff4d4d]/40'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className={`font-mono text-xs font-bold truncate flex items-center gap-1.5 ${
                                  entry.hasConflict ? 'text-red-400' : 'text-white'
                                }`}>
                                  {entry.hasConflict ? (
                                    <AlertTriangle size={15} className="text-red-500 shrink-0 animate-bounce" />
                                  ) : (
                                    <PackageCheck size={14} className="text-[#ff4d4d] shrink-0" />
                                  )}
                                  {entry.package}
                                </span>

                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  entry.hasConflict
                                    ? 'text-white bg-red-600'
                                    : 'text-[#15101e] bg-[#ff4d4d]'
                                }`}>
                                  {entry.hasConflict ? 'CONFLICT' : entry.license}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                  entry.hasConflict
                                    ? 'text-red-300 bg-red-900/40 border-red-500/40 font-bold'
                                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                }`}>
                                  ver: {entry.version}
                                </span>

                                <span className="text-[10px] font-mono text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700">
                                  Min: &gt;={entry.minSupportedVersion}
                                </span>
                              </div>

                              {entry.hasConflict ? (
                                <div className="mt-2 p-2 bg-red-900/30 border border-red-500/40 rounded-lg text-[10px] text-red-200 font-mono font-semibold leading-tight flex items-start gap-1.5">
                                  <ShieldAlert size={13} className="text-red-400 shrink-0 mt-0.5" />
                                  <span>{entry.healthMessage}</span>
                                </div>
                              ) : (
                                <p className="text-[11px] text-gray-300 leading-snug mt-2">
                                  {entry.desc}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-[#3d2b4f]/60 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                                <span className="truncate">{entry.runtime}</span>
                                <span className={entry.hasConflict ? 'text-red-400 font-extrabold' : 'text-emerald-400 font-bold'}>
                                  {entry.compatibilityScore}%
                                </span>
                              </div>
                              <div className="w-full bg-[#1e162d] h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    entry.hasConflict ? 'bg-red-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${entry.compatibilityScore}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Tab Content: Platform Dependencies */}
                {refTab === 'deps' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sdk.reference.getPlatformDependencies().map((dep, idx) => (
                      <div key={idx} className="p-3.5 bg-[#120d1c] rounded-xl border border-[#3d2b4f] hover:border-[#ff4d4d]/40 transition-all space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                            <Layers size={13} className="text-[#ff4d4d]" />
                            {dep.name}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {dep.version}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-[#ff4d4d]/10 text-[#ff4d4d] px-2 py-0.5 rounded border border-[#ff4d4d]/20">
                            {dep.category}
                          </span>
                          <span className="text-[9px] font-bold uppercase text-gray-400">
                            Status: {dep.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-300 leading-snug">
                          {dep.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab Content: SDK Modules */}
                {refTab === 'modules' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Module List Sidebar */}
                    <div className="space-y-1.5 max-h-80 overflow-y-auto no-scrollbar pr-1">
                      {sdk.reference.getSdkModules().map((mod) => (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => setSelectedModuleId(mod.id)}
                          className={`w-full p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                            selectedModuleId === mod.id
                              ? 'bg-[#ff4d4d] border-[#ff4d4d] text-[#15101e] shadow-md'
                              : 'bg-[#120d1c] border-[#3d2b4f] text-gray-300 hover:text-white hover:border-[#ff4d4d]/50'
                          }`}
                        >
                          <div className="font-extrabold text-xs flex items-center justify-between">
                            <span>sdk.{mod.id}</span>
                            <span className="text-[9px] font-mono opacity-80 uppercase">{mod.methods.length} methods</span>
                          </div>
                          <div className={`text-[10px] truncate mt-0.5 ${selectedModuleId === mod.id ? 'text-[#15101e]/80 font-bold' : 'text-gray-400'}`}>
                            {mod.name}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Selected Module Detail Panel */}
                    <div className="md:col-span-2 p-4 bg-[#120d1c] rounded-xl border border-[#3d2b4f] space-y-3">
                      {(() => {
                        const mod = sdk.reference.getSdkModules().find(m => m.id === selectedModuleId) || sdk.reference.getSdkModules()[0];
                        return (
                          <>
                            <div className="flex items-center justify-between border-b border-[#3d2b4f] pb-2">
                              <div>
                                <h5 className="font-mono text-sm font-black text-[#ff4d4d]">sdk.{mod.id}</h5>
                                <p className="text-xs text-gray-300 mt-0.5">{mod.desc}</p>
                              </div>
                              <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                                {mod.status}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                {lang === 'ru' ? "Доступные сигнатуры методов:" : "Available Method Signatures:"}
                              </span>

                              <div className="space-y-1.5 font-mono text-xs">
                                {mod.methods.map((method, i) => (
                                  <div key={i} className="p-2 bg-[#1a1326] rounded-lg border border-[#3d2b4f] flex items-center justify-between">
                                    <span className="text-emerald-300 font-bold">sdk.{mod.id}.{method}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        sdk.hardware.copyToClipboard(`sdk.${mod.id}.${method}`);
                                        sdk.notify(
                                          lang === 'ru' ? 'Вызов скопирован' : 'Call Copied',
                                          `sdk.${mod.id}.${method}`,
                                          'info'
                                        );
                                      }}
                                      className="px-2 py-0.5 bg-[#251c35] hover:bg-[#3d2b4f] text-[10px] text-gray-300 rounded border border-[#3d2b4f] transition-all cursor-pointer"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Tab Content: Live JSON Schema */}
                {refTab === 'json' && (
                  <div className="p-3 bg-[#100b17] rounded-xl border border-[#3d2b4f] max-h-80 overflow-y-auto no-scrollbar font-mono text-[11px] text-emerald-400">
                    <pre>{JSON.stringify(sdk.reference.generateFullDocs(lang), null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* REAL-TIME SDK TELEMETRY LOG INSPECTOR */}
            <div className="p-6 bg-[#15101e] rounded-2xl border border-[#3d2b4f] hover:border-[#ff4d4d]/50 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#ff4d4d] flex items-center gap-2">
                  <Terminal size={16} />
                  {lang === 'ru' ? "Логи SDK в реальном времени" : "Real-time SDK Telemetry"}
                </h3>
                <span className="text-[10px] font-mono text-gray-500">
                  {sdkLogs.length} {lang === 'ru' ? 'записей' : 'logs'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {['all', 'info', 'warn', 'error', 'system', 'perf', 'action'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer shrink-0 ${
                      logFilter === f
                        ? 'bg-[#ff4d4d] border-[#ff4d4d] text-[#15101e]'
                        : 'bg-[#251c35] border-[#3d2b4f] text-gray-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="h-44 overflow-y-auto bg-[#100b17] border border-[#3d2b4f]/70 rounded-xl p-3 font-mono text-[11px] space-y-1.5 no-scrollbar">
                {sdkLogs.filter(l => logFilter === 'all' || l.level === logFilter).length === 0 ? (
                  <div className="text-gray-600 italic text-center py-8">
                    {lang === 'ru' ? 'Ожидание событий SDK...' : 'Waiting for SDK events...'}
                  </div>
                ) : (
                  sdkLogs
                    .filter(l => logFilter === 'all' || l.level === logFilter)
                    .map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 leading-tight">
                        <span className="text-gray-600 shrink-0">{log.time}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                          log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                          log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                          log.level === 'system' ? 'bg-blue-500/20 text-blue-400' :
                          log.level === 'perf' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {log.level}
                        </span>
                        <span className="text-gray-300 break-all">{log.message}</span>
                      </div>
                    ))
                )}
              </div>
            </div>

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
