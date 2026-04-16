import fs from 'fs';
import path from 'path';

const translationsPath = path.join(process.cwd(), 'src/data/translations.ts');
let content = fs.readFileSync(translationsPath, 'utf8');

const newKeys = {
  edited: {
    ru: 'изменено',
    en: 'edited',
    by: 'зменена',
    de: 'bearbeitet',
    fr: 'modifié',
    zh: '已编辑'
  },
  edit: {
    ru: 'Ред.',
    en: 'Edit',
    by: 'Рэд.',
    de: 'Bearbeiten',
    fr: 'Modifier',
    zh: '编辑'
  },
  delete: {
    ru: 'Удал.',
    en: 'Delete',
    by: 'Выдал.',
    de: 'Löschen',
    fr: 'Supprimer',
    zh: '删除'
  },
  showLess: {
    ru: 'Свернуть',
    en: 'Show less',
    by: 'Згарнуць',
    de: 'Weniger anzeigen',
    fr: 'Voir moins',
    zh: '收起'
  },
  showMore: {
    ru: 'Читать далее',
    en: 'Read more',
    by: 'Чытаць далей',
    de: 'Mehr lesen',
    fr: 'Lire la suite',
    zh: '阅读更多'
  },
  reply: {
    ru: 'Ответить',
    en: 'Reply',
    by: 'Адказаць',
    de: 'Antworten',
    fr: 'Répondre',
    zh: '回复'
  },
  writeReply: {
    ru: 'Написать ответ...',
    en: 'Write a reply...',
    by: 'Напісаць адказ...',
    de: 'Eine Antwort schreiben...',
    fr: 'Écrire une réponse...',
    zh: '写回复...'
  },
  comments: {
    ru: 'Комментарии',
    en: 'Comments',
    by: 'Каментары',
    de: 'Kommentare',
    fr: 'Commentaires',
    zh: '评论'
  },
  commentLimitReached: {
    ru: 'Вы достигли лимита комментариев',
    en: 'You have reached the comment limit',
    by: 'Вы дасягнулі ліміту каментароў',
    de: 'Sie haben das Kommentar-Limit erreicht',
    fr: 'Vous avez atteint la limite de commentaires',
    zh: '您已达到评论限制'
  },
  writeComment: {
    ru: 'Написать комментарий... (Enter для отправки)',
    en: 'Write a comment... (Enter to send)',
    by: 'Напісаць каментар... (Enter для адпраўкі)',
    de: 'Einen Kommentar schreiben... (Eingabetaste zum Senden)',
    fr: 'Écrire un commentaire... (Entrée pour envoyer)',
    zh: '写评论... (按Enter发送)'
  },
  loginToComment: {
    ru: 'Войдите, чтобы оставить комментарий',
    en: 'Log in to leave a comment',
    by: 'Увайдзіце, каб пакінуць каментар',
    de: 'Melden Sie sich an, um einen Kommentar zu hinterlassen',
    fr: 'Connectez-vous pour laisser un commentaire',
    zh: '登录以发表评论'
  },
  loginWithGoogle: {
    ru: 'Войти через Google',
    en: 'Log in with Google',
    by: 'Увайсці праз Google',
    de: 'Mit Google anmelden',
    fr: 'Se connecter avec Google',
    zh: '使用Google登录'
  },
  you: {
    ru: 'Вы',
    en: 'You',
    by: 'Вы',
    de: 'Du',
    fr: 'Vous',
    zh: '你'
  },
  stickers: {
    ru: 'Стикеры',
    en: 'Stickers',
    by: 'Стыкеры',
    de: 'Sticker',
    fr: 'Autocollants',
    zh: '贴纸'
  },
  editingMessage: {
    ru: 'Редактирование сообщения',
    en: 'Editing message',
    by: 'Рэдагаванне паведамлення',
    de: 'Nachricht bearbeiten',
    fr: 'Modification du message',
    zh: '编辑消息'
  },
  isTyping: {
    ru: 'печатает',
    en: 'is typing',
    by: 'друкуе',
    de: 'schreibt',
    fr: 'est en train d\'écrire',
    zh: '正在输入'
  },
  selectRole: {
    ru: 'Выберите роль',
    en: 'Select role',
    by: 'Выберыце ролю',
    de: 'Rolle auswählen',
    fr: 'Sélectionner un rôle',
    zh: '选择角色'
  },
  radioThinking: {
    ru: 'Думаю',
    en: 'Thinking',
    by: 'Думаю',
    de: 'Denke',
    fr: 'Je pense',
    zh: '思考中'
  }
};

const langs = ['ru', 'en', 'by', 'de', 'fr', 'zh'];

for (const lang of langs) {
  const langRegex = new RegExp(`(${lang}:\\s*{[\\s\\S]*?)(};)`, 'g');
  content = content.replace(langRegex, (match, p1, p2) => {
    let newProps = '';
    for (const [key, values] of Object.entries(newKeys)) {
      if (!p1.includes(`${key}:`)) {
        newProps += `    ${key}: "${values[lang]}",\n`;
      }
    }
    return p1 + newProps + p2;
  });
}

// Add types to Translation interface
const interfaceRegex = /(export interface Translation {[\s\S]*?)(})/;
content = content.replace(interfaceRegex, (match, p1, p2) => {
  let newProps = '';
  for (const key of Object.keys(newKeys)) {
    if (!p1.includes(`${key}:`)) {
      newProps += `  ${key}?: string;\n`;
    }
  }
  return p1 + newProps + p2;
});

fs.writeFileSync(translationsPath, content, 'utf8');
console.log('Translations updated successfully');
