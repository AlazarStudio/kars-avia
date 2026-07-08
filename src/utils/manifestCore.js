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

// Детекция формата: первый профиль, у которого в некоторой строке нашлись ВСЕ
// required-колонки. Возвращает { profile, cols, headerRow } | null.
export const detectProfile = (rows, profiles) => {
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

// Извлечение людей: строки-пассажиры профиля → { fullName, seat, personCategory }.
export const extractPeople = (rows, profile, cols) => {
  const people = [];
  for (const row of rows) {
    if (!row) continue;
    if (!profile.isPassenger(row, cols)) continue;
    const fullName = cleanFullName(row[cols.name]);
    if (!fullName) continue;
    people.push({
      fullName,
      seat: cols.seat !== undefined ? s(row[cols.seat]) || null : null,
      personCategory: profile.category(row, cols),
    });
  }
  return people;
};
