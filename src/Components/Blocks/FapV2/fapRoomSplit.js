// Тариф с режимом «Номер»: цена номера делится ПОРОВНУ ПО СУТКАМ между заселёнными,
// а скидка каждого гостя режет уже его долю (спека 2026-09-07, заменяет §3 спеки
// 2026-09-02). Раньше вся сумма номера была неприкосновенна: скидка ребёнка ничего
// не экономила, а лишь перераспределялась на соседей. Теперь — как в «Койко-месте»:
// у каждого своя база, скидка её уменьшает, итог номера падает.

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n) => Math.round(n * 100) / 100;

// splitRoomAccommodation({ total, carrierKey, members: [{ key, factor, days }] })
//   → { base, shares: { [key]: cost } } | null
//
// T = total (цена номера × сутки несущего, как и раньше). База B = round2(T / Σ D_i)
// по ВСЕМ жильцам номера, инфанты не исключаются. Доля БЕЗ скидки gross_i = round2(B × D_i)
// для всех, кроме несущего; несущий получает остаток, так что Σ gross = T ровно.
// Итоговая строка shares_i = round2(gross_i × factor_i), где factor = 1 − скидка/100.
// Итог номера = Σ shares ≤ T — скидки его уменьшают, а не перераспределяют.
//
// null — делить нечего, только когда Σ D_i = 0 (у всех нулевые сутки). Одни инфанты
// (factor 0) — НЕ фолбэк: база считается, все получают shares 0.
// Фолбэк на прежнее «всё на несущем» решает вызывающий: здесь нет ни номера,
// ни строк, только арифметика.
export function splitRoomAccommodation({ total, carrierKey, members }) {
  const list = Array.isArray(members) ? members : [];
  const daysSum = list.reduce((s, m) => s + toNum(m.days), 0);
  if (!(daysSum > 0)) return null;

  const T = toNum(total);
  const base = round2(T / daysSum);

  // Доли БЕЗ скидки: Σ = T ровно, остаток копеек — несущему (иначе Σ разъезжается
  // с T при округлении каждой доли по отдельности).
  const gross = {};
  let rest = T;
  list.forEach((m) => {
    if (m.key === carrierKey) return;
    const g = round2(base * toNum(m.days));
    gross[m.key] = g;
    rest -= g;
  });
  gross[carrierKey] = round2(rest);

  const shares = {};
  list.forEach((m) => {
    shares[m.key] = round2((gross[m.key] ?? 0) * toNum(m.factor));
  });
  if (!(carrierKey in shares)) shares[carrierKey] = gross[carrierKey]; // как сегодня: несущий вне списка всё равно получает остаток

  return { base, shares };
}
