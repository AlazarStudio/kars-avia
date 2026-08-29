// Занятые дорожки: уникальные position среди размещённых броней комнаты
export const countOccupiedLanes = (requests = []) =>
  new Set(requests.map((r) => r.position).filter((p) => p != null)).size;

// «ждёт N дн» для карточки лотка. now передаётся снаружи (тестируемость).
export const waitBadge = (createdAtISO, nowMs) => {
  if (!createdAtISO) return { label: "новая", edge: "#6b7090", tint: "#eef1f7" };
  const days = Math.floor((nowMs - new Date(createdAtISO).getTime()) / 86400000);
  if (days <= 0) return { label: "новая", edge: "#6b7090", tint: "#eef1f7" };
  const label = `ждёт ${days} дн`;
  if (days >= 4) return { label, edge: "#C03B28", tint: "#faeae6" };
  return { label, edge: "#b26a00", tint: "#fdf1dc" };
};

// «2 кровати» с русским склонением
export const bedsLabel = (n) => {
  if (!n) return "";
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "кровать"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "кровати"
        : "кроватей";
  return `${n} ${word}`;
};
