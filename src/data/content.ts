import { Language } from './translations';

export interface LocalizedString {
  ru: string;
  en: string;
  by: string;
  jp: string;
  de: string;
  fr: string;
  zh: string;
  [key: string]: string;
}

export interface Theory {
  id: string;
  category: 'lore' | 'characters' | 'gameplay';
  title: LocalizedString;
  summary: LocalizedString;
  content: LocalizedString;
}

export const theoriesData: Theory[] = [
  {
    id: 'theory-1',
    category: 'lore',
    title: {
      ru: "Эоны: Кто они такие и чего хотят?",
      en: "Aeons: Who Are They and What Do They Want?",
      by: "Эоны: Хто яны такія і чаго хочуць?",
      jp: "星神: 彼らは何者で、何を望んでいるのか？",
      de: "Die Äonen: Wer sind sie und was wollen sie?",
      fr: "Les Éons : Qui sont-ils et que veulent-ils ?",
      zh: "星神：他们是谁，他们想要什么？"
    },
    summary: {
      ru: "Подробный анализ всех известных Эонов и их влияний на вселенную HSR.",
      en: "A detailed analysis of all known Aeons and their influences on the HSR universe.",
      by: "Падрабязны аналіз усіх вядомых Эонаў і іх уплываў на сусвет HSR.",
      jp: "既知のすべての星神とそのHSR宇宙への影響の詳細な分析。",
      de: "Eine detaillierte Analyse aller bekannten Äonen und ihrer Einflüsse auf das HSR-Universum.",
      fr: "Une analyse détaillée de tous les Éons connus et de leurs influences sur l'univers de HSR.",
      zh: "对所有已知星神及其对HSR宇宙影响的详细分析。"
    },
    content: {
      ru: "<p>Эоны — это божественные сущности, сформированные из фундаментальных концепций бытия. Они странствуют по космосу, оставляя за собой следы своих путей.</p><p>Например, Акивили, Эон Освоения, проложил Звездные Рельсы, создав бесконечные возможности для путешествий. Однако, его судьба остается загадкой. Теории о его исчезновении варьируются от добровольного ухода до насильственного завершения пути.</p><p>Каждый Эон обладает уникальной философией и влиянием, определяя судьбы миров и существ, которые пересекают их Пути. Понимание их мотивов критически важно для разгадки тайн Honkai: Star Rail.</p>",
      en: "<p>Aeons are divine entities formed from fundamental concepts of existence. They wander the cosmos, leaving behind traces of their Paths.</p><p>For example, Akivili, the Aeon of Trailblaze, forged the Star Rails, creating endless possibilities for travel. However, their fate remains a mystery. Theories about their disappearance range from voluntary departure to a violent end to their Path.</p><p>Each Aeon possesses a unique philosophy and influence, shaping the destinies of worlds and beings who cross their Paths. Understanding their motives is crucial for unraveling the mysteries of Honkai: Star Rail.</p>",
      by: "<p>Эоны — гэта боскіе сутнасці, сфармаваныя з фундаментальных канцэпцый быцця. Яны блукаюць па космасе, пакідаючы за сабой сляды сваіх шляхоў.</p><p>Напрыклад, Аківілі, Эон Асваення, праклаў Зорныя Рэйкі, стварыўшы бясконцыя магчымасці для падарожжаў. Аднак, яго лёс застаецца загадкай. Тэорыі аб яго знікненні вар'іруюцца ад добраахвотнага ад'езду да гвалтоўнага завяршэння шляху.</p><p>Кожны Эон мае ўнікальную філасофію і ўплыў, вызначаючы лёсы светаў і істот, якія перасякаюць іх Шляхі. Разумненне іх матываў крытычна важна для разгадкі тайн Honkai: Star Rail.</p>",
      jp: "<p>星神は、存在の根本的な概念から形成された神聖な存在です。彼らは宇宙をさまよい、その歩んだ道の痕跡を残します。</p><p>例えば, 開拓の星神アキヴィリは星穹列車の軌道を作り、旅の無限の可能性を生み出しました。しかし、その運命は依然として謎です。彼らの消失に関する理論は、自発的な出発からその道が暴力的に終わったというものまで様々です。</p><p>各星神は独自の哲学と影響力を持ち、彼らの道を横断する世界や存在の運命を形作ります。彼らの動機を理解することは、Honkai: Star Railの謎を解き明かす上で非常に重要です。</p>",
      de: "<p>Äonen sind göttliche Wesen, die aus grundlegenden Konzepten der Existenz geformt wurden. Sie wandern durch den Kosmos und hinterlassen Spuren ihrer Pfade.</p><p>Zum Beispiel schmiedete Akivili, der Äon der Trailblaze, die Sternenbahnen und schuf unendliche Reisemöglichkeiten. Ihr Schicksal bleibt jedoch ein Rätsel. Theorien über ihr Verschwinden reichen von einem freiwilligen Abgang bis zu einem gewaltsamen Ende ihres Pfades.</p><p>Jeder Äon besitzt eine einzigartige Philosophie und einen Einfluss, der die Schicksale von Welten und Wesen formt, die ihre Pfade kreuzen. Das Verständnis ihrer Motive ist entscheidend, um die Geheimnisse von Honkai: Star Rail zu entschlüsseln.</p>",
      fr: "<p>Les Éons sont des entités divines formées à partir de concepts fondamentaux de l'existence. Ils errent dans le cosmos, laissant derrière eux des traces de leurs Chemins.</p><p>Par exemple, Akivili, l'Éon de l'Exploration, a forgé les Rails Étoiles, créant d'infinies possibilités de voyage. Cependant, leur destin reste un mystère. Les théories sur leur disparition vont du départ volontaire à une fin violente de leur Chemin.</p><p>Chaque Éon possède une philosophie et une influence uniques, façonnant le destin des mondes et des êtres qui croisent leurs Chemins. Comprendre leurs motivations est crucial pour percer les mystères de Honkai: Star Rail.</p>",
      zh: "<p>星神是源于存在基本概念的神圣实体。他们在宇宙中漫游，留下他们所走之道的痕迹。</p><p>例如，开拓的星神阿基维利，他铸造了星穹列车，创造了无限的旅行可能性。然而，他们的命运仍然是一个谜。关于他们消失的理论从自愿离开到他们的道路被暴力终结不等。</p><p>每个星神都拥有独特的哲学和影响力，塑造着那些与他们之道相遇的世界和生命的命运。理解他们的动机对于解开崩坏：星穹铁道的谜团至关重要。</p>"
    }
  },
  {
    id: 'theory-2',
    category: 'characters',
    title: {
      ru: "Истинная личность Кафки: Кто она на самом деле?",
      en: "Kafka's True Identity: Who Is She Really?",
      by: "Сапраўдная асоба Кафкі: Хто яна на самай справе?",
      jp: "カフカの真の正体: 彼女は本当に誰なのか？",
      de: "Kafkas wahre Identität: Wer ist sie wirklich?",
      fr: "La véritable identité de Kafka : Qui est-elle vraiment ?",
      zh: "卡芙卡的真实身份：她到底是谁？"
    },
    summary: {
      ru: "Разбираем теории о происхождении Кафки и её связях с Охотниками за Стелларонами.",
      en: "Analyzing theories about Kafka's origin and her ties to the Stellaron Hunters.",
      by: "Разбіраем тэорыі аб паходжанні Кафкі і яе сувязях з Палявымі за Стэларонамi.",
      jp: "カフカの起源と星核ハンターとの関係についての理論を分析します。",
      de: "Analyse von Theorien über Kafkas Herkunft und ihre Verbindungen zu den Stellaron-Jägern.",
      fr: "Analyse des théories sur l'origine de Kafka et ses liens avec les Chasseurs de Stellaron.",
      zh: "分析关于卡芙卡起源及其与星核猎手之间联系的理论。"
    },
    content: {
      ru: "<p>Кафка — один из самых загадочных персонажей в Honkai: Star Rail. Ее мотивы и прошлое окутаны тайной, что порождает множество теорий среди фанатов.</p><p>Одна из популярных теорий предполагает, что Кафка не просто член Охотников за Стелларонами, но и ключевая фигура в более масштабном плане Элио. Возможно, она является частью древнего проекта или даже напрямую связана с одним из Эонов.</p><p>Ее способность 'очаровывать' и манипулировать людьми также наводит на мысли о её необычных силах, которые выходят за рамки обычных Путей. Разгадка её личности может стать ключом к пониманию всей сюжетной линии игры.</p>",
      en: "<p>Kafka is one of the most mysterious characters in Honkai: Star Rail. Her motives and past are shrouded in secrecy, leading to many fan theories.</p><p>One popular theory suggests that Kafka is not just a member of the Stellaron Hunters, but a key figure in Elio's larger plan. Perhaps she is part of an ancient project or even directly connected to one of the Aeons.</p><p>Her ability to 'charm' and manipulate people also hints at her unusual powers that go beyond ordinary Paths. Unraveling her identity could be the key to understanding the entire game's storyline.</p>",
      by: "<p>Кафка — адзін з самых загадкавых персанажаў у Honkai: Star Rail. Яе матывы і мінулае ахутаны таямніцай, што спараджае мноства тэорый сярод фанатаў.</p><p>Адна з папулярных тэорый мяркуе, што Кафка не проста член Палявых за Стэларонамi, але і ключавы фігура ў больш маштабным плане Эліо. Магчыма, яна з'яўляецца часткай старажытнага праекта або нават напрамую звязана з адным з Эонаў.</p><p>Яе здольнасць 'зачаравываць' і маніпуляваць людзьмі таксама наводзіць на думкі аб яе незвычайных сілах, якія выходзяць за рамкі звычайных Шляхоў. Разгадка яе асобы можа стаць ключом да разумення ўсёй сюжэтнай лініі гульні.</p>",
      jp: "<p>カフカは『Honkai: Star Rail』で最も謎めいたキャラクターの一人です。彼女の動機と過去は謎に包まれており、ファンの間で多くの憶測を呼んでいます。</p><p>ある人気のある理論では、カフカは星核ハンターの一員であるだけでなく、エリオーのより大きな計画の重要な人物であると示唆されています。彼女は古代のプロジェクトの一部であるか、あるいは星神の一人と直接関係している可能性もあります。</p><p>彼女が人々を「魅了」し操作する能力も、通常の運命とは異なる彼女の並外れた力を示唆しています。彼女の正体を解明することは、ゲーム全体のストーリーラインを理解する鍵となるかもしれません。</p>",
      de: "<p>Kafka ist eine der geheimnisvollsten Figuren in Honkai: Star Rail. Ihre Motive und ihre Vergangenheit sind in Geheimnisse gehüllt, was zu vielen Fan-Theorien führt.</p><p>Eine beliebte Theorie besagt, dass Kafka nicht nur ein Mitglied der Stellaron-Jäger ist, sondern eine Schlüsselfigur in Elios größerem Plan. Vielleicht ist sie Teil eines uralten Projekts oder sogar direkt mit einem der Äonen verbunden.</p><p>Ihre Fähigkeit, Menschen zu 'verzaubern' und zu manipulieren, deutet ebenfalls auf ihre ungewöhnlichen Kräfte hin, die über gewöhnliche Pfade hinausgehen. Das Entschlüsseln ihrer Identität könnte der Schlüssel zum Verständnis der gesamten Spielhandlung sein.</p>",
      fr: "<p>Kafka est l'un des personnages les plus mystérieux de Honkai: Star Rail. Ses motivations et son passé sont entourés de mystère, ce qui suscite de nombreuses théories chez les fans.</p><p>Une théorie populaire suggère que Kafka n'est pas seulement un membre des Chasseurs de Stellaron, mais une figure clé dans le plan plus vaste d'Elio. Elle fait peut-être partie d'un projet ancien ou est même directement liée à l'un des Éons.</p><p>Sa capacité à 'charmer' et à manipuler les gens laisse également entrevoir ses pouvoirs inhabituels qui dépassent les Chemins ordinaires. Découvrir son identité pourrait être la clé pour comprendre l'intégralité de l'histoire du jeu.</p>",
      zh: "<p>卡芙卡是崩坏：星穹铁道中最神秘的角色之一。她的动机和过去被秘密笼罩，引发了许多粉丝理论。</p><p>一个流行的理论认为，卡芙卡不仅仅是星核猎手的一员，而是艾利欧更大计划中的关键人物。也许她是某个古老项目的一部分，甚至与某位星神直接相关。</p><p>她魅惑和操纵人们的能力也暗示了她超越普通命途的非凡力量。解开她的身份之谜可能成为理解整个游戏故事情节的关键。</p>"
    }
  },
  {
    id: 'theory-3',
    category: 'gameplay',
    title: {
      ru: "Оптимальные сборки для Вельта",
      en: "Optimal Builds for Welt",
      by: "Аптымальныя зборкі для Вэльта",
      jp: "ヴェルトの最適ビルド",
      de: "Optimale Builds für Welt",
      fr: "Les meilleurs builds pour Welt",
      zh: "瓦尔特的最佳构筑"
    },
    summary: {
      ru: "Гайд по лучшим реликвиям, световым конусам и командам для Вельта.",
      en: "Guide to the best Relics, Light Cones, and teams for Welt.",
      by: "Гайд па лепшых рэліквях, святловых конусах і камандах для Вэльта.",
      jp: "ヴェルトの最適な遺物、光円錐、チーム構成ガイド。",
      de: "Leitfaden für die besten Relikte, Lichtkegel und Teams für Welt.",
      fr: "Guide des meilleures reliques, cônes de lumière et équipes pour Welt.",
      zh: "瓦尔特的最佳遗物、光锥和队伍指南。"
    },
    content: {
      ru: "<p>Вельт — уникальный персонаж, способный накладывать дебаффы и контролировать противников. Для максимальной эффективности Вельта рекомендуется сосредоточиться на повышении его эффекта пробития и шанса попадания эффектов.</p><p><b>Реликвии:</b> Четыре части Сета Воровства Метеора для увеличения эффекта пробития или Сет Стрелка Дикого Запада для общего урона.</p><p><b>Световые конусы:</b> Его сигнатурный конус «Неважно, Эон ли это» является лучшим выбором. В качестве альтернативы подойдут «Зарождение Зари» или «Спокойной ночи и мирного сна».</p><p><b>Команды:</b> Вельт отлично сочетается с персонажами, которые извлекают выгоду из замедления и контроля противников, такими как Дань Хэн: Пожиратель Луны или Цзинлю.</p>",
      en: "<p>Welt is a unique character capable of applying debuffs and controlling enemies. For maximum effectiveness, Welt should focus on increasing his Break Effect and Effect Hit Rate.</p><p><b>Relics:</b> Four-piece Thief of Shooting Meteor for Break Effect or Wastelander of Banditry Desert for overall damage.</p><p><b>Light Cones:</b> His signature Light Cone 'In the Name of the World' is the best choice. Alternatives include 'Before Dawn' or 'Good Night and Sleep Well'.</p><p><b>Teams:</b> Welt pairs exceptionally well with characters who benefit from enemy slow and control, such as Dan Heng • Imbibitor Lunae or Jingliu.</p>",
      by: "<p>Вэльт — унікальны персанаж, здольны накладваць дэбафы і кантраляваць праціўнікаў. Для максімальнай эфектыўнасці Вэльта рэкамендуецца сканцэнтравацца на павелічэнні яго эфекту прабітця і шанса траплення эфектаў.</p><p><b>Рэліквіі:</b> Чатыры часткі Сэта Злодзеяў Метэора для павелічэння эфекту прабітця або Сэт Стралка Дзікага Захаду для агульнага ўрону.</p><p><b>Святловыя конусы:</b> Яго сігнатурны конус «Неважна, Эон гэта ці не» з'яўляецца лепшым выбарам. У якасці альтэрнатыў падыходзяць «Зараджэнне Зары» або «Спакойнай ночы і мірнага сну».</p><p><b>Каманды:</b> Вэльт выдатна спалучаецца з персанажамі, якія выцягваюць выгаду з запавольнення і кантролю праціўнікаў, такімі як Дань Хэн: Пажыральнік Месяца або Цзінлю.</p>",
      jp: "<p>ヴェルトは、デバフを付与し、敵をコントロールできるユニークなキャラクターです。ヴェルトの最大の効果を得るには、撃破特効と効果命中率を高めることに集中することをお勧めします。</p><p><b>遺物:</b> 撃破特効を増やすために「流星の跡を追う怪盗」4セット、または全体的なダメージのために「荒野の巡礼者」4セット。</p><p><b>光円錐:</b> 彼のシグネチャー光円錐「世界の名に」が最良の選択です。代替としては「夜明け前」や「おやすみと寝顔」が適しています。</p><p><b>チーム:</b> ヴェルトは、敵の減速やデバフから恩恵を受けるキャラクター、例えば丹恒・飲月や鏡流と非常に相性が良いです。</p>",
      de: "<p>Welt ist ein einzigartiger Charakter, der in der Lage ist, Debuffs anzuwenden und Gegner zu kontrollieren. Um die maximale Effektivität von Welt zu erzielen, sollte man sich darauf konzentrieren, seinen Bruch-Effekt und seine Effekttrefferchance zu erhöhen.</p><p><b>Relikte:</b> Vier Teile des Sets 'Dieb des Sternenglanzes' zur Erhöhung des Brucheffekts oder das Set 'Wanderer der Wüste' für den Gesamtschaden.</p><p><b>Lichtkegel:</b> Sein Signatur-Lichtkegel 'Im Namen der Welt' ist die beste Wahl. Alternativen sind 'Vor dem Morgengrauen' oder 'Gute Nacht und Schlaf gut'.</p><p><b>Teams:</b> Welt harmoniert außergewöhnlich gut mit Charakteren, die von der Verlangsamung und Kontrolle von Gegnern profitieren, wie Dan Heng • Imbibitor Lunae oder Jingliu.</p>",
      fr: "<p>Welt est un personnage unique capable d'appliquer des débuffs et de contrôler les ennemis. Pour une efficacité maximale, Welt doit se concentrer sur l'augmentation de son effet de Rupture et de son taux de coup d'effet.</p><p><b>Reliques :</b> Le set 'Voleur de Météore Filant' en quatre pièces pour l'effet de Rupture ou 'Pionnier du désert' pour les dégâts globaux.</p><p><b>Cônes de lumière :</b> Son cône de lumière signature 'Au nom du monde' est le meilleur choix. Les alternatives incluent 'Avant l'aube' ou 'Bonne nuit et dormez bien'.</p><p><b>Équipes :</b> Welt s'associe exceptionnellement bien avec des personnages qui bénéficient du ralentissement et du contrôle des ennemis, tels que Dan Heng • Imbibitor Lunae ou Jingliu.</p>",
      zh: "<p>瓦尔特是一个独特的角色，能够施加负面效果并控制敌人。为了使瓦尔特达到最大效用，建议专注于提高他的击破特攻和效果命中率。</p><p><b>遗物：</b>四件套'流星追迹的怪盗'以增加击破特攻，或四件套'荒漠的旅人'以增加整体伤害。</p><p><b>光锥：</b>他的专属光锥'世界之名'是最佳选择。替代品包括'拂晓之前'或'晚安与睡颜'。</p><p><b>队伍：</b>瓦尔特与那些受益于敌人减速和控制的角色配合得非常好，例如丹恒 • 饮月或镜流。</p>"
    }
  },
  {
    id: 'theory-4',
    category: 'lore',
    title: {
      ru: "Судьба Ярило-VI после Заморозки",
      en: "The Fate of Jarilo-VI After the Stellaron",
      by: "Лёс Ярыла-VI пасля Замарозкі",
      jp: "ヤリーロ-VIの星核除去後の運命",
      de: "Das Schicksal von Jarilo-VI nach dem Stellaron",
      fr: "Le destin de Jarilo-VI après le Stellaron",
      zh: "雅利洛-VI 在星核事件后的命运"
    },
    summary: {
      ru: "Что ждет планету и её жителей после снятия угрозы Стелларона?",
      en: "What awaits the planet and its inhabitants after the Stellaron threat is lifted?",
      by: "Што чакае планету і яе жыхароў пасля зняцця пагрозы Стэларона?",
      jp: "星核の脅威が取り除かれた後、惑星とその住民は何を待っているのか？",
      de: "Was erwartet den Planeten und seine Bewohner, nachdem die Stellaron-Bedrohung aufgehoben ist?",
      fr: "Qu'est-ce qui attend la planète et ses habitants après la levée de la menace du Stellaron ?",
      zh: "在星核威胁解除后，这个星球和它的居民将面临什么？"
    },
    content: {
      ru: "<p>Ярило-VI, планета, десятилетиями страдавшая от вечной мерзлоты, благодаря усилиям Первопроходца и Звездного Экспресса, наконец, освобождена от влияния Стелларона. Но что дальше?</p><p>Восстановление планеты будет долгим и трудным процессом. Инфраструктура разрушена, экосистема нарушена, и население нуждается в поддержке. Вероятнее всего, Ярило-VI станет важным союзником Звездного Экспресса и частью Межзвездного Мира.</p><p>Однако, остаются вопросы о скрытых фракциях и последствиях прошлых событий. Возможно, Мерзлота была не единственной угрозой, и новые вызовы ждут Ярило-VI в будущем.</p>",
      en: "<p>Jarilo-VI, a planet that suffered from eternal frost for decades, has finally been freed from the Stellaron's influence thanks to the efforts of the Trailblazer and the Astral Express. But what's next?</p><p>The planet's recovery will be a long and difficult process. Infrastructure is destroyed, the ecosystem is disrupted, and the population needs support. Most likely, Jarilo-VI will become an important ally of the Astral Express and a part of the Interastral Peace Corporation.</p><p>However, questions remain about hidden factions and the consequences of past events. Perhaps the Frost was not the only threat, and new challenges await Jarilo-VI in the future.</p>",
      by: "<p>Ярыла-VI, планета, якая дзесяцігоддзямі пакутавала ад вечнай мерзлаты, дзякуючы высілкам Першапраходца і Зорнага Экспрэса, нарэшце, вызвалена ад уплыву Стэларона. Але што далей?</p><p>Аднаўленне планеты будзе доўгім і цяжкім працэсам. Інфраструктура разбурана, экалогія парушана, і насельніцтва мае патрэбу ў падтрымцы. Верагодней за ўсё, Ярыла-VI стане важным саюзнікам Зорнага Экспрэса і часткай Міжзорнага Міру.</p><p>Аднак, застаюцца пытанні аб схаваных фракцыях і выніках мінулых падзей. Магчыма, Мерзлата была не адзінай пагрозай, і новыя выклікі чакаюць Ярыла-VI ў будучыні.</p>",
      jp: "<p>何十年にもわたって永遠の冬に苦しんできた惑星ヤリーロ-VIは、開拓者と星穹列車の努力により、ついに星核の影響から解放されました。しかし、次は何が起こるのでしょうか？</p><p>惑星の復興は長く困難なプロセスになるでしょう。インフラは破壊され、生態系は乱され、住民は支援を必要としています。ヤリーロ-VIは星穹列車にとって重要な同盟国となり、星間平和カンパニーの一部となる可能性が高いです。</p><p>しかし、隠れた勢力や過去の出来事の影響については疑問が残っています。おそらく霜だけが唯一の脅威ではなく、ヤリーロ-VIには将来新たな課題が待ち受けているでしょう。</p>",
      de: "<p>Jarilo-VI, ein Planet, der jahrzehntelang unter ewigem Frost litt, wurde dank der Bemühungen des Trailblazers und des Astral Expresses endlich vom Einfluss des Stellarons befreit. Aber was kommt als Nächstes?</p><p>Die Erholung des Planeten wird ein langer und schwieriger Prozess sein. Die Infrastruktur ist zerstört, das Ökosystem ist gestört, und die Bevölkerung benötigt Unterstützung. Es ist sehr wahrscheinlich, dass Jarilo-VI ein wichtiger Verbündeter des Astral Expresses und Teil der Interastralen Friedensgesellschaft wird.</p><p>Es bleiben jedoch Fragen zu versteckten Fraktionen und den Folgen vergangener Ereignisse. Vielleicht war der Frost nicht die einzige Bedrohung, und neue Herausforderungen warten in der Zukunft auf Jarilo-VI.</p>",
      fr: "<p>Jarilo-VI, une planète qui a souffert du gel éternel pendant des décennies, a finalement été libérée de l'influence du Stellaron grâce aux efforts de l'Explorateur et de l'Astral Express. Mais que se passe-t-il ensuite ?</p><p>La récupération de la planète sera un processus long et difficile. Les infrastructures sont détruites, l'écosystème est perturbé et la population a besoin de soutien. Très probablement, Jarilo-VI deviendra un allié important de l'Astral Express et une partie de l'Interastral Peace Corporation.</p><p>Cependant, des questions subsistent sur les factions cachées et les conséquences des événements passés. Le gel n'était peut-être pas la seule menace, et de nouveaux défis attendent Jarilo-VI à l'avenir.</p>",
      zh: "<p>雅利洛-VI，一个遭受了数十年永恒寒冬的星球，在开拓者和星穹列车的努力下，终于从星核的影响中解脱出来。但接下来会发生什么？</p><p>星球的恢复将是一个漫长而艰难的过程。基础设施被摧毁，生态系统被破坏，居民需要支持。雅利洛-VI很可能会成为星穹列车的重要盟友，并成为星际和平公司的一部分。</p><p>然而，关于隐藏派系和过去事件后果的问题仍然存在。也许寒霜不是唯一的威胁，新的挑战在未来等待着雅利洛-VI。</p>"
    }
  },
  {
    id: 'theory-5',
    category: 'characters',
    title: {
      ru: "Загадка Блэйда: Бессмертие и его цена",
      en: "Blade's Enigma: Immortality and Its Price",
      by: "Загадка Блэйда: Бессмяротнасць і яе цана",
      jp: "ブレイドの謎: 不死とその代償",
      de: "Blades Rätsel: Unsterblichkeit und ihr Preis",
      fr: "L'énigme de Blade : l'immortalité et son prix",
      zh: "刃的谜团：不死与代价"
    },
    summary: {
      ru: "Исследование природы бессмертия Блэйда и его последствий.",
      en: "An exploration of the nature of Blade's immortality and its consequences.",
      by: "Даследаванне прыроды бессмяротнасці Блэйда і яе вынікаў.",
      jp: "ブレイドの不死の性質とその結果の探求。",
      de: "Eine Untersuchung der Natur von Blades Unsterblichkeit und ihrer Konsequenzen.",
      fr: "Une exploration de la nature de l'immortalité de Blade et de ses conséquences.",
      zh: "探讨刃的不死本质及其后果。"
    },
    content: {
      ru: "<p>Блэйд — один из самых трагичных персонажей в HSR, обреченный на бессмертие, которое приносит ему лишь страдания. Его состояние, известное как 'Увядающее тело', является результатом экспериментов или проклятия.</p><p>Теории о его бессмертии связывают его с Денгом Хэном и событиями на Сяньчжоу Лофу, намекая на глубокую связь с историей Неразрушимого. Возможно, его бессмертие — это не благословение, а наказание за прошлые грехи.</p><p>Поиск лекарства от его проклятия или способ умереть с достоинством, вероятно, станет центральной темой его сюжетной линии, раскрывая новые грани мира HSR и его темной стороны.</p>",
      en: "<p>Blade is one of the most tragic characters in HSR, condemned to an immortality that brings him only suffering. His condition, known as 'Mara-Struck', is the result of experiments or a curse.</p><p>Theories about his immortality link him to Dan Feng and the events on Xianzhou Luofu, hinting at a deep connection to the history of the Vidyadhara. Perhaps his immortality is not a blessing, but a punishment for past sins.</p><p>The search for a cure for his curse, or a way to die with dignity, will likely become a central theme of his storyline, revealing new facets of the HSR world and its darker side.</p>",
      by: "<p>Блэйд — адзін з самых трагічных персанажаў у HSR, асуджаны на бессмяротнасць, якая прыносіць яму толькі пакуты. Яго стан, вядомы як 'Увядаючае цела', з'яўляецца вынікам эксперыментаў або праклёну.</p><p>Тэорыі аб яго бессмяротнасці звязваюць яго з Дэнг Хэнам і падзеямі на Сяньчжоу Лофу, намякаючы на глыбокую сувязь з гісторыяй Неразрушальнага. Магчыма, яго бессмяротнасць — гэта не благаславенне, а пакаранне за мінулыя грахі.</p><p>Пошук лекі ад яго праклёну або способ памерці з годнасцю, верагодна, стане цэнтральнай тэмай яго сюжэтнай лініі, раскрываючы новыя грані свету HSR і яго цёмнай боку.</p>",
      jp: "<p>ブレイドはHSRで最も悲劇的なキャラクターの一人であり、彼に苦しみをもたらす不死を運命づけられています。彼の状態は「魔陰の身」として知られ、実験または呪いの結果です。</p><p>彼の不死に関する理論は、彼を丹恒と仙舟羅浮での出来事と結びつけ、持明族の歴史との深いつながりを示唆しています。おそらく、彼の不死は祝福ではなく、過去の罪に対する罰なのです。</p><p>彼の呪いを治療する方法、あるいは尊厳を持って死ぬ方法を探すことが、彼のストーリーラインの中心的なテーマとなり、HSRの世界とその暗い側面を明らかにすることになるでしょう。</p>",
      de: "<p>Blade ist einer der tragischsten Charaktere in HSR, verdammt zu einer Unsterblichkeit, die ihm nur Leid zufügt. Sein Zustand, bekannt als 'Mara-Struck', ist das Ergebnis von Experimenten oder eines Fluchs.</p><p>Theorien über seine Unsterblichkeit bringen ihn mit Dan Feng und den Ereignissen auf Xianzhou Luofu in Verbindung und deuten auf eine tiefe Verbindung zur Geschichte des Vidyadhara hin. Vielleicht ist seine Unsterblichkeit kein Segen, sondern eine Strafe für vergangene Sünden.</p><p>Die Suche nach einem Heilmittel für seinen Fluch oder einem Weg, in Würde zu sterben, wird wahrscheinlich ein zentrales Thema seiner Handlung werden und neue Facetten der HSR-Welt und ihrer dunklen Seite offenbaren.</p>",
      fr: "<p>Blade est l'un des personnages les plus tragiques de HSR, condamné à une immortalité qui ne lui apporte que de la souffrance. Son état, connu sous le nom de 'Mara-Struck', est le résultat d'expériences ou d'une malédiction.</p><p>Les théories sur son immortalité le lient à Dan Feng et aux événements de Xianzhou Luofu, suggérant une connexion profonde avec l'histoire des Vidyadhara. Peut-être que son immortalité n'est pas une bénédiction, mais une punition pour des péchés passés.</p><p>La recherche d'un remède à sa malédiction, ou d'un moyen de mourir avec dignité, deviendra probablement un thème central de son histoire, révélant de nouvelles facettes du monde HSR et de son côté plus sombre.</p>",
      zh: "<p>刃是《崩坏：星穹铁道》中最悲剧的角色之一，他被诅咒获得永生，却只给他带来痛苦。他这种被称为魔阴身的状态，是实验或诅咒的结果。</p><p>关于他永生的理论将他与丹恒和仙舟罗浮的事件联系起来，暗示他与持明族的悠久历史有着深层联系。也许他的永生不是一种祝福，而是对他过往罪孽的惩罚。</p><p>寻找治愈他诅咒的方法，或者一个有尊严地死去的方式，很可能成为他的故事情节的核心主题，揭示出HSR世界及其黑暗面的新面貌。</p>"
    }
  },
  {
    id: 'theory-6',
    category: 'gameplay',
    title: {
      ru: "Стратегии для нового режима: Чистый Вымысел",
      en: "Strategies for the New Mode: Pure Fiction",
      by: "Стратэгіі для новага рэжыму: Pure Fiction",
      jp: "新モード Pure Fiction の戦略",
      de: "Strategien für den neuen Modus: Pure Fiction",
      fr: "Stratégies pour le nouveau mode : Pure Fiction",
      zh: "新模式 Pure Fiction 的策略"
    },
    summary: {
      ru: "Советы по прохождению сложных этапов в Pure Fiction с фокусом на DPS и поддержку.",
      en: "Tips for tackling challenging stages in Pure Fiction with a focus on DPS and support.",
      by: "Саветы па праходжанні складаных этапаў у Pure Fiction з фокусам на DPS і падтрымку.",
      jp: "Pure Fiction の難しいステージを攻略するためのヒント、DPS とサポートに焦点。",
      de: "Tipps zum Bewältigen anspruchsvoller Stages in Pure Fiction mit Fokus auf DPS und Support.",
      fr: "Conseils pour aborder les étapes difficiles de Pure Fiction avec un accent sur DPS et support.",
      zh: "Pure Fiction 挑战阶段的攻略提示，重点关注 DPS 和辅助。"
    },
    content: {
      ru: "<p>Pure Fiction — это новый игровой режим, требующий быстрого переключения команд и оптимизации ротаций. Для успеха сосредоточьтесь на персонажах с высоким AoE-уроном, таких как Топаз или Фаенон.</p><p><b>Советы:</b> Используйте реликвии с фокусом на скорость и критический урон. Команды с двойным DPS работают лучше всего.</p><p><b>Пример команды:</b> Топаз (основной DPS), Робин (поддержка), Рваная (дебаффер) и Люк (хилер).</p><p>Этот режим идеален для фарминга реликвий и тестирования новых сборок.</p>",
      en: "<p>Pure Fiction is a new game mode requiring quick team switches and optimized rotations. For success, focus on characters with high AoE damage, like Topaz or Feixiao.</p><p><b>Tips:</b> Use relics focused on speed and crit damage. Double DPS teams work best.</p><p><b>Example Team:</b> Topaz (main DPS), Robin (support), Ruan Mei (debuffer), and Lingsha (healer).</p><p>This mode is perfect for relic farming and testing new builds.</p>",
      by: "<p>Pure Fiction — гэта новы ігровы рэжым, які патрабуе хуткага пераключэньня каманд і аптымізацыі ротацыяў. Для паспеху сканцэнтруйцеся на персанажах з высокім AoE-урон, такіх як Топаз або Фэйсяо.</p><p><b>Саветы:</b> Выкарыстоўвайце рэліквіі з фокусам на хуткасць і крытычны ўрон. Каманды з двойным DPS працуюйце лепей за ўсё.</p><p><b>Прыклад каманды:</b> Топаз (галоўны DPS), Робін (падтрымка), Руань Мэй (дэбаффер) і Лінша (хілер).</p><p>Гэты рэжым ідэальны для фармінгу рэліквій і тэставаньня новых зборак.</p>",
      jp: "<p>Pure Fiction は、チームの素早い切り替えと最適化されたローテーションを必要とする新しいゲームモードです。成功のためには、トパーズや飛霄のような高い AoE ダメージのキャラクターに焦点を当ててください。</p><p><b>ヒント:</b> 速度とクリティカルダメージに焦点を当てた遺物を装備。ダブル DPS チームが最適です。</p><p><b>例のチーム:</b> トパーズ (メイン DPS)、ロビン (サポート)、ルアン・メイ (デバフ)、リンシャ (ヒーラー)。</p><p>このモードは遺物のファーミングと新しいビルドのテストに最適です。</p>",
      de: "<p>Pure Fiction ist ein neuer Spielmodus, der schnelle Teamwechsel und optimierte Rotationen erfordert. Für Erfolg konzentrieren Sie sich auf Charaktere mit hohem AoE-Schaden, wie Topaz oder Feixiao.</p><p><b>Tipps:</b> Relikte mit Fokus auf Geschwindigkeit und Krit-Schaden verwenden. Doppel-DPS-Teams funktionieren am besten.</p><p><b>Beispiel-Team:</b> Topaz (Haupt-DPS), Robin (Support), Ruan Mei (Debuffer) und Lingsha (Heiler).</p><p>Dieser Modus ist ideal zum Farmen von Relikten und Testen neuer Builds.</p>",
      fr: "<p>Pure Fiction est un nouveau mode de jeu nécessitant des changements d'équipe rapides et des rotations optimisées. Pour réussir, concentrez-vous sur des personnages à haut dégât AoE, comme Topaz ou Feixiao.</p><p><b>Conseils :</b> Utilisez des reliques axées sur la vitesse et les dégâts critiques. Les équipes double DPS fonctionnent le mieux.</p><p><b>Exemple d'équipe :</b> Topaz (DPS principal), Robin (support), Ruan Mei (débuffeur), et Lingsha (soigneur).</p><p>Ce mode est parfait pour farmer des reliques et tester de nouvelles configurations.</p>",
      zh: "<p>Pure Fiction 是一个需要快速切换队伍和优化轮转的新游戏模式。为了成功，专注于高范围伤害角色，如托帕兹或飞霄。</p><p><b>提示：</b> 使用专注于速度和暴击伤害的遗物。双 DPS 队伍效果最佳。</p><p><b>示例队伍：</b> 托帕兹 (主 DPS)、罗宾 (辅助)、阮·梅 (减益者) 和灵莎 (治疗者)。</p><p>这个模式非常适合刷遗物和测试新配置。</p>"
    }
  },
  {
    id: 'theory-7',
    category: 'lore',
    title: {
      ru: "Загадка Звездного Экспресса: История путешествий",
      en: "The Mystery of the Astral Express: A History of Travel",
      by: "Загадка Зорнага Экспрэса: Гісторыя падарожжаў",
      jp: "星穹列車の謎：旅の歴史",
      de: "Das Geheimnis des Astral Express: Eine Reisegeschichte",
      fr: "Le mystère de l'Astral Express : Une histoire de voyage",
      zh: "星穹列车的谜团：旅行史"
    },
    summary: {
      ru: "Исследование происхождения Звездного Экспресса и его роли в космосе.",
      en: "An exploration of the Astral Express's origin and its role in the cosmos.",
      by: "Даследаванне паходжання Зорнага Экспрэса і яго ролі ў космасе.",
      jp: "星穹列車の起源と宇宙での役割の探求。",
      de: "Eine Untersuchung des Ursprungs des Astral Express und seiner Rolle im Kosmos.",
      fr: "Une exploration de l'origine de l'Astral Express et de son rôle dans le cosmos.",
      zh: "探讨星穹列车的起源及其在宇宙中的作用。"
    },
    content: {
      ru: "<p>Звездный Экспресс — это не просто средство передвижения, а символ надежды и связи между мирами. Созданный Эоном Акивили, Экспресс продолжает свое путешествие даже после исчезновения своего создателя.</p><p>Каждый вагон Экспресса хранит свою историю, каждый пассажир приносит с собой новую судьбу. Пом-Пом, проводник Экспресса, является хранителем его традиций и памяти.</p><p>Теории о том, куда направляется Экспресс, бесконечны. Возможно, он ищет своего создателя, или же выполняет его последнее желание — связать все миры вместе.</p>",
      en: "<p>The Astral Express is not just a means of transportation, but a symbol of hope and connection between worlds. Created by the Aeon Akivili, the Express continues its journey even after its creator's disappearance.</p><p>Each car of the Express holds its own story, each passenger brings with them a new destiny. Pom-Pom, the Express's conductor, is the keeper of its traditions and memories.</p><p>Theories about where the Express is heading are endless. Perhaps it seeks its creator, or perhaps it fulfills their last wish—to connect all worlds together.</p>",
      by: "<p>Зорны Экспрэс — гэта не проста сродак перамяшчэння, а сімвал надзеі і сувязі паміж светамі. Створаны Эонам Аківілі, Экспрэс працягвае сваё падарожжа нават пасля знікнення свайго стваральніка.</p><p>Кожны вагон Экспрэса трымае сваю гісторыю, кожны пасажыр прыносіць з сабой новы лёс. Пом-Пом, праваднік Экспрэса, з'яўляецца захавальнікам яго традыцый і памяці.</p><p>Тэорыі аб тым, куды накіроўваецца Экспрэс, бясконцыя. Магчыма, ён шукае свайго стваральніка, або ж выконвае яго апошняе жаданне — звязаць усе светы разам.</p>",
      jp: "<p>星穹列車は単なる移動手段ではなく、希望と世界間のつながりの象徴です。星神アキヴィリによって作られた列車は、創造者の消失後も旅を続けています。</p><p>各車両にはそれぞれの物語があり、各乗客は新しい運命をもたらします。列車の車掌ポンポンは、その伝統と記憶の守護者です。</p><p>列車の行き先についての理論は尽きません。おそらく、それは創造者を探しているか、あるいは最後の願いを果たしているのかもしれません—すべての世界を結びつけること。</p>",
      de: "<p>Der Astral Express ist nicht nur ein Transportmittel, sondern ein Symbol der Hoffnung und Verbindung zwischen Welten. Geschaffen vom Äon Akivili, setzt der Express seine Reise auch nach dem Verschwinden seines Schöpfers fort.</p><p>Jeder Wagen des Express hält seine eigene Geschichte, jeder Passagier bringt ein neues Schicksal mit sich. Pom-Pom, der Schaffner des Express, ist der Hüter seiner Traditionen und Erinnerungen.</p><p>Theorien darüber, wohin der Express steuert, sind endlos. Vielleicht sucht er seinen Schöpfer, oder vielleicht erfüllt er deren letzten Wunsch—alle Welten miteinander zu verbinden.</p>",
      fr: "<p>L'Astral Express n'est pas seulement un moyen de transport, mais un symbole d'espoir et de connexion entre les mondes. Créé par l'Éon Akivili, l'Express continue son voyage même après la disparition de son créateur.</p><p>Chaque wagon de l'Express détient sa propre histoire, chaque passager apporte avec lui un nouveau destin. Pom-Pom, le conducteur de l'Express, est le gardien de ses traditions et de ses souvenirs.</p><p>Les théories sur la destination de l'Express sont infinies. Peut-être cherche-t-il son créateur, ou peut-être accomplit-il leur dernier souhait—connecter tous les mondes ensemble.</p>",
      zh: "<p>星穹列车不仅是一种交通工具，更是希望和世界间联系的象征。由星神阿基维利创造的列车，即使在创造者消失后仍继续其旅程。</p><p>每节车厢都有自己的故事，每位乘客都带来新的命运。列车车长邦布，是列车传统和记忆的守护者。</p><p>关于列车去向的理论无穷无尽。也许它在寻找它的创造者，或者它在实现他们的最后愿望——将所有世界连接在一起。</p>"
    }
  }
];

