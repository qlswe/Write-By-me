import fs from 'fs';
import path from 'path';

const translationsPath = path.join(process.cwd(), 'src/data/translations.ts');
let content = fs.readFileSync(translationsPath, 'utf8');

// Extract the 'ru' object
const ruMatch = content.match(/ru:\s*\{([\s\S]*?)\},\n  en:/);
if (!ruMatch) throw new Error('Could not find ru translations');

const ruContent = ruMatch[1];
const ruEntries = Array.from(ruContent.matchAll(/([a-zA-Z0-9_]+):\s*"(.*?)",?/g)).map(m => ({ key: m[1], value: m[2] }));

const langs = ['en', 'by', 'de', 'fr', 'zh'];

// Basic translations for the missing keys
const translations: Record<string, Record<string, string>> = {
  chatActions: { en: "Actions", by: "Дзеянні", de: "Aktionen", fr: "Actions", zh: "操作" },
  chatReply: { en: "Reply", by: "Адказаць", de: "Antworten", fr: "Répondre", zh: "回复" },
  chatCopy: { en: "Copy", by: "Капіяваць", de: "Kopieren", fr: "Copier", zh: "复制" },
  chatEdit: { en: "Edit", by: "Змяніць", de: "Bearbeiten", fr: "Modifier", zh: "编辑" },
  chatDelete: { en: "Delete", by: "Выдаліць", de: "Löschen", fr: "Supprimer", zh: "删除" },
  chatYou: { en: "You", by: "Вы", de: "Du", fr: "Vous", zh: "你" },
  chatMessageDeleted: { en: "Message deleted", by: "Паведамленне выдалена", de: "Nachricht gelöscht", fr: "Message supprimé", zh: "消息已删除" },
  sdkLowPerformanceMode: { en: "Low Performance Mode", by: "Рэжым нізкай прадукцыйнасці", de: "Niedriger Leistungsmodus", fr: "Mode basse performance", zh: "低性能模式" },
  sdkDisableHeavyAnimations: { en: "Disables heavy animations", by: "Адключае цяжкія анімацыі", de: "Deaktiviert schwere Animationen", fr: "Désactive les animations lourdes", zh: "禁用重度动画" },
  sdkShowPerformanceWidget: { en: "Show performance widget", by: "Паказваць віджэт прадукцыйнасці", de: "Leistungs-Widget anzeigen", fr: "Afficher le widget de performance", zh: "显示性能小部件" },
  sdkAuthRequired: { en: "Authorization required", by: "Патрабуецца аўтарызацыя", de: "Autorisierung erforderlich", fr: "Autorisation requise", zh: "需要授权" },
  sdkAuthDesc: { en: "AI features are only available after logging in with Google.", by: "Выкарыстанне ШІ даступна толькі пасля аўтарызацыі праз Google.", de: "KI-Funktionen sind nur nach der Anmeldung mit Google verfügbar.", fr: "Les fonctionnalités d'IA ne sont disponibles qu'après connexion avec Google.", zh: "AI功能仅在通过Google登录后可用。" },
  sdkThinking: { en: "Thinking...", by: "Думае...", de: "Denkt...", fr: "Réfléchit...", zh: "思考中..." },
  sdkAskAI: { en: "Ask AI (or /command)...", by: "Спытаеце ШІ (або /каманда)...", de: "KI fragen (oder /befehl)...", fr: "Demander à l'IA (ou /commande)...", zh: "询问AI（或 /命令）..." },
  sdkAhaRadio: { en: "Aha Radio", by: "Радыёстанцыя Ахі", de: "Aha Radio", fr: "Radio Aha", zh: "阿哈电台" },
  sdkAIAssistant: { en: "AI Assistant", by: "ШІ Асістэнт", de: "KI-Assistent", fr: "Assistant IA", zh: "AI助手" },
  sdkAhaRadioAI: { en: "Aha Radio AI v2.0", by: "Радыёстанцыя Ахі ШІ v2.0", de: "Aha Radio KI v2.0", fr: "Radio Aha IA v2.0", zh: "阿哈电台AI v2.0" },
  sdkAskMe: { en: "Ask me about HSR lore or use SDK commands (start with /).", by: "Спытаеце мяне пра лор HSR або выкарыстоўвайце каманды SDK (пачніце з /).", de: "Frag mich nach HSR-Lore oder nutze SDK-Befehle (beginne mit /).", fr: "Posez-moi des questions sur le lore de HSR ou utilisez les commandes SDK (commencez par /).", zh: "问我关于HSR背景故事或使用SDK命令（以/开头）。" },
  roleBetaTester: { en: "Beta Tester", by: "Бэта-тэстар", de: "Beta-Tester", fr: "Bêta-testeur", zh: "Beta测试员" },
  adminProfile: { en: "Profile", by: "Профіль", de: "Profil", fr: "Profil", zh: "个人资料" },
  adminMaintenanceDesc: { en: "Maintenance mode description", by: "Апісанне рэжыму тэхнічнага абслугоўвання", de: "Beschreibung des Wartungsmodus", fr: "Description du mode de maintenance", zh: "维护模式描述" },
  adminNoUsersFound: { en: "No users found", by: "Карыстальнікі не знойдзены", de: "Keine Benutzer gefunden", fr: "Aucun utilisateur trouvé", zh: "未找到用户" },
  chatLater: { en: "Later", by: "Пазней", de: "Später", fr: "Plus tard", zh: "稍后" },
  chatEnable: { en: "Enable", by: "Уключыць", de: "Aktivieren", fr: "Activer", zh: "启用" },
  chatSearchChats: { en: "Search chats...", by: "Пошук чатаў...", de: "Chats suchen...", fr: "Rechercher des chats...", zh: "搜索聊天..." },
  chatNoChatsFound: { en: "No chats found", by: "Чаты не знойдзены", de: "Keine Chats gefunden", fr: "Aucun chat trouvé", zh: "未找到聊天" },
  chatLoginToView: { en: "Log in to view chats", by: "Увайдзіце, каб праглядаць чаты", de: "Anmelden, um Chats zu sehen", fr: "Connectez-vous pour voir les chats", zh: "登录以查看聊天" },
  chatEnableNotifs: { en: "Enable notifications", by: "Уключыць апавяшчэнні", de: "Benachrichtigungen aktivieren", fr: "Activer les notifications", zh: "启用通知" },
  chatEnableNotifsDesc: { en: "Don't miss new messages", by: "Не прапусціце новыя паведамленні", de: "Verpassen Sie keine neuen Nachrichten", fr: "Ne manquez pas les nouveaux messages", zh: "不要错过新消息" },
  chatTyping: { en: "is typing...", by: "друкуе...", de: "schreibt...", fr: "est en train d'écrire...", zh: "正在输入..." },
  chatAuthDesc: { en: "Log in to chat", by: "Увайдзіце, каб размаўляць", de: "Anmelden zum Chatten", fr: "Connectez-vous pour discuter", zh: "登录以聊天" },
  forumTitle: { en: "Forum", by: "Форум", de: "Forum", fr: "Forum", zh: "论坛" },
  forumDeleteThreadMessage: { en: "Are you sure you want to delete this thread?", by: "Вы ўпэўнены, што хочаце выдаліць гэтую тэму?", de: "Möchten Sie diesen Thread wirklich löschen?", fr: "Êtes-vous sûr de vouloir supprimer ce fil ?", zh: "您确定要删除此主题吗？" },
  forumDelete: { en: "Delete", by: "Выдаліць", de: "Löschen", fr: "Supprimer", zh: "删除" },
  forumDeleteCommentMessage: { en: "Are you sure you want to delete this comment?", by: "Вы ўпэўнены, што хочаце выдаліць гэты каментар?", de: "Möchten Sie diesen Kommentar wirklich löschen?", fr: "Êtes-vous sûr de vouloir supprimer ce commentaire ?", zh: "您确定要删除此评论吗？" },
  forumWriteComment: { en: "Write a comment...", by: "Напісаць каментар...", de: "Einen Kommentar schreiben...", fr: "Écrire un commentaire...", zh: "写评论..." },
  forumSend: { en: "Send", by: "Адправіць", de: "Senden", fr: "Envoyer", zh: "发送" },
  forumLoginToComment: { en: "Log in to comment", by: "Увайдзіце, каб пакінуць каментар", de: "Anmelden zum Kommentieren", fr: "Connectez-vous pour commenter", zh: "登录以评论" },
  forumSave: { en: "Save", by: "Захаваць", de: "Speichern", fr: "Enregistrer", zh: "保存" },
  forumCancel: { en: "Cancel", by: "Адмена", de: "Abbrechen", fr: "Annuler", zh: "取消" },
  forumReply: { en: "Reply", by: "Адказаць", de: "Antworten", fr: "Répondre", zh: "回复" },
  forumYourReply: { en: "Your reply...", by: "Ваш адказ...", de: "Ihre Antwort...", fr: "Votre réponse...", zh: "您的回复..." },
  forumModerationRejectedPost: { en: "Post rejected by moderation", by: "Пост адхілены мадэрацыяй", de: "Beitrag von Moderation abgelehnt", fr: "Message rejeté par la modération", zh: "帖子被审核拒绝" },
  forumModerationRejectedComment: { en: "Comment rejected by moderation", by: "Каментар адхілены мадэрацыяй", de: "Kommentar von Moderation abgelehnt", fr: "Commentaire rejeté par la modération", zh: "评论被审核拒绝" },
  forumBotWelcome: { en: "Welcome to the Aha Forum!", by: "Сардэчна запрашаем на Форум Ахі!", de: "Willkommen im Aha-Forum!", fr: "Bienvenue sur le forum Aha !", zh: "欢迎来到阿哈论坛！" },
  radioAuthRequired: { en: "Authorization required", by: "Патрабуецца аўтарызацыя", de: "Autorisierung erforderlich", fr: "Autorisation requise", zh: "需要授权" },
  radioTitle: { en: "Aha Radio", by: "Радыёстанцыя Ахі", de: "Aha Radio", fr: "Radio Aha", zh: "阿哈电台" },
  statusInactive: { en: "Inactive", by: "Неактыўны", de: "Inaktiv", fr: "Inactif", zh: "不活跃" }
};

