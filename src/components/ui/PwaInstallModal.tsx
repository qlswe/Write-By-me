import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, Monitor, CheckCircle2, Share, PlusSquare, Globe, Zap, X, WifiOff } from 'lucide-react';
import { Language } from '../../data/translations';
import { usePWA } from '../../hooks/usePWA';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose, lang }) => {
  const { canInstall, isInstalled, isIOS, installPWA } = usePWA();
  const [installSuccess, setInstallSuccess] = React.useState(false);

  const loc = (ruStr: string, enStr: string, byStr: string, deStr: string, frStr: string, zhStr: string) => {
    switch (lang) {
      case 'ru': return ruStr;
      case 'by': return byStr;
      case 'de': return deStr;
      case 'fr': return frStr;
      case 'zh': return zhStr;
      default: return enStr;
    }
  };

  const handleInstallClick = async () => {
    const success = await installPWA();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
        setInstallSuccess(false);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#15101e] border border-[#3d2b4f] rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] relative space-y-6 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Glow background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#ff4d4d]/10 blur-3xl rounded-full pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#251c35] transition-colors"
          >
            <X size={20} />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-4 border-b border-[#3d2b4f]/60 pb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff4d4d] to-[#9333ea] flex items-center justify-center text-white shadow-lg shadow-[#ff4d4d]/20 shrink-0">
              <Smartphone size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                  {loc('Установка Web-App', 'Install Web-App', 'Устаноўка Web-App', 'Web-App Installation', 'Installation Web-App', '安装 Web 应用')}
                </h2>
                {isInstalled && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {loc('Установлено', 'Installed', 'Усталявана', 'Installiert', 'Installé', '已安装')}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {loc('Быстрый доступ с главного экрана и автономная работа', 'Fast home screen access & offline execution', 'Хуткі доступ з галоўнага экрана і аўтаномная праца', 'Schneller Zugriff vom Startbildschirm & Offline-Modus', 'Accès rapide depuis l\'écran d\'accueil et mode hors ligne', '快速主屏幕访问和离线运行')}
              </p>
            </div>
          </div>

          {/* Installed Success View */}
          {installSuccess || isInstalled ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-white font-bold text-base">
                {loc('Приложение установлено!', 'Application Installed!', 'Дадатак усталяваны!', 'Anwendung installiert!', 'Application installée !', '应用已安装！')}
              </h3>
              <p className="text-gray-300 text-xs">
                {loc('Министерство Ахахи теперь доступно на вашем главном экране в формате автономного Web-App.', 'Aha Ministry is now available on your home screen as a standalone Web-App.', 'Міністэрства Ахахі цяпер даступна на вашым галоўным экране ў фармаце автономнага Web-App.', 'Aha Ministry ist jetzt auf Ihrem Startbildschirm als eigenständige Web-App verfügbar.', 'Aha Ministry est maintenant disponible sur votre écran d\'accueil en tant qu\'application Web autonome.', 'Aha Ministry 现在可以作为独立 Web 应用在您的主屏幕上使用。')}
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-[#15101e] font-black text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
              >
                {loc('Отлично', 'Done', 'Выдатна', 'Fertig', 'Terminé', '完成')}
              </button>
            </div>
          ) : (
            <>
              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0b0813] border border-[#3d2b4f]/50 p-3.5 rounded-2xl flex items-start gap-3">
                  <Zap size={20} className="text-[#ff4d4d] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-bold text-xs">{loc('Мгновенный пуск', 'Instant Launch', 'Мгненны запуск', 'Sofortstart', 'Lancement instantané', '即时启动')}</h4>
                    <p className="text-gray-400 text-[10px] leading-tight mt-0.5">{loc('Без ввода URL адреса', 'No URL typing needed', 'Без уводу URL адрасы', 'Keine URL-Eingabe erforderlich', 'Pas besoin de saisir l\'URL', '无需输入 URL')}</p>
                  </div>
                </div>

                <div className="bg-[#0b0813] border border-[#3d2b4f]/50 p-3.5 rounded-2xl flex items-start gap-3">
                  <WifiOff size={20} className="text-[#00f0ff] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-bold text-xs">{loc('Офлайн Режим', 'Offline Access', 'Аўтаномны Рэжым', 'Offline-Zugriff', 'Accès hors ligne', '离线模式')}</h4>
                    <p className="text-gray-400 text-[10px] leading-tight mt-0.5">{loc('Работает без интернета', 'Works without internet', 'Працуе без інтэрнэту', 'Funktioniert ohne Internet', 'Fonctionne sans Internet', '无网络即可运行')}</p>
                  </div>
                </div>
              </div>

              {/* Action area: Direct Install vs Instructions */}
              {canInstall ? (
                <div className="space-y-3">
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-4 bg-gradient-to-r from-[#ff4d4d] to-[#a855f7] hover:from-[#ff6666] hover:to-[#b566ff] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-[#ff4d4d]/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={20} />
                    {loc('Установить в 1 клик', 'Install in 1 Click', 'Усталяваць у 1 клік', 'In 1 Klick installieren', 'Installer en 1 clic', '一键安装')}
                  </button>
                  <p className="text-[10px] text-center text-gray-500">
                    {loc('Стандартный запрос установки браузера Chrome / Edge / Opera', 'Standard Chrome / Edge / Opera PWA installation prompt', 'Стандартны запыт устаноўкі браўзера Chrome / Edge / Opera', 'Standard-Installationsaufforderung für Chrome / Edge / Opera', 'Invite d\'installation PWA standard pour Chrome / Edge / Opera', '标准的 Chrome / Edge / Opera PWA 安装提示')}
                  </p>
                </div>
              ) : isIOS ? (
                /* iOS Safari Guide */
                <div className="bg-[#0b0813] border border-[#3d2b4f]/60 rounded-2xl p-4 space-y-3">
                  <h4 className="text-[#00f0ff] font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Monitor size={16} />
                    {loc('Инструкция для iOS (Safari)', 'iOS Safari Instructions', 'Іструкцыя для iOS (Safari)', 'iOS Safari Anleitung', 'Instructions pour iOS (Safari)', 'iOS Safari 安装指南')}
                  </h4>
                  <ol className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#ff4d4d]/20 text-[#ff4d4d] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                      <span>{loc('Нажмите кнопку ', 'Tap the ', 'Націсніце кнопку ', 'Tippen Sie auf ', 'Appuyez sur ', '轻触 ')} <strong>{loc('«Поделиться»', '«Share»', '«Падзяліцца»', '«Teilen»', '«Partager»', '“分享”')}</strong> <Share size={14} className="inline text-[#00f0ff] mx-1" /> {loc('в низу экрана Safari.', 'in Safari toolbar.', 'у ніжняй частцы экрана Safari.', 'in der Safari-Leiste.', 'dans la barre Safari.', '在 Safari 底部。')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#ff4d4d]/20 text-[#ff4d4d] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                      <span>{loc('Прокрутите и выберите ', 'Scroll down and select ', 'Прагартайце і выберыце ', 'Scrollen Sie nach unten und wählen Sie ', 'Faites défiler et sélectionnez ', '向下滚动并选择 ')} <strong>{loc('«На экран «Домой»»', '«Add to Home Screen»', '«На экран «Дамой»»', '«Zum Home-Bildschirm»', '«Sur l\'écran d\'accueil»', '“添加到主屏幕”')}</strong> <PlusSquare size={14} className="inline text-emerald-400 mx-1" />.</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#ff4d4d]/20 text-[#ff4d4d] font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                      <span>{loc('Подтвердите добавление в правом верхнем углу.', 'Confirm by tapping Add.', 'Пацвердзіце даданне ў правым верхнім куце.', 'Bestätigen Sie durch Tippen auf Hinzufügen.', 'Confirmez en appuyant sur Ajouter.', '点击右顶部的添加按钮确认。')}</span>
                    </li>
                  </ol>
                </div>
              ) : (
                /* Desktop / General Browser Guide */
                <div className="bg-[#0b0813] border border-[#3d2b4f]/60 rounded-2xl p-4 space-y-3">
                  <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Globe size={16} />
                    {loc('Инструкция установки вручную', 'Manual Installation Guide', 'Іструкцыя ўстаноўкі уручную', 'Manuelle Installationsanleitung', "Guide d'installation manuelle", '手动安装指南')}
                  </h4>
                  <ol className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                      <span>{loc('Откройте меню браузера (3 точки ⋮).', 'Open browser menu (3 dots ⋮).', 'Адкрыйце меню браўзера (3 кропкі ⋮).', 'Öffnen Sie das Browser-Menü (3 Punkte ⋮).', 'Ouvrez le menu du navigateur (3 points ⋮).', '打开浏览器菜单（3个点 ⋮）。')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                      <span>{loc('Выберите «Установить приложение» или «Добавить на главный экран».', 'Select «Install app» or «Add to Home Screen».', 'Выберыце «Усталяваць дадатак» або «Дадаць на галоўны экран».', 'Wählen Sie «App installieren» или «Zum Startbildschirm hinzufügen».', "Sélectionnez «Installer l'application» ou «Ajouter à l'écran d'accueil».", '选择“安装应用”或“添加到主屏幕”。')}</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Secondary Android APK Alternative */}
              <div className="pt-2 border-t border-[#3d2b4f]/40 flex items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-white font-bold text-xs block">{loc('Альтернатива: Android APK', 'Alternative: Android APK', 'Альтэрнатыва: Android APK', 'Alternative: Android APK', 'Alternative : Android APK', '替代方案：Android APK')}</span>
                  <span className="text-gray-400 text-[10px]">{loc('Автономный установочный файл', 'Native standalone build file', 'Аўтаномны ўстановачны файл', 'Eigenständige Installationsdatei', 'Fichier d\'installation autonome', '独立安装包文件')}</span>
                </div>
                <a
                  href="https://wbm-static.my1.ru/app-debug-inst.apk"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#251c35] hover:bg-[#3d2b4f] text-gray-200 border border-[#3d2b4f] hover:border-[#ff4d4d] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Download size={14} className="text-[#ff4d4d]" />
                  <span>APK (5MB)</span>
                </a>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
