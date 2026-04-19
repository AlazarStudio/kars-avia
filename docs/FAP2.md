# FapV2 — Интерфейс заявок ФАП (v2)

## Концепция

FapV2 — основной интерфейс для работы с `PassengerRequest`. Ключевое отличие от старого FAP (`ReservePlacementRepresentative`): вместо отдельных страниц на каждую сущность — всё на одном экране через аккордеоны. Меньше навигации, быстрее доступ к действиям.

---

## Маршруты

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/fapv2` | `FapV2` | Список заявок (карточный грид) |
| `/fapv2/:requestId` | `FapDetailPage` → `FapDetail` | Детальная страница заявки |
| `/fapv2/:requestId/report/:hotelIndex` | `FapReportPage` → `FapReport` | Отчёт по отелю |

---

## Структура файлов

```
src/Components/
├── Pages/FapV2/
│   ├── FapV2.jsx              # Список заявок
│   ├── FapV2.module.css
│   ├── FapDetailPage.jsx      # Обёртка детали (MenuDispetcher + accessMenu)
│   └── FapReportPage.jsx      # Обёртка отчёта (MenuDispetcher + accessMenu)
└── Blocks/FapV2/
    ├── fapConstants.js                     # Конфиги статусов, услуг, утилиты дат
    ├── FapDetail/
    │   ├── FapDetail.jsx                   # Детальная страница заявки
    │   └── FapDetail.module.css
    ├── FapWaterMealSection/
    │   └── FapWaterMealSection.jsx         # Секция «Вода» / «Питание»
    ├── FapLivingSection/
    │   ├── FapLivingSection.jsx            # Секция «Проживание»
    │   └── FapLivingSection.module.css
    ├── FapTransferSection/
    │   └── FapTransferSection.jsx          # Секция «Трансфер»
    ├── FapBaggageSection/
    │   └── FapBaggageSection.jsx           # Секция «Доставка багажа»
    └── FapReport/
        ├── FapReport.jsx                   # Отчёт по отелю
        └── FapReport.module.css
```

---

## FapV2 — список заявок

Карточный грид. Каждая карточка: номер рейса, авиакомпания, аэропорт, статус (бейдж), активные услуги (чипы), дата создания.

- Поиск по рейсу (`useDebounce`, 400 мс)
- Фильтр по статусу (`MUIAutocomplete`)
- Реалтайм: `PASSENGER_REQUEST_CREATED_SUBSCRIPTION` + `PASSENGER_REQUEST_UPDATED_SUBSCRIPTION` → `refetch()`
- Кнопка «+ Создать заявку» → `CreateRepresentativeRequest`

---

## FapDetail — детальная страница

### Sticky header
- Номер рейса + статус-бейдж
- Кнопки перехода к следующему статусу (по `STATUS_TRANSITIONS`)
- «+ Услуга» → `AddRepresentativeService`
- **«История»** → `PassengerRequestLogs` (sidebar с пагинацией)
- **«Чат»** → toggleable чат-панель справа (`Message`)
- «Отменить» → inline-форма с причиной → `CANCEL_PASSENGER_REQUEST`

```js
const STATUS_TRANSITIONS = {
  CREATED: ["ACCEPTED"],
  ACCEPTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
};
```

### Layout с чатом

Когда чат открыт (кнопка «Чат»):
```
[sectionsPane: flex: 1, overflow-y auto]  |  [chatPane: 360px, border-left]
         аккордеоны услуг                 |       Message component
