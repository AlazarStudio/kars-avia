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
 * Строка дат черновика "DD.MM.YYYY HH:MM[:SS]" → значение для
 * `input[type=datetime-local]` ("YYYY-MM-DDTHH:mm"). Пустое/неразобранное — "".
 */
export function reportDateToInputValue(value) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/.exec(value || "");
  return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}` : "";
}

/**
 * Обратно: значение datetime-local → строка контракта черновика.
 * Секунды дописываются нулями — бэк отдаёт даты с ":SS", и без них строка,
 * совпадающая по сути, считалась бы правкой. Пустой ввод — "".
 */
export function inputValueToReportDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || "");
  return m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}:00` : "";
}

/**
 * Типы сортируемых колонок таблицы черновика (№58). Ключи — поля строки;
 * «Фикс.», «№», «Вид проживания» и корзина не сортируются намеренно:
 * № — это порядок файла (к нему возвращает третий клик), вид проживания —
 * структурный текст без полезного порядка.
 */
export const DRAFT_SORT_TYPES = {
  personName: "string",
  arrival: "date",
  departure: "date",
  totalDays: "number",
  category: "string",
  roomName: "string",
  personPosition: "string",
  breakfastCount: "number",
  lunchCount: "number",
  dinnerCount: "number",
  totalMealCost: "number",
  pricePerDay: "number",
  totalLivingCost: "number",
  totalDebt: "number",
  hotelName: "string",
};

/**
 * ВИЗУАЛЬНАЯ сортировка строк черновика по колонке. Порядок в массиве rows
 * и `index` не трогаются — они контрактные, по ним печатается файл;
 * сортируется только представление на экране.
 *
 * Даты сравниваются через reportDateToInputValue: "YYYY-MM-DDTHH:mm"
 * сортируется обычным сравнением строк, парсер не нужен. Строки — по-русски
 * (localeCompare ru), числа — числом (пустое считается нулём). Сравнение
 * стабильное: равные значения остаются в порядке файла.
 *
 * @param {Array<object>} rows - строки к показу
 * @param {string} key - поле из DRAFT_SORT_TYPES
 * @param {"asc"|"desc"} dir - направление
 * @returns {Array<object>} новый отсортированный массив
 */
export function sortDraftRows(rows, key, dir) {
  const type = DRAFT_SORT_TYPES[key];
  if (!Array.isArray(rows) || !type) return Array.isArray(rows) ? rows : [];
  const sign = dir === "desc" ? -1 : 1;
  const value = (row) => {
    const raw = row?.[key];
    if (type === "number") return Number(raw) || 0;
    if (type === "date") return reportDateToInputValue(raw);
    return String(raw ?? "");
  };
  return [...rows].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (type === "number") return sign * (va - vb);
    return sign * String(va).localeCompare(String(vb), "ru");
  });
}

// Разбор строки контракта "DD.MM.YYYY HH:MM[:SS]" в компоненты — для расчёта
// суток. Не через new Date(строка): формат не ISO, а руками — надёжнее.
function parseReportDateParts(value) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/.exec(value || "");
  if (!m) return null;
  return { d: +m[1], mo: +m[2], y: +m[3], hh: +m[4], mm: +m[5] };
}

/**
 * Сутки проживания по правилам частичных суток — ЗЕРКАЛО бэковой
 * calcTotalDays (services/report/reportUtils.js): базовые календарные дни
 * между датами + надбавка за ранний заезд (до arrivalFullBefore — полные,
 * до arrivalHalfBefore — половина) + за поздний выезд (после
 * departureFullAfter — полные, после departureHalfAfter — половина).
 * Сентинели бэка сохранены: заезд ровно в 00:10 — без надбавки, выезд
 * ровно в 23:50 — полный день. Менять только парой с бэком.
 *
 * @param {string} arrivalStr - "DD.MM.YYYY HH:MM[:SS]"
 * @param {string} departureStr - то же
 * @param {object|null} rules - правила (PARTIAL_DAY_DEFAULTS-совместимые)
 * @returns {number|null} сутки (кратно 0.5) или null, если даты не разобрать
 */
