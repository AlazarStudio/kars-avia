// Русский плюрал существительного по числу: forms = [1, 2–4, 5+].
//
// Правило было объявлено локально в `ManifestUploadField` («пассажир/пассажира/
// пассажиров», «инфант/инфанта/инфантов»); вынесено сюда, когда счётчики реестра
// начали называть единицы («1 инфант», а не «1 инфантов»).
export const plural = (n, forms) => {
  const value = Math.abs(Number(n) || 0);
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};
