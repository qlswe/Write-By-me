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
import { ConfirmModal } from '../ui/ConfirmModal';

interface ChronicleSectionProps {
  lang: Language;
  lowPerfMode?: boolean;
  events: any[];
  onEdit?: (event: any) => void;
  onCreate?: () => void;
  role?: 'admin' | 'moderator' | 'user' | 'beta-tester';
}

const EventCard = React.memo(({ 
  event, 
  index, 
  now, 
  t, 
  lang, 
  lowPerfMode, 
  isModerator, 
  isAdmin,
  onEdit, 
  onDelete 
}: { 
  event: any, 
  index: number, 
  now: Date, 
  t: any, 
  lang: Language, 
  lowPerfMode?: boolean, 
  isModerator: boolean, 
  isAdmin: boolean,
  onEdit?: (event: any) => void, 
  onDelete: (id: string) => void 
}) => {
  const { nextDate, progress } = getEventProgress(event, now);
  const countdown = formatCountdown(nextDate, t, lang, now);
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative md:pl-20"
    >
      {/* Timeline Dot */}
      <div className="absolute left-6 top-10 w-4 h-4 rounded-full bg-[#15101e] border-2 border-[#ff4d4d] z-10 hidden md:block shadow-[0_0_15px_rgba(255,77,77,0.5)]" />

      <div className="bg-[#1A1528]/40 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group transition-all duration-500 shadow-2xl">
        {/* Progress Bar Background */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#15101e]/50">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#ff4d4d] to-[#ff7a7a] shadow-[0_0_20px_rgba(255,77,77,0.6)]"
            initial={lowPerfMode ? { width: `${progress}%` } : { width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={lowPerfMode ? { duration: 0 } : { duration: 1.5, ease: "easeOut" }}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8 mt-4">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[#15101e] rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 relative">
              <div className="absolute inset-0 bg-[#ff4d4d]/5 rounded-3xl blur-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
              {event.icon === 'refresh-cw' ? <RefreshCw size={36} className="text-[#ff4d4d] relative z-10" /> : 
               event.icon === 'swords' ? <Swords size={36} className="text-[#ff4d4d] relative z-10" /> : <Globe size={36} className="text-[#ff4d4d] relative z-10" />}
              
              {/* Status Pulse */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#1A1528] animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white group-hover:text-[#ff4d4d] transition-colors tracking-tight">
                {event.title[lang] || event.title['en']}
              </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                <span className="px-3 py-1 bg-[#ff4d4d]/10 text-[10px] font-black text-[#ff4d4d] rounded-lg uppercase tracking-widest whitespace-nowrap">
                  {event.type === 'daily' ? t.daily : t.weekly}
                </span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">
                  {event.type === 'daily' ? t.cycle24h : (event.weekOffset !== undefined ? t.cycle14d : t.cycle7d)}
                </span>
              </div>
            </div>
          </div>
          
          {isModerator && (
            <div className="flex gap-3 self-end sm:self-start">
              <button 
                onClick={() => onEdit?.(event)} 
                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-blue-400/10 text-gray-500 hover:text-blue-400 flex items-center justify-center transition-all active:scale-90 border border-transparent hover:border-blue-400/20"
              >
                <Edit size={20} />
              </button>
              {isAdmin && (
                <button 
                  onClick={() => onDelete(event.id)} 
                  className="w-12 h-12 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 flex items-center justify-center transition-all active:scale-90 border border-transparent hover:border-red-500/20"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-[#15101e]/60 rounded-3xl p-6 flex items-center gap-6 shadow-inner">
            <div className="w-16 h-16 rounded-2xl bg-[#ff4d4d]/10 flex items-center justify-center shrink-0">
              <Clock size={28} className="text-[#ff4d4d]" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mb-1">{t.timeRemaining || "Time Remaining"}</div>
              <div className="text-lg sm:text-xl md:text-2xl font-black text-[#ff4d4d] tracking-tighter italic">
                {countdown}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[#15101e]/30 rounded-3xl p-6 flex items-center">
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              {event.description[lang] || event.description['en']}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export const ChronicleSection: React.FC<ChronicleSectionProps> = ({ lang, lowPerfMode, events, onEdit, onCreate, role }) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('ChronicleSection');
  trackRender();

  const [now, setNow] = useState(new Date());
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = role === 'admin' || user?.email === 'semegladysev527@gmail.com';
  const isModerator = role === 'admin' || role === 'moderator' || isAdmin;

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000); // Update every second for dynamic countdown
    return () => clearInterval(timer);
  }, []);

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      await deleteDoc(doc(db, 'events', eventToDelete));
      setEventToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `events/${eventToDelete}`);
    }
  };

  return (
    <div className="bg-[#15101e] rounded-[3rem] p-8 sm:p-12 border border-[#3d2b4f]/30 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-16">
        <div>
          <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ff4d4d]/10 flex items-center justify-center border border-[#ff4d4d]/20">
              <Calendar className="text-[#ff4d4d]" size={32} />
            </div>
            {t.navChronicle}
          </h2>
          <p className="text-gray-400 text-sm mt-3 font-medium tracking-wide ml-1">{t.chronicleDesc}</p>
        </div>
        {isModerator && (
          <button 
            onClick={onCreate} 
            className="flex items-center gap-3 bg-[#ff4d4d] text-[#15101e] px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,77,77,0.3)] border border-white/20"
          >
            <Plus size={20} />
            {t.createEvent}
          </button>
        )}
      </div>

      <div className="relative space-y-12">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#ff4d4d]/50 via-[#3d2b4f]/30 to-transparent hidden md:block" />

        {events.map((event, index) => (
          <EventCard 
            key={event.id}
            event={event}
            index={index}
            now={now}
            t={t}
            lang={lang}
            lowPerfMode={lowPerfMode}
            isModerator={isModerator}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={setEventToDelete}
          />
        ))}
      </div>

      <ConfirmModal
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleDelete}
        title={t.confirmDeleteEventTitle || "Delete Event"}
        message={t.confirmDeleteEventMessage || "Are you sure you want to delete this event? This action cannot be undone."}
        confirmText={t.delete || "Delete"}
        cancelText={t.cancelBtn || "Cancel"}
        isDestructive={true}
      />
    </div>
  );
};
