# FapV2 — Интерфейс заявок ФАП (v2)

## Концепция

FapV2 — основной интерфейс для работы с `PassengerRequest`. Ключевое отличие от старого FAP (`ReservePlacementRepresentative`): список заявок → карточка заявки (навигационные карточки услуг) → отдельная страница конкретной услуги. Меньше навигации, чёткое разделение уровней детализации.

---

## Маршруты

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/fapv2` | `FapV2` | Список заявок (карточный грид) |
| `/fapv2/:requestId` | `FapDetailPage` → `FapDetail` | Детальная страница заявки (навигация по услугам) |
| `/fapv2/:requestId/service/:serviceKey` | `FapServicePage` | Детальная страница конкретной услуги |
| `/fapv2/:requestId/report/:hotelIndex` | `FapReportPage` → `FapReport` | Отчёт по отелю |

---

## Структура файлов

```
src/Components/
├── Pages/FapV2/
│   ├── FapV2.jsx              # Список заявок
│   ├── FapV2.module.css
│   ├── FapDetailPage.jsx      # Обёртка детали (MenuDispetcher + accessMenu)
│   ├── FapServicePage.jsx     # Страница конкретной услуги (MenuDispetcher + accessMenu)
│   ├── FapServicePage.module.css
│   └── FapReportPage.jsx      # Обёртка отчёта (MenuDispetcher + accessMenu)
└── Blocks/FapV2/
    ├── fapConstants.js                     # Конфиги статусов, услуг, утилиты дат
    ├── FapDetail/
    │   ├── FapDetail.jsx                   # Навигационная страница заявки
    │   └── FapDetail.module.css            # Общие стили всех секций (topRow, planRow, actionsRow, progressBar, linkBtn и др.)
    ├── FapWaterMealSection/
    │   └── FapWaterMealSection.jsx         # Секция «Вода» / «Питание»
    ├── FapLivingSection/
    │   ├── FapLivingSection.jsx            # Секция «Проживание»
    │   ├── FapLivingSection.module.css
    │   └── HotelGuestsModal.jsx            # Модалка управления гостями отеля
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
- Фильтр по статусу (`MUIAutocomplete`), сохраняется в `localStorage` (`statusFilterFapV2`)
- Фильтр по авиакомпании (`MUIAutocompleteColor`), скрыт для роли `airlineAdmin`
- Фильтр по аэропорту (`MUIAutocomplete`)
- Реалтайм: `PASSENGER_REQUEST_CREATED_SUBSCRIPTION` + `PASSENGER_REQUEST_UPDATED_SUBSCRIPTION` → `refetch()`
- Кнопка «+ Создать заявку» → `CreateRepresentativeRequest` (скрыта если `user.airlineId` и `!accessMenu.requestCreate`)

---

## FapDetail — навигационная страница заявки

### Sticky header
- Статус-бейдж
- Кнопки перехода к следующему статусу с подтверждением через MUI Dialog (по `STATUS_TRANSITIONS`)
- «+ Услуга» → `AddRepresentativeService`
- **«История»** → `PassengerRequestLogs` (sidebar с пагинацией)
- **«Чат»** → toggleable чат-панель справа (`Message`)
- «Отменить заявку» → MUI Dialog с опциональной причиной → `CANCEL_PASSENGER_REQUEST`

```js
const STATUS_TRANSITIONS = {
  CREATED: ["ACCEPTED"],
  ACCEPTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
};

const STATUS_ACTION_LABELS = {
  ACCEPTED: "Принять заявку",
  IN_PROGRESS: "Начать выполнение",
  COMPLETED: "Завершить заявку",
};
```

### Layout с чатом

Когда чат открыт:
```
[sectionsPane: flex: 1, overflow-y auto]  |  [chatPane: 380px, border-left]
         навигационные карточки           |       Message component
```

### Навигационные карточки услуг

Каждая карточка — кликабельный div, переход на `/fapv2/:requestId/service/:serviceKey`. Отображает: цветную точку, название, статус-бейдж, краткую сводку (кол-во человек, отелей, водителей), стрелку «›».

Рендерятся только если `service.plan.enabled === true`. Ключи: `water`, `meal`, `living`, `transfer`, `baggage`.

---

## FapServicePage — страница конкретной услуги

Отдельная полноэкранная страница с `MenuDispetcher`. Отображает одну секцию услуги без аккордеона (`isOpen={true}`). Загружает `GET_PASSENGER_REQUEST` + подписку `PASSENGER_REQUEST_UPDATED_SUBSCRIPTION`.

Маршрут: `/fapv2/:requestId/service/:serviceKey`

