import test from "node:test";
import assert from "node:assert/strict";
import {
  hotelReportSubmittedAt,
  isHotelReportSubmitted,
  hotelReportPricingApprovedAt,
  isHotelReportPricingApproved,
  airlineMoneyHidden,
  visibleHotelIndexes,
} from "./fapReportAccess.js";

const airline = { role: "AIRLINEADMIN" };
const airlineModerator = { role: "AIRLINEMODERATOR" };
const dispatcher = { role: "DISPATCHERADMIN" };

const request = {
  livingService: { hotels: [{ name: "A" }, { name: "B" }, { name: "C" }] },
  hotelReports: [
    { hotelIndex: 0, submittedAt: "2026-07-31T10:00:00.000Z" },
    { hotelIndex: 1, submittedAt: null },
  ],
};

test("отдаёт дату отправки по индексу гостиницы", () => {
  assert.equal(hotelReportSubmittedAt(request, 0), "2026-07-31T10:00:00.000Z");
  assert.equal(hotelReportSubmittedAt(request, 1), null);
  assert.equal(hotelReportSubmittedAt(request, 2), null);
});

test("строковый индекс из useParams работает так же", () => {
  assert.equal(isHotelReportSubmitted(request, "0"), true);
  assert.equal(isHotelReportSubmitted(request, "1"), false);
});

test("гостиница без записи отчёта считается неотправленной", () => {
  assert.equal(isHotelReportSubmitted(request, 2), false);
  assert.equal(isHotelReportSubmitted({ hotelReports: [] }, 0), false);
  assert.equal(isHotelReportSubmitted(undefined, 0), false);
});

test("авиакомпания видит только отправленные гостиницы", () => {
  assert.deepEqual(visibleHotelIndexes(request, airline), [0]);
  assert.deepEqual(visibleHotelIndexes(request, airlineModerator), [0]);
});

test("диспетчер видит все гостиницы", () => {
  assert.deepEqual(visibleHotelIndexes(request, dispatcher), [0, 1, 2]);
});

test("без гостиниц список пустой у всех", () => {
  assert.deepEqual(visibleHotelIndexes({}, airline), []);
  assert.deepEqual(visibleHotelIndexes({}, dispatcher), []);
});

// ── Гостиница видит только свою ──
// Заявка с тремя гостиницами, из которых пользователю принадлежит одна.
const requestWithIds = {
  livingService: {
    hotels: [{ hotelId: "h-1" }, { hotelId: "h-2" }, { hotelId: "h-3" }],
  },
  hotelReports: [{ hotelIndex: 1, submittedAt: null }],
};

const hotelAdmin = { role: "HOTELADMIN", hotelId: "h-2" };
const hotelModerator = { role: "HOTELMODERATOR", hotelId: "h-3" };
const extHotel = {
  subjectType: "EXTERNAL_USER",
  scope: "HOTEL",
  hotelId: "h-2",
};

test("внутренняя роль гостиницы видит только свою — и отправка отчёта тут ни при чём", () => {
  // У h-2 отчёт НЕ отправлен, и это ничего не меняет: правило отправки — про
  // авиакомпанию, а гостиница свой отчёт сама и заполняет.
  assert.deepEqual(visibleHotelIndexes(requestWithIds, hotelAdmin), [1]);
  assert.deepEqual(visibleHotelIndexes(requestWithIds, hotelModerator), [2]);
});

test("вход по магик-ссылке ограничен так же", () => {
  assert.deepEqual(visibleHotelIndexes(requestWithIds, extHotel), [1]);
});

test("гостиничный аккаунт без привязки не видит ничего", () => {
  // Именно ничего, а не всё: иначе аккаунт без hotelId получил бы доступ шире
  // привязанного. Строковое сравнение без этой проверки склеило бы его
  // `undefined` с гостиницей, у которой hotelId не проставлен.
  assert.deepEqual(visibleHotelIndexes(requestWithIds, { role: "HOTELADMIN" }), []);
  assert.deepEqual(
    visibleHotelIndexes(
      { livingService: { hotels: [{ name: "без id" }] } },
      { role: "HOTELADMIN" }
    ),
    []
  );
});

