// Описание гостиницы приходит одним свободным rich-text блобом
// (`hotel.information.description`, редактор — src/Components/Blocks/TextEditor).
// Заполняющие держатся конвенции «жирный лейбл: значение» по абзацам —
// модуль её распознаёт, чтобы блок «О гостинице» можно было нарисовать
// структурно. Конвенция не распозналась — вызывающий рендерит блоб как раньше.
//
// Разбор ручной, регулярками по HTML: DOMParser в node-тестах недоступен,
// а тянуть jsdom ради одного парсера нельзя.

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

// Заголовки читаем как обычные абзацы — редактор даёт их той же кнопкой.
const PARAGRAPH_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6"]);

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  laquo: "«",
  raquo: "»",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  middot: "·",
};

// Вне диапазона Unicode String.fromCodePoint бросает RangeError, а разбор
// зовут прямо из рендера: `&#x110000;` в описании гасил бы весь экран.
const isCodePoint = (point) =>
  Number.isInteger(point) && point >= 0 && point <= 0x10ffff;

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&#x([0-9a-f]+);/gi, (whole, code) => {
      const point = parseInt(code, 16);
      return isCodePoint(point) ? String.fromCodePoint(point) : whole;
    })
    .replace(/&#(\d+);/g, (whole, code) => {
      const point = Number(code);
      return isCodePoint(point) ? String.fromCodePoint(point) : whole;
    })
    .replace(/&([a-z]+);/gi, (whole, name) => {
      const decoded = NAMED_ENTITIES[name.toLowerCase()];
      return decoded === undefined ? whole : decoded;
    });
}

// Приведение к строке тоже не должно бросать: объект без пригодного toString
// роняет и String(), и RegExp.test() — а это ровно рендерная ветка.
function toHtmlString(value) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  try {
    return String(value);
  } catch {
    return "";
  }
}

