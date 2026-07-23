// Сводки по измерениям (D1). Семантика = KPI-тоталы: «Заявок»/«Без стоимости» — все
// строки группы; люди/дети/ночи/деньги — только counted (!costMissing).
const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;
const NO_DATE_KEY = "__no_date__";

// flightDate хранится как московская полночь → UTC, поэтому месяц берём в МСК (+3ч).
function mskMonthKey(flightDate) {
  if (!flightDate) return null;
  const t = new Date(flightDate).getTime();
  if (Number.isNaN(t)) return null;
  const d = new Date(t + MSK_OFFSET_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function mskMonthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  const name = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("ru-RU", {
    month: "long",
    timeZone: "UTC",
  });
  return `${name} ${y}`;
}

function dimensionKey(row, dimension) {
  if (dimension === "airport") {
    const code = row.airportCode || row.airportName || "";
    return { key: code || "__none__", label: code ? (row.airportName || row.airportCode) : "Без аэропорта" };
  }
  if (dimension === "airline") {
    const name = row.airlineName || "";
    return { key: name || "__none__", label: name || "—" };
  }
  const monthKey = mskMonthKey(row.flightDate);
  if (!monthKey) return { key: NO_DATE_KEY, label: "Без даты рейса" };
  return { key: monthKey, label: mskMonthLabel(monthKey) };
}

export function buildSummary(rows, dimension) {
  const groups = new Map();
  for (const row of rows || []) {
    const { key, label } = dimensionKey(row, dimension);
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        label,
        requestsCount: 0,
        missingCostCount: 0,
        peopleCount: 0,
        childrenCount: 0,
        infantsCount: 0,
        roomNights: 0,
        living: 0,
        meal: 0,
        transfer: 0,
        total: 0,
      };
      groups.set(key, g);
    }
    g.requestsCount += 1;
    if (row.costMissing) {
      g.missingCostCount += 1;
    } else {
      g.peopleCount += Number(row.peopleCount) || 0;
      g.childrenCount += Number(row.childrenCount) || 0;
      g.infantsCount += Number(row.infantsCount) || 0;
      g.roomNights += Number(row.roomNights) || 0;
      g.living += Number(row.living) || 0;
      g.meal += Number(row.meal) || 0;
      g.transfer += Number(row.transfer) || 0;
      g.total += Number(row.total) || 0;
    }
  }
  const list = [...groups.values()].map((g) => ({
    ...g,
    roomNights: round2(g.roomNights),
    living: round2(g.living),
    meal: round2(g.meal),
    transfer: round2(g.transfer),
    total: round2(g.total),
  }));
  if (dimension === "month") {
    list.sort((a, b) => {
      if (a.key === NO_DATE_KEY) return 1;
      if (b.key === NO_DATE_KEY) return -1;
      return a.key < b.key ? -1 : 1;
    });
  } else {
    list.sort((a, b) => b.total - a.total);
  }
  return list;
}

const CHART_TOP_GROUPS = 8;

const MONEY_SERIES = [
  { key: "living", label: "Проживание" },
  { key: "meal", label: "Питание" },
  { key: "transfer", label: "Трансфер" },
];

const PEOPLE_SERIES = [
  { key: "adults", label: "Взрослые" },
  { key: "kids", label: "Дети" },
];

function toChartRow(g, metric) {
  if (metric === "people") {
    const kids = g.childrenCount + g.infantsCount;
    return { x: g.label, adults: Math.max(0, g.peopleCount - kids), kids };
  }
  return { x: g.label, living: g.living, meal: g.meal, transfer: g.transfer };
}

// Данные для стек-бара: месяцы — хронологично без бакета «Без даты рейса»;
// аэропорты/АК — по метрике desc, при >9 группах топ-8 + «Прочие».
export function buildChartData(summaryRows, dimension, metric) {
  const series = metric === "people" ? PEOPLE_SERIES : MONEY_SERIES;
  const rows = summaryRows || [];
  if (dimension === "month") {
    const noDate = rows.find((g) => g.key === NO_DATE_KEY);
    const data = rows.filter((g) => g.key !== NO_DATE_KEY).map((g) => toChartRow(g, metric));
    return { data, series, noDateCount: noDate ? noDate.requestsCount : 0 };
  }
  const metricVal = (g) => (metric === "people" ? g.peopleCount : g.total);
  const sorted = [...rows].sort((a, b) => metricVal(b) - metricVal(a));
  if (sorted.length <= CHART_TOP_GROUPS + 1) {
    return { data: sorted.map((g) => toChartRow(g, metric)), series, noDateCount: 0 };
  }
  const others = {
    label: "Прочие",
    peopleCount: 0,
    childrenCount: 0,
    infantsCount: 0,
    living: 0,
    meal: 0,
    transfer: 0,
    total: 0,
  };
  for (const g of sorted.slice(CHART_TOP_GROUPS)) {
    others.peopleCount += g.peopleCount;
    others.childrenCount += g.childrenCount;
    others.infantsCount += g.infantsCount;
    others.living += g.living;
    others.meal += g.meal;
    others.transfer += g.transfer;
    others.total += g.total;
  }
  others.living = round2(others.living);
  others.meal = round2(others.meal);
  others.transfer = round2(others.transfer);
  others.total = round2(others.total);
  const data = [...sorted.slice(0, CHART_TOP_GROUPS).map((g) => toChartRow(g, metric)), toChartRow(others, metric)];
  return { data, series, noDateCount: 0 };
}
