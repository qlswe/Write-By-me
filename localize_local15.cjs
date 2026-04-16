const fs = require('fs');

const translationsToAdd = {
  chatOnline: {
    ru: "В сети",
    en: "Online",
    by: "У сетцы",
    de: "Online",
    fr: "En ligne",
    zh: "在线"
  },
  chatOffline: {
    ru: "Не в сети",
    en: "Offline",
    by: "Не ў сетцы",
    de: "Offline",
    fr: "Hors ligne",
    zh: "离线"
  },
  chatAuthRequired: {
    ru: "Требуется авторизация",
    en: "Authorization Required",
    by: "Патрабуецца аўтарызацыя",
    de: "Autorisierung erforderlich",
    fr: "Autorisation requise",
    zh: "需要授权"
  },
  chatAuthDesc: {
    ru: "Войдите в систему, чтобы просматривать сообщения и общаться с другими пользователями.",
    en: "Log in to view messages and chat with other users.",
    by: "Увайдзіце ў сістэму, каб праглядаць паведамленні і размаўляць з іншымі карыстальнікамі.",
    de: "Melden Sie sich an, um Nachrichten anzuzeigen und mit anderen Benutzern zu chatten.",
    fr: "Connectez-vous pour voir les messages et discuter avec d'autres utilisateurs.",
    zh: "登录以查看消息并与其他用户聊天。"
  },
  chatStartConversation: {
    ru: "Начните общение",
    en: "Start a conversation",
    by: "Пачніце размову",
    de: "Beginnen Sie ein Gespräch",
    fr: "Commencer une conversation",
    zh: "开始对话"
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