export interface BlogPost {
  id: string;
  category: 'updates' | 'personal';
  title: LocalizedString;
  summary: LocalizedString;
  content: LocalizedString;
}

export const blogPostsData: BlogPost[] = [
  {
    id: 'blog-1',
    category: 'updates',
    title: {
      ru: "ОБНОВЛЕНИЕ BETA-V02",
      en: "UPDATE BETA-V02",
      by: "АБНАЎЛЕННЕ BETA-V02",
      jp: "アップデート BETA-V02",
      de: "UPDATE BETA-V02",
      fr: "MISE À JOUR BETA-V02",
      zh: "更新 BETA-V02"
    },
    summary: {
      ru: "Технический отчет: 59 исправлений безопасности, полная автоматизация контента, локализация и расширение платформы.",
      en: "Technical report: 59 security patches, full content automation, localization, and platform expansion.",
      by: "Тэхнічная справаздача: 59 выпраўленняў бяспекі, поўная аўтаматызацыя кантэнту і пашырэнне платформы.",
      jp: "テクニカルレポート：59のセキュリティパッチ、コンテンツの完全自動化、およびプラットフォームの拡張。",
      de: "Technischer Bericht: 59 Sicherheitspatches, vollständige Inhaltsautomatisierung und Plattformerweiterung.",
      fr: "Rapport technique : 59 correctifs de sécurité, automatisation complète du contenu et extension de la plateforme.",
      zh: "技术报告：59 个安全补丁、内容全自动化以及平台扩展。"
    },
    content: {
      ru: "<b>[ ТЕХНИЧЕСКИЕ ИЗМЕНЕНИЯ ]</b><hr><ul><li><b>БЕЗОПАСНОСТЬ:</b> Устранено 59 уязвимостей нулевого дня <code>(0-day)</code>.</li><li><b>АВТОНОМНОСТЬ:</b> Обновление Виртуальной вселенной и Валютных войн теперь происходит автоматически.</li><li><b>ТАЙМИНГ:</b> Переработан алгоритм подсчета времени с поддержкой локальных часовых поясов.</li><li><b>ЛОКАЛИЗАЦИЯ:</b> Интегрированы немецкий и китайский языки. Проведена коррекция существующих переводов.</li></ul><hr><b>[ ИНТЕРФЕЙС И КОНТЕНТ ]</b><ul><li>Полный редизайн визуальной составляющей.</li><li>Добавлен раздел актуальных промокодов и новые статьи.</li><li>Реализована ссылка на мой <code>GitHub</code> профиль.</li><li>Поддержка классического <code>Web-app</code> завершена на 90%.</li></ul><hr><p>クルシーP</p>",
      en: "<b>[ TECHNICAL CHANGES ]</b><hr><ul><li><b>SECURITY:</b> I fixed 59 zero-day vulnerabilities <code>(0-day)</code>.</li><li><b>AUTONOMY:</b> Updates for Simulated Universe and Currency Wars are now fully automated.</li><li><b>TIMING:</b> Re-engineered time calculation algorithm with local timezone support.</li><li><b>LOCALIZATION:</b> Integrated German and Chinese languages. Refined existing translations.</li></ul><hr><b>[ UI & CONTENT ]</b><ul><li>Complete visual interface redesign.</li><li>Added active promo codes section and new articles.</li><li>Implemented <code>GitHub</code> link in the profile/footer.</li><li>Classic <code>Web-app</code> support is 90% complete.</li></ul><hr><p>クルシーP</p>",
      by: "<b>[ ТЭХНІЧНЫЯ ЗМЕНЫ ]</b><hr><ul><li><b>БЯСПЕКА:</b> Я выправіў 59 уразлівасцяў нулявога дня <code>(0-day)</code>.</li><li><b>АЎТАНОМНАСЦЬ:</b> Абнаўленне Віртуальнага сусвету і Валютных войнаў цяпер адбываецца аўтаматычна.</li><li><b>ТАЙМІНГ:</b> Перапрацаваны алгарытм падліку часу з падтрымкай часавых паясоў.</li><li><b>ЛАКАЛІЗАЦЫЯ:</b> Дададзены нямецкая і кітайская мовы. Палепшаны бягучыя пераклады.</li></ul><hr><b>[ ІНТЭРФЕЙС І КАНТЭНТ ]</b><ul><li>Поўны рэдызайн візуальнай часткі.</li><li>Дададзены раздзел актуальных промакодаў і новыя артыкулы.</li><li>Рэалізавана спасылка на мой <code>GitHub</code>.</li><li>Падтрымка класічнага <code>Web-app</code> завершана на 90%.</li></ul><hr><p>クルシーP</p>",
      jp: "<b>[ 技術的な変更点 ]</b><hr><ul><li><b>セキュリティ：</b>59個のゼロデイ脆弱性 <code>(0-day)</code> を修正しました。</li><li><b>自動化：</b>「模擬宇宙」と「通貨戦争」の更新が完全に自動化されました。</li><li><b>タイミング：</b>ローカルタイムゾーンをサポートする時間計算アルゴリズムを再設計。</li><li><b>ローカライズ：</b>ドイツ語と中国語を統合。既存の翻訳を修正。</li></ul><hr><b>[ UI & コンテンツ ]</b><ul><li>ビジュアルインターフェースの完全なリデザイン。</li><li>有効なプロモーションコードセクションと新しい記事を追加。</li><li>プロフィールの <code>GitHub</code> リンクを実装。</li><li>クラシック <code>Web-app</code> のサポートが90%完了。</li></ul><hr><p>クルシーP</p>",
      de: "<b>[ TECHNISCHE ÄNDERUNGEN ]</b><hr><ul><li><b>SICHERHEIT:</b> Ich habe 59 Zero-Day-Schwachstellen <code>(0-day)</code> behoben.</li><li><b>AUTONOMIE:</b> Aktualisierungen für Simulated Universe und Währungskriege erfolgen jetzt automatisch.</li><li><b>TIMING:</b> Zeitberechnungsalgorithmus mit lokaler Zeitzonenunterstützung überarbeitet.</li><li><b>LOKALISIERUNG:</b> Deutsche und chinesische Sprachen integriert. Bestehende Übersetzungen verfeinert.</li></ul><hr><b>[ UI & INHALT ]</b><ul><li>Vollständiges Redesign der visuellen Benutzeroberfläche.</li><li>Bereich für aktive Promo-Codes und neue Artikel hinzugefügt.</li><li><code>GitHub</code>-Link im Profil implementiert.</li><li>Unterstützung für klassische <code>Web-app</code> zu 90% abgeschlossen.</li></ul><hr><p>クルシーP</p>",
      fr: "<b>[ CHANGEMENTS TECHNIQUES ]</b><hr><ul><li><b>SÉCURITÉ :</b> J'ai corrigé 59 vulnérabilités zero-day <code>(0-day)</code>.</li><li><b>AUTONOMIE :</b> Les mises à jour de l'Univers Simulé et des Guerres Monétaires sont désormais automatisées.</li><li><b>TIMING :</b> Algorithme de calcul du temps refait avec support du fuseau horaire local.</li><li><b>LOCALISATION :</b> Langues allemande et chinoise intégrées. Traductions existantes affinées.</li></ul><hr><b>[ UI & CONTENU ]</b><ul><li>Refonte complète de l'interface visuelle.</li><li>Ajout d'une section codes promo actifs et de nouveaux articles.</li><li>Lien <code>GitHub</code> ajouté dans le profil.</li><li>Le support de la <code>Web-app</code> classique est achevé à 90%.</li></ul><hr><p>クルシーP</p>",
      zh: "<b>[ 技术更新 ]</b><hr><ul><li><b>安全：</b>我修复了 59 个零日漏洞 <code>(0-day)</code>。</li><li><b>自动化：</b>“模拟宇宙”和“货币战争”现在实现全自动更新。</li><li><b>时间系统：</b>重构了支持本地时区的时间计算算法。</li><li><b>本地化：</b>整合了德语和中文。优化了现有翻译。</li></ul><hr><b>[ 界面与内容 ]</b><ul><li>视觉界面全面重构。</li><li>新增礼包码板块及新文章。</li><li>个人资料页中新增 <code>GitHub</code> 链接。</li><li>经典 <code>Web-app</code> 支持已完成 90%。</li></ul><hr><p>クルシーP</p>"
    }
  }
];