for (const lang of langs) {
  const langRegex = new RegExp(`(${lang}:\\s*{[\\s\\S]*?)(    characters:\\s*{[\\s\\S]*?    \\}\\n  \\})`, 'g');
  content = content.replace(langRegex, (match, p1, p2) => {
    let newProps = '';
    for (const { key } of ruEntries) {
      if (!p1.includes(`    ${key}:`)) {
        const val = translations[key]?.[lang] || translations[key]?.en || "Translation missing";
        newProps += `    ${key}: "${val}",\n`;
      }
    }
    return p1 + newProps + p2;
  });
}

// Fix the siteName and homeTitle
content = content.replace(/siteName: "Ministerium von Ahahi"/g, 'siteName: "Ministerium von Aha"');
content = content.replace(/homeTitle: "Willkommen beim Ministerium von Ahahi!"/g, 'homeTitle: "Willkommen beim Ministerium von Aha!"');

content = content.replace(/siteName: "Ministère d'Ahahi"/g, 'siteName: "Ministère d\'Aha"');
content = content.replace(/homeTitle: "Bienvenue au Ministère d'Ahahi !"/g, 'homeTitle: "Bienvenue au Ministère d\'Aha !"');

content = content.replace(/siteName: "如我所写"/g, 'siteName: "阿哈部"');
content = content.replace(/homeTitle: "欢迎来到知识库！"/g, 'homeTitle: "欢迎来到阿哈部！"');

