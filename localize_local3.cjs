const fs = require('fs');

const translationsToAdd = {
  maintenanceLoginGoogle: {
    ru: "Войти через Google",
    en: "Login with Google",
    by: "Увайсці праз Google",
    de: "Mit Google anmelden",
    fr: "Se connecter avec Google",
    zh: "使用Google登录"
  }
};

let tsContent = fs.readFileSync('src/data/translations.ts', 'utf8');

for (const lang of ['ru', 'en', 'by', 'de', 'fr', 'zh']) {
  let langBlock = '';
  for (const [k, v] of Object.entries(translationsToAdd)) {
    langBlock += '    ' + k + ': ' + JSON.stringify(v[lang]) + ',\\n';
  }
  
  const regex = new RegExp('(' + lang + ': \\{\\n)');
  tsContent = tsContent.replace(regex, '$1' + langBlock);
}

fs.writeFileSync('src/data/translations.ts', tsContent);
console.log('translations.ts updated!');
