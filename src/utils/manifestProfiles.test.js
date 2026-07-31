import { test } from "node:test";
import assert from "node:assert/strict";
import { detectProfile, extractPeople } from "./manifestCore.js";
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

test("PLI: младенцы на руках считаются по колонке «РМ»", () => {
  const { rows, profile, cols } = detectNarrow([
    narrowRow("1", "IVANOV/IVAN MR", "1A", "ADT", "1"),
    narrowRow("2", "PETROVA/OLGA MRS", "2A", "ADT", "1"),
    narrowRow("3", "SIDOROV/SEMEN MR", "3A", "ADT", null),
    narrowRow("4", "KUZNETSOVA/VERA MRS\nA4773854", "4A", "ADT", "1"),
  ]);
  const infants = profile.lapInfants(rows, cols);
  assert.equal(infants.count, 3);
  assert.deepEqual(infants.carriers, [
    "IVANOV IVAN",
    "PETROVA OLGA",
    "KUZNETSOVA VERA",
  ]);
  // Своих строк у младенцев нет — пассажиров ровно четверо.
  assert.equal(extractPeople(rows, profile, cols).length, 4);
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
