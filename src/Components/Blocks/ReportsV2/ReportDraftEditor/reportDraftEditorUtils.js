import { parseHhMm, PARTIAL_DAY_DEFAULTS } from "../reportRules.js";
import { plural } from "../../../../utils/plural.js";

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

/**
 * Форматирует сутки для показа: русская запятая и не больше двух знаков.
 *
 * Значения с бэка кратны 0.5, но поле суток свободное — после нескольких
 * правок сумма по группе даёт «3.3000000000000003», и в шапке это выглядит
 * поломкой. Хвост режем, целые печатаем без дробной части.
 *
 * @param {number} n - число суток
 * @returns {string} например "4,5" или "12"
 */
export function formatDays(n) {
  const value = Number(n) || 0;
  return String(Math.round(value * 100) / 100).replace(".", ",");
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
 * Раскладывает `shareSegments` строки черновика в готовые к показу отрезки
 * совместного проживания.
 *
 * Бэк отдаёт границы уже отформатированными («01.08.2026 00:10:00»), поэтому
 * здесь только отрезаются секунды и вытаскиваются фамилии соседей — разбора
 * дат нет и быть не должно.
 *
 * Это структурная замена текстовому `shareNote`: та же информация лежит в нём
 * одной строкой («жил с Котов Д.С., …»), но по ней нельзя ни выделить соседа,
 * ни посчитать отрезки.
 *
 * @param {Array<object>|null|undefined} segments - `row.shareSegments`
 * @returns {Array<{period: string, names: string[], alone: boolean}>}
 */
export function describeShareSegments(segments) {
  if (!Array.isArray(segments)) return [];
  return segments.map((segment) => {
    const start = trimSeconds(segment?.start) || "";
    const end = trimSeconds(segment?.end) || "";
    const names = (segment?.cohabitants || [])
      .map((person) => person?.personName)
      .filter(Boolean);
    return {
      period: start && end ? `${start} — ${end}` : start || end,
      names,
      // `alone` с бэка — источник истины; пустой список соседей лишь его
      // подтверждает, но сам по себе решением не является.
      alone: Boolean(segment?.alone) || names.length === 0,
    };
  });
}

/**
 * Собирает уникальные фамилии соседей по всем отрезкам строки.
 *
 * @param {Array<object>|null|undefined} segments - `row.shareSegments`
 * @returns {string[]} фамилии без повторов, в порядке появления
 */
export function listCohabitants(segments) {
  const seen = new Set();
  for (const segment of describeShareSegments(segments)) {
    for (const name of segment.names) seen.add(name);
  }
  return [...seen];
}

/**
 * Достаёт порог подсветки из правил, а если он не разбирается — подставляет
 * дефолт (и в сравнение, и в текст подсказки).
 *
 * Фолбэк, а не «выключить подсветку»: фронтовый разбор времени строже бэкового
 * (`^([01]\d|…)` против `^([01]?\d|…)` в `services/report/partialDaySettings.js:14`),
 * поэтому сохранённое через API «6:00» бэк посчитает как 06:00, а `parseHhMm`
 * вернёт null. Погасить на этом подсветку — вернуть ровно тот дефект, который
 * чинили: экран перестанет показывать границу, по которой идёт расчёт. Бэк на
 * непарсящемся значении делает то же самое (`rulesToCalcConfig`,
 * `partialDaySettings.js:46-49`: `parseHhMmToMinutes(...) ?? 6*60`).
 *
 * @param {string|null|undefined} value - порог из правил
 * @param {string} key - имя поля правил (источник дефолта)
 * @returns {{limit: string, threshold: number}} порог строкой и в минутах
 */
function resolveThreshold(value, key) {
  const parsed = parseHhMm(value);
  if (parsed != null) return { limit: value, threshold: parsed };
  const fallback = PARTIAL_DAY_DEFAULTS[key];
  return { limit: fallback, threshold: parseHhMm(fallback) };
}

/**
 * Определяет, подсвечивать ли время заезда: срабатывает правило "полных суток"
 * (заезд раньше `rules.arrivalFullBefore`).
 *
 * Порог берётся из действующих правил черновика (`resolveDraftPartialDayRules`),
 * а не из константы: диспетчер, поменявший порог в настройке, получал расчёт по
 * новому порогу и подсветку по старому. Дефолты остаются фолбэком — вызов без
 * `rules` ведёт себя как раньше.
 *
 * Сравнение строгое (`<`), как на бэке: заезд ровно в пороговое время надбавки
 * не даёт.
 *
 * @param {string|null|undefined} arrival - "Заезд" строки черновика
 * @param {object} [rules] - правила частичных суток; по умолчанию общие дефолты
 * @returns {{highlighted: boolean, title: string|undefined}}
 */
export function getArrivalHighlight(arrival, rules = PARTIAL_DAY_DEFAULTS) {
  const { time } = splitDateTime(arrival);
  const minutes = parseHhMm(time);
  const { limit, threshold } = resolveThreshold(rules?.arrivalFullBefore, "arrivalFullBefore");
  const highlighted = minutes != null && minutes < threshold;
  return {
    highlighted,
    title: highlighted
      ? `Заезд раньше ${limit} — начисляются полные сутки проживания`
      : undefined,
  };
}

/**
 * Определяет, подсвечивать ли время выезда: срабатывает правило "половины суток"
 * (выезд позже `rules.departureHalfAfter`). Порог — из действующих правил
 * черновика, дефолты как фолбэк; сравнение строгое (`>`), как на бэке.
 *
 * @param {string|null|undefined} departure - "Выезд" строки черновика
 * @param {object} [rules] - правила частичных суток; по умолчанию общие дефолты
 * @returns {{highlighted: boolean, title: string|undefined}}
 */
export function getDepartureHighlight(departure, rules = PARTIAL_DAY_DEFAULTS) {
  const { time } = splitDateTime(departure);
  const minutes = parseHhMm(time);
  const { limit, threshold } = resolveThreshold(rules?.departureHalfAfter, "departureHalfAfter");
  const highlighted = minutes != null && minutes > threshold;
  return {
    highlighted,
    title: highlighted
      ? `Выезд позже ${limit} — начисляются дополнительные сутки проживания`
      : undefined,
  };
}

/**
 * Текст ячейки "Завтрак" — копия печатной формулы бэка
 * (`services/report/reportPresentation.js:79`), правится парой с ней.
 *
 * Когда завтрак включён в стоимость номера, в файле печатается "вкл", а не
 * количество; редактор в той же колонке выводил число, и диспетчер, сверяющий
 * черновик с выгрузкой построчно, видел расхождение в каждой такой строке.
 *
 * @param {object} row - строка черновика
 * @returns {string} "вкл" либо количество завтраков строкой
 */
export function breakfastCellText(row) {
  return row?.breakfastIncludedInPrice ? "вкл" : String(row?.breakfastCount ?? 0);
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
 * Значение для поля ввода строки: ноль показываем пустым полем с подсказкой
 * «0», а не самим нулём.
 *
 * Ноль в цене и сутках — это не введённое значение, а дыра, на которую и
 * указывают подписи «нет цены» / «нет суток». Пока он лежал в поле значением,
 * набор поверх него давал «0866» — цену на порядок больше задуманной, и
 * заметить это в таблице на 18 колонок практически нельзя. Пустое поле с серой
 * подсказкой читается так же («тут ноль»), но печатается начисто.
 *
 * @param {number|string|null|undefined} value - значение поля строки
 * @returns {string|number} пустая строка вместо нуля, иначе значение как есть
 */
export function editableValue(value) {
  if (value === null || value === undefined || value === "") return "";
  return Number(value) === 0 ? "" : value;
}

/**
 * Склоняет "строка" под число — для диалогов, которые называют количество
 * незасохранённых/потерянных строк ("N строка"/"N строки"/"N строк").
 *
 * @param {number} n - количество строк
 * @returns {"строка"|"строки"|"строк"} нужная форма слова
 */
export function pluralizeRows(n) {
  return plural(n, ["строка", "строки", "строк"]);
}

/**
 * Склоняет "день" под число — для заголовка диалога, который называет
 * возраст черновика ("Черновику 21 день", а не "21 дней").
 *
 * @param {number} n - возраст в сутках, целое
 * @returns {"день"|"дня"|"дней"} нужная форма слова
 */
export function pluralizeDays(n) {
  return plural(n, ["день", "дня", "дней"]);
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
