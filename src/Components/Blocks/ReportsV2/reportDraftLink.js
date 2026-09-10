// Параметры адреса раздела «Отчёты», которыми открывается редактор черновика.
// Имена задаёт бэк (services/email/frontendEntityLinks.js) — по ним ведут
// ссылки из писем; переименовывать только вместе с бэком.
export const REPORT_DRAFT_PARAM = "reportdraftid";
export const REPORT_PARAM = "reportid";

/**
 * Что открыть по адресу: черновик по его id или выпущенный отчёт по id
 * отчёта. URLSearchParams уже раскодировал encodeURIComponent бэка.
 *
 * @param {URLSearchParams} searchParams
 * @returns {{draftId: string|null, reportId: string|null}}
 */
export function readReportLink(searchParams) {
  return {
    draftId: searchParams.get(REPORT_DRAFT_PARAM) || null,
    reportId: searchParams.get(REPORT_PARAM) || null,
  };
}

/**
 * Есть ли в строке запроса ссылка на черновик или отчёт.
 *
 * @param {string|undefined} search `location.search`
 * @returns {boolean}
 */
export function hasReportLink(search) {
  const { draftId, reportId } = readReportLink(new URLSearchParams(search || ""));
  return Boolean(draftId || reportId);
}

/**
 * Режим редактора для черновика, открытого по ссылке, — ровно тот, что даёт
 * кнопка «Открыть» у этой роли: диспетчерские роли правят (редактор сам
 * запирает правку не-DRAFT), авиакомпания проверяет отправленное, остальные
 * только смотрят.
 *
 * @param {{showDrafts: boolean, isAirlineUser: boolean}} role
 * @returns {"edit"|"review"|"view"}
 */
export function draftModeForRole({ showDrafts, isAirlineUser }) {
  if (showDrafts) return "edit";
  if (isAirlineUser) return "review";
  return "view";
}

/**
 * Какой черновик и в каком режиме открыт по адресу. Выпущенный отчёт
 * открывается экранным видом своего черновика — связь «отчёт → черновик»
 * строит releasedReports.buildDraftByReport.
 *
 * @param {{draftId: string|null, reportId: string|null}|null} link
 * @param {Map<string, string>|undefined} draftByReport
 * @param {"edit"|"review"|"view"} roleMode
 * @returns {{draftId: string, mode: "edit"|"review"|"view"}|null} null — открывать
 *   нечего (или связь «отчёт → черновик» ещё не пришла)
 */
export function resolveEditorTarget(link, draftByReport, roleMode) {
  if (link?.draftId) return { draftId: link.draftId, mode: roleMode };
  if (link?.reportId) {
    const draftId = draftByReport?.get(link.reportId);
    return draftId ? { draftId, mode: "view" } : null;
  }
  return null;
}

/**
 * Новая строка запроса с открытым черновиком/отчётом — или без него
 * (next = null). Параметры раздела взаимоисключающие; чужие не трогаются,
 * исходный объект не мутируется.
 *
 * @param {URLSearchParams} searchParams
 * @param {{draftId?: string, reportId?: string}|null} next
 * @returns {URLSearchParams}
 */
export function withReportLink(searchParams, next) {
  const params = new URLSearchParams(searchParams);
  params.delete(REPORT_DRAFT_PARAM);
  params.delete(REPORT_PARAM);
  if (next?.draftId) params.set(REPORT_DRAFT_PARAM, next.draftId);
  else if (next?.reportId) params.set(REPORT_PARAM, next.reportId);
  return params;
}
