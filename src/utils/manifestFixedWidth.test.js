import { test } from "node:test";
import assert from "node:assert/strict";
import {
  prepareFixedWidthManifest,
  prepareIcaoManifest,
  prepareAzimutManifest,
  stripPartyCount,
  isAzimutPassenger,
  AZIMUT_HEADER,
} from "./manifestFixedWidth.js";

// Шапка колонок ведомости — она же источник офсетов для всего разбора.
const COLUMNS =
  "ПАССАЖИРЫ (зарег)\n" +
  "Рег  Фамилия       Пол Кл № м  РБ  РМ  Багаж  Р/кл  №№ баг.бирок  Ремарки  \n" +
  "---------------------------------------------------------------------------";

const FLIGHT_BLOCK =
  'Владелец или Оператор: АО "АК СМАРТАВИА"\n' +
  "№ рейса   № ВС     ТипВС Ст. А/п вылета                         Дата  Время\n" +
  "5N596     RA73656    738     ГЕЛЕНДЖИК                          06.08 14:00\n" +
  "Вылет: 07.08.26 17:02";

// Строка ведомости собирается по офсетам шапки: так фикстура читается глазами и
// не зависит от ручного счёта пробелов.
const AT = { reg: 0, name: 5, sex: 19, cls: 23, seat: 28, chd: 31, inf: 35 };

const line = (parts) => {
  const chars = Array(45).fill(" ");
  for (const [key, value] of Object.entries(parts)) {
    [...String(value)].forEach((ch, i) => {
      chars[AT[key] + i] = ch;
    });
  }
  return chars.join("");
};

const cell = (...cellLines) => cellLines.join("\n");

const SHEET = [
  ["ПАССАЖИРСКАЯ ВЕДОМОСТЬ                                   АЭРОПОРТ ГЕЛЕНДЖИК"],
  [FLIGHT_BLOCK],
  [COLUMNS],
  [
    cell(
      line({ reg: 1, name: "MELNIKOVA", sex: "F", cls: "Э", seat: "8D" }),
      line({ name: "IULIIA" })
    ),
  ],
  [
    cell(
      line({ reg: 2, name: "MELNIKOV", cls: "Э", seat: "8F", chd: "X" }),
      line({ name: "MAKAR" })
    ),
  ],
  [cell(line({ reg: 3, name: "PESTEROV", cls: "Э", inf: "X" }), line({ name: "VLADIMIR" }))],
  ["*XCR, DHC, MOS included in Total Pax"],
];

test("ведомость: шапка распознана, служебные строки сохранены, пассажиры разложены", () => {
  const rows = prepareFixedWidthManifest(SHEET);

  assert.ok(rows, "формат должен распознаться");
  assert.deepEqual(rows.at(-4), ["Рег", "Фамилия", "Место", "РБ", "РМ"]);
  assert.deepEqual(rows.at(-3), ["1", "MELNIKOVA IULIIA", "8D", "", ""]);
  assert.deepEqual(rows.at(-2), ["2", "MELNIKOV MAKAR", "8F", "X", ""]);
  assert.deepEqual(rows.at(-1), ["3", "PESTEROV VLADIMIR", "", "", "X"]);
  // Блок рейса обязан дожить до профиля: из него читается номер рейса.
  assert.ok(rows.some((row) => /№ рейса/.test(String(row[0]))));
});

test("ведомость: перенос слова склеивается вплотную, перенос по словам — через пробел", () => {
  const rows = prepareFixedWidthManifest([
    [COLUMNS],
    [
      cell(
        line({ reg: 20, name: "SHCHERBACHENK", sex: "F", cls: "Э", seat: "4F" }),
        line({ name: "O ELENA" }),
        line({ name: "NIKOLAEVNA" })
      ),
    ],
    [
      cell(
        line({ reg: 29, name: "KALUGINA ANNA", sex: "F", cls: "Э", seat: "6E" }),
        line({ name: "KONSTANTINOVN" }),
        line({ name: "A" })
      ),
    ],
  ]);

  assert.equal(rows.at(-2)[1], "SHCHERBACHENKO ELENA NIKOLAEVNA");
  assert.equal(rows.at(-1)[1], "KALUGINA ANNA KONSTANTINOVNA");
});

test("ведомость: чужой файл не распознаётся", () => {
  assert.equal(prepareFixedWidthManifest([["какой-то текст"], ["ещё строка"]]), null);
  assert.equal(prepareFixedWidthManifest([["Рег", "Фамилия", "РБ", "РМ"]]), null);
});