Карта `serviceKey → компонент`:
- `water` → `FapWaterMealSection` (serviceKind="WATER")
- `meal` → `FapWaterMealSection` (serviceKind="MEAL")
- `living` → `FapLivingSection`
- `transfer` → `FapTransferSection`
- `baggage` → `FapBaggageSection`

**CSS-переопределение** (`FapServicePage.module.css`): дочерний `.section` растягивается на всю высоту контентной зоны; `.sectionBody` теряет `max-height` аккордеона и становится `flex: 1, overflow-y: auto`.

---

## Общий layout секций (FapDetail.module.css)

Все секции используют единую структуру внутри `.sectionBody`:

```
.topRow                   ← flex row, space-between, padding: 12px 0
  .planRow                ← метаданные услуги (кол-во, время, даты) — слева
  .actionsRow             ← кнопки действий (добавить, завершить досрочно) — справа
.progressBar              ← 3px полоска заполнения (если есть peopleCount)
  .progressFill
[карточки / таблица]
[showEarlyForm]           ← inline-форма с причиной досрочного завершения
```

**Прогресс-бар** показывается между заголовком секции и аккордеонным телом — виден всегда. Зеленеет когда `completed >= total`.

**Кнопки ссылок** (`.linkBtn` — фиолетовые): копируют ссылку в буфер через `navigator.clipboard.writeText`. Показываются только если поле не пустое.

---

## Секции услуг

### FapWaterMealSection

Пропсы: `service`, `serviceKind` ("WATER" | "MEAL"), `label`, `color`, `requestId`, `onRefetch`, `isOpen`, `onToggle`.

**Заголовок:** `N / plan.peopleCount чел.` + статус-бейдж.

**Прогресс-бар:** `people.length / plan.peopleCount` (если `peopleCount > 0`).

**Тело (topRow + таблица):**
- Плановые данные: кол-во человек, планируемое время (HH:mm)
- Кнопки (actionsRow, если не завершено):
  - **«Вода/Питание доставлена»** (зелёная) — `SET_PASSENGER_SERVICE_STATUS(status: "ACCEPTED")`, только если `service.status === "NEW"`
  - **«Завершить досрочно»** → inline-форма с причиной
- Таблица людей: ФИО, телефон, место, **время выдачи (только HH:mm)**
- Inline-форма досрочного завершения

**Важно:** ручного добавления людей в вода/питание нет (соответствие старому FAP). Список только для просмотра.

**Мутации:** `COMPLETE_PASSENGER_REQUEST_WATER_EARLY`, `COMPLETE_PASSENGER_REQUEST_MEAL_EARLY`, `SET_PASSENGER_SERVICE_STATUS`

---

### FapLivingSection

Пропсы: `service`, `color`, `request`, `onRefetch`, `isOpen`, `onToggle`.

**Заголовок:** `totalGuests/totalCapacity гостей · N отелей`

**Тело:**
- topRow: плановые даты (заселение / выселение / мест по плану) + кнопки (+ Добавить отель, Завершить досрочно)
- Карточки отелей — каждая раскрывается отдельно (`expandedHotels`)
  - **Прогресс-бар заполнения:** `hotel.people.length / hotel.peopleCount`
  - Чип `N/capacity` (зелёный если полный)
  - Кнопки в заголовке карточки:
    - **«Отчёт»** → `navigate(/fapv2/:requestId/report/:idx)`
    - **«Гости»** → `HotelGuestsModal` (полное управление)
    - **Ссылки (CRM / PWA / Ссылка)** — копируют `hotel.linkCRM` / `hotel.linkPWA` / `hotel.link` в буфер; показываются только если соответствующее поле заполнено
  - В раскрытом состоянии: таблица гостей (ФИО, телефон, номер, категория)

**Мутации:** `COMPLETE_PASSENGER_REQUEST_LIVING_EARLY`

#### HotelGuestsModal

MUI Dialog с `maxWidth` динамическим: `view === "list" ? "md" : "sm"`.

Четыре состояния (`view`):
- `"list"` — список броней с поиском, кнопки «Отчёт», «+ Добавить бронь»
- `"form"` — форма добавления/редактирования брони (ФИО, телефон, дата заезда, дата выезда, номер комнаты)
- `"relocate"` — переселение: выбор отеля + причина
- `"evict"` — выселение: причина

Мутации: `ADD_PASSENGER_REQUEST_HOTEL_PERSON`, `UPDATE_PASSENGER_REQUEST_HOTEL_PERSON`, `REMOVE_PASSENGER_REQUEST_HOTEL_PERSON`, `RELOCATE_PASSENGER_REQUEST_HOTEL_PERSON`, `EVICT_PASSENGER_REQUEST_HOTEL_PERSON`

