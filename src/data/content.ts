import { Language } from './translations';

export interface LocalizedString {
  ru: string;
  en: string;
  by: string;
  de: string;
  fr: string;
  zh: string;
  [key: string]: string;
}

export interface Theory {
  id: string;
  category: 'lore' | 'characters' | 'gameplay' | 'infrastructure';
  title: LocalizedString;
  summary: LocalizedString;
  content: LocalizedString;
  createdAt?: string;
  updatedAt?: string;
}

export const theoriesData: Theory[] = [
  {
    id: 'theory-aha-protocol',
    category: 'infrastructure',
    title: {
      ru: "Протокол AHA v6: Архитектурные принципы IPv6-First инфраструктуры и обмена данными",
      en: "AHA Protocol v6: Architectural Principles for IPv6-First Infrastructure and Data Exchange",
      by: "Пратакол AHA v6: Архітэктурныя прынцыпы IPv6-First інфраструктуры і абмену данымі",
      de: "AHA-Protokoll v6: Architekturprinzipien für IPv6-First-Infrastruktur und Datenaustausch",
      fr: "Protocole AHA v6 : Principes architecturaux pour l'infrastructure IPv6-First et l'échange de données",
      zh: "AHA 协议 v6：IPv6 优先基础设施与数据交换架构原理"
    },
    summary: {
      ru: "Полный разбор концепции AHA Protocol v6: прямое P2P-соединение без CGNAT, 20-битная аппаратная маркровка пакетов IPv6 Flow Label, Jumbo MTU до 9000 байт и интерактивная D3-диаграмма сетевой топологии.",
      en: "Complete architectural guide to AHA Protocol v6: Zero-NAT direct peer connections, 20-bit IPv6 Flow Label hardware routing, Jumbo MTU (9000B), and interactive D3 topology diagram.",
      by: "Поўны разбор канцэпцыі AHA Protocol v6: прамое P2P-злучэнне без CGNAT, 20-бітная маркіроўка пакетаў IPv6 і D3-дыяграма сеткі.",
      de: "Vollständiger Leitfaden zum AHA-Protokoll v6: Direct Zero-NAT P2P, 20-Bit IPv6 Flow Labeling und interaktives D3-Diagramm.",
      fr: "Guide architectural du protocole AHA v6 : connexions P2P Zero-NAT, Flow Label IPv6 20 bits et schéma D3 interactif.",
      zh: "AHA 协议 v6 完整架构指南：Zero-NAT 直连、20 位 IPv6 流标签与 D3 交互式拓扑图。"
    },
    content: {
      ru: `<h3>1. Концептуальный обзор AHA Protocol v6</h3>
<p><b>AHA Protocol v6 (Adaptive Hyper-Acceleration)</b> — это передовой адаптивный сетевой протокол прикладного уровня, спроектированный с нуля для использования всех преимуществ нативной инфраструктуры <b>IPv6 Dual-Stack Primary</b>.</p>
<p>В отличие от устаревших IPv4-сетей, требующих регулярной трансляции сетевых адресов (CGNAT) и промежуточных прокси, AHA Protocol обеспечивает сквозное гигабитное P2P-взаимодействие клиентов и облачных серверов с задержками до <b>0.8 мс</b>.</p>

<div id="aha-protocol-d3-diagram"></div>

<h3>2. Четыре архитектурных столпа IPv6-First обмена данными</h3>
<ul>
  <li><b>1. Аппаратная маркировка потоков (20-bit IPv6 Flow Labeling):</b> Каждому активному соединению присваивается уникальный метка потока непосредственно в заголовке кадра IPv6. Маршрутизаторы Tier-1 коммутируют какадор с аппаратно сгенерированным Flow Label без глубокой инспекции пакетов (DPI), снижая нагрузки на CPU на 40%.</li>
  <li><b>2. Zero-NAT Direct P2P Channel:</b> Поскольку IPv6 предоставляет каждому узлу уникальный глобальный адрес, AHA Protocol полностью обходит серверы трансляции адресов (NAT/CGNAT), обеспечивая прямое криптографически защищенное сокет-соединение.</li>
  <li><b>3. Мультипотоковая компрессия заголовков (Multipath Stream Compression):</b> Данные расщепляются на 4 параллельных виртуальных IPv6-потока, заголовки которых сжимаются в соотношении 1:3.8, увеличивая пропускную способность для передачи больших объектов данных ИИ.</li>
  <li><b>4. Адаптивный Jumbo MTU (до 9000 байт):</b> Динамическое согласование размера кадра позволяет передавать до 9000 байт за один сетевой такт без фрагментации пакетов на промежуточных узлах.</li>
</ul>

<h3>3. Стратегия устойчивости (Dual-Stack Fallback)</h3>
<p>В случаях, когда провайдер пользователя или промежуточный сегмент магистрали не поддерживает нативный IPv6, AHA Protocol автоматически переключается на 6to4 туннелирование с сохранением целостности пакетов и обратной совместимостью с IPv4.</p>`,
      en: `<h3>1. Conceptual Overview of AHA Protocol v6</h3>
<p><b>AHA Protocol v6 (Adaptive Hyper-Acceleration)</b> is an advanced adaptive application-layer network protocol engineered from the ground up to exploit the full potential of native <b>IPv6 Dual-Stack Primary</b> infrastructure.</p>
<p>Unlike legacy IPv4 networks bound by Carrier-Grade NAT (CGNAT) middleboxes, AHA Protocol establishes direct gigabit peer-to-peer data pipes with sub-millisecond latency (down to <b>0.8 ms</b>).</p>

<div id="aha-protocol-d3-diagram"></div>

<h3>2. The Four Pillars of IPv6-First Data Exchange</h3>
<ul>
  <li><b>1. Native 20-bit IPv6 Flow Labeling:</b> Every session stamps a unique 20-bit flow label directly into the IPv6 header. Tier-1 routers hardware-switch these frames at line rate without Deep Packet Inspection (DPI) overhead.</li>
  <li><b>2. Zero-NAT Direct P2P Channel:</b> Global IPv6 addressing allows direct cryptographically verified socket pairing, eliminating port mapping state tables and traversal bottlenecks.</li>
  <li><b>3. Multipath Stream Compression:</b> Payloads scatter across 4 parallel virtual IPv6 transport streams with 1:3.8 header compression ratios for high-throughput AI payload transfers.</li>
  <li><b>4. Adaptive Jumbo MTU (Up to 9000 Bytes):</b> Dynamically negotiates Frame MTU size to transfer 9000-byte bursts per frame without fragmentation.</li>
</ul>

<h3>3. Resilience & Dual-Stack Fallback Strategy</h3>
<p>Should the client ISP or transit network lack native IPv6 support, AHA Protocol automatically degrades to 6to4 tunneled routes, guaranteeing unbroken connectivity across legacy IPv4 infrastructures.</p>`,
      by: `<h3>1. Канцэптуальны агляд AHA Protocol v6</h3>
<p><b>AHA Protocol v6 (Adaptive Hyper-Acceleration)</b> — гэта перадавы адаптыўны сеткавы пратакол прыкладнога ўзроўню для натыўнай інфраструктуры <b>IPv6 Dual-Stack Primary</b>.</p>

<div id="aha-protocol-d3-diagram"></div>

<h3>2. Чатыры архітэктурныя слупы IPv6-First абмену данымі</h3>
<ul>
  <li><b>1. Маркіроўка патокаў (20-bit IPv6 Flow Labeling):</b> Кожнаму злучэнню прысвойваецца унікальная метка патоку ў загалоўку IPv6.</li>
  <li><b>2. Zero-NAT Direct P2P Channel:</b> Прамое P2P злучэнне без CGNAT задержкаў.</li>
  <li><b>3. Мультыпатокавая кампрэсія:</b> Сцісканне метаданых і размеркаванне даных па 4 паралельных IPv6 патоках.</li>
  <li><b>4. Адаптыўны Jumbo MTU (да 9000 байт):</b> Перадача вялікіх аб'ёмаў даных без фрагментацыі пакетаў.</li>
</ul>`,
      de: `<h3>1. Konzeptueller Überblick über das AHA-Protokoll v6</h3>
<p><b>AHA Protocol v6 (Adaptive Hyper-Acceleration)</b> ist ein fortschrittliches adaptives Netzwerkprotokoll für native <b>IPv6 Dual-Stack Primary</b> Infrastrukturen.</p>

<div id="aha-protocol-d3-diagram"></div>

<h3>2. Die vier Säulen des IPv6-First Datenaustauschs</h3>
<ul>
  <li><b>1. Native 20-Bit-IPv6-Flow-Kennzeichnung:</b> Bietet Hardware-Routing auf Tier-1-Routern ohne DPI-Overhead.</li>
  <li><b>2. Zero-NAT Direktes P2P:</b> Direkte Peer-zu-Peer-Verbindungen ohne CGNAT-Verzögerungen.</li>
  <li><b>3. Multipath-Stream-Kompression:</b> Verteilt Daten über 4 parallele virtuelle IPv6-Kanäle.</li>
  <li><b>4. Adaptiver Jumbo MTU (bis zu 9000 Byte):</b> Maximiert den Durchsatz ohne Paketfragmentierung.</li>
</ul>`,
      fr: `<h3>1. Aperçu conceptuel du protocole AHA v6</h3>
<p>Le <b>AHA Protocol v6 (Adaptive Hyper-Acceleration)</b> est un protocole réseau adaptatif conçu pour tirer le meilleur parti de l'infrastructure <b>IPv6 Dual-Stack Primary</b>.</p>

<div id="aha-protocol-d3-diagram"></div>

<h3>2. Les quatre piliers de l'échange de données IPv6-First</h3>
<ul>
  <li><b>1. Marquage de flux IPv6 20 bits :</b> Permet la commutation matérielle directe par les routeurs Tier-1.</li>
  <li><b>2. Canal P2P direct Zero-NAT :</b> Connexion directe sans latence de traduction d'adresse.</li>
  <li><b>3. Compression de flux multipath :</b> Répartit la charge sur 4 flux IPv6 virtuels parallèles.</li>
  <li><b>4. MTU Jumbo adaptatif (jusqu'à 9000 octets) :</b> Maximise le débit sans fragmentation.</li>
</ul>`,
      zh: `<h3>1. AHA 协议 v6 概述</h3>
<p><b>AHA Protocol v6（自适应超加速协议）</b> 是一种面向原生的 <b>IPv6 双栈（Dual-Stack Primary）</b> 基础设施设计的高性能应用层网络协议。</p>

<div id="aha-protocol-d3-diagram"></div>

<h3>2. IPv6 优先数据交换的四大架构支柱</h3>
<ul>
  <li><b>1. 原生 20 位 IPv6 流标签（Flow Labeling）：</b> 在包头注入 20 位流标签，Tier-1 路由器无需 DPI 深度报文检查即可实现硬件级高速转发。</li>
  <li><b>2. 无 CGNAT 的点对点直连（Zero-NAT Direct P2P）：</b> 依靠全局 IPv6 地址构建端到端加密 Socket 直连，彻底消除地址转换延迟。</li>
  <li><b>3. 多路径流报头压缩（Multipath Compression）：</b> 将数据拆分至 4 条并行虚拟 IPv6 传输流，报头压缩比达 1:3.8。</li>
  <li><b>4. 自适应 Jumbo MTU（最高 9000 字节）：</b> 动态协商 9000 字节的大帧传输，避免中间节点分片开销。</li>
</ul>`
    }
  },
  {
    id: 'theory-1',
    category: 'lore',
    title: {
      ru: "Эоны: Кто они такие и чего хотят?",
      en: "Aeons: Who Are They and What Do They Want?",
      by: "Эоны: Хто яны такія і чаго хочуць?",
      de: "Die Äonen: Wer sind sie und was wollen sie?",
      fr: "Les Éons : Qui sont-ils et que veulent-ils ?",
      zh: "星神：他们是谁，他们想要什么？"
    },
    summary: {
      ru: "Подробный анализ всех известных Эонов и их влияний на вселенную HSR.",
      en: "A detailed analysis of all known Aeons and their influences on the HSR universe.",
      by: "Падрабязны аналіз усіх вядомых Эонаў і іх уплываў на сусвет HSR.",
      de: "Eine detaillierte Analyse aller bekannten Äonen und ihrer Einflüsse auf das HSR-Universum.",
      fr: "Une analyse détaillée de tous les Éons connus et de leurs influences sur l'univers de HSR.",
      zh: "对所有已知星神及其对HSR宇宙影响的详细分析。"
    },
    content: {
      ru: "<p>Эоны — это божественные сущности, сформированные из фундаментальных концепций бытия. Они странствуют по космосу, оставляя за собой следы своих путей.</p><p>Например, Акивили, Эон Освоения, проложил Звездные Рельсы, создав бесконечные возможности для путешествий. Однако, его судьба остается загадкой. Теории о его исчезновении варьируются от добровольного ухода до насильственного завершения пути.</p><p>Каждый Эон обладает уникальной философией и влиянием, определяя судьбы миров и существ, которые пересекают их Пути. Понимание их мотивов критически важно для разгадки тайн Honkai: Star Rail.</p>",
      en: "<p>Aeons are divine entities formed from fundamental concepts of existence. They wander the cosmos, leaving behind traces of their Paths.</p><p>For example, Akivili, the Aeon of Trailblaze, forged the Star Rails, creating endless possibilities for travel. However, their fate remains a mystery. Theories about their disappearance range from voluntary departure to a violent end to their Path.</p><p>Each Aeon possesses a unique philosophy and influence, shaping the destinies of worlds and beings who cross their Paths. Understanding their motives is crucial for unraveling the mysteries of Honkai: Star Rail.</p>",
      by: "<p>Эоны — гэта боскіе сутнасці, сфармаваныя з фундаментальных канцэпцый быцця. Яны блукаюць па космасе, пакідаючы за сабой сляды сваіх шляхоў.</p><p>Напрыклад, Аківілі, Эон Асваення, праклаў Зорныя Рэйкі, стварыўшы бясконцыя магчымасці для падарожжаў. Аднак, яго лёс застаецца загадкай. Тэорыі аб яго знікненні вар'іруюцца ад добраахвотнага ад'езду да гвалтоўнага завяршэння шляху.</p><p>Кожны Эон мае ўнікальную філасофію і ўплыў, вызначаючы лёсы светаў і істот, якія перасякаюць іх Шляхі. Разумненне іх матываў крытычна важна для разгадкі тайн Honkai: Star Rail.</p>",
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
      de: "Kafkas wahre Identität: Wer ist sie wirklich?",
      fr: "La véritable identité de Kafka : Qui est-elle vraiment ?",
      zh: "卡芙卡的真实身份：她到底是谁？"
    },
    summary: {
      ru: "Разбираем теории о происхождении Кафки и её связях с Охотниками за Стелларонами.",
      en: "Analyzing theories about Kafka's origin and her ties to the Stellaron Hunters.",
      by: "Разбіраем тэорыі аб паходжанні Кафкі і яе сувязях з Палявымі за Стэларонамi.",
      de: "Analyse von Theorien über Kafkas Herkunft und ihre Verbindungen zu den Stellaron-Jägern.",
      fr: "Analyse des théories sur l'origine de Kafka et ses liens avec les Chasseurs de Stellaron.",
      zh: "分析关于卡芙卡起源及其与星核猎手之间联系的理论。"
    },
    content: {
      ru: "<p>Кафка — один из самых загадочных персонажей в Honkai: Star Rail. Ее мотивы и прошлое окутаны тайной, что порождает множество теорий среди фанатов.</p><p>Одна из популярных теорий предполагает, что Кафка не просто член Охотников за Стелларонами, но и ключевая фигура в более масштабном плане Элио. Возможно, она является частью древнего проекта или даже напрямую связана с одним из Эонов.</p><p>Ее способность 'очаровывать' и манипулировать людьми также наводит на мысли о её необычных силах, которые выходят за рамки обычных Путей. Разгадка её личности может стать ключом к пониманию всей сюжетной линии игры.</p>",
      en: "<p>Kafka is one of the most mysterious characters in Honkai: Star Rail. Her motives and past are shrouded in secrecy, leading to many fan theories.</p><p>One popular theory suggests that Kafka is not just a member of the Stellaron Hunters, but a key figure in Elio's larger plan. Perhaps she is part of an ancient project or even directly connected to one of the Aeons.</p><p>Her ability to 'charm' and manipulate people also hints at her unusual powers that go beyond ordinary Paths. Unraveling her identity could be the key to understanding the entire game's storyline.</p>",
      by: "<p>Кафка — адзін з самых загадкавых персанажаў у Honkai: Star Rail. Яе матывы і мінулае ахутаны таямніцай, што спараджае мноства тэорый сярод фанатаў.</p><p>Адна з папулярных тэорый мяркуе, што Кафка не проста член Палявых за Стэларонамi, але і ключавы фігура ў больш маштабным плане Эліо. Магчыма, яна з'яўляецца часткай старажытнага праекта або нават напрамую звязана з адным з Эонаў.</p><p>Яе здольнасць 'зачаравываць' і маніпуляваць людзьмі таксама наводзіць на думкі аб яе незвычайных сілах, якія выходзяць за рамкі звычайных Шляхоў. Разгадка яе асобы можа стаць ключом да разумення ўсёй сюжэтнай лініі гульні.</p>",
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
      de: "Optimale Builds für Welt",
      fr: "Les meilleurs builds pour Welt",
      zh: "瓦尔特的最佳构筑"
    },
    summary: {
      ru: "Гайд по лучшим реликвиям, световым конусам и командам для Вельта.",
      en: "Guide to the best Relics, Light Cones, and teams for Welt.",
      by: "Гайд па лепшых рэліквях, святловых конусах і камандах для Вэльта.",
      de: "Leitfaden für die besten Relikte, Lichtkegel und Teams für Welt.",
      fr: "Guide des meilleures reliques, cônes de lumière et équipes pour Welt.",
      zh: "瓦尔特的最佳遗物、光锥和队伍指南。"
    },
    content: {
      ru: "<p>Вельт — уникальный персонаж, способный накладывать дебаффы и контролировать противников. Для максимальной эффективности Вельта рекомендуется сосредоточиться на повышении его эффекта пробития и шанса попадания эффектов.</p><p><b>Реликвии:</b> Четыре части Сета Воровства Метеора для увеличения эффекта пробития или Сет Стрелка Дикого Запада для общего урона.</p><p><b>Световые конусы:</b> Его сигнатурный конус «Неважно, Эон ли это» является лучшим выбором. В качестве альтернативы подойдут «Зарождение Зари» или «Спокойной ночи и мирного сна».</p><p><b>Команды:</b> Вельт отлично сочетается с персонажами, которые извлекают выгоду из замедления и контроля противников, такими как Дань Хэн: Пожиратель Луны или Цзинлю.</p>",
      en: "<p>Welt is a unique character capable of applying debuffs and controlling enemies. For maximum effectiveness, Welt should focus on increasing his Break Effect and Effect Hit Rate.</p><p><b>Relics:</b> Four-piece Thief of Shooting Meteor for Break Effect or Wastelander of Banditry Desert for overall damage.</p><p><b>Light Cones:</b> His signature Light Cone 'In the Name of the World' is the best choice. Alternatives include 'Before Dawn' or 'Good Night and Sleep Well'.</p><p><b>Teams:</b> Welt pairs exceptionally well with characters who benefit from enemy slow and control, such as Dan Heng • Imbibitor Lunae or Jingliu.</p>",
      by: "<p>Вэльт — унікальны персанаж, здольны накладваць дэбафы і кантраляваць праціўнікаў. Для максімальнай эфектыўнасці Вэльта рэкамендуецца сканцэнтравацца на павелічэнні яго эфекту прабітця і шанса траплення эфектаў.</p><p><b>Рэліквіі:</b> Чатыры часткі Сэта Злодзеяў Метэора для павелічэння эфекту прабітця або Сэт Стралка Дзікага Захаду для агульнага ўрону.</p><p><b>Святловыя конусы:</b> Яго сігнатурны конус «Неважна, Эон гэта ці не» з'яўляецца лепшым выбарам. У якасці альтэрнатыў падыходзяць «Зараджэнне Зары» або «Спакойнай ночы і мірнага сну».</p><p><b>Каманды:</b> Вэльт выдатна спалучаецца з персанажамі, якія выцягваюць выгаду з запавольнення і кантролю праціўнікаў, такімі як Дань Хэн: Пажыральнік Месяца або Цзінлю.</p>",
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
      de: "Das Schicksal von Jarilo-VI nach dem Stellaron",
      fr: "Le destin de Jarilo-VI après le Stellaron",
      zh: "雅利洛-VI 在星核事件后的命运"
    },
    summary: {
      ru: "Что ждет планету и её жителей после снятия угрозы Стелларона?",
      en: "What awaits the planet and its inhabitants after the Stellaron threat is lifted?",
      by: "Што чакае планету і яе жыхароў пасля зняцця пагрозы Стэларона?",
      de: "Was erwartet den Planeten und seine Bewohner, nachdem die Stellaron-Bedrohung aufgehoben ist?",
      fr: "Qu'est-ce qui attend la planète et ses habitants après la levée de la menace du Stellaron ?",
      zh: "在星核威胁解除后，这个星球和它的居民将面临什么？"
    },
    content: {
      ru: "<p>Ярило-VI, планета, десятилетиями страдавшая от вечной мерзлоты, благодаря усилиям Первопроходца и Звездного Экспресса, наконец, освобождена от влияния Стелларона. Но что дальше?</p><p>Восстановление планеты будет долгим и трудным процессом. Инфраструктура разрушена, экосистема нарушена, и население нуждается в поддержке. Вероятнее всего, Ярило-VI станет важным союзником Звездного Экспресса и частью Межзвездного Мира.</p><p>Однако, остаются вопросы о скрытых фракциях и последствиях прошлых событий. Возможно, Мерзлота была не единственной угрозой, и новые вызовы ждут Ярило-VI в будущем.</p>",
      en: "<p>Jarilo-VI, a planet that suffered from eternal frost for decades, has finally been freed from the Stellaron's influence thanks to the efforts of the Trailblazer and the Astral Express. But what's next?</p><p>The planet's recovery will be a long and difficult process. Infrastructure is destroyed, the ecosystem is disrupted, and the population needs support. Most likely, Jarilo-VI will become an important ally of the Astral Express and a part of the Interastral Peace Corporation.</p><p>However, questions remain about hidden factions and the consequences of past events. Perhaps the Frost was not the only threat, and new challenges await Jarilo-VI in the future.</p>",
      by: "<p>Ярыла-VI, планета, якая дзесяцігоддзямі пакутавала ад вечнай мерзлаты, дзякуючы высілкам Першапраходца і Зорнага Экспрэса, нарэшце, вызвалена ад уплыву Стэларона. Але што далей?</p><p>Аднаўленне планеты будзе доўгім і цяжкім працэсам. Інфраструктура разбурана, экалогія парушана, і насельніцтва мае патрэбу ў падтрымцы. Верагодней за ўсё, Ярыла-VI стане важным саюзнікам Зорнага Экспрэса і часткай Міжзорнага Міру.</p><p>Аднак, застаюцца пытанні аб схаваных фракцыях і выніках мінулых падзей. Магчыма, Мерзлата была не адзінай пагрозай, і новыя выклікі чакаюць Ярыла-VI ў будучыні.</p>",
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
      de: "Blades Rätsel: Unsterblichkeit und ihr Preis",
      fr: "L'énigme de Blade : l'immortalité et son prix",
      zh: "刃的谜团：不死与代价"
    },
    summary: {
      ru: "Исследование природы бессмертия Блэйда и его последствий.",
      en: "An exploration of the nature of Blade's immortality and its consequences.",
      by: "Даследаванне прыроды бессмяротнасці Блэйда і яе вынікаў.",
      de: "Eine Untersuchung der Natur von Blades Unsterblichkeit und ihrer Konsequenzen.",
      fr: "Une exploration de la nature de l'immortalité de Blade et de ses conséquences.",
      zh: "探讨刃的不死本质及其后果。"
    },
    content: {
      ru: "<p>Блэйд — один из самых трагичных персонажей в HSR, обреченный на бессмертие, которое приносит ему лишь страдания. Его состояние, известное как 'Увядающее тело', является результатом экспериментов или проклятия.</p><p>Теории о его бессмертии связывают его с Денгом Хэном и событиями на Сяньчжоу Лофу, намекая на глубокую связь с историей Неразрушимого. Возможно, его бессмертие — это не благословение, а наказание за прошлые грехи.</p><p>Поиск лекарства от его проклятия или способ умереть с достоинством, вероятно, станет центральной темой его сюжетной линии, раскрывая новые грани мира HSR и его темной стороны.</p>",
      en: "<p>Blade is one of the most tragic characters in HSR, condemned to an immortality that brings him only suffering. His condition, known as 'Mara-Struck', is the result of experiments or a curse.</p><p>Theories about his immortality link him to Dan Feng and the events on Xianzhou Luofu, hinting at a deep connection to the history of the Vidyadhara. Perhaps his immortality is not a blessing, but a punishment for past sins.</p><p>The search for a cure for his curse, or a way to die with dignity, will likely become a central theme of his storyline, revealing new facets of the HSR world and its darker side.</p>",
      by: "<p>Блэйд — адзін з самых трагічных персанажаў у HSR, асуджаны на бессмяротнасць, якая прыносіць яму толькі пакуты. Яго стан, вядомы як 'Увядаючае цела', з'яўляецца вынікам эксперыментаў або праклёну.</p><p>Тэорыі аб яго бессмяротнасці звязваюць яго з Дэнг Хэнам і падзеямі на Сяньчжоу Лофу, намякаючы на глыбокую сувязь з гісторыяй Неразрушальнага. Магчыма, яго бессмяротнасць — гэта не благаславенне, а пакаранне за мінулыя грахі.</p><p>Пошук лекі ад яго праклёну або способ памерці з годнасцю, верагодна, стане цэнтральнай тэмай яго сюжэтнай лініі, раскрываючы новыя грані свету HSR і яго цёмнай боку.</p>",
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
      de: "Strategien für den neuen Modus: Pure Fiction",
      fr: "Stratégies pour le nouveau mode : Pure Fiction",
      zh: "新模式 Pure Fiction 的策略"
    },
    summary: {
      ru: "Советы по прохождению сложных этапов в Чистом Вымысле с фокусом на DPS и поддержку.",
      en: "Tips for tackling challenging stages in Pure Fiction with a focus on DPS and support.",
      by: "Саветы па праходжанні складаных этапаў у Pure Fiction з фокусам на DPS і падтрымку.",
      de: "Tipps zum Bewältigen anspruchsvoller Stages in Pure Fiction mit Fokus auf DPS und Support.",
      fr: "Conseils pour aborder les étapes difficiles de Pure Fiction avec un accent sur DPS et support.",
      zh: "Pure Fiction 挑战阶段的攻略提示，重点关注 DPS 和辅助。"
    },
    content: {
      ru: "<p>Чистый Вымысел — это новый игровой режим, требующий быстрого переключения команд и оптимизации ротаций. Для успеха сосредоточьтесь на персонажах с высоким AoE-уроном, таких как Топаз или Фэйсяо.</p><p><b>Советы:</b> Используйте реликвии с фокусом на скорость и критический урон. Команды с двойным DPS работают лучше всего.</p><p><b>Пример команды:</b> Топаз (основной DPS), Зарянка (поддержка), Жуань Мэй (дебаффер) и Линша (хилер).</p><p>Этот режим идеален для фарминга реликвий и тестирования новых сборок.</p>",
      en: "<p>Pure Fiction is a new game mode requiring quick team switches and optimized rotations. For success, focus on characters with high AoE damage, like Topaz or Feixiao.</p><p><b>Tips:</b> Use relics focused on speed and crit damage. Double DPS teams work best.</p><p><b>Example Team:</b> Topaz (main DPS), Robin (support), Ruan Mei (debuffer), and Lingsha (healer).</p><p>This mode is perfect for relic farming and testing new builds.</p>",
      by: "<p>Pure Fiction — гэта новы ігровы рэжым, які патрабуе хуткага пераключэньня каманд і аптымізацыі ротацыяў. Для паспеху сканцэнтруйцеся на персанажах з высокім AoE-урон, такіх як Топаз або Фэйсяо.</p><p><b>Саветы:</b> Выкарыстоўвайце рэліквіі з фокусам на хуткасць і крытычны ўрон. Каманды з двойным DPS працуюйце лепей за ўсё.</p><p><b>Прыклад каманды:</b> Топаз (галоўны DPS), Робін (падтрымка), Руань Мэй (дэбаффер) і Лінша (хілер).</p><p>Гэты рэжым ідэальны для фармінгу рэліквій і тэставаньня новых зборак.</p>",
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
      de: "Das Geheimnis des Astral Express: Eine Reisegeschichte",
      fr: "Le mystère de l'Astral Express : Une histoire de voyage",
      zh: "星穹列车的谜团：旅行史"
    },
    summary: {
      ru: "Исследование происхождения Звездного Экспресса и его роли в космосе.",
      en: "An exploration of the Astral Express's origin and its role in the cosmos.",
      by: "Даследаванне паходжання Зорнага Экспрэса і яго ролі ў космасе.",
      de: "Eine Untersuchung des Ursprungs des Astral Express und seiner Rolle im Kosmos.",
      fr: "Une exploration de l'origine de l'Astral Express et de son rôle dans le cosmos.",
      zh: "探讨星穹列车的起源及其在宇宙中的作用。"
    },
    content: {
      ru: "<p>Звездный Экспресс — это не просто средство передвижения, а символ надежды и связи между мирами. Созданный Эоном Акивили, Экспресс продолжает свое путешествие даже после исчезновения своего создателя.</p><p>Каждый вагон Экспресса хранит свою историю, каждый пассажир приносит с собой новую судьбу. Пом-Пом, проводник Экспресса, является хранителем его традиций и памяти.</p><p>Теории о том, куда направляется Экспресс, бесконечны. Возможно, он ищет своего создателя, или же выполняет его последнее желание — связать все миры вместе.</p>",
      en: "<p>The Astral Express is not just a means of transportation, but a symbol of hope and connection between worlds. Created by the Aeon Akivili, the Express continues its journey even after its creator's disappearance.</p><p>Each car of the Express holds its own story, each passenger brings with them a new destiny. Pom-Pom, the Express's conductor, is the keeper of its traditions and memories.</p><p>Theories about where the Express is heading are endless. Perhaps it seeks its creator, or perhaps it fulfills their last wish—to connect all worlds together.</p>",
      by: "<p>Зорны Экспрэс — гэта не проста сродак перамяшчэння, а сімвал надзеі і сувязі паміж светамі. Створаны Эонам Аківілі, Экспрэс працягвае сваё падарожжа нават пасля знікнення свайго стваральніка.</p><p>Кожны вагон Экспрэса трымае сваю гісторыю, кожны пасажыр прыносіць з сабой новы лёс. Пом-Пом, праваднік Экспрэса, з'яўляецца захавальнікам яго традыцый і памяці.</p><p>Тэорыі аб тым, куды накіроўваецца Экспрэс, бясконцыя. Магчыма, ён шукае свайго стваральніка, або ж выконвае яго апошняе жаданне — звязаць усе светы разам.</p>",
      de: "<p>Der Astral Express ist nicht nur ein Transportmittel, sondern ein Symbol der Hoffnung und Verbindung zwischen Welten. Geschaffen vom Äon Akivili, setzt der Express seine Reise auch nach dem Verschwinden seines Schöpfers fort.</p><p>Jeder Wagen des Express hält seine eigene Geschichte, jeder Passagier bringt ein neues Schicksal mit sich. Pom-Pom, der Schaffner des Express, ist der Hüter seiner Traditionen und Erinnerungen.</p><p>Theorien darüber, wohin der Express steuert, sind endlos. Vielleicht sucht er seinen Schöpfer, oder vielleicht erfüllt er deren letzten Wunsch—alle Welten miteinander zu verbinden.</p>",
      fr: "<p>L'Astral Express n'est pas seulement un moyen de transport, mais un symbole d'espoir et de connexion entre les mondes. Créé par l'Éon Akivili, l'Express continue son voyage même après la disparition de son créateur.</p><p>Chaque wagon de l'Express détient sa propre histoire, chaque passager apporte avec lui un nouveau destin. Pom-Pom, le conducteur de l'Express, est le gardien de ses traditions et de ses souvenirs.</p><p>Les théories sur la destination de l'Express sont infinies. Peut-être cherche-t-il son créateur, ou peut-être accomplit-il leur dernier souhait—connecter tous les mondes ensemble.</p>",
      zh: "<p>星穹列车不仅是一种交通工具，更是希望和世界间联系的象征。由星神阿基维利创造的列车，即使在创造者消失后仍继续其旅程。</p><p>每节车厢都有自己的故事，每位乘客都带来新的命运。列车车长邦布，是列车传统和记忆的守护者。</p><p>关于列车去向的理论无穷无尽。也许它在寻找它的创造者，或者它在实现他们的最后愿望——将所有世界连接在一起。</p>"
    }
  },
  {
    id: 'theory-8',
    category: 'gameplay',
    title: {
      ru: "Сборка Спаркси (Искорка) для патча 4.0",
      en: "Sparkle Build Guide for Patch 4.0",
      by: "Зборка Спарксі (Іскарка) для патча 4.0",
      de: "Sparkle Build Guide für Patch 4.0",
      fr: "Guide de build Sparkle pour le patch 4.0",
      zh: "4.0版本花火培养攻略"
    },
    summary: {
      ru: "Лучшие реликвии, конусы и команды для Спаркси в актуальной мете.",
      en: "Best relics, light cones, and teams for Sparkle in the current meta.",
      by: "Лепшыя рэліквіі, конусы і каманды для Спарксі ў актуальнай меце.",
      de: "Beste Relikte, Lichtkegel und Teams für Sparkle in der aktuellen Meta.",
      fr: "Meilleures reliques, cônes de lumière et équipes pour Sparkle dans la méta actuelle.",
      zh: "当前版本花火的最佳遗器、光锥和配队推荐。"
    },
    content: {
      ru: "<p>Спаркси (Искорка) остается одним из лучших саппортов в игре. В версии 4.0 рекомендуется собирать ее в скорость (160+) и критический урон.</p><p><b>Реликвии:</b> Лучший сет - Вестник блуждающего в хакерском пространстве. Планарные украшения - Сломанный киль или Земля грез Пенакония.</p><p><b>Конусы:</b> Лучший конус - ее сигнатурный 'Мирские шалости', но 'Битва не окончена' или 'Танцуй! Танцуй! Танцуй!' тоже отличные варианты.</p>",
      en: "<p>Sparkle remains one of the best supports in the game. In version 4.0, it is recommended to build her with high speed (160+) and critical damage.</p><p><b>Relics:</b> The best set is Messenger Traversing Hackerspace. Planar Ornaments - Broken Keel or Penacony, Land of the Dreams.</p><p><b>Light Cones:</b> Her signature 'Earthly Escapade' is best, but 'But the Battle Isn't Over' or 'Dance! Dance! Dance!' are also great options.</p>",
      by: "<p>Спарксі (Іскарка) застаецца адным з лепшых саппортаў у гульні. У версіі 4.0 рэкамендуецца збіраць яе ў хуткасць (160+) і крытычны ўрон.</p><p><b>Рэліквіі:</b> Лепшы сэт - Веснік, які блукае ў хакерскай прасторы. Планарныя ўпрыгажэнні - Зламаны кіль або Зямля мар Пенаконія.</p><p><b>Конусы:</b> Лепшы конус - яе сігнатурны 'Мірскія свавольствы', але 'Бітва не скончана' або 'Танцуй! Танцуй! Танцуй!' таксама выдатныя варыянты.</p>",
      de: "<p>Sparkle bleibt einer der besten Supports im Spiel. In Version 4.0 wird empfohlen, sie auf hohe Geschwindigkeit (160+) und kritischen Schaden zu bauen.</p><p><b>Relikte:</b> Das beste Set ist 'Bote durch den Hackerspace'. Planar-Ornamente - 'Gebrochener Kiel' oder 'Penacony, Land der Träume'.</p><p><b>Lichtkegel:</b> Ihr Signature-Kegel 'Irdische Eskapade' ist am besten, aber 'Der Kampf ist nicht vorüber' oder 'Tanz! Tanz! Tanz!' sind ebenfalls großartige Optionen.</p>",
      fr: "<p>Sparkle reste l'un des meilleurs supports du jeu. Dans la version 4.0, il est recommandé de la construire avec une vitesse élevée (160+) et des dégâts critiques.</p><p><b>Reliques :</b> Le meilleur set est 'Messager traversant le hackerspace'. Ornements planaires - 'Quille brisée' ou 'Penacony, Terre des Rêves'.</p><p><b>Cônes de lumière :</b> Son cône signature 'Escapade terrestre' est le meilleur, mais 'Le combat n'est pas terminé' ou 'Danse ! Danse ! Danse !' sont aussi d'excellentes options.</p>",
      zh: "<p>花火仍然是游戏中最强的辅助之一。在4.0版本中，建议将她的速度堆到160以上，并注重暴击伤害。</p><p><b>遗器：</b> 最佳套装是“骇域漫游的信使”。位面饰品推荐“折断的龙骨”或“梦想之地匹诺康尼”。</p><p><b>光锥：</b> 专属光锥“游戏尘寰”是最佳选择，但“但战斗还未结束”或“舞！舞！舞！”也是非常好的替代品。</p>"
    }
  },
  {
    id: 'theory-9',
    category: 'gameplay',
    title: {
      ru: "Механика ДоТов (Урон с течением времени) в 4.0",
      en: "DoT Mechanics (Damage over Time) in 4.0",
      by: "Механіка ДоТаў (Урон з цягам часу) у 4.0",
      de: "DoT-Mechaniken (Schaden über Zeit) in 4.0",
      fr: "Mécaniques de DoT (Dégâts sur la durée) dans la 4.0",
      zh: "4.0版本 DoT（持续伤害）机制解析"
    },
    summary: {
      ru: "Как работает урон с течением времени и как правильно собирать DoT-команды.",
      en: "How Damage over Time works and how to build proper DoT teams.",
      by: "Як працуе ўрон з цягам часу і як правільна збіраць DoT-каманды.",
      de: "Wie Schaden über Zeit funktioniert und wie man richtige DoT-Teams aufbaut.",
      fr: "Comment fonctionnent les dégâts sur la durée et comment construire de bonnes équipes DoT.",
      zh: "持续伤害的工作原理以及如何构建正确的 DoT 队伍。"
    },
    content: {
      ru: "<p>DoT (Damage over Time) - это эффекты Шок, Выветривание, Кровотечение и Горение. Они не могут наносить критический урон, поэтому для DoT-персонажей (Кафка, Черный Лебедь, Сампо) важны Сила Атаки, Скорость и Шанс попадания эффектов.</p><p>В патче 4.0 DoT-команды стали еще сильнее благодаря новым реликвиям и саппортам. Ключевой персонаж для любой DoT-команды - Кафка, так как она может активировать DoT-эффекты вне хода противника.</p>",
      en: "<p>DoT (Damage over Time) includes Shock, Wind Shear, Bleed, and Burn effects. They cannot deal critical damage, so ATK, Speed, and Effect Hit Rate are crucial for DoT characters (Kafka, Black Swan, Sampo).</p><p>In patch 4.0, DoT teams have become even stronger thanks to new relics and supports. The key character for any DoT team is Kafka, as she can trigger DoT effects outside the enemy's turn.</p>",
      by: "<p>DoT (Damage over Time) - гэта эфекты Шок, Выветрыванне, Крывацёк і Гарэнне. Яны не могуць наносіць крытычны ўрон, таму для DoT-персанажаў (Кафка, Чорны Лебедзь, Сампо) важныя Сіла Атакі, Хуткасць і Шанц траплення эфектаў.</p><p>У патчы 4.0 DoT-каманды сталі яшчэ мацней дзякуючы новым рэліквіям і саппортам. Ключавы персанаж для любой DoT-каманды - Кафка, бо яна можа актываваць DoT-эфекты па-за ходам праціўніка.</p>",
      de: "<p>DoT (Damage over Time) umfasst Schock, Windscherung, Bluten und Verbrennen. Sie können keinen kritischen Schaden verursachen, daher sind ANG, Geschwindigkeit und Effekt-Trefferrate für DoT-Charaktere (Kafka, Black Swan, Sampo) entscheidend.</p><p>In Patch 4.0 sind DoT-Teams dank neuer Relikte und Supports noch stärker geworden. Der Schlüsselcharakter für jedes DoT-Team ist Kafka, da sie DoT-Effekte außerhalb des gegnerischen Zuges auslösen kann.</p>",
      fr: "<p>Les DoT (Dégâts sur la durée) incluent les effets de Choc, Faille du vent, Saignement et Brûlure. Ils ne peuvent pas infliger de dégâts critiques, donc l'ATQ, la Vitesse et les Chances d'application d'effets sont cruciaux pour les personnages DoT (Kafka, Black Swan, Sampo).</p><p>Dans le patch 4.0, les équipes DoT sont devenues encore plus fortes grâce à de nouvelles reliques et supports. Le personnage clé de toute équipe DoT est Kafka, car elle peut déclencher les effets DoT en dehors du tour de l'ennemi.</p>",
      zh: "<p>DoT（持续伤害）包括触电、风化、裂伤和灼烧效果。它们不能造成暴击伤害，因此攻击力、速度和效果命中对于 DoT 角色（卡芙卡、黑天鹅、桑博）至关重要。</p><p>在4.0版本中，得益于新的遗器和辅助，DoT 队伍变得更加强大。任何 DoT 队伍的核心角色都是卡芙卡，因为她可以在敌人回合外引爆 DoT 效果。</p>"
    }
  },
  {
    id: 'theory-10',
    category: 'gameplay',
    title: {
      ru: "Сборка Яогуан: Лучший билд и команды",
      en: "Yaoguang Build: Best Relics and Teams",
      by: "Зборка Яагуан: Лепшы білд і каманды",
      de: "Yaoguang Build: Beste Relikte und Teams",
      fr: "Build Yaoguang : Meilleures reliques et équipes",
      zh: "摇光培养攻略：最佳遗器与配队"
    },
    summary: {
      ru: "Полное руководство по сборке Яогуан, нового персонажа патча 4.0.",
      en: "A complete guide to building Yaoguang, the new character in patch 4.0.",
      by: "Поўнае кіраўніцтва па зборцы Яагуан, новага персанажа патча 4.0.",
      de: "Ein vollständiger Leitfaden zum Aufbau von Yaoguang, dem neuen Charakter in Patch 4.0.",
      fr: "Un guide complet pour construire Yaoguang, le nouveau personnage du patch 4.0.",
      zh: "4.0版本新角色摇光的完整培养指南。"
    },
    content: {
      ru: "<p>Яогуан - мощный персонаж, появившийся в версии 4.0. Ее основной фокус - нанесение огромного урона по площади и пробитие уязвимости.</p><p><b>Реликвии:</b> Лучший сет реликвий для нее - новый сет из 4.0, увеличивающий урон от пробития. В характеристиках ищите Эффект пробития, Скорость и Силу атаки.</p><p><b>Команды:</b> Идеальные напарники для Яогуан - Жуань Мэй и Первопроходец (Гармония), которые максимизируют ее потенциал пробития.</p>",
      en: "<p>Yaoguang is a powerful character introduced in version 4.0. Her main focus is dealing massive AoE damage and breaking weaknesses.</p><p><b>Relics:</b> The best relic set for her is the new 4.0 set that increases break damage. Look for Break Effect, Speed, and ATK in stats.</p><p><b>Teams:</b> Ideal teammates for Yaoguang are Ruan Mei and Trailblazer (Harmony), who maximize her break potential.</p>",
      by: "<p>Яагуан - магутны персанаж, які з'явіўся ў версіі 4.0. Яе асноўны фокус - нанясенне вялізнага ўрону па плошчы і прабіцце ўразлівасці.</p><p><b>Рэліквіі:</b> Лепшы сэт рэліквій для яе - новы сэт з 4.0, які павялічвае ўрон ад прабіцця. У характарыстыках шукайце Эфект прабіцця, Хуткасць і Сілу атакі.</p><p><b>Каманды:</b> Ідэальныя напарнікі для Яагуан - Жуань Мэй і Першапраходзец (Гармонія), якія максімізуюць яе патэнцыял прабіцця.</p>",
      de: "<p>Yaoguang ist ein mächtiger Charakter, der in Version 4.0 eingeführt wurde. Ihr Hauptfokus liegt auf massivem AoE-Schaden und dem Brechen von Schwächen.</p><p><b>Relikte:</b> Das beste Relikt-Set für sie ist das neue 4.0-Set, das den Bruchschaden erhöht. Suchen Sie nach Brucheffekt, Geschwindigkeit und ANG in den Werten.</p><p><b>Teams:</b> Ideale Teamkollegen für Yaoguang sind Ruan Mei und Trailblazer (Harmonie), die ihr Bruchpotenzial maximieren.</p>",
      fr: "<p>Yaoguang est un personnage puissant introduit dans la version 4.0. Son objectif principal est d'infliger des dégâts de zone massifs et de briser les faiblesses.</p><p><b>Reliques :</b> Le meilleur set de reliques pour elle est le nouveau set de la 4.0 qui augmente les dégâts de rupture. Recherchez l'Effet de rupture, la Vitesse et l'ATQ dans les statistiques.</p><p><b>Équipes :</b> Les coéquipiers idéaux pour Yaoguang sont Ruan Mei et le Pionnier (Harmonie), qui maximisent son potentiel de rupture.</p>",
      zh: "<p>摇光是4.0版本中引入的强大角色。她的主要特点是造成巨大的范围伤害和击破弱点。</p><p><b>遗器：</b> 最适合她的遗器套装是4.0新增的增加击破伤害的套装。在属性中寻找击破特攻、速度和攻击力。</p><p><b>配队：</b> 摇光的理想队友是阮·梅和开拓者（同谐），他们能最大化 political 击破潜力。</p>"
    }
  },
  {
    id: 'theory-aha-radio-dsp',
    category: 'infrastructure',
    createdAt: '2026-04-15T15:30:00.000Z',
    title: {
      ru: "AHA Radio: Архитектура Web Audio API DSP, процедурный синтез винила и Sidechain-даккинг",
      en: "AHA Radio: Web Audio API DSP Architecture, Procedural Vinyl Synthesis & Sidechain Ducking",
      by: "AHA Radio: Архітэктура Web Audio API DSP, працэдурны сінтэз вінілу і Sidechain-дакінг",
      de: "AHA Radio: Web Audio API DSP-Architektur, prozedurale Vinyl-Synthese und Sidechain-Ducking",
      fr: "AHA Radio : Architecture DSP Web Audio API, synthèse procédurale de vinyle et Sidechain Ducking",
      zh: "AHA Radio：Web Audio API DSP 架构、过程化黑胶合成与侧链闪避算法"
    },
    summary: {
      ru: "Полный технический разбор радиостанции AHA: граф узлов Web Audio API, алгоритм процедурного синтеза винилового шума, система динамического сайдчейн-даккинга для голоса ведущего и 256-полосный FFT спектральный анализатор в реальном времени с кодом на TypeScript.",
      en: "Complete technical breakdown of AHA Radio: Web Audio API node graph, procedural vinyl crackle synthesis algorithm, dynamic sidechain ducking engine for host commentary, and 256-band real-time FFT spectrum visualizer with TypeScript source code.",
      by: "Поўны тэхнічны разбор радыёстанцыі AHA: граф вузлоў Web Audio API, алгарытм працэдурнага сінтэзу вінілавага трэску, дынамічны сайдчэйн-дакінг і 256-палосны FFT спектральны аналізатар.",
      de: "Vollständige technische Analyse von AHA Radio: Web Audio API-Knotengraph, prozedurale Vinyl-Synthese, dynamisches Sidechain-Ducking für Moderatorenstimmen und 256-Band-Echtzeit-FFT-Spektrumanalysator.",
      fr: "Analyse technique complète d'AHA Radio : graphe de nœuds Web Audio API, synthèse procédurale de craquement de vinyle, sidechain ducking dynamique pour la voix et analyseur de spectre FFT 256 bandes en temps réel.",
      zh: "AHA Radio 完整技术解析：Web Audio API 节点图谱、过程化黑胶爆音合成算法、AI 主持人动态侧链闪避引擎以及 256 频段 FFT 实时频谱分析仪（附 TypeScript 源码）。"
    },
    content: {
      ru: `<h3>1. Введение и архитектура аудио-пайплайна</h3>
<p>Радиостанция <b>AHA Radio</b> представляет собой распределенный аудио-сервис реального времени, построенный на базе стандарта <code>Web Audio API (W3C)</code>. В отличие от стандартных аудиоплееров с тегом <code>&lt;audio&gt;</code>, в AHA Radio поток проходит через многоступенчатую цифровую сигнальную цепочку (DSP Pipeline), обеспечивающую аппаратное сведение, процедурную генерацию аналогового шума, компрессию динамического диапазона и спектральный анализ.</p>

<h4>Граф узлов (Web Audio Graph Topology)</h4>
<pre><code>[Stream Source] ----+
                    |
[Vinyl Synth] ------+---> [BiquadFilter] ---> [Compressor] ---> [Ducking Gain] ---> [Master Analyser (FFT)] ---> [Destination]
                    |                                                ^
[TTS Host Stream] --+------------------------------------------------+ (Sidechain Trigger)</code></pre>

<h3>2. Инициализация и создание аудио-контекста</h3>
<p>Для преодоления политик автовоспроизведения (Autoplay Policy) в современных браузерах (Chrome / Safari / WebKit) движок использует асинхронную разблокировку при первом пользовательском жесте:</p>
<pre><code class="language-typescript">export class AhaRadioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private duckingGain: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private vinylSource: AudioBufferSourceNode | null = null;

  public async initAudio(): Promise<void> {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass({ latencyHint: 'interactive', sampleRate: 48000 });
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.setupNodeGraph();
  }
}</code></pre>

<h3>3. Алгоритм процедурного синтеза винилового шума и треска</h3>
<p>Вместо циклического воспроизведения MP3-сэмпла, который увеличивает нагрузку на сеть и создает эффект репетитивности, AHA Radio генерирует бесконечный аналоговый виниловый шум математически: комбинацией розового шума (Pink Noise) и случайных импульсов Пуассона (Poisson Crackle Spikes):</p>
<pre><code class="language-typescript">private createVinylBuffer(ctx: AudioContext, durationSeconds: number = 5): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const frameCount = sampleRate * durationSeconds;
  const buffer = ctx.createBuffer(2, frameCount, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < frameCount; i++) {
      // Генератор белого шума
      const white = Math.random() * 2 - 1;
      
      // Алгоритм Поля Келлетта для 3dB/октава спада (Pink Noise)
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      
      // Эмуляция микротрещин винила (Poisson Distribution Spikes)
      let crackle = 0;
      if (Math.random() < 0.00035) {
        crackle = (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.4);
      }

      data[i] = (pink * 0.04) + (crackle * 0.45);
    }
  }
  return buffer;
}</code></pre>

<h3>4. Система автоматического Sidechain Ducking</h3>
<p>При выходе в эфир голосовых сообщений ведущего Ахи или трансляции срочных сводок Министерство Ахахи плавно приглушает музыкальный трек на <b>-14 dB</b> с экспоненциальной кривой затухания, возвращая громкость после завершения реплики:</p>
<pre><code class="language-typescript">public triggerVoiceDucking(isActive: boolean): void {
  if (!this.ctx || !this.duckingGain) return;
  
  const now = this.ctx.currentTime;
  const targetGain = isActive ? 0.2 : 1.0; // -14dB при активации
  const rampTime = isActive ? 0.25 : 0.65; // Быстрый спад (250ms), плавный подъем (650ms)

  this.duckingGain.gain.cancelScheduledValues(now);
  this.duckingGain.gain.setTargetAtTime(targetGain, now, rampTime / 3);
}</code></pre>

<h3>5. 256-полосный FFT спектральный анализатор</h3>
<p>Визуализация частот вычисляется через <code>AnalyserNode</code> с быстрым преобразованием Фурье (Fast Fourier Transform), сглаживанием <code>smoothingTimeConstant = 0.85</code> и интерполяцией пиков на HTML5 Canvas:</p>
<pre><code class="language-typescript">public renderSpectrum(canvas: HTMLCanvasElement): void {
  if (!this.analyserNode) return;
  
  const ctx2d = canvas.getContext('2d');
  const bufferLength = this.analyserNode.frequencyBinCount; // 256 корзин
  const dataArray = new Uint8Array(bufferLength);
  
  const draw = () => {
    requestAnimationFrame(draw);
    this.analyserNode!.getByteFrequencyData(dataArray);
    
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      
      // Неоновый фирменный градиент Ахи
      const gradient = ctx2d.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, 'rgba(255, 77, 77, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 77, 77, 0.9)');
      
      ctx2d.fillStyle = gradient;
      ctx2d.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  };
  draw();
}</code></pre>

<h3>6. Отказоустойчивость и поддержка Web Workers</h3>
<p>Движок снабжен автоматическим реконнектом с экспоненциальной задержкой (Exponential Backoff), защитой от буферного переполнения и поддержкой фонового воспроизведения через <code>MediaSession API</code> с кастомными метаданными о треках и обложках.</p>`,
      en: `<h3>1. Introduction & Audio Pipeline Architecture</h3>
<p><b>AHA Radio</b> is a high-performance, real-time distributed audio streaming service built on top of the <code>Web Audio API (W3C)</code> specification. Unlike standard web players using plain <code>&lt;audio&gt;</code> elements, AHA Radio routes sound through a multi-stage digital signal processing (DSP) graph featuring hardware mixing, procedural analog noise synthesis, dynamic range compression, and spectral analysis.</p>

<h4>Web Audio Graph Topology</h4>
<pre><code>[Stream Source] ----+
                    |
[Vinyl Synth] ------+---> [BiquadFilter] ---> [Compressor] ---> [Ducking Gain] ---> [Master Analyser (FFT)] ---> [Destination]
                    |                                                ^
[TTS Host Stream] --+------------------------------------------------+ (Sidechain Trigger)</code></pre>

<h3>2. AudioContext Lifecycle & Autoplay Unlock</h3>
<p>To comply with modern browser Autoplay Policies, the engine implements user-gesture state resumption:</p>
<pre><code class="language-typescript">export class AhaRadioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private duckingGain: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private vinylSource: AudioBufferSourceNode | null = null;

  public async initAudio(): Promise<void> {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass({ latencyHint: 'interactive', sampleRate: 48000 });
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.setupNodeGraph();
  }
}</code></pre>

<h3>3. Procedural Vinyl Noise & Crackle Synthesis Algorithm</h3>
<p>Rather than looping an MP3 sample that wastes bandwidth, AHA Radio synthesizes authentic lo-fi vinyl hiss and crackle mathematically using Paul Kellet's Pink Noise filter and Poisson spikes:</p>
<pre><code class="language-typescript">private createVinylBuffer(ctx: AudioContext, durationSeconds: number = 5): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const frameCount = sampleRate * durationSeconds;
  const buffer = ctx.createBuffer(2, frameCount, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < frameCount; i++) {
      const white = Math.random() * 2 - 1;
      
      // Paul Kellett's Filter for 3dB/octave falloff (Pink Noise)
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      
      // Poisson Distribution Spikes for vinyl crackles
      let crackle = 0;
      if (Math.random() < 0.00035) {
        crackle = (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.4);
      }

      data[i] = (pink * 0.04) + (crackle * 0.45);
    }
  }
  return buffer;
}</code></pre>

<h3>4. Automatic Voice Sidechain Ducking Engine</h3>
<p>When the AI host or live announcements broadcast, background music smoothly attenuates by <b>-14 dB</b> with parametric curves:</p>
<pre><code class="language-typescript">public triggerVoiceDucking(isActive: boolean): void {
  if (!this.ctx || !this.duckingGain) return;
  
  const now = this.ctx.currentTime;
  const targetGain = isActive ? 0.2 : 1.0; // -14dB attenuation
  const rampTime = isActive ? 0.25 : 0.65; // 250ms attack, 650ms release

  this.duckingGain.gain.cancelScheduledValues(now);
  this.duckingGain.gain.setTargetAtTime(targetGain, now, rampTime / 3);
}</code></pre>

<h3>5. 256-Band Real-Time FFT Spectrum Visualizer</h3>
<p>Frequency visualizer rendered to high-DPI Canvas using Fast Fourier Transform with exponential decay smoothing:</p>
<pre><code class="language-typescript">public renderSpectrum(canvas: HTMLCanvasElement): void {
  if (!this.analyserNode) return;
  
  const ctx2d = canvas.getContext('2d');
  const bufferLength = this.analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  const draw = () => {
    requestAnimationFrame(draw);
    this.analyserNode!.getByteFrequencyData(dataArray);
    
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      const gradient = ctx2d.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, 'rgba(255, 77, 77, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 77, 77, 0.9)');
      
      ctx2d.fillStyle = gradient;
      ctx2d.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  };
  draw();
}</code></pre>`,
      by: `<h3>1. Уводзіны і архітэктура аўдыё-пайплайна</h3>
<p>Радыёстанцыя <b>AHA Radio</b> працуе на базе <code>Web Audio API (W3C)</code>. Паток праходзіць праз лічбавы ланцуг DSP: апаратнае звядзенне, працэдурны сінтэз аналагавага шуму і спектральны аналіз.</p>
<h4>Граф вузлоў (Web Audio Graph Topology)</h4>
<pre><code>[Крыніца стрыму] ----> [Фільтр Biquad] ---> [Кампрэсар] ---> [Ducking Gain] ---> [Спектральны аналізатар] ---> [Выхад]</code></pre>
<h3>2. Працэдурны сінтэз вінілу</h3>
<p>Дзвіжок генеруе бясконцы вінілавы шум матэматычна без спампоўвання лішніх сэмплаў праз спалучэнне ружовага шуму і імпульсаў Пуасона.</p>`,
      de: `<h3>1. Einführung & Audio-Pipeline-Architektur</h3>
<p><b>AHA Radio</b> basiert auf dem <code>Web Audio API (W3C)</code> Standard. Der Datenstrom durchläuft eine mehrstufige DSP-Kette mit Hardware-Mixing, prozeduraler Rauschsynthese und Spektralanalyse.</p>
<h4>Knotengraph (Web Audio Graph Topology)</h4>
<pre><code>[Stream-Quelle] ----> [Biquad-Filter] ---> [Kompressor] ---> [Ducking Gain] ---> [FFT-Analysator] ---> [Audio-Ausgabe]</code></pre>
<h3>2. Prozedurale Vinyl-Synthese</h3>
<p>Mathematische Erzeugung von Lo-Fi-Vinylknistern über Pink-Noise-Filterung und Poisson-Spikes direkt im Browser-AudioBuffer.</p>`,
      fr: `<h3>1. Introduction et architecture DSP</h3>
<p><b>AHA Radio</b> est un service audio temps réel propulsé par la <code>Web Audio API (W3C)</code>. Le signal traverse une chaîne DSP complète avec synthèse analogique procédurale et analyse spectrale FFT.</p>
<h4>Graphe de traitement Web Audio</h4>
<pre><code>[Source du flux] ----> [Filtre Biquad] ---> [Compresseur] ---> [Ducking Gain] ---> [Analyseur FFT] ---> [Sortie]</code></pre>
<h3>2. Synthèse procédurale de vinyle</h3>
<p>Génération mathématique de craquements et de souffle vinyle sans charger de fichiers externes grâce au filtrage de bruit rose et à la distribution de Poisson.</p>`,
      zh: `<h3>1. 简介与音频处理管线架构</h3>
<p><b>AHA Radio</b> 是基于 <code>Web Audio API (W3C)</code> 构建的高性能实时音频广播系统。音频信号通过多级数字信号处理（DSP）节点图谱，实现硬件混音、过程化黑胶噪音合成、动态范围压缩与 256 频段实时频谱分析。</p>
<h4>Web Audio 节点拓扑结构</h4>
<pre><code>[音频流源] ----> [Biquad 双二阶滤波器] ---> [动态压缩器] ---> [侧链闪避增益] ---> [FFT 频谱分析器] ---> [音频输出终端]</code></pre>
<h3>2. 过程化黑胶爆音与噪音合成算法</h3>
<p>无需加载静态 MP3 样本即可在浏览器内存中实时利用泊松分布（Poisson Spikes）和粉红噪音（Pink Noise）算法合成逼真的黑胶质感。</p>`
    }
  }
];

