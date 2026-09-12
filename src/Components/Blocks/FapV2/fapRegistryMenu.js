// Состав меню «⋯» карточки реестра: ключи действий в порядке показа.
// Что делает каждое действие — в таблице ACTIONS компонента FapRegistryView.
//
// submitted — реестр отправлен АК (есть submittedAt), approved — утверждён АК.
// "sep" остаётся в списке, даже если «Удалить» скрыто: хвостовой разделитель
// схлопывает сам FapOverflowMenu.

/**
 * @param {{submitted?: boolean, approved?: boolean, isDispatcher?: boolean,
 *          isAirline?: boolean, canManage?: boolean}} ctx
 * @returns {string[]} ключи действий
 */
export function registryMenuActions({
  submitted = false,
  approved = false,
  isDispatcher = false,
  isAirline = false,
  canManage = false,
} = {}) {
  if (isDispatcher && canManage) {
    const keys = [];
    if (!approved) keys.push("rebuild", "editHeader");
    if (!submitted) keys.push("submit");
    if (submitted && !approved) keys.push("unsubmit");
    keys.push("downloadInternal", "sep");
    if (!submitted) keys.push("delete");
    return keys;
  }
  if (isAirline) {
    const keys = ["download"];
    if (!approved) keys.push("approve");
    if (approved) keys.push("revokeApproval");
    if (!approved) keys.push("returnForRework");
    return keys;
  }
  // Диспетчер без права управления видит книгу с внутренним листом, прочие — без.
  return [isDispatcher ? "downloadInternal" : "download"];
}
