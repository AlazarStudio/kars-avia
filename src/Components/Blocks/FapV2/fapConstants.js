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
    label: "Трансфер (в гостиницу)",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    key: "transferService",
    serviceKind: "TRANSFER",
    direction: "ARRIVAL",
  },
  transferDeparture: {
    label: "Трансфер (в аэропорт)",
    color: "#7C3AED",
    bg: "#F5F3FF",
    key: "departureTransferService",
    serviceKind: "DEPARTURE_TRANSFER",
    direction: "DEPARTURE",
  },
  baggage: {
    label: "Доставка багажа",
    color: "#64748B",
    bg: "#F8FAFC",
    key: "baggageDeliveryService",
    serviceKind: "BAGGAGE_DELIVERY",
  },
};

export const getServiceByKey = (request, key) =>
  request?.[SERVICE_CONFIG[key]?.key] ?? null;

export const PERSON_TYPE_CONFIG = {
  PASSENGER: { label: "Пассажир", color: "#3B82F6", bg: "#EFF6FF" },
  CREW: { label: "Экипаж", color: "#8B5CF6", bg: "#F5F3FF" },
};

export const REQUEST_STATUS_CONFIG = {
  CREATED: { label: "Создан", color: "#64748B", bg: "#F1F5F9" },
  ACCEPTED: { label: "Принят", color: "#3B82F6", bg: "#EFF6FF" },
  IN_PROGRESS: { label: "В работе", color: "#F59E0B", bg: "#FFFBEB" },
  COMPLETED: { label: "Завершён", color: "#10B981", bg: "#ECFDF5" },
  CANCELLED: { label: "Отменён", color: "#EF4444", bg: "#FEF2F2" },
};

// Отменённая заявка правкам не подлежит.
//
// ⚠️ Отмена НЕ каскадит на услуги: `cancelPassengerRequest` пишет только шапку
// (status, statusTimes, cancelReason), и услуги остаются в тех статусах, в
// которых их застала отмена. Поэтому единственный признак закрытости — статус
// самой заявки, и экраны услуг обязаны спрашивать именно его: их собственные
// гейты смотрят на статус УСЛУГИ и отмены не видят. В ФАП v1 такая проверка
// была на каждой вкладке услуги и потерялась при переходе на v2.
export const isRequestCancelled = (request) => request?.status === "CANCELLED";

// Завершённая заявка. Отдельно от isRequestCancelled: отмена запирает правку
// всегда, а завершение — только у того, кому не выдано право
// reserveUpdateCompleted (см. fapEditAccess.js).
export const isRequestCompleted = (request) => request?.status === "COMPLETED";

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

// ISO/Date → строка "YYYY-MM-DDTHH:mm" в локальной зоне браузера,
// для использования в <input type="datetime-local">.
export const toLocalInputValue = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Подпись вида размещения: 1 → «одноместное», … 10 → «десятиместное».
// Словарь покрывает все категории номеров, которые есть в системе (onePlace…tenPlace);
// число сверх десяти в фонде не встречается, для него остаётся запасная форма «N-местное».
// Одна точка правды: этой же подписью пользуется выгрузка в Excel.
export const placementKindLabel = (n) => {
  const k = Number(n);
  if (!Number.isFinite(k) || k <= 0) return "";
  const names = {
    1: "одноместное",
    2: "двухместное",
    3: "трёхместное",
    4: "четырёхместное",
    5: "пятиместное",
    6: "шестиместное",
    7: "семиместное",
    8: "восьмиместное",
    9: "девятиместное",
    10: "десятиместное",
  };
  return names[k] || `${k}-местное`;
};

export const PERSON_CATEGORY_LABEL = { ADULT: "Взрослый", CHILD: "Ребёнок", INFANT: "Инфант" };

// ВАЖНО: ADULT теперь имеет бейдж — взрослых показываем явно (решение заказчика).
export const PERSON_CATEGORY_BADGE = {
  ADULT: { bg: "#F1F5F9", color: "#475569", label: "взрослый" },
  CHILD: { bg: "#FEF3C7", color: "#B45309", label: "ребёнок" },
  INFANT: { bg: "#E0F2FE", color: "#0369A1", label: "инфант" },
};

// всё, кроме CHILD/INFANT (в т.ч. undefined у легаси), считаем взрослым
export const normalizeCategory = (v) => (v === "CHILD" || v === "INFANT" ? v : "ADULT");

// Возрастная скидка на ПРОЖИВАНИЕ (не на питание). Возвращает долю ОПЛАЧИВАЕМОЙ
// стоимости койко-места: взрослый — 1, ребёнок (2–12) — 0.5, инфант (до 2) — 0.
// Правило единое во всех договорах АК (согласовано на созвоне 08.07.2026).
export const accommodationChargeFactor = (category) => {
  const c = normalizeCategory(category);
  if (c === "INFANT") return 0;
  if (c === "CHILD") return 0.5;
  return 1;
};

// Та же величина в процентах скидки: взрослый — 0, ребёнок — 50, инфант — 100.
// Выражена через accommodationChargeFactor, чтобы правда о льготах оставалась одна.
export const accommodationDiscountPercent = (category) =>
  Math.round((1 - accommodationChargeFactor(category)) * 100);

export const PERSON_CATEGORY_OPTIONS = [
  { value: "ADULT", label: "Взрослый" },
  { value: "CHILD", label: "Ребёнок" },
  { value: "INFANT", label: "Инфант" },
];

// Справочник типов ТС для дропдауна «Тип ТС». Общий для трансфера и доставки багажа.
export const VEHICLE_TYPES = [
  "легковая",
  "минивэн (до 8)",
  "микроавтобус (до 20)",
  "автобус до 30",
  "автобус до 50",
  "автобус до 70",
];
