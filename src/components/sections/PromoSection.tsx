import React from 'react';
import { Copy } from 'lucide-react';
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
    <div>
      <h2 className="text-3xl font-bold text-[#C3A6E6] mb-8">{t.navPromo}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promoCodesData.map(promo => (
          <div key={promo.code} className="bg-[#3E3160]/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-l-4 border-l-[#C3A6E6] border-y border-r border-[#5C4B8B]">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#5C4B8B]">
              <code className="text-2xl font-mono font-bold text-[#C3A6E6]">{promo.code}</code>
              <button 
                onClick={() => handleCopy(promo.code)}
                className="p-2 hover:bg-[#5C4B8B] rounded-lg transition-colors text-gray-400"
                title={t.copyToClipboard}
              >
                <Copy size={20} />
              </button>
            </div>
            <div className="text-gray-300">
              <span className="font-bold text-white">{t.rewards}</span> {promo.rewards[lang] || promo.rewards['en']}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
