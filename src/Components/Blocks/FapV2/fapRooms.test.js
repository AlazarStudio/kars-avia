import { test } from "node:test";
import assert from "node:assert/strict";
import {
  roomCapacity,
  roomCategoryLabel,
  buildRoomsIndex,
  matchHotelRoom,
  roomOccupancy,
  activeHotelRooms,
} from "./fapRooms.js";

test("roomCapacity from place-category", () => {
  assert.equal(roomCapacity({ category: "onePlace" }), 1);
  assert.equal(roomCapacity({ category: "twoPlace" }), 2);
  assert.equal(roomCapacity({ category: "tenPlace" }), 10);
});

test("roomCapacity falls back to places then beds", () => {
  assert.equal(roomCapacity({ category: "apartment", places: 3 }), 3);
  assert.equal(roomCapacity({ category: "studio", beds: 2 }), 2);
  assert.equal(roomCapacity({ category: "luxe" }), null);
  assert.equal(roomCapacity(null), null);
});

test("roomCategoryLabel maps known + passthrough", () => {
  assert.equal(roomCategoryLabel("twoPlace"), "2-местный");
  assert.equal(roomCategoryLabel("apartment"), "Апартаменты");
  assert.equal(roomCategoryLabel("weird"), "weird");
});

test("activeHotelRooms filters inactive and nameless", () => {
  const rooms = [
    { id: "a", name: "1", active: true },
    { id: "b", name: "2", active: false },
    { id: "c", name: "", active: true },
  ];
  assert.deepEqual(activeHotelRooms(rooms).map((r) => r.id), ["a"]);
});

test("buildRoomsIndex keys by trimmed name, active-only, first wins", () => {
  const rooms = [
    { id: "a", name: " 12 ", active: true, category: "onePlace" },
    { id: "b", name: "12", active: true, category: "twoPlace" },
    { id: "c", name: "9", active: false },
  ];
  const idx = buildRoomsIndex(rooms);
  assert.equal(idx.get("12").id, "a");
  assert.equal(idx.has("9"), false);
});

test("matchHotelRoom trims and misses to null", () => {
  const idx = buildRoomsIndex([{ id: "a", name: "12", active: true }]);
  assert.equal(matchHotelRoom(" 12 ", idx).id, "a");
  assert.equal(matchHotelRoom("999", idx), null);
  assert.equal(matchHotelRoom("12", null), null);
});

test("roomOccupancy counts by trimmed key, ignores empty", () => {
  const occ = roomOccupancy(["12", " 12 ", "13", "", null]);
  assert.equal(occ.get("12"), 2);
  assert.equal(occ.get("13"), 1);
  assert.equal(occ.has(""), false);
});
