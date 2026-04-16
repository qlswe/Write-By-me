const fs = require('fs');

const translationsToAdd = {
  sdkMinistryPanel: {
    ru: "Панель Министерства",
    en: "Ministry Panel",
    by: "Панэль Міністэрства",
    de: "Ministeriumspanel",
    fr: "Panneau du Ministère",
    zh: "部委面板"
  },
  sdkAhaRadio: {
    ru: "Радиостанция Ахи",
    en: "Aha Radio Station",
    by: "Радыёстанцыя Ахі",
    de: "Aha Radiostation",
    fr: "Station de radio Aha",
    zh: "阿哈广播电台"
  },
  sdkAIAssistant: {
    ru: "ИИ Ассистент",
    en: "AI Assistant",
    by: "ШІ Асістэнт",
    de: "KI-Assistent",
    fr: "Assistant IA",
    zh: "AI 助手"
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
