// Ключи — русские статусы из translateStatus (не переименовывать!)
export const STATUS_STYLES = {
  Забронирован: { edge: "#2e7d32", tint: "#e8f5e9" },
  Продлен: { edge: "#0057C3", tint: "#e7effa" },
  "Ранний заезд": { edge: "#6f57b8", tint: "#efeaf9" },
  Перенесен: { edge: "#b26a00", tint: "#fdf1dc" },
  Сокращен: { edge: "#C03B28", tint: "#faeae6" },
  "Готов к архиву": { edge: "#46748f", tint: "#e9f1f6" },
  Архив: { edge: "#454b63", tint: "#eceef4" },
};

const DEFAULT_STYLE = { edge: "#6b7090", tint: "#eef1f7" };
const LEGACY_STYLE = { edge: "#c3c8d9", tint: "#f6f7fa" };

export const getStatusStyle = (status, isRequest = true) =>
  isRequest ? STATUS_STYLES[status] || DEFAULT_STYLE : LEGACY_STYLE;
