export const DEPARTMENT_READINESS_GROUPS = [
  {
    tab: 'Основное',
    items: [
      { key: 'email', label: 'Email вписан', check: d => Boolean(d.email?.trim()) },
    ],
  },
  {
    tab: 'Доступы',
    items: [
      {
        key: 'access',
        label: 'Хотя бы один доступ включён',
        check: d => d.accessMenu ? Object.values(d.accessMenu).some(v => v === true) : false,
      },
    ],
  },
  {
    tab: 'Уведомления',
    items: [
      {
        key: 'notifications',
        label: 'Хотя бы одно уведомление включено',
        check: d => d.notificationMenu ? Object.values(d.notificationMenu).some(v => v === true) : false,
      },
    ],
  },
];

export function computeDepartmentReadiness(department) {
  const groups = DEPARTMENT_READINESS_GROUPS.map(({ tab, items }) => ({
    tab,
    items: items.map(({ key, label, check }) => ({ key, label, done: check(department) })),
  }));
  const total = groups.reduce((s, g) => s + g.items.length, 0);
  const done = groups.reduce((s, g) => s + g.items.filter(i => i.done).length, 0);
  return { isReady: done === total, done, total, groups };
}
