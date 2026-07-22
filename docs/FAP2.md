# FapV2 — интерфейс заявок ФАП (фронтенд)

> Актуально на 2026-07-22. Маршруты `/far/*`, код — `src/Components/Blocks/FapV2/` + обёртки `src/Components/Pages/FapV2/`.
> Модель данных и API бэка — см. [FAP.md](FAP.md).

## Концепция

Список заявок (карточный грид) → детальная страница заявки (KPI-плитки услуг) → страница конкретной услуги. Отчёт по проживанию — внутри страницы гостиницы (вкладки «Гости / Тарифы / Отчёт»). Старый интерфейс ФАП v1 (`ReservePlacementRepresentative`, `/representativeRequests`) ещё жив у суперадмина как «ФАП v1»; легаси-редактор отчёта `FapReport` и маршрут `report/:hotelIndex` **удалены** (коммит 67ca7be).

## Маршруты (App.jsx)

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/far` | `FapV2` (через role-контенты, id="far") | Список заявок |
| `/far/:requestId` | `FapLayout` → `FapDetailPage` → `FapDetail` | Деталка заявки |
| `/far/:requestId/service/:serviceKey` | `FapServicePage` | Страница услуги (water/meal/living/transfer/transferDeparture/baggage) |
| `/far/:requestId/service/living/hotel/:hotelIndex` | `FapHotelDetailPage` → `FapHotelPage` | Гостиница: гости, тарифы, отчёт |
| `/far/:requestId/service/:serviceKey/driver/:driverIndex` | `FapDriverDetailPage` → `FapDriverPage` | Водитель трансфера/багажа |
| `/far/:requestId/registry` | `FapRegistryPage` → `FapRegistry` | Реестр пассажиров заявки |

`FapLayout` рендерит меню один раз (нет перемонтирования при навигации), берёт `accessMenu` из `useEffectiveAccessMenu(user)` и кладёт `{ user, accessMenu }` в Outlet-контекст. Для external-пользователей меню скрыто.

## Доступы

- Пункт меню «ФАП» гейтится ключом **`reserveMenu`**; создание заявки — **`reserveCreate`**; редактирование внутри — **`reserveUpdate`** (`canEdit = canAccessMenu(accessMenu, "reserveUpdate", user) && !isAirlineRole(user)`).
- **Авиакомпания**: read-only почти везде; в отчёте гостиницы — принудительный режим «Просмотр» с бейджем; в overflow-меню только «История»; фильтра по АК в списке нет (форсится свой `airlineId`).
- **External (представитель PWA)**: без меню, без Реестра, без «Скачать отчёт», пустое overflow-меню.

## Список — `Pages/FapV2/FapV2.jsx`

Карточный грид: номер заявки + статус-бейдж, крупный логотип АК, рейс + дата рейса, аэропорт, дата создания, 6 прогресс-точек услуг (`ServiceProgressDot`), бейдж «экипаж N». Тулбар: `FilterPopoverButton` (АК — скрыт для авиакомпаний, аэропорт, статус — персистится в localStorage `statusFilterFapV2`) + серверный поиск (`useDebounce` 400 мс) + «Создать заявку» (`CreateRepresentativeRequest`). Реалтайм: `PASSENGER_REQUEST_CREATED/UPDATED_SUBSCRIPTION` → `refetch()`. Запрос — `GET_PASSENGER_REQUESTS` (`take: 100`, `skip: 0`).

## Деталка — `Blocks/FapV2/FapDetail`

- Статусы заявки: линейные переходы `CREATED→ACCEPTED→IN_PROGRESS→COMPLETED` через статус-пилл с поповером + подтверждающий диалог; отмена — `FapDestructiveModal` с необязательной причиной. Менять статус может только не-АК (`canChangeStatus`).
- Шапка: `FapRegistryButton` («Реестр · N» из `savedPassengers.length`), primary «Скачать отчёт» (`downloadRequestReport` — сводный XLSX по сохранённым отчётам), `FapOverflowMenu` ⋯ [Редактировать (`AddRepresentativeService`), История (`PassengerRequestLogs`) | Отменить]. Кнопка «Ссылка» копирует PWA-ссылку представительства (`useRepresentativeLink`: по `representativeDepartmentId` юзера, fallback первая с `linkPWA`).
- KPI-плитки услуг 3×2: факт/план чел., прогресс-бар, статус-глагол, дедлайн (для проживания — диапазон дат + сутки через `calculateEffectiveCostDays`); багаж считает доставки по `deliveryCompletedAt`.
- `FapChat` — чат заявки: `GET_PASSENGER_REQUEST_CHATS` + `REQUEST_MESSAGES_SUBSCRIPTION`, отправка через общий `Message.jsx` в fap-режиме (`SEND_FAP_MESSAGE`).

## Страницы услуг

`FapServicePage` маппит `serviceKey` → компонент и передаёт `canEdit`:

| Услуга | Компонент | Мутации |
|--------|-----------|---------|
| Вода / питание | `FapWaterMealPage` (общий, `serviceKind` WATER/MEAL) | ADD/UPDATE/REMOVE_PASSENGER_REQUEST_PERSON, ADD_…_PEOPLE (bulk из реестра), COMPLETE_…_WATER/MEAL_EARLY |
| Проживание (список отелей) | `FapLivingPage` | UPDATE/REMOVE_PASSENGER_REQUEST_HOTEL, COMPLETE_…_LIVING_EARLY |
| Гостиница | `FapHotelPage` (см. ниже) | ADD/UPDATE/REMOVE_…_HOTEL_PERSON, ADD_…_HOTEL_PEOPLE, RELOCATE/EVICT_…_HOTEL_PERSON, SAVE_…_HOTEL_REPORT |
| Трансфер (прилёт/вылет — один компонент, prop `direction`) | `FapTransferPage` → водители | UPDATE/REMOVE_PASSENGER_REQUEST_DRIVER, COMPLETE_…_TRANSFER_EARLY |
| Водитель | `FapDriverPage` | ADD/UPDATE/REMOVE_…_DRIVER_PERSON, ADD_…_DRIVER_PEOPLE, UPDATE_…_DRIVER |
| Багаж | `FapBaggagePage` | COMPLETE_…_BAGGAGE_DRIVER_DELIVERY, REMOVE_…_BAGGAGE_DRIVER, COMPLETE_…_BAGGAGE_EARLY |

Во всех услугах: добавление людей вручную или батчем из реестра (`CatalogPickerModal` — матч по `personId`, лимит по свободным местам, `personCategory` форвардится); возрастная категория (`CategoryBadge`: взрослый/ребёнок/инфант) видна и редактируема; primary-кнопка + overflow ⋯ [отчёт, редактировать, история | Завершить].

## Движок отчёта по проживанию — `FapHotelPage` (~2640 строк)

Вкладки «Гости» / «Тарифы» / «Отчёт».

**Тариф (клиентский объект):** `{ id, name, breakfast/lunch/dinner (цены питания), billingMode: "PER_BED"|"PER_ROOM", placementPrices: [{places, pricePerDay}], draft, source? }`. Второй источник — тарифы гостиницы (`source:"hotel"`) из АК-цен (`GET_FAP_HOTEL_TARIFFS`), показываются только при полных ценах для АК.

**Персист без сущности на бэке:** тарифы сериализуются в `reportRows` **ghost-строками** (пустой `fullName`; по одной на пару тариф×вид размещения; `tariffName`, `pricePerDay`, `placementKind`; `roomKind:"PER_ROOM"` — маркер режима «Номер»). Восстановление при загрузке: ghost-строки — авторитетный источник; строки гостей с `tariffName` — оболочка; строки без `tariffName` — legacy-полоса (инференция по ценовому ключу, `legacyFlatAccommodation`).

**Расчёт строки (`getEffectiveRow`):**
- Вид размещения номера = число гостей в номере (1-местное/2-местное…).
- `PER_BED` («Койко-место»): проживание = `pricePerDay(вид) × daysCount × accommodationChargeFactor` — возрастная скидка: взрослый ×1, ребёнок ×0.5, инфант ×0.
- `PER_ROOM` («Номер»): режим номера задаёт **несущий гость** (первый с тарифом в номере); проживание начисляется один раз на несущего без скидки, остальным 0 («в сумме номера»). Питание всегда per-guest.
- Без тарифа — ручной ввод суммы. `daysCount` по умолчанию из `accommodationChesses`/плана через `calculateEffectiveCostDays` (частичные сутки).
- Итог группы (номера) = сумма строк; общий итог = сумма групп.

**Режимы:** `FapModeToggle` «Просмотр/Редактирование», localStorage `fapReportMode` (глобальный на приложение), для АК форс view. View-рендер — `FapReportView` (сводка итогов + карточки номеров + формулы).

**Сохранение:** дебаунс 300 мс → `SAVE_PASSENGER_REQUEST_HOTEL_REPORT` (полная замена строк); флаш на unmount и перед экспортом. Номер комнаты хранится на госте (`person.roomNumber`), правка в отчёте коммитится мутацией гостя.

**Экспорт XLSX:** `reports/buildReportSheets.js` — единый экспортёр, 23 колонки A–W (в т.ч. «Возрастная категория», «Вид размещения», «Тариф», «Цена за сутки», выводимая «Скидка»), листы по отелю и сводный; матч строк к гостям по ФИО; шапка с датой рейса.

**Известные ограничения:**
- Матч строк отчёта к гостям — **по ФИО**: переименование гостя рвёт связь со строкой (тариф/сутки/питание слетают при следующей загрузке).
- Автосейв = полная замена → при параллельной работе двух диспетчеров last-write-wins.
- Тарифы с одинаковыми именами схлопываются при восстановлении.

## Реестр — `FapRegistry` (`/far/:requestId/registry`)

Таблица `savedPassengers` с CRUD (`ADD/UPDATE/REMOVE_PASSENGER_REQUEST_SAVED_PERSON`), колонка «Услуги» (presence по `personId` в 5 услугах), удаление с предупреждением «размещён в: …» (из услуг не удаляется — так устроен бэк), экипаж read-only. Импорт манифеста: `ManifestUploadField` → `parseManifestXlsx` (`manifestCore.js` + профили ПМ/PNL в `manifestProfiles.js`; .xlsb/.xlsx/.xls; отдаёт people с `personCategory` + flightNumber) → bulk `ADD_PASSENGER_REQUEST_SAVED_PEOPLE`. Соответствие рейса манифеста рейсу заявки **не валидируется**.

## Аналитика «Пассажиры»

`src/Components/Pages/AnalyticsForAvia/tabs/PassengerAnalytics/` — вкладка в «Аналитике»: модалка фильтров (период по `flightDate` с гибридом по `createdAt`, декада-пресеты, аэропорт, № рейса), KPI-плашки, таблица по заявкам со статус-пилюлями, экспорт XLSX (exceljs). Источник — `GET_PASSENGER_ANALYTICS` (бэк агрегирует сохранённые `reportRows` + `reportCost`, ghost-строки исключены). АК видит только свои заявки.

## fapConstants.js

`SERVICE_CONFIG` (6 услуг: ключ, label, цвет, `serviceKind`, direction), `REQUEST_STATUS_CONFIG` / `SERVICE_STATUS_CONFIG`, `PERSON_TYPE_CONFIG`, `PERSON_CATEGORY_LABEL/BADGE/OPTIONS`, `normalizeCategory`, **`accommodationChargeFactor`** (возрастная скидка на проживание: 1 / 0.5 / 0), форматтеры `formatDate/formatTime/formatDateTime`, `toLocalInputValue`, `getServiceByKey`.

## Общие компоненты FapV2

`FapActionButton` (primary/ghost), `FapOverflowMenu` (⋯, click-outside, схлопывание разделителей), `FapRegistryButton`, `FapModeToggle`, `FapDestructiveModal` (подтверждение с причиной), `FapSelect`, `ServiceProgressDot`, `PersonBadge`, `CategoryBadge`, `PersonTypeToggle`, `CatalogPickerModal`, `ManifestUploadField`, `FapChat`, `hooks/useRepresentativeLink`.
