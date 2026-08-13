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
