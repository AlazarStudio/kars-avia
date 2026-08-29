import { test } from "node:test";
import assert from "node:assert/strict";
import { bedsLabel, countOccupiedLanes, waitBadge } from "./placementBadges.js";

const DAY_MS = 86400000;
const NOW = new Date("2026-08-29T12:00:00Z").getTime();
const daysAgo = (days) => new Date(NOW - days * DAY_MS).toISOString();

const NEW_STYLE = { edge: "#6b7090", tint: "#eef1f7" };
const WARN_STYLE = { edge: "#b26a00", tint: "#fdf1dc" };
const ALERT_STYLE = { edge: "#C03B28", tint: "#faeae6" };

// --- countOccupiedLanes ---

test("пустая комната → 0 занятых дорожек", () => {
  assert.equal(countOccupiedLanes([]), 0);
  assert.equal(countOccupiedLanes(), 0);
});

test("считает уникальные дорожки", () => {
  assert.equal(
    countOccupiedLanes([{ position: 0 }, { position: 1 }, { position: 2 }]),
    3
  );
});

test("дубли позиций не двоят счётчик (соседние брони на одной койке)", () => {
  assert.equal(
    countOccupiedLanes([{ position: 1 }, { position: 1 }, { position: 0 }]),
    2
  );
});

test("позиция 0 считается занятой дорожкой", () => {
  assert.equal(countOccupiedLanes([{ position: 0 }]), 1);
});

test("брони без позиции не считаются", () => {
  assert.equal(
    countOccupiedLanes([
      { position: null },
      { position: undefined },
      {},
      { position: 0 },
    ]),
    1
  );
});

// --- waitBadge ---

test("без createdAt → «новая»", () => {
  assert.deepEqual(waitBadge(null, NOW), { label: "новая", ...NEW_STYLE });
  assert.deepEqual(waitBadge(undefined, NOW), { label: "новая", ...NEW_STYLE });
  assert.deepEqual(waitBadge("", NOW), { label: "новая", ...NEW_STYLE });
});

test("0 дней ожидания → «новая»", () => {
  assert.deepEqual(waitBadge(daysAgo(0), NOW), { label: "новая", ...NEW_STYLE });
  // несколько часов — те же неполные сутки
  assert.deepEqual(waitBadge(new Date(NOW - 5 * 3600000).toISOString(), NOW), {
    label: "новая",
    ...NEW_STYLE,
  });
});

test("createdAt в будущем → «новая», а не отрицательные сутки", () => {
  assert.deepEqual(waitBadge(daysAgo(-2), NOW), { label: "новая", ...NEW_STYLE });
});

test("1 день ожидания → предупреждение", () => {
  assert.deepEqual(waitBadge(daysAgo(1), NOW), {
    label: "ждёт 1 дн",
    ...WARN_STYLE,
  });
});

test("3 дня — ещё предупреждение (верхняя граница)", () => {
  assert.deepEqual(waitBadge(daysAgo(3), NOW), {
    label: "ждёт 3 дн",
    ...WARN_STYLE,
  });
});

test("4 дня — уже тревога (нижняя граница)", () => {
  assert.deepEqual(waitBadge(daysAgo(4), NOW), {
    label: "ждёт 4 дн",
    ...ALERT_STYLE,
  });
});

test("10 дней — тревога", () => {
  assert.deepEqual(waitBadge(daysAgo(10), NOW), {
    label: "ждёт 10 дн",
    ...ALERT_STYLE,
  });
});

test("сутки округляются вниз", () => {
  const almostTwo = new Date(NOW - (2 * DAY_MS - 3600000)).toISOString();
  assert.equal(waitBadge(almostTwo, NOW).label, "ждёт 1 дн");
});

// --- bedsLabel ---

test("нет кроватей → пустая строка", () => {
  assert.equal(bedsLabel(0), "");
  assert.equal(bedsLabel(null), "");
  assert.equal(bedsLabel(undefined), "");
});

test("русское склонение «кровать/кровати/кроватей»", () => {
  assert.equal(bedsLabel(1), "1 кровать");
  assert.equal(bedsLabel(2), "2 кровати");
  assert.equal(bedsLabel(4), "4 кровати");
  assert.equal(bedsLabel(5), "5 кроватей");
  assert.equal(bedsLabel(11), "11 кроватей");
  assert.equal(bedsLabel(12), "12 кроватей");
  assert.equal(bedsLabel(14), "14 кроватей");
  assert.equal(bedsLabel(21), "21 кровать");
  assert.equal(bedsLabel(22), "22 кровати");
  assert.equal(bedsLabel(25), "25 кроватей");
  assert.equal(bedsLabel(101), "101 кровать");
  assert.equal(bedsLabel(112), "112 кроватей");
});
