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
 * Предельный размер тела запроса, который принимает бэк, в байтах.
 *
 * Зеркалит `JSON_BODY_LIMIT` из `services/infra/httpLimits.js` бэкенда — там
 * стоит `"2mb"`, то есть ровно эти 2 * 1024 * 1024. Числа обязаны меняться
 * парой: занизишь здесь — фронт откажется отправлять то, что бэк принял бы;
 * завысишь — вернётся молчаливое «Failed to fetch» без объяснения.
 *
 * Проверено зондами по дев-серверу 10.08.2026: тело 1 499 990 Б доходит и
 * получает ответ, 2 099 990 Б обрывается без ответа и без CORS-заголовков.
 * В этом и суть замера: при переполнении у Apollo нет ни `graphQLErrors`, ни
 * статуса, и причину из самой ошибки достать нельзя.
 */
export const SAVE_PAYLOAD_LIMIT_BYTES = 2 * 1024 * 1024;

/**
 * Считает, сколько байт займут строки черновика в теле мутации сохранения, и
 * сколько таких строк вообще влезает в лимит.
 *
 * Размер меряется в UTF-8, а не длиной строки: фамилии, названия номеров и
 * гостиниц кириллические, и `String.length` занизил бы результат примерно
 * вдвое на каждом таком символе.
 *
 * `maxRows` считается из фактического среднего веса строки, а не задаётся
 * числом: строки разных отчётов весят по-разному (длина ФИО, названия
 * гостиницы, примечания о подселении), и любая константа врала бы на части
 * черновиков. Это единственное число из замера, которое показывается
 * пользователю — байты и лимит остаются для консоли.
 *
 * Учитываются только сами строки, без текста мутации и `id` — те добавляют
 * несколько сотен байт и на вывод «влезает / не влезает» не влияют.
 *
 * @param {Array<object>|null|undefined} rows - строки черновика
 * @returns {{bytes: number, limit: number, exceeds: boolean, rowCount: number, maxRows: number}}
 */
export function measureSavePayload(rows) {
  const list = prepareRowsForSave(rows);
  const bytes = new TextEncoder().encode(JSON.stringify(list)).length;
  const perRow = list.length > 0 ? bytes / list.length : 0;
  return {
    bytes,
    limit: SAVE_PAYLOAD_LIMIT_BYTES,
    exceeds: bytes > SAVE_PAYLOAD_LIMIT_BYTES,
    rowCount: list.length,
    maxRows: perRow > 0 ? Math.floor(SAVE_PAYLOAD_LIMIT_BYTES / perRow) : 0,
  };
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

/**
 * Собирает группы совместного проживания по `shareClusterId`.
 *
 * Бэк ставит одинаковый `shareClusterId` жильцам одного номера с пересечением
 * периодов. Группы из одной строки отбрасываются: человек жил один, связывать
 * не с кем, а бейдж у каждой второй строки был бы шумом.
 *
 * Номера групп выдаются по порядку первого появления в списке — то есть в
 * порядке реестра. Строки при этом не переставляются: их порядок и `index`
 * контрактны, по ним печатается файл.
 *
 * @param {Array<object>|null|undefined} rows - строки черновика (с `_uid`)
 * @returns {Map<string, {number: number, uids: Array<number>}>} только группы из 2+ строк
 */
export function buildShareClusters(rows) {
  const byCluster = new Map();
  if (!Array.isArray(rows)) return byCluster;

  for (const row of rows) {
    const id = row?.shareClusterId;
    if (!id) continue;
    if (!byCluster.has(id)) byCluster.set(id, []);
    byCluster.get(id).push(row._uid);
  }

  const clusters = new Map();
  let number = 0;
  for (const [id, uids] of byCluster) {
    if (uids.length < 2) continue;
    number += 1;
    clusters.set(id, { number, uids });
  }
  return clusters;
}

/**
 * Считает, какие гостиницы вошли в отчёт и сколько в каждой строк.
 *
 * Отчёт по авиакомпании собирается по всем гостиницам аэропорта сразу — на
 * живом черновике их девять, — поэтому «какая гостиница в отчёте» без такой
 * сводки не ответить: в строке видна одна, а в файле их десяток.
 *
 * @param {Array<object>|null|undefined} rows - строки черновика
 * @returns {Array<{name: string, count: number}>} по убыванию числа строк
 */
export function summarizeHotels(rows) {
  if (!Array.isArray(rows)) return [];
  const counts = new Map();
  for (const row of rows) {
    const name = (row?.hotelName || "").trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ru"));
}

/**
 * Достаёт итоговые суммы из строки «ИТОГО» предпросмотра (`presentation`).
 *
 * Берётся `raw` («1459450»), а не `value` («1 459 450,00»): value — уже
 * отформатированная под Excel строка с неразрывными пробелами и запятой,
 * парсить её обратно в число значит воспроизводить форматирование бэка
 * задом наперёд.
 *
 * @param {object|null|undefined} totalsRow - `presentation.totalsRow`
 * @returns {{meal: number, living: number, debt: number}|null} null, если строки нет
 */
export function readPrintedTotals(totalsRow) {
  const cells = totalsRow?.cells;
  if (!Array.isArray(cells)) return null;
  const pick = (key) => {
    const cell = cells.find((c) => c?.key === key);
    const value = Number(cell?.raw);
    return Number.isFinite(value) ? value : 0;
  };
  return {
    meal: pick("totalMealCost"),
    living: pick("totalLivingCost"),
    debt: pick("totalDebt"),
  };
}

/**
 * Сходятся ли итог на экране и итог, который уйдёт в файл.
 *
 * Сравнение в копейках: суммы складываются из дробных сотых долей суток,
 * поэтому прямое сравнение double даёт ложные расхождения в 1e-10.
 *
 * @param {number} localTotal - итог, посчитанный в редакторе
 * @param {number} printedTotal - итог из `presentation.totalsRow`
 * @returns {{matches: boolean, diff: number}} diff = экран − файл, в рублях
 */
export function compareWithPrintedTotal(localTotal, printedTotal) {
  const local = Math.round((Number(localTotal) || 0) * 100);
  const printed = Math.round((Number(printedTotal) || 0) * 100);
  return { matches: local === printed, diff: (local - printed) / 100 };
}
