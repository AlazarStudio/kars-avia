import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLoginPath, resolveLoginTarget } from "./loginRedirect.js";

test("buildLoginPath: корень и пустой location — голый /login", () => {
  assert.equal(buildLoginPath({ pathname: "/" }), "/login");
  assert.equal(buildLoginPath({}), "/login");
  assert.equal(buildLoginPath(undefined), "/login");
});

test("buildLoginPath: сама страница входа в next не попадает", () => {
  assert.equal(buildLoginPath({ pathname: "/login" }), "/login");
  // React Router матчит пути без учёта регистра, хвостовой слэш тоже не спасает.
  assert.equal(buildLoginPath({ pathname: "/LOGIN/" }), "/login");
});

test("buildLoginPath: целевой адрес с query уходит в next целиком", () => {
  assert.equal(
    buildLoginPath({ pathname: "/relay", search: "?id=1&chatId=2" }),
    "/login?next=%2Frelay%3Fid%3D1%26chatId%3D2"
  );
  assert.equal(
    buildLoginPath({ pathname: "/far/abc", search: "?chatId=x" }),
    "/login?next=%2Ffar%2Fabc%3FchatId%3Dx"
  );
});

test("buildLoginPath: служебные и публичные страницы возврата не заслуживают", () => {
  assert.equal(buildLoginPath({ pathname: "/external-login", search: "?token=t" }), "/login");
  assert.equal(buildLoginPath({ pathname: "/hotel-preview" }), "/login");
  assert.equal(buildLoginPath({ pathname: "/reset-password", search: "?token=t" }), "/login");
  assert.equal(buildLoginPath({ pathname: "/verify-email" }), "/login");
  assert.equal(buildLoginPath({ pathname: "/reset-to-email" }), "/login");
});

test("resolveLoginTarget: нет next — на главную", () => {
  assert.equal(resolveLoginTarget(""), "/");
  assert.equal(resolveLoginTarget(undefined), "/");
  assert.equal(resolveLoginTarget("?foo=1"), "/");
  assert.equal(resolveLoginTarget("?next=%2F"), "/");
});

test("resolveLoginTarget: относительный путь возвращается как есть", () => {
  assert.equal(resolveLoginTarget("?next=%2Frelay%3Fid%3D1%26chatId%3D2"), "/relay?id=1&chatId=2");
  assert.equal(resolveLoginTarget("?next=%2Ffar%2Fabc"), "/far/abc");
});

test("resolveLoginTarget: чужой origin отбрасывается", () => {
  assert.equal(resolveLoginTarget("?next=https%3A%2F%2Fevil.com"), "/");
  assert.equal(resolveLoginTarget("?next=%2F%2Fevil.com"), "/");
  // Обратный слэш браузер нормализует в прямой — это тоже protocol-relative адрес.
  assert.equal(resolveLoginTarget("?next=%2F%5Cevil.com"), "/");
  assert.equal(resolveLoginTarget("?next=evil.com"), "/");
});

test("resolveLoginTarget: служебные страницы в next не принимаются", () => {
  assert.equal(resolveLoginTarget("?next=%2Flogin"), "/");
  assert.equal(resolveLoginTarget("?next=%2FLOGIN"), "/");
  assert.equal(resolveLoginTarget("?next=%2Fexternal-login%3Ftoken%3D1"), "/");
  assert.equal(resolveLoginTarget("?next=%2Fhotel-preview"), "/");
});

test("круг: build → resolve возвращает исходный адрес", () => {
  const loginPath = buildLoginPath({ pathname: "/relay", search: "?id=1&chatId=2" });
  const search = new URL(loginPath, "http://x").search;
  assert.equal(resolveLoginTarget(search), "/relay?id=1&chatId=2");
});
