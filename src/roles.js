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

export const statusLabels = {
  PENDING: "Ожидание обработки",
  ASSIGNED: "Назначен водитель",
  ACCEPTED: "Принят водителем",
  ARRIVED: "Водитель приехал",
  IN_PROGRESS_TO_CLIENT: "В пути к клиенту",
  IN_PROGRESS_TO_HOTEL: "В пути к месту назначения",
  COMPLETED: "Завершена",
  CANCELLED: "Отменена",
};

export const statusMappingTransfer = {
  opened: "В обработке",
  canceled: "Отменен",
  done: "Размещен",
  created: "Создан",
  extended: "Продлен",
  reduced: "Сокращен",
  transferred: "Перенесен",
  earlyStart: "Ранний заезд",
};

/** Русские подписи ролей (для подсказок, списков и т.д.) */
export const roleLabels = {
  [roles.hotelAdmin]: "Администратор гостиницы",
  [roles.airlineAdmin]: "Администратор авиакомпании",
  [roles.superAdmin]: "Супер-администратор",
  [roles.dispatcerAdmin]: "Диспетчер",
  [roles.dispatcherModerator]: "Модератор диспетчера",
  [roles.hotelModerator]: "Модератор гостиницы",
  [roles.airlineModerator]: "Модератор авиакомпании",
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
  "ЦРМ",
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

export const exampleData = [
  {
    id: "0001",
    name: "Иванов Иван Иванович",
    fullName: "Иванов Иван Иванович",
    time: "14:30",
    passengersCount: 4,
  },
  {
    id: "0002",
    name: "Иванов Иван Иванович",
    fullName: "Иванов Иван Иванович",
    time: "14:30",
    passengersCount: 7,
  },
  {
    id: "0003",
    name: "Иванов Иван Иванович",
    fullName: "Иванов Иван Иванович",
    time: "14:30",
    passengersCount: 3,
  },
  {
    id: "0004",
    name: "Иванов Иван Иванович",
    fullName: "Иванов Иван Иванович",
    time: "14:30",
    passengersCount: 6,
  },
  {
    id: "0005",
    name: "Иванов Иван Иванович",
    fullName: "Иванов Иван Иванович",
    time: "14:30",
    passengersCount: 8,
  },
];

export const hotelsReserveData = [
  {
    hotel: {
      id: "0001",
      name: "Кавказ",
      address: "Lorem ipsum",
      passengersCount: 24,
    },
  },
  {
    hotel: {
      id: "0002",
      name: "Жемчужина Кавказа",
      address: "Lorem ipsum",
      passengersCount: 14,
    },
  },
  {
    hotel: {
      id: "0003",
      name: "Тест",
      address: "Lorem ipsum",
      passengersCount: 20,
    },
  },
  {
    hotel: {
      id: "0004",
      name: "Апартаменты",
      address: "Lorem ipsum",
      passengersCount: 28,
    },
  },
];

export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const mockDrivers = [
  {
    id: "drv-1",
    name: "Иван",
    rating: 5.0,
    completedOrders: 2,
    images: ["/mock/drivers/ivan.png"],
    car: {
      plate: "A666AA",
      model: "Toyota Camry",
      color: "черный",
    },
  },
  {
    id: "drv-2",
    name: "Аслан",
    rating: 4.9,
    completedOrders: 4,
    images: ["/mock/drivers/aslan.png"],
    car: {
      plate: "K123BC",
      model: "Hyundai Sonata",
      color: "белый",
    },
  },
  {
    id: "drv-3",
    name: "Мурад",
    rating: 5.0,
    completedOrders: 3,
    images: ["/mock/drivers/murad.png"],
    car: {
      plate: "М777MM",
      model: "Kia K5",
      color: "серый",
    },
  },
  {
    id: "drv-4",
    name: "Руслан",
    rating: 4.8,
    completedOrders: 1,
    images: ["/mock/drivers/ruslan.png"],
    car: {
      plate: "С900ХХ",
      model: "Skoda Octavia",
      color: "синий",
    },
  },
];

