import test from "node:test";
import assert from "node:assert/strict";
import {
  TRANSFER_SERVICE_KEYS,
  isServiceHiddenForUser,
  visibleServiceKeys,
} from "./fapServiceVisibility.js";

const ALL = ["water", "meal", "living", "transfer", "transferDeparture", "baggage"];
const WITHOUT_TRANSFER = ["water", "meal", "living", "baggage"];

const SUPER = { role: "SUPERADMIN" };
const DISPATCHER = { role: "DISPATCHERADMIN" };
const AIRLINE = { role: "AIRLINEADMIN" };
const HOTEL = { role: "HOTELADMIN", hotelId: "h1" };
const HOTEL_MODERATOR = { role: "HOTELMODERATOR", hotelId: "h1" };
const EXT_HOTEL = { subjectType: "EXTERNAL_USER", scope: "HOTEL", hotelId: "h1" };
const EXT_DRIVER = { subjectType: "EXTERNAL_USER", scope: "DRIVER" };

test("гостиница без трансфера теряет обе услуги трансфера", () => {
  assert.deepEqual(visibleServiceKeys(ALL, HOTEL, false), WITHOUT_TRANSFER);
  assert.deepEqual(visibleServiceKeys(ALL, HOTEL_MODERATOR, false), WITHOUT_TRANSFER);
});

test("гостиница с трансфером видит всё", () => {
  assert.deepEqual(visibleServiceKeys(ALL, HOTEL, true), ALL);
});

test("вход по магик-ссылке гостиницы — то же правило", () => {
  assert.deepEqual(visibleServiceKeys(ALL, EXT_HOTEL, false), WITHOUT_TRANSFER);
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
test("предикат закрывает ровно ключи трансфера", () => {
  for (const key of TRANSFER_SERVICE_KEYS) {
    assert.equal(isServiceHiddenForUser(key, HOTEL, false), true, key);
  }
  for (const key of WITHOUT_TRANSFER) {
    assert.equal(isServiceHiddenForUser(key, HOTEL, false), false, key);
  }
});

test("гостинице с трансфером роут открыт", () => {
  assert.equal(isServiceHiddenForUser("transfer", HOTEL, true), false);
  assert.equal(isServiceHiddenForUser("transferDeparture", HOTEL, true), false);
});

test("неизвестный ключ услуги не закрываем", () => {
  assert.equal(isServiceHiddenForUser(undefined, HOTEL, false), false);
  assert.equal(isServiceHiddenForUser("unknown", HOTEL, false), false);
});

test("порядок и состав остальных ключей не меняются", () => {
  const partial = ["baggage", "transfer", "water"];
  assert.deepEqual(visibleServiceKeys(partial, HOTEL, false), ["baggage", "water"]);
  assert.deepEqual(visibleServiceKeys([], HOTEL, false), []);
  assert.deepEqual(visibleServiceKeys(undefined, HOTEL, false), []);
});
