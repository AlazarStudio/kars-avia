// Форматирование дат и времени из ячеек xlsx. Модуль намеренно БЕЗ зависимостей,
// чтобы его можно было прогонять через node --test напрямую: импорт xlsx в node
// не отдаёт XLSX.SSF, и всё, что его трогает, становится непроверяемым.
// Ячейка приходит строкой ("15.06.2026"), Excel-серийником (45931) или Date.

const pad = (n) => String(n).padStart(2, "0");
const s = (v) => String(v ?? "").trim();

// Excel-серийник → компоненты даты и времени.
// Эпоха Excel — 30.12.1899. В Excel 1900 год ошибочно считается високосным
// (наследие Lotus 1-2-3), поэтому серийник 60 — несуществующее 29.02.1900,
// и для значений до него сдвиг на день меньше.
export const excelSerialToParts = (serial) => {
  if (!Number.isFinite(serial)) return null;
  const whole = Math.floor(serial);
  // Дробная часть — доля суток. Округляем до секунды: 0.024305555… суток это
  // ровно 2100 с, без округления вышло бы 00:34 вместо 00:35.
  let seconds = Math.round((serial - whole) * 86400);
  let days = whole;
  if (seconds >= 86400) {
    seconds -= 86400;
    days += 1;
  }
  const epoch = days > 60 ? Date.UTC(1899, 11, 30) : Date.UTC(1899, 11, 31);
  const date = new Date(epoch + days * 86400000);
  return {
    y: date.getUTCFullYear(),
    m: date.getUTCMonth() + 1,
    d: date.getUTCDate(),
    H: Math.floor(seconds / 3600),
    M: Math.floor((seconds % 3600) / 60),
    S: seconds % 60,
  };
};

export const fmtDate = (v) => {
  if (typeof v === "number") {
    const d = excelSerialToParts(v);
    if (d) return `${pad(d.d)}.${pad(d.m)}.${d.y}`;
  }
  if (v instanceof Date) {
    return `${pad(v.getDate())}.${pad(v.getMonth() + 1)}.${v.getFullYear()}`;
  }
  return s(v);
};

export const fmtTime = (v) => {
  if (typeof v === "number") {
    const d = excelSerialToParts(v);
    if (d) return `${pad(d.H)}:${pad(d.M)}`;
  }
  if (v instanceof Date) {
    return `${pad(v.getHours())}:${pad(v.getMinutes())}`;
  }
  return s(v);
};
