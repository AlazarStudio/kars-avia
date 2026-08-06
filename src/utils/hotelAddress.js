// Полный адрес гостиницы для подстановки в заявку и в маршрут водителя.
//
// В справочнике город и улица лежат РАЗДЕЛЬНО (`information.city` и
// `information.address`), и в заявку копировалась только улица. Дальше этот
// обрезанный адрес уходил в поле водителя и в карту PWA, где геокодер ставил
// метку наугад: «ул. Кирова, 114, стр. 1» без города не разрешается.
// Замер стенда: город заполнен у всех 200 гостиниц справочника, а внутри строки
// адреса встречается лишь у 26 — то есть потеря была правилом, а не исключением.
//
// Город приписывается СПЕРЕДИ, как в подписи карточки гостиницы
// (`HotelSettings_tabComponent`), и только если его там ещё нет.
export const composeHotelAddress = (information) => {
  const city = String(information?.city ?? "").trim();
  const address = String(information?.address ?? "").trim();

  if (!city) return address;
  if (!address) return city;

  // Адрес уже с городом — второй раз не приписываем. Сравнение по подстроке без
  // учёта регистра: в справочнике встречается и «Абакан», и «г. Абакан».
  const haystack = address.toLowerCase();
  const needle = city.toLowerCase();
  if (haystack.includes(needle)) return address;

  return `${city}, ${address}`;
};
