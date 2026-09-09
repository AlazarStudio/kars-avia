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
    // Заявка в архиве заперта на сервере (services/request/requestArchiveGuard.js):
    // правку архивной заявки и переселение по ней в шахматке открывает только это
    // право. extras, а не rows: «Взаимодействие с разделом» не должно включать его
    // заодно с обычной правкой — как и у ФАП.
    extras: [
      { key: "editCompleted", label: "Редактирование заявки в архиве" },
    ],
  },
  {
    key: "passengers",
    title: "ФАП",
    rows: [
      { key: "create", label: "Создание заявки" },
      { key: "edit", label: "Редактирование заявки" },
    ],
    // extras — переключатели, которые НЕ входят в «Взаимодействие с разделом»:
    // общий тумблер зажигает все действия скопом, а это право выдаётся отдельно.
    extras: [
      { key: "editCompleted", label: "Редактирование завершённой заявки" },
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
    // Выдача доступов — часть раздела «Пользователи»: право гейтит шестерёнку
    // отдела и кнопку «Должности и доступ» именно здесь, поэтому строка живёт
    // в этой карточке, а не отдельной секцией.
    // requiresAccessManage — строку видит только тот, у кого само право есть,
    // иначе делегат не смог бы передать его дальше.
    extras: [
      {
        key: "manageAccess",
        label: "Управление доступами",
        requiresAccessManage: true,
      },
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
    // Вкладки страницы «Аналитика» гейтятся РАВНЫМИ правами: любое выдаётся
    // отдельно, поэтому общего «Доступа к разделу» у карточки нет — вместо
    // него строка на вкладку. independentRows переключает рендер в панели:
    // строки рисуются каждая сама по себе, без каскада и без агрегата.
    independentRows: true,
    rows: [
      { key: "squadron", label: "Эскадрилья" },
      { key: "passengers", label: "Пассажиры" },
    ],
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
    // Удаление отчёта необратимо и живёт только в архиве — в «Взаимодействие
    // с разделом» его не пускаем: иначе право включалось бы заодно с созданием.
    // Отдельный переключатель, как «Редактирование завершённой заявки» у ФАП.
    // «Настройка редактируемых полей» — шестерёнка в редакторе черновика;
    // тоже extras: выдаётся осознанно, по умолчанию выключена (заказчик, 05.09.2026).
    extras: [
      { key: "delete", label: "Удаление" },
      { key: "fieldSettings", label: "Настройка редактируемых полей" },
    ],
  },
  {
    key: "travelline",
    title: "TravelLine",
    rows: [],
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
  "travelline",
];

// У отделов авиакомпаний автопарк и реестр договоров сейчас скрыты.
export const AIRLINE_SECTION_KEYS = DISPATCHER_SECTION_KEYS.filter(
  (key) => key !== "organization" && key !== "contracts",
);

export function defaultSectionKeys(type) {
  return type === "airline" ? AIRLINE_SECTION_KEYS : DISPATCHER_SECTION_KEYS;
}
