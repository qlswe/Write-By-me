import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { Language, translations } from '../../data/translations';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { Plus, Trash2, Edit2, X, Check, Gift, Calendar, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PromoCode {
  id: string;
  code: string;
  reward: string;
  description: string;
  expiresAt?: string;
  isActive: boolean;
}

interface PromoEditorProps {
  lang: Language;
  role?: string;
  onClose: () => void;
  initialPromo?: PromoCode | null;
}

export const PromoEditor: React.FC<PromoEditorProps> = ({ lang, role, onClose, initialPromo }) => {
  const { user, loginWithGoogle } = useAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isAdding, setIsAdding] = useState(!!initialPromo);
  const [editingId, setEditingId] = useState<string | null>(initialPromo?.id || null);
  const [formData, setFormData] = useState({
    code: initialPromo?.code || '',
    reward: initialPromo?.reward || '',
    description: initialPromo?.description || '',
    expiresAt: initialPromo?.expiresAt || '',
    isActive: initialPromo?.isActive ?? true
  });
  const t = translations[lang];

  const isAdmin = role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'promo_codes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PromoCode[];
      setPromoCodes(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'promo_codes');
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !formData.code || !formData.reward) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'promo_codes', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'promo_codes'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
      }
      setFormData({
        code: '',
        reward: '',
        description: '',
        expiresAt: '',
        isActive: true
      });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'promo_codes');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    try {
      await deleteDoc(doc(db, 'promo_codes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `promo_codes/${id}`);
    }
  };

  const startEdit = (promo: PromoCode) => {
    setEditingId(promo.id);
    setFormData({
      code: promo.code,
      reward: promo.reward,
      description: promo.description,
      expiresAt: promo.expiresAt || '',
      isActive: promo.isActive
    });
    setIsAdding(true);
  };

  if (!isAdmin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#2F244F]/90 backdrop-blur-2xl rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden border border-[#5C4B8B]/30 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#3E3160]/50 p-8 border-b border-[#5C4B8B]/30 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C3A6E6]/10 flex items-center justify-center border border-[#C3A6E6]/20">
              <Tag className="text-[#C3A6E6]" size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                {t.promoEditorTitle}
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t.promoProtocol}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 max-w-[50%] sm:max-w-none">
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 sm:gap-3 bg-[#C3A6E6] text-[#2F244F] px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-black uppercase tracking-widest text-[8px] sm:text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(195,166,230,0.3)] border border-white/20 shrink-0"
              >
                <Plus size={16} />
                {t.addPromoBtn}
              </button>
            )}
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-90 shrink-0"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <AnimatePresence>
            {isAdding && (
              <motion.form
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                onSubmit={handleSubmit}
                className="bg-[#1A1528]/50 rounded-[2.5rem] p-8 border border-[#C3A6E6]/30 mb-12 space-y-8 shadow-2xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">{t.promoCodeLabel}</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full bg-[#2F244F]/50 border border-[#5C4B8B]/30 rounded-2xl px-6 py-4 text-white font-black tracking-widest focus:outline-none focus:border-[#C3A6E6] transition-all placeholder:text-gray-700"
                      placeholder="HSR2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">{t.rewardLabel}</label>
                    <input
                      type="text"
                      value={formData.reward}
                      onChange={e => setFormData({ ...formData, reward: e.target.value })}
                      className="w-full bg-[#2F244F]/50 border border-[#5C4B8B]/30 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-[#C3A6E6] transition-all placeholder:text-gray-700"
                      placeholder="60 Stellar Jades"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">{t.descriptionLabel}</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#2F244F]/50 border border-[#5C4B8B]/30 rounded-3xl px-6 py-4 text-white font-medium focus:outline-none focus:border-[#C3A6E6] transition-all resize-none h-24 placeholder:text-gray-700"
                    placeholder="Special reward for Ministry members..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">{t.expirationLabel}</label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="w-full bg-[#2F244F]/50 border border-[#5C4B8B]/30 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-[#C3A6E6] transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-8 ml-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? 'bg-[#C3A6E6]' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isActive ? 'left-7' : 'left-1'}`} />
                    </button>
                    <label className="text-xs font-black text-gray-300 uppercase tracking-widest cursor-pointer">{t.isActiveLabel}</label>
                  </div>
                </div>

                <div className="flex justify-end gap-6 pt-4">
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                    className="text-xs font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="bg-[#C3A6E6] text-[#2F244F] px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(195,166,230,0.3)] border border-white/20"
                  >
                    {editingId ? t.updatePromoBtn : t.addPromoBtn}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-6">
            {promoCodes.map(promo => (
              <motion.div
                layout
                key={promo.id}
                className={`bg-[#1A1528]/40 rounded-[2rem] p-6 border transition-all group ${
                  promo.isActive ? 'border-[#5C4B8B]/20 hover:border-[#C3A6E6]/40' : 'border-red-500/20 opacity-60'
                } flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${
                    promo.isActive 
                      ? 'bg-[#C3A6E6]/5 border-[#C3A6E6]/20 text-[#C3A6E6] group-hover:bg-[#C3A6E6]/10' 
                      : 'bg-gray-500/5 border-gray-500/20 text-gray-500'
                  }`}>
                    <Gift size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-black text-xl text-white tracking-widest uppercase italic">{promo.code}</span>
                      {!promo.isActive && (
                        <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase font-black tracking-tighter">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-[#C3A6E6] font-bold">{promo.reward}</p>
                    {promo.expiresAt && (
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                        <Calendar size={12} />
                        {t.expirationLabel}: {new Date(promo.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <button
                    onClick={() => startEdit(promo)}
                    className="p-2.5 rounded-xl bg-[#5C4B8B]/30 text-gray-400 hover:text-[#C3A6E6] hover:bg-[#C3A6E6]/10 transition-all border border-transparent hover:border-[#C3A6E6]/20"
                    title={t.editBtn}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id)}
                    className="p-2.5 rounded-xl bg-[#5C4B8B]/30 text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-500/20"
                    title={t.delete}
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => {
                      const text = `${promo.code} - ${promo.reward}\n${promo.description}`;
                      navigator.clipboard.writeText(text);
                    }}
                    className="p-2.5 rounded-xl bg-[#5C4B8B]/30 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all border border-transparent hover:border-blue-400/20"
                    title={t.share}
                  >
                    <Plus size={18} className="rotate-45" />
                  </button>
                  <div className="p-2.5 rounded-xl bg-[#5C4B8B]/10 text-gray-600 flex items-center justify-center border border-transparent">
                    <Tag size={18} />
                  </div>
                </div>
              </motion.div>
            ))}
            {promoCodes.length === 0 && (
              <div className="text-center py-20 bg-[#1A1528]/20 rounded-[2.5rem] border border-[#5C4B8B]/10">
                <Tag className="mx-auto mb-4 text-gray-700" size={48} />
                <p className="text-sm font-black uppercase tracking-widest text-gray-600">{t.noResults}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