test("диспетчера и авиакомпанию новое правило не задело", () => {
  assert.deepEqual(visibleHotelIndexes(requestWithIds, dispatcher), [0, 1, 2]);
  assert.deepEqual(visibleHotelIndexes(requestWithIds, airline), []);
});

// ── Согласование ценообразования ──
// Обе гостиницы отправлены — то есть авиакомпании видны обе; различие только
// в согласовании цен.
const SENT = "2026-08-30T10:00:00.000Z";
const pricedRequest = {
  livingService: { hotels: [{ hotelId: "h-1" }, { hotelId: "h-2" }] },
  hotelReports: [
    { hotelIndex: 0, submittedAt: SENT, pricingApprovedAt: "2026-09-01T09:00:00.000Z" },
    { hotelIndex: 1, submittedAt: SENT, pricingApprovedAt: null },
  ],
};

test("отдаёт дату согласования цен по индексу гостиницы", () => {
  assert.equal(hotelReportPricingApprovedAt(pricedRequest, 0), "2026-09-01T09:00:00.000Z");
  assert.equal(hotelReportPricingApprovedAt(pricedRequest, 1), null);
  // Гостиницы без записи отчёта нет и в согласованных.
  assert.equal(hotelReportPricingApprovedAt(pricedRequest, 5), null);
  assert.equal(hotelReportPricingApprovedAt(undefined, 0), null);
});

test("строковый индекс согласования работает так же", () => {
  assert.equal(isHotelReportPricingApproved(pricedRequest, "0"), true);
  assert.equal(isHotelReportPricingApproved(pricedRequest, "1"), false);
  assert.equal(isHotelReportPricingApproved(pricedRequest, 5), false);
});

test("деньги скрыты, пока хоть один видимый отчёт не согласован", () => {
  assert.equal(airlineMoneyHidden(pricedRequest, airline), true);
  assert.equal(airlineMoneyHidden(pricedRequest, airlineModerator), true);
});

test("все видимые отчёты согласованы — деньги показываем", () => {
  const allApproved = {
    ...pricedRequest,
    hotelReports: pricedRequest.hotelReports.map((r) => ({
      ...r,
      pricingApprovedAt: "2026-09-01T09:00:00.000Z",
    })),
  };
  assert.equal(airlineMoneyHidden(allApproved, airline), false);
});

test("несогласованный, но невидимый авиакомпании отчёт денег не прячет", () => {
  // Вторая гостиница не отправлена — авиакомпании её нет вовсе, а первая
  // согласована. Гейт должен смотреть только на видимые отчёты.
  const onlyFirstSent = {
    ...pricedRequest,
    hotelReports: [
      { hotelIndex: 0, submittedAt: SENT, pricingApprovedAt: "2026-09-01T09:00:00.000Z" },
      { hotelIndex: 1, submittedAt: null, pricingApprovedAt: null },
    ],
  };
  assert.equal(airlineMoneyHidden(onlyFirstSent, airline), false);
});

test("авиакомпании нечего показывать — прятать тоже нечего", () => {
  assert.equal(airlineMoneyHidden({}, airline), false);
  assert.equal(
    airlineMoneyHidden(
      { ...pricedRequest, hotelReports: [{ hotelIndex: 0, submittedAt: null }] },
      airline
    ),
    false
  );
});

test("правило про деньги — только про авиакомпанию", () => {
  // У диспетчера и гостиницы свои гейты (hideMoney), согласование их не трогает.
  assert.equal(airlineMoneyHidden(pricedRequest, dispatcher), false);
  assert.equal(airlineMoneyHidden(pricedRequest, { role: "HOTELADMIN", hotelId: "h-2" }), false);
  assert.equal(airlineMoneyHidden(pricedRequest, extHotel), false);
});
