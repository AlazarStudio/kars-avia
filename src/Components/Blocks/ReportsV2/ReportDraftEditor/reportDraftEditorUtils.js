import { parseHhMm, PARTIAL_DAY_DEFAULTS } from "../reportRules.js";

/** Вкладки клиентского фильтра таблицы строк черновика (см. ReportDraftFilters). */
export const DRAFT_FILTERS = {
  ALL: "all",
  WARNINGS: "warnings",
  EDITED: "edited",
};

/**
 * Форматирует сумму как "1 234 567" — пробел-разделитель разрядов, без копеек.
 *
 * @param {number|string|null|undefined} n - сумма
 * @returns {string} отформатированная сумма; "0" на пустом/нечисловом значении
 */
export function formatMoney(n) {
  return Math.round(Number(n) || 0).toLocaleString("ru-RU");
}

// Бэк отдаёт "Заезд"/"Выезд" строкой вида "07.07.2026 22:00:00" — для показа
// секунды лишние. Строка уже отформатирована на бэке (не ISO), поэтому просто
// отрезаем ":SS" в конце, если он есть; формат без секунд и пустое значение
// проходят как есть.
export function trimSeconds(value) {
  if (!value) return value;
  return value.replace(/^(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}):\d{2}$/, "$1");
}

/**
 * Разбивает отформатированную строку "DD.MM.YYYY HH:MM[:SS]" на дату и время.
 * Строка приходит с бэка уже в этом виде (не ISO) — см. trimSeconds.
 *
 * @param {string|null|undefined} value - строка даты/времени
 * @returns {{date: string, time: string}} дата и время по отдельности; оба "" на пустом значении
 */
export function splitDateTime(value) {
  const trimmed = trimSeconds(value) || "";
  const [date = "", time = ""] = trimmed.split(" ");
  return { date, time };
}

/**
 * Определяет, подсвечивать ли время заезда: срабатывает правило "полных суток"
 * (заезд раньше `PARTIAL_DAY_DEFAULTS.arrivalFullBefore`). Порог берётся из
 * общих дефолтов расчёта суток — не хардкодится заново.
 *
 * @param {string|null|undefined} arrival - "Заезд" строки черновика
 * @returns {{highlighted: boolean, title: string|undefined}}
 */
export function getArrivalHighlight(arrival) {
  const { time } = splitDateTime(arrival);
  const minutes = parseHhMm(time);
  const threshold = parseHhMm(PARTIAL_DAY_DEFAULTS.arrivalFullBefore);
  const highlighted = minutes != null && threshold != null && minutes < threshold;
  return {
    highlighted,
    title: highlighted
      ? `Заезд раньше ${PARTIAL_DAY_DEFAULTS.arrivalFullBefore} — начисляются полные сутки проживания`
      : undefined,
  };
}

/**
 * Определяет, подсвечивать ли время выезда: срабатывает правило "половины суток"
 * (выезд позже `PARTIAL_DAY_DEFAULTS.departureHalfAfter`).
 *
 * @param {string|null|undefined} departure - "Выезд" строки черновика
 * @returns {{highlighted: boolean, title: string|undefined}}
 */
export function getDepartureHighlight(departure) {
  const { time } = splitDateTime(departure);
  const minutes = parseHhMm(time);
  const threshold = parseHhMm(PARTIAL_DAY_DEFAULTS.departureHalfAfter);
  const highlighted = minutes != null && threshold != null && minutes > threshold;
  return {
    highlighted,
    title: highlighted
      ? `Выезд позже ${PARTIAL_DAY_DEFAULTS.departureHalfAfter} — начисляются дополнительные сутки проживания`
      : undefined,
  };
}

/**
 * Подсказка для колонки "Проживание ₽": объясняет, откуда взялась сумма.
 * Для правленых строк это всегда произведение суток на цену. Для нетронутых —
 * поясняем только когда сохранённая сумма расходится с "сутки × цена": при
 * совместном проживании бэк делит стоимость номера между жильцами по
 * временным сегментам, и произведение может не сойтись — молчаливое
 * совпадение (частый случай для одиночного проживания) в пояснении не нуждается.
 *
 * @param {object} row - строка черновика
 * @param {boolean} isEdited - строка правлена вручную (входит в editedUids)
 * @returns {string|undefined} текст подсказки; undefined, если пояснять нечего
 */
export function livingCostTooltip(row, isEdited) {
  if (isEdited) return "Сутки × цена (строка правлена вручную)";
  const days = Number(row?.totalDays) || 0;
  const price = Number(row?.pricePerDay) || 0;
  const computed = Math.round(days * price);
  const actual = Number(row?.totalLivingCost) || 0;
  return computed !== actual ? "Сервер разделил стоимость номера между соседями" : undefined;
}

/**
 * Склоняет "строка" под число — для диалогов, которые называют количество
 * незасохранённых/потерянных строк ("N строка"/"N строки"/"N строк").
 * Стандартное русское правило: 11–14 всегда "строк", иначе по последней цифре.
 *
 * @param {number} n - количество строк
 * @returns {"строка"|"строки"|"строк"} нужная форма слова
 */
export function pluralizeRows(n) {
  const abs = Math.abs(Math.trunc(Number(n) || 0));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return "строк";
  if (mod10 === 1) return "строка";
  if (mod10 >= 2 && mod10 <= 4) return "строки";
  return "строк";
}

/**
 * Клиентский поиск по строке черновика: без учёта регистра, по ФИО,
 * должности, номеру и категории размещения.
 *
 * @param {object} row - строка черновика
 * @param {string} query - произвольный ввод пользователя
 * @returns {boolean} true, если строка подходит под запрос (или запрос пуст)
 */
export function rowMatchesSearch(row, query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return true;
  const haystack = [row?.personName, row?.personPosition, row?.roomName, row?.category]
    .filter(Boolean)
    .join("  ")
    .toLowerCase();
  return haystack.includes(q);
}
