import React from 'react';
import { translations, Language } from '../../data/translations';
import { GitCommit, Star, Bug, Zap, FileText, Download } from 'lucide-react';
import { generatePatchNotesPDF } from '../../utils/pdfPatchNotes';

interface ChangelogProps {
  lang: Language;
}

interface ChangelogEntry {
  version: string;
  date: string;
  newFeatures?: string[];
  fixes?: string[];
  improvements?: string[];
}

// Localized changelog data
const getChangelogData = (lang: Language): ChangelogEntry[] => {
  const t = translations[lang];
  return [
    {
      version: "2.5.0",
      date: "2026-07-29",
      newFeatures: [
        lang === 'ru' ? "Вкладка 'Стримы' (Live Streams) в панели навигации для просмотра и проведения трансляций" :
        lang === 'en' ? "Added 'Streams' (Live Streams) tab to navigation bar" :
        lang === 'by' ? "Укладка 'Стрымы' (Live Streams) у панэлі навігацыі для прагляду і правядзення трансляцый" :
        lang === 'de' ? "'Streams' (Live Streams) Tab zur Navigationsleiste hinzugefügt" :
        lang === 'fr' ? "Onglet 'Streams' (Directs) ajouté à la barre de navigation" :
        "导航栏添加了“直播”选项卡",

        lang === 'ru' ? "Возможность планировать трансляции с отсчетом времени и интерактивным чатом" :
        lang === 'en' ? "Ability to schedule streams with countdown timer and live chat" :
        lang === 'by' ? "Мажлівасць планаваць трансляцыі з адлікам часу і інтэрактыўным чатам" :
        lang === 'de' ? "Möglichkeit, Streams mit Countdown und Live-Chat zu planen" :
        lang === 'fr' ? "Possibilité de planifier des streams avec compte à rebours et chat en direct" :
        "可通过倒计时和实时聊天安排直播",

        lang === 'ru' ? "Автоматическая замена всех <video> тегов в постах и форуме на кастомный Kuru Video Player" :
        lang === 'en' ? "Automatic replacement of raw <video> tags in articles & forum threads with custom Kuru Video Player" :
        lang === 'by' ? "Аўтаматычная замена ўсіх <video> тэгаў у пастах і форуме на кастамны Kuru Video Player" :
        lang === 'de' ? "Automatisches Ersetzen aller <video>-Tags durch den benutzerdefinierten Kuru Video Player" :
        lang === 'fr' ? "Remplacement automatique des balises <video> par le lecteur vidéo Kuru personnalisé" :
        "将文章和论坛中的所有 <video> 标签自动替换为自定义 Kuru 视频播放器",

        lang === 'ru' ? "Генерация и скачивание официального Patch Notes в формате PDF" :
        lang === 'en' ? "PDF Patch Notes generator with line addition metrics" :
        lang === 'by' ? "Генерацыя і спампоўванне афіцыйнага Patch Notes у фармаце PDF" :
        lang === 'de' ? "PDF-Patch-Notes-Generator mit Zeilenzählmetriken" :
        lang === 'fr' ? "Générateur de notes de patch PDF avec métriques de lignes" :
        "带行数指标的 PDF 更新说明生成器"
      ],
      improvements: [
        lang === 'ru' ? "Добавлено +1,680 строк кода TypeScript и компонентов" :
        lang === 'en' ? "Added +1,680 lines of TypeScript code and components" :
        lang === 'by' ? "Дададзена +1,680 радкоў кода TypeScript і кампанентаў" :
        lang === 'de' ? "+1.680 Zeilen TypeScript-Code und Komponenten hinzugefügt" :
        lang === 'fr' ? "Ajout de +1 680 lignes de code et composants TypeScript" :
        "添加了 +1,680 行 TypeScript 代码和组件",

        lang === 'ru' ? "Оптимизирована синхронизация видео и автоматический прокси-сервер CORS" :
        lang === 'en' ? "Optimized video playback sync and CORS proxying fallback" :
        lang === 'by' ? "Аптымізавана сінхранізацыя відэа і аўтаматычны проксі-сервер CORS" :
        lang === 'de' ? "Optimierte Videowiedergabesynchronisation und CORS-Proxy-Fallback" :
        lang === 'fr' ? "Optimisation de la synchro vidéo et du serveur proxy CORS" :
        "优化了视频播放同步和 CORS 代理后备方案"
      ]
    },
    {
      version: "1.3.0",
      date: "2026-04-12",
      newFeatures: [
        lang === 'ru' ? "Добавлен раздел истории изменений (Changelog) на главную страницу" :
        lang === 'en' ? "Added Changelog section to the home page" :
        lang === 'by' ? "Дададзены раздзел гісторыі змен (Changelog) на галоўную старонку" :
        lang === 'de' ? "Changelog-Bereich zur Startseite hinzugefügt" :
        lang === 'fr' ? "Ajout de la section Changelog sur la page d'accueil" :
        "在主页添加了更新日志部分",
        
        lang === 'ru' ? "Полная локализация всех новых ресурсов на 6 языков" :
        lang === 'en' ? "Full localization of all new resources into 6 languages" :
        lang === 'by' ? "Поўная лакалізацыя ўсіх новых рэсурсаў на 6 моў" :
        lang === 'de' ? "Vollständige Lokalisierung aller neuen Ressourcen in 6 Sprachen" :
        lang === 'fr' ? "Localisation complète de toutes les nouvelles ressources en 6 langues" :
        "所有新资源完全本地化为6种语言"
      ],
      fixes: [
        lang === 'ru' ? "Исправлено отображение статуса 'В сети' для пользователей" :
        lang === 'en' ? "Fixed 'Online' status display for users" :
        lang === 'by' ? "Выпраўлена адлюстраванне статусу 'У сетцы' для карыстальнікаў" :
        lang === 'de' ? "Anzeige des 'Online'-Status für Benutzer behoben" :
        lang === 'fr' ? "Correction de l'affichage du statut 'En ligne' pour les utilisateurs" :
        "修复了用户的“在线”状态显示",
        
        lang === 'ru' ? "Убрана возможность голосовать за сообщения Aha Bot" :
        lang === 'en' ? "Removed ability to vote on Aha Bot messages" :
        lang === 'by' ? "Прыбрана магчымасць галасаваць за паведамленні Aha Bot" :
        lang === 'de' ? "Möglichkeit zur Abstimmung über Aha Bot-Nachrichten entfernt" :
        lang === 'fr' ? "Suppression de la possibilité de voter sur les messages de Aha Bot" :
        "移除了对Aha Bot消息投票的功能"
      ]
    },
    {
      version: "1.2.4",
      date: "2026-04-11",
      improvements: [
        lang === 'ru' ? "Оптимизация производительности для мобильных устройств" :
        lang === 'en' ? "Performance optimization for mobile devices" :
        lang === 'by' ? "Аптымізацыя прадукцыйнасці для мабільных прылад" :
        lang === 'de' ? "Leistungsoptimierung für mobile Geräte" :
        lang === 'fr' ? "Optimisation des performances pour les appareils mobiles" :
        "移动设备的性能优化",
        
        lang === 'ru' ? "Улучшен алгоритм шифрования Aha radio E/D" :
        lang === 'en' ? "Improved Aha radio E/D encryption algorithm" :
        lang === 'by' ? "Палепшаны алгарытм шыфравання Aha radio E/D" :
        lang === 'de' ? "Verbesserter Aha-Radio-E/D-Verschlüsselungsalgorithmus" :
        lang === 'fr' ? "Amélioration de l'algorithme de chiffrement Aha radio E/D" :
        "改进了Aha radio E/D加密算法"
      ]
    }
  ];
};

