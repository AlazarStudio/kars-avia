/**
 * Последний комментарий авиакомпании к черновику отчёта — для плашки
 * редактора и строки списка черновиков.
 *
 * «Сейчас возвращён» — это `rejectedAt`, а не наличие комментария: повторная
 * отправка гасит `rejectedAt`, но текст оставляет, чтобы на втором круге обе
 * стороны видели, что просили исправить.
 *
 * @param {{airlineComment?: string|null, airlineCommentAt?: string|null, rejectedAt?: string|null}|null|undefined} draft
 * @returns {{rejected: boolean, text: string, at: string|null}|null}
 */
export function draftAirlineNote(draft) {
  const text = typeof draft?.airlineComment === "string" ? draft.airlineComment.trim() : "";
  if (!text) return null;
  return {
    rejected: draft.rejectedAt != null,
    text,
    at: draft.airlineCommentAt ?? null,
  };
}
