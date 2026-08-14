// Нормализатор текстовой пассажирской ведомости. Такой файл приходит одной
// колонкой Excel: в каждой ячейке — многострочный кусок отчёта с фиксированной
// шириной полей, а не таблица. Сопоставлять там нечего, поэтому формат сначала
// приводится к обычным строкам-колонкам, а разбирает его дальше профиль PM_TEXT
// (manifestProfiles.js) теми же средствами, что и остальные форматы.

// Поля, которые нам нужны. Порядок несущий: заголовки ищутся по строке-шапке
// слева направо, каждый — после предыдущего, иначе «Кл» нашлось бы внутри «Р/кл».
const FIELDS = [
  { key: "reg", title: "Рег", required: true },
  { key: "name", title: "Фамилия", required: true },
  { key: "seat", title: "№ м", required: false },
  { key: "chd", title: "РБ", required: true },
  { key: "inf", title: "РМ", required: true },
];

// Шапка синтетической таблицы. Имена подобраны под синонимы профиля PM_TEXT.
export const FIXED_WIDTH_HEADER = ["Рег", "Фамилия", "Место", "РБ", "РМ"];

const toLines = (value) => String(value ?? "").split(/\r?\n/);

// Начало следующего непустого куска строки. Границей поля служит именно он:
// офсеты берём из самой шапки, а не из констант, поэтому ведомость с другой
// шириной колонок разбирается тем же кодом.
const nextTokenStart = (text, from) => {
  const rest = text.slice(from);
  const found = rest.match(/\S/);
  return found ? from + found.index : text.length;
};

// Разметка полей по строке-шапке: { key: [начало, конец) } либо null, если это
// не шапка ведомости.
const readLayout = (header) => {
  const starts = {};
  let from = 0;

  for (const { key, title, required } of FIELDS) {
    const at = header.indexOf(title, from);
    if (at < 0) {
      if (required) return null;
      continue;
    }
    starts[key] = at;
    from = at + title.length;
  }

  const bounds = {};
  for (const [key, at] of Object.entries(starts)) {
    const { title } = FIELDS.find((field) => field.key === key);
    bounds[key] = [at, nextTokenStart(header, at + title.length)];
  }
  return bounds;
};

const cut = (text, bounds) =>
  bounds ? String(text ?? "").slice(bounds[0], bounds[1]).trim() : "";

const isReg = (text, bounds) => /^\d+$/.test(cut(text, bounds.reg));

// Ведомость переносит длинное ФИО по словам, а слово, которое не влезает в поле,
// рвёт посимвольно. Отличить одно от другого можно только по заполненности поля:
// фрагмент во всю ширину переноса и без пробела — продолжение слова.
//
// ⚠️ Правило эвристическое и ошибётся, если слово занимает ровно ширину переноса,
// а следующим идёт НОВОЕ слово: в файле обе ситуации выглядят одинаково. ФИО
// правится в реестре, поэтому цена ошибки низкая.
const isBrokenWord = (part, wrapWidth) =>
  part.length >= wrapWidth && !part.includes(" ");

const buildName = (cellLines, bounds, wrapWidth) => {
  const parts = cellLines.map((one) => cut(one, bounds.name)).filter(Boolean);
  return parts.reduce(
    (acc, part, i) =>
      i === 0
        ? part
        : isBrokenWord(parts[i - 1], wrapWidth)
          ? acc + part
          : `${acc} ${part}`,
    ""
  );
};

const findLayout = (rows) => {
  for (const row of rows || []) {
    for (const value of row || []) {
      for (const one of toLines(value)) {
        const bounds = readLayout(one);
        if (bounds) return bounds;
      }
    }
  }
  return null;
};

/**
 * Строки листа → строки таблицы, либо null, если это не текстовая ведомость.
 *
 * На выходе: служебные строки файла как есть, затем синтетическая шапка, затем
 * по строке на пассажира. Служебные оставлены намеренно — из них профиль читает
 * номер рейса. Пассажирами они не станут: isPassenger требует целое число в
 * первой ячейке.
 */
export const prepareFixedWidthManifest = (rows) => {
  const bounds = findLayout(rows);
  if (!bounds) return null;

  // Ширина переноса — ширина поля минус разделительный пробел, который в
  // фиксированной вёрстке остаётся всегда.
  const wrapWidth = bounds.name[1] - bounds.name[0] - 1;

  const service = [];
  const people = [];

  for (const row of rows || []) {
    const cellLines = toLines(row?.[0]);
    if (!isReg(cellLines[0] ?? "", bounds)) {
      service.push(row);
      continue;
    }
    people.push([
      cut(cellLines[0], bounds.reg),
      buildName(cellLines, bounds, wrapWidth),
      cut(cellLines[0], bounds.seat),
      cut(cellLines[0], bounds.chd),
      cut(cellLines[0], bounds.inf),
    ]);
  }

  if (!people.length) return null;

  return [...service, FIXED_WIDTH_HEADER, ...people];
};
