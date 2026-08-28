import { test } from "node:test";
import assert from "node:assert/strict";
import { detectProfile, extractPeople, expandLapInfants } from "./manifestCore.js";
import { PROFILES } from "./manifestProfiles.js";

const TITLE =
  "СПИСОК ПАССАЖИРОВ. РЕЙС A4-3051 ДАТА: 31.07.2026 STD: 10:30 ETD: 11:00 МАРШРУТ KRR AYT";

// Шапка широкого образца: DCS отдаёт настраиваемый набор колонок, значимые для нас
// пять теряются среди служебных.
const WIDE_HEADER = [
  "Seq",
  "ФИО пассажира\nНомер Бирки",
  "Места\nВес",
  "Кл",
  "Кат",
  "РМ",
  "Ст рег",
  "Тип",
  "Пункт назначения",
  "Стыковка",
  "PNR",
  "Номер билета",
  "Тип документа",
  "Номер документа",
  "Гражданство",
  "Дата рождения",
  "Пол",
  "Багаж\nмест",
  "Багаж\nвес",
  "Ручная кладь",
  "Спец. услуги",
  "Ремарки",
  "Тариф",
  "Бонусная карта",
  "Выход на посадку",
  "Время регистрации",
  "Стойка",
  "Статус",
];

// Шапка узкого образца — тот же рейс, оператор выгрузил только семь колонок.
const NARROW_HEADER = [
  "Seq",
  "ФИО пассажира\nНомер Бирки",
  "Места\nВес",
  "Кл",
  "Кат",
  "РМ",
  "Ст рег",
];

// Строка данных под NARROW_HEADER.
const narrowRow = (seq, name, seat, cat, infants) => [
  seq,
  name,
  seat,
  "Y",
  cat,
  infants ?? null,
  "OK",
];

const narrowSheet = (dataRows) => [
  [TITLE],
  [],
  [],
  NARROW_HEADER,
  ...dataRows,
];

const detectNarrow = (dataRows) => {
  const rows = narrowSheet(dataRows);
  const detected = detectProfile(rows, PROFILES);
  assert.ok(detected, "профиль не определён");
  return { rows, ...detected };
};

test("PLI: детекция на широкой шапке (28 колонок)", () => {
  assert.equal(WIDE_HEADER.length, 28);
  const rows = [[TITLE], [], [], WIDE_HEADER];
  const detected = detectProfile(rows, PROFILES);
  assert.ok(detected);
  assert.equal(detected.profile.id, "PLI");
  assert.equal(detected.headerRow, 3);
  assert.equal(detected.cols.seq, 0);
  assert.equal(detected.cols.name, 1);
  assert.equal(detected.cols.seat, 2);
  assert.equal(detected.cols.cat, 4);
  assert.equal(detected.cols.infants, 5);
});

test("PLI: детекция на узком наборе колонок (7 колонок)", () => {
  const { profile, cols } = detectNarrow([]);
  assert.equal(profile.id, "PLI");
  assert.equal(cols.name, 1);
  assert.equal(cols.seat, 2);
  assert.equal(cols.cat, 4);
});

test("PLI: многострочные ячейки — берётся только первая строка", () => {
  const { rows, profile, cols } = detectNarrow([
    narrowRow("15", "CHEKINA/NATALIA MRS\nA4773854", "15F\n17", "ADT"),
  ]);
  const people = extractPeople(rows, profile, cols);
  assert.equal(people.length, 1);
  assert.equal(people[0].fullName, "CHEKINA NATALIA");
  assert.equal(people[0].seat, "15F");
});

test("PLI: слеш становится пробелом, хвостовой титул срезается", () => {
  const { rows, profile, cols } = detectNarrow([
    narrowRow("72", "CHEKIN/KONSTANTIN MR", "9E", "ADT"),
  ]);
  const people = extractPeople(rows, profile, cols);
  assert.equal(people[0].fullName, "CHEKIN KONSTANTIN");
  assert.equal(people[0].seat, "9E");
});

test("PLI: категории ADT/CHD, неизвестное и пустое — ADULT", () => {
  const { rows, profile, cols } = detectNarrow([
    narrowRow("1", "IVANOV/IVAN MR", "1A", "ADT"),
    narrowRow("2", "IVANOVA/ANNA MISS", "1B", "CHD"),
    narrowRow("3", "PETROV/PETR MR", "1C", "ZZZ"),
    narrowRow("4", "SIDOROV/SEMEN MR", "1D", ""),
  ]);
  const people = extractPeople(rows, profile, cols);
  assert.deepEqual(
    people.map((p) => p.personCategory),
    ["ADULT", "CHILD", "ADULT", "ADULT"],
  );
});

