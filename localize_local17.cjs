const fs = require('fs');

const translationsToAdd = {
  chatLoginToView: {
    ru: "Войдите, чтобы просматривать сообщения",
    en: "Log in to view your chats",
    by: "Увайдзіце, каб праглядаць паведамленні",
    de: "Melden Sie sich an, um Ihre Chats anzuzeigen",
    fr: "Connectez-vous pour voir vos discussions",
    zh: "登录以查看您的聊天"
  },
  chatEnableNotifs: {
    ru: "Включить уведомления?",
    en: "Enable notifications?",
    by: "Уключыць апавяшчэнні?",
    de: "Benachrichtigungen aktivieren?",
    fr: "Activer les notifications ?",
    zh: "启用通知？"
  },
  chatEnableNotifsDesc: {
    ru: "Это нужно, чтобы вы не пропустили новые сообщения, когда сайт свернут или вы находитесь в другом разделе.",
    en: "This is needed so you don't miss new messages when the site is minimized or you are in another section.",
    by: "Гэта трэба, каб вы не прапусцілі новыя паведамленні, калі сайт згорнуты або вы знаходзіцеся ў іншым раздзеле.",
    de: "Dies ist erforderlich, damit Sie keine neuen Nachrichten verpassen, wenn die Website minimiert ist oder Sie sich in einem anderen Bereich befinden.",
    fr: "Ceci est nécessaire pour ne pas manquer de nouveaux messages lorsque le site est réduit ou que vous êtes dans une autre section.",
    zh: "这是必要的，以便当网站最小化或您在其他部分时，您不会错过新消息。"
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