export function computeStayDays(arrivalStr, departureStr, rules) {
  const a = parseReportDateParts(arrivalStr);
  const b = parseReportDateParts(departureStr);
  if (!a || !b) return null;

  const MS_PER_DAY = 86400000;
  const baseDays = Math.max(
    0,
    Math.floor((Date.UTC(b.y, b.mo - 1, b.d) - Date.UTC(a.y, a.mo - 1, a.d)) / MS_PER_DAY)
  );

  const r = { ...PARTIAL_DAY_DEFAULTS, ...(rules || {}) };
  const cfg = {
    arrivalFullBeforeMin: parseHhMm(r.arrivalFullBefore) ?? 6 * 60,
    arrivalHalfBeforeMin: parseHhMm(r.arrivalHalfBefore) ?? 14 * 60,
    departureHalfAfterMin: parseHhMm(r.departureHalfAfter) ?? 12 * 60,
    departureFullAfterMin: parseHhMm(r.departureFullAfter) ?? 18 * 60,
    arrivalFullDays: Number(r.arrivalFullDays) || 0,
    arrivalHalfDays: Number(r.arrivalHalfDays) || 0,
    departureHalfDays: Number(r.departureHalfDays) || 0,
    departureFullDays: Number(r.departureFullDays) || 0,
  };

  let arrivalAdjust = 0;
  const am = a.hh * 60 + a.mm;
  if (a.hh === 0 && a.mm === 10) arrivalAdjust = 0;
  else if (am < cfg.arrivalFullBeforeMin) arrivalAdjust = cfg.arrivalFullDays;
  else if (am < cfg.arrivalHalfBeforeMin) arrivalAdjust = cfg.arrivalHalfDays;

  let departureAdjust = 0;
  const dm = b.hh * 60 + b.mm;
  if (b.hh === 23 && b.mm === 50) departureAdjust = cfg.departureFullDays;
  else if (dm >= cfg.departureFullAfterMin) departureAdjust = cfg.departureFullDays;
  else if (dm > cfg.departureHalfAfterMin) departureAdjust = cfg.departureHalfDays;

  const total = baseDays + arrivalAdjust + departureAdjust;
  return total < 0 ? 0 : total;
}

// Платные приёмы пищи строки: завтрак «вкл» входит в цену номера и в деньгах
// питания не участвует.
function paidMealsCount(row, counts) {
  const c = counts || row;
  const breakfast = row?.breakfastIncludedInPrice ? 0 : Number(c.breakfastCount) || 0;
  return breakfast + (Number(c.lunchCount) || 0) + (Number(c.dinnerCount) || 0);
}

/**
 * Патч строки при смене даты заезда/выезда: пересчитываются сутки (по
 * правилам частичных суток), счётчики питания (пропорция «приёмов на сутки»
 * из текущей строки), стоимость питания (по средней цене платного приёма),
 * стоимость проживания (сутки × цена) и итог.
 *
 * Средняя цена приёма — осознанное приближение: в строке черновика нет цен
 * завтрака/обеда/ужина по отдельности, есть только их сумма. Если платных
 * приёмов не было, стоимость питания не трогается (калибровать нечем).
 *
 * @param {object} row - текущая строка
 * @param {"arrival"|"departure"} field - какое поле меняется
 * @param {string} value - новое значение "DD.MM.YYYY HH:MM:SS"
 * @param {object|null} rules - правила частичных суток
 * @returns {object} патч полей строки
 */
export function applyDateChange(row, field, value, rules) {
  const patch = { [field]: value ?? "" };
  const arrival = field === "arrival" ? value : row?.arrival;
  const departure = field === "departure" ? value : row?.departure;
  const newDays = computeStayDays(arrival, departure, rules);
  if (newDays == null) return patch; // дата не разобрана — только само поле

  patch.totalDays = newDays;

  const oldDays = Number(row?.totalDays) || 0;
  if (oldDays > 0) {
    // Приёмы пищи привязаны к суткам: масштабируем по норме «на сутки».
    const scale = (n) => Math.round(((Number(n) || 0) / oldDays) * newDays);
    const nextCounts = {
      breakfastCount: scale(row?.breakfastCount),
      lunchCount: scale(row?.lunchCount),
      dinnerCount: scale(row?.dinnerCount),
    };
    const paidOld = paidMealsCount(row);
    if (paidOld > 0) {
      const meanPrice = (Number(row?.totalMealCost) || 0) / paidOld;
      patch.totalMealCost = Math.round(meanPrice * paidMealsCount(row, nextCounts));
    }
    Object.assign(patch, nextCounts);
  }

  const price = Number(row?.pricePerDay) || 0;
  patch.totalLivingCost = Math.round(newDays * price);
  patch.totalDebt =
    patch.totalLivingCost +
    (patch.totalMealCost != null ? patch.totalMealCost : Number(row?.totalMealCost) || 0);
  return patch;
}

/**
 * Патч строки при ручной правке счётчика питания (завтрак/обед/ужин):
 * стоимость питания пересчитывается по средней цене платного приёма из
 * текущей строки, итог — следом. Если платных приёмов не было, стоимость
 * не трогается: среднюю цену взять неоткуда.
 *
 * @param {object} row - текущая строка
 * @param {"breakfastCount"|"lunchCount"|"dinnerCount"} field
 * @param {string|number|null} rawValue - значение из инпута
 * @returns {object} патч полей строки
 */
