import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatMoney,
  formatDays,
  trimSeconds,
  splitDateTime,
  getArrivalHighlight,
  getDepartureHighlight,
  livingCostTooltip,
  pluralizeRows,
  editableValue,
  pluralizeDays,
  rowMatchesSearch,
  describeShareSegments,
  listCohabitants,
  breakfastCellText,
  reportDateToInputValue,
  inputValueToReportDate,
  sortDraftRows,
  computeStayDays,
  applyDateChange,
  applyMealCountChange,
  groupRowsByRoom,
  buildRoomMates,
  applyTotalChange,
  clampTotalPatch,
  normalizeShareNoteOverride,
  hasManualShareNote,
  buildHotelOptions,
  withCurrentHotel,
  hotelNameForValue,
  CURRENT_HOTEL_VALUE,
} from "./reportDraftEditorUtils.js";

// Формат границ — как на стенде: "DD.MM.YYYY HH:MM:SS", уже отформатирован бэком.
const segments = [
  {
    start: "01.08.2026 00:10:00",
    end: "07.08.2026 12:00:00",
    alone: false,
    cohabitants: [{ requestId: "r1", personName: "Котов Д.С." }],
  },
  {
    start: "09.08.2026 14:00:00",
    end: "10.08.2026 23:50:00",
    alone: false,
    cohabitants: [{ requestId: "r2", personName: "Еремин А.П." }],
  },
];

test("describeShareSegments trims seconds and pulls out cohabitant names", () => {
  assert.deepEqual(describeShareSegments(segments), [
    {
      period: "01.08.2026 00:10 — 07.08.2026 12:00",
      names: ["Котов Д.С."],
      alone: false,
    },
    {
      period: "09.08.2026 14:00 — 10.08.2026 23:50",
      names: ["Еремин А.П."],
      alone: false,
    },
  ]);
});

test("describeShareSegments marks a solo stay as alone", () => {
  const solo = [
    { start: "03.08.2026 19:00:00", end: "10.08.2026 23:50:00", alone: true, cohabitants: [] },
  ];
  const [only] = describeShareSegments(solo);
  assert.equal(only.alone, true);
  assert.deepEqual(only.names, []);
});

test("describeShareSegments survives junk", () => {
  assert.deepEqual(describeShareSegments(null), []);
  assert.deepEqual(describeShareSegments(undefined), []);
  const [broken] = describeShareSegments([{}]);
  assert.equal(broken.period, "");
  assert.equal(broken.alone, true); // соседей нет — значит жил один
});

test("listCohabitants collects names once, in order", () => {
  assert.deepEqual(listCohabitants(segments), ["Котов Д.С.", "Еремин А.П."]);

  const repeated = [
    { start: "a", end: "b", cohabitants: [{ personName: "Котов Д.С." }] },
    { start: "c", end: "d", cohabitants: [{ personName: "Котов Д.С." }] },
  ];
  assert.deepEqual(listCohabitants(repeated), ["Котов Д.С."]);
  assert.deepEqual(listCohabitants(null), []);
});

test("formatMoney rounds and groups thousands the way ru-RU toLocaleString does", () => {
  // toLocaleString("ru-RU") groups with a non-breaking space (U+00A0), not a
  // regular space — comparing against a literal risks a silent whitespace
  // mismatch, so the expectation is derived the same way the source does.
  assert.equal(formatMoney(1234567), (1234567).toLocaleString("ru-RU"));
  assert.equal(formatMoney(1234.6), (1235).toLocaleString("ru-RU"));
  assert.equal(formatMoney(null), "0");
  assert.equal(formatMoney("abc"), "0");
});

test("formatDays trims binary tails and uses the Russian decimal comma", () => {
  assert.equal(formatDays(4.5), "4,5");
  assert.equal(formatDays(12), "12");
  assert.equal(formatDays(3.3000000000000003), "3,3");
  assert.equal(formatDays(0), "0");
  assert.equal(formatDays(null), "0");
});

