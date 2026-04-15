# FapV2 — Расширенная версия интерфейса заявки (ФАП v2)

## Что нового в v2

**FapV2** — переработанный интерфейс для просмотра и управления заявками (PassengerRequest) с фокусом на чистоту, масштабируемость и улучшенную UX.

### Основные улучшения

1. **Модульная архитектура** — разбиение на секции по типам услуг (`FapLivingSection`, `FapTransferSection`, и т.д.)
2. **Новые компоненты** — `FapReport` для создания гостиничных отчётов  
3. **Улучшенная навигация** — более логичная структура для диспетчеров и представителей авиакомпаний
4. **Интеграция с отчётами** — генерация отчётов по размещению в реальном времени

---

## Структура компонентов

```
src/Components/
├── Blocks/FapV2/
│   ├── FapDetail/
│   │   ├── FapDetail.jsx           # Главный компонент детали заявки
│   │   ├── FapDetail.module.css    # Стили
│   │   └── fapConstants.js         # Константы (статусы, конфиги услуг)
│   ├── FapLivingSection/
│   │   ├── FapLivingSection.jsx    # Секция «Проживание»
│   │   └── FapLivingSection.module.css
│   ├── FapTransferSection/
│   │   └── FapTransferSection.jsx
│   ├── FapWaterMealSection/
│   │   └── FapWaterMealSection.jsx
│   ├── FapBaggageSection/
│   │   └── FapBaggageSection.jsx
│   └── FapReport/                  # ← НОВОЕ: отчёты по размещению
│       ├── FapReport.jsx           # Компонент таблицы отчёта
│       └── FapReport.module.css    # Стили таблицы
└── Pages/FapV2/
    ├── FapDetailPage.jsx           # Обёртка с MenuDispetcher для детали
    └── FapReportPage.jsx           # ← НОВОЕ: обёртка с MenuDispetcher для отчёта
```

---

## FapReport — Компонент отчёта по размещению

### Назначение

Позволяет диспетчерам и представителям авиакомпаний создавать, редактировать и экспортировать отчёты по гостиничному размещению экипажа. Отчёт содержит персональные данные каждого гостя (ФИО, номер, питание) и расчёт итоговой стоимости.

### Props

| Prop | Тип | Описание |
|------|-----|---------|
| `request` | PassengerRequest | Полная заявка из GraphQL |
| `hotelIndex` | Number | Индекс отеля в массиве `livingService.hotels` |
| `hotelName` | String | Название отеля для заголовка |

### Основной функционал

#### 1. Таблица редактирования

- **Столбцы**: ФИО, номер, категория, питание (завтрак/обед/ужин), цены, ночи, итого
- **Редактируемые поля**: все кроме итого (считается автоматически)
- **Галочки** для питания — в формате чекбоксов
- **Числовые поля** — с автоматическим преобразованием в числа

```jsx
const row = {
  id: Math.random(),                // Локальный ID
  fullName: "Петров И.И.",          // ФИО (редактируемо)
  roomNumber: "305",                // Номер номера
  roomCategory: "Люкс",             // Категория
  breakfast: 1,                     // 1 = есть, 0 = нет
  lunch: 1,
  dinner: 0,
  breakfastPrice: 500,              // Цена завтрака
  lunchPrice: 800,
  dinnerPrice: 1000,
  roomPrice: 5000,                  // Цена номера за ночь
  nightsCount: 2,                   // Количество ночей
};
```

#### 2. Поиск

Поле `searchInput` фильтрует таблицу по ФИО или номеру номера в реальном времени.

#### 3. Итоговые вычисления

Для каждой строки:
```js
total = roomPrice * nightsCount + breakfast * breakfastPrice + lunch * lunchPrice + dinner * dinnerPrice
```

Для всей таблицы отображается:
- Количество пассажиров
- Сумма ночей (all rows)
- **Итого руб.** (сумма по всем строкам)

#### 4. Действия

- **+ Добавить строку** — добавляет пустую строку в таблицу
- **⬇ Excel** — экспортирует таблицу в Excel с названием `report-{hotelName}-{дата}.xlsx`
- **Сохранить отчёт** — отправляет данные на бэк через мутацию `SAVE_PASSENGER_REQUEST_HOTEL_REPORT`

#### 5. Удаление строк

Кнопка **✕** (класс `.removeBtn`) удаляет строку из таблицы при клике.

---

## FapReportPage — Обёртка для отчёта

### Назначение

Страница, которая:
1. Загружает заявку (`GET_PASSENGER_REQUEST`)
2. Загружает `accessMenu` (для MenuDispetcher)
3. Находит первый отель с гостями
4. Отображает `FapReport` внутри `MenuDispetcher`

### Props

| Prop | Тип | Описание |
|------|-----|---------|
| `user` | User | Текущий пользователь (из AuthContext) |

### Маршрут

```
GET /fapv2/:requestId/report
```

Пример: `/fapv2/6748d9f1b8c5e2a0f12345/report`

---

