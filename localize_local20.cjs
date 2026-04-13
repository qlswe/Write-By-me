const fs = require('fs');

const translationsToAdd = {
  roleBetaTester: {
    ru: "Бета-тестер",
    en: "Beta Tester",
    by: "Бэта-тэстар",
    de: "Beta-Tester",
    fr: "Bêta-testeur",
    zh: "测试人员"
  },
  adminProfile: {
    ru: "Профиль",
    en: "Profile",
    by: "Профіль",
    de: "Profil",
    fr: "Profil",
    zh: "个人资料"
  },
  adminMaintenanceMode: {
    ru: "Режим обслуживания",
    en: "Maintenance Mode",
    by: "Рэжым абслугоўвання",
    de: "Wartungsmodus",
    fr: "Mode de maintenance",
    zh: "维护模式"
  },
  adminMaintenanceDesc: {
    ru: "Закрыть сайт для обычных пользователей",
    en: "Close site for regular users",
    by: "Закрыць сайт для звычайных карыстальнікаў",
    de: "Website für normale Benutzer schließen",
    fr: "Fermer le site pour les utilisateurs réguliers",
    zh: "对普通用户关闭网站"
  },
  adminSearchUsers: {
    ru: "Поиск пользователей...",
    en: "Search users...",
    by: "Пошук карыстальнікаў...",
    de: "Benutzer durchsuchen...",
    fr: "Rechercher des utilisateurs...",
    zh: "搜索用户..."
  },
  adminNoUsersFound: {
    ru: "Ничего не найдено",
    en: "No users found",
    by: "Нічога не знойдзена",
    de: "Keine Benutzer gefunden",
    fr: "Aucun utilisateur trouvé",
    zh: "未找到用户"
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