export function applyMealCountChange(row, field, rawValue) {
  const value =
    rawValue === "" || rawValue === null || rawValue === undefined
      ? null
      : Math.round(Number(rawValue));
  const patch = { [field]: value };

  const paidOld = paidMealsCount(row);
  if (paidOld > 0) {
    const meanPrice = (Number(row?.totalMealCost) || 0) / paidOld;
    const paidNew = paidMealsCount(row, { ...row, [field]: value });
    patch.totalMealCost = Math.round(meanPrice * paidNew);
    patch.totalDebt = (Number(row?.totalLivingCost) || 0) + patch.totalMealCost;
  }
  return patch;
}

// Ключ «одна комната одной гостиницы» — первый признак соседства. Пустая
// комната ключа не даёт: безымянные не группируются.
export function roomKeyOf(row) {
  const room = String(row?.roomName ?? "").trim();
  if (!room) return null;
  return `${String(row?.hotelName ?? "").trim()}|${room}`;
}

// Интервал проживания строки в миллисекундах; null — даты не разобрать
// (такая строка ни с кем не кластеризуется).
function stayIntervalOf(row) {
  const a = parseReportDateParts(row?.arrival);
  const b = parseReportDateParts(row?.departure);
  if (!a || !b) return null;
  return {
    start: Date.UTC(a.y, a.mo - 1, a.d, a.hh, a.mm),
    end: Date.UTC(b.y, b.mo - 1, b.d, b.hh, b.mm),
  };
}

/**
 * Кластеры «живут вместе» по ТЕКУЩЕМУ состоянию строк: одна комната одной
 * гостиницы И пересечение периодов проживания — транзитивно, как в бэковом
 * findOverlapClusters (reportUtils.js: заезд < чужой_выезд && выезд >
 * чужой_заезд). Одно лишь совпадение номера соседством НЕ считается:
 * в одну комнату могли заехать в разные даты.
 *
 * @param {Array<object>} rows - строки (с _uid)
 * @returns {Array<Array<object>>} кластеры из 2+ строк, члены — в порядке rows
 */
export function buildRoomClusters(rows) {
  const byKey = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row, i) => {
    const key = roomKeyOf(row);
    if (!key) return;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push({ row, i, interval: stayIntervalOf(row) });
  });

  const clusters = [];
  for (const guests of byKey.values()) {
    const assigned = new Set();
    for (let i = 0; i < guests.length; i++) {
      if (assigned.has(i) || !guests[i].interval) continue;
      const cluster = [i];
      assigned.add(i);
      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 0; j < guests.length; j++) {
          if (assigned.has(j) || !guests[j].interval) continue;
          const cand = guests[j].interval;
          const overlaps = cluster.some((idx) => {
            const g = guests[idx].interval;
            return g.start < cand.end && g.end > cand.start;
          });
          if (overlaps) {
            cluster.push(j);
            assigned.add(j);
            changed = true;
          }
        }
      }
      if (cluster.length > 1) {
        clusters.push(
          cluster
            .map((idx) => guests[idx])
            .sort((a, b) => a.i - b.i)
            .map((g) => g.row)
        );
      }
    }
  }
  return clusters;
}

/**
 * Порядок показа «живущие вместе — друг под другом»: строки идут в порядке
 * файла, но члены одного кластера (комната + пересечение дат) подтягиваются
 * к его первому вхождению. Одиночные строки и совпадения номера без
 * пересечения дат не двигаются. Порядок в массиве rows и index не трогаются
 * (контрактны) — это только представление.
 *
 * @param {Array<object>} rows - строки к показу
 * @returns {Array<object>} новый массив в кластерном порядке
 */
export function groupRowsByRoom(rows) {
  if (!Array.isArray(rows)) return [];
  const clusterByUid = new Map();
  for (const cluster of buildRoomClusters(rows)) {
    for (const row of cluster) clusterByUid.set(row._uid, cluster);
  }
  const emitted = new Set();
  const out = [];
  for (const row of rows) {
    if (emitted.has(row._uid)) continue;
    const cluster = clusterByUid.get(row._uid);
    if (cluster) {
      for (const mate of cluster) {
        if (!emitted.has(mate._uid)) {
          emitted.add(mate._uid);
          out.push(mate);
        }
      }
    } else {
      emitted.add(row._uid);
      out.push(row);
    }
  }
  return out;
}

/**
 * Фамилии соседей для каждой строки — по ТЕКУЩЕМУ состоянию строк (а не по
 * серверным shareSegments): после ручной смены комнаты или дат сервер о
 * новом соседстве ещё не знает. Сосед = тот же кластер (комната +
 * пересечение периодов).
 *
 * @param {Array<object>} rows - ВСЕ строки черновика (не отфильтрованные)
 * @returns {Map<number, string[]>} _uid → фамилии соседей (без себя)
 */
export function buildRoomMates(rows) {
  const out = new Map();
  for (const cluster of buildRoomClusters(rows)) {
    for (const row of cluster) {
      out.set(
        row._uid,
        cluster.filter((r) => r._uid !== row._uid).map((r) => r.personName || "без имени")
      );
    }
  }
  return out;
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