test("PLI: итоговая строка внизу файла не попадает в пассажиров", () => {
  const { rows, profile, cols } = detectNarrow([
    narrowRow("1", "IVANOV/IVAN MR", "1A", "ADT"),
    ["Мест: 91 Пассажиры: 78 / 13 / 3", "Багаж: 64 / 1120", null, null, null],
  ]);
  const people = extractPeople(rows, profile, cols);
  assert.equal(people.length, 1);
  assert.equal(people[0].fullName, "IVANOV IVAN");
});

test("PLI: № рейса берётся из титульной строки", () => {
  const { rows, profile } = detectNarrow([
    narrowRow("1", "IVANOV/IVAN MR", "1A", "ADT"),
  ]);
  assert.equal(profile.flight(rows), "A4-3051");
});

test("PLI: инфанты на руках считаются по колонке «РМ»", () => {
  const { rows, profile, cols } = detectNarrow([
    narrowRow("1", "IVANOV/IVAN MR", "1A", "ADT", "1"),
    narrowRow("2", "PETROVA/OLGA MRS", "2A", "ADT", "1"),
    narrowRow("3", "SIDOROV/SEMEN MR", "3A", "ADT", null),
    narrowRow("4", "KUZNETSOVA/VERA MRS\nA4773854", "4A", "ADT", "1"),
  ]);
  const infants = profile.lapInfants(rows, cols);
  assert.equal(infants.count, 3);
  assert.deepEqual(infants.carriers, [
    { name: "IVANOV IVAN", count: 1 },
    { name: "PETROVA OLGA", count: 1 },
    { name: "KUZNETSOVA VERA", count: 1 },
  ]);
  // Своих строк у инфантов в файле нет — строк-пассажиров ровно четыре.
  assert.equal(extractPeople(rows, profile, cols).length, 4);
});

test("PLI: инфанты разворачиваются в записи под именем сопровождающего", () => {
  const { rows, profile, cols } = detectNarrow([
    narrowRow("1", "IVANOV/IVAN MR", "1A", "ADT", "1"),
    narrowRow("2", "SIDOROV/SEMEN MR", "2A", "ADT", null),
  ]);
  const people = expandLapInfants(profile.lapInfants(rows, cols));
  assert.deepEqual(people, [
    { fullName: "IVANOV IVAN (инфант)", seat: null, personCategory: "INFANT" },
  ]);
});

test("PLI: двое инфантов у одного сопровождающего получают разные имена", () => {
  const { rows, profile, cols } = detectNarrow([
    narrowRow("1", "IVANOV/IVAN MR", "1A", "ADT", "2"),
  ]);
  const infants = profile.lapInfants(rows, cols);
  assert.equal(infants.count, 2);
  assert.deepEqual(
    expandLapInfants(infants).map((p) => p.fullName),
    ["IVANOV IVAN (инфант 1)", "IVANOV IVAN (инфант 2)"]
  );
});

test("форматы без колонки инфантов не дают лишних записей", () => {
  assert.deepEqual(expandLapInfants(null), []);
  assert.deepEqual(expandLapInfants({ count: 0, carriers: [] }), []);
});

test("регресс PM: профиль и категория INFANT не перехвачены PLI", () => {
  const rows = [
    ["SEC", "Surname", "CHD", "INF"],
    ["1", "GORBACHEVA ANNA MRS", null, "X"],
  ];
  const detected = detectProfile(rows, PROFILES);
  assert.ok(detected);
  assert.equal(detected.profile.id, "PM");
  const people = extractPeople(rows, detected.profile, detected.cols);
  assert.deepEqual(people, [
    { fullName: "GORBACHEVA ANNA", seat: null, personCategory: "INFANT" },
  ]);
});

test("регресс PNL: профиль и категория ADULT не перехвачены PLI", () => {
  const rows = [
    ["ФИО", "№ м", "Пас."],
    ["ИВАНОВ ИВАН", "12A", "ВЗ"],
  ];
  const detected = detectProfile(rows, PROFILES);
  assert.ok(detected);
  assert.equal(detected.profile.id, "PNL");
  const people = extractPeople(rows, detected.profile, detected.cols);
  assert.deepEqual(people, [
    { fullName: "ИВАНОВ ИВАН", seat: "12A", personCategory: "ADULT" },
  ]);
});

// ── Текстовая пассажирская ведомость (PM_TEXT) ──
// Формат приходит одной колонкой: в ячейке лежит кусок отчёта с фиксированной
// шириной. Фикстура собирается по офсетам шапки, чтобы не считать пробелы руками.
const VED_COLUMNS =
  "ПАССАЖИРЫ (зарег)\n" +
  "Рег  Фамилия       Пол Кл № м  РБ  РМ  Багаж  Р/кл  №№ баг.бирок  Ремарки  \n" +
  "---------------------------------------------------------------------------";

