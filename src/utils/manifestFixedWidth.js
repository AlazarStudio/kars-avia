// Нормализаторы текстовых манифестов: пассажирская ведомость (профиль PM_TEXT),
// ICAO-манифест (ICAO) и манифест DCS «Азимута» (AZIMUT). Такой файл приходит
// одной колонкой Excel с отчётом фиксированной ширины, а не таблицей.
// Сопоставлять там нечего, поэтому формат сначала приводится к обычным
// строкам-колонкам, а разбирает его дальше профиль (manifestProfiles.js) теми
// же средствами, что и остальные форматы.

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
const readLayout = (header, fields) => {
  const starts = {};
  let from = 0;

  for (const { key, title, required } of fields) {
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
    const { title } = fields.find((field) => field.key === key);
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

const findLayout = (rows, fields) => {
  for (const row of rows || []) {
    for (const value of row || []) {
      for (const one of toLines(value)) {
        const bounds = readLayout(one, fields);
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
  const bounds = findLayout(rows, FIELDS);
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

// ── ICAO-манифест (ПАССАЖИРСКИЙ МАНИФЕСТ, ICAO ANNEX 9 APPENDIX 2) ──
// Вторая текстовая раскладка. Строки-шапки колонок в ней нет вовсе, а строка
// несёт ДВУХ пассажиров подряд — «место + ФИО» дважды. Снимать офсеты не с чего,
// поэтому записи режутся по самим токенам мест: способ однозначен ровно потому,
// что цифр внутри ФИО не бывает (проверено на обоих образцах). Заодно раскладка
// в одну или три колонки разберётся тем же кодом.

export const ICAO_HEADER = ["Место", "Фамилия"];

const SEAT_TOKEN = /(?:^|\s)(\d{1,3}[A-Z])(?=\s)/g;

const readIcaoRecords = (value) => {
  const text = String(value ?? "");
  const hits = [...text.matchAll(SEAT_TOKEN)];
  const records = [];

  for (let i = 0; i < hits.length; i++) {
    const from = hits[i].index + hits[i][0].length;
    const to = i + 1 < hits.length ? hits[i + 1].index : text.length;
    const name = text.slice(from, to).trim();
    if (name) records.push([hits[i][1], name]);
  }
  return records;
};

/**
 * Строки листа → строки таблицы, либо null, если это не ICAO-манифест.
 * Выдача устроена так же, как у ведомости: служебные строки, шапка, пассажиры.
 */
export const prepareIcaoManifest = (rows) => {
  const isManifest = (rows || []).some((row) =>
    (row || []).some((value) =>
      /ПАССАЖИРСКИЙ\s+МАНИФЕСТ/i.test(String(value ?? ""))
    )
  );
  if (!isManifest) return null;
  // Тот же титул у текстового манифеста «Азимута», но там есть шапка колонок
  // и ФИО стоит ДО места: резать его по местам нельзя — это не ICAO.
  if (findAzimutLayout(rows)) return null;

  const service = [];
  const people = [];

  for (const row of rows || []) {
    const records = readIcaoRecords(row?.[0]);
    if (!records.length) {
      service.push(row);
      continue;
    }
    people.push(...records);
  }

  if (!people.length) return null;

  return [...service, ICAO_HEADER, ...people];
};

// ── Текстовый манифест DCS «Азимута» (ПАССАЖИРСКИЙ МАНИФЕСТ … АЭРОПОРТ) ──
// Третья текстовая раскладка: одна колонка, одна строка отчёта — одна ячейка.
// Шапка колонок есть («РЕГ ФИО НАП КАТ КЛ МЕСТО …»), поэтому офсеты снимаются с
// неё, как у ведомости. Титул тот же, что у ICAO, но ФИО здесь стоит ДО места —
// резать по местам, как ICAO, нельзя (в имя ушли бы багаж, бирки и коды услуг).

// Заголовки — в верхнем регистре, как в файле: поиск по шапке чувствителен к
// регистру. От шапки ведомости («Рег … Фамилия … РБ … РМ») её отличает сам
// набор полей — «ФИО», «КАТ» и «МЕСТО» там нет.
const AZIMUT_FIELDS = [
  { key: "reg", title: "РЕГ", required: true },
  { key: "name", title: "ФИО", required: true },
  { key: "cat", title: "КАТ", required: true },
  { key: "seat", title: "МЕСТО", required: true },
];

// Шапка синтетической таблицы — под синонимы профиля AZIMUT.
export const AZIMUT_HEADER = ["Рег", "ФИО", "Место", "Кат"];

// Цифра, приклеенная к фамилии («1PETROV/IVAN»), — не часть ФИО: по файлу
// она стоит у каждого пассажира с местом и отсутствует у инфантов (по конвенции
// DCS это число человек в брони). Срезается, только если за ней идёт не цифра.
export const stripPartyCount = (name) =>
  String(name ?? "").trim().replace(/^\d+(?=\D)/, "");

// Строка-пассажир — по ФОРМЕ значений: ФИО начинается с буквы, а «РЕГ» либо
// номер (так и у фамилии во всё поле, где слеш обрезан самим файлом), либо пуст —
// и тогда ФИО обязано иметь вид «ФАМИЛИЯ/ИМЯ» (инфант без регистрации). Так
// отсекаются шапка («РЕГ»/«ФИО»), служебные строки (в «РЕГ» у них текст, даже
// если слеш попал в поле ФИО) и итог «60 · 38/22» (ФИО с цифры).
export const isAzimutPassenger = (reg, name) => {
  const regText = String(reg ?? "").trim();
  const clean = stripPartyCount(name);
  if (!/^[A-ZА-ЯЁ]/i.test(clean)) return false;
  return /^\d+$/.test(regText) || (regText === "" && clean.includes("/"));
};

const findAzimutLayout = (rows) => findLayout(rows, AZIMUT_FIELDS);

/**
 * Строки листа → строки таблицы, либо null, если это не манифест «Азимута».
 * Выдача устроена так же, как у соседей: служебные строки (из них читается
 * номер рейса), шапка, пассажиры. ФИО отдаётся как в файле — счётчик брони и
 * слеш убирает профиль.
 */
export const prepareAzimutManifest = (rows) => {
  const bounds = findAzimutLayout(rows);
  if (!bounds) return null;

  const service = [];
  const people = [];

  for (const row of rows || []) {
    for (const one of toLines(row?.[0])) {
      const reg = cut(one, bounds.reg);
      const name = cut(one, bounds.name);
      if (!isAzimutPassenger(reg, name)) {
        service.push([one]);
        continue;
      }
      people.push([reg, name, cut(one, bounds.seat), cut(one, bounds.cat)]);
    }
  }

  if (!people.length) return null;

  return [...service, AZIMUT_HEADER, ...people];
};
