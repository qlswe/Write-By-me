import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Check, Save, RefreshCw, Sparkles, Sliders, Eye, Undo, ShieldCheck, UserCheck, Cloud, CheckCircle2 } from 'lucide-react';
import { Language } from '../../data/translations';
import { ACCENT_COLOR_PRESETS, applyPrimaryAccentColor, getPrimaryAccentColor } from '../../utils/theme';
import { useAuth } from '../../hooks/useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { sdk } from '../../sdk';

interface VisualThemeEditorProps {
  lang: Language;
  role?: 'admin' | 'moderator' | 'user' | 'beta-tester';
  userAccentColor?: string;
  onUpdateUserAccentColor?: (color: string) => Promise<void>;
}

export const VisualThemeEditor: React.FC<VisualThemeEditorProps> = ({
  lang,
  role,
  userAccentColor,
  onUpdateUserAccentColor
}) => {
  const { user } = useAuth();
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return userAccentColor || getPrimaryAccentColor() || '#ff4d4d';
  });
  const [customHexInput, setCustomHexInput] = useState<string>(() => {
    return userAccentColor || getPrimaryAccentColor() || '#ff4d4d';
  });
  const [isSavingUserTheme, setIsSavingUserTheme] = useState<boolean>(false);
  const [isSavingGlobalTheme, setIsSavingGlobalTheme] = useState<boolean>(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'components' | 'glow'>('components');

  // Keep local state in sync when userAccentColor prop updates
  useEffect(() => {
    if (userAccentColor && /^#[0-9a-fA-F]{3,6}$/.test(userAccentColor)) {
      setSelectedColor(userAccentColor);
      setCustomHexInput(userAccentColor);
    }
  }, [userAccentColor]);

  // Handle color change (instant preview + state update)
  const handleSelectColor = (hex: string) => {
    const cleanHex = hex.trim();
    setSelectedColor(cleanHex);
    setCustomHexInput(cleanHex);
    applyPrimaryAccentColor(cleanHex);
  };

  // Save to User Profile in Firestore
  const handleSaveToUserProfile = async () => {
    setIsSavingUserTheme(true);
    try {
      if (onUpdateUserAccentColor) {
        await onUpdateUserAccentColor(selectedColor);
      } else {
        // Fallback direct update
        applyPrimaryAccentColor(selectedColor);
        localStorage.setItem('aha_primary_accent', selectedColor);
        if (user) {
          await setDoc(doc(db, 'users', user.uid), { primaryAccentColor: selectedColor }, { merge: true });
        }
      }

      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 3000);

      sdk.notify(
        lang === 'ru' ? 'Тема сохранена' : 'Theme Saved',
        lang === 'ru' 
          ? (user ? 'Ваш акцентный цвет успешно сохранен в профиль Firestore!' : 'Цвет темы применен и сохранен локально. Войдите в аккаунт для облачной синхронизации.')
          : (user ? 'Primary accent color successfully saved to your Firestore profile!' : 'Theme accent applied and saved locally. Sign in to sync across devices.'),
        'success'
      );
    } catch (err: any) {
      sdk.notify(
        lang === 'ru' ? 'Ошибка сохранения' : 'Save Error',
        err.message || 'Failed to save theme',
        'error'
      );
    } finally {
      setIsSavingUserTheme(false);
    }
  };

  // Admin: Save as Global System Accent in settings/general
  const handleSaveAsGlobalDefault = async () => {
    if (role !== 'admin' && role !== 'moderator') return;
    setIsSavingGlobalTheme(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        primaryAccentColor: selectedColor,
        themeUpdatedAt: Date.now(),
        themeUpdatedBy: user?.displayName || user?.email || 'Admin'
      }, { merge: true });

      sdk.notify(
        lang === 'ru' ? 'Глобальная тема обновлена' : 'Global Theme Updated',
        lang === 'ru' 
          ? `Цвет ${selectedColor.toUpperCase()} установлен по умолчанию для всех пользователей системы!` 
          : `Color ${selectedColor.toUpperCase()} set as default for all users!`,
        'success'
      );
    } catch (err: any) {
      sdk.notify(
        lang === 'ru' ? 'Ошибка админа' : 'Admin Error',
        err.message || 'Failed to update global theme',
        'error'
      );
    } finally {
      setIsSavingGlobalTheme(false);
    }
  };

  const handleResetToDefault = () => {
    handleSelectColor('#ff4d4d');
  };

  return (
    <div id="visual-theme-editor" className="bg-[#1a1326] border border-[#3d2b4f] hover:border-[#ff4d4d]/50 rounded-2xl p-5 sm:p-6 space-y-6 transition-all shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-[#3d2b4f]/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 flex items-center justify-center text-[#ff4d4d] shadow-[0_0_15px_rgba(255,77,77,0.2)] shrink-0">
            <Palette size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                {lang === 'ru' ? 'Визуальный Редактор Темы' : 'Visual Theme Editor'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ff4d4d]/15 text-[#ff4d4d] border border-[#ff4d4d]/30">
                <Sparkles size={11} />
                {lang === 'ru' ? 'Кастомизация UI' : 'UI Customizer'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
              {lang === 'ru'
                ? 'Выберите фирменный акцентный цвет интерфейса. Цвет на лету переопределяет кнопки, свечение, бейджи, графики и подсветку, а также синхронизируется с Firestore.'
                : 'Select your primary interface accent color. Realtime styling instantly adapts buttons, glows, tags, charts, and highlights, syncing directly to Firestore.'}
            </p>
          </div>
        </div>

        {/* Current Active Color Badge & Cloud Sync Status */}
        <div className="flex items-center gap-2.5 bg-[#15101e] border border-[#3d2b4f] px-3.5 py-2 rounded-xl shrink-0">
          <span
            className="w-5 h-5 rounded-full border-2 border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.25)] shrink-0 transition-colors"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            {selectedColor}
          </span>
          <div className="w-px h-3.5 bg-[#3d2b4f]" />
          {user ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400" title={lang === 'ru' ? 'Синхронизация с Firestore активна' : 'Firestore sync active'}>
              <Cloud size={12} />
              <span>{lang === 'ru' ? 'Облако' : 'Cloud'}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400" title={lang === 'ru' ? 'Локальное сохранение (войдите для облака)' : 'Local storage only (sign in for cloud)'}>
              <span>{lang === 'ru' ? 'Локально' : 'Local'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Preset Swatches Palette Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Sliders size={13} className="text-[#ff4d4d]" />
            <span>{lang === 'ru' ? 'Готовые палитры (Пресеты)' : 'Palette Presets'}</span>
          </label>
          <span className="text-[11px] text-gray-500 font-mono">
            {ACCENT_COLOR_PRESETS.length} {lang === 'ru' ? 'вариантов' : 'presets'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {ACCENT_COLOR_PRESETS.map((preset) => {
            const isSelected = selectedColor.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => handleSelectColor(preset.hex)}
                className={`relative flex items-center gap-2.5 p-2.5 rounded-xl text-left border transition-all cursor-pointer group select-none ${
                  isSelected
                    ? 'bg-[#251c35] border-white text-white shadow-[0_0_16px_rgba(255,255,255,0.18)] scale-[1.02]'
                    : 'bg-[#15101e] border-[#3d2b4f] text-gray-300 hover:border-gray-500 hover:bg-[#20172e] hover:text-white'
                }`}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <span
                    className="w-4 h-4 rounded-full border border-black/40 shadow-sm transition-transform group-hover:scale-110"
                    style={{ backgroundColor: preset.hex }}
                  />
                  {isSelected && (
                    <motion.span
                      layoutId="selectedThemeIndicator"
                      className="absolute -inset-1 rounded-full border-2 border-white/80 pointer-events-none"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate leading-tight">
                    {lang === 'ru' ? preset.shortRu : preset.shortEn}
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 truncate opacity-70 group-hover:opacity-100">
                    {preset.hex.toUpperCase()}
                  </div>
                </div>

                {isSelected && (
                  <Check size={14} className="text-white shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Picker + HEX Code Input */}
      <div className="p-4 bg-[#15101e] border border-[#3d2b4f]/70 rounded-xl space-y-3">
        <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
          <span>{lang === 'ru' ? 'Пользовательский цвет (Кастомный HEX / Color Picker)' : 'Custom Hex / Color Picker'}</span>
          <span className="text-[10px] text-gray-500 font-mono">RGB / HEX</span>
        </label>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2.5 bg-[#1a1326] border border-[#3d2b4f] focus-within:border-[#ff4d4d] rounded-xl px-3 py-2 flex-1 transition-all">
            <input
              type="color"
              value={customHexInput.startsWith('#') && customHexInput.length === 7 ? customHexInput : '#ff4d4d'}
              onChange={(e) => handleSelectColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
              title={lang === 'ru' ? 'Выбрать цвет пипеткой' : 'Pick a color'}
            />
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-gray-400 select-none">#</span>
              <input
                type="text"
                value={customHexInput.replace('#', '')}
                onChange={(e) => {
                  const val = '#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                  setCustomHexInput(val);
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    setSelectedColor(val);
                    applyPrimaryAccentColor(val);
                  }
                }}
                placeholder="FF4D4D"
                className="w-full bg-transparent border-none text-sm font-mono font-bold text-white focus:outline-none uppercase tracking-wider"
                maxLength={6}
              />
            </div>
            <span
              className="w-4 h-4 rounded-full border border-white/20 shrink-0"
              style={{ backgroundColor: selectedColor }}
            />
          </div>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2.5 bg-[#251c35] hover:bg-[#3d2b4f] text-gray-300 hover:text-white text-xs font-bold rounded-xl border border-[#3d2b4f] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            title={lang === 'ru' ? 'Сбросить к исходному красному цвету' : 'Reset to default red'}
          >
            <Undo size={14} />
            <span>{lang === 'ru' ? 'Сброс (#ff4d4d)' : 'Reset Default'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Realtime UI Preview Card */}
      <div className="p-4 sm:p-5 bg-[#15101e] border border-[#3d2b4f] rounded-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-[#ff4d4d]" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {lang === 'ru' ? 'Интерактивный Предпросмотр Элементов UI' : 'Live UI Component Preview'}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            {lang === 'ru' ? 'Рендер в реальном времени' : 'Real-time CSS variable binding'}
          </span>
        </div>

        {/* Sample Interactive UI Component Mockup */}
        <div className="p-4 bg-[#1e152d] border border-[#3d2b4f]/80 rounded-xl space-y-4 relative overflow-hidden">
          {/* Ambient radial glow matching color */}
          <div 
            className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-20 -mr-16 -mt-16 transition-colors"
            style={{ backgroundColor: selectedColor }}
          />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ff4d4d] font-black">
                {lang === 'ru' ? 'АХАХА-СИСТЕМА v6.0' : 'AHA-SYSTEM v6.0'}
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {lang === 'ru' ? 'Пример карточки контента' : 'Sample Content Card'}
              </h4>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#ff4d4d]/15 text-[#ff4d4d] border border-[#ff4d4d]/30">
              {lang === 'ru' ? 'Активный статус' : 'Active Status'}
            </span>
          </div>

          <p className="relative z-10 text-xs text-gray-300 leading-relaxed">
            {lang === 'ru'
              ? 'Этот блок наглядно демонстрирует, как выбранный вами оттенок преображает кнопки, рамки, свечение и градиенты по всему сайту.'
              : 'This block demonstrates how your chosen shade transforms buttons, borders, ambient glow, and highlights across the app.'}
          </p>

          {/* Sample Interactive Buttons & Controls */}
          <div className="relative z-10 flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#3d2b4f]/40">
            <button
              type="button"
              className="px-4 py-2 bg-[#ff4d4d] hover:bg-[#ff4d4d]/90 text-[#15101e] text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,77,77,0.35)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sparkles size={14} />
              <span>{lang === 'ru' ? 'Основная кнопка' : 'Primary Action'}</span>
            </button>

            <button
              type="button"
              className="px-3.5 py-2 bg-[#251c35] hover:bg-[#ff4d4d]/10 text-white hover:text-[#ff4d4d] text-xs font-bold rounded-xl border border-[#3d2b4f] hover:border-[#ff4d4d]/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{lang === 'ru' ? 'Вторичная' : 'Secondary'}</span>
            </button>

            <div className="ml-auto flex items-center gap-1.5 text-xs text-[#ff4d4d] font-bold">
              <CheckCircle2 size={15} />
              <span>{lang === 'ru' ? 'Активно' : 'Active'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions: Save to User Profile & Admin Global Default */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#3d2b4f]/40">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          {user ? (
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <UserCheck size={14} />
              <span>{lang === 'ru' ? `Профиль: ${user.displayName || user.email}` : `Profile: ${user.displayName || user.email}`}</span>
            </span>
          ) : (
            <span>
              {lang === 'ru' ? 'Войдите для облачного сохранения темы' : 'Sign in to persist your theme across devices'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Admin Global Sync Button */}
          {(role === 'admin' || role === 'moderator') && (
            <button
              type="button"
              onClick={handleSaveAsGlobalDefault}
              disabled={isSavingGlobalTheme}
              className="px-3.5 py-2.5 bg-[#251c35] hover:bg-[#3d2b4f] text-gray-200 hover:text-white text-xs font-bold rounded-xl border border-[#3d2b4f] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={lang === 'ru' ? 'Сделать цветом по умолчанию для всех пользователей' : 'Set as default for all users in Firestore'}
            >
              {isSavingGlobalTheme ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} className="text-amber-400" />}
              <span>{lang === 'ru' ? 'Сделать общим для всех' : 'Set Global Default'}</span>
            </button>
          )}

          {/* Primary User Save to Firestore Button */}
          <button
            id="save-theme-color-button"
            type="button"
            onClick={handleSaveToUserProfile}
            disabled={isSavingUserTheme}
            className="px-5 py-2.5 bg-[#ff4d4d] hover:bg-[#ff4d4d]/90 text-[#15101e] text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(255,77,77,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
          >
            {isSavingUserTheme ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : showSavedFeedback ? (
              <Check size={15} />
            ) : (
              <Save size={15} />
            )}
            <span>
              {showSavedFeedback
                ? (lang === 'ru' ? 'Тема Сохранена!' : 'Theme Saved!')
                : (lang === 'ru' ? 'Сохранить тему в профиль' : 'Save Theme to Profile')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
