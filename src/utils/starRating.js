// Рейтинг и звёздность гостиницы приходят с бэка строками, причём в данных
// встречаются оба десятичных разделителя («4.5» и «4,5»), а также текст («Нет»).
// Один парсер для редактора (StarRatingFilter) и просмотра (StarRow в карточке
// гостиницы), чтобы карточка не показывала 0 звёзд там, где редактор показывает 4,5.
export const parseStarValue = (value) => {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
};

// Доли заливки для ряда звёзд: 4.5 → [1, 1, 1, 1, 0.5], 4.7 → [1, 1, 1, 1, 0.7].
// Одна формула для редактора (StarRatingFilter) и карточки (StarRow), значение
// парсится через parseStarValue (понимает и «4,5»); доля округлена до сотых.
export const starFractions = (value, max = 5) => {
  const n = parseStarValue(value);
  return Array.from({ length: max }, (_, i) =>
    Math.round(Math.max(0, Math.min(1, n - i)) * 100) / 100
  );
};
