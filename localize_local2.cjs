const fs = require('fs');

const translationsToAdd = {
  maintenanceDesc: { 
    ru: "В данный момент на сайте проводятся технические работы или закрытое бета-тестирование. Доступ разрешен только администраторам, модераторам и бета-тестерам.", 
    en: "The site is currently undergoing maintenance or closed beta testing. Access is restricted to administrators, moderators, and beta testers.", 
    by: "У дадзены момант на сайце праводзяцца тэхнічныя работы або закрытае бэта-тэставанне. Доступ дазволены толькі адміністратарам, мадэратарам і бэта-тэстарам.", 
    de: "Die Website wird derzeit gewartet oder befindet sich im geschlossenen Betatest. Der Zugriff ist auf Administratoren, Moderatoren und Betatester beschränkt.", 
    fr: "Le site est actuellement en maintenance ou en test bêta fermé. L'accès est réservé aux administrateurs, modérateurs et bêta-testeurs.", 
    zh: "该网站目前正在进行维护或封闭Beta测试。访问仅限于管理员、版主和Beta测试员。" 
  },
  maintenanceLogout: {
    ru: "Выйти",
    en: "Logout",
    by: "Выйсці",
    de: "Abmelden",
    fr: "Se déconnecter",
    zh: "登出"
  },
  maintenanceLoginAdmin: {
    ru: "Войти (для админов)",
    en: "Login (for admins)",
    by: "Увайсці (для адмінаў)",
    de: "Anmelden (für Admins)",
    fr: "Connexion (pour les admins)",
    zh: "登录（管理员）"
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
