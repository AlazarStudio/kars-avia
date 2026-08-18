import { canAccessMenu, isExternalUser } from "../../../utils/access.js";
import { isRequestCancelled, isRequestCompleted } from "./fapConstants.js";

/**
 * Кому разрешено править ЗАВЕРШЁННУЮ заявку ФАП.
 *
 * Право выдаётся в доступах отдела и должности ключом reserveUpdateCompleted.
 * Внешние пользователи под него не подпадают: у гостиницы, вошедшей по
 * магик-ссылке, accessMenu нет вовсе, то есть выдать ей это право нечем —
 * решение владельца 13.08.
 *
 * ⚠️ SUPERADMIN проходит мимо ключа: так устроен canAccessMenu во всей системе,
 * отдельно для ФАП это не меняется.
 */
export const canEditCompletedRequest = (accessMenu, user) =>
  !isExternalUser(user) &&
  canAccessMenu(accessMenu, "reserveUpdateCompleted", user);

/**
 * Единственный источник правды «заявка закрыта для правок».
 *
 * Отмена запирает всегда; завершение — только у того, кому не выдано право.
 *
 * ⚠️ Пустой request даёт false намеренно: пока запрос грузится, request не
 * определён, и true запер бы экран на время загрузки у всех заявок подряд.
 */
export const isRequestEditLocked = (request, accessMenu, user) =>
  isRequestCancelled(request) ||
  (isRequestCompleted(request) && !canEditCompletedRequest(accessMenu, user));

/**
 * Можно ли вести поимённый состав поездки (пассажиры водителя трансфера).
 *
 * Завершение услуги состав НЕ запирает. Услуга завершается сама, как только
 * факт добит числом «перевезено N» (факт = max(список, transportedCount)),
 * а поимённый список после этого как раз и дозаполняют — иначе диспетчер
 * оказывается заперт на странице, которая сама зовёт «вести состав поимённо».
 *
 * Это уже действующее правило услуги, а не послабление: удаление и правка
 * пассажира на завершённой поездке и так открыты, а денежные поля водителя
 * заперты только отменой (FapTransferPage.jsx).
 *
 * Отмена запирает всегда. Защита завершённой ЗАЯВКИ живёт выше, в canEdit
 * страницы, — через isRequestEditLocked.
 */
export const canManageServicePeople = (service, canEdit) =>
  Boolean(canEdit) && service?.status !== "CANCELLED";
