export const HOTEL_READINESS_GROUPS = [
  {
    tab: 'О гостинице',
    items: [
      { key: 'images',     label: 'Фото загружены',                  check: h => h.images?.length > 0 },
      { key: 'contacts',   label: 'Контакты (email или телефон)',    check: h => Boolean(h.information?.email || h.information?.number) },
      { key: 'inn',        label: 'Реквизиты: ИНН',                 check: h => Boolean(h.information?.inn) },
      { key: 'ogrn',       label: 'Реквизиты: ОГРН',                check: h => Boolean(h.information?.ogrn) },
    ],
  },
  {
    tab: 'Тарифы',
    items: [
      { key: 'roomKind',        label: 'Добавлены категории номеров',    check: h => h.roomKind?.length > 0 },
      { key: 'priceContract',   label: 'Выставлены цены по договору',    check: h => h.roomKind?.some(rk => rk.price > 0) },
      { key: 'priceAirline',    label: 'Выставлены цены АК',             check: h => h.roomKind?.some(rk => rk.priceForAirline > 0) },
      { key: 'meal',            label: 'Питание включено',               check: h => h.meal === true },
      { key: 'mealPrice',       label: 'Выставлены цены на питание',     check: h => Boolean(h.mealPrice?.breakfast || h.mealPrice?.lunch || h.mealPrice?.dinner) },
      { key: 'mealPriceForAir', label: 'Выставлены цены питания для АК', check: h => Boolean(h.mealPriceForAir?.breakfast || h.mealPriceForAir?.lunch || h.mealPriceForAir?.dinner) },
    ],
  },
  {
    tab: 'Номерной фонд',
    items: [
      { key: 'rooms', label: 'Добавлены номера', check: h => h.rooms?.length > 0 },
    ],
  },
  {
    // optional: только когда данные переданы (детальная страница)
    tab: 'Пользователи',
    optional: true,
    items: [
      { key: 'users', label: 'Есть хотя бы 1 пользователь', check: h => h._users?.length > 0 },
    ],
  },
  {
    tab: 'Реестр договоров',
    items: [
      { key: 'contracts', label: 'Есть хотя бы один договор', check: h => h.hotelContract?.length > 0 },
    ],
  },
];

export function computeHotelReadiness(hotel) {
  const groups = HOTEL_READINESS_GROUPS
    // пропускаем опциональные группы если данных нет
    .filter(g => !g.optional || hotel._users !== undefined)
    .map(({ tab, items }) => ({
      tab,
      items: items.map(({ key, label, check }) => ({ key, label, done: check(hotel) })),
    }));
  const total = groups.reduce((s, g) => s + g.items.length, 0);
  const done = groups.reduce((s, g) => s + g.items.filter(i => i.done).length, 0);
  return { isReady: done === total, done, total, groups };
}
