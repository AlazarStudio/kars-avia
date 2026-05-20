export const READINESS_GROUPS = [
  {
    tab: 'Об авиакомпании',
    items: [
      { key: 'logo',       label: 'Логотип загружен',              check: a => a.images?.length > 0 },
      { key: 'nameFull',   label: 'Полное наименование заполнено', check: a => Boolean(a.nameFull) },
      { key: 'contacts',   label: 'Контакты (email или телефон)',  check: a => Boolean(a.information?.email || a.information?.number) },
      { key: 'requisites', label: 'Реквизиты (ИНН и ОГРН)',       check: a => Boolean(a.information?.inn && a.information?.ogrn) },
    ],
  },
  {
    tab: 'Пользователи',
    items: [
      { key: 'department', label: 'Создан хотя бы один отдел',  check: a => a.department?.length > 0 },
      { key: 'adminUser',  label: 'Есть хотя бы 1 пользователь', check: a => a.users?.length > 0 },
      {
        key: 'departmentsReady',
        label: 'Все отделы настроены (почта, доступы, уведомления)',
        check: a => {
          if (!a.department?.length) return false;
          return a.department.every(d =>
            Boolean(d.email?.trim()) &&
            (d.accessMenu ? Object.values(d.accessMenu).some(v => v === true) : false) &&
            (d.notificationMenu ? Object.values(d.notificationMenu).some(v => v === true) : false)
          );
        },
      },
    ],
  },
  {
    tab: 'Цены',
    items: [
      { key: 'prices', label: 'Настроены цены размещения', check: a => a.prices?.length > 0 },
    ],
  },
  {
    tab: 'Цены на трансфер',
    items: [
      { key: 'transferPrices', label: 'Настроены цены трансфера', check: a => a.transferPrices?.length > 0 },
    ],
  },
  {
    tab: 'Сотрудники',
    items: [
      { key: 'staff', label: 'Добавлены сотрудники', check: a => a.staff?.length > 0 },
    ],
  },
  {
    tab: 'Реестр договоров',
    items: [
      { key: 'contracts', label: 'Есть хотя бы один договор', check: a => a.airlineContract?.length > 0 },
    ],
  },
];

export function computeAirlineReadiness(airline) {
  const groups = READINESS_GROUPS
    .filter(g => !g.optional || airline.department !== undefined)
    .map(({ tab, items }) => ({
      tab,
      items: items.map(({ key, label, check }) => ({ key, label, done: check(airline) })),
    }));
  const total = groups.reduce((s, g) => s + g.items.length, 0);
  const done = groups.reduce((s, g) => s + g.items.filter(i => i.done).length, 0);
  return { isReady: done === total, done, total, groups };
}
