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
  dispatcher: [{
    label: "Администратор",
    value: "DISPATCHERADMIN"
  }],
  airline: [{
    label: "Администратор",
    value: "AIRLINEADMIN"
  }],
  hotel: [{
    label: "Администратор",
    value: "HOTELADMIN"
  }]
}
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
  "Зам. Дир.",
  "Инженер",
];
