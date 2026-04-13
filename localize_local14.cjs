const fs = require('fs');

const translationsToAdd = {
  chatToday: {
    ru: "Сегодня",
    en: "Today",
    by: "Сёння",
    de: "Heute",
    fr: "Aujourd'hui",
    zh: "今天"
  },
  chatYesterday: {
    ru: "Вчера",
    en: "Yesterday",
    by: "Учора",
    de: "Gestern",
    fr: "Hier",
    zh: "昨天"
  },
  chatFileTooLarge: {
    ru: "Файл слишком большой. Максимум 5MB.",
    en: "File too large. Maximum 5MB.",
    by: "Файл занадта вялікі. Максімум 5MB.",
    de: "Datei zu groß. Maximal 5MB.",
    fr: "Fichier trop volumineux. Maximum 5 Mo.",
    zh: "文件太大。最大 5MB。"
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
