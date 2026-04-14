import React from 'react';
import { translations, Language } from '../../data/translations';
import { GitCommit, Star, Bug, Zap } from 'lucide-react';

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
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-[#ff4d4d]/10 text-[#ff4d4d]">
          <GitCommit size={24} />
        </div>
        <h3 className="text-2xl font-bold text-[#ff4d4d]">{t.changelogTitle}</h3>
      </div>

      <div className="space-y-8">
        {data.map((entry, index) => (
          <div key={index} className="relative pl-6 border-l-2 border-[#3d2b4f]/30">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#251c35] border-2 border-[#ff4d4d]" />
            
            <div className="flex flex-wrap items-baseline gap-3 mb-4">
              <h4 className="text-lg font-bold text-white">{t.changelogVersion} {entry.version}</h4>
              <span className="text-sm text-gray-400">{entry.date}</span>
            </div>

            <div className="space-y-4">
              {entry.newFeatures && entry.newFeatures.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-2 text-sm font-bold text-green-400 mb-2 uppercase tracking-wider">
                    <Star size={14} />
                    {t.changelogNew}
                  </h5>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 ml-1">
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
                    {t.changelogFixes}
                  </h5>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 ml-1">
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
                    {t.changelogImprovements}
                  </h5>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 ml-1">
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
