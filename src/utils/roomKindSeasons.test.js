import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toDateInputValue,
  formatSeasonRange,
  seasonsOverlap,
  findOverlappingSeason,
  validateSeasonForm,
  prepareSeasonDrafts,
  findNewRoomKindId,
  formatSeasonPrice,
} from "./roomKindSeasons.js";

test("toDateInputValue: ISO с временем → YYYY-MM-DD", () => {
  assert.equal(toDateInputValue("2026-09-01T00:00:00.000Z"), "2026-09-01");
});

test("toDateInputValue: уже готовое значение не портится", () => {
  assert.equal(toDateInputValue("2026-09-01"), "2026-09-01");
});

test("toDateInputValue: пусто и мусор → пустая строка", () => {
  assert.equal(toDateInputValue(null), "");
  assert.equal(toDateInputValue(undefined), "");
  assert.equal(toDateInputValue("не дата"), "");
});

test("toDateInputValue: формат DD.MM.YYYY", () => {
  assert.equal(toDateInputValue("01.09.2026"), "2026-09-01");
  assert.equal(toDateInputValue("25.12.2026"), "2026-12-25");
});

test("toDateInputValue: несуществующие даты не проходят round-trip", () => {
  assert.equal(toDateInputValue("2026-13-45"), "");
  assert.equal(toDateInputValue("2026-02-30"), "");
});

test("toDateInputValue: объект Date (ветка instanceof)", () => {
  assert.equal(toDateInputValue(new Date(2026, 8, 1)), "2026-09-01");
});

test("formatSeasonRange: показ по-русски", () => {
  assert.equal(
    formatSeasonRange("2026-09-01T00:00:00.000Z", "2026-12-31T00:00:00.000Z"),
    "01.09.2026 — 31.12.2026"
  );
});

test("formatSeasonRange: неполные данные → прочерк", () => {
  assert.equal(formatSeasonRange(null, "2026-12-31"), "—");
});

test("seasonsOverlap: границы включительные — стык в один день пересекается", () => {
  assert.equal(
    seasonsOverlap("2026-09-01", "2026-09-30", "2026-09-30", "2026-10-05"),
    true
  );
});

test("seasonsOverlap: соседние периоды без общего дня не пересекаются", () => {
  assert.equal(
    seasonsOverlap("2026-09-01", "2026-09-30", "2026-10-01", "2026-10-05"),
    false
  );
});

test("seasonsOverlap: вложенный период пересекается", () => {
  assert.equal(
    seasonsOverlap("2026-09-01", "2026-12-31", "2026-10-01", "2026-10-05"),
    true
  );
});

const SEASONS = [
  { id: "s1", startDate: "2026-09-01", endDate: "2026-09-30" },
  { id: "s2", startDate: "2026-12-01", endDate: "2026-12-31" },
];

test("findOverlappingSeason: находит пересечение", () => {
  const hit = findOverlappingSeason(SEASONS, "2026-09-15", "2026-10-10");
  assert.equal(hit?.id, "s1");
});

test("findOverlappingSeason: свободный промежуток → null", () => {
  assert.equal(findOverlappingSeason(SEASONS, "2026-10-01", "2026-11-30"), null);
});

test("findOverlappingSeason: правка самого себя не считается пересечением", () => {
  assert.equal(
    findOverlappingSeason(SEASONS, "2026-09-10", "2026-09-20", "s1"),
    null
  );
});

test("findOverlappingSeason: seasons: null → null", () => {
  assert.equal(findOverlappingSeason(null, "2026-09-10", "2026-09-20"), null);
});

test("findOverlappingSeason: числовой excludeId=0 исключает свой сезон", () => {
  const numericSeasons = [
    { id: 0, startDate: "2026-09-01", endDate: "2026-09-30" },
  ];
  assert.equal(
    findOverlappingSeason(numericSeasons, "2026-09-10", "2026-09-20", 0),
    null
  );
});

test("validateSeasonForm: корректная форма", () => {
  const res = validateSeasonForm(
    { startDate: "2026-10-01", endDate: "2026-11-30", price: "5000" },
    SEASONS
  );
  assert.equal(res.ok, true);
  assert.deepEqual(res.errors, {});
});

test("validateSeasonForm: пустые даты", () => {
  const res = validateSeasonForm({ startDate: "", endDate: "", price: "1" }, []);
  assert.equal(res.ok, false);
  assert.equal(res.errors.startDate, "Укажите дату начала");
  assert.equal(res.errors.endDate, "Укажите дату окончания");
});

test("validateSeasonForm: начало позже окончания", () => {
  const res = validateSeasonForm(
    { startDate: "2026-11-30", endDate: "2026-10-01", price: "1" },
    []
  );
  assert.equal(res.ok, false);
  assert.equal(res.errors.endDate, "Дата окончания раньше даты начала");
});

