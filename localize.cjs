const fs = require('fs');

const translationsToAdd = {
  maintenanceSiteClosed: { ru: "Сайт закрыт", en: "Site Closed" },
  maintenanceNoAccess: { ru: "Вы вошли как {name}, но у вас нет доступа.", en: "You are logged in as {name}, but you don't have access." },
  profileNameUpdated: { ru: "Имя успешно обновлено!", en: "Name updated successfully!" },
  profileNameError: { ru: "Ошибка при обновлении имени", en: "Error updating name" },
  profilePhotoUpdated: { ru: "Фото успешно обновлено!", en: "Photo updated successfully!" },
  profilePhotoError: { ru: "Ошибка при обновлении фото", en: "Error updating photo" },
  profileIdCopied: { ru: "ID скопирован!", en: "ID copied!" },
  profileUnknown: { ru: "Неизвестно", en: "Unknown" },
  profileLevel: { ru: "Уровень", en: "Level" },
  profileExp: { ru: "Опыт", en: "EXP" },
  profileReputation: { ru: "Репутация", en: "Reputation" },
  profileAdmin: { ru: "Администратор", en: "Administrator" },
  profileModerator: { ru: "Модератор", en: "Moderator" },
  profileBetaTester: { ru: "Бета-тестер", en: "Beta Tester" },
  profileActiveTrailblazer: { ru: "Активный Путешественник", en: "Active Trailblazer" },
  profilePhotoUrl: { ru: "Ссылка на фото", en: "Photo URL" },
  profileEnterName: { ru: "Введите имя", en: "Enter name" },
  profileSendMessage: { ru: "Написать сообщение", en: "Send Message" },
  profileInfo: { ru: "Инфо", en: "Info" },
  profileUses: { ru: "Юзы", en: "Uses" },
  profileWhatsNew: { ru: "Что нового?", en: "What's new?" },
  profilePost: { ru: "Опубликовать", en: "Post" },
  profileNoUses: { ru: "Пока нет юзов", en: "No uses yet" },
  profileEmail: { ru: "Почта", en: "Email" },
  profileMemberSince: { ru: "В игре с", en: "Member Since" },
  fortuneTitle: { ru: "Астральное предсказание", en: "Astral Fortune" },
  fortuneReveal: { ru: "Узнать судьбу", en: "Reveal Fortune" },
  fortuneReading: { ru: "ЧТЕНИЕ ЗВЕЗД...", en: "READING STARS..." },
  radioFindingJoke: { ru: "Ищу шутку...", en: "Finding a joke..." },
  radioVoicing: { ru: "Озвучивание...", en: "Voicing..." },
  radioThinking: { ru: "Думаю...", en: "Thinking..." },
  radioPlaying: { ru: "Воспроизведение...", en: "Playing..." },
  radioError: { ru: "Ошибка радио", en: "Radio Error" },
  radioOff: { ru: "Радио выключено", en: "Radio off" },
  radioNextJoke: { ru: "Следующая шутка", en: "Next joke" },
  radioNowPlaying: { ru: "Сейчас в эфире", en: "Now Playing" },
  radioAiStandup: { ru: "Стендап от ИИ", en: "AI Stand-up" },
  radioPreparing: { ru: "Подготовка материала...", en: "Preparing material..." },
  radioPressPlay: { ru: "Нажмите Play, чтобы начать трансляцию", en: "Press Play to start broadcasting" },
  radioOffline: { ru: "Офлайн", en: "Offline" },
  forumPostRejected: { ru: "Ваш пост был отклонен автоматической модерацией.", en: "Your post was rejected by automatic moderation." },
  forumCommentRejected: { ru: "Ваш комментарий был отклонен автоматической модерацией.", en: "Your comment was rejected by automatic moderation." },
  forumBack: { ru: "Назад к форуму", en: "Back to forum" },
  forumDiscussion: { ru: "Обсуждение", en: "Discussion" },
  forumNewThread: { ru: "Новая тема", en: "New Thread" },
  forumThreadTitle: { ru: "Заголовок темы", en: "Thread title" },
  forumMessageContent: { ru: "Текст сообщения...", en: "Message content..." },
  forumCreate: { ru: "Создать", en: "Create" },
  forumCreateThread: { ru: "Создать тему", en: "Create Thread" },
  forumSearch: { ru: "Поиск по форуму...", en: "Search forum..." },
  forumNoThreads: { ru: "Темы не найдены", en: "No threads found" },
  forumDeleteThreadTitle: { ru: "Удалить тему?", en: "Delete thread?" },
  forumDeleteThreadMsg: { ru: "Вы уверены, что хотите удалить эту тему? Это действие нельзя отменить.", en: "Are you sure you want to delete this thread? This action cannot be undone." },
  forumDeleteCommentTitle: { ru: "Удалить комментарий?", en: "Delete comment?" },
  forumDeleteCommentMsg: { ru: "Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.", en: "Are you sure you want to delete this comment? This action cannot be undone." },
  chatToday: { ru: "Сегодня", en: "Today" },
  chatYesterday: { ru: "Вчера", en: "Yesterday" },
  chatFileTooLarge: { ru: "Файл слишком большой. Максимум 5MB.", en: "File too large. Maximum 5MB." },
  chatOnline: { ru: "В сети", en: "Online" },
  chatOffline: { ru: "Не в сети", en: "Offline" },
  chatAuthRequired: { ru: "Требуется авторизация", en: "Authorization Required" },
  chatStartConversation: { ru: "Начните общение", en: "Start a conversation" },
  chatsTyping: { ru: "печатает...", en: "typing..." },
  chatsLoginToView: { ru: "Войдите, чтобы просматривать сообщения", en: "Log in to view your chats" },
  chatsEnableNotif: { ru: "Включить уведомления?", en: "Enable notifications?" },
  chatsLater: { ru: "Позже", en: "Later" },
  chatsEnable: { ru: "Включить", en: "Enable" },
  chatsSearch: { ru: "Поиск чатов...", en: "Search chats..." },
  chatsNotFound: { ru: "Ничего не найдено", en: "No chats found" },
  headerProfileSettings: { ru: "Настройки профиля", en: "Profile Settings" },
  headerLoginEmail: { ru: "Вход через почту", en: "Login with Email" },
  adminMaintenanceMode: { ru: "Режим обслуживания", en: "Maintenance Mode" },
  adminCloseSite: { ru: "Закрыть сайт для обычных пользователей", en: "Close site for regular users" },
  adminSearchUsers: { ru: "Поиск пользователей...", en: "Search users..." },
  adminNoUsers: { ru: "Ничего не найдено", en: "No users found" },
  sdkTitle: { ru: "Радиостанция Ахи ИИ v2.0", en: "Aha Radio Station AI v2.0" },
  sdkDesc: { ru: "Спросите меня о лоре HSR или используйте команды SDK (начните с /).", en: "Ask me about HSR lore or use SDK commands (start with /)." },
  sdkMinistryPanel: { ru: "Панель Министерства", en: "Ministry Panel" },
  sdkAiAssistant: { ru: "ИИ Ассистент", en: "AI Assistant" },
  sdkSettings: { ru: "SDK Настройки", en: "SDK Settings" },
  sdkClearHistory: { ru: "Очистить историю", en: "Clear history" },
  sdkAuthRequiredMsg: { ru: "Использование ИИ доступно только после авторизации через Google.", en: "AI usage is only available after logging in with Google." },
  sdkAskAi: { ru: "Спросите ИИ (или /команда)...", en: "Ask AI (or /command)..." },
  sdkPerformance: { ru: "Производительность", en: "Performance" },
  sdkProductionMode: { ru: "Продакшн Режим", en: "Production Mode" },
  sdkHighFidelity: { ru: "Высокое качество графики и эффектов", en: "High fidelity graphics and effects" },
  sdkLowPerfMode: { ru: "Режим низкой производительности", en: "Low Performance Mode" },
  sdkDisableHeavy: { ru: "Отключает тяжелые анимации", en: "Disables heavy animations" },
  sdkLoadWidget: { ru: "Виджет нагрузки", en: "Load Widget" },
  sdkShowPerfWidget: { ru: "Показывать виджет производительности", en: "Show performance widget" },
  sdkSystem: { ru: "Система", en: "System" }
};

