const MS_DAY = 24 * 60 * 60 * 1000;

// request: {checkInDate, checkInTime, checkOutDate, checkOutTime}
// period: {start, end}; dayW: px. Возвращает null, если бронь вне периода.
export const layoutBar = (request, period, dayW) => {
  const checkIn = new Date(`${request.checkInDate}T${request.checkInTime}`);
  const checkOut = new Date(`${request.checkOutDate}T${request.checkOutTime}`);
  // period.end от date-fns (endOfMonth/endOfWeek) — это 23:59:59.999 последнего
  // дня, а не его начало. Исключающая граница = следующая миллисекунда, то есть
  // 00:00 следующих суток. Прибавлять MS_DAY нельзя — это дало бы лишний день
  // сетки (плашка вылезала бы за месяц, а клипы гасли на сутки позже).
  const periodEndExclusive = new Date(period.end.getTime() + 1);
  if (checkOut <= period.start || checkIn >= periodEndExclusive) return null;

  const clipL = checkIn < period.start;
  const clipR = checkOut > periodEndExclusive;
  const from = clipL ? period.start : checkIn;
  const to = clipR ? periodEndExclusive : checkOut;
  const left = ((from - period.start) / MS_DAY) * dayW;
  const width = Math.max(((to - from) / MS_DAY) * dayW - 3, 14);
  return {
    left,
    width,
    clipL,
    clipR,
    clipLLabel: clipL ? fmtShort(checkIn) : null,
    clipRLabel: clipR ? fmtShort(checkOut) : null,
  };
};

const fmtShort = (d) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
