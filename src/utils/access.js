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

export const isHotelAdmin = (user) => user?.role === roles.hotelAdmin;

export const isHotelModerator = (user) => user?.role === roles.hotelModerator;

export const isHotelRole = (user) => isHotelAdmin(user) || isHotelModerator(user);

/**
 * Пользователь, которому в заявке ФАП видна ТОЛЬКО своя гостиница.
 *
 * Ограничение уже действовало для входа по магик-ссылке (`scope: HOTEL`), но не
 * для внутренней роли гостиницы: администратор гостиницы «А» открывал в общей
 * заявке карточку гостиницы «Б», заходил внутрь и выгружал её отчёт — с ФИО
 * гостей, номерами комнат, тарифами и суммами. Правка — не запись, у гостиничных
 * ролей `accessMenu` пуст, но чтение чужих денег это не оправдывает.
 *
 * ⚠️ `FAP_SCOPE_ENFORCE` этого не закрывает: серверный флаг решает, какие ЗАЯВКИ
 * видны субъекту, а не какие блоки внутри заявки, и гостиницу-участника он к её
 * заявке пустит законно.
 */
export const isHotelScoped = (user) =>
  (isExternalUser(user) && user?.scope === "HOTEL") || isHotelRole(user);

/**
 * Идентификатор той самой гостиницы, либо null.
 *
 * ⚠️ null у ограниченного пользователя означает «не видно ничего», а не «видно
 * всё»: спрашивать надо парой с `isHotelScoped`, иначе аккаунт без привязки
 * получил бы доступ шире, чем привязанный. Замер 06.08: гостиничных аккаунтов
 * без привязки в системе нет.
 */
export const scopedHotelId = (user) =>
  isHotelScoped(user) ? user?.hotelId ?? null : null;

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

/**
 * Кому в ФАП возвращать в работу ЗАВЕРШЁННУЮ услугу.
 *
 * Откат завершения — административное действие: оно снимает дату завершения
 * и причину досрочного закрытия. Гостиница и авиакомпания видят результат
 * услуги, но не правят её жизненный цикл, поэтому список положительный —
 * тот же, что у ссылок-входов.
 */
export const canReopenPassengerService = (user) =>
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
