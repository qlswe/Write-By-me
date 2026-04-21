import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save } from 'lucide-react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { translations, Language } from '../../data/translations';
import { vercelFallback } from '../../utils/vercelFallback';

interface EventEditorProps {
  event?: any;
  onClose: () => void;
  lang: Language;
}

const LANGUAGES = ['ru', 'en', 'by', 'de', 'fr', 'zh'];

export const EventEditor: React.FC<EventEditorProps> = ({ event, onClose, lang }) => {
  const { user } = useAuth();
  const t = translations[lang];
  const [currentLang, setCurrentLang] = useState(lang);
  const [type, setType] = useState(event?.type || 'weekly');
  const [icon, setIcon] = useState(event?.icon || 'globe');
  
  const [title, setTitle] = useState<Record<string, string>>(
    typeof event?.title === 'object' ? event.title : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: event?.title || '' }), {})
  );
  const [description, setDescription] = useState<Record<string, string>>(
    typeof event?.description === 'object' ? event.description : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: event?.description || '' }), {})
  );
  
  const [dayOfWeek, setDayOfWeek] = useState(event?.dayOfWeek ?? 1);
  const [weekOffset, setWeekOffset] = useState(event?.weekOffset ?? 0);
  const [resetTime, setResetTime] = useState(event?.resetTime || '03:00');
  const [isSaving, setIsSaving] = useState(false);

  const DAYS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  const handleSave = async () => {
    if (!title[currentLang] || !description[currentLang]) {
      alert(`${t.fillAllFields}${currentLang}`);
      return;
    }

    setIsSaving(true);
    try {
      const eventData: any = {
        type,
        icon,
        title,
        description,
        resetTime,
        authorUid: user?.uid,
        updatedAt: new Date().toISOString()
      };

      if (type === 'weekly') {
        eventData.dayOfWeek = Number(dayOfWeek);
        if (weekOffset !== undefined) {
          eventData.weekOffset = Number(weekOffset);
        }
      }

      if (vercelFallback.isAvailable()) {
        const uid = event?.id || Date.now().toString() + '_' + user?.uid;
        const payload = {
            ...eventData,
            id: uid,
            createdAt: event?.createdAt || new Date().toISOString()
        };
        await vercelFallback.lpush('events', JSON.stringify(payload));
      } else {
        if (event?.id) {
          await setDoc(doc(db, 'events', event.id), {
            ...eventData,
            createdAt: event.createdAt || new Date().toISOString()
          });
        } else {
          await addDoc(collection(db, 'events'), {
            ...eventData,
            createdAt: new Date().toISOString()
          });
        }
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, event?.id ? OperationType.UPDATE : OperationType.CREATE, 'events');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#15101e] rounded-[1.5rem] sm:rounded-[3rem] w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-[#3d2b4f]/30 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#251c35]/50 p-4 sm:p-8 border-b border-[#3d2b4f]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#ff4d4d]/10 flex items-center justify-center border border-[#ff4d4d]/20">
                <Save className="text-[#ff4d4d] w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
                  {event ? t.editEvent : t.createEvent}
                </h2>
                <p className="text-[8px] sm:text-xs text-white/40 font-bold uppercase tracking-widest mt-1">{t.eventProtocol}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="sm:hidden w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90 shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex bg-[#1A1528] rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-[#3d2b4f]/30 overflow-x-auto no-scrollbar flex-1 sm:flex-none">
              {LANGUAGES.map(l => (
                <button
                  key={l}
                  onClick={() => setCurrentLang(l as Language)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex-1 sm:flex-none ${
                    currentLang === l ? 'bg-[#ff4d4d] text-[#15101e]' : 'text-white/40 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button 
              onClick={onClose} 
              className="hidden sm:flex w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 items-center justify-center text-white/60 hover:text-white transition-all active:scale-90 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">{t.typeLabel}</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-[#ff4d4d] transition-all appearance-none cursor-pointer"
              >
                <option value="daily">{t.dailyOption}</option>
                <option value="weekly">{t.weeklyOption}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">{t.iconLabel}</label>
              <select 
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-[#ff4d4d] transition-all appearance-none cursor-pointer"
              >
                <option value="globe">Globe</option>
                <option value="swords">Swords</option>
                <option value="refresh-cw">Refresh</option>
                <option value="star">Star</option>
                <option value="zap">Zap</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">{t.resetTimeLabel}</label>
              <input 
                type="time"
                value={resetTime}
                onChange={(e) => setResetTime(e.target.value)}
                className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-[#ff4d4d] transition-all"
              />
            </div>
          </div>

          {type === 'weekly' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[#1A1528]/30 rounded-3xl border border-[#3d2b4f]/20"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">{t.dayOfWeekLabel}</label>
                <select 
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full bg-[#15101e]/50 border border-[#3d2b4f]/30 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-[#ff4d4d] transition-all appearance-none cursor-pointer"
                >
                  {DAYS.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">{t.weekOffsetLabel}</label>
                <select 
                  value={weekOffset}
                  onChange={(e) => setWeekOffset(Number(e.target.value))}
                  className="w-full bg-[#15101e]/50 border border-[#3d2b4f]/30 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-[#ff4d4d] transition-all appearance-none cursor-pointer"
                >
                  <option value={0}>{t.week1}</option>
                  <option value={1}>{t.week2}</option>
                </select>
              </div>
            </motion.div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">
                {t.titleLabel} <span className="text-[#ff4d4d]">[{currentLang.toUpperCase()}]</span>
              </label>
              <input 
                type="text"
                value={title[currentLang] || ''}
                onChange={(e) => setTitle(prev => ({ ...prev, [currentLang]: e.target.value }))}
                className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-2xl px-6 py-5 text-white font-bold focus:outline-none focus:border-[#ff4d4d] transition-all placeholder:text-white/40"
                placeholder={t.placeholderTitle}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">
                {t.summaryLabel} <span className="text-[#ff4d4d]">[{currentLang.toUpperCase()}]</span>
              </label>
              <textarea 
                value={description[currentLang] || ''}
                onChange={(e) => setDescription(prev => ({ ...prev, [currentLang]: e.target.value }))}
                className="w-full bg-[#1A1528]/50 border border-[#3d2b4f]/30 rounded-3xl px-6 py-5 text-white font-medium focus:outline-none focus:border-[#ff4d4d] transition-all min-h-[150px] resize-none placeholder:text-white/40"
                placeholder={t.placeholderDescription}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-8 bg-[#251c35]/50 border-t border-[#3d2b4f]/30 flex flex-col sm:flex-row justify-end items-center gap-4 sm:gap-6 shrink-0">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto text-[10px] sm:text-xs font-black text-white/60 hover:text-white uppercase tracking-[0.2em] transition-colors py-2"
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 bg-[#ff4d4d] text-[#15101e] px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(255,77,77,0.3)]"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-[#15101e] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {isSaving ? t.saving : t.saveBtn}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
