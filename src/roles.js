export const roles = {
  hotelAdmin: "HOTELADMIN",
  airlineAdmin: "AIRLINEADMIN",
  superAdmin: "SUPERADMIN",
  dispatcerAdmin: "DISPATCHERADMIN",
  dispatcherModerator: "DISPATCHERMODERATOR",
  hotelModerator: "HOTELMODERATOR",
  airlineModerator: "AIRLINEMODERATOR",
};

export const statusMapping = {
  opened: "В обработке",
  canceled: "Отменен",
  done: "Размещен",
  created: "Создан",
  extended: "Продлен",
  reduced: "Сокращен",
  transferred: "Перенесен",
  earlyStart: "Ранний заезд",
  archiving: "Готов к архиву",
  archived: "Архив",
};

export const rolesObject = {
  dispatcher: [
    {
      label: "Администратор",
      value: "DISPATCHERADMIN",
    },
  ],
  airline: [
    {
      label: "Администратор",
      value: "AIRLINEADMIN",
    },
  ],
  hotel: [
    {
      label: "Администратор",
      value: "HOTELADMIN",
    },
  ],
};
export const fullNotifyTime = 3300;
export const notifyTime = 3000;

export const positions = [
  "КАЭ",
  "КВС",
  "ВП",
  "СБ",
  "ИБП",
  "БП",
  "СА",
  // "Зам. Дир.",
  "Инженер",
];

export const FILTER_OPTIONS = [
  { label: "Диспетчер", value: "dispatcher" },
  { label: "Гостиница", value: "hotel" },
  { label: "Авиакомпания", value: "airline" },
];

export const action = [
  "Все под запрос",
  "Фиксированная ставка",
  "Экипаж",
  "Пассажиры",
  "Экипаж/пассажиры",
  "Сбойный экипаж/пассажиры",
  "Доставка багажа",
  "Трансфер",
  "Представительские услуги",
  "Экипаж/командированные",
];

export const menuAccess = {
  requestMenu: true,
  requestCreate: true,
  requestUpdate: true,
  requestChat: true,

  reserveMenu: true,
  reserveCreate: true,
  reserveUpdate: true,

  userMenu: true,
  userCreate: true,
  userUpdate: true,

  personalMenu: true,
  personalCreate: true,
  personalUpdate: true,

  analyticsMenu: true,

  airlineMenu: true,
  airlineUpdate: true,
  airlineContracts: true,

  reportMenu: true,
  reportCreate: true,
};
