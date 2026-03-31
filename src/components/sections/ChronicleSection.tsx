import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe, RefreshCw, Swords, Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-[#C3A6E6] flex items-center gap-3">
            <Calendar className="text-[#C3A6E6]" />
            {t.navChronicle}
          </h2>
          <p className="text-gray-400 text-sm mt-1">{t.chronicleDesc}</p>
        </div>
        {isAdmin && (
          <button onClick={onCreate} className="flex items-center gap-2 bg-[#C3A6E6] text-[#2F244F] px-5 py-2.5 rounded-xl font-bold hover:bg-white transition-all shadow-lg hover:shadow-[#C3A6E6]/20">
            <Plus size={20} />
            {t.createEvent}
          </button>
        )}
      </div>

      <div className="relative space-y-8">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#C3A6E6]/50 via-[#5C4B8B] to-transparent hidden md:block" />

        {events.map((event, index) => {
          const { nextDate, progress } = getEventProgress(event);
          const countdown = formatCountdown(nextDate, t, lang);
          
          return (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative md:pl-16"
            >
              {/* Timeline Dot */}
              <div className="absolute left-4 top-8 w-4 h-4 rounded-full bg-[#2F244F] border-2 border-[#C3A6E6] z-10 hidden md:block shadow-[0_0_10px_rgba(195,166,230,0.5)]" />

              <div className="bg-[#3E3160] p-6 rounded-2xl shadow-lg border border-[#5C4B8B] relative overflow-hidden group hover:border-[#C3A6E6]/50 transition-all duration-300">
                {/* Progress Bar Background */}
                <div className="absolute top-0 left-0 w-full h-1 bg-[#2F244F]">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#C3A6E6] to-[#B094EB] shadow-[0_0_15px_rgba(195,166,230,0.6)]"
                    initial={lowPerfMode ? { width: `${progress}%` } : { width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={lowPerfMode ? { duration: 0 } : { duration: 1.5, ease: "easeOut" }}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6 mt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#2F244F] border border-[#5C4B8B] rounded-2xl flex items-center justify-center shadow-inner group-hover:border-[#C3A6E6] transition-colors relative">
                      {event.icon === 'refresh-cw' ? <RefreshCw size={28} className="text-[#C3A6E6]" /> : 
                       event.icon === 'swords' ? <Swords size={28} className="text-[#C3A6E6]" /> : <Globe size={28} className="text-[#C3A6E6]" />}
                      
                      {/* Status Pulse */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#3E3160] animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-[#C3A6E6] transition-colors">
                        {event.title[lang] || event.title['en']}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-[#2F244F] text-[10px] font-mono text-[#C3A6E6] rounded border border-[#5C4B8B] uppercase tracking-tighter">
                          {event.type === 'daily' ? t.daily : t.weekly}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                          {event.type === 'daily' ? t.cycle24h : (event.weekOffset !== undefined ? t.cycle14d : t.cycle7d)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex gap-2 self-end sm:self-start">
                      <button onClick={() => onEdit?.(event)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors border border-transparent hover:border-blue-400/30">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(event.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors border border-transparent hover:border-red-400/30">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#2F244F]/80 rounded-xl p-4 border border-[#5C4B8B]/50 flex items-center gap-4">
                    <div className="w-24 h-10 rounded-lg bg-[#C3A6E6]/10 flex items-center justify-center">
                      <Clock size={20} className="text-[#C3A6E6]" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-0.5">{t.timeRemaining || "Time Remaining"}</div>
                      <div className="text-xl font-mono font-bold text-[#C3A6E6] tracking-tight">
                        {countdown}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#2F244F]/40 rounded-xl p-4 border border-[#5C4B8B]/30">
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {event.description[lang] || event.description['en']}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