```

### Info bar
Горизонтальная полоса: авиакомпания, маршрут, дата рейса, пассажиров, время принятия, причина завершения.

### Секции услуг (аккордеоны)
Рендерятся последовательно в `.sectionsPane`. Каждая возвращает `null` если `service.plan.enabled === false`:
1. `FapWaterMealSection` (serviceKind="WATER")
2. `FapWaterMealSection` (serviceKind="MEAL")
3. `FapLivingSection`
4. `FapTransferSection`
5. `FapBaggageSection`

---

## Секции услуг

### FapWaterMealSection

Пропсы: `service`, `serviceKind` ("WATER" | "MEAL"), `label`, `color`, `requestId`, `onRefetch`.

**Заголовок:** `N / plan.peopleCount чел.` + статус-бейдж.

**Тело:**
- Плановые данные: кол-во человек, планируемое время
- Таблица людей: ФИО, телефон, место, время выдачи
- Кнопки (если не завершено):
  - **«Вода/Питание доставлена»** (зелёная) — `SET_PASSENGER_SERVICE_STATUS(status: "ACCEPTED")`, показывается только если `service.status === "NEW"`
  - «+ Добавить человека» → inline-форма
  - «Завершить досрочно» → inline-форма с причиной

**Мутации:** `ADD_PASSENGER_REQUEST_PERSON`, `COMPLETE_PASSENGER_REQUEST_WATER_EARLY` / `COMPLETE_PASSENGER_REQUEST_MEAL_EARLY`, `SET_PASSENGER_SERVICE_STATUS`

---

### FapLivingSection

Пропсы: `service`, `color`, `request`, `onRefetch`.

**Заголовок:** `totalGuests/totalCapacity гостей · N отелей`

**Тело:**
- Плановые даты: заселение / выселение / мест по плану
- Карточки отелей — каждая раскрывается отдельно (`expandedHotels`)
  - Прогресс-бар заполняемости
  - Чип `N/capacity` (зелёный если полный)
  - Кнопки в заголовке карточки:
    - **«Отчёт»** → `navigate(/fapv2/:requestId/report/:idx)`
    - **«Гости»** → MUI Dialog с `RepresentativeHotelDetail` (полное управление: добавить/редактировать/удалить/переселить/выселить)
    - **«Ссылка»** — выдача external auth link для гостиницы (если `hotel.hotelId` есть), открывает диалог с выбором CRM/PWA, email, именем
  - В раскрытом состоянии: компактная таблица гостей (ФИО, телефон, номер, категория)
  - Если гостей нет — empty state с кнопкой «Добавить гостя»
  - Кнопка «Управление гостями →» при наличии гостей
- Кнопки секции: «+ Добавить отель» → `AddRepresentativeHotel`, **«Завершить досрочно»** → `COMPLETE_PASSENGER_REQUEST_LIVING_EARLY`

**Управление гостями** (MUI Dialog `fullWidth maxWidth="md"`):
- Переиспользует `RepresentativeHotelDetail` с пропсами:
  - `hidePageTitle={true}`, `onGenerateReport`, `addNotification` (wrapper для useToast)
- Даёт всё: добавить/редактировать/удалить/переселить/выселить через `AddRepresentativeBooking` и мутации

**External auth link dialog:**
- Выбор типа: CRM / PWA (кнопки-переключатели)
- Поле email (обязательно), поле имени (опционально)
- После успеха: показывает ссылку с кнопкой «Копировать»
- Cooldown: 60 сек между выдачами (проверка по `Date.now()`)
- Мутация: `CREATE_EXTERNAL_AUTH_LINK` с `scope: "HOTEL"`

---

### FapTransferSection

Пропсы: `service`, `color`, `request`, `onRefetch`.

**Заголовок:** `N водит. · totalPassengers/plan.peopleCount пасс.`

**Тело:**
- Плановые данные: кол-во человек, время
- Карточки водителей, раскрываются (`expandedDrivers`):
  - Таблица пассажиров: `#`, ФИО, телефон + кнопки редактировать/удалить (если не завершено)
  - Кнопка «+ Добавить пассажира» (если не достигнут лимит мест водителя)
  - Диалог добавления/редактирования пассажира: ФИО, телефон
  - Диалог подтверждения удаления
- Кнопки секции: «+ Добавить водителя» → `AddRepresentativeDriver`, **«Завершить досрочно»** → `COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY`

**Мутации:** `ADD_PASSENGER_REQUEST_DRIVER_PERSON`, `UPDATE_PASSENGER_REQUEST_DRIVER_PERSON`, `REMOVE_PASSENGER_REQUEST_DRIVER_PERSON`, `COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY`

---

### FapBaggageSection

Пропсы: `service`, `color`, `request`, `onRefetch`.

**Заголовок:** `N водит.`

**Тело:**
- Планируемое время
- Карточки водителей (не раскрываются): ФИО, телефон, адреса, описание
  - Статус: «В пути» / «✓ Доставлено» + время
  - Кнопка «Доставлено» → `COMPLETE_PASSENGER_REQUEST_BAGGAGE_DRIVER_DELIVERY`
- Кнопки: «+ Добавить водителя» → `AddRepresentativeBaggageDriver`, «Завершить досрочно» (форма с причиной) → `COMPLETE_PASSENGER_REQUEST_BAGGAGE_EARLY`