test("validateSeasonForm: ноль как цена не проходит", () => {
  const res = validateSeasonForm(
    { startDate: "2026-10-01", endDate: "2026-11-30", price: "0" },
    []
  );
  assert.equal(res.ok, false);
  assert.equal(res.errors.price, "Цена должна быть больше нуля");
});

test("validateSeasonForm: пустая цена не проходит", () => {
  const res = validateSeasonForm(
    { startDate: "2026-10-01", endDate: "2026-11-30", price: "" },
    []
  );
  assert.equal(res.ok, false);
  assert.equal(res.errors.price, "Укажите цену");
});

test("validateSeasonForm: пересечение периодов", () => {
  const res = validateSeasonForm(
    { startDate: "2026-09-15", endDate: "2026-10-10", price: "1" },
    SEASONS
  );
  assert.equal(res.ok, false);
  assert.equal(
    res.errors.startDate,
    "Период пересекается с сезоном 01.09.2026 — 30.09.2026"
  );
});

test("validateSeasonForm: цена для АК пустая — это допустимо", () => {
  const res = validateSeasonForm(
    {
      startDate: "2026-10-01",
      endDate: "2026-11-30",
      price: "5000",
      priceForAirline: "",
    },
    []
  );
  assert.equal(res.ok, true);
});

test("validateSeasonForm: цена для АК ноль не проходит", () => {
  const res = validateSeasonForm(
    {
      startDate: "2026-10-01",
      endDate: "2026-11-30",
      price: "5000",
      priceForAirline: "0",
    },
    []
  );
  assert.equal(res.ok, false);
  assert.equal(res.errors.priceForAirline, "Цена должна быть больше нуля");
});

test("validateSeasonForm: цена с десятичной запятой проходит", () => {
  const res = validateSeasonForm(
    { startDate: "2026-10-01", endDate: "2026-11-30", price: "5000,5" },
    []
  );
  assert.equal(res.ok, true);
});

test("validateSeasonForm: цена с пробелом-разделителем разрядов проходит", () => {
  const res = validateSeasonForm(
    { startDate: "2026-10-01", endDate: "2026-11-30", price: "5 000" },
    []
  );
  assert.equal(res.ok, true);
});

test("validateSeasonForm: нечисловая цена → «Введите число»", () => {
  const res = validateSeasonForm(
    { startDate: "2026-10-01", endDate: "2026-11-30", price: "абв" },
    []
  );
  assert.equal(res.ok, false);
  assert.equal(res.errors.price, "Введите число");
});

// ── values: нормализованные цены для отправки на бэк ─────────────────────────
// Раньше компонент собирал input через голый Number(form.price) — второй
// парсер мимо parsePrice, из-за чего «12 500,50» проходило валидацию и
// уезжало на сервер как NaN. Числа для мутации отдаёт validateSeasonForm.

test("validateSeasonForm: values отдаёт цену числом", () => {
  const res = validateSeasonForm(
    { startDate: "2026-09-01", endDate: "2026-12-31", price: "5000" },
    []
  );
  assert.equal(res.ok, true);
  assert.equal(res.values.price, 5000);
});

test("validateSeasonForm: values нормализует запятую и разделители разрядов", () => {
  const res = validateSeasonForm(
    {
      startDate: "2026-09-01",
      endDate: "2026-12-31",
      price: "12 500,50",
      priceForAirline: "13\u00A0000,75",
    },
    []
  );
  assert.equal(res.ok, true);
  assert.equal(res.values.price, 12500.5);
  assert.equal(res.values.priceForAirline, 13000.75);
});

test("validateSeasonForm: пустая цена для АК → values.priceForAirline === null", () => {
  const res = validateSeasonForm(
    {
      startDate: "2026-09-01",
      endDate: "2026-12-31",
      price: "5000",
      priceForAirline: "",
    },
    []
  );
  assert.equal(res.ok, true);
  assert.equal(res.values.priceForAirline, null);
});

test("validateSeasonForm: отсутствующее поле цены для АК → null, а не undefined", () => {
  // null отличим от «ключ не передан»: компонент под ролью гостиницы вообще
  // не кладёт priceForAirline в input, и спутать эти два случая нельзя.
  const res = validateSeasonForm(
    { startDate: "2026-09-01", endDate: "2026-12-31", price: "5000" },
    []
  );
  assert.equal(res.values.priceForAirline, null);
});

test("validateSeasonForm: values присутствует и у забракованной формы", () => {
  const res = validateSeasonForm({ startDate: "", endDate: "", price: "" }, []);
  assert.equal(res.ok, false);
  assert.ok(res.values, "values должен быть всегда, чтобы вызов не падал");
});

