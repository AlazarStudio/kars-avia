import { hasAccessMenu, isDispatcherAdmin, isSuperAdmin } from "../../../utils/access.js";

/**
 * Может ли учётка удалить выпущенный отчёт.
 *
 * Зеркало бэкового `assertCanDeleteSavedReport`: супер и диспетчер-админ
 * удаляют по роли (ключа у них может не быть вовсе), всем остальным нужен
 * `reportDelete` — он выдаётся осознанно и по умолчанию выключен. Форма та же,
 * что у `canManageAirlineAccess` в utils/access.js: роль ИЛИ ключ.
 *
 * @param {{role?: string}|null|undefined} user
 * @param {Record<string, boolean>|null|undefined} accessMenu
 * @returns {boolean}
 */
export function canDeleteReport(user, accessMenu) {
  return (
    isSuperAdmin(user) ||
    isDispatcherAdmin(user) ||
    hasAccessMenu(accessMenu, "reportDelete")
  );
}
