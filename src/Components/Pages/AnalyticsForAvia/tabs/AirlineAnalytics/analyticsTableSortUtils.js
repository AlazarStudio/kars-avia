/** @typedef {{ key: string, dir: 'asc' | 'desc' }} TableSort */

/**
 * @param {unknown} a
 * @param {unknown} b
 * @param {'asc' | 'desc'} dir
 */
export function cmpNum(a, b, dir) {
  const na = Number(a);
  const nb = Number(b);
  const aBad = a == null || Number.isNaN(na);
  const bBad = b == null || Number.isNaN(nb);
  if (aBad && bBad) return 0;
  if (aBad) return 1;
  if (bBad) return -1;
  const c = na - nb;
  return dir === "asc" ? c : -c;
}

/**
 * @param {unknown} a
 * @param {unknown} b
 * @param {'asc' | 'desc'} dir
 */
export function cmpStr(a, b, dir) {
  const sa = (a ?? "").toString().toLocaleLowerCase("ru");
  const sb = (b ?? "").toString().toLocaleLowerCase("ru");
  const c = sa.localeCompare(sb, "ru");
  return dir === "asc" ? c : -c;
}

/**
 * @param {TableSort|null|undefined} sort
 * @param {string} columnKey
 */
export function nextSortDir(sort, columnKey) {
  if (sort?.key === columnKey) {
    return sort.dir === "asc" ? "desc" : "asc";
  }
  if (
    columnKey === "name" ||
    columnKey === "number" ||
    columnKey === "person" ||
    columnKey === "position" ||
    columnKey === "airport" ||
    columnKey === "service"
  ) {
    return "asc";
  }
  return "desc";
}

/**
 * @template T
 * @param {T[]} rows
 * @param {TableSort|null|undefined} sort
 * @param {(row: T, key: string) => unknown} getVal
 */
const STR_SORT_KEYS = new Set([
  "name",
  "person",
  "position",
  "airport",
  "service",
]);

export function sortRowsByKey(rows, sort, getVal) {
  if (!sort || !rows.length) return rows;
  const { key, dir } = sort;
  const copy = [...rows];
  copy.sort((x, y) => {
    const vx = getVal(x, key);
    const vy = getVal(y, key);
    if (key === "number") {
      const sx = String(vx ?? "");
      const sy = String(vy ?? "");
      const c = sx.localeCompare(sy, "ru", { numeric: true });
      return dir === "asc" ? c : -c;
    }
    if (STR_SORT_KEYS.has(key)) {
      return cmpStr(vx, vy, dir);
    }
    return cmpNum(vx, vy, dir);
  });
  return copy;
}

/**
 * @param {object[]} rows — mergePositionRows result
 * @param {boolean} showGroupedBars
 * @param {TableSort|null|undefined} sort
 */
export function sortPositionRows(rows, showGroupedBars, sort) {
  if (!sort) return rows;
  return sortRowsByKey(rows, sort, (row, key) => {
    if (key === "name") return row.name;
    if (key === "p1count") return row.p1?.count;
    if (key === "p1pct") return row.p1?.percent;
    if (key === "p1budget") return row.p1?.budget;
    if (showGroupedBars) {
      if (key === "p2count") return row.p2?.count;
      if (key === "p2pct") return row.p2?.percent;
      if (key === "p2budget") return row.p2?.budget;
    }
    return null;
  });
}

/**
 * @param {object[]} rows — mergeAirportRows result
 * @param {boolean} showGroupedBars
 * @param {TableSort|null|undefined} sort
 */
export function sortAirportRows(rows, showGroupedBars, sort) {
  if (!sort) return rows;
  return sortRowsByKey(rows, sort, (row, key) => {
    if (key === "name") return row.name;
    if (key === "p1req") return row.p1?.requestsCount;
    if (key === "p1people") return row.p1?.uniquePeopleCount;
    if (key === "p1rooms") return row.p1?.usedRoomsCount;
    if (key === "p1budget") return row.p1?.budget;
    if (showGroupedBars) {
      if (key === "p2req") return row.p2?.requestsCount;
      if (key === "p2people") return row.p2?.uniquePeopleCount;
      if (key === "p2rooms") return row.p2?.usedRoomsCount;
      if (key === "p2budget") return row.p2?.budget;
    }
    return null;
  });
}

/**
 * @param {object[]} rows — merged request rows
 * @param {TableSort|null|undefined} sort
 * @param {(r: object) => number} sumBudget
 */
export function sortMergedRequestRows(rows, sort, sumBudget) {
  if (!sort) return rows;
  return sortRowsByKey(rows, sort, (row, key) => {
    switch (key) {
      case "number":
        return row.requestNumber ?? row.requestId ?? "";
      case "person":
        return row.personName;
      case "position":
        return row.positionName;
      case "airport":
        return row.airportCode ?? row.airportName;
      case "total":
        return sumBudget(row);
      case "living":
        return row.livingBudget;
      case "meal":
        return row.mealBudget;
      case "transfer":
        return row.transferBudget;
      default:
        return null;
    }
  });
}

/**
 * @param {{ sk: string, sb1: object|null, sb2: object|null, sl: string, rows: object[] }[]} blocks
 * @param {TableSort|null|undefined} sort
 * @param {boolean} isMulti
 */
export function sortSegmentBlocks(blocks, sort, isMulti) {
  if (!sort) return blocks;
  const { key, dir } = sort;
  const copy = [...blocks];
  if (key === "service") {
    copy.sort((a, b) => cmpStr(a.sl, b.sl, dir));
    return copy;
  }
  if (key === "p1") {
    copy.sort((a, b) =>
      cmpNum(a.sb1?.totalRequests, b.sb1?.totalRequests, dir)
    );
    return copy;
  }
  if (key === "p2" && isMulti) {
    copy.sort((a, b) =>
      cmpNum(a.sb2?.totalRequests, b.sb2?.totalRequests, dir)
    );
    return copy;
  }
  if (key === "value" && !isMulti) {
    copy.sort((a, b) =>
      cmpNum(a.sb1?.totalRequests, b.sb1?.totalRequests, dir)
    );
    return copy;
  }
  return copy;
}
