import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalSurname, familyLabel } from "./surnameForms.js";

test("canonicalSurname collapses male/female pairs", () => {
  const pairs = [
    ["alekseev", "alekseeva"],
    ["belousov", "belousova"],
    ["gataullin", "gataullina"],
    ["vishnevsky", "vishnevskaya"],
    ["tolstoy", "tolstaya"],
    ["иванов", "иванова"],
    ["вишневский", "вишневская"],
    ["толстой", "толстая"],
  ];
  for (const [m, f] of pairs) {
    assert.equal(canonicalSurname(m), canonicalSurname(f), `${m} ~ ${f}`);
  }
});

test("canonicalSurname keeps distinct surnames distinct", () => {
  assert.notEqual(canonicalSurname("ivanov"), canonicalSurname("petrov"));
  assert.notEqual(canonicalSurname("smith"), canonicalSurname("jones"));
});

test("canonicalSurname is case-insensitive and trims", () => {
  assert.equal(canonicalSurname("  ALEKSEEVA "), canonicalSurname("alekseev"));
});

test("familyLabel russifies confident endings", () => {
  assert.equal(familyLabel("ALEKSEEV"), "Алексеевы");
  assert.equal(familyLabel("ALEKSEEVA"), "Алексеевы");
  assert.equal(familyLabel("ANTONOV"), "Антоновы");
  assert.equal(familyLabel("BELOUSOVA"), "Белоусовы");
  assert.equal(familyLabel("GATAULLIN"), "Гатауллины");
  assert.equal(familyLabel("VISHNEVSKY"), "Вишневские");
  assert.equal(familyLabel("VISHNEVSKAYA"), "Вишневские");
  assert.equal(familyLabel("TOLSTOY"), "Толстые");
  assert.equal(familyLabel("TOLSTAYA"), "Толстые");
  assert.equal(familyLabel("Иванова"), "Ивановы");
});

test("familyLabel falls back for foreign / unknown endings", () => {
  assert.equal(familyLabel("SMITH"), "SMITH");
  assert.equal(familyLabel("KIM"), "KIM");
});
