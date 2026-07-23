// XLSX-экспорт свода пассажиров (exceljs, динамический импорт как в reports/buildReportSheets.js)
import { REQUEST_STATUS_CONFIG } from "../../../../Blocks/FapV2/fapConstants";
import { formatDateRu } from "./passengerAnalyticsMappers";

const statusLabel = (code) => REQUEST_STATUS_CONFIG?.[code]?.label || code || "";

export async function exportPassengerAnalyticsXlsx({ rows, totals, showAirline, meta }) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Пассажиры");

  ws.addRow(["Сводный отчёт ФАП — пассажиры"]);
  ws.addRow([`Период: ${meta.periodLabel}`]);
  if (meta.airlineName) ws.addRow([`Авиакомпания: ${meta.airlineName}`]);
  ws.addRow([]);

  const header = [
    "№ рейса",
    "Дата рейса",
    ...(showAirline ? ["Авиакомпания"] : []),
    "Аэропорт",
    "Гостиница(ы)",
    "Чел.",
    "Взр.",
    "Дети",
    "Млад.",
    "Группы",
    "Ночей",
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

  // Ширины колонок (порядок = header)
  const widths = [
    14, // № рейса
    14, // Дата рейса
    ...(showAirline ? [24] : []),
    12, // Аэропорт
    34, // Гостиница(ы)
    8, // Чел.
    8, // Взр.
    8, // Дети
    8, // Млад.
    18, // Группы
    10, // Ночей
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

  // Числовые форматы: денежный блок — 7 колонок подряд (Проживание…Итого),
  // «Ночей» — дробное перед ними.
  const firstMoneyCol = showAirline ? 12 : 11;
  for (let c = firstMoneyCol; c < firstMoneyCol + 7; c++) {
    ws.getColumn(c).numFmt = "#,##0";
  }
  ws.getColumn(firstMoneyCol - 1).numFmt = "0.##"; // Ночей

  // ── Лист 2: По гостиницам ──
  const ws2 = wb.addWorksheet("По гостиницам");
  const header2 = [
    "№ рейса",
    "Дата рейса",
    ...(showAirline ? ["Авиакомпания"] : []),
    "Гостиница",
    "Чел.",
    "Ночей",
    "Проживание",
    "Питание",
    "Примечание",
  ];
  const header2Row = ws2.addRow(header2);
  header2Row.font = { bold: true };

  for (const r of rows) {
    for (const h of r.hotels || []) {
      ws2.addRow([
        r.flightNumber || r.requestNumber || "",
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

  const widths2 = [
    14, // № рейса
    14, // Дата рейса
    ...(showAirline ? [24] : []),
    34, // Гостиница
    8, // Чел.
    10, // Ночей
    14, // Проживание
    14, // Питание
    18, // Примечание
  ];
  widths2.forEach((w, i) => {
    ws2.getColumn(i + 1).width = w;
  });

  const nightsCol2 = showAirline ? 6 : 5;
  ws2.getColumn(nightsCol2).numFmt = "0.##"; // Ночей
  ws2.getColumn(nightsCol2 + 1).numFmt = "#,##0"; // Проживание
  ws2.getColumn(nightsCol2 + 2).numFmt = "#,##0"; // Питание

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = meta.fileName || "passenger_analytics.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