const VED_FLIGHT =
  'Владелец или Оператор: АО "АК СМАРТАВИА"\n' +
  "№ рейса   № ВС     ТипВС Ст. А/п вылета                         Дата  Время\n" +
  "5N596     RA73656    738     ГЕЛЕНДЖИК                          06.08 14:00\n" +
  "Вылет: 07.08.26 17:02";

const VED_AT = { reg: 0, name: 5, sex: 19, cls: 23, seat: 28, chd: 31, inf: 35 };

const vedLine = (parts) => {
  const chars = Array(45).fill(" ");
  for (const [key, value] of Object.entries(parts)) {
    [...String(value)].forEach((ch, i) => {
      chars[VED_AT[key] + i] = ch;
    });
  }
  return chars.join("");
};

const VED_ROWS = [
  ["ПАССАЖИРСКАЯ ВЕДОМОСТЬ                                   АЭРОПОРТ ГЕЛЕНДЖИК"],
  [VED_FLIGHT],
  [VED_COLUMNS],
  [
    [
      vedLine({ reg: 1, name: "MELNIKOVA", sex: "F", cls: "Э", seat: "8D" }),
      vedLine({ name: "IULIIA" }),
    ].join("\n"),
  ],
  [
    [
      vedLine({ reg: 2, name: "MELNIKOV", cls: "Э", seat: "8F", chd: "X" }),
      vedLine({ name: "MAKAR" }),
    ].join("\n"),
  ],
  [
    [
      vedLine({ reg: 3, name: "PESTEROV", cls: "Э", inf: "X" }),
      vedLine({ name: "VLADIMIR" }),
    ].join("\n"),
  ],
];

test("PM_TEXT: текстовая ведомость распознаётся и даёт людей с категориями", () => {
  const detected = detectProfile(VED_ROWS, PROFILES);
  assert.equal(detected.profile.id, "PM_TEXT");

  const people = extractPeople(detected.rows, detected.profile, detected.cols);
  assert.deepEqual(people, [
    { fullName: "MELNIKOVA IULIIA", seat: "8D", personCategory: "ADULT" },
    { fullName: "MELNIKOV MAKAR", seat: "8F", personCategory: "CHILD" },
    { fullName: "PESTEROV VLADIMIR", seat: null, personCategory: "INFANT" },
  ]);
});

test("PM_TEXT: номер рейса читается из блока страницы", () => {
  const detected = detectProfile(VED_ROWS, PROFILES);
  assert.equal(detected.profile.flight(detected.rows), "5N596");
});

test("PM_TEXT: инфанты идут своими строками, механизм lapInfants не подключается", () => {
  const detected = detectProfile(VED_ROWS, PROFILES);
  assert.equal(detected.profile.lapInfants, undefined);
});

// ── ICAO-манифест (Ред Вингс) ──
const ICAO_ROWS = [
  [
    [
      "                             ПАССАЖИРСКИЙ МАНИФЕСТ",
      "                            ICAO ANNEX 9 APPENDIX 2",
      "                                  АО РЕД ВИНГС",
      "                             RA89143 ИН1082 10AUG26",
    ].join("\n"),
  ],
  ["ФАМИЛИЯ, ИМЯ"],
  ["УФА-РОССИЙСКАЯ ФЕДЕРАЦИЯ"],
  ["   7A ABDULIN AIRAT ISMAGILOVICH           9E AGAFONOV ALEKSANDR VASILEVICH"],
  ["   7F ZIYAPOV ILSHAT TIMERIANOVICH"],
];

test("ICAO: манифест распознаётся, все пассажиры взрослые, места на местах", () => {
  const detected = detectProfile(ICAO_ROWS, PROFILES);
  assert.equal(detected.profile.id, "ICAO");

  const people = extractPeople(detected.rows, detected.profile, detected.cols);
  assert.deepEqual(people, [
    { fullName: "ABDULIN AIRAT ISMAGILOVICH", seat: "7A", personCategory: "ADULT" },
    { fullName: "AGAFONOV ALEKSANDR VASILEVICH", seat: "9E", personCategory: "ADULT" },
    { fullName: "ZIYAPOV ILSHAT TIMERIANOVICH", seat: "7F", personCategory: "ADULT" },
  ]);
});

test("ICAO: номер рейса берётся перед датой, а не бортовой номер", () => {
  const detected = detectProfile(ICAO_ROWS, PROFILES);
  assert.equal(detected.profile.flight(detected.rows), "ИН1082");
});

test("ICAO и ведомость не перехватывают файлы друг друга", () => {
  assert.equal(detectProfile(ICAO_ROWS, PROFILES).profile.id, "ICAO");
  assert.equal(detectProfile(VED_ROWS, PROFILES).profile.id, "PM_TEXT");
});