// --- prepareSeasonDrafts ---

test("prepareSeasonDrafts: пустой список и полностью пустые строки — ok, всё drop", () => {
  assert.deepEqual(prepareSeasonDrafts([]), { ok: true, rows: [] });
  const blank = { key: "a", name: "", startDate: "", endDate: "", price: "", priceForAirline: "" };
  const res = prepareSeasonDrafts([blank]);
  assert.equal(res.ok, true);
  assert.equal(res.rows[0].drop, true);
  assert.deepEqual(res.rows[0].errors, {});
});

test("prepareSeasonDrafts: строка из одних пробелов тоже пустая", () => {
  const res = prepareSeasonDrafts([
    { key: "a", name: "  ", startDate: "", endDate: "", price: " ", priceForAirline: "" },
  ]);
  assert.equal(res.ok, true);
  assert.equal(res.rows[0].drop, true);
});

test("prepareSeasonDrafts: полузаполненная строка — ошибки, ok=false", () => {
  const res = prepareSeasonDrafts([
    { key: "a", name: "Высокий", startDate: "2027-06-01", endDate: "", price: "", priceForAirline: "" },
  ]);
  assert.equal(res.ok, false);
  assert.equal(res.rows[0].drop, false);
  assert.ok(res.rows[0].errors.endDate);
  assert.ok(res.rows[0].errors.price);
});

test("prepareSeasonDrafts: валидная строка — нормализованные числа в values", () => {
  const res = prepareSeasonDrafts([
    { key: "a", name: "", startDate: "2027-06-01", endDate: "2027-09-30", price: "5 200,50", priceForAirline: "" },
  ]);
  assert.equal(res.ok, true);
  assert.equal(res.rows[0].drop, false);
  assert.equal(res.rows[0].values.price, 5200.5);
  assert.equal(res.rows[0].values.priceForAirline, null);
});

test("prepareSeasonDrafts: пересечение между черновиками ловится", () => {
  const res = prepareSeasonDrafts([
    { key: "a", startDate: "2027-06-01", endDate: "2027-09-30", price: "5200" },
    { key: "b", startDate: "2027-09-30", endDate: "2027-10-10", price: "4800" },
  ]);
  assert.equal(res.ok, false);
  assert.deepEqual(res.rows[0].errors, {});
  assert.ok(res.rows[1].errors.startDate);
});

test("prepareSeasonDrafts: drop-строка не участвует в проверке пересечений", () => {
  const res = prepareSeasonDrafts([
    { key: "a", name: "", startDate: "", endDate: "", price: "", priceForAirline: "" },
    { key: "b", startDate: "2027-06-01", endDate: "2027-09-30", price: "5200" },
  ]);
  assert.equal(res.ok, true);
  assert.equal(res.rows[1].drop, false);
  assert.deepEqual(res.rows[1].errors, {});
});

// --- findNewRoomKindId ---

test("findNewRoomKindId: единственный новый id находится", () => {
  const id = findNewRoomKindId(["1", "2"], [{ id: "1" }, { id: "2" }, { id: "3" }], {});
  assert.equal(id, "3");
});

test("findNewRoomKindId: новых нет — null", () => {
  assert.equal(findNewRoomKindId(["1"], [{ id: "1" }], {}), null);
  assert.equal(findNewRoomKindId([], [], {}), null);
});

test("findNewRoomKindId: несколько новых — выбирает по name+category", () => {
  const after = [
    { id: "1", name: "Стандарт", category: "twoPlace" },
    { id: "2", name: "Люкс", category: "luxe" },
    { id: "3", name: "Стандарт ", category: "onePlace" },
  ];
  const id = findNewRoomKindId(["1"], after, { name: "Стандарт", category: "onePlace" });
  assert.equal(id, "3");
});

test("findNewRoomKindId: несколько новых без однозначного матча — null", () => {
  const after = [
    { id: "2", name: "Стандарт", category: "onePlace" },
    { id: "3", name: "Стандарт", category: "onePlace" },
  ];
  assert.equal(findNewRoomKindId([], after, { name: "Стандарт", category: "onePlace" }), null);
});

test("findNewRoomKindId: сравнение id нечувствительно к типу (число/строка)", () => {
  assert.equal(findNewRoomKindId([1], [{ id: "1" }, { id: "2" }], {}), "2");
});

// --- formatSeasonPrice ---

test("formatSeasonPrice: разряды через пробел, null/мусор — пусто", () => {
  assert.equal(formatSeasonPrice(5200), "5 200");
  assert.equal(formatSeasonPrice(980), "980");
  assert.equal(formatSeasonPrice(null), "");
  assert.equal(formatSeasonPrice(undefined), "");
  assert.equal(formatSeasonPrice("abc"), "");
});
