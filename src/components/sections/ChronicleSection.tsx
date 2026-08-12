import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Globe, RefreshCw, Swords, Plus, Edit, Trash2, Calendar, Clock, MapPin, List, Bell, BellOff, Sparkles, Check } from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { getNextEventDate, getEventProgress, formatCountdown, pluralize } from '../../utils/time';
import { usePerfLogger } from '../../utils/logger';
import { useAuth } from '../../hooks/useAuth';
import { deleteDoc, doc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { safeStorage } from '../../utils/securityStorage';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ChronicleSkeletonList } from '../ui/SkeletonLoaders';
import { AhaMap } from '../ui/AhaMap';

interface ChronicleSectionProps {
  lang: Language;
  lowPerfMode?: boolean;
  loading?: boolean;
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
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">
                  {event.type === 'daily' ? t.cycle24h : (event.weekOffset !== undefined ? t.cycle14d : t.cycle7d)}
                </span>
              </div>
            </div>
          </div>
          
          {isModerator && (
            <div className="flex gap-3 self-end sm:self-start">
              <button 
                onClick={() => onEdit?.(event)} 
                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-blue-400/10 text-white/40 hover:text-blue-400 flex items-center justify-center transition-all active:scale-90 border border-transparent hover:border-blue-400/20"
              >
                <Edit size={20} />
              </button>
              {isAdmin && (
                <button 
                  onClick={() => onDelete(event.id)} 
                  className="w-12 h-12 rounded-xl bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-500 flex items-center justify-center transition-all active:scale-90 border border-transparent hover:border-red-500/20"
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
              <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mb-1">{t.timeRemaining || "Time Remaining"}</div>
              <div className="text-lg sm:text-xl md:text-2xl font-black text-[#ff4d4d] tracking-tighter italic">
                {countdown}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[#15101e]/30 rounded-3xl p-6 flex items-center">
            <p className="text-white/60 text-sm leading-relaxed font-medium">
              {event.description[lang] || event.description['en']}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export const ChronicleSection: React.FC<ChronicleSectionProps> = ({ lang, lowPerfMode, loading = false, events, onEdit, onCreate, role }) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('ChronicleSection');
  trackRender();

  const [now, setNow] = useState(new Date());
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'timeline'>('both');
  const [isSubscribed, setIsSubscribed] = useState(() => {
    return safeStorage.getItem('aha_chronicle_subscribed') !== 'false';
  });

  const { user } = useAuth();
  const isAdmin = role === 'admin';
  const isModerator = role === 'admin' || role === 'moderator' || isAdmin;
  const isRu = lang === 'ru';

  // Real-time Firestore Subscription for NEW Chronicle Events
  useEffect(() => {
    if (!isSubscribed) return;

    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(10));
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const eventData = change.doc.data();
          const rawTitle = eventData.title;
          const eventTitle = typeof rawTitle === 'string'
            ? rawTitle
            : (rawTitle?.[lang] || rawTitle?.ru || rawTitle?.en || (isRu ? 'Новое событие' : 'New Event'));

          const toastMessage = isRu
            ? `🔔 Новое событие в Хронике: "${eventTitle}"!`
            : `🔔 New Chronicle Event added: "${eventTitle}"!`;

          // Dispatch toast to application
          window.dispatchEvent(new CustomEvent('aha_toast', { detail: toastMessage }));

          // Play subtle audio alert if supported
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
          } catch (e) {}
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
    });

    return () => {
      unsubscribe();
    };
  }, [isSubscribed, lang, isRu]);

  const toggleSubscription = () => {
    const nextSub = !isSubscribed;
    setIsSubscribed(nextSub);
    safeStorage.setItem('aha_chronicle_subscribed', String(nextSub));

    const notificationMsg = nextSub
      ? (isRu ? '🔔 Вы подписились на уведомления о новых событиях Хроники' : '🔔 Subscribed to new Chronicle event alerts')
      : (isRu ? '🔕 Подписка на уведомления Хроники отключена' : '🔕 Unsubscribed from Chronicle event alerts');

    window.dispatchEvent(new CustomEvent('aha_toast', { detail: notificationMsg }));
  };

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
    <div className="bg-[#15101e] rounded-[3rem] p-8 sm:p-12 border border-[#3d2b4f]/30 shadow-[0_0_50px_rgba(0,0,0,0.3)] space-y-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-[#3d2b4f]/40">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl md:text-5xl lg:text-5xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#ff4d4d]/10 flex items-center justify-center border border-[#ff4d4d]/20">
                <Calendar className="text-[#ff4d4d]" size={24} />
              </div>
              {t.navChronicle}
            </h2>
            {isSubscribed && (
              <span className="px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black rounded-full uppercase flex items-center gap-1.5 shadow-md animate-pulse">
                <Bell size={11} className="text-amber-400" />
                {isRu ? 'Подписка активна' : 'Live Subscribed'}
              </span>
            )}
          </div>
          <p className="text-white/60 text-sm mt-3 font-medium tracking-wide">{t.chronicleDesc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-between lg:justify-end">
          {/* Real-time Event Subscription Button */}
          <button
            onClick={toggleSubscription}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg border ${
              isSubscribed
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                : 'bg-[#1a1329] text-gray-400 border-[#3d2b4f] hover:text-white hover:bg-white/10'
            }`}
            title={isSubscribed ? (isRu ? 'Отключить подписку' : 'Unsubscribe') : (isRu ? 'Подписаться на события' : 'Subscribe')}
          >
            {isSubscribed ? (
              <>
                <Bell size={15} className="text-amber-400 animate-bounce" />
                <span>{isRu ? 'Уведомления ВКЛ' : 'Alerts ON'}</span>
              </>
            ) : (
              <>
                <BellOff size={15} />
                <span>{isRu ? 'Подписаться' : 'Subscribe'}</span>
              </>
            )}
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#1a1329] border border-[#3d2b4f] rounded-2xl p-1 gap-1">
            <button
              onClick={() => setViewMode('both')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'both' ? 'bg-[#ff4d4d] text-black font-black shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe size={14} />
              <span>{isRu ? 'Всё вместе' : 'All Views'}</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'map' ? 'bg-[#ff4d4d] text-black font-black shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <MapPin size={14} />
              <span>{isRu ? 'Карта Leaflet' : 'Leaflet Map'}</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'timeline' ? 'bg-[#ff4d4d] text-black font-black shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List size={14} />
              <span>{isRu ? 'Лента хроники' : 'Timeline'}</span>
            </button>
          </div>

          {isModerator && (
            <button 
              onClick={onCreate} 
              className="flex items-center gap-3 bg-[#ff4d4d] text-[#15101e] px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,77,77,0.3)] border border-white/20 cursor-pointer"
            >
              <Plus size={18} />
              {t.createEvent}
            </button>
          )}
        </div>
      </div>

      {/* World Map Component Section */}
      {(viewMode === 'both' || viewMode === 'map') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <MapPin size={14} className="text-[#ff4d4d]" />
              {isRu ? 'Геолокация активных узлов Хроники (AhaMap)' : 'Chronicle Active Hotspots Map'}
            </span>
          </div>

          <AhaMap
            lang={lang}
            events={events}
            lowPerfMode={lowPerfMode}
            onSelectEvent={(selectedEv) => {
              // Optionally scroll or highlight in list
            }}
          />
        </motion.div>
      )}

      {/* Chronicle Timeline Section */}
      {(viewMode === 'both' || viewMode === 'timeline') && (
        <div className="space-y-6 pt-4">
          {viewMode === 'both' && (
            <div className="flex items-center justify-between pb-2 border-b border-[#3d2b4f]/20">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Clock size={14} className="text-[#ff4d4d]" />
                {isRu ? 'Временная лента событий' : 'Chronicle Events Timeline'}
              </span>
            </div>
          )}

          {loading ? (
            <ChronicleSkeletonList count={4} />
          ) : events.length === 0 ? (
            <div className="text-center py-20 text-white/40 bg-[#15101e]/30 rounded-3xl border-2 border-dashed border-[#3d2b4f]/50">
              <Calendar size={48} className="mx-auto mb-4 text-[#3d2b4f]" />
              <p className="text-xl font-bold uppercase tracking-widest">{t.noResults}</p>
            </div>
          ) : (
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
          )}
        </div>
      )}

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
