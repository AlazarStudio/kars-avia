// Единый бейдж истечения срока для договоров и доп. соглашений (ДС).
// Принимает бэковые isExpired/daysUntilEnd, если они есть, с фолбэком на
// локальный расчёт от даты окончания. Порог "истекает скоро" — 90 дней.
// Возвращает null | { label, color, bg, textColor }:
//   color     — насыщенный цвет маркера (левая полоса строки + точка капсулы)
//   bg        — фон капсулы-пилюли
//   textColor — цвет текста капсулы
export function getExpirationBadge({ endDate, isExpired, daysUntilEnd } = {}) {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end - now;
  const days =
    typeof daysUntilEnd === "number"
      ? daysUntilEnd
      : Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const expired = typeof isExpired === "boolean" ? isExpired : diffMs <= 0;
  if (expired)
    return { label: "Истёк", color: "#C03B28", bg: "#FBEAE7", textColor: "#B4321F" };
  if (days <= 90)
    return {
      label: `Истекает · ${days} дн.`,
      color: "#E8A33D",
      bg: "#FBF0E0",
      textColor: "#A96A12",
    };
  return null;
}
