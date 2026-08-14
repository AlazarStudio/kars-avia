// Общий движок парсинга манифестов: нормализация, детекция профиля, извлечение людей.
// Формат-специфика (какие колонки, как определять пассажира/категорию/рейс) — в
// профилях (manifestProfiles.js). Здесь только то, что общее для всех форматов.

export const s = (v) => String(v ?? "").trim();

// Нормализация ячейки заголовка: верхний регистр, без пробелов и пунктуации
// («Seat No» → «SEATNO», «№ м» → «М», «Ф.И.О.» → «ФИО»).
export const normHeader = (v) =>
  String(v ?? "").toUpperCase().replace(/[\s.,;№/\\-]/g, "");

// Хвостовые титулы из систем бронирования: "GORBACHEVA ANNA MRS"
const TITLE_RE = /\s+(MR|MRS|MS|MISS|MSTR)$/i;
export const cleanFullName = (v) =>
  s(v).replace(TITLE_RE, "").replace(/\s+/g, " ").trim();

// Первая непустая строка многострочной ячейки: в выгрузке DCS под ФИО в той же
// ячейке идут номера багажных бирок, а под местом — места по багажу.
export const firstLine = (v) =>
  String(v ?? "")
    .split(/\r?\n/)
    .map((part) => part.trim())
    .find((part) => part) || "";

// Отметка в колонках CHD/INF: «X» латиницей или кириллицей.
export const isMark = (v) => {
  const value = s(v).toUpperCase();
  return value === "X" || value === "Х";
};

// Зеркало бэкового normalizeFullNameKey — для локального подсчёта «добавлено/пропущено».
export const manifestNameKey = (fullName) =>
  String(fullName ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

// Транслитерация кириллицы → латиница для сравнения номеров рейсов
// («СУ1177» ≡ «SU1177», «ФВ6346» ≡ «FV6346»).
const CYR_TO_LAT = {
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "E", Ж: "ZH", З: "Z",
  И: "I", Й: "I", К: "K", Л: "L", М: "M", Н: "N", О: "O", П: "P", Р: "R",
  С: "S", Т: "T", У: "U", Ф: "F", Х: "H", Ц: "TS", Ч: "CH", Ш: "SH",
  Щ: "SCH", Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "YU", Я: "YA",
};

export const normalizeFlightNumber = (v) =>
  s(v)
    .toUpperCase()
    .replace(/[^A-ZА-ЯЁ0-9]/g, "")
    .replace(/[А-ЯЁ]/g, (ch) => CYR_TO_LAT[ch] ?? ch);

// Совпадение рейсов для проверки манифеста. Пустая сторона → true (не проверяем).
// Обе стороны с буквами → полное сравнение; иначе — только цифры («2704» ≡ «SU2704»).
export const isSameFlight = (a, b) => {
  const na = normalizeFlightNumber(a);
  const nb = normalizeFlightNumber(b);
  if (!na || !nb) return true;
  const hasLetters = (x) => /[A-Z]/.test(x);
  if (hasLetters(na) && hasLetters(nb)) return na === nb;
  const digits = (x) => x.replace(/\D/g, "");
  return digits(na) !== "" && digits(na) === digits(nb);
};

// Ищем в строке индексы колонок профиля по синонимам (точное совпадение normHeader).
// Первое совпадение на поле. Возвращает { field: index } только для найденных.
const matchRowColumns = (row, columns) => {
  const found = {};
  for (let c = 0; c < row.length; c++) {
    const cell = normHeader(row[c]);
    if (!cell) continue;
    for (const field in columns) {
      if (found[field] === undefined && columns[field].includes(cell)) {
        found[field] = c;
      }
    }
  }
  return found;
};

// Первый профиль, у которого в некоторой строке нашлись ВСЕ required-колонки.
const findColumns = (rows, profiles) => {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    for (const profile of profiles) {
      const cols = matchRowColumns(row, profile.columns);
      if (profile.required.every((f) => cols[f] !== undefined)) {
        return { profile, cols, headerRow: r };
      }
    }
  }
  return null;
};

// Детекция формата. Возвращает { profile, cols, headerRow, rows? } | null.
//
// Профиль может объявить prepare и сам привести файл к таблице: текстовая
// ведомость лежит одной колонкой, и сопоставлять в ней нечего. Такие профили
// проверяются первыми — на сыром файле обычное сопоставление всё равно ничего не
// найдёт. Подготовленные строки возвращаются вызывающему: по ним идут и
// extractPeople, и чтение номера рейса.
export const detectProfile = (rows, profiles) => {
  for (const profile of profiles) {
    if (!profile.prepare) continue;
    const prepared = profile.prepare(rows);
    if (!prepared) continue;
    const found = findColumns(prepared, [profile]);
    if (found) return { ...found, rows: prepared };
  }
  return findColumns(rows, profiles);
};

// Инфанты на руках → такие же записи, как обычные пассажиры. Своих строк в файле у
// них нет, есть только отметка в колонке «РМ» у сопровождающего; если их не завести,
// в заявке от них не останется ничего и через неделю никто не вспомнит, что они
// летели. Имя временное и правится в реестре; сопровождающий стоит ПЕРВЫМ, чтобы при
// сортировке по алфавиту инфант встал сразу под ним — связь видна без групп.
// Номер добавляем только когда у одного сопровождающего их несколько: иначе дедуп
// реестра (по ФИО) схлопнул бы их в одного.
export const expandLapInfants = (lapInfants) =>
  (lapInfants?.carriers || []).flatMap(({ name, count }) =>
    Array.from({ length: count }, (_, i) => ({
      fullName: count > 1 ? `${name} (инфант ${i + 1})` : `${name} (инфант)`,
      seat: null,
      personCategory: "INFANT",
    }))
  );

// Извлечение людей: строки-пассажиры профиля → { fullName, seat, personCategory }.
export const extractPeople = (rows, profile, cols) => {
  const people = [];
  for (const row of rows) {
    if (!row) continue;
    if (!profile.isPassenger(row, cols)) continue;
    // Профиль может задать своё чтение ячейки (многострочность, разделители).
    // Без хука — прежнее поведение: значение ячейки как есть.
    const rawName = profile.readName ? profile.readName(row, cols) : row[cols.name];
    const fullName = cleanFullName(rawName);
    if (!fullName) continue;
    const rawSeat =
      cols.seat === undefined
        ? null
        : profile.readSeat
          ? profile.readSeat(row, cols)
          : row[cols.seat];
    people.push({
      fullName,
      seat: s(rawSeat) || null,
      personCategory: profile.category(row, cols),
    });
  }
  return people;
};