---

### FapTransferSection

Пропсы: `service`, `color`, `request`, `onRefetch`, `isOpen`, `onToggle`.

**Заголовок:** `N водит. · totalPassengers/plan.peopleCount пасс.`

**Прогресс-бар:** `totalPassengers / plan.peopleCount`.

**Тело:**
- topRow: кол-во человек, время + кнопки (+ Добавить водителя, Завершить досрочно)
- Карточки водителей, раскрываются (`expandedDrivers`):
  - Заголовок карточки: ФИО, метаданные + **кнопка «PWA»** или «Ссылка» — копирует `driver.linkPWA` / `driver.link`
  - Таблица пассажиров: `#`, ФИО, телефон + кнопки редактировать/удалить (если не завершено)
  - Кнопка «+ Добавить пассажира» (если не достигнут лимит)
  - MUI Dialogs: добавление/редактирование пассажира, подтверждение удаления

**Мутации:** `ADD_PASSENGER_REQUEST_DRIVER_PERSON`, `UPDATE_PASSENGER_REQUEST_DRIVER_PERSON`, `REMOVE_PASSENGER_REQUEST_DRIVER_PERSON`, `COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY`

---

### FapBaggageSection

Пропсы: `service`, `color`, `request`, `onRefetch`, `isOpen`, `onToggle`.

**Заголовок:** `N водит.`

**Тело:**
- topRow: планируемое время + кнопки (+ Добавить водителя, Завершить досрочно)
- Карточки водителей (не раскрываются): ФИО, телефон, адреса, описание
  - **Кнопка «PWA»** или «Ссылка» — копирует `driver.linkPWA` / `driver.link`
  - Статус: «В пути» / «✓ Доставлено» + время
  - Кнопка «Доставлено» → `COMPLETE_PASSENGER_REQUEST_BAGGAGE_DRIVER_DELIVERY`
- Inline-форма досрочного завершения

**Мутации:** `COMPLETE_PASSENGER_REQUEST_BAGGAGE_DRIVER_DELIVERY`, `COMPLETE_PASSENGER_REQUEST_BAGGAGE_EARLY`

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

## Обёртки-страницы (FapDetailPage / FapServicePage / FapReportPage)

Все компоненты:
1. Загружают `accessMenu` (авиакомпания → `GET_AIRLINE_DEPARTMENT`, диспетчер → `GET_DISPATCHER_DEPARTMENTS`)
2. Рендерят `<MenuDispetcher id="fapv2" .../>` + основной компонент

`FapReportPage` дополнительно загружает `GET_PASSENGER_REQUEST` и достаёт `hotel` по `hotelIndex` из params.

---

## Функциональное покрытие vs старый FAP

| Функционал | Старый FAP | FapV2 |
|---|---|---|
| Список: поиск, фильтры (статус, авиакомпания, аэропорт), карточки, create | ✅ | ✅ |
| Список: realtime | ✅ | ✅ |
| Детальная: статусы, отмена, добавить услугу | ✅ | ✅ |
| Вода/питание: просмотр списка людей | ✅ | ✅ |
| Вода/питание: «Доставлено» кнопка | ✅ | ✅ |
| Вода/питание: досрочное завершение | ✅ | ✅ |
| Вода/питание: время выдачи только HH:mm | ✅ | ✅ |
| Вода/питание: прогресс-бар | — | ✅ |
| Проживание: отели, прогресс-бар, добавить отель | ✅ | ✅ |
| Проживание: добавить/редактировать/удалить/переселить/выселить гостей | ✅ | ✅ (через HotelGuestsModal) |
| Проживание: досрочное завершение | ✅ | ✅ |
| Проживание: копирование ссылок CRM/PWA | ✅ | ✅ |
| Трансфер: водители, добавить водителя, прогресс-бар | ✅ | ✅ |
| Трансфер: добавить/редактировать/удалить пассажиров | ✅ | ✅ (inline диалог) |
| Трансфер: досрочное завершение | ✅ | ✅ |
| Трансфер: копирование PWA-ссылки | ✅ | ✅ |
| Багаж: водители, отметить доставлено | ✅ | ✅ |
| Багаж: досрочное завершение | ✅ | ✅ |
| Багаж: копирование PWA-ссылки | ✅ | ✅ |
| Отчёт: сохранение, Excel | ✅ | ✅ (улучшен) |
| Чат по заявке | ✅ | ✅ (панель справа) |
| История действий (логи) | ✅ | ✅ (боковая панель) |
| Навигация на отдельную страницу услуги | — | ✅ (FapServicePage) |
