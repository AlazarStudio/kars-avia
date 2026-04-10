/**
 * @typedef {Object} AirlineAnalyticsPeriodBlock
 * @property {string} dateFrom
 * @property {string} dateTo
 * @property {AirlineAnalyticsServiceBlock[]} [services]
 */

/**
 * @typedef {Object} AirlineAnalyticsServiceBlock
 * @property {string} service
 * @property {number} totalRequests
 * @property {number} uniquePeopleCount
 * @property {number} totalBudget
 * @property {number|null|undefined} usedRoomsCount
 * @property {Object[]} airports
 * @property {Object[]} positions
 * @property {Object[]} requests
 * @property {Object[]} transfers
 */

const SERVICE_ORDER = ["LIVING", "MEAL", "TRANSFER"];

export const SERVICE_LABELS = {
  LIVING: "Проживание",
  MEAL: "Питание",
  TRANSFER: "Трансфер",
};

/** @param {AirlineAnalyticsPeriodBlock|null|undefined} period */
export function getPeriodServices(period) {
  return period?.services ?? [];
}

/**
 * @param {AirlineAnalyticsPeriodBlock|null|undefined} period
 * @param {string} serviceEnum
 */
export function getServiceBlock(period, serviceEnum) {
  return getPeriodServices(period).find((b) => b.service === serviceEnum);
}

/** Есть ли в блоке услуги хоть какие-то данные для аналитики (не «пустой» ответ API). */
export function hasMeaningfulServiceBlock(b) {
  if (!b) return false;
  if ((Number(b.totalRequests) || 0) > 0) return true;
  if ((Number(b.uniquePeopleCount) || 0) > 0) return true;
  if ((Number(b.totalBudget) || 0) > 0) return true;
  if ((Number(b.usedRoomsCount) || 0) > 0) return true;
  if ((b.positions?.length ?? 0) > 0) return true;
  if ((b.airports?.length ?? 0) > 0) return true;
  if ((b.requests?.length ?? 0) > 0) return true;
  if ((b.transfers?.length ?? 0) > 0) return true;
  return false;
}

/** Уникальный порядок услуг для UI: сначала известные enum, потом остальные */
export function orderedServiceKeys(period1, period2) {
  const set = new Set();
  for (const b of getPeriodServices(period1)) {
    if (b?.service) set.add(b.service);
  }
  for (const b of getPeriodServices(period2)) {
    if (b?.service) set.add(b.service);
  }
  const ordered = [];
  for (const k of SERVICE_ORDER) {
    if (set.has(k)) ordered.push(k);
  }
  for (const k of set) {
    if (!SERVICE_ORDER.includes(k)) ordered.push(k);
  }
  return ordered;
}

/**
 * MEAL/TRANSFER: usedRoomsCount трактуем как отсутствующий — «—», не 0.
 * @param {string} service
 * @param {number|null|undefined} value
 * @param {(n: number) => string} formatInt
 */
export function formatRoomsForService(service, value, formatInt) {
  if (service === "MEAL" || service === "TRANSFER") return "—";
  if (value == null) return "—";
  return formatInt(value);
}

/**
 * Сумма бюджетов по строкам проживание / питание / трансфер для одной заявки.
 * @param {{ livingBudget?: unknown, mealBudget?: unknown, transferBudget?: unknown }} r
 */
export function sumRequestServiceBudgets(r) {
  return (
    (Number(r?.livingBudget) || 0) +
    (Number(r?.mealBudget) || 0) +
    (Number(r?.transferBudget) || 0)
  );
}

const ENTITY_REQUEST_MERGE_SERVICES = ["LIVING", "MEAL"];

/**
 * Одна строка на заявку: объединяет `requests` из LIVING и MEAL одного периода
 * (дубли по requestId — max по каждому компоненту бюджета).
 * @param {AirlineAnalyticsPeriodBlock|null|undefined} period
 */
