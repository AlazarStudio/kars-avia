// Стадии и виды реестров услуг ФАП. Имена стадий — enum бэка
// PassengerServiceRegistryStage (services/passengerRequest/registryStage.js).

const STAGE_LABELS = {
  DRAFT: "Сформирован",
  SUBMITTED: "Отправлен АК",
  RETURNED: "Возвращён АК",
  APPROVED: "Утверждён АК",
};

export const REGISTRY_STAGE_ORDER = ["DRAFT", "SUBMITTED", "RETURNED", "APPROVED"];

export const REGISTRY_STAGE_OPTIONS = [
  { value: null, label: "Все стадии" },
  ...REGISTRY_STAGE_ORDER.map((value) => ({ value, label: STAGE_LABELS[value] })),
];

export function registryStageLabel(stage) {
  return STAGE_LABELS[stage] ?? stage;
}

// Дата отметки, которой стадия достигнута; у черновика — нет.
export function registryStageDate(registry) {
  switch (registry?.stage) {
    case "SUBMITTED":
      return registry.submittedAt ?? null;
    case "RETURNED":
      return registry.airlineCommentAt ?? null;
    case "APPROVED":
      return registry.airlineApprovedAt ?? null;
    default:
      return null;
  }
}

const KIND_LABELS = {
  BAGGAGE: "Доставка багажа",
  CATERING: "Вода и питание",
};

export const REGISTRY_KIND_OPTIONS = [
  { value: null, label: "Все виды" },
  { value: "BAGGAGE", label: KIND_LABELS.BAGGAGE },
  { value: "CATERING", label: KIND_LABELS.CATERING },
];

export function registryKindLabel(kind) {
  return KIND_LABELS[kind] ?? kind;
}
