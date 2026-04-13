const fs = require('fs');

const translationsToAdd = {
  headerProfileSettings: {
    ru: "Настройки профиля",
    en: "Profile Settings",
    by: "Налады профілю",
    de: "Profileinstellungen",
    fr: "Paramètres du profil",
    zh: "个人资料设置"
  },
  headerLoginEmail: {
    ru: "Вход через почту",
    en: "Login with Email",
    by: "Уваход праз пошту",
    de: "Mit E-Mail anmelden",
    fr: "Connexion avec e-mail",
    zh: "使用电子邮件登录"
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
