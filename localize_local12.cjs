const fs = require('fs');

const translationsToAdd = {
  forumDiscussion: {
    ru: "Обсуждение",
    en: "Discussion",
    by: "Абмеркаванне",
    de: "Diskussion",
    fr: "Discussion",
    zh: "讨论"
  },
  forumWriteComment: {
    ru: "Написать комментарий...",
    en: "Write a comment...",
    by: "Напісаць каментарый...",
    de: "Einen Kommentar schreiben...",
    fr: "Écrire un commentaire...",
    zh: "写评论..."
  },
  forumSend: {
    ru: "Отправить",
    en: "Send",
    by: "Адправіць",
    de: "Senden",
    fr: "Envoyer",
    zh: "发送"
  },
  forumLoginToComment: {
    ru: "Войдите, чтобы оставить комментарий",
    en: "Log in to leave a comment",
    by: "Увайдзіце, каб пакінуць каментарый",
    de: "Melden Sie sich an, um einen Kommentar zu hinterlassen",
    fr: "Connectez-vous pour laisser un commentaire",
    zh: "登录以发表评论"
  },
  forumNewThread: {
    ru: "Новая тема",
    en: "New Thread",
    by: "Новая тэма",
    de: "Neues Thema",
    fr: "Nouveau fil",
    zh: "新主题"
  },
  forumThreadTitle: {
    ru: "Заголовок темы",
    en: "Thread title",
    by: "Загаловак тэмы",
    de: "Thementitel",
    fr: "Titre du fil",
    zh: "主题标题"
  },
  forumMessageContent: {
    ru: "Текст сообщения...",
    en: "Message content...",
    by: "Тэкст паведамлення...",
    de: "Nachrichteninhalt...",
    fr: "Contenu du message...",
    zh: "消息内容..."
  },
  forumCreate: {
    ru: "Создать",
    en: "Create",
    by: "Стварыць",
    de: "Erstellen",
    fr: "Créer",
    zh: "创建"
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