// Плоский текст куска HTML: теги превращаются в пробел, чтобы слова соседних
// блоков не слипались, пробелы схлопываются.
export function plainText(html) {
  const source = toHtmlString(html);
  if (!source) return "";
  return decodeEntities(source.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

// Пустое описание: ни текста, ни картинок. Гейт секции «О гостинице».
export function hasRichText(html) {
  const source = toHtmlString(html);
  if (!source) return false;
  if (/<img/i.test(source)) return true;
  return plainText(source) !== "";
}

// Верхнеуровневые блоки описания. Вложенность считаем по счётчику глубины:
// редактор даёт плоскую структуру, а списки/таблицы нас интересуют целиком.
function splitTopLevelBlocks(html) {
  const blocks = [];
  // Кавычка обязана матчиться только парной альтернативой: если пустить её ещё
  // и в общий класс, у движка появляется экспоненциальный перебор — десятки
  // кавычек после незакрытого тега вешают вкладку на секунды.
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/g;
  let depth = 0;
  let openName = "";
  let outerStart = 0;
  let innerStart = 0;
  let cursor = 0;
  let match;

  const pushLoose = (chunk) => {
    if (hasRichText(chunk)) blocks.push({ tag: null, outer: chunk, inner: chunk });
  };

  while ((match = tagRe.exec(html)) !== null) {
    const [tag, closing, rawName, attrs] = match;
    const name = rawName.toLowerCase();
    const selfClosing = VOID_TAGS.has(name) || /\/\s*$/.test(attrs);

    if (!closing) {
      if (depth > 0) {
        if (!selfClosing) depth += 1;
        continue;
      }
      pushLoose(html.slice(cursor, match.index));
      if (selfClosing) {
        // Одиночный тег на верхнем уровне (картинка, перенос) — блок сам по себе.
        blocks.push({ tag: name, outer: tag, inner: "" });
        cursor = tagRe.lastIndex;
        continue;
      }
      depth = 1;
      openName = name;
      outerStart = match.index;
      innerStart = tagRe.lastIndex;
      continue;
    }

    if (depth === 0) continue; // висячий закрывающий тег
    depth -= 1;
    if (depth === 0) {
      blocks.push({
        tag: openName,
        outer: html.slice(outerStart, tagRe.lastIndex),
        inner: html.slice(innerStart, match.index),
      });
      cursor = tagRe.lastIndex;
    }
  }

  if (depth > 0) {
    // Незакрытый блок — забираем хвост целиком, текст пользователя не теряем.
    blocks.push({
      tag: openName,
      outer: html.slice(outerStart),
      inner: html.slice(innerStart),
    });
  } else {
    pushLoose(html.slice(cursor));
  }

  return blocks;
}

// Закрывающий тег для открытого на позиции from, с учётом вложенности одноимённых.
function findMatchingClose(html, name, from) {
  const re = new RegExp(`<(/?)${name}\\b[^>]*>`, "gi");
  re.lastIndex = from;
  let depth = 1;
  let match;
  while ((match = re.exec(html)) !== null) {
    if (match[1]) {
      depth -= 1;
      if (depth === 0) return { start: match.index, end: re.lastIndex };
    } else if (!/\/\s*$/.test(match[0].slice(0, -1))) {
      depth += 1;
    }
  }
  return null;
}

// Двоеточие может стоять и вне жирного рана, в том числе завёрнутым в теги:
// снимаем первый значащий символ, разметку вокруг оставляем как есть.
function stripLeadingColon(html) {
  let i = 0;
  while (i < html.length) {
    const char = html[i];
    if (char === "<") {
      const end = html.indexOf(">", i);
      if (end < 0) return null;
      i = end + 1;
      continue;
    }
    if (/\s/.test(char)) {
      i += 1;
      continue;
    }
    if (html.startsWith("&nbsp;", i)) {
      i += 6;
      continue;
    }
    if (char === ":") return html.slice(0, i) + html.slice(i + 1);
    return null;
  }
  return null;
}

// Пункт конвенции: абзац начинается с жирного рана, за которым (внутри или
// сразу после) идёт двоеточие, а дальше — непустое значение.
function readLabeledItem(inner) {
  const open = /^\s*<(strong|b)\b[^>]*>/i.exec(inner);
  if (!open) return null;

  const boldName = open[1].toLowerCase();
  const close = findMatchingClose(inner, boldName, open[0].length);
  if (!close) return null;

  let label = plainText(inner.slice(open[0].length, close.start));
  let valueHtml = inner.slice(close.end);

  if (label.endsWith(":")) {
    label = label.slice(0, -1).trim();
  } else {
    const withoutColon = stripLeadingColon(valueHtml);
    if (withoutColon === null) return null;
    valueHtml = withoutColon;
  }

  if (!label) return null;
  valueHtml = valueHtml.trim();
  if (!hasRichText(valueHtml)) return null;

  return { label, valueHtml };
}

/**
 * Разбор описания по конвенции «жирный лейбл: значение».
 * @returns {{ items: {label: string, valueHtml: string}[], restHtml: string, parsed: boolean }}
 * `parsed` — меньше двух пунктов считаем «это не конвенция».
 */
export function parseHotelDescription(html) {
  if (!html || typeof html !== "string") {
    return { items: [], restHtml: "", parsed: false };
  }

  try {
    const items = [];
    const rest = [];

    for (const block of splitTopLevelBlocks(html)) {
      if (!hasRichText(block.inner) && !hasRichText(block.outer)) continue;
      const item = PARAGRAPH_TAGS.has(block.tag) ? readLabeledItem(block.inner) : null;
      if (item) items.push(item);
      else rest.push(block.outer);
    }

    return { items, restHtml: rest.join(""), parsed: items.length >= 2 };
  } catch {
    // Контракт «не распарсилось → фолбэк» буквально: любой сбой разбора
    // отдаёт вызывающему прежний сплошной рендер блоба.
    return { items: [], restHtml: "", parsed: false };
  }
}

/* ===== Удобства ===== */

// \b в JS считает границы по ASCII, для кириллицы бесполезен — границы
// задаём явными классами.
const LETTERS = "a-zа-я0-9";
// Падежные окончания существительных: словоформы «сауной», «бассейном».
const ENDING = "(?:ами|ями|ах|ях|ам|ям|ов|ев|ей|ом|ем|ой|ою|ы|и|а|я|у|ю|е|о)?";

const noun = (base) => `${base}${ENDING}`;

const MINIBAR = `мини[-\\s]?бар${ENDING}`;

// Порядок словаря = порядок чипов.
const AMENITY_DICTIONARY = [
  { key: "wifi", label: "Wi-Fi", core: "wi[-\\s]?fi|вай[-\\s]?фай" },
  { key: "restaurant", label: "Ресторан", core: noun("ресторан") },
  // «мини-бар» — отдельный ключ: гасим его до проверки на «бар».
  { key: "bar", label: "Бар", core: noun("бар"), exclude: MINIBAR },
  { key: "minibar", label: "Мини-бар", core: MINIBAR },
  { key: "sauna", label: "Сауна", core: noun("саун") },
  { key: "pool", label: "Бассейн", core: noun("бассейн") },
  {
    key: "gym",
    label: "Тренажёрный зал",
    core: `тренажерн[а-я]+|${noun("тренажер")}|${noun("спортзал")}|фитнес(?:[-\\s]?центр)?${ENDING}`,
  },
  {
    key: "parking",
    label: "Парковка",
    // Голая «стоянка» ловила «стоянку такси» — оставляем только однозначные основы.
    core: `${noun("парковк")}|парковочн[а-я]+|${noun("паркинг")}|${noun("автостоянк")}`,
  },
  {
    key: "airConditioning",
    label: "Кондиционер",
    core: `${noun("кондиционер")}|кондиционирован[а-я]+`,
  },
  {
    key: "laundry",
    label: "Прачечная",
    core: `прачечн[а-я]*|гладильн[а-я]*|${noun("глажк")}|${noun("стирк")}`,
  },
  // «Завтрак» ключом не держим: на том же экране есть структурный блок
  // «Питание» с часами, и чип мог бы ему противоречить.
  { key: "transfer", label: "Трансфер", core: noun("трансфер") },
  { key: "safe", label: "Сейф", core: noun("сейф") },
  { key: "conference", label: "Конференц-зал", core: `конференц[-\\s]?зал${ENDING}` },
  { key: "elevator", label: "Лифт", core: noun("лифт") },
];

const AMENITY_MATCHERS = AMENITY_DICTIONARY.map((item) => ({
  key: item.key,
  label: item.label,
  // Ядро в захватывающей группе: по его длине считаем начало слова, чтобы
  // отмерить окно стражи отрицания от буквы, а не от разделителя перед ней.
  pattern: new RegExp(`(?:^|[^${LETTERS}])(${item.core})(?![${LETTERS}])`, "gi"),
  exclude: item.exclude
    ? new RegExp(`(?:^|[^${LETTERS}])(?:${item.exclude})(?![${LETTERS}])`, "gi")
    : null,
}));

// Отрицание слева гасит упоминание: «без парковки», «нет ресторана»,
// «отсутствует бассейн». Справа страже не видно — «ресторана нет» так и
// останется чипом: разбирать порядок слов регуляркой дороже такой ошибки.
const NEGATION_WINDOW = 20;
const NEGATION_RE = new RegExp(
  `(?:^|[^${LETTERS}])(?:не|нет|без)[^${LETTERS}]|отсутств`,
  "gi"
);

// Позиции сразу за отрицаниями — от них меряем окно до слова удобства.
function findNegationEnds(text) {
  const ends = [];
  NEGATION_RE.lastIndex = 0;
  let match;
  while ((match = NEGATION_RE.exec(text)) !== null) {
    ends.push(match.index + match[0].length);
  }
  return ends;
}

// Удобство засчитано, если хотя бы одно упоминание не накрыто отрицанием.
function hasPositiveMention(matcher, haystack, negationEnds) {
  matcher.pattern.lastIndex = 0;
  let match;
  while ((match = matcher.pattern.exec(haystack)) !== null) {
    const wordStart = match.index + match[0].length - match[1].length;
    const negated = negationEnds.some(
      (end) => end <= wordStart && wordStart - end <= NEGATION_WINDOW
    );
    if (!negated) return true;
  }
  return false;
}

/**
 * Удобства, упомянутые в описании. Сводка над текстом, не замена ему.
 * @returns {{ key: string, label: string }[]} в порядке словаря, без дублей
 */
export function extractAmenities(html) {
  try {
    const text = plainText(html).toLowerCase().replace(/ё/g, "е");
    if (!text) return [];

    const textNegations = findNegationEnds(text);
    const found = [];
    for (const matcher of AMENITY_MATCHERS) {
      const haystack = matcher.exclude ? text.replace(matcher.exclude, " ") : text;
      // Вырезание сдвигает позиции — для изменённого текста считаем заново.
      const negations =
        haystack === text ? textNegations : findNegationEnds(haystack);
      if (hasPositiveMention(matcher, haystack, negations)) {
        found.push({ key: matcher.key, label: matcher.label });
      }
    }
    return found;
  } catch {
    return [];
  }
}
