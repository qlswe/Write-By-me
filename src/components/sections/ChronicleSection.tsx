import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe, RefreshCw, Swords, Plus, Edit, Trash2 } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { getNextEventDate, getEventProgress, formatCountdown, pluralize } from '../../utils/time';
import { usePerfLogger } from '../../utils/logger';
import { useAuth } from '../../hooks/useAuth';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';

interface ChronicleSectionProps {
  lang: Language;
  lowPerfMode?: boolean;
  events: any[];
  onEdit?: (event: any) => void;
  onCreate?: () => void;
}

export const ChronicleSection: React.FC<ChronicleSectionProps> = ({ lang, lowPerfMode, events, onEdit, onCreate }) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('ChronicleSection');
  trackRender();

  const [now, setNow] = useState(new Date());
  const { user } = useAuth();
  const isAdmin = user?.email === 'semegladysev527@gmail.com';

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
      }
    }
  };

  return (
    <div className="bg-[#3E3160]/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-[#5C4B8B]">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-[#C3A6E6]">{t.navChronicle}</h2>
        {isAdmin && (
          <button onClick={onCreate} className="flex items-center gap-2 bg-[#C3A6E6] text-[#2F244F] px-4 py-2 rounded-xl font-bold hover:bg-white transition-colors">
            <Plus size={20} />
            {t.createEvent}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map(event => {
          const { nextDate, progress } = getEventProgress(event);
          const countdown = formatCountdown(nextDate, t, lang);
          
          return (
            <div key={event.id} className="bg-[#3E3160] p-6 rounded-2xl shadow-lg border border-[#5C4B8B] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#2F244F]">
                <motion.div 
                  className="h-full bg-[#C3A6E6] shadow-[0_0_10px_#C3A6E6]"
                  initial={lowPerfMode ? { width: `${progress}%` } : { width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={lowPerfMode ? { duration: 0 } : { duration: 1, ease: "easeOut" }}
                />
              </div>
              
              <div className="flex items-start justify-between mb-6 mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#2F244F] border border-[#5C4B8B] rounded-xl flex items-center justify-center shadow-inner group-hover:border-[#C3A6E6] transition-colors">
                    {event.icon === 'refresh-cw' ? <RefreshCw size={24} className="text-[#C3A6E6]" /> : 
                     event.icon === 'swords' ? <Swords size={24} className="text-[#C3A6E6]" /> : <Globe size={24} className="text-[#C3A6E6]" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{event.title[lang] || event.title['en']}</h3>
                    <div className="text-xs font-mono text-[#9370DB] uppercase tracking-wider mt-1">
                      {event.type === 'daily' ? '24H CYCLE' : (event.weekOffset !== undefined ? '14D CYCLE' : '7D CYCLE')}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => onEdit?.(event)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                      <Edit size={20} />
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="bg-[#2F244F] rounded-xl p-4 mb-4 border border-[#5C4B8B]/50">
                <div className="text-sm text-gray-400 mb-1 uppercase tracking-wider font-mono">{t.timeRemaining || "Time Remaining"}</div>
                <div className="text-2xl font-mono font-bold text-[#C3A6E6] tracking-tight">
                  {countdown}
                </div>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                {event.description[lang] || event.description['en']}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
