const fs = require('fs');

const translationsToAdd = {
  profileSave: {
    ru: "Сохранить",
    en: "Save",
    by: "Захаваць",
    de: "Speichern",
    fr: "Enregistrer",
    zh: "保存"
  },
  profileCancel: {
    ru: "Отмена",
    en: "Cancel",
    by: "Адмена",
    de: "Abbrechen",
    fr: "Annuler",
    zh: "取消"
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
