// XLSX-экспорт аналитики пассажиров: полный отчёт одной книгой
// (exceljs, динамический импорт как в reports/buildReportSheets.js)
import { REQUEST_STATUS_CONFIG } from "../../../../Blocks/FapV2/fapConstants";
import {
  addCombinedSheet,
  downloadWorkbook,
} from "../../../../Blocks/FapV2/reports/buildReportSheets";
import { visibleHotelIndexes } from "../../../../Blocks/FapV2/fapReportAccess";
import { formatDateRu } from "./passengerAnalyticsMappers";

const statusLabel = (code) => REQUEST_STATUS_CONFIG?.[code]?.label || code || "";

const SUMMARY_SHEETS = [
  { key: "airport", sheetName: "Сводка — Аэропорты", dimensionLabel: "Аэропорты" },
  { key: "airline", sheetName: "Сводка — Авиакомпании", dimensionLabel: "Авиакомпании" },
  { key: "month", sheetName: "Сводка — Месяцы", dimensionLabel: "Месяцы" },
];

function fillSummarySheet(wb, { sheetName, dimensionLabel, summaryRows, totals, periodLabel }) {
  const ws = wb.addWorksheet(sheetName);
  ws.addRow([`Сводка ФАП — ${dimensionLabel}`]);
  ws.addRow([`Период: ${periodLabel}`]);
  ws.addRow([]);
  const header = [
    dimensionLabel,
    "Заявок",
    "Чел.",
    "Дети",
    "Млад.",
    "Суток",
    "Проживание",
    "Питание",
    "Трансфер",
    "Итого",
    "Без стоимости",
  ];
  const headerRow = ws.addRow(header);
  headerRow.font = { bold: true };
  for (const g of summaryRows) {
    ws.addRow([
      g.label,
      g.requestsCount,
      g.peopleCount,
      g.childrenCount,
      g.infantsCount,
      g.roomNights,
      g.living,
      g.meal,
      g.transfer,
      g.total,
      g.missingCostCount,
    ]);
  }
  ws.addRow([]);
  const totalRow = ws.addRow([
    "ИТОГО",
    totals?.requestsCount || 0,
    totals?.peopleCount || 0,
    totals?.childrenCount || 0,
    totals?.infantsCount || 0,
    totals?.roomNights || 0,
    totals?.living || 0,
    totals?.meal || 0,
    totals?.transfer || 0,
    totals?.total || 0,
    totals?.missingCostCount || 0,
  ]);
  totalRow.font = { bold: true };
  const widths = [24, 10, 8, 8, 8, 10, 14, 14, 14, 14, 14];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
  for (let c = 7; c <= 10; c++) {
    ws.getColumn(c).numFmt = "#,##0";
  }
  ws.getColumn(6).numFmt = "0.##";
}

function fillRequestsSheet(wb, { rows, totals, showAirline, meta }) {
  const ws = wb.addWorksheet("Заявки");
  ws.addRow(["Сводный отчёт ФАП — пассажиры"]);
  ws.addRow([`Период: ${meta.periodLabel}`]);
  if (meta.airlineName) ws.addRow([`Авиакомпания: ${meta.airlineName}`]);
  ws.addRow([]);

  const header = [
    "№ рейса",
    "№ заявки",
    "Дата рейса",
    ...(showAirline ? ["Авиакомпания"] : []),
    "Аэропорт",
    "Гостиница(ы)",
    "Чел.",
    "Взр.",
    "Дети",
    "Млад.",
    "Группы",
    "Суток",
    "Проживание",
    "Питание",
    "Трансфер",
    "Трансфер прилёт",
    "Трансфер вылет",
    "Багаж",
    "Итого",
    "Статус",
    "Примечание",
  ];
  const headerRow = ws.addRow(header);
  headerRow.font = { bold: true };

  for (const r of rows) {
    ws.addRow([
      r.flightNumber || r.requestNumber || "",
      r.requestNumber || "",
      r.flightDate ? formatDateRu(r.flightDate) : "",
      ...(showAirline ? [r.airlineName || ""] : []),
      r.airportCode || r.airportName || "",
      (r.hotelNames || []).join(", "),
      r.peopleCount || 0,
      r.adultsCount || 0,
      r.childrenCount || 0,
      r.infantsCount || 0,
      r.groupsCount ? `${r.groupsCount} гр. · ${r.linkedPeopleCount} чел.` : "",
      r.roomNights || 0,
      r.costMissing ? "" : r.living || 0,
      r.costMissing ? "" : r.meal || 0,
      r.costMissing ? "" : r.transfer || 0,
      r.costMissing ? "" : r.transferArrival || 0,
      r.costMissing ? "" : r.transferDeparture || 0,
      r.costMissing ? "" : r.transferBaggage || 0,
      r.costMissing ? "" : r.total || 0,
      statusLabel(r.status),
      r.costMissing ? "нет отчёта" : "",
    ]);
  }

  ws.addRow([]);
  const totalRow = ws.addRow([
    "ИТОГО",
    "",
    "",
    ...(showAirline ? [""] : []),
    "",
    "",
    totals?.peopleCount || 0,
    totals?.adultsCount || 0,
    totals?.childrenCount || 0,
    totals?.infantsCount || 0,
    totals?.linkedPeopleCount || 0,
    totals?.roomNights || 0,
    totals?.living || 0,
    totals?.meal || 0,
    totals?.transfer || 0,
    totals?.transferArrival || 0,
    totals?.transferDeparture || 0,
    totals?.transferBaggage || 0,
    totals?.total || 0,
    "",
    totals?.missingCostCount ? `без стоимости: ${totals.missingCostCount}` : "",
  ]);
  totalRow.font = { bold: true };

  const widths = [
    14, // № рейса
    16, // № заявки
    14, // Дата рейса
    ...(showAirline ? [24] : []),
    12, // Аэропорт
    34, // Гостиница(ы)
    8, // Чел.
    8, // Взр.
    8, // Дети
    8, // Млад.
    18, // Группы
    10, // Суток
    14, // Проживание
    14, // Питание
    14, // Трансфер
    16, // Трансфер прилёт
    16, // Трансфер вылет
    12, // Багаж
    14, // Итого
    14, // Статус
    18, // Примечание
  ];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // Денежный блок — 7 колонок подряд (Проживание…Итого), «Суток» — дробное перед ними.
  const firstMoneyCol = showAirline ? 13 : 12;
  for (let c = firstMoneyCol; c < firstMoneyCol + 7; c++) {
    ws.getColumn(c).numFmt = "#,##0";
  }
  ws.getColumn(firstMoneyCol - 1).numFmt = "0.##";
}

