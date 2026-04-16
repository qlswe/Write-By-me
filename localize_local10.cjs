const fs = require('fs');

const translationsToAdd = {
  forumSave: {
    ru: "Сохранить",
    en: "Save",
    by: "Захаваць",
    de: "Speichern",
    fr: "Enregistrer",
    zh: "保存"
  },
  forumCancel: {
    ru: "Отмена",
    en: "Cancel",
    by: "Адмена",
    de: "Abbrechen",
    fr: "Annuler",
    zh: "取消"
  },
  forumReply: {
    ru: "Ответить",
    en: "Reply",
    by: "Адказаць",
    de: "Antworten",
    fr: "Répondre",
    zh: "回复"
  },
  forumYourReply: {
    ru: "Ваш ответ...",
    en: "Your reply...",
    by: "Ваш адказ...",
    de: "Ihre Antwort...",
    fr: "Votre réponse...",
    zh: "你的回复..."
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
