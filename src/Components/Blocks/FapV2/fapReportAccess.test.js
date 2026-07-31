import test from "node:test";
import assert from "node:assert/strict";
import {
  hotelReportSubmittedAt,
  isHotelReportSubmitted,
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
