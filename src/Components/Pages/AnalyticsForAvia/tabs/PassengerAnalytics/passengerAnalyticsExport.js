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

function fillSummarySheet(wb, { sheetName, dimensionLabel, summaryRows, totals, periodLabel, showWaterMeal }) {
  const ws = wb.addWorksheet(sheetName);
  ws.addRow([`Сводка ФАП — ${dimensionLabel}`]);
  ws.addRow([`Период: ${periodLabel}`]);
  ws.addRow([]);
  const header = [
    dimensionLabel,
    "Заявок",
    "Отменено",
    "Чел.",
    "Дети",
    "Млад.",
    "Суток",
    "Проживание",
    "Питание в гостинице",
    "Трансфер",
    ...(showWaterMeal ? ["Вода и питание"] : []),
    "Итого",
    "Без стоимости",
  ];
  const headerRow = ws.addRow(header);
  headerRow.font = { bold: true };
  for (const g of summaryRows) {
    ws.addRow([
      g.label,
      g.requestsCount,
      g.cancelledCount,
      g.peopleCount,
      g.childrenCount,
      g.infantsCount,
      g.roomNights,
      g.living,
      g.meal,
      g.transfer,
      ...(showWaterMeal ? [g.waterMeal] : []),
      g.total,
      g.missingCostCount,
    ]);
  }
  ws.addRow([]);
  const totalRow = ws.addRow([
    "ИТОГО",
    totals?.requestsCount || 0,
    totals?.cancelledCount || 0,
    totals?.peopleCount || 0,
    totals?.childrenCount || 0,
    totals?.infantsCount || 0,
    totals?.roomNights || 0,
    totals?.living || 0,
    totals?.meal || 0,
    totals?.transfer || 0,
    ...(showWaterMeal ? [totals?.waterMeal || 0] : []),
    totals?.total || 0,
    totals?.missingCostCount || 0,
  ]);
  totalRow.font = { bold: true };
  const widths = [24, 10, 10, 8, 8, 8, 10, 14, 18, 14, ...(showWaterMeal ? [16] : []), 14, 14];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
  // Деньги — с «Проживания» (8) по «Итого»; «Суток» (7) — дробное.
  const moneyCount = showWaterMeal ? 5 : 4;
  for (let c = 8; c < 8 + moneyCount; c++) {
    ws.getColumn(c).numFmt = "#,##0";
  }
  ws.getColumn(7).numFmt = "0.##";
}

function fillRequestsSheet(wb, { rows, totals, showAirline, showWaterMeal, meta }) {
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
    "Питание в гостинице",
    "Трансфер",
    "Трансфер прилёт",
    "Трансфер вылет",
    "Багаж",
    ...(showWaterMeal ? ["Вода и питание"] : []),
    "Итого",
    "Статус",
    "Примечание",
  ];
  const headerRow = ws.addRow(header);
  headerRow.font = { bold: true };

  for (const r of rows) {
    // Отменённая — без денег вовсе; «нет отчёта» — без гостиничных денег,
    // трансфер и поставка у неё реальны (решения владельца 05.10.2026).
    const cancelled = r.status === "CANCELLED";
    const money = (v) => (cancelled ? "" : v || 0);
    const hotelMoney = (v) => (cancelled || r.costMissing ? "" : v || 0);
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
      hotelMoney(r.living),
      hotelMoney(r.meal),
      money(r.transfer),
      money(r.transferArrival),
      money(r.transferDeparture),
      money(r.transferBaggage),
      ...(showWaterMeal ? [money(r.waterMeal)] : []),
      money(r.total),
      statusLabel(r.status),
      cancelled ? "отменена" : r.costMissing ? "нет отчёта" : "",
    ]);
  }

  ws.addRow([]);
  const totalNote = [
    totals?.missingCostCount ? `без стоимости: ${totals.missingCostCount}` : "",
    totals?.cancelledCount ? `отменено: ${totals.cancelledCount}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
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
    ...(showWaterMeal ? [totals?.waterMeal || 0] : []),
    totals?.total || 0,
    "",
    totalNote,
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
    18, // Питание в гостинице
    14, // Трансфер
    16, // Трансфер прилёт
    16, // Трансфер вылет
    12, // Багаж
    ...(showWaterMeal ? [16] : []), // Вода и питание
    14, // Итого
    14, // Статус
    24, // Примечание
  ];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // Денежный блок подряд (Проживание…Итого): 7 колонок, с «Водой и питанием» — 8;
  // «Суток» — дробное перед ними.
  const firstMoneyCol = showAirline ? 13 : 12;
  const moneyCount = showWaterMeal ? 8 : 7;
  for (let c = firstMoneyCol; c < firstMoneyCol + moneyCount; c++) {
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
    "Питание в гостинице",
    "Примечание",
  ];
  const headerRow = ws.addRow(header);
  headerRow.font = { bold: true };

  for (const r of rows) {
    const cancelled = r.status === "CANCELLED";
    for (const h of r.hotels || []) {
      ws.addRow([
        r.flightNumber || r.requestNumber || "",
        r.requestNumber || "",
        r.flightDate ? formatDateRu(r.flightDate) : "",
        ...(showAirline ? [r.airlineName || ""] : []),
        h.hotelName || "",
        h.peopleCount || 0,
        ...(cancelled
          ? [h.roomNights || 0, "", "", "отменена"]
          : h.reportSaved
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
    18, // Питание в гостинице
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
  showWaterMeal = false,
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
      showWaterMeal,
    });
  }
  fillRequestsSheet(wb, { rows, totals, showAirline, showWaterMeal, meta });
  fillHotelsSheet(wb, { rows, showAirline });

  const sheetNames = new Set(wb.worksheets.map((ws) => ws.name));
  detailRequests.forEach((request, index) => {
    // Отменённая заявка — без листа детализации (только строкой «Заявок»).
    if (!request || rows[index]?.status === "CANCELLED") return;
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
      // Детализация аналитики — прежняя «Сводка»: компактный трансфер и подписи
      // без «(без НДС)» (решение владельца 10.09.2026).
      legacyLayout: true,
    });
  });

  await downloadWorkbook(wb, meta.fileName || "passenger_analytics.xlsx");
}
