/**
 * Сообщения об ошибках External Auth (по документации external-auth-frontend.md и external-auth-frontend-guide.md).
 * Ключи — точное сообщение из GraphQL error (message).
 */
export const EXTERNAL_AUTH_ERROR_MESSAGES = {
  "Invalid or expired magic link": "Ссылка недействительна, истекла или уже использована.",
  "Access forbidden": "Доступ запрещён.",
  FORBIDDEN: "Доступ запрещён.",
  "PassengerRequest not found": "Заявка не найдена.",
  "PassengerServiceHotel item not found": "Указанный отель в заявке не найден.",
  "Magic link issue limit exceeded": "Превышен лимит выдачи ссылок. Попробуйте позже (не более 5 ссылок в час).",
  "External user has no active session": "Нет активной сессии. Невозможно продлить.",
  "Email is required": "Укажите email.",
  "Only admins can issue magic links": "Выдавать ссылки могут только администраторы.",
  "Only admins can reissue magic links": "Перевыдавать ссылки могут только администраторы.",
  "Invalid accountType": "Укажите тип учётной записи: CRM или PVA.",
  "External user not found": "Внешний пользователь не найден.",
};

/**
 * @param {Error} err — ошибка от Apollo (err.graphQLErrors?.[0]?.message или err.message)
 * @param {string} fallback — сообщение по умолчанию
 * @returns {string}
 */
export function getExternalAuthErrorMessage(err, fallback = "Произошла ошибка.") {
  const msg = err?.graphQLErrors?.[0]?.message || err?.message || "";
  return EXTERNAL_AUTH_ERROR_MESSAGES[msg] || msg || fallback;
}
