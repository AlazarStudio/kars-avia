import { test } from "node:test";
import assert from "node:assert/strict";
import { REGISTRY_PARAM, readRegistryLink, withRegistryLink } from "./fapRegistryLink.js";

test("readRegistryLink / withRegistryLink", () => {
  assert.equal(REGISTRY_PARAM, "registryid");
  assert.equal(readRegistryLink(new URLSearchParams("?registryid=abc&x=1")), "abc");
  assert.equal(readRegistryLink(new URLSearchParams("")), null);
  const next = withRegistryLink(new URLSearchParams("?x=1&registryid=old"), "new");
  assert.equal(next.get("registryid"), "new");
  assert.equal(next.get("x"), "1");
  assert.equal(withRegistryLink(next, null).get("registryid"), null);
});