test("trimSeconds strips :SS and tolerates missing/short values", () => {
  assert.equal(trimSeconds("07.07.2026 22:00:00"), "07.07.2026 22:00");
  assert.equal(trimSeconds("07.07.2026 22:00"), "07.07.2026 22:00");
  assert.equal(trimSeconds(""), "");
  assert.equal(trimSeconds(null), null);
});

test("splitDateTime separates date and time", () => {
  assert.deepEqual(splitDateTime("07.07.2026 22:00:00"), { date: "07.07.2026", time: "22:00" });
  assert.deepEqual(splitDateTime(""), { date: "", time: "" });
  assert.deepEqual(splitDateTime(null), { date: "", time: "" });
});

test("getArrivalHighlight flags an arrival before the full-day threshold", () => {
  assert.equal(getArrivalHighlight("07.07.2026 05:30:00").highlighted, true);
  assert.equal(getArrivalHighlight("07.07.2026 06:00:00").highlighted, false);
  assert.equal(getArrivalHighlight("07.07.2026 14:00:00").highlighted, false);
  assert.equal(getArrivalHighlight("").highlighted, false);
  assert.equal(getArrivalHighlight(null).title, undefined);
});

test("getDepartureHighlight flags a departure after the half-day threshold", () => {
  assert.equal(getDepartureHighlight("07.07.2026 12:30:00").highlighted, true);
  assert.equal(getDepartureHighlight("07.07.2026 12:00:00").highlighted, false);
  assert.equal(getDepartureHighlight("07.07.2026 09:00:00").highlighted, false);
  assert.equal(getDepartureHighlight("").highlighted, false);
});

test("livingCostTooltip explains an edited row unconditionally", () => {
  const row = { totalDays: 2, pricePerDay: 1000, totalLivingCost: 2000 };
  assert.equal(livingCostTooltip(row, true), "Сутки × цена (строка правлена вручную)");
});

test("livingCostTooltip stays quiet when the untouched sum matches days × price", () => {
  const row = { totalDays: 2, pricePerDay: 1000, totalLivingCost: 2000 };
  assert.equal(livingCostTooltip(row, false), undefined);
});

test("livingCostTooltip explains a shared-room split on an untouched row", () => {
  const row = { totalDays: 2, pricePerDay: 1000, totalLivingCost: 1500 };
  assert.equal(livingCostTooltip(row, false), "Сервер разделил стоимость номера между соседями");
});

test("pluralizeRows follows the standard Russian plural rule", () => {
  assert.equal(pluralizeRows(1), "строка");
  assert.equal(pluralizeRows(21), "строка");
  assert.equal(pluralizeRows(2), "строки");
  assert.equal(pluralizeRows(3), "строки");
  assert.equal(pluralizeRows(4), "строки");
  assert.equal(pluralizeRows(24), "строки");
  assert.equal(pluralizeRows(5), "строк");
  assert.equal(pluralizeRows(11), "строк");
  assert.equal(pluralizeRows(12), "строк");
  assert.equal(pluralizeRows(14), "строк");
  assert.equal(pluralizeRows(0), "строк");
});

test("rowMatchesSearch matches name, position, room and category case-insensitively", () => {
  const row = {
    personName: "Иванов Иван",
    personPosition: "КВС",
    roomName: "101",
    category: "Двухместный",
  };
  assert.equal(rowMatchesSearch(row, ""), true);
  assert.equal(rowMatchesSearch(row, "иванов"), true);
  assert.equal(rowMatchesSearch(row, "КВС"), true);
  assert.equal(rowMatchesSearch(row, "101"), true);
  assert.equal(rowMatchesSearch(row, "двухместный"), true);
  assert.equal(rowMatchesSearch(row, "нет такого"), false);
});

test("pluralizeDays follows the standard Russian plural rule", () => {
  assert.equal(pluralizeDays(1), "день");
  assert.equal(pluralizeDays(21), "день");
  assert.equal(pluralizeDays(2), "дня");
  assert.equal(pluralizeDays(3), "дня");
  assert.equal(pluralizeDays(4), "дня");
  assert.equal(pluralizeDays(22), "дня");
  assert.equal(pluralizeDays(5), "дней");
  assert.equal(pluralizeDays(8), "дней");
  assert.equal(pluralizeDays(11), "дней");
  assert.equal(pluralizeDays(12), "дней");
  assert.equal(pluralizeDays(14), "дней");
  assert.equal(pluralizeDays(0), "дней");
});

