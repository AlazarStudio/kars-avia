// Факт поставки воды/питания (одна на рейс): черновик формы, патч и сумма для АК.
// Зеркало бэкового services/passengerRequest/supplyFact.js.

import {
  toLocalInputValue,
  fromLocalInputValue,
  toMoneyOrNull,
  toWholeCountOrNull,
  toDraftString,
} from "./fapConstants.js";

// Черновик карточки: факт с сервера, а где факта нет — подстановка из плана
// (количество = план по людям, время = плановая подача). Подстановка только
// визуальная: в патч она попадёт, лишь если диспетчер сохранит.
export function supplyDraftFromService(service) {
  const plan = service?.plan ?? {};
  return {
    supplier: service?.supplier ?? "",
    suppliedAt: toLocalInputValue(service?.suppliedAt ?? plan.plannedAt ?? null),
    quantity: toDraftString(service?.quantity ?? plan.peopleCount ?? null),
    unitPrice: toDraftString(service?.unitPrice),
    deliveryCost: toDraftString(service?.deliveryCost),
    supplierCost: toDraftString(service?.supplierCost),
  };
}

export function supplyTotal({ quantity, unitPrice, deliveryCost }) {
  const amount = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  return Math.round((amount + (Number(deliveryCost) || 0)) * 100) / 100;
}

// Числовые поля факта и правило их нормализации — то же, что на бэке.
const NUMERIC_KEYS = {
  quantity: toWholeCountOrNull,
  unitPrice: toMoneyOrNull,
  deliveryCost: toMoneyOrNull,
  supplierCost: toMoneyOrNull,
};

// Патч из изменённых ключей. Числа сравниваем ЧИСЛАМИ после той же нормализации,
// что применит бэк: строковое сравнение считало бы «60.10» отличным от 60.1, а
// «-5» — отличным от записанного бэком null, и черновик после сохранения навсегда
// оставался бы грязным (кнопка активна, рефетч черновик уже не пересинхронизирует).
export function buildSupplyPatch(service, draft) {
  const patch = {};
  const serverSupplier = service?.supplier ?? "";
  if ((draft.supplier ?? "").trim() !== serverSupplier) {
    patch.supplier = draft.supplier.trim() || null;
  }
  const serverAt = toLocalInputValue(service?.suppliedAt ?? null);
  if ((draft.suppliedAt ?? "") !== serverAt) {
    patch.suppliedAt = fromLocalInputValue(draft.suppliedAt);
  }
  for (const [key, normalize] of Object.entries(NUMERIC_KEYS)) {
    const next = normalize(draft[key]);
    const prev = service?.[key] ?? null;
    if (next !== prev) patch[key] = next;
  }
  return patch;
}

const SUPPLY_DRAFT_KEYS = ["supplier", "suppliedAt", "quantity", "unitPrice", "deliveryCost", "supplierCost"];

// Черновик правда правился, а не просто получил подстановку из плана при
// загрузке: сравниваем с черновиком на момент загрузки (initial), а не с
// сервером — иначе сама подстановка (план вместо пустого факта) уже читалась
// бы как правка.
export function isSupplyDraftDirty(initial, draft) {
  return SUPPLY_DRAFT_KEYS.some((key) => (draft?.[key] ?? "") !== (initial?.[key] ?? ""));
}