export function mergeEntityRequestRowsFromServices(period) {
  if (!period) return [];
  const map = new Map();
  for (const sk of ENTITY_REQUEST_MERGE_SERVICES) {
    const block = getServiceBlock(period, sk);
    const reqs = block?.requests ?? [];
    for (const r of reqs) {
      const id =
        r?.requestId != null && r.requestId !== ""
          ? String(r.requestId)
          : null;
      const num =
        r?.requestNumber != null && r.requestNumber !== ""
          ? String(r.requestNumber)
          : "";
      const key = id ?? (num ? `n:${num}` : "");
      if (!key) continue;
      const prev = map.get(key);
      const living = Number(r.livingBudget) || 0;
      const meal = Number(r.mealBudget) || 0;
      const transfer = Number(r.transferBudget) || 0;
      if (!prev) {
        map.set(key, { ...r });
        continue;
      }
      map.set(key, {
        ...prev,
        livingBudget: Math.max(Number(prev.livingBudget) || 0, living),
        mealBudget: Math.max(Number(prev.mealBudget) || 0, meal),
        transferBudget: Math.max(Number(prev.transferBudget) || 0, transfer),
        personName: prev.personName || r.personName,
        positionName: prev.positionName || r.positionName,
        airportCode: prev.airportCode || r.airportCode,
        airportName: prev.airportName || r.airportName,
        requestNumber: prev.requestNumber || r.requestNumber,
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    const na = String(a.requestNumber ?? a.requestId ?? "");
    const nb = String(b.requestNumber ?? b.requestId ?? "");
    return na.localeCompare(nb, "ru", { numeric: true });
  });
}

export function normAirportId(id) {
  if (id == null || id === "") return "";
  return String(id);
}

export function findAirportRow(rows, airportId) {
  const want = normAirportId(airportId);
  if (!want) return undefined;
  return rows.find((r) => normAirportId(r.airportId) === want);
}

/** @param {{ id?: string|null }|null} selectedAirportEntry */
export function airportMatchesPeriodFilter(airportId, selectedAirportEntry) {
  if (!selectedAirportEntry?.id) return true;
  return normAirportId(airportId) === normAirportId(selectedAirportEntry.id);
}

/**
 * @param {string} metricId requestsCount | budget | uniquePeopleCount | usedRoomsCount
 * @param {AirlineAnalyticsServiceBlock[]} rowsList массив блоков одной услуги по периодам [p1, p2?]
 * @param {Array<{ id?: string|null }|null>} periodFilters фильтр аэропорта на период
 */
export function buildGroupedBarDataForMetric(
  metricId,
  rowsList,
  periodFilters
) {
  const periodCount = rowsList.length;
  if (periodCount < 2) return [];

  const airportRowsPerPeriod = rowsList.map((block) => block?.airports ?? []);
  const metaById = new Map();

  for (const rows of airportRowsPerPeriod) {
    for (const r of rows) {
      const id = normAirportId(r.airportId);
      if (!id) continue;
      if (!metaById.has(id)) {
        metaById.set(id, {
          airportName: r.airportName,
          airportCode: r.airportCode,
        });
      } else {
        const m = metaById.get(id);
        if (!m.airportName && r.airportName) m.airportName = r.airportName;
        if (!m.airportCode && r.airportCode) m.airportCode = r.airportCode;
      }
    }
  }

  const primaryIds = airportRowsPerPeriod[0]
    .map((r) => normAirportId(r.airportId))
    .filter(Boolean);
  const seen = new Set(primaryIds);
  const idOrdered = [...primaryIds];
  for (const id of metaById.keys()) {
    if (!seen.has(id)) {
      seen.add(id);
      idOrdered.push(id);
    }
  }

  const idOrderedFiltered = idOrdered.filter((airportId) =>
    periodFilters.some((sel) => airportMatchesPeriodFilter(airportId, sel))
  );

  return idOrderedFiltered.map((airportId) => {
    const meta = metaById.get(airportId);
    const name =
      meta?.airportCode || meta?.airportName || airportId;

    const point = { name };
    for (let idx = 0; idx < periodCount; idx++) {
      if (!airportMatchesPeriodFilter(airportId, periodFilters[idx])) {
        point[`p${idx}`] = null;
        continue;
      }
      const row = findAirportRow(airportRowsPerPeriod[idx], airportId);
      let raw =
        metricId === "requestsCount"
          ? row?.requestsCount
          : metricId === "budget"
            ? row?.budget
            : metricId === "uniquePeopleCount"
              ? row?.uniquePeopleCount
              : row?.usedRoomsCount;

      if (metricId === "usedRoomsCount" && raw == null) {
        point[`p${idx}`] = null;
      } else {
        point[`p${idx}`] = Number(raw) || 0;
      }
    }
    return point;
  });
}

export const AIRPORT_BAR_METRICS = [
  { id: "budget", label: "Бюджет, ₽" },
  { id: "requestsCount", label: "Заявки" },
  { id: "uniquePeopleCount", label: "Уникальные люди" },
  { id: "usedRoomsCount", label: "Комнаты" },
];

export function normPositionKey(row) {
  if (!row) return "";
  return String(row.positionId ?? row.positionName ?? "");
}

/**
 * Для groupedBar «Бюджет по должностям» при сравнении периодов (ключи p0/p1 как у series).
 * @param {Array<{ positions?: object[] }|null|undefined>} blocks два блока услуги [период1, период2]
 */
export function buildGroupedBarDataForPositionBudget(blocks) {
  const rowsP1 = blocks[0]?.positions ?? [];
  const rowsP2 = blocks[1]?.positions ?? [];
  const map = new Map();
  const idOrdered = [];

  for (const r of rowsP1) {
    const k = normPositionKey(r);
    if (!k) continue;
    if (!map.has(k)) {
      idOrdered.push(k);
      map.set(k, { name: r.positionName || k, p0: null, p1: null });
    }
    const row = map.get(k);
    row.p0 = Number(r.budget) || 0;
    if (r.positionName) row.name = r.positionName;
  }
  for (const r of rowsP2) {
    const k = normPositionKey(r);
    if (!k) continue;
    if (!map.has(k)) {
      idOrdered.push(k);
      map.set(k, { name: r.positionName || k, p0: null, p1: null });
    }
    const row = map.get(k);
    row.p1 = Number(r.budget) || 0;
    if (r.positionName) row.name = r.positionName;
  }

  return idOrdered.map((k) => {
    const row = map.get(k);
    return { name: row.name, p0: row.p0, p1: row.p1 };
  });
}

/**
 * @param {Object[]|null|undefined} p1
 * @param {Object[]|null|undefined} p2
 * @param {boolean} isCompare
 */
export function mergePositionRows(p1, p2, isCompare) {
  const a = p1 ?? [];
  if (!isCompare || !p2) {
    return a.map((r) => ({
      key: normPositionKey(r),
      name: r.positionName,
      p1: r,
      p2: null,
    }));
  }
  const map = new Map();
  for (const r of a) {
    const k = normPositionKey(r);
    if (!k) continue;
    map.set(k, { key: k, name: r.positionName, p1: r, p2: null });
  }
  for (const r of p2) {
    const k = normPositionKey(r);
    if (!k) continue;
    if (!map.has(k)) {
      map.set(k, { key: k, name: r.positionName, p1: null, p2: null });
    }
    const row = map.get(k);
    row.p2 = r;
    if (!row.name) row.name = r.positionName;
  }
  return Array.from(map.values()).sort(
    (x, y) =>
      (y.p1?.count ?? y.p2?.count ?? 0) - (x.p1?.count ?? x.p2?.count ?? 0)
  );
}

/**
 * @param {Object[]|null|undefined} p1
 * @param {Object[]|null|undefined} p2
 * @param {boolean} isCompare
 */
export function mergeAirportRows(p1, p2, isCompare) {
  const a = p1 ?? [];
  if (!isCompare || !p2) {
    return a.map((r) => ({
      key: normAirportId(r.airportId),
      name: r.airportCode || r.airportName || r.airportId,
      p1: r,
      p2: null,
    }));
  }
  const map = new Map();
  for (const r of a) {
    const k = normAirportId(r.airportId);
    if (!k) continue;
    map.set(k, {
      key: k,
      name: r.airportCode || r.airportName || k,
      p1: r,
      p2: null,
    });
  }
  for (const r of p2) {
    const k = normAirportId(r.airportId);
    if (!k) continue;
    if (!map.has(k)) {
      map.set(k, {
        key: k,
        name: r.airportCode || r.airportName || k,
        p1: null,
        p2: null,
      });
    }
    const row = map.get(k);
    row.p2 = r;
    if (!row.name || row.name === row.key) {
      row.name = r.airportCode || r.airportName || k;
    }
  }
  return Array.from(map.values()).sort(
    (x, y) =>
      (Number(y.p1?.budget) || Number(y.p2?.budget) || 0) -
      (Number(x.p1?.budget) || Number(x.p2?.budget) || 0)
  );
}