test("editableValue blanks a zero so typing over it does not prepend it", () => {
  assert.equal(editableValue(0), "");
  assert.equal(editableValue("0"), "");
  assert.equal(editableValue(null), "");
  assert.equal(editableValue(undefined), "");
  assert.equal(editableValue(""), "");
  assert.equal(editableValue(866), 866);
  assert.equal(editableValue(2.5), 2.5);
  assert.equal(editableValue("3400"), "3400");
});

test("getArrivalHighlight uses the threshold from the passed rules", () => {
  const rules = { arrivalFullBefore: "07:00" };
  assert.equal(getArrivalHighlight("07.07.2026 06:30:00", rules).highlighted, true);
  assert.equal(getArrivalHighlight("07.07.2026 07:00:00", rules).highlighted, false);
  assert.equal(getArrivalHighlight("07.07.2026 07:30:00", rules).highlighted, false);
  assert.ok(getArrivalHighlight("07.07.2026 06:30:00", rules).title.includes("07:00"));
});

test("getDepartureHighlight uses the threshold from the passed rules", () => {
  const rules = { departureHalfAfter: "13:00" };
  assert.equal(getDepartureHighlight("07.07.2026 13:30:00", rules).highlighted, true);
  assert.equal(getDepartureHighlight("07.07.2026 13:00:00", rules).highlighted, false);
  assert.equal(getDepartureHighlight("07.07.2026 12:30:00", rules).highlighted, false);
  assert.ok(getDepartureHighlight("07.07.2026 13:30:00", rules).title.includes("13:00"));
});

test("highlights fall back to the defaults without rules", () => {
  assert.equal(getArrivalHighlight("07.07.2026 05:30:00").highlighted, true);
  assert.ok(getArrivalHighlight("07.07.2026 05:30:00").title.includes("06:00"));
  assert.equal(getDepartureHighlight("07.07.2026 12:30:00").highlighted, true);
  assert.ok(getDepartureHighlight("07.07.2026 12:30:00").title.includes("12:00"));
});

test("highlights fall back to the defaults when the rules object lacks the key", () => {
  // Правила без нужного поля не должны ни гасить подсветку, ни ронять расчёт.
  assert.equal(getArrivalHighlight("07.07.2026 05:30:00", {}).highlighted, true);
  assert.ok(getArrivalHighlight("07.07.2026 05:30:00", {}).title.includes("06:00"));
  assert.equal(getDepartureHighlight("07.07.2026 12:30:00", {}).highlighted, true);
  assert.ok(getDepartureHighlight("07.07.2026 12:30:00", {}).title.includes("12:00"));
});

test("highlights fall back to the defaults when the stored threshold does not parse", () => {
  // Бэковый регексп допускает час без ведущего нуля: "6:00" он сохранит и
  // посчитает как 06:00, а фронтовый parseHhMm вернёт null. Подсветка должна
  // остаться (по дефолту), а не пропасть молча.
  const arrival = getArrivalHighlight("07.07.2026 05:30:00", { arrivalFullBefore: "6:00" });
  assert.equal(arrival.highlighted, true);
  assert.ok(arrival.title.includes("06:00"));
  assert.equal(getArrivalHighlight("07.07.2026 06:30:00", { arrivalFullBefore: "6:00" }).highlighted, false);

  const departure = getDepartureHighlight("07.07.2026 12:30:00", { departureHalfAfter: "2:00" });
  assert.equal(departure.highlighted, true);
  assert.ok(departure.title.includes("12:00"));
});

test("breakfastCellText prints 'вкл' when breakfast is included in the room price", () => {
  assert.equal(breakfastCellText({ breakfastIncludedInPrice: true, breakfastCount: 3 }), "вкл");
  assert.equal(breakfastCellText({ breakfastIncludedInPrice: false, breakfastCount: 2 }), "2");
  assert.equal(breakfastCellText({ breakfastIncludedInPrice: false }), "0");
  assert.equal(breakfastCellText({}), "0");
});

