const fs = require('fs');

const translationsToAdd = {
  radioAuthRequired: {
    ru: "Доступ к самым несмешным шуткам во вселенной возможен только после авторизации через Google.",
    en: "Access to the least funny jokes in the universe is only available after logging in with Google.",
    by: "Доступ да самых несмешных жартаў у сусвеце магчымы толькі пасля аўтарызацыі праз Google.",
    de: "Der Zugriff auf die unlustigsten Witze im Universum ist nur nach der Anmeldung mit Google möglich.",
    fr: "L'accès aux blagues les moins drôles de l'univers n'est possible qu'après s'être connecté avec Google.",
    zh: "只有通过Google登录后才能访问宇宙中最不好笑的笑话。"
  },
  radioTitle: {
    ru: "Радиостанция Ахи",
    en: "Aha Radio Station",
    by: "Радыёстанцыя Ахі",
    de: "Aha Radiosender",
    fr: "Station de radio Aha",
    zh: "阿哈广播电台"
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
