// Массовая простановка скидки на проживание: одно действие проставляет
// accommodationDiscount гостям выбранной зоны отчёта (спека 2026-09-08).
//
// Цель патча — гость отчёта в терминах, нужных зонам:
//   { index, fullName, category: "ADULT"|"CHILD"|"INFANT", roomNumber: string,
//     placementKind: number|null, applicable: boolean }
// Категорию нормализует вызывающий (normalizeCategory) — здесь сравнение строгое.

export const DISCOUNT_ZONES = [
  { value: "all", label: "Всем" },
  { value: "single", label: "Только одноместное" },
  { value: "double", label: "Только двухместное" },
  { value: "custom", label: "Индивидуально" },
];

const clampPercent = (v) => Math.min(100, Math.max(0, Number(v) || 0));

// Состав зоны БЕЗ учёта applicable: счётчики в подписях называют людей в зоне,
// а не строки, которые примут скидку. Гость без номера (placementKind === null)
// попадает только в «Всем» и «Индивидуально» — вида размещения у него нет.
export function zoneMembers(targets, zone, selectedIndices = []) {
  const list = Array.isArray(targets) ? targets : [];
  if (zone === "single") return list.filter((t) => t.placementKind === 1);
  if (zone === "double") return list.filter((t) => t.placementKind === 2);
  if (zone === "custom") {
    const picked = new Set(selectedIndices);
    return list.filter((t) => picked.has(t.index));
  }
  return list.slice();
}

// Патч { [index]: number|null }: null возвращает гостя к скидке по умолчанию его
// категории, число 0–100 — ручной процент (явный 0 — «скидки нет», не «авто»).
// Отмеченные категорийные пункты приоритетнее «своей скидки»: она ложится на всех
// остальных в зоне, включая детей и инфантов без галочки (решение владельца §3.1).
// Гости с неактивной ячейкой «Скидка» в патч не попадают — иначе в базу ушёл бы
// процент, которого не видно на экране.
export function buildDiscountPatch({
  targets,
  zone,
  selectedIndices = [],
  presets = {},
  custom = {},
}) {
  const patch = {};
  const hasCustom = !!custom.on && custom.value !== "" && custom.value != null;
  zoneMembers(targets, zone, selectedIndices).forEach((t) => {
    if (!t.applicable) return;
    if (t.category === "INFANT" && presets.infant) {
      patch[t.index] = null;
      return;
    }
    if (t.category === "CHILD" && presets.child) {
      patch[t.index] = null;
      return;
    }
    if (hasCustom) patch[t.index] = clampPercent(custom.value);
  });
  return patch;
}