test("reportDateToInputValue: формат контракта → datetime-local и обратно без потерь", () => {
  assert.equal(reportDateToInputValue("03.08.2026 19:00:00"), "2026-08-03T19:00");
  assert.equal(reportDateToInputValue("03.08.2026 19:00"), "2026-08-03T19:00");
  assert.equal(reportDateToInputValue(""), "");
  assert.equal(reportDateToInputValue(null), "");
  assert.equal(reportDateToInputValue("мусор"), "");

  assert.equal(inputValueToReportDate("2026-08-03T19:00"), "03.08.2026 19:00:00");
  assert.equal(inputValueToReportDate(""), "");
  // Круговая поездка стабильна: строка с секундами возвращается той же —
  // без этого нетронутая дата считалась бы правкой.
  const original = "01.08.2026 00:10:00";
  assert.equal(inputValueToReportDate(reportDateToInputValue(original)), original);
});

test("sortDraftRows №58: числа, даты, русские строки, направление, стабильность", () => {
  const rows = [
    { _uid: 0, personName: "Яшин", arrival: "05.08.2026 10:00:00", totalDays: 2, totalDebt: 300 },
    { _uid: 1, personName: "Абрамов", arrival: "01.08.2026 22:00:00", totalDays: 10, totalDebt: 100 },
    { _uid: 2, personName: "Иванов", arrival: "01.08.2026 08:00:00", totalDays: 2, totalDebt: 200 },
  ];
  // Числа — числом (10 после 2, а не лексикографически)
  assert.deepEqual(sortDraftRows(rows, "totalDays", "asc").map((r) => r._uid), [0, 2, 1]);
  // Стабильность: равные totalDays (uid 0 и 2) остаются в порядке файла
  // Даты — по значению, включая время внутри одного дня
  assert.deepEqual(sortDraftRows(rows, "arrival", "asc").map((r) => r._uid), [2, 1, 0]);
  // Русские строки по алфавиту, направление desc переворачивает
  assert.deepEqual(sortDraftRows(rows, "personName", "desc").map((r) => r._uid), [0, 2, 1]);
  // Неизвестный ключ — порядок не меняется (и это тот же массив по данным)
  assert.deepEqual(sortDraftRows(rows, "shareNote", "asc").map((r) => r._uid), [0, 1, 2]);
  // Исходный массив не мутируется
  assert.equal(rows[0]._uid, 0);
});

test("sortDraftRows: пустые значения не роняют сортировку", () => {
  const rows = [
    { _uid: 0, pricePerDay: null, hotelName: "" },
    { _uid: 1, pricePerDay: 500, hotelName: "Азимут" },
  ];
  assert.deepEqual(sortDraftRows(rows, "pricePerDay", "asc").map((r) => r._uid), [0, 1]);
  assert.deepEqual(sortDraftRows(rows, "hotelName", "desc").map((r) => r._uid), [1, 0]);
});

test("computeStayDays зеркалит бэковую calcTotalDays (дефолтные правила)", () => {
  // 3 календарных дня, заезд 19:00 (без надбавки), выезд 12:00 (не > 12:00)
  assert.equal(computeStayDays("03.08.2026 19:00:00", "06.08.2026 12:00:00", null), 3);
  // ранний заезд до 06:00 → +1
  assert.equal(computeStayDays("03.08.2026 05:30:00", "06.08.2026 12:00:00", null), 4);
  // заезд 06:00–14:00 → +0.5; выезд после 18:00 → +1
  assert.equal(computeStayDays("03.08.2026 10:00:00", "06.08.2026 19:00:00", null), 4.5);
  // выезд 12:01–18:00 → +0.5
  assert.equal(computeStayDays("03.08.2026 19:00:00", "06.08.2026 12:30:00", null), 3.5);
  // сентинели бэка: заезд 00:10 — ноль надбавки, выезд 23:50 — полный день
  assert.equal(computeStayDays("03.08.2026 00:10:00", "06.08.2026 12:00:00", null), 3);
  assert.equal(computeStayDays("03.08.2026 19:00:00", "06.08.2026 23:50:00", null), 4);
  // нераспарсиваемое — null
  assert.equal(computeStayDays("мусор", "06.08.2026 12:00:00", null), null);
});

