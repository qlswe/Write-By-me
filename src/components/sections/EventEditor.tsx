import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save } from 'lucide-react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { translations, Language } from '../../data/translations';

interface EventEditorProps {
  event?: any;
  onClose: () => void;
  lang: Language;
}

const LANGUAGES = ['ru', 'en', 'by', 'jp', 'de', 'fr', 'zh'];

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

      if (event?.id) {
        await setDoc(doc(db, 'events', event.id), {
          ...eventData,
          createdAt: event.createdAt
        });
      } else {
        await addDoc(collection(db, 'events'), {
          ...eventData,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, event?.id ? OperationType.UPDATE : OperationType.CREATE, 'events');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#2F244F] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[#5C4B8B] shadow-2xl flex flex-col"
      >
        <div className="sticky top-0 bg-[#2F244F] z-10 flex justify-between items-center p-6 border-b border-[#5C4B8B]">
          <h2 className="text-2xl font-bold text-white">{event ? t.editEvent : t.createEvent}</h2>
          <div className="flex items-center gap-4">
            <select 
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value as Language)}
              className="bg-[#1A1528] border border-[#5C4B8B] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#C3A6E6]"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.typeLabel}</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.iconLabel}</label>
              <select 
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
              >
                <option value="globe">Globe</option>
                <option value="swords">Swords</option>
                <option value="refresh-cw">Refresh</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reset Time (UTC)</label>
              <input 
                type="time"
                value={resetTime}
                onChange={(e) => setResetTime(e.target.value)}
                className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
              />
            </div>
          </div>

          {type === 'weekly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Day of Week</label>
                <select 
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
                >
                  {DAYS.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.weekOffsetLabel}</label>
                <select 
                  value={weekOffset}
                  onChange={(e) => setWeekOffset(Number(e.target.value))}
                  className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
                >
                  <option value={0}>Week 1</option>
                  <option value={1}>Week 2</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.titleLabel} ({currentLang.toUpperCase()})</label>
            <input 
              type="text"
              value={title[currentLang] || ''}
              onChange={(e) => setTitle(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
              placeholder={t.placeholderTitle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.summaryLabel} ({currentLang.toUpperCase()})</label>
            <textarea 
              value={description[currentLang] || ''}
              onChange={(e) => setDescription(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6] min-h-[100px]"
              placeholder={t.placeholderDescription}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#2F244F] z-10 flex justify-end items-center p-6 border-t border-[#5C4B8B]">
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl font-bold text-gray-300 hover:text-white transition-colors"
            >
              {t.cancel}
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#C3A6E6] text-[#2F244F] px-6 py-2 rounded-xl font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              {isSaving ? t.saving : t.saveBtn}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
