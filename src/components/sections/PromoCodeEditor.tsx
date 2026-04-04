import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';
import { translations, Language } from '../../data/translations';

interface PromoCodeEditorProps {
  promo?: any;
  onClose: () => void;
  lang: Language;
}

const LANGUAGES = ['ru', 'en', 'by', 'jp', 'de', 'fr', 'zh'];

export const PromoCodeEditor: React.FC<PromoCodeEditorProps> = ({ promo, onClose, lang }) => {
  const { user } = useAuth();
  const t = translations[lang];
  const [currentLang, setCurrentLang] = useState(lang);
  const [code, setCode] = useState(promo?.code || '');
  const [status, setStatus] = useState(promo?.status || 'active');
  const [version, setVersion] = useState(promo?.version || 'v2.7');
  
  const [rewards, setRewards] = useState<Record<string, string>>(
    typeof promo?.rewards === 'object' ? promo.rewards : LANGUAGES.reduce((acc, l) => ({ ...acc, [l]: promo?.rewards || '' }), {})
  );
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!code || !rewards[currentLang]) {
      alert(lang === 'ru' ? 'Пожалуйста, заполните все поля' : 'Please fill all fields');
      return;
    }

    setIsSaving(true);
    try {
      const promoData: any = {
        code: code.toUpperCase(),
        status,
        version,
        rewards,
        authorUid: user?.uid,
        updatedAt: new Date().toISOString()
      };

      if (promo?.id) {
        await setDoc(doc(db, 'promoCodes', promo.id), {
          ...promoData,
          createdAt: promo.createdAt || new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'promoCodes'), {
          ...promoData,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, promo?.id ? OperationType.UPDATE : OperationType.CREATE, 'promoCodes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#2F244F] rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden border border-[#3E3160] shadow-[0_0_100px_rgba(0,0,0,0.6)] flex flex-col relative"
      >
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C3A6E6]/5 rounded-full blur-[80px] -mr-32 -mt-32" />

        <div className="shrink-0 bg-[#3E3160]/50 backdrop-blur-md flex justify-between items-center p-8 border-b border-[#3E3160] relative z-10">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">{promo ? (lang === 'ru' ? 'Изменить код' : 'Edit Promo') : (lang === 'ru' ? 'Создать код' : 'Create Promo')}</h2>
            <p className="text-gray-400 text-xs mt-1 font-medium uppercase tracking-widest">{lang === 'ru' ? 'Управление промокодами' : 'Promo Management'}</p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value as Language)}
              className="bg-[#2F244F] border border-[#5C4B8B] rounded-xl px-4 py-2 text-white text-xs font-black uppercase tracking-widest focus:outline-none focus:border-[#C3A6E6] transition-colors"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <button 
              onClick={onClose} 
              className="p-2.5 bg-black/20 hover:bg-black/40 rounded-xl text-gray-400 hover:text-white transition-all border border-white/5 hover:scale-110 active:scale-95"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">{lang === 'ru' ? 'Код активации' : 'Activation Code'}</label>
              <input 
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-[#3E3160]/50 border border-[#5C4B8B]/50 rounded-2xl px-5 py-4 text-white font-black placeholder:text-gray-600 focus:outline-none focus:border-[#C3A6E6] transition-all uppercase"
                placeholder="STARRAIL2024"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">{lang === 'ru' ? 'Версия игры' : 'Game Version'}</label>
              <input 
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-[#3E3160]/50 border border-[#5C4B8B]/50 rounded-2xl px-5 py-4 text-white font-bold placeholder:text-gray-600 focus:outline-none focus:border-[#C3A6E6] transition-all"
                placeholder="v2.7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">{lang === 'ru' ? 'Статус' : 'Status'}</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#3E3160]/50 border border-[#5C4B8B]/50 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-[#C3A6E6] transition-all"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">{lang === 'ru' ? 'Награды' : 'Rewards'} ({currentLang.toUpperCase()})</label>
            <textarea 
              value={rewards[currentLang] || ''}
              onChange={(e) => setRewards(prev => ({ ...prev, [currentLang]: e.target.value }))}
              className="w-full bg-[#3E3160]/50 border border-[#5C4B8B]/50 rounded-2xl px-5 py-4 text-white font-medium placeholder:text-gray-600 focus:outline-none focus:border-[#C3A6E6] transition-all min-h-[120px] resize-none"
              placeholder="300 Stellar Jades, 50,000 Credits"
            />
            <p className="text-[10px] text-gray-500 italic ml-1">{lang === 'ru' ? 'Разделяйте награды запятыми' : 'Separate rewards with commas'}</p>
          </div>
        </div>

        <div className="shrink-0 bg-[#3E3160]/50 backdrop-blur-md flex justify-end items-center p-8 border-t border-[#3E3160] relative z-10">
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 hover:text-white transition-colors"
            >
              {t.cancel}
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-3 bg-[#C3A6E6] text-[#2F244F] px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all shadow-xl hover:shadow-[#C3A6E6]/20 disabled:opacity-50 hover:-translate-y-1 active:translate-y-0"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-[#2F244F]/30 border-t-[#2F244F] rounded-full animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {isSaving ? t.saving : t.saveBtn}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
