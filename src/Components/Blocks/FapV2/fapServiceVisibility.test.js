import test from "node:test";
import assert from "node:assert/strict";
import {
  HOTEL_RESTRICTED_SERVICE_KEYS,
  isServiceHiddenForUser,
  visibleServiceKeys,
} from "./fapServiceVisibility.js";

const ALL = ["water", "meal", "living", "transfer", "transferDeparture", "baggage"];
const WITHOUT_RESTRICTED = ["water", "meal", "living"];

const SUPER = { role: "SUPERADMIN" };
const DISPATCHER = { role: "DISPATCHERADMIN" };
const AIRLINE = { role: "AIRLINEADMIN" };
const HOTEL = { role: "HOTELADMIN", hotelId: "h1" };
const HOTEL_MODERATOR = { role: "HOTELMODERATOR", hotelId: "h1" };
const EXT_HOTEL = { subjectType: "EXTERNAL_USER", scope: "HOTEL", hotelId: "h1" };
const EXT_DRIVER = { subjectType: "EXTERNAL_USER", scope: "DRIVER" };

test("гостиница без трансфера теряет трансфер и багаж", () => {
  assert.deepEqual(visibleServiceKeys(ALL, HOTEL, false), WITHOUT_RESTRICTED);
  assert.deepEqual(visibleServiceKeys(ALL, HOTEL_MODERATOR, false), WITHOUT_RESTRICTED);
});

test("гостиница с трансфером видит всё", () => {
  assert.deepEqual(visibleServiceKeys(ALL, HOTEL, true), ALL);
});

test("вход по магик-ссылке гостиницы — то же правило", () => {
  assert.deepEqual(visibleServiceKeys(ALL, EXT_HOTEL, false), WITHOUT_RESTRICTED);
  assert.deepEqual(visibleServiceKeys(ALL, EXT_HOTEL, true), ALL);
});

// Обратные проверки: правило не должно задеть никого, кроме гостиницы.
test("диспетчер, супер и авиакомпания видят всё при любом значении флага", () => {
  for (const user of [SUPER, DISPATCHER, AIRLINE]) {
    for (const provides of [false, true]) {
      assert.deepEqual(
        visibleServiceKeys(ALL, user, provides),
        ALL,
        `${user.role} / provides=${provides}`
      );
    }
  }
});

test("водитель по ссылке под правило не попадает", () => {
  assert.deepEqual(visibleServiceKeys(ALL, EXT_DRIVER, false), ALL);
});

test("пользователь ещё не загружен — ничего не прячем", () => {
  // user приходит undefined на первом рендере; скрытие тут мигало бы плитками
  assert.deepEqual(visibleServiceKeys(ALL, undefined, false), ALL);
});

// ── Предикат для роут-гейта ──
test("предикат закрывает ровно ключи трансфера и багажа", () => {
  for (const key of HOTEL_RESTRICTED_SERVICE_KEYS) {
    assert.equal(isServiceHiddenForUser(key, HOTEL, false), true, key);
  }
  for (const key of WITHOUT_RESTRICTED) {
    assert.equal(isServiceHiddenForUser(key, HOTEL, false), false, key);
  }
});

test("гостинице с трансфером роут открыт", () => {
  assert.equal(isServiceHiddenForUser("transfer", HOTEL, true), false);
  assert.equal(isServiceHiddenForUser("transferDeparture", HOTEL, true), false);
  assert.equal(isServiceHiddenForUser("baggage", HOTEL, true), false);
});

test("неизвестный ключ услуги не закрываем", () => {
  assert.equal(isServiceHiddenForUser(undefined, HOTEL, false), false);
  assert.equal(isServiceHiddenForUser("unknown", HOTEL, false), false);
});

test("порядок и состав остальных ключей не меняются", () => {
  const partial = ["baggage", "transfer", "water"];
  assert.deepEqual(visibleServiceKeys(partial, HOTEL, false), ["water"]);
  assert.deepEqual(visibleServiceKeys([], HOTEL, false), []);
  assert.deepEqual(visibleServiceKeys(undefined, HOTEL, false), []);
});

// ── Багаж отдельно ──
test("багаж скрыт от гостиницы без трансфера", () => {
  assert.equal(isServiceHiddenForUser("baggage", HOTEL, false), true);
  assert.deepEqual(visibleServiceKeys(["baggage"], HOTEL, false), []);
});

test("багаж виден гостинице с трансфером", () => {
  assert.equal(isServiceHiddenForUser("baggage", HOTEL, true), false);
  assert.deepEqual(visibleServiceKeys(["baggage"], HOTEL, true), ["baggage"]);
});

test("багаж виден диспетчеру и авиакомпании независимо от providesTransfer", () => {
  for (const user of [DISPATCHER, AIRLINE]) {
    for (const provides of [false, true]) {
      assert.equal(isServiceHiddenForUser("baggage", user, provides), false, `${user.role} / provides=${provides}`);
    }
  }
});

test("visibleServiceKeys выкидывает baggage вместе с трансфером", () => {
  assert.deepEqual(
    visibleServiceKeys(["water", "meal", "living", "transfer", "transferDeparture", "baggage"], HOTEL, false),
    ["water", "meal", "living"]
  );
});
