const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Эффективные сутки по заезду/выезду с учётом частичных суток (0.5 и 1).
 * Базовые сутки — полные календарные дни между датами заезда и выезда.
 * Дополнительно:
 * - Заезд: до 06:00 → +1 сутки, до 14:00 → +0.5 суток, 00:10 → 0.
 * - Выезд: после 12:00 → +0.5 суток, после 18:00 или 23:50 → +1 сутки.
 *
 * @param {string|Date} arrivalStr - дата/время заезда (ISO или Date)
 * @param {string|Date} departureStr - дата/время выезда (ISO или Date)
 * @returns {number} эффективное количество суток (>= 0)
 */
export function calculateEffectiveCostDays(arrivalStr, departureStr) {
  const arrival = arrivalStr instanceof Date ? arrivalStr : new Date(arrivalStr);
  const departure = departureStr instanceof Date ? departureStr : new Date(departureStr);

  if (!arrivalStr || !departureStr || isNaN(arrival.getTime()) || isNaN(departure.getTime())) {
    return 0;
  }

  const arrivalYMD = new Date(arrival.getFullYear(), arrival.getMonth(), arrival.getDate());
  const departureYMD = new Date(departure.getFullYear(), departure.getMonth(), departure.getDate());

  const baseDays = Math.max(
    0,
    Math.floor((departureYMD - arrivalYMD) / MS_PER_DAY)
  );

  let arrivalAdjust = 0;
  const arrivalMinutes = arrival.getHours() * 60 + arrival.getMinutes();

  if (arrival.getHours() === 0 && arrival.getMinutes() === 10) {
    arrivalAdjust = 0;
  } else if (arrivalMinutes < 6 * 60) {
    arrivalAdjust = 1;
  } else if (arrivalMinutes < 14 * 60) {
    arrivalAdjust = 0.5;
  }

  let departureAdjust = 0;
  const departureMinutes = departure.getHours() * 60 + departure.getMinutes();

  if (departure.getHours() === 23 && departure.getMinutes() === 50) {
    departureAdjust = 1;
  } else if (departureMinutes >= 18 * 60) {
    departureAdjust = 1;
  } else if (departureMinutes > 12 * 60) {
    departureAdjust = 0.5;
  }

  const total = baseDays + arrivalAdjust + departureAdjust;
  const result = total < 0 ? 0 : total;
  return Math.round(result * 100) / 100;
}
