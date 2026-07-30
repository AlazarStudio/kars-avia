// Единое описание событий уведомлений отдела.
// Используется общей панелью и конвертером payload (src/utils/notificationPayload.js).
export const NOTIFICATION_SECTIONS = [
  {
    key: "requests",
    title: "Заявки",
    rows: [
      { key: "requestCreate", label: "Создание заявки" },
      { key: "requestDatesChange", label: "Изменение дат заявки" },
      { key: "requestPlacementChange", label: "Смена размещения заявки" },
      { key: "requestCancel", label: "Отмена заявки" },
    ],
  },
  {
    key: "passengerRequests",
    title: "ФАП",
    rows: [
      { key: "passengerRequestCreate", label: "Создание" },
      { key: "passengerRequestDatesChange", label: "Запрос на изменение дат" },
      { key: "passengerRequestUpdate", label: "Обновление" },
      { key: "passengerRequestPlacementChange", label: "Смена размещения" },
      { key: "passengerRequestCancel", label: "Отмена" },
    ],
  },
  {
    key: "messages",
    title: "Сообщения",
    rows: [{ key: "newMessage", label: "Новое сообщение в чате" }],
  },
];

export const NOTIFICATION_MASTER_KEYS = NOTIFICATION_SECTIONS.flatMap((section) =>
  section.rows.map((row) => row.key),
);

const capitalize = (key) => `${key[0].toUpperCase()}${key.slice(1)}`;

// Правило именования канальных полей действует и во фронте, и в схеме бэкенда.
export const emailKey = (masterKey) => `email${capitalize(masterKey)}`;
export const sitePushKey = (masterKey) => `sitePush${capitalize(masterKey)}`;
