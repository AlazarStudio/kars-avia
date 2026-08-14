/**
 * Единый справочник категорий номера — зеркало энума `Category` на бэкенде
 * (`typeDefs/hotel/hotel.typeDef.js`).
 *
 * До этого модуля один и тот же словарь лежал шестью копиями (номерной фонд,
 * `ExistRequest`, `fapRooms`, две формы тарифа гостиницы, `fapAirlineTariff`) и
 * успел разъехаться: где-то не было «Комфорта», где-то — девяти- и
 * десятиместных, подписи цен дублировались ещё в четырёх формах авиакомпании.
 * Здесь список один, а экраны берут из него нужное подмножество.
 *
 * ⚠️ `places` и `priceField` — не догадки по названию, а копия серверных карт
 * `services/hotel/roomUtils.js → categoryToPlaces` и
 * `services/airline/resolvePriceByHotelLocation.js → getCategoryPriceFromContract`.
 * Расходиться с ними нельзя: по первой считается вместимость номера, по второй —
 * цена проживания по договору авиакомпании.
 *
 * Порядок записей — порядок отображения в формах цен авиакомпании.
 */

/**
 * @typedef {object} RoomCategory
 * @property {string} value        ключ энума Category
 * @property {string} label        подпись категории («Одноместный»)
 * @property {string} shortLabel   короткая подпись для плотных списков ФАП («1-местный»)
 * @property {number} places       вместимость по серверной карте
 * @property {?number} statedPlaces вместимость, названная в самой категории (см. ниже)
 * @property {string} priceField   поле в AirlinePrice.prices
 * @property {string} priceTitle   подпись поля в формах цен («Стоимость одноместного»)
 * @property {"room"|"apartment"} group тип объекта, к которому относится категория
 */

/** @type {RoomCategory[]} */
export const ROOM_CATEGORIES = [
  { value: "onePlace", label: "Одноместный", shortLabel: "1-местный", places: 1, statedPlaces: 1, priceField: "priceOneCategory", priceTitle: "Стоимость одноместного", group: "room" },
  { value: "twoPlace", label: "Двухместный", shortLabel: "2-местный", places: 2, statedPlaces: 2, priceField: "priceTwoCategory", priceTitle: "Стоимость двухместного", group: "room" },
  { value: "threePlace", label: "Трехместный", shortLabel: "3-местный", places: 3, statedPlaces: 3, priceField: "priceThreeCategory", priceTitle: "Стоимость трехместного", group: "room" },
  { value: "fourPlace", label: "Четырехместный", shortLabel: "4-местный", places: 4, statedPlaces: 4, priceField: "priceFourCategory", priceTitle: "Стоимость четырехместного", group: "room" },
  { value: "fivePlace", label: "Пятиместный", shortLabel: "5-местный", places: 5, statedPlaces: 5, priceField: "priceFiveCategory", priceTitle: "Стоимость пятиместного", group: "room" },
  { value: "sixPlace", label: "Шестиместный", shortLabel: "6-местный", places: 6, statedPlaces: 6, priceField: "priceSixCategory", priceTitle: "Стоимость шестиместного", group: "room" },
  { value: "sevenPlace", label: "Семиместный", shortLabel: "7-местный", places: 7, statedPlaces: 7, priceField: "priceSevenCategory", priceTitle: "Стоимость семиместного", group: "room" },
  { value: "eightPlace", label: "Восьмиместный", shortLabel: "8-местный", places: 8, statedPlaces: 8, priceField: "priceEightCategory", priceTitle: "Стоимость восьмиместного", group: "room" },
  { value: "ninePlace", label: "Девятиместный", shortLabel: "9-местный", places: 9, statedPlaces: 9, priceField: "priceNineCategory", priceTitle: "Стоимость девятиместного", group: "room" },
  { value: "tenPlace", label: "Десятиместный", shortLabel: "10-местный", places: 10, statedPlaces: 10, priceField: "priceTenCategory", priceTitle: "Стоимость десятиместного", group: "room" },
  { value: "luxe", label: "Люкс", shortLabel: "Люкс", places: 2, statedPlaces: null, priceField: "priceLuxe", priceTitle: "Стоимость люкса", group: "room" },
  { value: "comfort", label: "Комфорт", shortLabel: "Комфорт", places: 2, statedPlaces: null, priceField: "priceComfort", priceTitle: "Стоимость комфорт", group: "room" },
  { value: "improvedComfort", label: "Улучшенный комфорт", shortLabel: "Улучшенный комфорт", places: 2, statedPlaces: null, priceField: "priceImprovedComfort", priceTitle: "Стоимость улучшенный комфорт", group: "room" },
  { value: "economySingle", label: "Эконом одноместный", shortLabel: "Эконом 1-местный", places: 1, statedPlaces: 1, priceField: "priceEconomySingle", priceTitle: "Стоимость эконом одноместного", group: "room" },
  { value: "standardSingle", label: "Стандарт одноместный", shortLabel: "Стандарт 1-местный", places: 1, statedPlaces: 1, priceField: "priceStandardSingle", priceTitle: "Стоимость стандарт одноместного", group: "room" },
  { value: "standardDouble", label: "Стандарт дабл", shortLabel: "Стандарт дабл", places: 2, statedPlaces: 2, priceField: "priceStandardDouble", priceTitle: "Стоимость стандарт дабл", group: "room" },
  { value: "deluxe", label: "Делюкс", shortLabel: "Делюкс", places: 2, statedPlaces: null, priceField: "priceDeluxe", priceTitle: "Стоимость делюкс", group: "room" },
  { value: "apartment", label: "Апартаменты", shortLabel: "Апартаменты", places: 2, statedPlaces: null, priceField: "priceApartment", priceTitle: "Стоимость апартаментов", group: "apartment" },
  { value: "studio", label: "Студия", shortLabel: "Студия", places: 2, statedPlaces: null, priceField: "priceStudio", priceTitle: "Стоимость студии", group: "apartment" },
];

