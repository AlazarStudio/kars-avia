/** Полный набор полей строки черновика отчёта (`ReportDraftRow`), в порядке контракта бэка. */
export const DRAFT_ROW_FIELDS = [
  "index",
  "requestId",
  "arrival",
  "departure",
  "totalDays",
  "category",
  "personName",
  "personPosition",
  "roomName",
  "roomId",
  "shareNote",
  "breakfastCount",
  "lunchCount",
  "dinnerCount",
  "breakfastIncludedInPrice",
  "totalMealCost",
  "totalLivingCost",
  "pricePerDay",
  "totalDebt",
  "hotelName",
];

/** Поля строки, которые пользователь правит руками; остальные — только производные/справочные. */
export const EDITABLE_FIELDS = ["totalDays", "pricePerDay", "totalMealCost"];

/**
 * Добавляет каждой строке черновика стабильный клиентский ключ `_uid` (индекс в массиве).
 * Нужен как React `key` и как способ отличать строки друг от друга независимо от `index`,
 * который меняется при пересчёте/удалении.
 *
 * @param {Array<object>|null|undefined} rows - строки черновика с бэка
 * @returns {Array<object>} те же строки с добавленным полем `_uid`; `[]`, если `rows` не массив
 */
export function attachRowKeys(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, i) => ({ ...row, _uid: i }));
}

/**
 * Пересчитывает производные поля строки: `totalLivingCost = round(totalDays * pricePerDay)`,
 * `totalDebt = totalLivingCost + totalMealCost`.
 *
 * Вызывать ТОЛЬКО для строк, которые пользователь изменил вручную. При совместном проживании
 * бэк делит стоимость номера между жильцами по временным сегментам — это не сводится к
 * произведению «сутки × цена». Нетронутые строки должны уходить на сохранение как есть
 * (см. `stripRow`/`prepareRowsForSave`), иначе наивный пересчёт перепишет суммы людям,
 * которых никто не редактировал.
 *
 * @param {object} row - строка черновика (после правки пользователем)
 * @returns {object} новая строка с обновлёнными `totalLivingCost` и `totalDebt`
 */
export function recalcRow(row) {
  const days = Number(row?.totalDays) || 0;
  const price = Number(row?.pricePerDay) || 0;
  const meal = Number(row?.totalMealCost) || 0;
  const living = Math.round(days * price);
  return { ...row, totalLivingCost: living, totalDebt: living + meal };
}

/**
 * Определяет, нужна ли строке ручная простановка цены за сутки: есть сутки проживания,
 * но цена не задана или равна нулю.
 *
 * Отвечает ТОЛЬКО на этот вопрос («есть сутки, но нет цены»). Обратный случай — сутки
 * пустые/нулевые (а цена может быть какой угодно) — эта функция намеренно не ловит:
 * `recalcRow` в таком случае тихо даёт `totalLivingCost: 0`, и сигнализировать об этом
 * пользователю должен компонент таблицы, а не `rowNeedsPrice`.
 *
 * @param {object} row - строка черновика
 * @returns {boolean} true, если у строки есть дни, но нет цены
 */
export function rowNeedsPrice(row) {
  const days = Number(row?.totalDays) || 0;
  const price = Number(row?.pricePerDay) || 0;
  return days > 0 && price <= 0;
}

/**
 * Определяет, нужна ли строке ручная простановка суток проживания: суток нет или их
 * значение не больше нуля.
 *
 * Симметрично `rowNeedsPrice`, но про другое поле: там условие требует ненулевые дни,
 * чтобы указать на отсутствие цены, здесь же само отсутствие дней и есть проблема —
 * цена в этом случае ни на что не влияет, `recalcRow` при нулевых днях тихо даёт
 * `totalLivingCost: 0` независимо от цены.
 *
 * @param {object} row - строка черновика
 * @returns {boolean} true, если у строки нет (или не больше нуля) суток проживания
 */
export function rowNeedsDays(row) {
  const days = Number(row?.totalDays) || 0;
  return days <= 0;
}

/**
 * Приводит строку к чистому формату `ReportDraftRow` для отправки на бэк: оставляет только
 * поля из `DRAFT_ROW_FIELDS`, отбрасывая клиентские (`_uid`) и apollo-служебные (`__typename`)
 * ключи и любой посторонний мусор.
 *
 * Отсутствующее или `undefined`-значение намеренно превращается в `null`: бэковый
 * нормализатор черновика ожидает `null`, а `undefined` в переменных GraphQL-мутации
 * ломает валидацию запроса.
 *
 * @param {object} row - произвольная строка (возможно, с клиентскими полями)
 * @returns {object} строка ровно с полями `DRAFT_ROW_FIELDS`
 */
export function stripRow(row) {
  const out = {};
  for (const key of DRAFT_ROW_FIELDS) out[key] = row?.[key] ?? null;
  return out;
}

/**
 * Готовит массив строк к сохранению: очищает каждую через `stripRow` и перенумеровывает
 * `index` подряд с единицы — независимо от того, какие `index`/`_uid` были у строк до этого
 * (например, после удаления строки в середине списка).
 *
 * @param {Array<object>|null|undefined} rows - строки черновика (с клиентскими полями)
 * @returns {Array<object>} чистые строки с последовательным `index`; `[]`, если `rows` не массив
 */
export function prepareRowsForSave(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, i) => ({ ...stripRow(row), index: i + 1 }));
}

/**
 * Сравнивает два массива строк по данным контракта `DRAFT_ROW_FIELDS`, игнорируя клиентские
 * и apollo-служебные поля (`_uid`, `__typename`). Сравнение позиционное: обе стороны сначала
 * прогоняются через `prepareRowsForSave`, который перенумеровывает `index` подряд с единицы,
 * поэтому сырые исходные значения `index` на результат не влияют. Перестановка строк местами
 * при этом всё равно ловится — не по `index` (он после перенумерации одинаков), а по тому, что
 * остальные поля на одной и той же позиции расходятся.
 *
 * @param {Array<object>} a - первый массив строк
 * @param {Array<object>} b - второй массив строк
 * @returns {boolean} true, если массивы эквивалентны по данным
 */
export function rowsEqual(a, b) {
  const left = prepareRowsForSave(a);
  const right = prepareRowsForSave(b);
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    for (const key of DRAFT_ROW_FIELDS) {
      if (left[i][key] !== right[i][key]) return false;
    }
  }
  return true;
}

/**
 * Суммирует `totalDebt` по всем строкам, приводя нечисловые/отсутствующие значения к нулю.
 *
 * @param {Array<object>|null|undefined} rows - строки черновика
 * @returns {number} суммарный долг; 0, если `rows` не массив или пуст
 */
export function sumTotalDebt(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((acc, row) => acc + (Number(row?.totalDebt) || 0), 0);
}
