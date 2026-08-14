// Профили форматов манифестов. Каждый профиль описывает свой формат данными:
// какие колонки искать, как определить строку-пассажира, категорию и номер рейса.
// Новый формат = ещё один профиль в массиве PROFILES.
import { s, isMark, cleanFullName, firstLine } from "./manifestCore.js";
import { prepareFixedWidthManifest } from "./manifestFixedWidth.js";

const isInt = (v) => /^\d+$/.test(s(v));

// Категория по отметкам «РБ»/«РМ». Общая у ПМ и текстовой ведомости: форма одна
// и та же, различается только доставка — таблицей или текстом.
const markCategory = (row, c) =>
  c.inf !== undefined && isMark(row[c.inf])
    ? "INFANT"
    : c.chd !== undefined && isMark(row[c.chd])
      ? "CHILD"
      : "ADULT";

// № рейса PM — первая непустая ячейка ниже заголовка «FLIGHT …» в той же колонке
// (пропуская русскую подпись «№ Рейса»).
const flightPM = (rows) => {
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

// PNL: возрастная категория — код в колонке «Пас.» (НЕ из ремарок: там INFT
// стоит на сопровождающих взрослых, а сами младенцы «РМ» токена не имеют).
const PAX_CATEGORY = { ВЗ: "ADULT", РБ: "CHILD", РМ: "INFANT" };

// № рейса PNL — из титульной строки «…на рейс СУ1177 от …».
// Сначала пробуем «код + пробел? + цифры (+буква?)» — рейс с пробелом
// («ФВ 6346») не обрезаем до кода; иначе прежний захват первого слова.
const flightPNL = (rows) => {
  for (const row of rows) {
    for (const cell of row || []) {
      const text = s(cell);
      if (!/на рейс/i.test(text)) continue;
      const m =
        text.match(/на рейс\s+([A-ZА-ЯЁ]{1,3}\s?\d{1,5}[A-ZА-ЯЁ]?)/i) ||
        text.match(/на рейс\s+(\S+)/i);
      if (m) return m[1];
    }
  }
  return "";
};

// PLI: возрастная категория — латинский код в колонке «Кат».
const PLI_CATEGORY = { ADT: "ADULT", CHD: "CHILD", INF: "INFANT" };

// № рейса PLI — из титульной строки «СПИСОК ПАССАЖИРОВ. РЕЙС A4-3051 ДАТА: …».
const flightPLI = (rows) => {
  for (const row of rows) {
    for (const cell of row || []) {
      const m = s(cell).match(/РЕЙС\s+([A-ZА-ЯЁ0-9-]+)/i);
      if (m) return m[1];
    }
  }
  return "";
};

// Отметки в колонке «РМ» — инфанты на руках: авиакомпания подтвердила это
// 2026-07-31 («1» в «РМ» = инфант у этого пассажира). В самом файле расшифровки
// нет, и это же читается по цифрам: итоговая строка даёт «Пассажиры: 78 / 13 / 3»,
// первые два числа точно совпадают с ADT и CHD из колонки «Кат» (91 строка), а
// третье не имеет ни одной строки — и ровно столько же отметок в «РМ».
// Своих строк у инфантов нет, поэтому отдаём количество ПО КАЖДОМУ сопровождающему:
// в «РМ» может стоять не только 1, а записи в реестре заводятся по одной на инфанта.
const lapInfantsPLI = (rows, cols) => {
  if (cols.infants === undefined) return { count: 0, carriers: [] };
  let count = 0;
  const carriers = [];
  for (const row of rows || []) {
    if (!row) continue;
    if (!isInt(row[cols.seq])) continue;
    const raw = s(row[cols.infants]);
    if (!raw) continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) continue;
    count += n;
    const name = cleanFullName(firstLine(row[cols.name]).replace(/\//g, " "));
    if (name) carriers.push({ name, count: n });
  }
  return { count, carriers };
};

// № рейса текстовой ведомости — под заголовком «№ рейса» в блоке страницы:
//   № рейса   № ВС     ТипВС Ст. А/п вылета   Дата  Время
//   5N596     RA73656    738     ГЕЛЕНДЖИК    06.08 14:00
// Режем по офсету следующего заголовка, а не по первому пробелу: номер с
// пробелом внутри («ФВ 6346» в PNL такие уже встречались) иначе обрезался бы.
const flightPMText = (rows) => {
  for (const row of rows || []) {
    for (const cell of row || []) {
      const lines = String(cell ?? "").split(/\r?\n/);
      const at = lines.findIndex((line) => /№\s*рейса/i.test(line));
      if (at < 0 || at + 1 >= lines.length) continue;
      const end = lines[at].indexOf("№ ВС");
      const field = end > 0 ? lines[at + 1].slice(0, end) : lines[at + 1];
      const flight = s(field).split(/\s{2,}/)[0];
      if (flight) return s(flight);
    }
  }
  return "";
};

export const PROFILES = [
  {
    id: "PM", // Пассажирская ведомость (форма ПМ)
    columns: {
      sec: ["SEC", "РЕГ"],
      name: [
        "SURNAME", "NAME", "PASSENGER",
        "ФИО", "ФАМИЛИЯ", "ФАМИЛИЯИМЯ", "ФАМИЛИЯИМЯОТЧЕСТВО", "ИМЯ", "ПАССАЖИР",
      ],
      seat: ["SEATNO", "SEAT", "SEATNUMBER", "МЕСТО", "МЕСТА", "НОМЕРМЕСТА"],
      chd: ["CHD", "CHILD", "РБ", "РЕБЕНОК", "РЕБЁНОК"],
      inf: ["INF", "INFANT", "РМ", "ИНФАНТ", "МЛАДЕНЕЦ"],
    },
    required: ["sec", "name", "chd", "inf"],
    isPassenger: (row, c) => isInt(row[c.sec]),
    category: markCategory,
    flight: flightPM,
  },
  {
    id: "PNL", // Список пассажиров на рейс (PNL)
    columns: {
      name: ["ФИО", "SURNAME", "ПАССАЖИР"],
      seat: ["М", "МЕСТО", "МЕСТА", "НОМЕРМЕСТА"],
      pax: ["ПАС"],
    },
    required: ["name", "pax"],
    isPassenger: (row, c) =>
      PAX_CATEGORY[s(row[c.pax]).toUpperCase()] !== undefined,
    category: (row, c) => PAX_CATEGORY[s(row[c.pax]).toUpperCase()] || "ADULT",
    flight: flightPNL,
  },
  {
    id: "PLI", // Список пассажиров из DCS (набор колонок настраивается оператором)
    columns: {
      seq: ["SEQ"],
      name: ["ФИОПАССАЖИРАНОМЕРБИРКИ", "ФИОПАССАЖИРА"],
      seat: ["МЕСТАВЕС", "МЕСТА"],
      cat: ["КАТ"],
      infants: ["РМ"],
    },
    required: ["seq", "name", "cat"],
    isPassenger: (row, c) => isInt(row[c.seq]),
    category: (row, c) => PLI_CATEGORY[s(row[c.cat]).toUpperCase()] || "ADULT",
    // ФИО приходит как «SURNAME/NAME MR», под ним в той же ячейке — номера бирок.
    // Слеш заменяем пробелом: в ПМ и PNL ФИО уже через пробел, а дедуп реестра
    // сравнивает строки буква в букву — иначе один человек задвоится.
    readName: (row, c) => firstLine(row[c.name]).replace(/\//g, " "),
    readSeat: (row, c) => firstLine(row[c.seat]),
    flight: flightPLI,
    lapInfants: lapInfantsPLI,
  },
  {
    id: "PM_TEXT", // Та же форма ПМ, но доставленная текстовым отчётом в одной колонке
    // Профиль сам приводит файл к таблице: см. manifestFixedWidth.js. Порядок в
    // массиве роли не играет — detectProfile проверяет prepare-профили первыми.
    prepare: prepareFixedWidthManifest,
    columns: {
      sec: ["РЕГ"],
      name: ["ФАМИЛИЯ"],
      seat: ["МЕСТО"],
      chd: ["РБ"],
      inf: ["РМ"],
    },
    required: ["sec", "name", "chd", "inf"],
    isPassenger: (row, c) => isInt(row[c.sec]),
    category: markCategory,
    flight: flightPMText,
  },
];
