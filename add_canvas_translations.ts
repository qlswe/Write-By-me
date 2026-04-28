import fs from 'fs';
import path from 'path';

const translationsPath = path.join(process.cwd(), 'src/data/translations.ts');
let content = fs.readFileSync(translationsPath, 'utf8');

const newKeys = {
  canvasPersonalDesc: {
    ru: 'Это ваш личный холст. Вы можете рисовать здесь и опубликовать снимок в своем профиле.',
    en: 'This is your personal canvas. You can draw here and publish a snapshot to your profile.',
    by: 'Гэта ваш асабісты холст. Вы можаце маляваць тут і апублікаваць здымак у сваім профілі.',
    de: 'Dies ist deine persönliche Leinwand. Du kannst hier zeichnen und einen Schnappschuss auf deinem Profil veröffentlichen.',
    fr: 'Ceci est votre toile personnelle. Vous pouvez dessiner ici et publier un aperçu sur votre profil.',
    zh: '这是您的个人画板。您可在这里绘画并将快照发布到您的个人资料中。'
  },
  canvasMoveToolText: {
    ru: ' Используйте инструмент Перемещение (или колесо мыши) для зума и панорамирования.',
    en: ' Use the Move tool (or mouse wheel) to zoom and pan.',
    by: ' Выкарыстоўвайце інструмент Перамяшчэнне (або кола мышы) для павелічэння і панарамавання.',
    de: ' Verwende das Verschieben-Werkzeug (oder das Mausrad) zum Zoomen und Schwenken.',
    fr: ' Utilisez l\'outil Déplacer (ou la molette de la souris) pour zoomer et vous déplacer.',
    zh: ' 使用移动工具（或鼠标滚轮）进行缩放和平移。'
  },
  canvasClearConfirm: {
    ru: 'Вы уверены, что хотите очистить свой личный холст?',
    en: 'Are you sure you want to clear your personal canvas?',
    by: 'Вы ўпэўненыя, што хочаце ачысціць свой асабісты холст?',
    de: 'Bist du sicher, dass du deine persönliche Leinwand löschen willst?',
    fr: 'Êtes-vous sûr de vouloir effacer votre toile personnelle ?',
    zh: '您确定要清空您的个人画板吗？'
  },
  canvasPublishText: {
    ru: 'Зацени мой новый арт с холста! \n[CANVAS_SNAPSHOT]',
    en: 'Check out my new canvas artwork! \n[CANVAS_SNAPSHOT]',
    by: 'Зацані мой новы арт з халста! \n[CANVAS_SNAPSHOT]',
    de: 'Sieh dir mein neues Leinwand-Kunstwerk an! \n[CANVAS_SNAPSHOT]',
    fr: 'Découvrez ma nouvelle œuvre sur toile ! \n[CANVAS_SNAPSHOT]',
    zh: '看看我的新画板艺术！ \n[CANVAS_SNAPSHOT]'
  },
  canvasPublishSuccess: {
    ru: 'Холст опубликован в вашем профиле!',
    en: 'Canvas published to your profile!',
    by: 'Холст апублікаваны ў вашым профілі!',
    de: 'Leinwand auf deinem Profil veröffentlicht!',
    fr: 'Toile publiée sur votre profil !',
    zh: '画板已发布到您的个人资料！'
  },
  canvasPublishFail: {
    ru: 'Не удалось опубликовать',
    en: 'Failed to publish',
    by: 'Не ўдалося апублікаваць',
    de: 'Veröffentlichung fehlgeschlagen',
    fr: 'Échec de la publication',
    zh: '发布失败'
  },
  canvasClear: {
    ru: 'Очистить',
    en: 'Clear',
    by: 'Ачысціць',
    de: 'Löschen',
    fr: 'Effacer',
    zh: '清空'
  },
  canvasPublish: {
    ru: 'Опубликовать',
    en: 'Publish',
    by: 'Апублікаваць',
    de: 'Veröffentlichen',
    fr: 'Publier',
    zh: '发布'
  },
  canvasGlobal: {
    ru: 'Глобальный',
    en: 'Global',
    by: 'Глабальны',
    de: 'Global',
    fr: 'Global',
    zh: '全局的'
  },
  canvasPersonal: {
    ru: 'Личный',
    en: 'Personal',
    by: 'Асабісты',
    de: 'Persönlich',
    fr: 'Personnel',
    zh: '个人的'
  },
  canvasZoom: {
    ru: 'ЗУМ',
    en: 'ZOOM',
    by: 'ЗУМ',
    de: 'ZOOM',
    fr: 'ZOOM',
    zh: '缩放'
  },
  canvasToolDraw: {
    ru: 'Рисовать',
    en: 'Draw',
    by: 'Маляваць',
    de: 'Zeichnen',
    fr: 'Dessiner',
    zh: '绘画'
  },
  canvasToolMove: {
    ru: 'Перемещать',
    en: 'Move',
    by: 'Перамяшчаць',
    de: 'Bewegen',
    fr: 'Déplacer',
    zh: '移动'
  }
};

const langs = ['ru', 'en', 'by', 'de', 'fr', 'zh'];

for (const lang of langs) {
  // Find the end of the language object
  const langRegex = new RegExp(`(${lang}:\\s*{[\\s\\S]*?)(    characters:\\s*{[\\s\\S]*?    \\}\\n  \\})`, 'g');
  content = content.replace(langRegex, (match, p1, p2) => {
    let newProps = '';
    for (const [key, values] of Object.entries(newKeys)) {
      if (!p1.includes(`    ${key}:`)) {
        newProps += `    ${key}: ${JSON.stringify(values[lang])},\n`;
      }
    }
    return p1 + newProps + p2;
  });
}

fs.writeFileSync(translationsPath, content, 'utf8');
console.log('Translations updated successfully');
