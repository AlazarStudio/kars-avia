import { formatDate, formatDateTime } from "./fapConstants.js";

// Колонки экранной таблицы реестра по его виду. internal — только диспетчеру и
// только при включённом переключателе «Внутренние колонки».

const money = (v) => (v == null ? "—" : `${Number(v).toLocaleString("ru-RU")} ₽`);
const num = (v) => (v == null ? "—" : Number(v).toLocaleString("ru-RU"));

const BAGGAGE_COLUMNS = [
  { key: "fullName", label: "ФИО пассажира" },
  {
    key: "flight",
    label: "Рейс и дата",
    get: (r) =>
      `${r.flightNumber ?? ""} ${r.flightDate ? formatDate(r.flightDate) : ""}`.trim() ||
      "—",
  },
  {
    key: "baggageTags",
    label: "Бирки",
    get: (r) => (r.baggageTags ?? []).join(", ") || "—",
  },
  { key: "addressTo", label: "Адрес доставки", get: (r) => r.addressTo || "—" },
  {
    key: "deliveredAt",
    label: "Дата и время доставки",
    get: (r) => (r.deliveredAt ? formatDateTime(r.deliveredAt) : "—"),
  },
  { key: "price", label: "Стоимость (без НДС)", get: (r) => money(r.price), money: true },
  { key: "driverName", label: "Водитель", internal: true, get: (r) => r.driverName || "—" },
  {
    key: "driverCost",
    label: "Водителю",
    internal: true,
    get: (r) => money(r.driverCost),
    money: true,
  },
  { key: "distanceKm", label: "Км", internal: true, get: (r) => num(r.distanceKm) },
  {
    key: "diff",
    label: "Разница",
    internal: true,
    money: true,
    get: (r) => money((r.price ?? 0) - (r.driverCost ?? 0)),
  },
];

const CATERING_COLUMNS = [
  {
    key: "suppliedAt",
    label: "Дата и время",
    get: (r) => (r.suppliedAt ? formatDateTime(r.suppliedAt) : "—"),
  },
  { key: "flightNumber", label: "Рейс", get: (r) => r.flightNumber || "—" },
  {
    key: "portions",
    label: "Порций",
    get: (r) => (r.serviceKind === "MEAL" ? num(r.quantity) : ""),
  },
  {
    key: "drinks",
    label: "Напитков",
    get: (r) => (r.serviceKind === "WATER" ? num(r.quantity) : ""),
  },
  {
    key: "mealAmount",
    label: "Стоимость питания",
    get: (r) => (r.serviceKind === "MEAL" ? money(r.amount) : ""),
    money: true,
  },
  {
    key: "waterAmount",
    label: "Стоимость напитков",
    get: (r) => (r.serviceKind === "WATER" ? money(r.amount) : ""),
    money: true,
  },
  { key: "deliveryCost", label: "Доставка", get: (r) => money(r.deliveryCost), money: true },
  { key: "total", label: "Итого", get: (r) => money(r.total), money: true },
  { key: "supplier", label: "Поставщик", get: (r) => r.supplier || "—" },
  {
    key: "supplierCost",
    label: "Поставщику",
    internal: true,
    get: (r) => money(r.supplierCost),
    money: true,
  },
  {
    key: "diff",
    label: "Разница",
    internal: true,
    money: true,
    get: (r) => money((r.total ?? 0) - (r.supplierCost ?? 0)),
  },
];

/** Колонки вида реестра; без internal внутренние колонки отсекаются. */
export function registryColumns(kind, { internal = false } = {}) {
  const all = kind === "BAGGAGE" ? BAGGAGE_COLUMNS : CATERING_COLUMNS;
  return all.filter((c) => !c.internal || internal);
}

export { money as registryMoney };
