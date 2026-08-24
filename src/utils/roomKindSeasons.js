/**
 * Сезонные цены категории номера: чистые функции формата и пересечений.
 *
 * Границы сезона ВКЛЮЧИТЕЛЬНЫЕ и сравниваются по календарным суткам —
 * зеркало бэковых assertNoSeasonOverlap / seasonsOverlap.
 * Сравнение периодов строковое, в формате YYYY-MM-DD (лексикографический
 * порядок совпадает с хронологическим) — в самом сравнении Date не участвует,
 * чтобы не поймать сдвиг часового пояса. Date используется только при разборе
 * нестандартных входных форматов (DD.MM.YYYY и произвольные ISO-строки): там
 * нужен round-trip через Date.UTC, чтобы отсечь несуществующие даты вроде
 * 30 февраля.
 *
 * convertToDate из graphQL_requests.js здесь не переиспользован: модуль
 * остаётся без зависимостей, чтобы гоняться через node --test напрямую —
 * тот же довод записан в шапке src/utils/excelDate.js.
 */

/**
 * y/m/d → YYYY-MM-DD, но только если компоненты не переполнились при сборке
 * через Date.UTC (иначе, например, 2026-02-30 тихо стал бы 2026-03-02).
 * Несуществующая дата → null.
 */
const buildDateInputValue = (y, m, d) => {
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

/** YYYY-MM-DD → DD.MM.YYYY. Пусто → пустая строка. */
export const toDisplayDate = (value) => {
  const v = toDateInputValue(value);
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return `${d}.${m}.${y}`;
};

/** Период для показа: «01.09.2026 — 31.12.2026». Неполные данные → «—». */
export const formatSeasonRange = (start, end) => {
  const a = toDisplayDate(start);
  const b = toDisplayDate(end);
  if (!a || !b) return "—";
  return `${a} — ${b}`;
};

/** Пересекаются ли два периода. Границы включительные. */
export const seasonsOverlap = (aStart, aEnd, bStart, bEnd) => {
  const aS = toDateInputValue(aStart);
  const aE = toDateInputValue(aEnd);
  const bS = toDateInputValue(bStart);
  const bE = toDateInputValue(bEnd);
  if (!aS || !aE || !bS || !bE) return false;
  return aS <= bE && bS <= aE;
};

/**
 * Первый сезон из списка, пересекающийся с периодом, либо null.
 * excludeId — id правимого сезона: сам с собой он не конфликтует.
 * Сравнение через != null, а не truthy — иначе excludeId === 0 не исключал бы.
 */
export const findOverlappingSeason = (
  seasons,
  startDate,
  endDate,
  excludeId = null
) => {
  for (const season of seasons || []) {
    if (excludeId != null && String(season.id) === String(excludeId)) continue;
    if (seasonsOverlap(startDate, endDate, season.startDate, season.endDate)) {
      return season;
    }
  }
  return null;
};

/**
 * Цена: пусто → null, иначе число.
 * Нормализует пробелы (в т.ч. неразрывный, как разделитель разрядов) и
 * десятичную запятую — так пользователь чаще всего и наберёт цену.
 * Нечисловой остаток → NaN.
 */
const parsePrice = (raw) => {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (trimmed === "") return null;
  const normalized = trimmed.replace(/[\s\u00A0]/g, "").replace(",", ".");
  if (normalized === "") return null;
  return Number(normalized);
};

/**
 * Валидация формы сезона до отправки.
 *
 * Вместе с вердиктом возвращает нормализованные цены: числа для мутации берём
 * отсюда, а не парсим форму второй раз в компоненте — иначе «12 500,50» прошло
 * бы валидацию через parsePrice и уехало на сервер как NaN через Number().
 * values.priceForAirline === null означает «поле пустое»; отличать его от
 * «ключ не передан» обязано место вызова: под ролью гостиницы ключ
 * priceForAirline в input не кладётся вовсе, чтобы не затереть цену диспетчера.
 * При ok === false содержимое values не осмысленно.
 *
 * @returns {{ ok: boolean, errors: Record<string,string>, values: { price: number|null, priceForAirline: number|null } }}
 */
export const validateSeasonForm = (values, seasons = [], excludeId = null) => {
  const errors = {};
  const startDate = toDateInputValue(values?.startDate);
  const endDate = toDateInputValue(values?.endDate);

  if (!startDate) errors.startDate = "Укажите дату начала";
  if (!endDate) errors.endDate = "Укажите дату окончания";
  if (startDate && endDate && endDate < startDate) {
    errors.endDate = "Дата окончания раньше даты начала";
  }

  const price = parsePrice(values?.price);
  if (price === null) {
    errors.price = "Укажите цену";
  } else if (Number.isNaN(price)) {
    errors.price = "Введите число";
  } else if (!Number.isFinite(price) || price <= 0) {
    // Ноль в проекте значит «не заполнено», а бэк примет его как цену
    // и сделает ночи бесплатными — поэтому не пропускаем.
    errors.price = "Цена должна быть больше нуля";
  }

  const priceForAirline = parsePrice(values?.priceForAirline);
  if (priceForAirline !== null) {
    if (Number.isNaN(priceForAirline)) {
      errors.priceForAirline = "Введите число";
    } else if (!Number.isFinite(priceForAirline) || priceForAirline <= 0) {
      errors.priceForAirline = "Цена должна быть больше нуля";
    }
  }

  if (!errors.startDate && !errors.endDate) {
    const hit = findOverlappingSeason(seasons, startDate, endDate, excludeId);
    if (hit) {
      errors.startDate = `Период пересекается с сезоном ${formatSeasonRange(
        hit.startDate,
        hit.endDate
      )}`;
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: { price, priceForAirline },
  };
};
