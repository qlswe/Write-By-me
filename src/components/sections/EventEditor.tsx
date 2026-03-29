import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Languages, Loader2 } from 'lucide-react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { translateContent } from '../../services/geminiService';

interface EventEditorProps {
  event?: any;
  onClose: () => void;
}

const LANGUAGES = ['ru', 'en', 'by', 'jp', 'de', 'fr', 'zh'];

export const EventEditor: React.FC<EventEditorProps> = ({ event, onClose }) => {
  const { user } = useAuth();
  const [currentLang, setCurrentLang] = useState('ru');
  const [type, setType] = useState(event?.type || 'weekly');
  const [icon, setIcon] = useState(event?.icon || 'globe');
  
  const [title, setTitle] = useState<Record<string, string>>(
    typeof event?.title === 'object' ? event.title : LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang]: event?.title || '' }), {})
  );
  const [description, setDescription] = useState<Record<string, string>>(
    typeof event?.description === 'object' ? event.description : LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang]: event?.description || '' }), {})
  );
  
  const [dayOfWeek, setDayOfWeek] = useState(event?.dayOfWeek ?? 1);
  const [weekOffset, setWeekOffset] = useState(event?.weekOffset ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!title[currentLang] && !description[currentLang]) return;
    setIsTranslating(true);
    try {
      const [translatedTitle, translatedDescription] = await Promise.all([
        title[currentLang] ? translateContent(title[currentLang]) : Promise.resolve(title),
        description[currentLang] ? translateContent(description[currentLang]) : Promise.resolve(description)
      ]);

      setTitle(prev => ({ ...prev, ...translatedTitle, [currentLang]: prev[currentLang] }));
      setDescription(prev => ({ ...prev, ...translatedDescription, [currentLang]: prev[currentLang] }));
      alert('Translation complete!');
    } catch (error) {
      alert('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!title[currentLang] || !description[currentLang]) {
      alert(`Please fill in all fields for ${currentLang}`);
      return;
    }

    setIsSaving(true);
    try {
      const eventData: any = {
        type,
        icon,
        title,
        description,
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
          <h2 className="text-2xl font-bold text-white">{event ? 'Edit Event' : 'Create Event'}</h2>
          <div className="flex items-center gap-4">
            <select 
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value)}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
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
          </div>

          {type === 'weekly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Day of Week (0=Sun, 1=Mon...)</label>
                <input 
                  type="number"
                  min="0"
                  max="6"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Week Offset (0 or 1)</label>
                <input 
                  type="number"
                  min="0"
                  max="1"
                  value={weekOffset}
                  onChange={(e) => setWeekOffset(Number(e.target.value))}
                  className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title ({currentLang.toUpperCase()})</label>
            <input 
              type="text"
              value={title[currentLang] || ''}
              onChange={(e) => setTitle(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6]"
              placeholder="Event title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description ({currentLang.toUpperCase()})</label>
            <textarea 
              value={description[currentLang] || ''}
              onChange={(e) => setDescription(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#1A1528] border border-[#5C4B8B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C3A6E6] min-h-[100px]"
              placeholder="Event description..."
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#2F244F] z-10 flex justify-between items-center p-6 border-t border-[#5C4B8B]">
          <button 
            onClick={handleTranslate}
            disabled={isTranslating}
            className="flex items-center gap-2 bg-[#1A1528] text-[#C3A6E6] border border-[#C3A6E6] px-4 py-2 rounded-xl font-bold hover:bg-[#C3A6E6] hover:text-[#2F244F] transition-colors disabled:opacity-50"
          >
            {isTranslating ? <Loader2 size={20} className="animate-spin" /> : <Languages size={20} />}
            {isTranslating ? 'Translating...' : `Auto-Translate from ${currentLang.toUpperCase()}`}
          </button>
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl font-bold text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#C3A6E6] text-[#2F244F] px-6 py-2 rounded-xl font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
