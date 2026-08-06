import test from "node:test";
import assert from "node:assert/strict";
import { composeHotelAddress } from "./hotelAddress.js";

test("город приписывается к улице спереди", () => {
  assert.equal(
    composeHotelAddress({ city: "Абакан", address: "ул. Кирова, 114, стр. 1" }),
    "Абакан, ул. Кирова, 114, стр. 1"
  );
});

test("город уже в адресе — второй раз не приписывается", () => {
  // В справочнике встречаются обе формы записи.
  assert.equal(
    composeHotelAddress({ city: "Абакан", address: "г. Абакан, ул. Ленина, 1" }),
    "г. Абакан, ул. Ленина, 1"
  );
  assert.equal(
    composeHotelAddress({ city: "Абакан", address: "Абакан, ул. Ленина, 1" }),
    "Абакан, ул. Ленина, 1"
  );
});

test("регистр не мешает распознать уже указанный город", () => {
  assert.equal(
    composeHotelAddress({ city: "Абакан", address: "АБАКАН, ул. Ленина, 1" }),
    "АБАКАН, ул. Ленина, 1"
  );
});

test("пустые поля не дают мусорных запятых", () => {
  assert.equal(composeHotelAddress({ city: "", address: "ул. Ленина, 1" }), "ул. Ленина, 1");
  assert.equal(composeHotelAddress({ city: "Абакан", address: "" }), "Абакан");
  assert.equal(composeHotelAddress({ city: "  ", address: "  " }), "");
  assert.equal(composeHotelAddress(null), "");
  assert.equal(composeHotelAddress(undefined), "");
});

test("лишние пробелы обрезаются", () => {
  assert.equal(
    composeHotelAddress({ city: "  Абакан ", address: "  ул. Кирова, 114 " }),
    "Абакан, ул. Кирова, 114"
  );
});