// ── Выгрузка «Пассажиры» (Руслайн) ──
// Шапка двухэтажная: строка групп («Пассажир», «Билет», «Документ») и под ней
// сами колонки. Верхний этаж в фикстуре оставлен намеренно — «Пассажир» есть в
// синонимах PNL и PM, и тест фиксирует, что файл они не перехватывают.
const RUSLINE_GROUPS = [
  "№", "Пассажир", null, null, null, "Билет", "Документ",
  null, null, null, null, "Телефон агента", "Email",
];

const RUSLINE_HEADER = [
  null, "Категория", "Фамилия", "Имя", "Дата рождения", null, "Гражданство",
  "Тип", "Страна", "Номер", "Срок окончания", null, null,
];

// Дата рождения приходит из SheetJS уже строкой вида «11/26/01» (raw: false).
const ruslineRow = (num, category, surname, firstname) => [
  String(num), category, surname, firstname, "11/26/01",
  "3626177871690 C2", "RU", "PS", "RU", "6722044535", "12/31/49",
  "78095054669", "PAX@MAIL.RU",
];

const RUSLINE_ROWS = [
  ["7R-398, 15.08.2026"],
  [],
  ["SUI-HMA"],
  RUSLINE_GROUPS,
  RUSLINE_HEADER,
  ruslineRow(1, "Взрослый", "БАЛАШОВ", "АНДРЕЙ СЕРГЕЕВИЧ"),
  ruslineRow(2, "Ребенок", "CHERDAKOVA", "AMALIIA"),
  ruslineRow(3, "Ребёнок", "ШЕЛУДКОВ", "МАКАР"),
  ruslineRow(4, "Младенец без места", "ХАПЦЕВА", "ЭММА АСКЕРБИЕВНА"),
];

test("RUSLINE: детекция на нижнем этаже двухэтажной шапки", () => {
  const detected = detectProfile(RUSLINE_ROWS, PROFILES);
  assert.ok(detected);
  assert.equal(detected.profile.id, "RUSLINE");
  assert.equal(detected.headerRow, 4);
  assert.equal(detected.cols.category, 1);
  assert.equal(detected.cols.surname, 2);
  assert.equal(detected.cols.firstname, 3);
});

test("RUSLINE: ФИО из двух колонок, места нет, категории словами", () => {
  const detected = detectProfile(RUSLINE_ROWS, PROFILES);
  const people = extractPeople(RUSLINE_ROWS, detected.profile, detected.cols);
  assert.deepEqual(people, [
    { fullName: "БАЛАШОВ АНДРЕЙ СЕРГЕЕВИЧ", seat: null, personCategory: "ADULT" },
    { fullName: "CHERDAKOVA AMALIIA", seat: null, personCategory: "CHILD" },
    { fullName: "ШЕЛУДКОВ МАКАР", seat: null, personCategory: "CHILD" },
    { fullName: "ХАПЦЕВА ЭММА АСКЕРБИЕВНА", seat: null, personCategory: "INFANT" },
  ]);
});

test("RUSLINE: строки шапки не становятся пассажирами", () => {
  const detected = detectProfile(RUSLINE_ROWS, PROFILES);
  const people = extractPeople(RUSLINE_ROWS, detected.profile, detected.cols);
  assert.equal(people.length, 4);
  assert.ok(!people.some((p) => /Категория|Пассажир/.test(p.fullName)));
});

test("RUSLINE: № рейса берётся из титульной ячейки, а не из маршрута", () => {
  const detected = detectProfile(RUSLINE_ROWS, PROFILES);
  assert.equal(detected.profile.flight(RUSLINE_ROWS), "7R-398");
});

test("RUSLINE: инфанты идут своими строками, механизм lapInfants не подключается", () => {
  const detected = detectProfile(RUSLINE_ROWS, PROFILES);
  assert.equal(detected.profile.lapInfants, undefined);
});

test("RUSLINE и прочие форматы не перехватывают файлы друг друга", () => {
  assert.equal(detectProfile(RUSLINE_ROWS, PROFILES).profile.id, "RUSLINE");
  assert.equal(detectProfile(ICAO_ROWS, PROFILES).profile.id, "ICAO");
  assert.equal(detectProfile(VED_ROWS, PROFILES).profile.id, "PM_TEXT");
  assert.equal(
    detectProfile([[TITLE], [], [], WIDE_HEADER], PROFILES).profile.id,
    "PLI",
  );
  assert.equal(
    detectProfile(
      [["SEC", "Surname", "CHD", "INF"], ["1", "IVANOV IVAN", null, "X"]],
      PROFILES,
    ).profile.id,
    "PM",
  );
  assert.equal(
    detectProfile([["ФИО", "№ м", "Пас."], ["ИВАНОВ ИВАН", "12A", "ВЗ"]], PROFILES)
      .profile.id,
    "PNL",
  );
});