## GraphQL мутация: SAVE_PASSENGER_REQUEST_HOTEL_REPORT

### Назначение

Сохраняет отчёт по размещению в базе.

### Payload (переменные)

```js
{
  passengerRequestId: "...",  // ID заявки
  hotelIndex: 0,              // Индекс отеля в массиве hotels
  people: [
    {
      id: "...",              // ID гостя (если существует) или локальный ID
      fullName: "Петров И.И.",
      roomNumber: "305",
      roomCategory: "Люкс",
      breakfast: true,
      lunch: true,
      dinner: false,
      breakfastPrice: 500,
      lunchPrice: 800,
      dinnerPrice: 1000,
      roomPrice: 5000,
      nightsCount: 2,
    },
    // ...
  ]
}
```

### Ответ

```js
{
  savePassengerRequestHotelReport: {
    id: "...",
    passengerRequestId: "...",
    hotelIndex: 0,
    people: [/* ... */],
    createdAt: "...",
    updatedAt: "..."
  }
}
```

---

## Интеграция с FapDetail

### Кнопка «Отчёт»

В заголовке `FapDetail` (строка 180–188) добавлена кнопка:

```jsx
{request.livingService?.plan?.enabled && (
  <Button
    backgroundcolor="#F0F0F0"
    color="#2B2B34"
    onClick={() => navigate(`/fapv2/${request.id}/report`)}
  >
    📋 Отчёт
  </Button>
)}
```

**Условие видимости**: кнопка показывается, если у заявки есть сервис проживания (`livingService`) и у него включен план (`plan.enabled`).

---

## Стили

### FapReport.module.css

| Класс | Назначение |
|-------|-----------|
| `.page` | Контейнер (flex column, 100% height) |
| `.header` | Заголовок с кнопкой back и кнопками действий |
| `.title` | Текст заголовка |
| `.toolbar` | Поле поиска и фильтры |
| `.table` | Таблица (border-collapse) |
| `.input` | Поле ввода в ячейке |
| `.checkbox` | Чекбокс (accent-color: var(--dark-blue)) |
| `.removeBtn` | Кнопка удаления ✕ |
| `.totalRow` | Строка с итогами (flex, background: #F8FAFC) |
| `.totalValue` | Выделенное значение итога |
| `.actions` | Строка кнопок внизу (Добавить, Сохранить) |

---

## UX-особенности

### Автоматический расчёт

- При изменении любого поля итого пересчитываются автоматически
- Использован паттерн `useMemo` для оптимизации

### Валидация

- Все числовые поля преобразуются через `toNum()` функцию
- Поля ФИО, номер, категория — любые строки (не валидируются на клиенте)

### Состояние сохранения

- Кнопка "Сохранить отчёт" становится disabled во время сохранения (`saving` state)
- После успеха показывается toast "Отчёт сохранён"
- При ошибке — "Ошибка при сохранении" + логирование в консоль

### Export в Excel

- Используется библиотека `xlsx`
- Столбцы: ФИО, Номер, Категория, Завтрак, Обед, Ужин, все цены, итого
- Питание показывается как ✓ (галочка) если включено
- Имя файла: `report-{hotelName}-{YYYY-MM-DD}.xlsx`

---

## Изменения в App.jsx

### Импорт

```js
import FapReportPage from "./Components/Pages/FapV2/FapReportPage";
```

### Маршрут

```jsx
<Route
  path="/fapv2/:requestId/report"
  element={<FapReportPage user={user} />}
/>
```

Добавлен после маршрута `/fapv2/:requestId` (FapDetailPage).

---

## Примечания для разработки

1. **Локальное состояние** — данные таблицы хранятся в state компонента, а не в Redux/Context. Это нормально для одноразовой формы.

2. **Отель выбирается автоматически** — берётся первый отель с гостями. Если нужна возможность переключения между отелями, требуется добавить dropdown.

3. **Мутация не определена** — если `SAVE_PASSENGER_REQUEST_HOTEL_REPORT` не существует в `graphQL_requests.js`, нужно добавить:
   ```js
   export const SAVE_PASSENGER_REQUEST_HOTEL_REPORT = gql`
     mutation SavePassengerRequestHotelReport(
       $passengerRequestId: String!
       $hotelIndex: Int!
       $people: [HotelReportPeopleInput!]!
     ) {
       savePassengerRequestHotelReport(
         input: {
           passengerRequestId: $passengerRequestId
           hotelIndex: $hotelIndex
           people: $people
         }
       ) {
         id
         passengerRequestId
         hotelIndex
         people { /* поля */ }
         createdAt
       }
     }
   `;
   ```

4. **Menu в отчёте** — `FapReportPage` использует тот же `MenuDispetcher`, что и `FapDetailPage`, поэтому навигация по меню работает одинаково.

---

## История версий

| Версия | Дата | Что изменилось |
|--------|------|--------------|
| 1.0 | 15.04.2026 | Первая версия FapReport и FapReportPage; кнопка в FapDetail |
