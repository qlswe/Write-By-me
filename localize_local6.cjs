const fs = require('fs');

const translationsToAdd = {
  changelogVersion: {
    ru: "Версия",
    en: "Version",
    by: "Версія",
    de: "Version",
    fr: "Version",
    zh: "版本"
  },
  changelogNew: {
    ru: "Новое",
    en: "New",
    by: "Новае",
    de: "Neu",
    fr: "Nouveau",
    zh: "新功能"
  },
  changelogFixes: {
    ru: "Исправления",
    en: "Fixes",
    by: "Выпраўленні",
    de: "Korrekturen",
    fr: "Corrections",
    zh: "修复"
  },
  changelogImprovements: {
    ru: "Улучшения",
    en: "Improvements",
    by: "Паляпшэнні",
    de: "Verbesserungen",
    fr: "Améliorations",
    zh: "改进"
  }
};

let tsContent = fs.readFileSync('src/data/translations.ts', 'utf8');

for (const lang of ['ru', 'en', 'by', 'de', 'fr', 'zh']) {
  let langBlock = '';
  for (const [k, v] of Object.entries(translationsToAdd)) {
    if (!tsContent.includes(`    ${k}:`)) {
      langBlock += '    ' + k + ': ' + JSON.stringify(v[lang]) + ',\\n';
    }
  }
  
  if (langBlock) {
    const regex = new RegExp('(' + lang + ': \\{\\n)');
    tsContent = tsContent.replace(regex, '$1' + langBlock);
  }
}

fs.writeFileSync('src/data/translations.ts', tsContent);
console.log('translations.ts updated!');
