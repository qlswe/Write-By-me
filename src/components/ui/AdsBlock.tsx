import React, { useEffect, useState } from 'react';
import { useLimits } from '../../hooks/useLimits';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

declare global {
  interface Window {
    yaContextCb: any[];
    Ya: any;
    adsbygoogle: any[];
  }
}

export const AdsBlock: React.FC = () => {
  const { hasUnlimitedAccess } = useLimits();
  const [adConfig, setAdConfig] = useState<any>(null);

  useEffect(() => {
    if (hasUnlimitedAccess) return;
    
    const fetchConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists() && docSnap.data().ads) {
          setAdConfig(docSnap.data().ads);
        }
      } catch (e) {
        console.error("Ads fetch error", e);
      }
    };
    fetchConfig();
  }, [hasUnlimitedAccess]);

  useEffect(() => {
    if (!adConfig || !adConfig.enabled || hasUnlimitedAccess) return;

    if (adConfig.provider === 'yandex' && adConfig.blockId) {
      window.yaContextCb = window.yaContextCb || [];
      
      const renderYandexAd = () => {
        try {
          if (window.yaContextCb) {
            window.yaContextCb.push(() => {
              if (window.Ya && window.Ya.Context && window.Ya.Context.AdvManager) {
                window.Ya.Context.AdvManager.render({
                  renderTo: `yandex_rtb_${adConfig.blockId}`,
                  blockId: adConfig.blockId,
                });
              }
            });
          }
        } catch (e) {
          console.error("Yandex Render Error", e);
        }
      };

      if (!document.getElementById('yandex-rtb-script')) {
        const script = document.createElement('script');
        script.id = 'yandex-rtb-script';
        script.src = 'https://yandex.ru/ads/system/context.js';
        script.async = true;
        script.onload = renderYandexAd;
        document.body.appendChild(script);
      } else {
        renderYandexAd();
      }
    } else if (adConfig.provider === 'adsense' && adConfig.clientId && adConfig.slotId) {
       if (!document.getElementById(`adsense-script-${adConfig.clientId}`)) {
          const script = document.createElement('script');
          script.id = `adsense-script-${adConfig.clientId}`;
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.clientId}`;
          script.async = true;
          script.crossOrigin = "anonymous";
          document.body.appendChild(script);
       }
       
       setTimeout(() => {
         try {
           (window as any).adsbygoogle = (window as any).adsbygoogle || [];
           (window as any).adsbygoogle.push({});
         } catch (e) {
           console.error("AdSense Render Error", e);
         }
       }, 500);
    }
  }, [adConfig, hasUnlimitedAccess]);

  if (hasUnlimitedAccess) return null;

  return (
    <div className="w-full my-4 flex flex-col gap-4">
      <div className="w-full bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-purple-900/20 px-6">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Реклама / Aha Premium</span>
          <span className="text-sm text-gray-300">
            Устали от рекламы и ограничений? Снимите все лимиты на ИИ чаты, радио и треды, купив Aha Premium!
          </span>
        </div>
        <button 
          onClick={() => alert('Для покупки подписки Aha Premium, свяжитесь с создателем и переведите средства. Ваш аккаунт будет обновлен.')}
          className="shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)]"
        >
          Купить Premium
        </button>
      </div>

      {adConfig && adConfig.enabled ? (
        <div className="w-full flex justify-center items-center min-h-[90px] rounded-xl overflow-hidden bg-[#15101e]/30 border border-[#3d2b4f]/20 my-2">
          {adConfig.provider === 'yandex' ? (
            <div id={`yandex_rtb_${adConfig.blockId}`}></div>
          ) : adConfig.provider === 'adsense' ? (
            <ins 
              className="adsbygoogle"
              style={{ display: 'block', width: '100%' }}
              data-ad-client={adConfig.clientId}
              data-ad-slot={adConfig.slotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
          ) : null}
        </div>
      ) : (
        <div className="w-full h-[90px] bg-[#15101e] border border-dashed border-[#3d2b4f]/50 rounded-xl flex items-center justify-center opacity-50 my-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black text-center px-4">
            Место для рекламы<br/>(Настройте Yandex / Google AdSense в админ-панели)
          </span>
        </div>
      )}
    </div>
  );
};
