import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { detectProfile, extractPeople } from "../../../utils/manifestCore.js";
import { PROFILES } from "../../../utils/manifestProfiles.js";
import {
  buildManifestRows,
  buildManifestWorkbook,
  hasManifestRoster,
  manifestDownloadName,
} from "./fapManifestBuild.js";

// Реестр намеренно не по алфавиту и с экипажем — сборка обязана и отсортировать,
// и отсеять.
const fixture = {
  flightNumber: "FV6346",
  flightDate: "2026-08-15T09:30:00.000Z",
  requestNumber: "ЗК-77",
  savedPassengers: [
    {
      fullName: "Яковлев Пётр",
      phone: "+79990000001",
      seat: "12A",
      personType: "PASSENGER",
      personCategory: "ADULT",
    },
    {
      fullName: "Абрамова Мария",
      phone: "+79990000002",
      seat: "3C",
      personType: "PASSENGER",
      personCategory: "CHILD",
    },
    {
      fullName: "Борисов Илья",
      phone: null,
      seat: null,
      personType: "PASSENGER",
      personCategory: "INFANT",
    },
    {
      fullName: "Волков Сергей",
      phone: null,
      seat: "1A",
      personType: "CREW",
      personCategory: "ADULT",
    },
  ],
};

// Круг: книга → xlsx-буфер → обратно строками ровно так, как их читает
// parseManifestXlsx.js:32-36.
const roundTrip = (request) => {
  const buf = XLSX.write(buildManifestWorkbook(request), {
    type: "buffer",
    bookType: "xlsx",
  });
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });
};

// ── Круг: сгенерированный файл распознаётся нашим же импортом ──

test("круг: файл определяется как ПМ, люди и рейс возвращаются без потерь", () => {
  const rows = roundTrip(fixture);
  const detected = detectProfile(rows, PROFILES);

  assert.equal(detected.profile.id, "PM");
  assert.deepEqual(extractPeople(rows, detected.profile, detected.cols), [
    { fullName: "Абрамова Мария", seat: "3C", personCategory: "CHILD" },
    { fullName: "Борисов Илья", seat: null, personCategory: "INFANT" },
    { fullName: "Яковлев Пётр", seat: "12A", personCategory: "ADULT" },
  ]);
  assert.equal(detected.profile.flight(rows), "FV6346");
});

test("круг: рейс без буквенного кода не становится строкой-пассажиром", () => {
  const rows = roundTrip({ ...fixture, flightNumber: "6346" });
  const detected = detectProfile(rows, PROFILES);

  assert.equal(detected.profile.id, "PM");
  assert.deepEqual(
    extractPeople(rows, detected.profile, detected.cols).map((p) => p.fullName),
    ["Абрамова Мария", "Борисов Илья", "Яковлев Пётр"]
  );
  assert.equal(detected.profile.flight(rows), "6346");
});

// ── Строки листа ──

test("строки: шапка формы ПМ, отметки РБ/РМ, телефон и нумерация с 1", () => {
  const rows = buildManifestRows(fixture);

  assert.deepEqual(rows[4], ["РЕГ", "ФИО", "МЕСТО", "РБ", "РМ", "ТЕЛЕФОН"]);
  assert.deepEqual(rows[5], [1, "Абрамова Мария", "3C", "X", "", "+79990000002"]);
  assert.deepEqual(rows[6], [2, "Борисов Илья", "", "", "X", ""]);
  assert.deepEqual(rows[7], [3, "Яковлев Пётр", "12A", "", "", "+79990000001"]);
  assert.equal(rows[1][1], "FLIGHT");
  assert.equal(rows[2][1], "FV6346");
  assert.match(rows[2][2], /^\d{2}\.\d{2}\.\d{4}$/);
});

test("строки: пустой реестр — только служебные строки и шапка", () => {
  assert.equal(buildManifestRows({ savedPassengers: [] }).length, 5);
  assert.equal(buildManifestRows(null).length, 5);
  assert.doesNotThrow(() => buildManifestWorkbook(null));

  assert.equal(hasManifestRoster(fixture), true);
  assert.equal(hasManifestRoster({ savedPassengers: [{ personType: "CREW" }] }), false);
  assert.equal(hasManifestRoster(null), false);
});

// ── Имя файла ──

test("имя файла: рейс, иначе номер заявки; запрещённые символы заменены", () => {
  assert.equal(manifestDownloadName(fixture), "Манифест FV6346.xlsx");
  assert.equal(manifestDownloadName({ requestNumber: "ЗК-77" }), "Манифест ЗК-77.xlsx");
  assert.equal(manifestDownloadName({}), "Манифест.xlsx");
  assert.equal(manifestDownloadName({ flightNumber: "SU/1177*" }), "Манифест SU_1177_.xlsx");
});