// ── ICAO-манифест: две записи в строке, шапки колонок нет ──
const ICAO_TITLE = [
  "                             ПАССАЖИРСКИЙ МАНИФЕСТ",
  "                            ICAO ANNEX 9 APPENDIX 2",
  "                                  АО РЕД ВИНГС",
  "                             RA89143 ИН1082 10AUG26",
].join("\n");

const ICAO_SHEET = [
  [ICAO_TITLE],
  ["                                                                     Стр. 1 из 1"],
  ["ОТ НОВЫЙ УРЕНГОЙ НОВЫЙ УРЕНГОЙ-РОССИЙСКАЯ ФЕДЕРАЦИЯ                .ДО СМ. НИЖЕ"],
  ["ФАМИЛИЯ, ИМЯ"],
  ["УФА-РОССИЙСКАЯ ФЕДЕРАЦИЯ"],
  ["   7A ABDULIN AIRAT ISMAGILOVICH           9E AGAFONOV ALEKSANDR VASILEVICH"],
  ["   8C ASFANDIIAROV VLADISLAV VASILEVIC     8E ASHIEV KIRILL ALEKSANDROVICH"],
  ["   7F ZIYAPOV ILSHAT TIMERIANOVICH"],
  ["Сформировано 11.08.26 17:11"],
];

test("ICAO: строка режется на две записи, последняя одиночная сохраняется", () => {
  const rows = prepareIcaoManifest(ICAO_SHEET);

  assert.ok(rows);
  assert.deepEqual(rows.at(-6), ["Место", "Фамилия"]);
  assert.deepEqual(rows.at(-5), ["7A", "ABDULIN AIRAT ISMAGILOVICH"]);
  assert.deepEqual(rows.at(-4), ["9E", "AGAFONOV ALEKSANDR VASILEVICH"]);
  assert.deepEqual(rows.at(-3), ["8C", "ASFANDIIAROV VLADISLAV VASILEVIC"]);
  assert.deepEqual(rows.at(-2), ["8E", "ASHIEV KIRILL ALEKSANDROVICH"]);
  assert.deepEqual(rows.at(-1), ["7F", "ZIYAPOV ILSHAT TIMERIANOVICH"]);
});

test("ICAO: служебные строки пассажирами не становятся", () => {
  const rows = prepareIcaoManifest(ICAO_SHEET);
  const people = rows.slice(rows.findIndex((row) => row[0] === "Место") + 1);
  assert.equal(people.length, 5);
});

test("раскладки не перехватывают файлы друг друга", () => {
  assert.equal(prepareIcaoManifest(SHEET), null);
  assert.equal(prepareFixedWidthManifest(ICAO_SHEET), null);
});

// ── Текстовый манифест DCS «Азимута»: одна строка отчёта — одна ячейка ──
// Офсеты — как в образце МинВоды (10.09): РЕГ 0 · ФИО 4 · НАП 24 · КАТ 28 · КЛ 32 ·
// МЕСТО 35 · БАГАЖ 41 · УСЛУГИ 74. ФИО в фикстуре выдуманные.
const AZ_AT = { reg: 0, name: 4, dir: 24, cat: 28, cls: 32, seat: 35, bag: 41, ssr: 74 };

const azLine = (parts) => {
  const chars = Array(81).fill(" ");
  for (const [key, value] of Object.entries(parts)) {
    [...String(value)].forEach((ch, i) => {
      chars[AZ_AT[key] + i] = ch;
    });
  }
  return chars.join("");
};

const AZ_COLUMNS = azLine({
  reg: "РЕГ", name: "ФИО", dir: "НАП", cat: "КАТ", cls: "КЛ",
  seat: "МЕСТО", bag: "БАГАЖ", ssr: "УСЛУГИ",
});