export interface PromoCode {
  code: string;
  rewards: LocalizedString;
  status: 'active' | 'expired';
}

export const promoCodesData: PromoCode[] = [
  {
    code: "CB2RUY7Y2P9B",
    rewards: {
      ru: "Звёздный нефрит ×50",
      en: "Stellar Jade ×50",
      by: "Зорныя нефрыты ×50",
      jp: "星玉 ×50",
      de: "Sternen-Jade ×50",
      fr: "Jades stellaires ×50",
      zh: "星琼 ×50"
    },
    status: "active"
  },
  {
    code: "4TJ9UZ7Z36N7",
    rewards: {
      ru: "Звёздный нефрит ×50, Кредиты ×10000",
      en: "Stellar Jade ×50, Credits ×10000",
      by: "Зорныя нефрыты ×50, Крэдыты ×10000",
      jp: "星玉 ×50, クレジット ×10000",
      de: "Sternen-Jade ×50, Credits ×10000",
      fr: "Jades stellaires ×50, Crédits ×10000",
      zh: "星琼 ×50, 信用点 ×10000"
    },
    status: "active"
  },
  {
    code: "THEDAHLIA",
    rewards: {
      ru: "Путеводитель путешественника ×3, Грёзный сироп ×2",
      en: "Traveler's Guide ×3, Dreamy Syrup ×2",
      by: "Дапаможнік вандроўніка ×3, Грозны сіроп ×2",
      jp: "漫遊指南 ×3, 夢見るシロップ ×2",
      de: "Reisetagebuch des Reisenden ×3, Traumsirup ×2",
      fr: "Guide du voyageur ×3, Sirop onirique ×2",
      zh: "漫游指南 ×3, 甜梦糖浆 ×2"
    },
    status: "active"
  },
  {
    code: "OMEGA",
    rewards: {
      ru: "Звёздный нефрит ×60, Топливо ×1",
      en: "Stellar Jade ×60, Fuel ×1",
      by: "Зорныя нефрыты ×60, Паліва ×1",
      jp: "星玉 ×60, 燃料 ×1",
      de: "Sternen-Jade ×60, Treibstoff ×1",
      fr: "Jades stellaires ×60, Carburant ×1",
      zh: "星琼 ×60, 燃料 ×1"
    },
    status: "active"
  },
  {
    code: "STORYOFLOVE",
    rewards: {
      ru: "Путеводитель путешественника ×3, Скрижаль Оронис ×2",
      en: "Traveler's Guide ×3, Oronis Tablet ×2",
      by: "Дапаможнік вандроўніка ×3, Скрыжаль Ароніс ×2",
      jp: "漫遊指南 ×3, オロニス・タブレット ×2",
      de: "Reisetagebuch des Reisenden ×3, Oronis-Tafel ×2",
      fr: "Guide du voyageur ×3, Tablette d'Oronis ×2",
      zh: "漫游指南 ×3, 奥罗尼斯石板 ×2"
    },
    status: "active"
  },
  {
    code: "CREATIONNYMPH",
    rewards: {
      ru: "Звёздный нефрит ×60, Топливо ×1, Переменная героя ×1",
      en: "Stellar Jade ×60, Fuel ×1, Hero's Variable ×1",
      by: "Зорныя нефрыты ×60, Паліва ×1, Пераменная героя ×1",
      jp: "星玉 ×60, 燃料 ×1, 英雄の変数 ×1",
      de: "Sternen-Jade ×60, Treibstoff ×1, Helden-Variable ×1",
      fr: "Jades stellaires ×60, Carburant ×1, Variable du héros ×1",
      zh: "星琼 ×60, 燃料 ×1, 英雄变量 ×1"
    },
    status: "active"
  },
  {
    code: "FAREWELL",
    rewards: {
      ru: "Звёздный нефрит ×60, Топливо ×1",
      en: "Stellar Jade ×60, Fuel ×1",
      by: "Зорныя нефрыты ×60, Паліва ×1",
      jp: "星玉 ×60, 燃料 ×1",
      de: "Sternen-Jade ×60, Treibstoff ×1",
      fr: "Jades stellaires ×60, Carburant ×1",
      zh: "星琼 ×60, 燃料 ×1"
    },
    status: "active"
  },
  {
    code: "5S6ZHRWTDNJB",
    rewards: {
      ru: "Звёздный нефрит ×60",
      en: "Stellar Jade ×60",
      by: "Зорныя нефрыты ×60",
      jp: "星玉 ×60",
      de: "Sternen-Jade ×60",
      fr: "Jades stellaires ×60",
      zh: "星琼 ×60"
    },
    status: "active"
  },
  {
    code: "4TKSX77Y58QK",
    rewards: {
      ru: "Звёздный нефрит ×30, Опыт ×3, Эфир ×5, Частицы ×4, Кредиты ×20000",
      en: "Jade ×30, Guide ×3, Ether ×5, Gold Fragments ×4, Credits ×20000",
      by: "Нефрыт ×30, Вопыт ×3, Эфір ×5, Часціцы ×4, Крэдыты ×20000",
      jp: "星玉 ×30, 漫遊指南 ×3, 精製エーテル ×5, 遺失金塊 ×4, クレジット ×20000",
      de: "Jade ×30, Tagebuch ×3, Äther ×5, Goldpartikel ×4, Credits ×20000",
      fr: "Jade ×30, Guide ×3, Éther ×5, Particules d'or ×4, Crédits ×20000",
      zh: "星琼 ×30, 漫游指南 ×3, 提纯以太 ×5, 遗失金块 ×4, 信用点 ×20000"
    },
    status: "active"
  },
  {
    code: "STARRAILGIFT",
    rewards: {
      ru: "Звёздный нефрит ×50, Путеводитель ×2, Газировка ×5, Кредиты ×10000",
      en: "Stellar Jade ×50, Traveler's Guide ×2, Bottled Soda ×5, Credits ×10000",
      by: "Зорныя нефрыты ×50, Дапаможнік ×2, Газіроўка ×5, Крэдыты ×10000",
      jp: "星玉 ×50, 漫遊指南 ×2, ソーダ水 ×5, クレジット ×10000",
      de: "Sternen-Jade ×50, Tagebuch ×2, Sprudelwasser ×5, Credits ×10000",
      fr: "Jades stellaires ×50, Guide ×2, Soda ×5, Crédits ×10000",
      zh: "星琼 ×50, 漫游指南 ×2, 苏打豆奶 ×5, 信用点 ×10000"
    },
    status: "active"
  }
];