content = content.replace(/siteName: "Aha Radio Station"/g, 'siteName: "Ministry of Aha"');
content = content.replace(/homeTitle: "Welcome to Aha Radio Station!"/g, 'homeTitle: "Welcome to the Ministry of Aha!"');

content = content.replace(/siteName: "Радиостанция Ахи"/g, 'siteName: "Министерство Ахи"');
content = content.replace(/homeTitle: "Добро пожаловать на Радиостанцию Ахи!"/g, 'homeTitle: "Добро пожаловать в Министерство Ахи!"');

content = content.replace(/siteName: "Радыёстанцыя Ахі"/g, 'siteName: "Міністэрства Ахі"');
content = content.replace(/homeTitle: "Сардэчна запрашаем на Радыёстанцыю Ахі!"/g, 'homeTitle: "Сардэчна запрашаем у Міністэрства Ахі!"');

// Add types to Translation interface
const interfaceRegex = /(export interface Translation {[\s\S]*?)(})/;
content = content.replace(interfaceRegex, (match, p1, p2) => {
  let newProps = '';
  for (const { key } of ruEntries) {
    if (!p1.includes(`  ${key}:`) && !p1.includes(`  ${key}?`)) {
      newProps += `  ${key}?: string;\n`;
    }
  }
  return p1 + newProps + p2;
});

fs.writeFileSync(translationsPath, content, 'utf8');
console.log('Translations updated successfully');
