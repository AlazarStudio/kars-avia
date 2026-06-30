import { generateTimestampId } from "../../../../graphQL_requests";

// Фиксированный порядок и метки аудиторий/секций.
export const AUDIENCE_ORDER = ["AIRLINE", "DISPATCHER", "HOTEL"];

export const AUDIENCE_LABELS = {
  AIRLINE: "АК",
  DISPATCHER: "Диспетчеры",
  HOTEL: "Отели",
};

// Порядок секций фиксирован: new → updates → fixes.
export const SECTION_KEYS = ["new", "updates", "fixes"];

export const SECTION_LABELS = {
  new: "Новое",
  updates: "Обновления",
  fixes: "Исправления",
};

export const SECTION_COLORS = {
  new: "#16a34a",
  updates: "#2563eb",
  fixes: "#ea580c",
};

// Бейджи типов в плоском списке модалки (дизайн v3): краткая метка + цвет + фон.
export const TYPE_BADGES = {
  new: { label: "new", color: "#2E9B5B", bg: "rgba(46,155,91,0.08)" },
  updates: { label: "upd", color: "#0057C3", bg: "rgba(0,87,195,0.07)" },
  fixes: { label: "fix", color: "#E67E22", bg: "rgba(230,126,34,0.08)" },
};

// Метки фильтра-категорий — те же термины, что и в редакторе (SECTION_LABELS) + «Всё».
export const FILTER_LABELS = {
  all: "Всё",
  ...SECTION_LABELS,
};

// Разворачивает секции одной аудитории в плоский список с типом каждого пункта
// (порядок new → updates → fixes).
export function flattenSections(sections) {
  const out = [];
  SECTION_KEYS.forEach((key) => {
    (sections?.[key] || []).forEach((it) => out.push({ ...it, type: key }));
  });
  return out;
}

const emptySections = () => ({ new: [], updates: [], fixes: [] });

// Превращает массив audiences с бэка в объект-стейт для редактора,
// добавляя локальный _key каждому пункту (для React-списков).
// Отсутствующие аудитории/секции → пустые массивы.
export function audiencesArrayToState(audiences) {
  const state = {
    AIRLINE: emptySections(),
    DISPATCHER: emptySections(),
    HOTEL: emptySections(),
  };
  (audiences || []).forEach((block) => {
    if (!block || !state[block.audience]) return;
    SECTION_KEYS.forEach((key) => {
      const items = block.sections?.[key] || [];
      state[block.audience][key] = items.map((it) => ({
        _key: generateTimestampId(),
        title: it.title || "",
        description: it.description || "",
      }));
    });
  });
  return state;
}

// Один пункт секции в формате стейта.
export const makeItem = () => ({
  _key: generateTimestampId(),
  title: "",
  description: "",
});

// Стейт редактора → массив из 3 аудиторий для мутации.
// Тримит поля, выкидывает пункты с пустым title, description пустой → null.
export function stateToAudiencesArray(state) {
  return AUDIENCE_ORDER.map((audience) => {
    const sections = {};
    SECTION_KEYS.forEach((key) => {
      sections[key] = (state[audience]?.[key] || [])
        .map((it) => ({
          title: (it.title || "").trim(),
          description: (it.description || "").trim() || null,
        }))
        .filter((it) => it.title);
    });
    return { audience, sections };
  });
}

// Кол-во непустых пунктов суммарно (для валидации «≥1 пункт»).
export function countItems(audiencesArray) {
  return audiencesArray.reduce(
    (sum, block) =>
      sum +
      SECTION_KEYS.reduce((s, key) => s + (block.sections[key]?.length || 0), 0),
    0
  );
}