function fillHotelsSheet(wb, { rows, showAirline }) {
  const ws = wb.addWorksheet("По гостиницам");
  const header = [
    "№ рейса",
    "№ заявки",
    "Дата рейса",
    ...(showAirline ? ["Авиакомпания"] : []),
    "Гостиница",
    "Чел.",
    "Суток",
    "Проживание",
    "Питание",
    "Примечание",
  ];
  const headerRow = ws.addRow(header);
  headerRow.font = { bold: true };

  for (const r of rows) {
    for (const h of r.hotels || []) {
      ws.addRow([
        r.flightNumber || r.requestNumber || "",
        r.requestNumber || "",
        r.flightDate ? formatDateRu(r.flightDate) : "",
        ...(showAirline ? [r.airlineName || ""] : []),
        h.hotelName || "",
        h.peopleCount || 0,
        ...(h.reportSaved
          ? [h.roomNights || 0, h.living || 0, h.meal || 0, ""]
          : ["", "", "", "нет отчёта"]),
      ]);
    }
  }

  const widths = [
    14, // № рейса
    16, // № заявки
    14, // Дата рейса
    ...(showAirline ? [24] : []),
    34, // Гостиница
    8, // Чел.
    10, // Суток
    14, // Проживание
    14, // Питание
    18, // Примечание
  ];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const nightsCol = showAirline ? 7 : 6;
  ws.getColumn(nightsCol).numFmt = "0.##";
  ws.getColumn(nightsCol + 1).numFmt = "#,##0";
  ws.getColumn(nightsCol + 2).numFmt = "#,##0";
}

function requestSheetPrefix(request, index) {
  const label =
    request?.requestNumber ||
    request?.flightNumber ||
    request?.id ||
    `Заявка ${index + 1}`;
  return String(label).trim();
}

// Полный отчёт: «Сводка — Аэропорты» → «Сводка — Авиакомпании» (нет у АК-роли,
// summaries.airline == null) → «Сводка — Месяцы» → «Заявки» → «По гостиницам».
export async function exportPassengerAnalyticsFullXlsx({
  rows,
  totals,
  summaries,
  showAirline,
  meta,
  detailRequests = [],
  user = null,
}) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();

  for (const s of SUMMARY_SHEETS) {
    const summaryRows = summaries?.[s.key];
    if (!summaryRows) continue;
    fillSummarySheet(wb, {
      sheetName: s.sheetName,
      dimensionLabel: s.dimensionLabel,
      summaryRows,
      totals,
      periodLabel: meta.periodLabel,
    });
  }
  fillRequestsSheet(wb, { rows, totals, showAirline, meta });
  fillHotelsSheet(wb, { rows, showAirline });

  const sheetNames = new Set(wb.worksheets.map((ws) => ws.name));
  detailRequests.forEach((request, index) => {
    if (!request) return;
    const livingEnabled = request?.livingService?.plan?.enabled;
    const arrEnabled = request?.transferService?.plan?.enabled;
    const depEnabled = request?.departureTransferService?.plan?.enabled;
    if (!livingEnabled && !arrEnabled && !depEnabled) return;
    addCombinedSheet(wb, {
      request: {
        ...request,
        requestNumber: request.requestNumber || rows[index]?.requestNumber,
        flightNumber: request.flightNumber || rows[index]?.flightNumber,
      },
      sheetNames,
      sheetPrefix: requestSheetPrefix(request, index),
      // Без !! отсутствующая услуга (arrEnabled и depEnabled оба undefined)
      // даёт includeTransfer: undefined, а дефолт деструктуризации в
      // addCombinedSheet (= true) включает пустой блок «Трансфер».
      includeTransfer: !!(arrEnabled || depEnabled),
      hotelIndexes: visibleHotelIndexes(request, user),
    });
  });

  await downloadWorkbook(wb, meta.fileName || "passenger_analytics.xlsx");
}