export interface BlogPost {
  id: string;
  category: 'updates' | 'personal' | string;
  createdAt?: string;
  mediaUrl?: string;
  title: LocalizedString;
  summary: LocalizedString;
  content: LocalizedString;
}

export const blogPostsData: BlogPost[] = [
  {
    id: 'blog-3',
    category: 'updates',
    createdAt: '2026-03-28T12:00:00.000Z',
    title: {
      ru: "Рераны в патче 4.0: Кого крутить?",
      en: "Reruns in Patch 4.0: Who to Pull?",
      by: "Рэраны ў патчы 4.0: Каго круціць?",
      de: "Reruns in Patch 4.0: Wen ziehen?",
      fr: "Relances dans le patch 4.0 : Qui invoquer ?",
      zh: "4.0版本复刻：抽谁？"
    },
    summary: {
      ru: "Детальный анализ предстоящих баннеров 4.0: Цзинлю, Авантюрин, мета-команды и советы по экономии нефрита.",
      en: "Detailed analysis of 4.0 banners: Jingliu, Aventurine, meta comps, and jade efficiency.",
      by: "Аналіз маючых адбыцца рэранаў персанажаў у версіі 4.0 і парады па выбары.",
      de: "Analyse der kommenden Charakter-Reruns in Version 4.0 und Zieh-Ratschläge.",
      fr: "Analyse des relances de personnages à venir dans la version 4.0 et conseils d'invocation.",
      zh: "4.0版本即将复刻角色的分析及抽取建议。"
    },
    content: {
      ru: "<p>В патче 4.0 нас ждут долгожданные рераны! Ожидается возвращение таких сильных персонажей, как Цзинлю и Авантюрин.</p><p><b>Цзинлю</b> остается одним из лучших DPS-персонажей пути Разрушения. Если вам нужен сильный ледяной дамагер, она - отличный выбор.</p><p><b>Авантюрин</b> - превосходный персонаж Сохранения, обеспечивающий команду мощными щитами и дополнительным уроном. Он особенно хорош в командах бонус-атак.</p><p>Выбор зависит от потребностей вашей учетной записи. Не хватает урона? Крутите Цзинлю. Нужна выживаемость? Авантюрин - ваш выбор.</p>",
      en: "<p>Patch 4.0 brings highly anticipated reruns! We expect the return of strong characters like Jingliu and Aventurine.</p><p><b>Jingliu</b> remains one of the best Destruction DPS characters. If you need a strong Ice damage dealer, she is an excellent choice.</p><p><b>Aventurine</b> is a superb Preservation character, providing the team with powerful shields and additional damage. He is especially good in follow-up attack teams.</p><p>The choice depends on your account's needs. Lacking damage? Pull Jingliu. Need survivability? Aventurine is your choice.</p>",
      by: "<p>У патчы 4.0 нас чакаюць доўгачаканыя рэраны! Чакаецца вяртанне такіх моцных персанажаў, як Цзінлю і Авантурын.</p><p><b>Цзінлю</b> застаецца адным з лепшых DPS-персанажаў шляху Разбурэння. Калі вам патрэбен моцны ледзяны дамагер, яна - выдатны выбар.</p><p><b>Авантурын</b> - цудоўны персанаж Захавання, які забяспечвае каманду магутнымі шчытамі і дадатковым уронам. Ён асабліва добры ў камандах бонус-атак.</p><p>Выбар залежыць ад патрэбаў вашага ўліковага запісу. Не хапае ўрону? Круціце Цзінлю. Патрэбна выжывальнасць? Авантурын - ваш выбар.</p>",
      de: "<p>Patch 4.0 bringt lang erwartete Reruns! Wir erwarten die Rückkehr starker Charaktere wie Jingliu und Aventurine.</p><p><b>Jingliu</b> bleibt einer der besten Zerstörungs-DPS-Charaktere. Wenn Sie einen starken Eis-Schadensverursacher brauchen, ist sie eine ausgezeichnete Wahl.</p><p><b>Aventurine</b> ist ein hervorragender Bewahrungs-Charakter, der das Team mit mächtigen Schilden und zusätzlichem Schaden versorgt. Er ist besonders gut in Folgeangriffs-Teams.</p><p>Die Wahl hängt von den Bedürfnissen Ihres Kontos ab. Fehlt es an Schaden? Ziehen Sie Jingliu. Brauchen Sie Überlebensfähigkeit? Aventurine ist Ihre Wahl.</p>",
      fr: "<p>Le patch 4.0 apporte des relances très attendues ! Nous attendons le retour de personnages forts comme Jingliu et Aventurine.</p><p><b>Jingliu</b> reste l'un des meilleurs personnages DPS de Destruction. Si vous avez besoin d'un puissant attaquant de glace, elle est un excellent choix.</p><p><b>Aventurine</b> est un superbe personnage de Préservation, fournissant à l'équipe de puissants boucliers et des dégâts supplémentaires. Il est particulièrement bon dans les équipes d'attaques de suivi.</p><p>Le choix dépend des besoins de votre compte. Vous manquez de dégâts ? Invoquez Jingliu. Besoin de survie ? Aventurine est votre choix.</p>",
      zh: "<p>4.0版本带来了备受期待的复刻！我们预计镜流和砂金等强力角色将会回归。</p><p><b>镜流</b>仍然是最好的毁灭DPS角色之一。如果你需要一个强大的冰属性输出，她是一个绝佳的选择。</p><p><b>砂金</b>是一个出色的存护角色，为队伍提供强大的护盾和额外伤害。他在追加攻击队伍中表现尤为出色。</p><p>选择取决于你账号的需求。缺少伤害？抽镜流。需要生存能力？砂金是你的选择。</p>"
    }
  },
  {
    id: 'blog-1',
    category: 'updates',
    title: {
      ru: "ОБНОВЛЕНИЕ BETA-V02",
      en: "UPDATE BETA-V02",
      by: "АБНАЎЛЕННЕ BETA-V02",
      de: "UPDATE BETA-V02",
      fr: "MISE À JOUR BETA-V02",
      zh: "更新 BETA-V02"
    },
    summary: {
      ru: "Технический отчет: 59 исправлений безопасности, полная автоматизация контента, локализация и расширение платформы.",
      en: "Technical report: 59 security patches, full content automation, localization, and platform expansion.",
      by: "Тэхнічная справаздача: 59 выпраўленняў бяспекі, поўная аўтаматызацыя кантэнту і пашырэнне платформы.",
      de: "Technischer Bericht: 59 Sicherheitspatches, vollständige Inhaltsautomatisierung und Plattformerweiterung.",
      fr: "Rapport technique : 59 correctifs de sécurité, automatisation complète du contenu et extension de la plateforme.",
      zh: "技术报告：59 个安全补丁、内容全自动化以及平台扩展。"
    },
    content: {
      ru: "<b>[ ТЕХНИЧЕСКИЕ ИЗМЕНЕНИЯ ]</b><hr><ul><li><b>БЕЗОПАСНОСТЬ:</b> Устранено 59 уязвимостей нулевого дня <code>(0-day)</code>.</li><li><b>АВТОНОМНОСТЬ:</b> Обновление Виртуальной вселенной и Валютных войн теперь происходит автоматически.</li><li><b>ТАЙМИНГ:</b> Переработан алгоритм подсчета времени с поддержкой локальных часовых поясов.</li><li><b>ЛОКАЛИЗАЦИЯ:</b> Интегрированы немецкий и китайский языки. Проведена коррекция существующих переводов.</li></ul><hr><b>[ ИНТЕРФЕЙС И КОНТЕНТ ]</b><ul><li>Полный редизайн визуальной составляющей.</li><li>Добавлен раздел актуальных промокодов и новые статьи.</li><li>Реализована ссылка на мой <code>GitHub</code> профиль.</li><li>Поддержка классического <code>Web-app</code> завершена на 90%.</li></ul><hr><p>クルシーP</p>",
      en: "<b>[ TECHNICAL CHANGES ]</b><hr><ul><li><b>SECURITY:</b> I fixed 59 zero-day vulnerabilities <code>(0-day)</code>.</li><li><b>AUTONOMY:</b> Updates for Simulated Universe and Currency Wars are now fully automated.</li><li><b>TIMING:</b> Re-engineered time calculation algorithm with local timezone support.</li><li><b>LOCALIZATION:</b> Integrated German and Chinese languages. Refined existing translations.</li></ul><hr><b>[ UI & CONTENT ]</b><ul><li>Complete visual interface redesign.</li><li>Added active promo codes section and new articles.</li><li>Implemented <code>GitHub</code> link in the profile/footer.</li><li>Classic <code>Web-app</code> support is 90% complete.</li></ul><hr><p>クルシーP</p>",
      by: "<b>[ ТЭХНІЧНЫЯ ЗМЕНЫ ]</b><hr><ul><li><b>БЯСПЕКА:</b> Я выправіў 59 уразлівасцяў нулявога дня <code>(0-day)</code>.</li><li><b>АЎТАНОМНАСЦЬ:</b> Абнаўленне Віртуальнага сусвету і Валютных войнаў цяпер адбываецца аўтаматычна.</li><li><b>ТАЙМІНГ:</b> Перапрацаваны алгарытм падліку часу з падтрымкай часавых паясоў.</li><li><b>ЛАКАЛІЗАЦЫЯ:</b> Дададзены нямецкая і кітайская мовы. Палепшаны бягучыя пераклады.</li></ul><hr><b>[ ІНТЭРФЕЙС І КАНТЭНТ ]</b><ul><li>Поўны рэдызайн візуальнай часткі.</li><li>Дададзены раздзел актуальных промакодаў і новыя артыкулы.</li><li>Рэалізавана спасылка на мой <code>GitHub</code>.</li><li>Падтрымка класічнага <code>Web-app</code> завершана на 90%.</li></ul><hr><p>クルシーP</p>",
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
  dayOfWeek?: number; // 0-6 (Sun-Sat)
  weekOffset?: number; // 0 for even weeks, 1 for odd weeks
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  resetTime?: string; // HH:mm format
}

export const eventsData: GameEvent[] = [
  {
    id: 'event-1',
    icon: 'refresh-cw',
    title: {
      ru: "Ежедневное обновление",
      en: "Daily Reset",
      by: "Штодзённае абнаўленне",
      de: "Tägliches Reset",
      fr: "Réinitialisation quotidienne",
      zh: "每日刷新"
    },
    description: {
      ru: "Ежедневное обновление происходит каждый день в 06:00 по МСК. Сброс ежедневных миссий, наград и лимитов.",
      en: "Daily reset occurs every day at 03:00 UTC. Resets daily missions, rewards and limits.",
      by: "Штодзённае абнаўленне адбываецца кожны дзень у 06:00 па МСК. Скід штодзённых місій, узнагарод і лімітаў.",
      de: "Tägliches Reset findet jeden Tag um 03:00 UTC statt. Setzt tägliche Missionen, Belohnungen und Limits zurück.",
      fr: "Réinitialisation quotidienne a lieu tous les jours à 03:00 UTC. Réinitialise les missions quotidiennes, récompenses et limites.",
      zh: "每日刷新时间为 03:00 UTC。重置每日任务、奖励和限制。"
    },
    type: 'daily',
    resetTime: '03:00'
  },
  {
    id: 'event-2',
    icon: 'swords',
    title: {
      ru: "Валютные войны",
      en: "Currency Wars",
      by: "Валютныя вайны",
      de: "Währungskriege",
      fr: "Guerres Monétaires",
      zh: "货币战争"
    },
    description: {
      ru: "Валютные войны обновляются каждую неделю по понедельникам в 06:00 по МСК.",
      en: "Currency wars update every week on Mondays at 03:00 UTC.",
      by: "Валютныя вайны абнаўляюцца кожны тыдзень па панядзелках у 06:00 па МСК.",
      de: "Währungskriege werden jede Woche montags um 03:00 UTC aktualisiert.",
      fr: "Les guerres de devises sont mises à jour chaque semaine le lundi à 03:00 UTC.",
      zh: "货币战争每周一在 03:00 UTC 更新一次。"
    },
    type: 'weekly',
    dayOfWeek: 1,
    resetTime: '03:00'
  },
  {
    id: 'event-3',
    icon: 'globe',
    title: {
      ru: "Виртуальная Вселенная",
      en: "Simulated Universe",
      by: "Віртуальны Сусвет",
      de: "Simulated Universe",
      fr: "Univers Simulé",
      zh: "模拟宇宙"
    },
    description: {
      ru: "Виртуальная вселенная обновляется каждую неделю по понедельникам в 06:00 по МСК.",
      en: "The Simulated Universe updates every week on Mondays at 03:00 UTC.",
      by: "Віртуальны сусвет абнаўляецца кожны тыдзень па панядзелках у 06:00 па МСК.",
      de: "Das Simulierte Universum wird jede Woche montags um 03:00 UTC aktualisiert.",
      fr: "L'Univers Simulé est mis à jour chaque semaine le lundi à 03:00 UTC.",
      zh: "模拟宇宙每周一在 03:00 UTC 更新一次."
    },
    type: 'weekly',
    dayOfWeek: 1,
    resetTime: '03:00'
  }
];
