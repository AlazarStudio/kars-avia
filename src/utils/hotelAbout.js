import { decodeEntities, splitTopLevelBlocks } from "./hotelDescription.js";

// Описание гостиницы по разделам — вкладка «Описание» в настройках гостиницы.
//
// Хранится по-прежнему одним HTML в `hotel.information.description` — разметкой
// «<p><strong>Лейбл:</strong> значение</p>», которой держатся почти все
// заполненные описания (замер дев-стенда 10.09.2026: 355 из 360). Её же читают
// чипы удобств (hotelDescription.js) и вкладка «О гостинице», поэтому бэк и
// вывод на экран не меняются: модуль разбирает этот HTML в состояние
// редактора и собирает обратно.
//
// Главное правило разбора — ничего не угадывать и ничего не терять: кусок
// текста становится галкой, только если целиком совпал с пунктом словаря или
// его синонимом. Всё остальное дословно остаётся в «Другое»/«Уточнение».

export const ABOUT_LABELS = {
  name: "Название гостиницы",
  location: "Локация",
  infrastructure: "Инфраструктура",
  facility: "Оснащение объекта",
  rooms: "Оснащение номерного фонда",
  laundry: "Услуги прачечной/глажки",
  other: "Прочее",
};

// Пункт словаря: подпись на чипе, вид в тексте описания и синонимы из
// реальных описаний. Подпись и вид в тексте тоже считаются синонимами.
const item = (key, label, text, synonyms = []) => ({ key, label, text, synonyms });

export const INFRASTRUCTURE_ITEMS = [
  item("pharmacy", "Аптека", "аптека", ["аптеки"]),
  item("supermarket", "Супермаркет", "супермаркет", ["супермаркеты", "гипермаркет", "продуктовый магазин", "продуктовые магазины"]),
  item("shops", "Магазины", "магазины", ["магазин"]),
  item("mall", "Торговый центр", "торговый центр", ["тц", "трц", "торговые центры", "торгово-развлекательный центр"]),
  item("cafe", "Кафе и рестораны", "кафе и рестораны", ["кафе", "ресторан", "рестораны", "кафе и ресторан", "столовая", "столовые"]),
  item("bank", "Банк / банкомат", "банк и банкоматы", ["банк", "банки", "банкомат", "банкоматы", "отделение банка"]),
  item("transport", "Остановка транспорта", "остановка общественного транспорта", ["остановка", "остановки", "остановка транспорта", "остановки общественного транспорта"]),
  item("railway", "Ж/д вокзал", "железнодорожный вокзал", ["вокзал", "жд вокзал", "ж/д вокзал", "ж/д станция"]),
  item("busStation", "Автовокзал", "автовокзал"),
  item("airport", "Аэропорт", "аэропорт"),
  item("park", "Парк / сквер", "парк", ["сквер", "парки", "городской парк"]),
  item("beach", "Пляж / набережная", "пляж и набережная", ["пляж", "набережная", "море"]),
  item("hospital", "Больница / поликлиника", "больница", ["поликлиника", "травмпункт"]),
  item("beauty", "Салон красоты", "салон красоты", ["парикмахерская"]),
  item("sights", "Достопримечательности", "достопримечательности", ["музей", "музеи", "театр"]),
  item("cityCentre", "Центр города", "центр города"),
];

