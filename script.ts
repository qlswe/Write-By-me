import fs from 'fs';

const filePath = './src/data/translations.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const baseTranslations = {
  ru: {
    canvasCustomColor: "Свой цвет"
  },
  en: {
    canvasCustomColor: "Custom Color"
  },
  by: {
    canvasCustomColor: "Свой колер"
  },
  de: {
    canvasCustomColor: "Eigene Farbe"
  },
  fr: {
    canvasCustomColor: "Couleur Perso"
  },
  zh: {
    canvasCustomColor: "自定义颜色"
  }
};

for (const [lang, translationsObj] of Object.entries(baseTranslations)) {
  const regex = new RegExp(`(\\b${lang}:\\s*\\{[\\s\\S]*?)(canvasEraser:)(.*?)(,|\\n)`, 'g');
  
  let formattedNewKeys = '';
  for (const [key, val] of Object.entries(translationsObj)) {
    formattedNewKeys += `\n    ${key}: "${val}",`;
  }
  
  content = content.replace(regex, `$1$2$3,$4${formattedNewKeys}`);
}

// Fix trailing commas just in case
content = content.replace(/\",,/g, '",');
content = content.replace(/\",\n\n/g, '",\n');

fs.writeFileSync(filePath, content);
console.log('Done mapping canvas custom color translations.');
