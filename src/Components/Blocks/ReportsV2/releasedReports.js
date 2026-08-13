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