export const FACILITY_ITEMS = [
  item("parking", "Парковка", "парковка", ["автостоянка", "стоянка", "паркинг", "бесплатная парковка", "охраняемая парковка", "парковочные места"]),
  item("conference", "Конференц-зал", "конференц-зал", ["конференц зал", "конференц-залы", "конференц залы", "переговорная"]),
  item("luggage", "Камера хранения", "камера хранения багажа", ["камера хранения", "хранение багажа"]),
  item("elevator", "Лифт", "лифт", ["лифты"]),
  item("restaurant", "Ресторан", "ресторан"),
  item("cafe", "Кафе / столовая", "кафе", ["столовая"]),
  item("bar", "Бар / лобби-бар", "лобби-бар", ["бар", "лобби бар", "кафе-бар"]),
  item("wifi", "Wi-Fi", "Wi-Fi", ["wifi", "wi fi", "вай-фай", "вай фай", "бесплатный wi-fi"]),
  item("sauna", "Сауна", "сауна"),
  item("bathhouse", "Баня / хамам", "баня", ["хамам", "турецкая баня", "русская баня"]),
  item("pool", "Бассейн", "бассейн"),
  item("gym", "Тренажёрный зал", "тренажёрный зал", ["тренажерный зал", "фитнес зал", "фитнес-зал", "спортзал", "спортивный зал", "фитнес-центр", "фитнес центр"]),
  item("spa", "СПА", "спа", ["spa", "спа-центр", "spa-центр", "spa центр", "спа центр"]),
  item("banquet", "Банкетный зал", "банкетный зал"),
  item("reception24", "Круглосуточная стойка регистрации", "круглосуточная стойка регистрации", ["круглосуточный ресепшн", "круглосуточная регистрация"]),
  item("cooler", "Кулер на этажах", "кулер на этажах", ["кулер на этаже", "кулер", "кулер с водой", "кулеры на этажах", "кулеры"]),
  item("sharedFridge", "Общий холодильник", "холодильник", ["общий холодильник"]),
  item("airConditioning", "Кондиционирование", "сплит-система", ["кондиционер", "кондиционирование"]),
  item("souvenirs", "Сувенирный магазин", "сувенирный магазин", ["сувенирная лавка"]),
  item("shoeShine", "Чистка обуви", "чистка обуви"),
  item("sewing", "Швейные принадлежности", "швейные принадлежности", ["предоставление швейных принадлежностей"]),
  item("concierge", "Услуги консьержа", "услуги консьержа", ["консьерж"]),
  item("excursions", "Экскурсии", "экскурсии"),
  item("billiards", "Бильярд", "бильярд", ["бильярдная"]),
  item("tableTennis", "Настольный теннис", "настольный теннис"),
  item("beauty", "Салон красоты", "салон красоты", ["парикмахерская"]),
  item("playground", "Детская площадка", "детская площадка"),
  item("terrace", "Терраса", "терраса", ["веранда", "летняя веранда", "летняя терраса"]),
  item("library", "Библиотека", "библиотека"),
  item("phone", "Телефон", "телефон"),
  item("laundry", "Прачечная", "прачечная"),
  item("electronicLocks", "Электронные замки", "электронные замки", ["электронный замок"]),
  item("massage", "Массаж", "массажный кабинет", ["массаж", "массажные услуги"]),
  item("kitchen", "Общая кухня", "общая кухня", ["кухня"]),
  item("lunchbox", "Ланч-боксы", "ланч-боксы", ["ланч боксы", "ланчбоксы", "предоставление ланч-боксов", "предоставление ланч боксов"]),
  item("businessCentre", "Бизнес-центр", "бизнес-центр", ["бизнес центр"]),
  item("microwave", "Микроволновая печь", "микроволновая печь", ["микроволновка"]),
  item("atm", "Банкомат", "банкомат", ["банкомат на территории отеля", "банкомат на территории"]),
  item("bikeRental", "Прокат велосипедов", "прокат велосипедов"),
  item("roomService", "Доставка еды в номер", "доставка еды и напитков в номер", ["доставка еды в номер", "обслуживание номеров", "рум-сервис"]),
  item("dietMenu", "Диетическое меню", "диетическое меню по запросу", ["диетическое меню", "специальное диетическое меню по запросу"]),
  item("kidsMenu", "Детское меню", "детское меню"),
  item("jacuzzi", "Джакузи", "гидромассажная ванна/джакузи", ["джакузи", "гидромассажная ванна"]),
  item("solarium", "Солярий", "солярий"),
  item("relaxZone", "Зона отдыха", "зона отдыха"),
  item("boardGames", "Настольные игры", "настольные игры", ["настольные игры/пазлы"]),
  item("babyCot", "Детская кроватка", "детская кровать", ["детская кроватка"]),
];

