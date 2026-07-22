// Подсказки групп пассажиров из манифеста (фронт-only, без персиста).
// Строгие правила без скоринга: предлагаем только однофамильцев на соседних
// местах (HIGH-1) и связку «ребёнок + взрослый однофамилец» (HIGH-2).
// НЕ предлагаем: фамильные пары без соседства мест и блоки мест незнакомцев.

import { manifestNameKey } from "./manifestCore.js";

// Стем фамилии — первый токен ФИО в той же нормализации, что и матчинг манифеста.
export const surnameStem = (fullName) =>
  manifestNameKey(fullName).split(" ")[0] || "";

const CYRILLIC_RE = /[а-яё]/;

// Равенство стемов: точное совпадение либо (только кириллица) женское окончание
// «а»/«ва» (Иванов ↔ Иванова, Кузнецов ↔ Кузнецова). Латиница — строго точное.
export const sameStem = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  if (!CYRILLIC_RE.test(a) || !CYRILLIC_RE.test(b)) return false;
  return a === `${b}а` || a === `${b}ва` || b === `${a}а` || b === `${a}ва`;
};

const SEAT_RE = /^(\d+)\s*([A-ZА-ЯЁ])$/i;

const parseSeat = (seat) => {
  const match = SEAT_RE.exec(String(seat ?? "").trim());
  if (!match) return null;
  return { row: Number(match[1]), letter: match[2].toUpperCase() };
};

const isKid = (person) =>
  person?.personCategory === "CHILD" || person?.personCategory === "INFANT";

// Диапазон мест кластера для текста причины: «места 12A–12C» / «место 12A».
const seatsLabel = (nodes) => {
  const seats = nodes
    .filter((n) => n.seat)
    .sort((a, b) => a.seat.row - b.seat.row || a.seat.letter.localeCompare(b.seat.letter))
    .map((n) => `${n.seat.row}${n.seat.letter}`);
  const unique = [...new Set(seats)];
  if (unique.length === 0) return "";
  if (unique.length === 1) return `место ${unique[0]}`;
  return `места ${unique[0]}–${unique[unique.length - 1]}`;
};

/**
 * Подсказки групп по списку пассажиров БЕЗ группы.
 * @param {Array} people savedPassengers без группы
 * @returns {Array<{ key, members, reason, kind }>} кластеры size >= 2
 */
export function suggestPassengerGroups(people) {
  const nodes = (Array.isArray(people) ? people : [])
    .filter((p) => p?.personId)
    .map((p) => ({
      person: p,
      stem: surnameStem(p.fullName),
      seat: parseSeat(p.seat),
      kid: isKid(p),
    }))
    .filter((n) => n.stem);

  const parent = nodes.map((_, i) => i);
  const find = (i) => {
    let root = i;
    while (parent[root] !== root) root = parent[root];
    while (parent[i] !== root) {
      const next = parent[i];
      parent[i] = root;
      i = next;
    }
    return root;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  // Кластеры с ребёнком помечаем — у них другая формулировка причины.
  const kidLinked = new Set();

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      if (!sameStem(a.stem, b.stem)) continue;

      // HIGH-2: ребёнок/инфант + взрослый однофамилец — места не важны.
      if ((a.kid && !b.kid) || (b.kid && !a.kid)) {
        union(i, j);
        kidLinked.add(i);
        kidLinked.add(j);
        continue;
      }

      // HIGH-1: однофамильцы на соседних рядах.
      if (a.seat && b.seat && Math.abs(a.seat.row - b.seat.row) <= 1) union(i, j);
    }
  }

  const byRoot = new Map();
  nodes.forEach((node, i) => {
    const root = find(i);
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push({ node, index: i });
  });

  const clusters = [];
  byRoot.forEach((items) => {
    if (items.length < 2) return;
    const members = items.map((it) => it.node.person);
    const hasKid = items.some((it) => kidLinked.has(it.index));
    const seats = seatsLabel(items.map((it) => it.node));
    clusters.push({
      key: members
        .map((m) => m.personId)
        .sort()
        .join("|"),
      members,
      reason: hasKid
        ? "ребёнок + однофамилец"
        : ["однофамильцы", seats].filter(Boolean).join(", "),
      kind: "FAMILY",
    });
  });

  return clusters;
}
