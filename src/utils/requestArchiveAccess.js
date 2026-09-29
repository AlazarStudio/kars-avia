import { canAccessMenu, isExternalUser } from "./access.js";

/**
 * Заявка эскадрильи в финальном архиве — тем же правилом, что сервер
 * (services/request/requestArchiveGuard.js): статус «archived» ИЛИ флаг archive.
 * Крон пишет обе метки сразу, но старые записи могут нести только флаг.
 * «archiving» (69-дневный карантин) и «canceled» архивом не считаются.
 */
export const isRequestArchived = (request) =>
  request?.archive === true ||
  String(request?.status ?? "").trim().toLowerCase() === "archived";

/**
 * Право «Редактирование заявки в архиве» (ключ requestUpdateCompleted в доступах
 * отдела и должности). Внешние пользователи не проходят — сервер пускает только
 * сотрудников. SUPERADMIN проходит мимо ключа, как везде в canAccessMenu.
 */
export const canEditArchivedRequest = (accessMenu, user) =>
  !isExternalUser(user) &&
  canAccessMenu(accessMenu, "requestUpdateCompleted", user);

/**
 * Единственный источник правды «архивная заявка закрыта для правок».
 *
 * ⚠️ Пустой request даёт false намеренно: пока заявка грузится, экран не
 * запираем (тот же приём, что isRequestEditLocked в ФАП).
 */
export const isArchiveEditLocked = (request, accessMenu, user) =>
  isRequestArchived(request) && !canEditArchivedRequest(accessMenu, user);