test("applyDateChange: сутки, питание пропорцией, деньги следом", () => {
  const row = {
    arrival: "03.08.2026 19:00:00", departure: "06.08.2026 12:00:00",
    totalDays: 3, breakfastCount: 3, lunchCount: 3, dinnerCount: 0,
    breakfastIncludedInPrice: false, totalMealCost: 3000, pricePerDay: 4500,
    totalLivingCost: 13500, totalDebt: 16500,
  };
  // выезд сдвинулся на сутки позже: 3 → 4 суток
  const patch = applyDateChange(row, "departure", "07.08.2026 12:00:00", null);
  assert.equal(patch.totalDays, 4);
  assert.equal(patch.breakfastCount, 4); // 1/сутки × 4
  assert.equal(patch.lunchCount, 4);
  assert.equal(patch.dinnerCount, 0);
  // средняя цена приёма 3000/6 = 500 → 8 приёмов × 500
  assert.equal(patch.totalMealCost, 4000);
  assert.equal(patch.totalLivingCost, 18000); // 4 × 4500
  assert.equal(patch.totalDebt, 22000);
});

test("applyDateChange: завтрак «вкл» не участвует в средней цене приёма", () => {
  const row = {
    arrival: "03.08.2026 19:00:00", departure: "05.08.2026 12:00:00",
    totalDays: 2, breakfastCount: 2, lunchCount: 2, dinnerCount: 0,
    breakfastIncludedInPrice: true, totalMealCost: 1000, pricePerDay: 1000,
    totalLivingCost: 2000, totalDebt: 3000,
  };
  const patch = applyDateChange(row, "departure", "07.08.2026 12:00:00", null);
  // платных приёмов было 2 (обеды), цена приёма 500; стало 4 обеда → 2000
  assert.equal(patch.totalMealCost, 2000);
  assert.equal(patch.totalDebt, 4000 + 2000);
});

test("applyDateChange: нераспарсиваемая дата меняет только само поле", () => {
  const row = { arrival: "03.08.2026 19:00:00", departure: "06.08.2026 12:00:00", totalDays: 3 };
  const patch = applyDateChange(row, "departure", "", null);
  assert.deepEqual(Object.keys(patch), ["departure"]);
});

test("applyMealCountChange: стоимость питания по средней цене приёма", () => {
  const row = {
    breakfastCount: 2, lunchCount: 2, dinnerCount: 0,
    breakfastIncludedInPrice: false, totalMealCost: 2000,
    totalLivingCost: 9000,
  };
  // цена приёма 2000/4 = 500; ужинов стало 2 → 6 приёмов × 500
  const patch = applyMealCountChange(row, "dinnerCount", "2");
  assert.equal(patch.dinnerCount, 2);
  assert.equal(patch.totalMealCost, 3000);
  assert.equal(patch.totalDebt, 12000);
  // приёмов не было — стоимость не трогаем (калибровать нечем)
  const empty = applyMealCountChange(
    { breakfastCount: 0, lunchCount: 0, dinnerCount: 0, totalMealCost: 0 },
    "lunchCount", "3");
  assert.equal(empty.lunchCount, 3);
  assert.equal("totalMealCost" in empty, false);
});