export const ROOM_GROUPS = [
  {
    title: "Мебель",
    items: [
      item("bed", "Кровать", "кровать", ["кровати", "двуспальная кровать", "односпальная кровать", "двуспальные кровати", "односпальные кровати"]),
      item("sofa", "Диван", "диван"),
      item("wardrobe", "Шкаф", "шкаф", ["шкаф для одежды", "гардероб", "платяной шкаф", "шкаф/гардероб"]),
      item("nightstands", "Прикроватные тумбы", "прикроватные тумбы", ["прикроватные тумбочки", "прикроватная тумба", "тумбочки", "тумбочка", "тумбы", "тумба"]),
      item("desk", "Рабочий стол", "рабочий стол", ["письменный стол", "стол"]),
      item("chairs", "Стулья", "стулья", ["стул"]),
      item("armchairs", "Кресла", "кресла", ["кресло"]),
      item("hangers", "Вешалки", "вешалки", ["вешалка", "плечики"]),
      item("mirror", "Зеркало", "зеркало", ["настенное зеркало"]),
      item("coffeeTable", "Журнальный столик", "журнальный столик"),
      item("orthoMattress", "Ортопедический матрас", "ортопедический матрас"),
    ],
  },
  {
    title: "Техника",
    items: [
      item("wifi", "Wi-Fi", "Wi-Fi", ["wifi", "wi fi", "вай-фай", "вай фай", "бесплатный wi-fi", "высокоскоростной wi-fi"]),
      item("tv", "Телевизор", "телевизор", ["тв", "телевизор с плоским экраном", "жк-телевизор", "спутниковое телевидение", "кабельное телевидение", "жк телевизор"]),
      item("airConditioning", "Кондиционер", "кондиционер", ["сплит-система", "кондиционирование", "система кондиционирования"]),
      item("fridge", "Холодильник", "холодильник", ["мини-холодильник"]),
      item("minibar", "Мини-бар", "мини-бар", ["минибар"]),
      item("kettle", "Чайник", "чайник", ["электрический чайник", "электрочайник"]),
      item("phone", "Телефон", "телефон"),
      item("safe", "Сейф", "сейф"),
      item("hairdryer", "Фен", "фен"),
      item("heating", "Отопление", "отопление"),
      item("electronicLocks", "Электронные замки", "электронные замки", ["электронный замок"]),
      item("soundproofing", "Звукоизоляция", "звукоизоляция", ["звуконепроницаемые стены и окна", "шумоизоляция"]),
      item("iron", "Утюг", "утюг", ["утюг и гладильная доска", "гладильная доска", "гладильные принадлежности"]),
      item("ventilation", "Вентиляция", "система вентиляции", ["вентиляция", "вентилятор"]),
      item("alarmClock", "Будильник", "будильник"),
    ],
  },
  {
    title: "Ванная",
    items: [
      item("bathroom", "Санузел", "санузел", ["ванная комната", "собственная ванная комната", "туалет"]),
      item("shower", "Ванна или душ", "ванна или душевая кабина", ["душевая кабина", "душ", "ванна", "ванна или душ", "душевая"]),
      item("sink", "Раковина", "раковина"),
      item("towels", "Полотенца", "полотенца", ["банные полотенца", "набор полотенец"]),
      item("bathrobes", "Халаты", "халаты", ["халат", "банный халат", "банные халаты"]),
      item("slippers", "Тапочки", "тапочки", ["тапки"]),
      item("toiletries", "Гигиенические принадлежности", "гигиенические принадлежности", ["косметические принадлежности", "туалетные принадлежности", "средства гигиены", "гигиенические средства", "туалетно-косметические принадлежности"]),
    ],
  },
  {
    title: "Прочее",
    items: [
      item("teaSet", "Чайный набор", "чайный набор", ["принадлежности для чая и кофе", "набор для чая", "чайная станция", "чай/кофе"]),
      item("water", "Питьевая вода", "бутилированная вода", ["питьевая вода", "вода"]),
      item("linen", "Постельное бельё", "постельное бельё"),
      item("blackout", "Шторы блэкаут", "шторы блэкаут", ["шторы black-out", "шторы blackout", "шторы блэк-аут", "светонепроницаемые шторы"]),
      item("lamps", "Светильники", "светильники", ["светильник", "настольные лампы", "настольная лампа"]),
      item("glassware", "Посуда", "посуда", ["стаканы", "стакан", "набор посуды", "чашки"]),
      item("carpet", "Ковровое покрытие", "ковровое покрытие"),
      item("pillows", "Подушки и одеяла", "подушки и одеяла", ["подушки", "одеяла", "подушка", "одеяло"]),
      item("mosquitoNet", "Москитная сетка", "москитная сетка"),
      item("balcony", "Балкон", "балкон"),
    ],
  },
];