---

## FapReport — отчёт по отелю

### Архитектура состояния

Два независимых стейта:
- **`tariffs`** — массив тарифов `{ id, name, breakfast, lunch, dinner, foodCost, accommodationCost }`
- **`personData`** — объект `{ [personIndex]: { roomNumber, daysCount, tariffId, breakfast, lunch, dinner, foodCost, accommodationCost } }`

Цены хранятся денормализованно на уровне гостя. Тариф — шаблон, привязка через `tariffId` только для отображения в select.

### Два таба

**«Тарифы»:** карточки тарифов с ценами, «Применить всем», удаление.

**«Гости»:** поиск по ФИО, таблица: `#`, ФИО (readonly), номер, суток (`step=0.5`), тариф (select), завтрак/обед/ужин, питание, проживание, итого. Все поля кроме ФИО редактируемы независимо.

### `daysCount` — авто-расчёт
```js
function getPersonDays(person, hotelIndex, plan) {
  // Берёт chess (accommodationChesses) по hotelIndex, иначе plan даты
  // → calculateEffectiveCostDays(startAt, endAt)
}
```

### Инициализация из сохранённых данных
При наличии `request.hotelReports[hotelIndex]`: восстанавливает уникальные тарифы из `reportRows` по комбинации цен, сопоставляет гостей по `fullName + roomNumber`.

### Действия
- **«⬇ Excel»** → `xlsx`, столбцы: ID, ФИО, Номер, Тариф, Суток, Завтрак, Обед, Ужин, Ст-ть питания, Ст-ть проживания, Итого
- **«Сохранить отчёт»** → `SAVE_PASSENGER_REQUEST_HOTEL_REPORT`

---

## fapConstants.js

```js
SERVICE_CONFIG          // { water, meal, living, transfer, baggage } → { label, color, bg, key, serviceKind }
REQUEST_STATUS_CONFIG   // { CREATED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED } → { label, color, bg }
SERVICE_STATUS_CONFIG   // { NEW, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED } → { label, color, bg }

formatDate(dateStr)      // → "дд.мм.гггг"
formatTime(dateStr)      // → "чч:мм"
formatDateTime(dateStr)  // → "дд.мм.гггг чч:мм"
```

---

## Обёртки-страницы (FapDetailPage / FapReportPage)

Оба компонента:
1. Загружают `accessMenu` (авиакомпания → `GET_AIRLINE_DEPARTMENT`, диспетчер → `GET_DISPATCHER_DEPARTMENTS`)
2. Рендерят `<MenuDispetcher id="fapv2" .../>` + основной компонент

`FapReportPage` дополнительно загружает `GET_PASSENGER_REQUEST` и достаёт `hotel` по `hotelIndex` из params.

---

## Функциональное покрытие vs старый FAP

| Функционал | Старый FAP | FapV2 |
|---|---|---|
| Список: поиск, фильтр, карточки, create | ✅ | ✅ |
| Список: realtime | ✅ | ✅ |
| Детальная: статусы, отмена, добавить услугу | ✅ | ✅ |
| Вода/питание: просмотр, добавление людей | ✅ | ✅ |
| Вода/питание: «Доставлено» кнопка | ✅ | ✅ |
| Вода/питание: досрочное завершение | ✅ | ✅ |
| Проживание: отели, прогресс, добавить отель | ✅ | ✅ |
| Проживание: добавить/редактировать/удалить гостей | ✅ | ✅ (через диалог) |
| Проживание: переселить/выселить гостей | ✅ | ✅ (через диалог) |
| Проживание: досрочное завершение | ✅ | ✅ |
| Проживание: external auth link | ✅ | ✅ |
| Трансфер: водители, добавить водителя | ✅ | ✅ |
| Трансфер: добавить/редактировать/удалить пассажиров | ✅ | ✅ (inline) |
| Трансфер: досрочное завершение | ✅ | ✅ |
| Багаж: водители, отметить доставлено | ✅ | ✅ |
| Багаж: досрочное завершение | ✅ | ✅ |
| Отчёт: сохранение, Excel | ✅ | ✅ (улучшен) |
| Чат по заявке | ✅ | ✅ (панель справа) |
| История действий (логи) | ✅ | ✅ (боковая панель) |
| Навигация на отдельную страницу гостиницы/водителя | ✅ | — (заменено inline/диалог) |
