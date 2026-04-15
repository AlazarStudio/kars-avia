export const SERVICE_CONFIG = {
  water: {
    label: "Поставка воды",
    color: "#3B82F6",
    bg: "#EFF6FF",
    key: "waterService",
    serviceKind: "WATER",
  },
  meal: {
    label: "Поставка питания",
    color: "#F59E0B",
    bg: "#FFFBEB",
    key: "mealService",
    serviceKind: "MEAL",
  },
  living: {
    label: "Проживание",
    color: "#10B981",
    bg: "#ECFDF5",
    key: "livingService",
    serviceKind: "LIVING",
  },
  transfer: {
    label: "Трансфер",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    key: "transferService",
    serviceKind: "TRANSFER",
  },
  baggage: {
    label: "Доставка багажа",
    color: "#64748B",
    bg: "#F8FAFC",
    key: "baggageDeliveryService",
    serviceKind: "BAGGAGE_DELIVERY",
  },
};

export const REQUEST_STATUS_CONFIG = {
  CREATED: { label: "Создан", color: "#64748B", bg: "#F1F5F9" },
  ACCEPTED: { label: "Принят", color: "#3B82F6", bg: "#EFF6FF" },
  IN_PROGRESS: { label: "В работе", color: "#F59E0B", bg: "#FFFBEB" },
  COMPLETED: { label: "Завершён", color: "#10B981", bg: "#ECFDF5" },
  CANCELLED: { label: "Отменён", color: "#EF4444", bg: "#FEF2F2" },
};

export const SERVICE_STATUS_CONFIG = {
  NEW: { label: "Новый", color: "#94A3B8", bg: "#F1F5F9" },
  ACCEPTED: { label: "Принят", color: "#3B82F6", bg: "#EFF6FF" },
  IN_PROGRESS: { label: "В работе", color: "#F59E0B", bg: "#FFFBEB" },
  COMPLETED: { label: "Завершён", color: "#10B981", bg: "#ECFDF5" },
  CANCELLED: { label: "Отменён", color: "#EF4444", bg: "#FEF2F2" },
};

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