test("groupRowsByRoom: рядом ставятся только комната + пересечение дат", () => {
  const rows = [
    { _uid: 0, hotelName: "А", roomName: "1", personName: "Иванов",
      arrival: "01.08.2026 14:00:00", departure: "05.08.2026 12:00:00" },
    { _uid: 1, hotelName: "А", roomName: "2", personName: "Петров",
      arrival: "01.08.2026 14:00:00", departure: "05.08.2026 12:00:00" },
    { _uid: 2, hotelName: "А", roomName: "1", personName: "Сидоров",
      arrival: "03.08.2026 14:00:00", departure: "07.08.2026 12:00:00" }, // пересёкся с Ивановым
    { _uid: 3, hotelName: "А", roomName: "1", personName: "Козлов",
      arrival: "10.08.2026 14:00:00", departure: "12.08.2026 12:00:00" }, // та же комната, ПОЗЖЕ — не вместе
    { _uid: 4, hotelName: "Б", roomName: "1", personName: "Чужой",
      arrival: "01.08.2026 14:00:00", departure: "05.08.2026 12:00:00" }, // другая гостиница
  ];
  assert.deepEqual(groupRowsByRoom(rows).map((r) => r._uid), [0, 2, 1, 3, 4]);
});

test("groupRowsByRoom: транзитивное пересечение собирает цепочку (зеркало findOverlapClusters)", () => {
  // А и В не пересекаются напрямую, но оба пересекаются с Б — один кластер.
  const rows = [
    { _uid: 0, hotelName: "А", roomName: "1", personName: "А",
      arrival: "01.08.2026 14:00:00", departure: "03.08.2026 12:00:00" },
    { _uid: 1, hotelName: "А", roomName: "2", personName: "Прокладка",
      arrival: "01.08.2026 14:00:00", departure: "10.08.2026 12:00:00" },
    { _uid: 2, hotelName: "А", roomName: "1", personName: "Б",
      arrival: "02.08.2026 14:00:00", departure: "06.08.2026 12:00:00" },
    { _uid: 3, hotelName: "А", roomName: "1", personName: "В",
      arrival: "05.08.2026 14:00:00", departure: "08.08.2026 12:00:00" },
  ];
  assert.deepEqual(groupRowsByRoom(rows).map((r) => r._uid), [0, 2, 3, 1]);
});

test("buildRoomMates: сосед = комната + пересечение дат; стык впритык — не сосед", () => {
  const rows = [
    { _uid: 0, hotelName: "А", roomName: "1", personName: "Иванов",
      arrival: "01.08.2026 14:00:00", departure: "05.08.2026 12:00:00" },
    { _uid: 1, hotelName: "А", roomName: "1", personName: "Петров",
      arrival: "03.08.2026 14:00:00", departure: "07.08.2026 12:00:00" },
    // заехал ровно в момент выезда Петрова — интервалы НЕ пересекаются
    { _uid: 2, hotelName: "А", roomName: "1", personName: "Козлов",
      arrival: "07.08.2026 12:00:00", departure: "09.08.2026 12:00:00" },
    // дата не разобрана — ни с кем не кластеризуется
    { _uid: 3, hotelName: "А", roomName: "1", personName: "Безданных",
      arrival: "", departure: "" },
  ];
  const mates = buildRoomMates(rows);
  assert.deepEqual(mates.get(0), ["Петров"]);
  assert.deepEqual(mates.get(1), ["Иванов"]);
  assert.equal(mates.has(2), false);
  assert.equal(mates.has(3), false);
});

// --- 02.10.2026: правка итога, ручной «Вид проживания», гостиницы ---

const moneyRow = { totalMealCost: 1180, totalLivingCost: 3900, totalDebt: 5080, pricePerDay: 2600, totalDays: 1.5 };

test("applyTotalChange: разница уходит в проживание, цена не трогается", () => {
  assert.deepEqual(applyTotalChange(moneyRow, "6000"), { totalDebt: 6000, totalLivingCost: 4820 });
  assert.deepEqual(applyTotalChange(moneyRow, 1180), { totalDebt: 1180, totalLivingCost: 0 });
});

test("applyTotalChange: во время набора проживание может уйти в минус", () => {
  assert.deepEqual(applyTotalChange(moneyRow, "5"), { totalDebt: 5, totalLivingCost: -1175 });
});

test("applyTotalChange: пустое поле — итог null, проживание не трогается", () => {
  assert.deepEqual(applyTotalChange(moneyRow, ""), { totalDebt: null });
  assert.deepEqual(applyTotalChange(moneyRow, "abc"), {});
});

