/**
 * Карта «id выпущенного отчёта → id черновика, из которого он напечатан».
 *
 * Связь в схеме односторонняя: у `SavedReport` ссылки на черновик нет, а у
 * `ReportDraft` есть `savedReportId`. Поэтому список отчётов сам не знает,
 * у какой строки есть экранный вид, — карта строится из выборки
 * подтверждённых черновиков и передаётся в список пропом.
 *
 * @param {Array<{id: string, savedReportId?: string|null}>|null|undefined} drafts
 *   подтверждённые черновики (status CONFIRMED)
 * @returns {Map<string, string>} id отчёта → id черновика
 */
export function buildDraftByReport(drafts) {
  const byReport = new Map();
  if (!Array.isArray(drafts)) return byReport;
  for (const draft of drafts) {
    const reportId = draft?.savedReportId;
    if (!reportId || byReport.has(reportId)) continue;
    byReport.set(reportId, draft.id);
  }
  return byReport;
}

/**
 * Делит выборку черновиков по статусу на три панели раздела.
 *
 * Запрос за черновиками один — без `status` в фильтре: бэк и так режет
 * выборку по учётке (АК видит только `SUBMITTED`/`CONFIRMED` своей
 * авиакомпании), а три отдельных запроса за одним и тем же списком дают три
 * несогласованных между собой кэша и три рефетча после каждой мутации.
 *
 * Незнакомый статус НЕ попадает в `open`: панель «Незавершённые черновики»
 * открывает строки на правку, и новый статус бэка не должен въехать туда
 * молча — лучше не показать, чем дать править то, что править нельзя.
 *
 * @param {Array<{status?: string}>|null|undefined} drafts выборка `reportDrafts`
 * @returns {{open: Array, submitted: Array, confirmed: Array}}
 */
export function splitDraftsByStatus(drafts) {
  const open = [];
  const submitted = [];
  const confirmed = [];
  if (!Array.isArray(drafts)) return { open, submitted, confirmed };
  for (const draft of drafts) {
    if (draft?.status === "DRAFT") open.push(draft);
    else if (draft?.status === "SUBMITTED") submitted.push(draft);
    else if (draft?.status === "CONFIRMED") confirmed.push(draft);
  }
  return { open, submitted, confirmed };
}
