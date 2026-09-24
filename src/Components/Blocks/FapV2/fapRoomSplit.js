// Тариф с режимом «Номер»: цена номера делится на число жильцов — это база «цена за
// сутки на человека», каждый платит базу × СВОИ сутки, а скидка гостя режет уже его
// долю (спека 2026-09-24, заменяет п. 1–3 §2 спеки 2026-09-07). Раньше сумма номера
// считалась по суткам НЕСУЩЕГО и делилась по суткам всех: при разных сутках соседей
// база рушилась (2 700 за 1 + 4,5 суток давала 490,9 + 2 209,1 вместо 1 350 + 6 075).

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n) => Math.round(n * 100) / 100;

// splitRoomAccommodation({ pricePerDay, carrierKey, members: [{ key, factor, days }] })
//   → { base, nominal, shares: { [key]: cost } } | null
//
// P = pricePerDay (цена номера за сутки). N — жильцы с сутками > 0 (кто реально жил).
// База B = round2(P / N) — одна на всех, это pricePerDay строки. Номинал номера без
// скидок nominal = round2(P × Σ D_i / N). Доля БЕЗ скидки gross_i = round2(B × D_i) для
// всех, кроме несущего; несущий получает остаток, так что Σ gross = nominal ровно.
// Итоговая строка shares_i = round2(gross_i × factor_i), где factor = 1 − скидка/100.
// Кто несущий, на деньги не влияет (кроме копеек остатка).
//
// null — делить нечего, только когда N = 0 (у всех нулевые сутки). Одни инфанты
// (factor 0) — НЕ фолбэк: база считается, все получают shares 0.
// Фолбэк на прежнее «всё на несущем» решает вызывающий: здесь нет ни номера,
// ни строк, только арифметика.
export function splitRoomAccommodation({ pricePerDay, carrierKey, members }) {
  const list = Array.isArray(members) ? members : [];
  const stayed = list.filter((m) => toNum(m.days) > 0);
  const n = stayed.length;
  if (n === 0) return null;

  const P = toNum(pricePerDay);
  const daysSum = stayed.reduce((s, m) => s + toNum(m.days), 0);
  const base = round2(P / n);
  const nominal = round2((P * daysSum) / n);

  // Доли БЕЗ скидки: Σ = nominal ровно, остаток копеек — несущему (иначе Σ разъезжается
  // при округлении каждой доли по отдельности).
  const gross = {};
  let rest = nominal;
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

  return { base, nominal, shares };
}
