import test from "node:test";
import assert from "node:assert/strict";
import {
  hotelOverbookedBy,
  livingNameCollisions,
  livingMismatches,
} from "./fapLivingMismatch.js";

test("перебора нет, когда факт меньше вместимости", () => {
  assert.equal(hotelOverbookedBy({ peopleCount: 10, people: [{}, {}] }), 0);
});

test("перебора нет ровно на вместимости", () => {
  assert.equal(hotelOverbookedBy({ peopleCount: 2, people: [{}, {}] }), 0);
});

test("перебор считается как факт минус вместимость", () => {
  assert.equal(hotelOverbookedBy({ peopleCount: 2, people: [{}, {}, {}, {}] }), 2);
});

test("вместимость 0 и null = «не задана», а не «мест нет»", () => {
  assert.equal(hotelOverbookedBy({ peopleCount: 0, people: [{}, {}] }), 0);
  assert.equal(hotelOverbookedBy({ peopleCount: null, people: [{}, {}] }), 0);
  assert.equal(hotelOverbookedBy({ people: [{}, {}] }), 0);
});

test("пустая гостиница не ломает расчёт", () => {
  assert.equal(hotelOverbookedBy(null), 0);
  assert.equal(hotelOverbookedBy({ peopleCount: 5 }), 0);
});

test("совпадение ФИО ловится между разными гостиницами", () => {
  const collisions = livingNameCollisions({
    hotels: [
      { name: "Азия", people: [{ fullName: "ИВАНОВ ИВАН" }] },
      { name: "Престиж", people: [{ fullName: "ИВАНОВ ИВАН" }] },
    ],
  });
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0].places.length, 2);
  assert.deepEqual(
    collisions[0].places.map((p) => p.hotelIndex),
    [0, 1]
  );
});

test("совпадение ФИО ловится и внутри одной гостиницы", () => {
  const collisions = livingNameCollisions({
    hotels: [{ name: "Азия", people: [{ fullName: "ПЕТРОВ ПЁТР" }, { fullName: "ПЕТРОВ ПЁТР" }] }],
  });
  assert.equal(collisions.length, 1);
  assert.deepEqual(
    collisions[0].places.map((p) => p.personIndex),
    [0, 1]
  );
});

test("регистр и лишние пробелы не мешают совпадению", () => {
  const collisions = livingNameCollisions({
    hotels: [
      { name: "Азия", people: [{ fullName: "  Иванов   Иван " }] },
      { name: "Престиж", people: [{ fullName: "ИВАНОВ ИВАН" }] },
    ],
  });
  assert.equal(collisions.length, 1);
});

test("разные ФИО совпадением не считаются", () => {
  const collisions = livingNameCollisions({
    hotels: [
      { name: "Азия", people: [{ fullName: "ИВАНОВ ИВАН" }] },
      { name: "Престиж", people: [{ fullName: "ПЕТРОВ ПЁТР" }] },
    ],
  });
  assert.equal(collisions.length, 0);
});

test("пустое ФИО в расчёт не берётся", () => {
  const collisions = livingNameCollisions({
    hotels: [
      { name: "Азия", people: [{ fullName: "" }, { fullName: null }] },
      { name: "Престиж", people: [{}] },
    ],
  });
  assert.equal(collisions.length, 0);
});

test("пустая услуга не ломает расчёт", () => {
  assert.deepEqual(livingNameCollisions(null), []);
  assert.deepEqual(livingNameCollisions({}), []);
});

test("livingMismatches собирает оба вида расхождений", () => {
  const request = {
    livingService: {
      hotels: [
        { name: "Азия", peopleCount: 1, people: [{ fullName: "ИВАНОВ ИВАН" }, { fullName: "СИДОРОВ СИДОР" }] },
        { name: "Престиж", peopleCount: 5, people: [{ fullName: "ИВАНОВ ИВАН" }] },
      ],
    },
  };
  const result = livingMismatches(request);
  assert.equal(result.hasAny, true);
  assert.equal(result.overbooked.length, 1);
  assert.equal(result.overbooked[0].hotelIndex, 0);
  assert.equal(result.overbooked[0].by, 1);
  assert.equal(result.collisions.length, 1);
});

test("livingMismatches на заявке без расхождений даёт hasAny false", () => {
  const result = livingMismatches({
    livingService: { hotels: [{ name: "Азия", peopleCount: 5, people: [{ fullName: "ИВАНОВ ИВАН" }] }] },
  });
  assert.equal(result.hasAny, false);
  assert.deepEqual(result.overbooked, []);
  assert.deepEqual(result.collisions, []);
});

test("livingMismatches на пустой заявке не падает", () => {
  const result = livingMismatches(null);
  assert.equal(result.hasAny, false);
});

// ── место как второй различитель ───────────────────────────────────────────
// Место живёт только в реестре (savedPassengers.seat) и подтягивается по personId:
// у гостя гостиницы такого поля в схеме нет.

const roster = (...pairs) =>
  pairs.map(([personId, seat]) => ({ personId, seat }));

test("разные места у тёзок снимают совпадение", () => {
  const collisions = livingNameCollisions(
    {
      hotels: [
        { name: "Азия", people: [{ personId: "a", fullName: "ИВАНОВ ИВАН" }] },
        { name: "Престиж", people: [{ personId: "b", fullName: "ИВАНОВ ИВАН" }] },
      ],
    },
    roster(["a", "12A"], ["b", "31C"])
  );
  assert.deepEqual(collisions, []);
});

test("одинаковое место усиливает совпадение", () => {
  const collisions = livingNameCollisions(
    {
      hotels: [
        { name: "Азия", people: [{ personId: "a", fullName: "ИВАНОВ ИВАН" }] },
        { name: "Престиж", people: [{ personId: "b", fullName: "ИВАНОВ ИВАН" }] },
      ],
    },
    roster(["a", "12A"], ["b", " 12a "])
  );
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0].seatMatch, true, "регистр и пробелы в месте не мешают");
});

test("место известно не у всех — прежнее поведение", () => {
  // Одно пустое место не доказывает ни совпадения, ни различия, поэтому
  // предупреждение остаётся, но слабое. Это несущий случай: на дев-стенде ни в
  // одной из 38 коллизий место не заполнено у всех участников.
  const collisions = livingNameCollisions(
    {
      hotels: [
        { name: "Азия", people: [{ personId: "a", fullName: "ИВАНОВ ИВАН" }] },
        { name: "Престиж", people: [{ personId: "b", fullName: "ИВАНОВ ИВАН" }] },
      ],
    },
    roster(["a", "12A"], ["b", ""])
  );
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0].seatMatch, false);
});

test("без реестра правило работает как раньше", () => {
  const service = {
    hotels: [
      { name: "Азия", people: [{ personId: "a", fullName: "ИВАНОВ ИВАН" }] },
      { name: "Престиж", people: [{ personId: "b", fullName: "ИВАНОВ ИВАН" }] },
    ],
  };
  assert.equal(livingNameCollisions(service).length, 1);
  assert.equal(livingNameCollisions(service, []).length, 1);
});

test("livingMismatches берёт места из реестра заявки", () => {
  const result = livingMismatches({
    savedPassengers: roster(["a", "5B"], ["b", "5B"]),
    livingService: {
      hotels: [
        { name: "Азия", peopleCount: 5, people: [{ personId: "a", fullName: "ИВАНОВ ИВАН" }] },
        { name: "Престиж", peopleCount: 5, people: [{ personId: "b", fullName: "ИВАНОВ ИВАН" }] },
      ],
    },
  });
  assert.equal(result.collisions.length, 1);
  assert.equal(result.collisions[0].seatMatch, true);
});
