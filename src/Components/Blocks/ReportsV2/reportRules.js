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
 * Конвертирует форму в payload для upsert-мутации: уровень GLOBAL,
 * времена как есть, коэффициенты приведены к числу.
 *
 * @param {object} form - форма настроек
 * @returns {object} payload для GraphQL-мутации
 */
export function toUpsertInput(form) {
  const input = { level: "GLOBAL" };
  for (const key of RULE_TIME_FIELDS) input[key] = form[key];
  for (const key of RULE_DAY_FIELDS) input[key] = Number(form[key]);
  return input;
}
