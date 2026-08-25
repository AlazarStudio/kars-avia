export const PARTIAL_DAY_DEFAULTS = {
  arrivalFullBefore: "06:00",
  arrivalHalfBefore: "14:00",
  departureHalfAfter: "12:00",
  departureFullAfter: "18:00",
  arrivalFullDays: 1,
  arrivalHalfDays: 0.5,
  departureHalfDays: 0.5,
  departureFullDays: 1,
};

export const RULE_TIME_FIELDS = [
  "arrivalFullBefore",
  "arrivalHalfBefore",
  "departureHalfAfter",
  "departureFullAfter",
];

export const RULE_DAY_FIELDS = [
  "arrivalFullDays",
  "arrivalHalfDays",
  "departureHalfDays",
  "departureFullDays",
];

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Разбирает строку времени "HH:mm" в минуты от начала суток.
 * Возвращает null для пустого значения или невалидного формата.
 *
 * @param {string} value - время в формате "HH:mm"
 * @returns {number|null} минуты от 00:00 или null
 */
export function parseHhMm(value) {
  const match = String(value ?? "").trim().match(HHMM);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Строит форму настроек частичных суток из настройки бэка,
 * подставляя дефолты для отсутствующих/null-полей.
 *
 * @param {object|null|undefined} setting - настройка (ReportPartialDaySetting) или её отсутствие
 * @returns {object} форма из 8 полей (4 времени + 4 коэффициента)
 */
export function toRulesForm(setting) {
  const form = {};
  for (const key of [...RULE_TIME_FIELDS, ...RULE_DAY_FIELDS]) {
    const value = setting?.[key];
    form[key] = value == null ? PARTIAL_DAY_DEFAULTS[key] : value;
  }
  return form;
}

/**
 * Валидирует форму настроек частичных суток: формат времени, обязательные
 * (пустая строка/null/undefined отклоняются) неотрицательные числовые
 * коэффициенты и порядок порогов (полный < половинный для заезда,
 * половинный < полный для выезда) — на бэке порядок не проверяется, и при
 * перепутанных порогах вторая ветка условия становится недостижимой.
 *
 * @param {object} form - форма настроек
 * @returns {{isValid: boolean, errors: object}} результат валидации
 */
export function validateRules(form) {
  const errors = {};

  for (const key of RULE_TIME_FIELDS) {
    if (parseHhMm(form?.[key]) == null) errors[key] = "Укажите время в формате ЧЧ:ММ";
  }

  for (const key of RULE_DAY_FIELDS) {
    const raw = form?.[key];
    if (raw === "" || raw == null) {
      errors[key] = "Введите число";
      continue;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) errors[key] = "Введите число";
    else if (value < 0) errors[key] = "Не может быть отрицательным";
  }

  const arrivalFull = parseHhMm(form?.arrivalFullBefore);
  const arrivalHalf = parseHhMm(form?.arrivalHalfBefore);
  if (arrivalFull != null && arrivalHalf != null && arrivalFull >= arrivalHalf) {
    errors.arrivalHalfBefore = "Должно быть позже порога полных суток";
  }

  const departureHalf = parseHhMm(form?.departureHalfAfter);
  const departureFull = parseHhMm(form?.departureFullAfter);
  if (departureHalf != null && departureFull != null && departureHalf >= departureFull) {
    errors.departureFullAfter = "Должно быть позже порога половины суток";
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

/**
 * Сравнивает текущую форму с исходной: время — по строке, коэффициенты —
 * по числовому значению (чтобы "1" и 1 не считались изменением), а два
 * значения, оба не приводящиеся к числу (NaN), считаются равными между
 * собой, а не различием.
 *
 * @param {object} form - текущая форма
 * @param {object} initial - исходная форма (baseline)
 * @returns {boolean} true, если есть содержательные отличия
 */
export function rulesChanged(form, initial) {
  for (const key of RULE_TIME_FIELDS) {
    if (String(form?.[key] ?? "") !== String(initial?.[key] ?? "")) return true;
  }
  for (const key of RULE_DAY_FIELDS) {
    const a = Number(form?.[key]);
    const b = Number(initial?.[key]);
    if (Number.isNaN(a) && Number.isNaN(b)) continue;
    if (a !== b) return true;
  }
  return false;
}

/**
 * Конвертирует форму в payload для upsert-мутации: уровень и id сущности
 * для не-общих уровней, времена как есть, коэффициенты приведены к числу.
 * `id` записи не отправляется никогда: дедупликация на бэке работает только
 * на пути без id, а путь с id может наплодить дубликаты записей уровня.
 * Для не-общих уровней вызывающий обязан передать entityId — без него
 * в payload уйдёт явный null.
 *
 * @param {object} form - форма настроек
 * @param {string} [level] - "GLOBAL" | "AIRLINE" | "HOTEL"
 * @param {string|null} [entityId] - id авиакомпании (AIRLINE) или гостиницы (HOTEL)
 * @returns {object} payload для GraphQL-мутации
 */
export function toUpsertInput(form, level = "GLOBAL", entityId = null) {
  const input = { level };
  if (level === "AIRLINE") input.airlineId = entityId;
  if (level === "HOTEL") input.hotelId = entityId;
  for (const key of RULE_TIME_FIELDS) input[key] = form[key];
  for (const key of RULE_DAY_FIELDS) input[key] = Number(form[key]);
  return input;
}

/**
 * Выбирает запись настроек по уровню и сущности. Порядок массива не важен:
 * бэк сортирует уровни по алфавиту строки enum (AIRLINE < GLOBAL < HOTEL),
 * поэтому глобальная запись в нефильтрованном ответе не обязательно первая —
 * выбирать по индексу нельзя.
 *
 * @param {Array<object>|null|undefined} settings - записи ReportPartialDaySetting
 * @param {string} level - "GLOBAL" | "AIRLINE" | "HOTEL"
 * @param {string|null} [entityId] - id сущности для не-GLOBAL уровней
 * @returns {object|null} запись или null
 */
export function pickSetting(settings, level, entityId = null) {
  const list = Array.isArray(settings) ? settings : [];
  if (level === "GLOBAL") {
    return list.find((s) => s?.level === "GLOBAL") || null;
  }
  if (!entityId) return null;
  if (level === "AIRLINE") {
    return list.find((s) => s?.level === "AIRLINE" && s?.airlineId === entityId) || null;
  }
  if (level === "HOTEL") {
    return list.find((s) => s?.level === "HOTEL" && s?.hotelId === entityId) || null;
  }
  return null;
}

/**
 * Возвращает правила частичных суток, действующие для конкретного черновика:
 * общая настройка, накрытая переопределением по авиакомпании (для отчёта АК)
 * или по гостинице (для отчёта гостиницы).
 *
 * Это зеркало бэкового `resolvePartialDayRules`
 * (`services/report/partialDaySettings.js:75`) — правится парой с ним, иначе
 * экран разойдётся с расчётом: диспетчер увидит подсветку по одному порогу,
 * а сутки будут посчитаны по другому.
 *
 * Мёрдж идёт целой записью, а не отдельными полями: все восемь полей правил в
 * БД non-null с дефолтами (`prisma/schema.prisma:1469-1476`), поэтому
 * переопределение всегда заменяет все восемь — «частичного» override не бывает.
 * Поля правил из записи достаёт `toRulesForm`, так что `id`, `level`,
 * `airlineId`, `hotel`, `__typename` в правила не протекают.
 *
 * @param {Array<object>|null|undefined} settings - записи ReportPartialDaySetting (все уровни)
 * @param {object|null|undefined} draft - черновик отчёта: `type`, `airlineId`, `hotelId`
 * @returns {object} правила из 8 полей
 */
export function resolveDraftPartialDayRules(settings, draft) {
  // Нечем накрывать (нет настроек) — работаем по общим дефолтам, как до
  // появления настроек.
  if (!Array.isArray(settings) || settings.length === 0) {
    return { ...PARTIAL_DAY_DEFAULTS };
  }

  let rules = toRulesForm(pickSetting(settings, "GLOBAL"));

  // Без черновика (неизвестен тип отчёта и сущность) накрывать переопределением
  // нечем — но общая настройка действует и тут: это и есть «общие правила».
  if (!draft) return rules;

  // `else if`, как на бэке: у черновика АК может быть заполнен и hotelId,
  // но переопределение по гостинице в отчёте АК не участвует.
  let override = null;
  if (draft.type === "AIRLINE" && draft.airlineId) {
    override = pickSetting(settings, "AIRLINE", draft.airlineId);
  } else if (draft.type === "HOTEL" && draft.hotelId) {
    override = pickSetting(settings, "HOTEL", draft.hotelId);
  }
  if (override) rules = { ...rules, ...toRulesForm(override) };

  return rules;
}
