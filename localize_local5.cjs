const fs = require('fs');

const translationsToAdd = {
  fortuneTitle: {
    ru: "Астральное предсказание",
    en: "Astral Prediction",
    by: "Астральнае прадказанне",
    de: "Astrale Vorhersage",
    fr: "Prédiction astrale",
    zh: "星体预测"
  },
  fortuneReveal: {
    ru: "Узнать судьбу",
    en: "Reveal Fate",
    by: "Даведацца лёс",
    de: "Schicksal enthüllen",
    fr: "Révéler le destin",
    zh: "揭示命运"
  },
  fortuneReading: {
    ru: "ЧТЕНИЕ ЗВЕЗД...",
    en: "READING STARS...",
    by: "ЧЫТАННЕ ЗОРАК...",
    de: "STERNE LESEN...",
    fr: "LECTURE DES ÉTOILES...",
    zh: "读取星星..."
  }
};

let tsContent = fs.readFileSync('src/data/translations.ts', 'utf8');

for (const lang of ['ru', 'en', 'by', 'de', 'fr', 'zh']) {
  let langBlock = '';
  for (const [k, v] of Object.entries(translationsToAdd)) {
    // Check if key already exists to avoid duplicates
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
