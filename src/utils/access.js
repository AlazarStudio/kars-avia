import { roles } from "../roles.js";

/** JWT subjectType for external user (scope HOTEL | DRIVER, accessType PWA | CRM). */
export const SUBJECT_TYPE_EXTERNAL_USER = "EXTERNAL_USER";

export const isExternalUser = (user) =>
  user?.subjectType === SUBJECT_TYPE_EXTERNAL_USER;

/** @deprecated Use isExternalUser. Kept for compatibility. */
export const isExternalPassengerRequestUser = (user) => isExternalUser(user);

export const safeAccessMenu = (accessMenu) => accessMenu || {};

export const isSuperAdmin = (user) => user?.role === roles.superAdmin;

export const isDispatcherAdmin = (user) => user?.role === roles.dispatcerAdmin;

export const isDispatcherModerator = (user) =>
  user?.role === roles.dispatcherModerator;

export const isDispatcherRole = (user) =>
  isDispatcherAdmin(user) || isDispatcherModerator(user);

export const isAirlineAdmin = (user) => user?.role === roles.airlineAdmin;

export const isAirlineModerator = (user) =>
  user?.role === roles.airlineModerator;

export const isAirlineRole = (user) =>
  isAirlineAdmin(user) || isAirlineModerator(user);

/**
 * Кому в ФАП показывать ссылки-входы участников (linkCRM / linkPWA гостиниц и
 * водителей).
 *
 * Список положительный, а не «все кроме авиакомпании». Прежний предикат
 * `!isAirlineRole` открывал ссылки и гостиничным ролям: администратор одной
 * гостиницы видел кнопки копирования для ЧУЖИХ гостиниц заявки и для всех
 * водителей трансфера и багажа. Ссылка — это вход в чужую сессию, а не данные,
 * и она не одноразовая, поэтому ошибка тут дороже обычной утечки поля.
 *
 * Ссылки выдаёт диспетчер — ему они и нужны. Гостиничной роли собственная
 * ссылка не нужна: она уже внутри системы.
 */
export const canSeeExternalLinks = (user) =>
  !isExternalUser(user) && (isSuperAdmin(user) || isDispatcherRole(user));

export const hasAccessMenu = (accessMenu, key) => {
  if (!key) return true;
  const safeMenu = safeAccessMenu(accessMenu);
  return !!safeMenu[key];
};

export const canAccessMenu = (accessMenu, key, user) =>
  isSuperAdmin(user) || hasAccessMenu(accessMenu, key);

export const getDispatcherAccess = (accessMenu, key, user) => {
  if (!isDispatcherRole(user)) return undefined;
  return hasAccessMenu(accessMenu, key);
};

export const canCreateRequest = (user, accessMenu) => {
  if (isSuperAdmin(user)) return true;
  if (isDispatcherRole(user)) return hasAccessMenu(accessMenu, "requestCreate");
  if (user?.airlineId) return hasAccessMenu(accessMenu, "requestCreate");
  return true;
};
