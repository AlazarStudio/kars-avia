// Тариф с режимом «Номер»: цена номера делится между заселёнными по их скидкам
// (спека 2026-09-02 §3). Раньше вся сумма висела на «несущем» госте, а у соседей
// в строках были нули — из-за них в отчёте и книге пустели «Цена за сутки» и
// «Скидка», хотя жильцов в номере несколько.
//
// Сумма номера при делении НЕ меняется: T = цена × сутки несущего, как и было, —
// перераспределяется только раскладка по строкам.

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n) => Math.round(n * 100) / 100;

// splitRoomAccommodation({ total, carrierKey, members: [{ key, factor, days }] })
//   → { base, shares: { [key]: cost } } | null
//
// base B = T / Σ(f_i × D_i) — цена за сутки «полного» гостя: взрослый без скидки
// платит B за сутки, ребёнок со скидкой 50% — половину. Деление ведём по СУТКАМ
// каждого гостя, а не по головам: у соседей сутки бывают разные, и без множителя
// D_i сумма долей разошлась бы с T.
//
// null — делить нечего (Σ = 0: одни инфанты со 100% скидкой, нулевые сутки).
// Фолбэк на прежнее «всё на несущем» решает вызывающий: здесь нет ни номера,
// ни строк, только арифметика.
export function splitRoomAccommodation({ total, carrierKey, members }) {
  const list = Array.isArray(members) ? members : [];
  const weight = list.reduce((s, m) => s + toNum(m.factor) * toNum(m.days), 0);
  if (!(weight > 0)) return null;

  const base = round2(toNum(total) / weight);
  const shares = {};
  // Остаток копеек кладём НЕСУЩЕМУ: доли округляются каждая сама по себе, и без
  // этого Σ долей разъезжается с T — а T печатается в «Итого» книги и стоит
  // чипом на шапке номера.
  let rest = toNum(total);
  list.forEach((m) => {
    if (m.key === carrierKey) return;
    const cost = round2(base * toNum(m.factor) * toNum(m.days));
    shares[m.key] = cost;
    rest -= cost;
  });
  shares[carrierKey] = round2(rest);
  return { base, shares };
}
