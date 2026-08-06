import test from "node:test";
import assert from "node:assert/strict";
import { canSeeExternalLinks, canReopenPassengerService } from "./access.js";
import { roles } from "../roles.js";

const user = (role, extra = {}) => ({ role, ...extra });
const external = (scope) => ({
  subjectType: "EXTERNAL_USER",
  scope,
  role: roles.hotelAdmin,
});

test("ссылки-входы видит диспетчер и супер-админ", () => {
  assert.equal(canSeeExternalLinks(user(roles.superAdmin)), true);
  assert.equal(canSeeExternalLinks(user(roles.dispatcerAdmin)), true);
  assert.equal(canSeeExternalLinks(user(roles.dispatcherModerator)), true);
});

test("гостиничные роли ссылок НЕ видят", () => {
  // Ради этого правило и переписано: прежний предикат `!isAirlineRole`
  // открывал администратору одной гостиницы ссылки ЧУЖИХ гостиниц заявки и
  // всех водителей. Ссылка — это вход в чужую сессию, а не поле данных.
  assert.equal(canSeeExternalLinks(user(roles.hotelAdmin)), false);
  assert.equal(canSeeExternalLinks(user(roles.hotelModerator)), false);
});

test("авиакомпания ссылок не видит — как и раньше", () => {
  // Обратная проверка: прежнее поведение для авиакомпаний не изменилось.
  assert.equal(canSeeExternalLinks(user(roles.airlineAdmin)), false);
  assert.equal(canSeeExternalLinks(user(roles.airlineModerator)), false);
});

test("внешний пользователь ссылок не видит ни при какой роли в токене", () => {
  // Внешний субъект приходит по магик-линку; роль в его токене доверия не
  // заслуживает, поэтому проверка на externality стоит первой.
  assert.equal(canSeeExternalLinks(external("HOTEL")), false);
  assert.equal(canSeeExternalLinks(external("DRIVER")), false);
  assert.equal(
    canSeeExternalLinks({ subjectType: "EXTERNAL_USER", role: roles.superAdmin }),
    false,
    "даже с ролью супер-админа в токене внешний субъект ссылок не получает"
  );
});

test("пустой пользователь не роняет предикат", () => {
  assert.equal(canSeeExternalLinks(null), false);
  assert.equal(canSeeExternalLinks(undefined), false);
  assert.equal(canSeeExternalLinks({}), false);
});

test("вернуть услугу в работу может диспетчер и супер-админ", () => {
  assert.equal(canReopenPassengerService(user(roles.superAdmin)), true);
  assert.equal(canReopenPassengerService(user(roles.dispatcerAdmin)), true);
  assert.equal(canReopenPassengerService(user(roles.dispatcherModerator)), true);
});

test("гостиница, авиакомпания и внешний пользователь услугу не переоткрывают", () => {
  // Откат завершения снимает дату и причину закрытия — это администрирование
  // жизненного цикла, а не работа с результатом услуги.
  assert.equal(canReopenPassengerService(user(roles.hotelAdmin)), false);
  assert.equal(canReopenPassengerService(user(roles.hotelModerator)), false);
  assert.equal(canReopenPassengerService(user(roles.airlineAdmin)), false);
  assert.equal(canReopenPassengerService(external("HOTEL")), false);
  assert.equal(canReopenPassengerService(null), false);
});
