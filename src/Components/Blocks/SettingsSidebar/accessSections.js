// Единое описание секций прав доступа отдела.
// Используется общей панелью AccessPermissionsPanel (сайдбар и страница доступов должности).
export const ACCESS_SECTIONS = [
  {
    key: "squadron",
    title: "Эскадрилья",
    rows: [
      { key: "create", label: "Создание заявки" },
      { key: "chat", label: "Сообщение в чате заявки" },
      { key: "edit", label: "Редактирование заявки" },
    ],
  },
  {
    key: "passengers",
    title: "ФАП",
    rows: [
      { key: "create", label: "Создание заявки" },
      { key: "edit", label: "Редактирование заявки" },
    ],
  },
  {
    key: "transfer",
    title: "Трансфер",
    rows: [
      { key: "create", label: "Создание заявки" },
      { key: "chat", label: "Сообщение в чате заявки" },
      { key: "edit", label: "Редактирование заявки" },
    ],
  },
  {
    key: "organization",
    title: "Автопарк",
    rows: [
      { key: "create", label: "Создание" },
      { key: "edit", label: "Редактирование" },
      { key: "addDrivers", label: "Добавление водителей" },
      { key: "acceptDrivers", label: "Принятие водителей" },
    ],
  },
  {
    key: "users",
    title: "Пользователи",
    rows: [
      { key: "add", label: "Добавление пользователей" },
      { key: "edit", label: "Редактирование" },
    ],
  },
  {
    key: "employees",
    title: "Сотрудники",
    rows: [
      { key: "add", label: "Добавление сотрудников" },
      { key: "edit", label: "Редактирование" },
    ],
  },
  {
    key: "contracts",
    title: "Реестр договоров",
    rows: [
      { key: "create", label: "Создание" },
      { key: "edit", label: "Редактирование" },
    ],
  },
  {
    key: "analytics",
    title: "Аналитика",
    // Строка «Выгрузка аналитики» закомментирована в обеих панелях;
    // значение analytics.export живёт в состоянии и уходит в payload.
    rows: [],
  },
  {
    key: "aboutAirlines",
    title: "Об авиакомпании",
    rows: [{ key: "edit", label: "Редактирование" }],
  },
  {
    key: "reports",
    title: "Отчёты",
    rows: [{ key: "create", label: "Создание" }],
  },
];

// Порядок карточек в сайдбаре и на страницах доступов диспетчера/должности.
export const DISPATCHER_SECTION_KEYS = [
  "squadron",
  "passengers",
  "transfer",
  "organization",
  "users",
  "employees",
  "contracts",
  "analytics",
  "aboutAirlines",
  "reports",
];

// У отделов авиакомпаний автопарк и реестр договоров сейчас скрыты.
export const AIRLINE_SECTION_KEYS = DISPATCHER_SECTION_KEYS.filter(
  (key) => key !== "organization" && key !== "contracts",
);

export function defaultSectionKeys(type) {
  return type === "airline" ? AIRLINE_SECTION_KEYS : DISPATCHER_SECTION_KEYS;
}
