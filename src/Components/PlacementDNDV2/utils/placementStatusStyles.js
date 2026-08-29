// Ключи — русские статусы из translateStatus (не переименовывать!)
export const STATUS_STYLES = {
  Забронирован: { edge: "#4caf50", tint: "#e8f5e9" },
  Продлен: { edge: "#2196f3", tint: "#e3f2fd" },
  "Ранний заезд": { edge: "#9575cd", tint: "#ede7f6" },
  Перенесен: { edge: "#ff9800", tint: "#fff3e0" },
  Сокращен: { edge: "#f44336", tint: "#ffebee" },
  "Готов к архиву": { edge: "#638ea4", tint: "#e9f1f6" },
  Архив: { edge: "#3b653d", tint: "#e7ece7" },
};

const DEFAULT_STYLE = { edge: "#9e9e9e", tint: "#f5f5f5" };
const LEGACY_STYLE = { edge: "#c3c8d9", tint: "#f6f7fa" };

export const getStatusStyle = (status, isRequest = true) =>
  isRequest ? STATUS_STYLES[status] || DEFAULT_STYLE : LEGACY_STYLE;
