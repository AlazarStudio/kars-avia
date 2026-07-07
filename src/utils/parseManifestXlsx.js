import * as XLSX from "xlsx";

// Парсер «Пассажирской ведомости (ЭБ)» (форма ПМ из аэропортовых ДКС-систем).
// Печатная форма с объединёнными ячейками и повторяющимися постраничными
// блоками — читаем лист позиционно (матрицей), колонки ищем по заголовкам.

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ

const s = (v) => String(v ?? "").trim();

// Хвостовые титулы из систем бронирования: "GORBACHEVA ANNA MRS"
const TITLE_RE = /\s+(MR|MRS|MS|MISS|MSTR)$/i;
const cleanFullName = (v) =>
  s(v).replace(TITLE_RE, "").replace(/\s+/g, " ").trim();

// Отметка в колонках CHD/INF: «X» латиницей или кириллицей (ручные правки формы)
const isMark = (v) => {
  const value = s(v).toUpperCase();
  return value === "X" || value === "Х";
};

// Зеркало бэкового normalizeFullNameKey (services/passengerRequest/savedPassengers.js) —
// для локального подсчёта «добавлено/пропущено» до ответа сервера
export const manifestNameKey = (fullName) =>
  String(fullName ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

// Синонимы заголовков колонок (английские/русские варианты формы ПМ).
// Матчинг — ТОЧНОЕ совпадение нормализованной ячейки (см. normHeader), а не
// подстрока: иначе «№Места» (место) спутается с «Мест» (кол-во мест багажа).
const HEADER_SYNONYMS = {
  sec: ["SEC", "РЕГ"],
  surname: [
    "SURNAME", "NAME", "PASSENGER",
    "ФИО", "ФАМИЛИЯ", "ФАМИЛИЯИМЯ", "ФАМИЛИЯИМЯОТЧЕСТВО", "ИМЯ", "ПАССАЖИР",
  ],
  seat: ["SEATNO", "SEAT", "SEATNUMBER", "МЕСТО", "МЕСТА", "НОМЕРМЕСТА"],
  chd: ["CHD", "CHILD", "РБ", "РЕБЕНОК", "РЕБЁНОК"],
  inf: ["INF", "INFANT", "РМ", "ИНФАНТ", "МЛАДЕНЕЦ"],
};

// Нормализация ячейки заголовка: верхний регистр, без пробелов и пунктуации
// («Seat No» → «SEATNO», «№Места» → «МЕСТА», «Фамилия, имя» → «ФАМИЛИЯИМЯ»).
const normHeader = (v) =>
  String(v ?? "").toUpperCase().replace(/[\s.,;№/\\-]/g, "");

// Строка-заголовок таблицы пассажиров содержит ячейки SEC и Surname (или их
// синонимы); из неё берём индексы колонок. Позиции и язык могут отличаться
// между ДКС-системами — ищем по названию, первое совпадение на строку.
const findHeader = (rows) => {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    const cols = { sec: -1, surname: -1, seat: -1, chd: -1, inf: -1 };
    for (let c = 0; c < row.length; c++) {
      const cell = normHeader(row[c]);
      if (!cell) continue;
      for (const key in cols) {
        if (cols[key] === -1 && HEADER_SYNONYMS[key].includes(cell)) {
          cols[key] = c;
        }
      }
    }
    if (cols.sec !== -1 && cols.surname !== -1) return cols;
  }
  return null;
};

// № рейса — первая непустая ячейка ниже заголовка "FLIGHT №" в той же колонке
// (пропуская русскую подпись «№ Рейса»)
const findFlightNumber = (rows) => {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c++) {
      if (s(row[c]).toUpperCase().startsWith("FLIGHT")) {
        for (let d = r + 1; d < Math.min(r + 8, rows.length); d++) {
          const value = s(rows[d]?.[c]);
          if (!value || /рейс/i.test(value)) continue;
          return value;
        }
        return "";
      }
    }
  }
  return "";
};

// Возвращает { people: [{ fullName, seat, personCategory }], flightNumber, error }
export async function parseManifestXlsx(file) {
  if (file.size > MAX_FILE_SIZE) {
    return { people: [], flightNumber: "", error: "Файл больше 10 МБ" };
  }

  let wb;
  try {
    const buf = await file.arrayBuffer();
    wb = XLSX.read(buf, { type: "array" });
  } catch {
    return { people: [], flightNumber: "", error: "Не удалось прочитать файл" };
  }

  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) {
    return { people: [], flightNumber: "", error: "Файл пустой" };
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });

  const cols = findHeader(rows);
  if (!cols) {
    return {
      people: [],
      flightNumber: "",
      error: "Файл не распознан как пассажирская ведомость (ПМ)",
    };
  }

  const people = [];
  for (const row of rows) {
    if (!row) continue;
    const sec = s(row[cols.sec]);
    const fullName = cleanFullName(row[cols.surname]);
    // Строка пассажира: целый рег. номер + непустое ФИО. Отсекает заголовки,
    // «Total in class», «РЕГ», итоги (у итоговой строки Surname пуст) и подписи.
    if (!/^\d+$/.test(sec) || !fullName) continue;

    const isChild = cols.chd !== -1 && isMark(row[cols.chd]);
    const isInfant = cols.inf !== -1 && isMark(row[cols.inf]);
    people.push({
      fullName,
      seat: cols.seat !== -1 ? s(row[cols.seat]) || null : null,
      personCategory: isInfant ? "INFANT" : isChild ? "CHILD" : "ADULT",
    });
  }

  if (!people.length) {
    return {
      people: [],
      flightNumber: "",
      error: "В файле не найдено ни одного пассажира",
    };
  }

  return { people, flightNumber: findFlightNumber(rows), error: null };
}