export const ROOM_ITEMS = ROOM_GROUPS.flatMap((group) => group.items);

// Редкие пункты — в редакторе прячутся под «ещё», пока не отмечены. Порог по
// замеру дев-стенда 10.09.2026: пункт отмечен меньше чем у 20 из 360 описаний.
// Инфраструктуру не прячем: её 16 пунктов — шаблон Валерии, а низкие цифры
// там оттого, что старые описания называют места, а не типы.
export const RARE_ITEM_KEYS = {
  facility: new Set([
    "reception24", "shoeShine", "sewing", "concierge", "excursions", "tableTennis",
    "beauty", "playground", "terrace", "library", "electronicLocks", "massage",
    "kitchen", "lunchbox", "businessCentre", "microwave", "atm", "bikeRental",
    "roomService", "dietMenu", "kidsMenu", "jacuzzi", "solarium", "relaxZone",
    "boardGames", "babyCot",
  ]),
  rooms: new Set([
    "sofa", "coffeeTable", "orthoMattress", "iron", "ventilation", "alarmClock",
    "linen", "carpet", "pillows", "mosquitoNet", "balcony",
  ]),
};

const DICTIONARIES = {
  infrastructure: INFRASTRUCTURE_ITEMS,
  facility: FACILITY_ITEMS,
  rooms: ROOM_ITEMS,
};

// Варианты лейблов из реальных описаний → раздел (ключи нормализованы).
const LABEL_ALIASES = {
  "название гостиницы": "name",
  "название объекта": "name",
  "название": "name",
  "гостиница": "name",
  "локация": "location",
  "расположение": "location",
  "адрес": "location",
  "инфраструктура": "infrastructure",
  "оснащение объекта": "facility",
  "оснащение гостиницы": "facility",
  "оснащение номерного фонда": "rooms",
  "оснащение номеров": "rooms",
  "оснащение номероы": "rooms",
  "услуги прачечной/глажки": "laundry",
  "услуги прачечной/стирки": "laundry",
  "услуги прачечной": "laundry",
  "услуги прачечной и глажки": "laundry",
  "прочее": "other",
};

// Шаблонные фразы раздела прачечной. Переключатели ставятся ТОЛЬКО по ним:
// если бы их включали слова в комментарии («гладильная комната»), глажка
// включалась бы при каждом перечитывании и цикл «собрал → разобрал» не сходился.
const LAUNDRY_ON = { laundry: true };
const IRONING_ON = { ironing: true };
const BOTH_ON = { laundry: true, ironing: true };
const BOTH_OFF = { laundry: false, ironing: false };
const LAUNDRY_PHRASES = new Map([
  ...[
    "есть прачечная",
    "на территории гостиницы есть прачечная",
    "на территории есть прачечная",
    "прачечная есть",
    "прачечная имеется",
    "имеется прачечная",
    "прачечная",
    "прачечная на территории",
    "услуги прачечной",
    "стирка",
    "стирка и сушка белья и одежды",
    "предоставляются услуги прачечной",
    "услуги прачечной предоставляются",
    "услуги прачечной имеются",
  ].map((phrase) => [phrase, LAUNDRY_ON]),
  ...[
    "есть услуги глажки",
    "так же предоставляют услуги глажки",
    "также предоставляют услуги глажки",
    "предоставляют услуги глажки",
    "услуги глажки",
    "глажка",
    "глажение",
    "глажка на территории",
    "гладильная на территории",
    "гладильная на этаже",
    "гладильная комната",
    "имеется гладильная комната",
    "так же предоставляются услуги глажки",
    "также предоставляются услуги глажки",
    "гладильные услуги",
    "глажка есть",
    "предоставляется утюг и гладильная доска",
  ].map((phrase) => [phrase, IRONING_ON]),
  ...[
    "предоставляются",
    "есть",
    "имеются",
    "предоставляют услуги прачечной и глажки",
    "есть прачечная и глажка",
    "прачечная и глажка",
    "услуги прачечной и глажки предоставляются",
    "предоставляются услуги прачечной и глажки",
    "услуги прачечной и глажки",
  ].map((phrase) => [phrase, BOTH_ON]),
  ...[
    "нет",
    "отсутствуют",
    "отсутствует",
    "не предоставляются",
    "услуги не предоставляются",
    "не оказываются",
    "не предоставляют",
  ].map((phrase) => [phrase, BOTH_OFF]),
]);

