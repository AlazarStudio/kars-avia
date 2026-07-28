import { test } from "node:test";
import assert from "node:assert/strict";
import { sameStem, suggestPassengerGroups } from "./fapGroupSuggestions.js";

test("sameStem matches transliterated male/female forms", () => {
  assert.ok(sameStem("alekseev", "alekseeva"));
  assert.ok(sameStem("vishnevsky", "vishnevskaya"));
  assert.ok(sameStem("иванов", "иванова"));
  assert.ok(!sameStem("ivanov", "petrov"));
});

test("suggestPassengerGroups merges ALEKSEEV + ALEKSEEVA on adjacent seats", () => {
  const people = [
    { personId: "1", fullName: "ALEKSEEV IVAN", seat: "12A" },
    { personId: "2", fullName: "ALEKSEEVA MARIA", seat: "12B" },
  ];
  const clusters = suggestPassengerGroups(people);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].members.length, 2);
  assert.equal(clusters[0].kind, "FAMILY");
});

test("sameStem does not match on empty canonical roots", () => {
  assert.ok(!sameStem("oy", "aya")); // both canonicalize to ""
  assert.ok(!sameStem("aya", "oy"));
  assert.ok(!sameStem("", ""));
});
