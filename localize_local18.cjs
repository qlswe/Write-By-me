const fs = require('fs');

const translationsToAdd = {
  chatLater: {
    ru: "Позже",
    en: "Later",
    by: "Пазней",
    de: "Später",
    fr: "Plus tard",
    zh: "稍后"
  },
  chatEnable: {
    ru: "Включить",
    en: "Enable",
    by: "Уключыць",
    de: "Aktivieren",
    fr: "Activer",
    zh: "启用"
  },
  chatSearchChats: {
    ru: "Поиск чатов...",
    en: "Search chats...",
    by: "Пошук чатаў...",
    de: "Chats durchsuchen...",
    fr: "Rechercher des discussions...",
    zh: "搜索聊天..."
  },
  chatNoChatsFound: {
    ru: "Ничего не найдено",
    en: "No chats found",
    by: "Нічога не знойдзена",
    de: "Keine Chats gefunden",
    fr: "Aucune discussion trouvée",
    zh: "未找到聊天"
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
