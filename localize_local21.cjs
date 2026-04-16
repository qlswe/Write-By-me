const fs = require('fs');

const translationsToAdd = {
  sdkAhaRadioAI: {
    ru: "Радиостанция Ахи ИИ v2.0",
    en: "Aha Radio Station AI v2.0",
    by: "Радыёстанцыя Ахі ШІ v2.0",
    de: "Aha Radiostation KI v2.0",
    fr: "Station de radio Aha IA v2.0",
    zh: "阿哈广播电台 AI v2.0"
  },
  sdkAskMe: {
    ru: "Спросите меня о лоре HSR или используйте команды SDK (начните с /).",
    en: "Ask me about HSR lore or use SDK commands (start with /).",
    by: "Спытайце мяне пра лор HSR або выкарыстоўвайце каманды SDK (пачніце з /).",
    de: "Fragen Sie mich nach HSR-Lore oder verwenden Sie SDK-Befehle (beginnen Sie mit /).",
    fr: "Interrogez-moi sur le lore de HSR ou utilisez les commandes SDK (commencez par /).",
    zh: "问我关于 HSR 传说的问题或使用 SDK 命令（以 / 开头）。"
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
