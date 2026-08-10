/**
 * Возраст черновика отчёта и порог его устаревания.
 *
 * Черновик — мёртвый снимок строк, собранный из заявок на момент создания
 * (`ReportDraft.createdAt`): подтверждение печатает строки ровно как они лежат в базе.
 * Возраст поэтому считается от `createdAt`, а не от `updatedAt` — устаревают исходные
 * данные заявок, собранные при создании черновика, а правка строк пользователем (что
 * двигает `updatedAt`) эти исходные данные не освежает.
 */

export const STALE_DRAFT_DAYS = 7;

/**
 * Возраст черновика в сутках, отсчитанный от `createdAt`.
 *
 * @param {string|null|undefined} createdAt - ISO-дата создания черновика
 * @returns {number|null} возраст в сутках (дробный); `null` на пустом или битом значении
 */
export function getDraftAgeDays(createdAt) {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;
  return (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Определяет, устарел ли черновик: возраст строго больше `STALE_DRAFT_DAYS`.
 * Ровно порог (7 суток) — ещё не устарел.
 *
 * @param {string|null|undefined} createdAt - ISO-дата создания черновика
 * @returns {boolean} true, если черновик устарел; false, если не устарел или возраст неизвестен
 */
export function isDraftStale(createdAt) {
  const ageDays = getDraftAgeDays(createdAt);
  return ageDays !== null && ageDays > STALE_DRAFT_DAYS;
}
