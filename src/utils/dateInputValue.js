/**
 * Дата → YYYY-MM-DD для <input type="date">.
 *
 * Нейтральный модуль: хелпер нужен и сезонным ценам (src/utils/roomKindSeasons.js),
 * и реестрам услуг ФАП, поэтому живёт отдельно, а не в доменном модуле одного из них.
 * Зависимостей нет — гоняется через node --test напрямую, тот же довод записан
 * в шапке src/utils/excelDate.js.
 */

/**
 * y/m/d → YYYY-MM-DD, но только если компоненты не переполнились при сборке
 * через Date.UTC (иначе, например, 2026-02-30 тихо стал бы 2026-03-02).
 * Несуществующая дата → null.
 */
export const buildDateInputValue = (y, m, d) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() + 1 !== m ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  const mm = `${m}`.padStart(2, "0");
  const dd = `${d}`.padStart(2, "0");
  return `${y}-${mm}-${dd}`;
};

/** Значение с бэка (ISO/Date) → YYYY-MM-DD для <input type="date">. */
export const toDateInputValue = (value) => {
  if (!value) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const m = `${value.getMonth() + 1}`.padStart(2, "0");
    const d = `${value.getDate()}`.padStart(2, "0");
    return `${value.getFullYear()}-${m}-${d}`;
  }
  const str = String(value).trim();
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return buildDateInputValue(Number(iso[1]), Number(iso[2]), Number(iso[3])) ?? "";
  }
  const ru = str.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (ru) {
    return buildDateInputValue(Number(ru[3]), Number(ru[2]), Number(ru[1])) ?? "";
  }
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return "";
  return toDateInputValue(parsed);
};