async function translateAll() {
  const targetLangs = ['by', 'de', 'fr', 'zh'];
  const finalTranslations = { ru: {}, en: {}, by: {}, de: {}, fr: {}, zh: {} };

  for (const [key, values] of Object.entries(translationsToAdd)) {
    finalTranslations.ru[key] = values.ru;
    finalTranslations.en[key] = values.en;
  }

  const keys = Object.keys(translationsToAdd);
  const batchSize = 10;
  
  for (let i = 0; i < keys.length; i += batchSize) {
    const batchKeys = keys.slice(i, i + batchSize);
    const textToTranslate = batchKeys.map(k => k + ': ' + translationsToAdd[k].en).join('\\n');
    
    console.log('Translating batch ' + (i / batchSize + 1) + '...');
    
    const prompt = 'Translate the following key-value pairs into Belarusian (by), German (de), French (fr), and Simplified Chinese (zh).\\nMaintain the keys exactly as they are.\\nText:\\n' + textToTranslate + '\\n\\nReturn ONLY a valid JSON object where the top-level keys are language codes (by, de, fr, zh) and the values are objects with the translated key-value pairs. No markdown.';

    try {
      const url = new URL('https://text.pollinations.ai/' + encodeURIComponent(prompt));
      url.searchParams.append('system', 'You are a JSON translation API.');
      url.searchParams.append('model', 'openai');
      url.searchParams.append('jsonMode', 'true');
      
      const response = await fetch(url.toString());
      const text = await response.text();
      const jsonStr = text.replace(/^\\s*\`\`\`json\\n/, '').replace(/\\n\`\`\`\\s*$/, '').trim();
      const translated = JSON.parse(jsonStr);
      
      for (const lang of targetLangs) {
        if (translated[lang]) {
          for (const k of batchKeys) {
            finalTranslations[lang][k] = translated[lang][k] || translationsToAdd[k].en;
          }
        } else {
          for (const k of batchKeys) {
            finalTranslations[lang][k] = translationsToAdd[k].en;
          }
        }
      }
    } catch (e) {
      console.error('Error translating batch:', e);
      for (const lang of targetLangs) {
        for (const k of batchKeys) {
          finalTranslations[lang][k] = translationsToAdd[k].en;
        }
      }
    }
  }

  let tsContent = fs.readFileSync('src/data/translations.ts', 'utf8');
  
  for (const lang of ['ru', 'en', 'by', 'de', 'fr', 'zh']) {
    let langBlock = '';
    for (const [k, v] of Object.entries(finalTranslations[lang])) {
      langBlock += '    ' + k + ': ' + JSON.stringify(v) + ',\\n';
    }
    
    const regex = new RegExp('(\\\\s*' + lang + ': \\{)');
    tsContent = tsContent.replace(regex, '$1\\n' + langBlock);
  }
  
  fs.writeFileSync('src/data/translations.ts', tsContent);
  console.log('translations.ts updated!');
}

translateAll();