const AZ_SHEET = [
  ["ПАССАЖИРСКИЙ МАНИФЕСТ                            АЭРОПОРТ                  1 из 2"],
  ["Тестова Мария Ивановна 150"],
  ["ОПЕРАТОР: АЗИМУТ"],
  ["РЕЙС: A4 6066"],
  ["МАРШРУТ: HMA MRV"],
  ["ДАТА: 10.09.2026 STD: 19:40 ETD: 19:40"],
  ["-".repeat(81)],
  [AZ_COLUMNS],
  ["-".repeat(81)],
  [azLine({ reg: "4", name: "1PETROV/IVAN", dir: "MRV", cls: "Y", seat: "01D", ssr: "SPML" })],
  [azLine({ ssr: "SPML" })],
  [azLine({ reg: "33", name: "1SIDOROVA/ANNA", dir: "MRV", cat: "1", cls: "Y", seat: "02A", bag: "1" })],
  [azLine({ name: "SIDOROVA/MARIA", dir: "MRV", cat: "INF", cls: "Y" })],
  [azLine({ reg: "7", name: "1KOZLOV/PAVEL", dir: "MRV", cat: "CHD", cls: "Y", seat: "02F" })],
  // Разрыв страницы: служебный блок и шапка колонок повторяются — людьми не становятся.
  ["Дата/Время формирования: 10.09.2026 18:12    "],
  ["ПАССАЖИРСКИЙ МАНИФЕСТ                            АЭРОПОРТ                  2 из 2"],
  ["ОПЕРАТОР: АЗИМУТ"],
  ["РЕЙС: A4 6066"],
  ["-".repeat(81)],
  [AZ_COLUMNS],
  ["-".repeat(81)],
  // Фамилия во всё поле: слеш обрезан самим файлом, строку держит номер «РЕГ».
  [azLine({ reg: "3", name: "1KONSTANTINOPOLSKII", dir: "MRV", cls: "Y", seat: "07D" })],
  ["-".repeat(81)],
  ["ЗАНЯТО МЕСТ     ADT     CHD INF          БАГАЖ ВЕС    Р/К  ПЛАТ ПОДПИСЬ        "],
  ["60              38/22       3            33    335    102  11                  "],
  ["Дата/Время формирования: 10.09.2026 18:12    "],
];

test("Азимут: шапка распознана, пассажиры разложены, служебные строки сохранены", () => {
  const rows = prepareAzimutManifest(AZ_SHEET);

  assert.ok(rows, "формат должен распознаться");
  assert.deepEqual(rows.at(-6), AZIMUT_HEADER);
  assert.deepEqual(rows.at(-5), ["4", "1PETROV/IVAN", "01D", ""]);
  assert.deepEqual(rows.at(-4), ["33", "1SIDOROVA/ANNA", "02A", "1"]);
  assert.deepEqual(rows.at(-3), ["", "SIDOROVA/MARIA", "", "INF"]);
  assert.deepEqual(rows.at(-2), ["7", "1KOZLOV/PAVEL", "02F", "CHD"]);
  assert.deepEqual(rows.at(-1), ["3", "1KONSTANTINOPOLSKII", "07D", ""]);
  // Строка с рейсом доживает до профиля — из неё читается номер рейса.
  assert.ok(rows.some((row) => /РЕЙС: A4 6066/.test(String(row[0]))));
  // Продолжение с одним кодом услуги, итог «38/22», служебные строки — не люди.
  const people = rows.slice(rows.indexOf(AZIMUT_HEADER) + 1);
  assert.equal(people.length, 5);
});

test("Азимут: счётчик брони срезается, строка-пассажир — по форме ФИО", () => {
  assert.equal(stripPartyCount("1PETROV/IVAN"), "PETROV/IVAN");
  assert.equal(stripPartyCount("SIDOROVA/MARIA"), "SIDOROVA/MARIA");
  assert.equal(stripPartyCount("38/22"), "/22");
  assert.equal(stripPartyCount(""), "");

  assert.equal(isAzimutPassenger("4", "1PETROV/IVAN"), true);
  assert.equal(isAzimutPassenger("", "SIDOROVA/MARIA"), true); // инфант без «РЕГ»
  assert.equal(isAzimutPassenger("3", "1KONSTANTINOPOLSKII"), true); // слеш обрезан
  assert.equal(isAzimutPassenger("РЕГ", "ФИО"), false); // шапка
  assert.equal(isAzimutPassenger("60", "38/22"), false); // итог
  assert.equal(isAzimutPassenger("ОПЕР", "АТОР: АЗИМУТ"), false); // служебная строка
  assert.equal(isAzimutPassenger("Врем", "я/Дата формирования:"), false); // служебная строка со слешем
  assert.equal(isAzimutPassenger("", ""), false); // продолжение с кодом услуги
});

test("Азимут и соседние раскладки не перехватывают файлы друг друга", () => {
  // Титул у «Азимута» тот же, что у ICAO, — ICAO обязан отказаться.
  assert.equal(prepareIcaoManifest(AZ_SHEET), null);
  assert.equal(prepareFixedWidthManifest(AZ_SHEET), null);
  assert.equal(prepareAzimutManifest(SHEET), null);
  assert.equal(prepareAzimutManifest(ICAO_SHEET), null);
});