const byValue = new Map(ROOM_CATEGORIES.map((c) => [c.value, c]));

const dictionary = (field) =>
  Object.fromEntries(ROOM_CATEGORIES.map((c) => [c.value, c[field]]));

/** value → подпись. */
export const CATEGORY_LABELS = dictionary("label");

/** value → короткая подпись. */
export const CATEGORY_SHORT_LABELS = dictionary("shortLabel");

/** value → поле цены в ценнике авиакомпании. */
export const CATEGORY_TO_PRICE_FIELD = dictionary("priceField");

/** value → вместимость по серверной карте (для всех категорий). */
export const CATEGORY_PLACES = dictionary("places");

/**
 * value → вместимость ТОЛЬКО там, где число названо в самой категории
 * («Трехместный», «Стандарт дабл»). У «Люкса», «Делюкса», «Комфорта»,
 * апартаментов и студии ключа нет: у них серверные 2 места — это дефолт, а не
 * факт о конкретном номере, и потребитель должен предпочесть `room.places`.
 */
export const CATEGORY_STATED_PLACES = Object.fromEntries(
  ROOM_CATEGORIES.filter((c) => c.statedPlaces != null).map((c) => [
    c.value,
    c.statedPlaces,
  ])
);

/** Неизвестный ключ возвращается как есть — данные бывают старше справочника. */
export const categoryLabel = (value) => byValue.get(value)?.label ?? value ?? "";

export const categoryShortLabel = (value) =>
  byValue.get(value)?.shortLabel ?? value ?? "";

/** Поля цен ценника авиакомпании в порядке отображения. */
export const PRICE_FIELDS = ROOM_CATEGORIES.map((c) => c.priceField);

/** Строки формы цен авиакомпании: ключ поля, подпись поля и подпись категории. */
export const AIRLINE_PRICE_ROWS = ROOM_CATEGORIES.map(
  ({ priceField, priceTitle, label }) => ({
    key: priceField,
    title: priceTitle,
    label,
  })
);

/** Подмножество справочника в заданном порядке ключей. */
export const pickCategories = (values) =>
  values.map((value) => byValue.get(value)).filter(Boolean);

/**
 * Категории, доступные для выбора. Списки заданы явно, а не через `group`:
 * справочник шире того, что гостиница заводит руками (девяти- и десятиместные
 * номера и «Комфорт» приходят из старых данных и договоров, но в этих формах
 * их никогда не предлагали — расширять выбор молча нельзя).
 */
export const TARIF_ROOM_CATEGORIES = pickCategories([
  "luxe",
  "onePlace",
  "twoPlace",
  "threePlace",
  "fourPlace",
  "fivePlace",
  "sixPlace",
  "sevenPlace",
  "eightPlace",
  "economySingle",
  "standardSingle",
  "standardDouble",
  "deluxe",
]);

export const ROOM_FUND_CATEGORIES = pickCategories([
  "onePlace",
  "twoPlace",
  "threePlace",
  "fourPlace",
  "fivePlace",
  "sixPlace",
  "sevenPlace",
  "eightPlace",
  "economySingle",
  "standardSingle",
  "standardDouble",
  "deluxe",
]);

export const APARTMENT_CATEGORIES = pickCategories(["apartment", "studio"]);
