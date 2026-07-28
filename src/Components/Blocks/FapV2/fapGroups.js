// Группы пассажиров: конфиг типов, индекс personId→группа, палитра, roomKey.
// Данные групп живут на заявке (request.passengerGroups); legacy-заявки → [].

import { canonicalSurname, familyLabel } from "../../../utils/surnameForms.js";

export const GROUP_KIND_CONFIG = {
  FAMILY: { label: "Семья", defaultLevel: "ROOM" },
  ESCORT: { label: "Сопровождение", defaultLevel: "ROOM" },
  COLLEAGUES: { label: "Коллеги", defaultLevel: "HOTEL" },
  GROUP: { label: "Орг. группа", defaultLevel: "HOTEL" },
  OTHER: { label: "Прочее", defaultLevel: "HOTEL" },
};

export const GROUP_KIND_OPTIONS = Object.entries(GROUP_KIND_CONFIG).map(
  ([value, cfg]) => ({ value, label: cfg.label })
);

// Эффективный уровень «вместе»: явный togetherLevel или дефолт типа.
export const groupTogetherLevel = (group) =>
  group?.togetherLevel || GROUP_KIND_CONFIG[group?.kind]?.defaultLevel || "HOTEL";

export const requestGroups = (request) => request?.passengerGroups ?? [];

// Map personId → group (один человек — одна группа, инвариант бэка).
export const buildGroupIndex = (request) => {
  const map = new Map();
  requestGroups(request).forEach((g) => {
    (g.memberPersonIds ?? []).forEach((pid) => map.set(pid, g));
  });
  return map;
};

// Порядковый номер группы в заявке — нужен для стабильного цвета-фолбэка.
export const groupOrder = (request) => {
  const map = new Map();
  requestGroups(request).forEach((g, i) => map.set(g.groupId, i));
  return map;
};

// Следующий незанятый цвет палитры (не hash — 9 цветов коллизируют).
export const GROUP_PALETTE = [
  "#0057C3",
  "#80BD3B",
  "#0E7BC1",
  "#D62027",
  "#003D7A",
  "#E5A11D",
  "#C8102E",
  "#7C3AED",
  "#10B981",
];

export const nextGroupColor = (groups) => {
  const used = new Set((groups ?? []).map((g) => g.color).filter(Boolean));
  return (
    GROUP_PALETTE.find((c) => !used.has(c)) ??
    GROUP_PALETTE[(groups ?? []).length % GROUP_PALETTE.length]
  );
};

export const groupColor = (group, index = 0) =>
  group?.color || GROUP_PALETTE[index % GROUP_PALETTE.length];

// Подпись по умолчанию: мажоритарная фамилия семьи (муж/жен формы считаются
// одной фамилией) русским плюралом («Алексеевы») или «Группа N».
export const defaultGroupLabel = (members, ordinal) => {
  const counts = new Map();
  (members ?? []).forEach((m) => {
    const token = (m?.fullName ?? "").trim().split(/\s+/)[0];
    if (!token) return;
    const key = canonicalSurname(token);
    const entry = counts.get(key) || { count: 0, sample: token };
    entry.count += 1;
    counts.set(key, entry);
  });
  const top = [...counts.values()].sort((a, b) => b.count - a.count)[0];
  if (top && top.count >= 2) return familyLabel(top.sample);
  return `Группа ${ordinal}`;
};

// Название группы для показа: подпись или подпись типа.
export const groupDisplayLabel = (group) =>
  group?.label || GROUP_KIND_CONFIG[group?.kind]?.label || "Группа";

export const PLACEMENT_REQUIREMENT_OPTIONS = [
  { value: "", label: "—" },
  { value: 1, label: "1-местное" },
  { value: 2, label: "2-местное" },
];

export const placementRequirementLabel = (n) =>
  Number.isInteger(n) && n >= 1 ? `${n}-местн` : "";

// ЕДИНЫЙ ключ номера — та же семантика, что группировка отчёта (trim, БЕЗ lowercase).
export const roomKey = (v) => (v ?? "").toString().trim();