// Лейбл — текст до первого двоеточия в начале абзаца.
const LABEL_RE = /^([^:\n]{2,60}):[ \t]*([\s\S]*)$/;

export function emptyHotelAbout() {
  return {
    infrastructure: { checked: [], extra: "" },
    facility: { checked: [], extra: "" },
    rooms: { checked: [], extra: "" },
    laundry: { laundry: false, ironing: false, extra: "" },
    other: "",
  };
}

function normalizePhrase(text) {
  return String(text)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»"“”„]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—•·*]+/, "")
    .replace(/[\s.;:!]+$/, "")
    .trim();
}

function normalizeLabel(text) {
  return normalizePhrase(text).replace(/\s*\/\s*/g, "/");
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildMatcher(items) {
  const byPhrase = new Map();
  for (const entry of items) {
    for (const phrase of [entry.label, entry.text, ...entry.synonyms]) {
      const normalized = normalizePhrase(phrase);
      if (normalized && !byPhrase.has(normalized)) byPhrase.set(normalized, entry.key);
    }
  }
  return byPhrase;
}

const MATCHERS = Object.fromEntries(
  Object.entries(DICTIONARIES).map(([section, items]) => [section, buildMatcher(items)])
);

// Текст блока: теги снимаются, <br> и вложенные блоки становятся переводами строк.
function blockText(html) {
  const withBreaks = String(html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|h[1-6]|li)\b[^>]*>/gi, "\n");
  return decodeEntities(withBreaks.replace(/<[^>]*>/g, ""))
    .split("\n")
    .map((line) => line.replace(/[ \t\u00a0]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

// Куски значения со своими разделителями: «a, b. c» → a|", " b|". " c|"".
function tokenize(text) {
  const parts = text.split(/(\s*[,;]\s*|\.\s+|\n+)/);
  const tokens = [];
  for (let i = 0; i < parts.length; i += 2) {
    tokens.push({ text: parts[i], sep: parts[i + 1] ?? "" });
  }
  return tokens;
}

// Несъеденные куски — с их собственными разделителями, без висячих краёв.
function joinLeftover(tokens) {
  return tokens
    .map((token) => token.text + token.sep)
    .join("")
    .replace(/^[\s,;.]+/, "")
    .replace(/[\s,;]+$/, "")
    .trim();
}

function readList(value, matcher) {
  const found = new Set();
  const kept = [];
  for (const token of tokenize(value.replace(/\n+/g, ", "))) {
    const key = matcher.get(normalizePhrase(token.text));
    if (key) found.add(key);
    else if (token.text.trim()) kept.push(token);
  }
  return { found, extra: joinLeftover(kept) };
}

function readLaundry(value) {
  const flags = {};
  const kept = [];
  for (const token of tokenize(value.replace(/\n+/g, ", "))) {
    const effect = LAUNDRY_PHRASES.get(normalizePhrase(token.text));
    if (effect) Object.assign(flags, effect);
    else if (token.text.trim()) kept.push(token);
  }
  return { flags, extra: joinLeftover(kept) };
}

/**
 * HTML описания → состояние редактора. Название и локация не читаются —
 * при сборке они берутся из карточки.
 */
export function parseHotelAbout(html) {
  const state = emptyHotelAbout();
  if (typeof html !== "string" || !html.trim()) return state;

  let blocks;
  try {
    blocks = splitTopLevelBlocks(html);
  } catch {
    return { ...state, other: blockText(html) };
  }

  const found = { infrastructure: new Set(), facility: new Set(), rooms: new Set() };
  const extras = { infrastructure: [], facility: [], rooms: [], laundry: [] };
  const otherLines = [];

  for (const block of blocks) {
    const text = blockText(block.tag ? block.inner : block.outer);
    if (!text) continue;

    const match = LABEL_RE.exec(text);
    const section = match ? LABEL_ALIASES[normalizeLabel(match[1])] : undefined;
    if (!section) {
      otherLines.push(...text.split("\n"));
      continue;
    }

    const value = match[2].trim();
    if (!value || section === "name" || section === "location") continue;

    if (section === "other") {
      otherLines.push(...value.split("\n"));
    } else if (section === "laundry") {
      const { flags, extra } = readLaundry(value);
      Object.assign(state.laundry, flags);
      if (extra) extras.laundry.push(extra);
    } else {
      const { found: keys, extra } = readList(value, MATCHERS[section]);
      keys.forEach((key) => found[section].add(key));
      if (extra) extras[section].push(extra);
    }
  }

  for (const section of ["infrastructure", "facility", "rooms"]) {
    state[section] = {
      checked: DICTIONARIES[section]
        .filter((entry) => found[section].has(entry.key))
        .map((entry) => entry.key),
      // Уточнение инфраструктуры в тексте идёт отдельным предложением.
      extra:
        section === "infrastructure"
          ? capitalize(extras[section].join(". "))
          : extras[section].join(", "),
    };
  }
  state.laundry.extra = capitalize(extras.laundry.join(". "));
  state.other = otherLines
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
  return state;
}

function listText(items, section, sentenceExtra) {
  const checked = new Set(section?.checked || []);
  const head = items
    .filter((entry) => checked.has(entry.key))
    .map((entry) => entry.text)
    .join(", ");
  const extra = String(section?.extra || "").trim();
  if (!extra) return head;
  if (!head) return sentenceExtra ? capitalize(extra) : extra;
  return sentenceExtra ? `${head}. ${capitalize(extra)}` : `${head}, ${extra}`;
}

function laundryText(laundry) {
  const parts = [];
  if (laundry?.laundry) parts.push("есть прачечная");
  if (laundry?.ironing) parts.push("есть услуги глажки");
  const head = parts.join(", ");
  const extra = capitalize(String(laundry?.extra || "").trim());
  if (!extra) return head;
  return head ? `${head}. ${extra}` : extra;
}

function linesHtml(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br>");
}

/**
 * Состояние редактора → HTML описания. Раздел без содержимого не пишется.
 */
export function buildHotelAboutHtml(state, { name = "", location = "" } = {}) {
  const about = state || emptyHotelAbout();
  const rows = [
    [ABOUT_LABELS.name, escapeHtml(String(name).trim())],
    [ABOUT_LABELS.location, escapeHtml(String(location).trim())],
    [ABOUT_LABELS.infrastructure, escapeHtml(listText(INFRASTRUCTURE_ITEMS, about.infrastructure, true))],
    [ABOUT_LABELS.facility, escapeHtml(listText(FACILITY_ITEMS, about.facility, false))],
    [ABOUT_LABELS.rooms, escapeHtml(listText(ROOM_ITEMS, about.rooms, false))],
    [ABOUT_LABELS.laundry, escapeHtml(laundryText(about.laundry))],
    [ABOUT_LABELS.other, linesHtml(about.other)],
  ];
  return rows
    .filter(([, value]) => value)
    .map(([label, value]) => `<p><strong>${label}:</strong> ${value}</p>`)
    .join("");
}

// Локация для описания — город и адрес карточки.
export function aboutLocationLine(hotel) {
  const info = hotel?.information || {};
  return [info.city, info.address || hotel?.location?.address]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}
