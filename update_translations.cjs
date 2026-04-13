const fs = require('fs');

const filePath = 'src/data/translations.ts';
let content = fs.readFileSync(filePath, 'utf8');

const additions = {
  ru: `    changelogTitle: "История изменений",
    changelogVersion: "Версия",
    changelogNew: "Новое",
    changelogFixes: "Исправления",
    changelogImprovements: "Улучшения",`,
  en: `    changelogTitle: "Changelog",
    changelogVersion: "Version",
    changelogNew: "New Features",
    changelogFixes: "Bug Fixes",
    changelogImprovements: "Improvements",`,
  by: `    changelogTitle: "Гісторыя змен",
    changelogVersion: "Версія",
    changelogNew: "Новае",
    changelogFixes: "Выпраўленні",
    changelogImprovements: "Паляпшэнні",`,
  de: `    changelogTitle: "Änderungsprotokoll",
    changelogVersion: "Version",
    changelogNew: "Neue Funktionen",
    changelogFixes: "Fehlerbehebungen",
    changelogImprovements: "Verbesserungen",`,
  fr: `    changelogTitle: "Journal des modifications",
    changelogVersion: "Version",
    changelogNew: "Nouvelles fonctionnalités",
    changelogFixes: "Corrections de bugs",
    changelogImprovements: "Améliorations",`,
  zh: `    changelogTitle: "更新日志",
    changelogVersion: "版本",
    changelogNew: "新功能",
    changelogFixes: "错误修复",
    changelogImprovements: "改进",`
};

for (const [lang, addition] of Object.entries(additions)) {
  const regex = new RegExp(\`(\s*\${lang}: \\{)\`);
  content = content.replace(regex, \`$1\\n\${addition}\`);
}

fs.writeFileSync(filePath, content);
console.log('Translations updated.');
