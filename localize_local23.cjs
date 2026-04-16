const fs = require('fs');

const translationsToAdd = {
  sdkSettings: {
    ru: "SDK Настройки",
    en: "SDK Settings",
    by: "SDK Налады",
    de: "SDK-Einstellungen",
    fr: "Paramètres SDK",
    zh: "SDK 设置"
  },
  sdkClearHistory: {
    ru: "Очистить историю",
    en: "Clear history",
    by: "Ачысціць гісторыю",
    de: "Verlauf löschen",
    fr: "Effacer l'historique",
    zh: "清除历史记录"
  },
  sdkAuthRequired: {
    ru: "Требуется авторизация",
    en: "Authorization Required",
    by: "Патрабуецца аўтарызацыя",
    de: "Autorisierung erforderlich",
    fr: "Autorisation requise",
    zh: "需要授权"
  },
  sdkAuthDesc: {
    ru: "Использование ИИ доступно только после авторизации через Google.",
    en: "AI usage is only available after logging in with Google.",
    by: "Выкарыстанне ШІ даступна толькі пасля аўтарызацыі праз Google.",
    de: "Die KI-Nutzung ist nur nach der Anmeldung mit Google verfügbar.",
    fr: "L'utilisation de l'IA n'est disponible qu'après connexion avec Google.",
    zh: "只有在使用 Google 登录后才能使用 AI。"
  },
  sdkThinking: {
    ru: "Думает...",
    en: "Thinking...",
    by: "Думае...",
    de: "Denkt...",
    fr: "Réfléchit...",
    zh: "思考中..."
  },
  sdkAskAI: {
    ru: "Спросите ИИ (или /команда)...",
    en: "Ask AI (or /command)...",
    by: "Спытайце ШІ (або /каманда)...",
    de: "KI fragen (oder /Befehl)...",
    fr: "Demander à l'IA (ou /commande)...",
    zh: "询问 AI（或 /命令）..."
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
