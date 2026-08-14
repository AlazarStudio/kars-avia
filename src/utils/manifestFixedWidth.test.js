import { test } from "node:test";
import assert from "node:assert/strict";
import { prepareFixedWidthManifest } from "./manifestFixedWidth.js";

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