export interface GameEvent {
  id: string;
  icon: string;
  title: LocalizedString;
  description: LocalizedString;
  type: 'daily' | 'weekly' | 'one-time';
  timeStr?: string; // HH:MM:SS in UTC
  dayOfWeek?: number; // 0-6 (Sun-Sat)
  weekOffset?: number; // 0 for even weeks, 1 for odd weeks
  startDate?: string; // ISO string
  endDate?: string; // ISO string
}

export const eventsData: GameEvent[] = [
  {
    id: 'event-1',
    icon: 'refresh-cw',
    title: {
      ru: "Ежедневное обновление",
      en: "Daily Reset",
      by: "Штодзённае абнаўленне",
      jp: "毎日のリセット",
      de: "Tägliches Reset",
      fr: "Réinitialisation quotidienne",
      zh: "每日刷新"
    },
    description: {
      ru: "Ежедневное обновление происходит каждый день в 08:00 по местному времени. Сброс ежедневных миссий, наград и лимитов.",
      en: "Daily reset occurs every day at 08:00 local time. Resets daily missions, rewards and limits.",
      by: "Штодзённае абнаўленне адбываецца кожны дзень у 08:00 па мясцовым часе. Скід штодзённых місій, узнагарод і лімітаў.",
      jp: "毎日のリセットは毎日現地時間08:00に行われます。デイリーミッション、報酬、制限のリセット。",
      de: "Tägliches Reset findet jeden Tag um 08:00 Ortszeit statt. Setzt tägliche Missionen, Belohnungen und Limits zurück.",
      fr: "Réinitialisation quotidienne a lieu tous les jours à 08:00 heure locale. Réinitialise les missions quotidiennes, récompenses et limites.",
      zh: "每日刷新时间为当地时间 08:00。重置每日任务、奖励和限制。"
    },
    type: 'daily',
    timeStr: "08:00:00"
  },
  {
    id: 'event-2',
    icon: 'swords',
    title: {
      ru: "Валютные войны",
      en: "Currency Wars",
      by: "Валютныя вайны",
      jp: "通貨戦争",
      de: "Währungskriege",
      fr: "Guerres Monétaires",
      zh: "货币战争"
    },
    description: {
      ru: "Валютные войны обновляются раз в две недели в 8:00 по местному времени, чередуясь с Виртуальной вселенной.",
      en: "Currency wars update every two weeks at 8:00 local time, alternating with the Simulated Universe.",
      by: "Валютныя вайны абнаўляюцца раз на два тыдні ў 8:00 па мясцовым часе, чаргуючыся з Віртуальным сусветам.",
      jp: "通貨戦争は現地時間8:00に2週間ごとに更新され、模擬宇宙と交互に行われます。",
      de: "Währungskriege werden alle zwei Wochen um 8:00 Uhr Ortszeit aktualisiert und wechseln sich mit dem Simulierten Universum ab.",
      fr: "Les guerres de devises sont mises à jour toutes les deux semaines à 8h00, heure locale, en alternance avec l'Univers Simulé.",
      zh: "货币战争每两周在当地时间8:00更新一次，与模拟宇宙交替进行。"
    },
    type: 'weekly',
    dayOfWeek: 1,
    weekOffset: 0,
    timeStr: "08:00:00"
  },
  {
    id: 'event-3',
    icon: 'globe',
    title: {
      ru: "Виртуальная Вселенная",
      en: "Simulated Universe",
      by: "Віртуальны Сусвет",
      jp: "模擬宇宙",
      de: "Simulated Universe",
      fr: "Univers Simulé",
      zh: "模拟宇宙"
    },
    description: {
      ru: "Виртуальная вселенная обновляется раз в две недели в 8:00 по местному времени, чередуясь с Валютными войнами.",
      en: "The Simulated Universe updates every two weeks at 8:00 local time, alternating with Currency Wars.",
      by: "Віртуальны сусвет абнаўляецца раз на два тыдні ў 8:00 па мясцовым часе, чаргуючыся з Валютнымі войнамі.",
      jp: "模擬宇宙は現地時間8:00に2週間ごとに更新され、通貨戦争と交互に行われます。",
      de: "Das Simulierte Universum wird alle zwei Wochen um 8:00 Uhr Ortszeit aktualisiert und wechselt sich mit den Währungskriegen ab.",
      fr: "L'Univers Simulé est mis à jour toutes les deux semaines à 8h00, heure locale, en alternance avec les Guerres Monétaires.",
      zh: "模拟宇宙每两周在当地时间8:00更新一次，与货币战争交替进行。"
    },
    type: 'weekly',
    dayOfWeek: 1,
    weekOffset: 1,
    timeStr: "08:00:00"
  }
];
