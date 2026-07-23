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
    "Группы",
    "Проживание",
    "Питание",
    "Трансфер",
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
      r.groupsCount ? `${r.groupsCount} гр. · ${r.linkedPeopleCount} чел.` : "",
      r.costMissing ? "" : r.living || 0,
      r.costMissing ? "" : r.meal || 0,
      r.costMissing ? "" : r.transfer || 0,
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
    totals?.linkedPeopleCount || 0,
    totals?.living || 0,
    totals?.meal || 0,
    totals?.transfer || 0,
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
    18, // Группы
    14, // Проживание
    14, // Питание
    14, // Трансфер
    14, // Итого
    14, // Статус
    18, // Примечание
  ];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // Разделитель тысяч в денежных колонках (Проживание/Питание/Трансфер/Итого)
  const firstMoneyCol = showAirline ? 8 : 7;
  for (let c = firstMoneyCol; c < firstMoneyCol + 4; c++) {
    ws.getColumn(c).numFmt = "#,##0";
  }

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