export const Changelog: React.FC<ChangelogProps> = ({ lang }) => {
  const t = translations[lang];
  const data = getChangelogData(lang);

  return (
    <div className="mt-8 p-6 rounded-2xl bg-[#15101e]/50 border border-[#3d2b4f]/50">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#ff4d4d]/10 text-[#ff4d4d]">
            <GitCommit size={24} />
          </div>
          <h3 className="text-2xl font-bold text-[#ff4d4d]">{(t as any).changelogTitle || "Changelog"}</h3>
        </div>

        <button
          onClick={generatePatchNotesPDF}
          className="flex items-center gap-2 bg-[#ff4d4d] hover:bg-white text-[#15101e] px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,77,77,0.3)] cursor-pointer"
        >
          <FileText size={16} />
          {lang === 'ru' ? 'Скачать Patch Notes (PDF)' : 'Download Patch Notes (PDF)'}
        </button>
      </div>

      <div className="space-y-8">
        {data.map((entry, index) => (
          <div key={index} className="relative pl-6 border-l-2 border-[#3d2b4f]/30">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#251c35] border-2 border-[#ff4d4d]" />
            
            <div className="flex flex-wrap items-baseline gap-3 mb-4">
              <h4 className="text-lg font-bold text-white">{(t as any).changelogVersion || "Version"} {entry.version}</h4>
              <span className="text-sm text-white/60">{entry.date}</span>
            </div>

            <div className="space-y-4">
              {entry.newFeatures && entry.newFeatures.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-2 text-sm font-bold text-green-400 mb-2 uppercase tracking-wider">
                    <Star size={14} />
                    {(t as any).changelogNew || "New"}
                  </h5>
                  <ul className="list-disc list-inside text-sm text-white/80 space-y-1 ml-1">
                    {entry.newFeatures.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.fixes && entry.fixes.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-2 text-sm font-bold text-red-400 mb-2 uppercase tracking-wider">
                    <Bug size={14} />
                    {(t as any).changelogFixes || "Fixes"}
                  </h5>
                  <ul className="list-disc list-inside text-sm text-white/80 space-y-1 ml-1">
                    {entry.fixes.map((fix, i) => (
                      <li key={i}>{fix}</li>
                    ))}
                  </ul>
                </div>
              )}

              {entry.improvements && entry.improvements.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-2 text-sm font-bold text-blue-400 mb-2 uppercase tracking-wider">
                    <Zap size={14} />
                    {(t as any).changelogImprovements || "Improvements"}
                  </h5>
                  <ul className="list-disc list-inside text-sm text-white/80 space-y-1 ml-1">
                    {entry.improvements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
