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
  const [isHovered, setIsHovered] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const onCopyClick = () => {
    handleCopy(promo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group relative bg-gradient-to-br from-[#2a1f3d] to-[#1c1528] p-8 rounded-[2rem] shadow-2xl border transition-all duration-300 overflow-hidden ${
        promo.isActive === false ? 'border-red-500/20 opacity-60 grayscale-[0.3]' : 'border-[#3d2b4f] hover:border-[#ff4d4d]'
      }`}
    >
      {/* Decorative MD3 Ripple Background elements */}
      <motion.div 
        animate={{ 
          scale: isHovered ? [1, 1.2, 1.1] : 1,
          opacity: isHovered ? 0.8 : 0.5
        }}
        transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, repeatType: 'reverse' }}
        className="absolute -top-16 -right-16 w-64 h-64 bg-[#ff4d4d]/10 rounded-full blur-[60px]" 
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 relative z-10">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#15101e]/60 border border-[#3d2b4f]/50 text-[10px] font-mono text-[#ff4d4d] uppercase tracking-[0.2em] font-black"
          >
            <Ticket size={12} />
            {t.activationCode}
          </motion.div>
          <div className="flex items-center gap-3">
            <code className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,77,77,0.4)] break-all relative group-hover:text-[#ff4d4d] transition-colors">
              {promo.code}
            </code>
          </div>
        </div>
        
        <div className="flex items-center gap-4 shrink-0 mt-4 sm:mt-0">
          {isAdmin ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <button 
                onClick={() => onEdit?.(promo)}
                className="p-3 rounded-2xl bg-black/40 text-gray-400 hover:text-white hover:bg-[#3d2b4f] transition-all border border-white/5 hover:border-white/20 hover:scale-110 active:scale-95 shadow-lg"
                title={t.editBtn}
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(promo.id); }}
                className="p-3 rounded-2xl bg-black/40 text-gray-400 hover:text-red-400 hover:bg-red-400/20 transition-all border border-white/5 hover:border-red-400/30 hover:scale-110 active:scale-95 shadow-lg"
                title={t.deleteBtn}
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={onCopyClick}
                className="p-3 rounded-2xl bg-[#ff4d4d] text-[#15101e] hover:bg-white hover:text-[#15101e] transition-all border border-white/20 hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(255,77,77,0.3)]"
                title={t.copyCode}
              >
                <Copy size={18} />
              </button>
            </motion.div>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCopyClick}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 border shadow-2xl shrink-0 ${
                copied 
                  ? 'bg-green-500 text-[#15101e] border-white' 
                  : 'bg-[#ff4d4d] text-[#15101e] border-white/20 hover:bg-white hover:text-[#15101e]'
              }`}
              title={t.copyToClipboard}
            >
              <Copy size={20} />
              <span className="text-sm font-black uppercase tracking-widest leading-none">
                {copied ? 'Скопировано! / Copied!' : t.copyToClipboard}
              </span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="space-y-4 relative z-10 mb-8">
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] font-black">{t.rewards}</div>
        <div className="flex flex-wrap gap-3">
          {(typeof promo.rewards === 'string' ? promo.rewards : (promo.rewards?.[lang] || promo.rewards?.['en'] || '')).split(',').map((reward: string, i: number) => (
            <motion.span 
              key={i} 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + i * 0.1, type: "spring" }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="px-5 py-3 bg-[#15101e]/80 rounded-2xl text-sm font-black text-white/90 border border-t-white/10 border-[#3d2b4f] hover:border-[#ff4d4d] shadow-lg transition-colors cursor-default"
            >
              {reward.trim()}
            </motion.span>
          ))}
        </div>
        
        {promo.description && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="text-white/60 text-sm mt-4 italic font-medium"
           >
             {promo.description}
           </motion.div>
        )}
      </div>

      {/* Status Footer */}
      <div className="mt-8 pt-6 border-t border-[#3d2b4f]/50 flex justify-between items-center relative z-10 bg-[#15101e]/30 -mx-8 -mb-8 px-8 pb-8 rounded-b-[2rem]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-4 h-4">
            <div className={`absolute w-3 h-3 rounded-full ${promo.isActive === false ? 'bg-red-500' : 'bg-green-500'}`} />
            {promo.isActive !== false && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50" />}
          </div>
          <span className={`text-xs font-black uppercase tracking-[0.2em] ${promo.isActive === false ? 'text-red-500' : 'text-green-500'}`}>
            {promo.isActive === false ? t.statusInactive : t.statusActive}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest bg-black/40 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
          <span className="w-1.5 h-1.5 bg-[#ff4d4d] rounded-full" />
          {t.verified} ★
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
          <h2 className="text-4xl md:text-5xl lg:text-5xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
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
