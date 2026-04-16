const fs = require('fs');

const translationsToAdd = {
  forumTitle: {
    ru: "Форум Ахи",
    en: "Aha Forum",
    by: "Форум Ахі",
    de: "Aha Forum",
    fr: "Forum Aha",
    zh: "阿哈论坛"
  },
  forumCreateThread: {
    ru: "Создать тему",
    en: "Create Thread",
    by: "Стварыць тэму",
    de: "Thema erstellen",
    fr: "Créer un fil",
    zh: "创建主题"
  },
  forumSearch: {
    ru: "Поиск по форуму...",
    en: "Search forum...",
    by: "Пошук па форуму...",
    de: "Forum durchsuchen...",
    fr: "Rechercher dans le forum...",
    zh: "搜索论坛..."
  },
  forumNoThreads: {
    ru: "Темы не найдены",
    en: "No threads found",
    by: "Тэмы не знойдзены",
    de: "Keine Themen gefunden",
    fr: "Aucun fil trouvé",
    zh: "未找到主题"
  },
  forumDeleteThreadTitle: {
    ru: "Удалить тему?",
    en: "Delete thread?",
    by: "Выдаліць тэму?",
    de: "Thema löschen?",
    fr: "Supprimer le fil ?",
    zh: "删除主题？"
  },
  forumDeleteThreadMessage: {
    ru: "Вы уверены, что хотите удалить эту тему? Это действие нельзя отменить.",
    en: "Are you sure you want to delete this thread? This action cannot be undone.",
    by: "Вы ўпэўненыя, што хочаце выдаліць гэтую тэму? Гэта дзеянне нельга адмяніць.",
    de: "Sind Sie sicher, dass Sie dieses Thema löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.",
    fr: "Êtes-vous sûr de vouloir supprimer ce fil ? Cette action est irréversible.",
    zh: "您确定要删除此主题吗？此操作无法撤消。"
  },
  forumDelete: {
    ru: "Удалить",
    en: "Delete",
    by: "Выдаліць",
    de: "Löschen",
    fr: "Supprimer",
    zh: "删除"
  },
  forumDeleteCommentTitle: {
    ru: "Удалить комментарий?",
    en: "Delete comment?",
    by: "Выдаліць каментарый?",
    de: "Kommentar löschen?",
    fr: "Supprimer le commentaire ?",
    zh: "删除评论？"
  },
  forumDeleteCommentMessage: {
    ru: "Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.",
    en: "Are you sure you want to delete this comment? This action cannot be undone.",
    by: "Вы ўпэўненыя, што хочаце выдаліць гэты каментарый? Гэта дзеянне нельга адмяніць.",
    de: "Sind Sie sicher, dass Sie diesen Kommentar löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.",
    fr: "Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.",
    zh: "您确定要删除此评论吗？此操作无法撤消。"
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
