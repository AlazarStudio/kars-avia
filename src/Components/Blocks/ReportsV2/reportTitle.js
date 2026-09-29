// Короткое название реестра для строки списка: «Реестр · Азимут · Минеральные Воды».
// Полный заголовок (ячейка A4 файла) бэк собирает одним шаблоном
// (services/report/reportPresentation.js → buildReportTitle): имя организации в
// кавычках, у авиакомпании после него — «в г. <город>». Имя берём между ПЕРВОЙ и
// ПОСЛЕДНЕЙ кавычкой: у названий вида ООО "Азимут 2000" внутри свои кавычки.
// Город ищем только после имени. Не разобрали — null: строка покажет полный заголовок.
export function shortReportTitle(title) {
  if (typeof title !== "string") return null;
  const name = title.match(/"(.*)"/)?.[1]?.trim();
  if (!name) return null;
  const tail = title.slice(title.lastIndexOf('"') + 1);
  const city = tail.match(/в г\.\s*(.*)$/)?.[1]?.trim();
  return ["Реестр", name, city].filter(Boolean).join(" · ");
}
