import React from 'react';
import { Copy, Ticket, Settings, Edit2, Trash2, Share2, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { ConfirmModal } from '../ui/ConfirmModal';

interface PromoSectionProps {
  lang: Language;
  handleCopy: (text: string) => void;
  promoCodes: any[];
  role?: string;
  onOpenEditor?: () => void;
  onEdit?: (promo: any) => void;
}

const PromoCard = React.memo(({ 
  promo, 
  index, 
  t, 
  lang,
  isAdmin, 
  handleCopy, 
  onEdit, 
  onDelete 
}: { 
  promo: any, 
  index: number, 
  t: any, 
  lang: Language,
  isAdmin: boolean, 
  handleCopy: (text: string) => void, 
  onEdit?: (promo: any) => void, 
  onDelete: (id: string) => void 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`group relative bg-[#251c35] p-8 rounded-[2rem] shadow-2xl border transition-all duration-300 overflow-hidden ${
        promo.isActive === false ? 'border-red-500/20 opacity-60' : 'border-[#3d2b4f] hover:border-[#ff4d4d]/50'
      }`}
    >
      {/* Decorative background elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ff4d4d]/5 rounded-full blur-3xl group-hover:bg-[#ff4d4d]/10 transition-all duration-500" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#3d2b4f]/10 rounded-full blur-3xl group-hover:bg-[#3d2b4f]/20 transition-all duration-500" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 relative z-10">
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] font-black">{t.activationCode}</div>
          <div className="flex items-center gap-3">
            <code className="text-2xl sm:text-3xl font-mono font-black text-[#ff4d4d] tracking-tighter drop-shadow-[0_0_100px_rgba(255,77,77,0.3)] break-all">
              {promo.code}
            </code>
          </div>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          {isAdmin ? (
            <div className="grid grid-cols-2 gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0">
              <button 
                onClick={() => onEdit?.(promo)}
                className="p-2.5 rounded-xl bg-[#15101e] text-gray-400 hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-all border border-[#3d2b4f] hover:border-[#ff4d4d]/30"
                title={t.editBtn}
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(promo.id); }}
                className="p-2.5 rounded-xl bg-[#15101e] text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all border border-[#3d2b4f] hover:border-red-400/30"
                title={t.deleteBtn}
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={() => {
                  const text = `${promo.code} - ${promo.reward}\n${promo.description}`;
                  navigator.clipboard.writeText(text);
                }}
                className="p-2.5 rounded-xl bg-[#15101e] text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all border border-[#3d2b4f] hover:border-blue-400/30"
                title={t.shareBtn}
              >
                <Share2 size={18} />
              </button>
              <button 
                onClick={() => handleCopy(promo.code)}
                className="p-2.5 rounded-xl bg-[#15101e] text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all border border-[#3d2b4f] hover:border-yellow-400/30"
                title={t.copyCode}
              >
                <Copy size={18} />
              </button>
            </div>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCopy(promo.code)}
              className="flex items-center gap-2 px-4 py-3 bg-[#15101e] hover:bg-[#ff4d4d] text-[#ff4d4d] hover:text-[#15101e] rounded-2xl transition-all duration-300 border border-[#3d2b4f] hover:border-white shadow-xl group-hover:shadow-[#ff4d4d]/20 shrink-0"
              title={t.copyToClipboard}
            >
              <Copy size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">{t.copyToClipboard}</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] font-black">{t.rewards}</div>
        <div className="flex flex-wrap gap-2">
          {(typeof promo.rewards === 'string' ? promo.rewards : (promo.rewards?.[lang] || promo.rewards?.['en'] || '')).split(',').map((reward: string, i: number) => (
            <motion.span 
              key={i} 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + i * 0.05 }}
              className="px-4 py-2 bg-[#15101e]/60 rounded-xl text-sm font-bold text-white border border-[#3d2b4f]/50 hover:border-[#ff4d4d]/30 transition-colors"
            >
              {reward.trim()}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Status Footer */}
      <div className="mt-10 pt-6 border-t border-[#3d2b4f]/30 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${promo.isActive === false ? 'bg-red-500' : 'bg-green-500'}`} />
            {promo.isActive !== false && <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75" />}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${promo.isActive === false ? 'text-red-500' : 'text-green-500'}`}>
            {promo.isActive === false ? t.statusInactive : t.statusActive}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-[#15101e]/40 px-3 py-1 rounded-full border border-[#3d2b4f]/30">
          <span className="w-1 h-1 bg-[#ff4d4d] rounded-full" />
          v2.7 {t.verified}
        </div>
      </div>
    </motion.div>
  );
});

export const PromoSection: React.FC<PromoSectionProps> = ({ lang, handleCopy, promoCodes, role, onOpenEditor, onEdit }) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('PromoSection');
  const [promoToDelete, setPromoToDelete] = React.useState<string | null>(null);
  trackRender();

  const isAdmin = role === 'admin';

  const handleDelete = async () => {
    if (!promoToDelete) return;
    try {
      await deleteDoc(doc(db, 'promo_codes', promoToDelete));
      setPromoToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `promo_codes/${promoToDelete}`);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-black text-white tracking-widest flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff4d4d]/10 flex items-center justify-center border border-[#ff4d4d]/20 shadow-[0_0_20px_rgba(255,77,77,0.1)]">
              <Ticket className="text-[#ff4d4d]" size={24} />
            </div>
            {t.navPromo}
          </h2>
          <p className="text-[#ff4d4d]/60 font-medium tracking-wide uppercase text-xs mt-2 ml-1">
            {t.promoCodesSubtitle}
          </p>
        </motion.div>

        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenEditor}
            className="flex items-center gap-3 bg-[#ff4d4d]/10 hover:bg-[#ff4d4d]/20 text-[#ff4d4d] px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-[#ff4d4d]/30 transition-all"
          >
            <Settings size={16} />
            {t.manageBtn || 'Management'}
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {promoCodes.map((promo, index) => (
          <PromoCard 
            key={promo.id || promo.code}
            promo={promo}
            index={index}
            t={t}
            lang={lang}
            isAdmin={isAdmin}
            handleCopy={handleCopy}
            onEdit={onEdit}
            onDelete={setPromoToDelete}
          />
        ))}
      </div>

      <ConfirmModal
        isOpen={!!promoToDelete}
        onClose={() => setPromoToDelete(null)}
        onConfirm={handleDelete}
        title={t.confirmDeletePromoTitle || "Delete Promo Code"}
        message={t.confirmDeletePromoMessage || "Are you sure you want to delete this promo code? This action cannot be undone."}
        confirmText={t.delete || "Delete"}
        cancelText={t.cancelBtn || "Cancel"}
        isDestructive={true}
      />
    </div>
  );
};
