const fs = require('fs');

const translationsToAdd = {
  forumModerationRejectedPost: {
    ru: "Ваш пост был отклонен автоматической модерацией.",
    en: "Your post was rejected by automatic moderation.",
    by: "Ваш пост быў адхілены аўтаматычнай мадэрацыяй.",
    de: "Ihr Beitrag wurde von der automatischen Moderation abgelehnt.",
    fr: "Votre message a été rejeté par la modération automatique.",
    zh: "您的帖子被自动审核拒绝。"
  },
  forumModerationRejectedComment: {
    ru: "Ваш комментарий был отклонен автоматической модерацией.",
    en: "Your comment was rejected by automatic moderation.",
    by: "Ваш каментарый быў адхілены аўтаматычнай мадэрацыяй.",
    de: "Ihr Kommentar wurde von der automatischen Moderation abgelehnt.",
    fr: "Votre commentaire a été rejeté par la modération automatique.",
    zh: "您的评论被自动审核拒绝。"
  },
  forumBotWelcome: {
    ru: "Добро пожаловать в обсуждение! Пожалуйста, соблюдайте правила: уважайте других участников, не используйте ненормативную лексику и не публикуйте запрещенный контент. Нарушители будут заблокированы.",
    en: "Welcome to the discussion! Please follow the rules: respect other members, do not use profanity, and do not post illegal content. Violators will be banned.",
    by: "Сардэчна запрашаем у абмеркаванне! Калі ласка, выконвайце правілы: паважайце іншых удзельнікаў, не выкарыстоўвайце ненарматыўную лексіку і не публікуйце забаронены кантэнт. Парушальнікі будуць заблакаваныя.",
    de: "Willkommen in der Diskussion! Bitte beachten Sie die Regeln: Respektieren Sie andere Mitglieder, verwenden Sie keine Obszönitäten und posten Sie keine illegalen Inhalte. Zuwiderhandelnde werden gesperrt.",
    fr: "Bienvenue dans la discussion ! Veuillez respecter les règles : respectez les autres membres, n'utilisez pas de grossièretés et ne publiez pas de contenu illégal. Les contrevenants seront bannis.",
    zh: "欢迎参与讨论！请遵守规则：尊重其他成员，不要使用脏话，不要发布非法内容。违规者将被封禁。"
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