test("clampTotalPatch: итог ниже питания — проживание 0, итог = питание", () => {
  assert.deepEqual(clampTotalPatch({ ...moneyRow, totalDebt: 5, totalLivingCost: -1175 }), {
    totalLivingCost: 0,
    totalDebt: 1180,
  });
  assert.deepEqual(clampTotalPatch({ ...moneyRow, totalDebt: null, totalLivingCost: -1175 }), {
    totalLivingCost: 0,
    totalDebt: 1180,
  });
});

test("clampTotalPatch: корректный итог не трогается", () => {
  assert.equal(clampTotalPatch({ ...moneyRow, totalDebt: 6000, totalLivingCost: 4820 }), null);
  assert.equal(clampTotalPatch({ ...moneyRow, totalDebt: 1180, totalLivingCost: 0 }), null);
});

test("правка дат после ручного проживания пересчитывает его как сутки × цена", () => {
  const manual = { ...moneyRow, arrival: "01.08.2026 14:00:00", departure: "02.08.2026 12:00:00", totalLivingCost: 9999 };
  const patch = applyDateChange(manual, "departure", "03.08.2026 12:00:00", null);
  assert.equal(patch.totalLivingCost, Math.round(patch.totalDays * 2600));
  assert.equal("pricePerDay" in patch, false);
});

test("normalizeShareNoteOverride и hasManualShareNote", () => {
  assert.equal(normalizeShareNoteOverride("  с Ивановым "), "с Ивановым");
  assert.equal(normalizeShareNoteOverride(""), null);
  assert.equal(normalizeShareNoteOverride("   "), null);
  assert.equal(normalizeShareNoteOverride(null), null);
  assert.equal(hasManualShareNote({ shareNoteOverride: "с Ивановым" }), true);
  assert.equal(hasManualShareNote({ shareNoteOverride: "" }), false);
  assert.equal(hasManualShareNote({ shareNoteOverride: null }), false);
  assert.equal(hasManualShareNote({}), false);
});

const hotels = [
  { id: "h2", name: "Кавказ", airport: { code: "MRV", city: "Минеральные Воды" } },
  { id: "h1", name: "Азимут", airport: { code: "MRV", city: "Минеральные Воды" } },
  { id: "h3", name: "Азия", airport: { code: "ABA", city: "Абакан" } },
  { id: "h4", name: "Азимут", airport: { code: "ABA", city: "Абакан" } },
  { id: "h5", name: "Без аэропорта", airport: null },
  { id: null, name: "битая" },
];

test("buildHotelOptions: группы по аэропорту, внутри по алфавиту, «Без аэропорта» в конце", () => {
  const { options } = buildHotelOptions(hotels);
  assert.deepEqual(options, [
    { groupLabel: "ABA · Абакан" },
    { value: "h4", label: "Азимут" },
    { value: "h3", label: "Азия" },
    { groupLabel: "MRV · Минеральные Воды" },
    { value: "h1", label: "Азимут" },
    { value: "h2", label: "Кавказ" },
    { groupLabel: "Без аэропорта" },
    { value: "h5", label: "Без аэропорта" },
  ]);
});

test("withCurrentHotel: известное название → id, неизвестное — первой опцией, пустое — без значения", () => {
  const built = buildHotelOptions(hotels);
  assert.deepEqual(withCurrentHotel(built, "Кавказ"), { options: built.options, value: "h2" });
  assert.deepEqual(withCurrentHotel(built, ""), { options: built.options, value: "" });
  const custom = withCurrentHotel(built, "Гостиница ДИС");
  assert.equal(custom.value, CURRENT_HOTEL_VALUE);
  assert.deepEqual(custom.options[0], { value: CURRENT_HOTEL_VALUE, label: "Гостиница ДИС" });
  assert.equal(custom.options.length, built.options.length + 1);
});

test("hotelNameForValue: выбранный id → название", () => {
  const { options } = buildHotelOptions(hotels);
  assert.equal(hotelNameForValue(options, "h3"), "Азия");
  assert.equal(hotelNameForValue(options, "nope"), null);
});
