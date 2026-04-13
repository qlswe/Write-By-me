const fs = require('fs');

const translationsToAdd = {
  sdkPerformance: {
    ru: "Производительность",
    en: "Performance",
    by: "Прадукцыйнасць",
    de: "Leistung",
    fr: "Performance",
    zh: "性能"
  },
  sdkProductionMode: {
    ru: "Продакшн Режим",
    en: "Production Mode",
    by: "Прадакшн Рэжым",
    de: "Produktionsmodus",
    fr: "Mode Production",
    zh: "生产模式"
  },
  sdkHighFidelity: {
    ru: "Высокое качество графики и эффектов",
    en: "High fidelity graphics and effects",
    by: "Высокая якасць графікі і эфектаў",
    de: "Hochwertige Grafiken und Effekte",
    fr: "Graphismes et effets haute fidélité",
    zh: "高保真图形和效果"
  },
  sdkLowPerformanceMode: {
    ru: "Режим низкой производительности",
    en: "Low Performance Mode",
    by: "Рэжым нізкай прадукцыйнасці",
    de: "Niedriger Leistungsmodus",
    fr: "Mode basse performance",
    zh: "低性能模式"
  },
  sdkDisableHeavyAnimations: {
    ru: "Отключает тяжелые анимации",
    en: "Disables heavy animations",
    by: "Адключае цяжкія анімацыі",
    de: "Deaktiviert schwere Animationen",
    fr: "Désactive les animations lourdes",
    zh: "禁用繁重的动画"
  },
  sdkLoadWidget: {
    ru: "Виджет нагрузки",
    en: "Load Widget",
    by: "Віджэт нагрузкі",
    de: "Last-Widget",
    fr: "Widget de charge",
    zh: "负载小部件"
  },
  sdkShowPerformanceWidget: {
    ru: "Показывать виджет производительности",
    en: "Show performance widget",
    by: "Паказваць віджэт прадукцыйнасці",
    de: "Leistungs-Widget anzeigen",
    fr: "Afficher le widget de performance",
    zh: "显示性能小部件"
  },
  sdkSystem: {
    ru: "Система",
    en: "System",
    by: "Сістэма",
    de: "System",
    fr: "Système",
    zh: "系统"
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
