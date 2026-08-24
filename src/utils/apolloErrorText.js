/**
 * Текст ошибки Apollo для показа пользователю.
 *
 * Часть мутаций сервер отбивает до GraphQL-слоя (невалидные переменные →
 * HTTP 400), и тогда graphQLErrors пуст, а причина лежит в
 * networkError.result.errors. Показывать в этом случае голый фолбэк — значит
 * скрыть от пользователя ровно тот текст, который объясняет отказ.
 *
 * Вынесено из FapV2/hooks/useBaggageTripDraft.js: цепочку
 * graphQLErrors → networkError.result.errors → networkError → message
 * повторяют десятки мест, и расходиться она не должна.
 *
 * @param {unknown} e ошибка из catch вокруг мутации/запроса Apollo
 * @param {string} fallback текст, если ни одно звено цепочки не сработало
 * @returns {string}
 */
export const apolloErrorText = (e, fallback = "Ошибка при сохранении") =>
  e?.graphQLErrors?.[0]?.message ||
  e?.networkError?.result?.errors?.[0]?.message ||
  e?.networkError?.message ||
  e?.message ||
  fallback;
