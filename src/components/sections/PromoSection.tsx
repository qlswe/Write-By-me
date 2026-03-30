import React from 'react';
import { Copy, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import { promoCodesData } from '../../data/content';
import { Language, translations } from '../../data/translations';
import { usePerfLogger } from '../../utils/logger';

interface PromoSectionProps {
  lang: Language;
  handleCopy: (text: string) => void;
}

export const PromoSection: React.FC<PromoSectionProps> = ({ lang, handleCopy }) => {
  const t = translations[lang];
  const { trackRender } = usePerfLogger('PromoSection');
  trackRender();

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
            <div className="p-3 bg-[#C3A6E6]/10 rounded-2xl border border-[#C3A6E6]/20 shadow-[0_0_20px_rgba(195,166,230,0.1)]">
              <Ticket className="text-[#C3A6E6]" size={24} />
            </div>
            {t.navPromo}
          </h2>
          <p className="text-[#C3A6E6]/60 font-medium tracking-wide uppercase text-xs mt-2 ml-1">
            {t.promoCodesSubtitle}
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {promoCodesData.map((promo, index) => (
          <motion.div 
            key={promo.code}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="group relative bg-[#3E3160]/80 backdrop-blur-md p-8 rounded-[2rem] shadow-2xl border border-[#5C4B8B] hover:border-[#C3A6E6]/50 transition-all duration-300 overflow-hidden"
          >
            {/* Decorative background elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C3A6E6]/5 rounded-full blur-3xl group-hover:bg-[#C3A6E6]/10 transition-all duration-500" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#5C4B8B]/10 rounded-full blur-3xl group-hover:bg-[#5C4B8B]/20 transition-all duration-500" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 relative z-10">
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] font-black">{t.activationCode}</div>
                <div className="flex items-center gap-3">
                  <code className="text-2xl sm:text-3xl font-mono font-black text-[#C3A6E6] tracking-tighter drop-shadow-[0_0_10px_rgba(195,166,230,0.3)] break-all">
                    {promo.code}
                  </code>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCopy(promo.code)}
                className="flex items-center gap-2 px-4 py-3 bg-[#2F244F] hover:bg-[#C3A6E6] text-[#C3A6E6] hover:text-[#2F244F] rounded-2xl transition-all duration-300 border border-[#5C4B8B] hover:border-white shadow-xl group-hover:shadow-[#C3A6E6]/20 shrink-0"
                title={t.copyToClipboard}
              >
                <Copy size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">{t.copyToClipboard}</span>
              </motion.button>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] font-black">{t.rewards}</div>
              <div className="flex flex-wrap gap-2">
                {(promo.rewards[lang] || promo.rewards['en']).split(',').map((reward: string, i: number) => (
                  <motion.span 
                    key={i} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + i * 0.05 }}
                    className="px-4 py-2 bg-[#2F244F]/60 rounded-xl text-sm font-bold text-white border border-[#5C4B8B]/50 hover:border-[#C3A6E6]/30 transition-colors"
                  >
                    {reward.trim()}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Status Footer */}
            <div className="mt-10 pt-6 border-t border-[#5C4B8B]/30 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-green-500">{t.statusActive}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-[#2F244F]/40 px-3 py-1 rounded-full border border-[#5C4B8B]/30">
                <span className="w-1 h-1 bg-[#C3A6E6] rounded-full" />
                v2.7 {t.verified}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
