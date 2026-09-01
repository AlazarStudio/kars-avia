import test from "node:test";
import assert from "node:assert/strict";
import { resolveEffectiveAccessMenu, canManageAirlineAccess } from "./access.js";
import { roles } from "../roles.js";

test("гостиничная роль с непустым effectiveAccessMenu получает ровно эти флаги", () => {
  const result = resolveEffectiveAccessMenu({
    isDispatcherRole: false,
    isAirlineRole: false,
    departmentAccessMenu: undefined,
    effectiveAccessMenu: { requestMenu: true, userMenu: false },
  });
  assert.deepEqual(result, { requestMenu: true, userMenu: false });
});

test("гостиничная роль с effectiveAccessMenu: null получает {} — прежнее поведение не сломано", () => {
  // Главный тест карточки: на дев-стенде у всех гостиничных учёток
  // effectiveAccessMenu === null, значит сегодня функция обязана вернуть {},
  // как и старая заглушка `return {}` в хуке.
  const result = resolveEffectiveAccessMenu({
    isDispatcherRole: false,
    isAirlineRole: false,
    departmentAccessMenu: undefined,
    effectiveAccessMenu: null,
  });
  assert.deepEqual(result, {});
});

test("диспетчер: меню отдела — база, effectiveAccessMenu перекрывает по ключу", () => {
  const result = resolveEffectiveAccessMenu({
    isDispatcherRole: true,
    isAirlineRole: false,
    departmentAccessMenu: { requestMenu: true, userMenu: true },
    effectiveAccessMenu: { userMenu: false },
  });
  assert.deepEqual(result, { requestMenu: true, userMenu: false });
});

test("авиакомпания: та же формула, effectiveAccessMenu перекрывает true → false", () => {
  const result = resolveEffectiveAccessMenu({
    isDispatcherRole: false,
    isAirlineRole: true,
    departmentAccessMenu: { requestMenu: true, reportMenu: true },
    effectiveAccessMenu: { requestMenu: false },
  });
  assert.deepEqual(result, { requestMenu: false, reportMenu: true });
});

test("меню отдела не протекает в результат для гостиничной роли", () => {
  // Формула для гостиницы не подмешивает departmentAccessMenu вообще — у неё
  // просто нет отдела, но проверяем явно, что даже если его передать, он
  // игнорируется.
  const result = resolveEffectiveAccessMenu({
    isDispatcherRole: false,
    isAirlineRole: false,
    departmentAccessMenu: { requestMenu: true },
    effectiveAccessMenu: { userMenu: true },
  });
  assert.deepEqual(result, { userMenu: true });
});

test("canManageAirlineAccess: супер без ключа accessManage — true", () => {
  const user = { role: roles.superAdmin };
  assert.equal(canManageAirlineAccess({}, user), true);
});

test("canManageAirlineAccess: DISPATCHERADMIN без ключа accessManage — true", () => {
  const user = { role: roles.dispatcerAdmin };
  assert.equal(canManageAirlineAccess({}, user), true);
});

test("canManageAirlineAccess: DISPATCHERMODERATOR без ключа — false, с ключом accessManage — true", () => {
  const user = { role: roles.dispatcherModerator };
  assert.equal(canManageAirlineAccess({}, user), false);
  assert.equal(canManageAirlineAccess({ accessManage: true }, user), true);
});

test("canManageAirlineAccess: AIRLINEADMIN без ключа — false, с ключом accessManage — true", () => {
  const user = { role: roles.airlineAdmin };
  assert.equal(canManageAirlineAccess({}, user), false);
  assert.equal(canManageAirlineAccess({ accessManage: true }, user), true);
});
