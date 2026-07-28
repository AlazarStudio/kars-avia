import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultGroupLabel } from "./fapGroups.js";

test("defaultGroupLabel russifies a mixed-gender family", () => {
  const members = [
    { personId: "1", fullName: "ALEKSEEV IVAN" },
    { personId: "2", fullName: "ALEKSEEVA MARIA" },
  ];
  assert.equal(defaultGroupLabel(members, 3), "Алексеевы");
});

test("defaultGroupLabel counts male+female as one surname", () => {
  const members = [
    { personId: "1", fullName: "VISHNEVSKY OLEG" },
    { personId: "2", fullName: "VISHNEVSKAYA ANNA" },
  ];
  assert.equal(defaultGroupLabel(members, 1), "Вишневские");
});

test("defaultGroupLabel falls back to Группа N without majority", () => {
  const members = [
    { personId: "1", fullName: "SMITH JOHN" },
    { personId: "2", fullName: "JONES MARY" },
  ];
  assert.equal(defaultGroupLabel(members, 5), "Группа 5");
});
