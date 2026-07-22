// Профили форматов манифестов. Каждый профиль описывает свой формат данными:
// какие колонки искать, как определить строку-пассажира, категорию и номер рейса.
// Новый формат = ещё один профиль в массиве PROFILES.
import { s, isMark } from "./manifestCore.js";

const isInt = (v) => /^\d+$/.test(s(v));

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
    category: (row, c) =>
      c.inf !== undefined && isMark(row[c.inf])
        ? "INFANT"
        : c.chd !== undefined && isMark(row[c.chd])
          ? "CHILD"
          : "ADULT",
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
];
