// Сериализация фильтров списка ФАП (/far) для sessionStorage.
//
// Всё, кроме статуса (тот остаётся в localStorage под своим ключом — см.
// FapV2.jsx), живёт в обычном useState и сбрасывается при возврате из
// заявки, потому что список размонтируется. sessionStorage переживает уход
// на деталку и F5 внутри вкладки, но не тянет старый период фильтра в новую
// сессию (новая вкладка/окно) — в отличие от localStorage.
//
// userId нужен, чтобы logout в той же вкладке (sessionStorage не чистится
// при выходе) не подсунул следующему пользователю чужие фильтры.

function pickAirline(airline) {
  if (!airline || typeof airline.id !== "string" || !airline.id) return null;
  if (typeof airline.name !== "string") return null;
  return { id: airline.id, name: airline.name };
}

function pickAirport(airport) {
  if (!airport || typeof airport.id !== "string" || !airport.id) return null;
  if (typeof airport.name !== "string") return null;
  return {
    id: airport.id,
    name: airport.name,
    code: typeof airport.code === "string" ? airport.code : "",
  };
}

function toIsoOrNull(date) {
  return date instanceof Date && !Number.isNaN(date.getTime())
    ? date.toISOString()
    : null;
}

function parseIsoOrNull(value) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function serializeListFilters(filters, userId) {
  const {
    search,
    airline,
    airport,
    services,
    reportStage,
    startDate,
    endDate,
  } = filters;
  return JSON.stringify({
    userId: userId ?? null,
    search: typeof search === "string" ? search : "",
    airline: pickAirline(airline),
    airport: pickAirport(airport),
    services: Array.isArray(services) ? services : [],
    reportStage: typeof reportStage === "string" ? reportStage : null,
    startDate: toIsoOrNull(startDate),
    endDate: toIsoOrNull(endDate),
  });
}

export function parseListFilters(raw, userId) {
  if (!raw) return null;
  let stored;
  try {
    stored = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return null;
  if (stored.userId !== (userId ?? null)) return null;

  return {
    search: typeof stored.search === "string" ? stored.search : "",
    airline: pickAirline(stored.airline),
    airport: pickAirport(stored.airport),
    services: Array.isArray(stored.services)
      ? stored.services.filter((s) => typeof s === "string")
      : [],
    reportStage: typeof stored.reportStage === "string" ? stored.reportStage : null,
    startDate: parseIsoOrNull(stored.startDate),
    endDate: parseIsoOrNull(stored.endDate),
  };
}
