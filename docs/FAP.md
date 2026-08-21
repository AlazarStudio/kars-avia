# Документация по ФАП (Passenger Request) — бэкенд

> Актуально на 2026-08-21 (обновлены §3.3, §7, §8; остальное — ревизия 2026-07-22, модель данных и API сверены выборочно).
> Бэк-репо: `kars-avia-backend-graphql`, ветка **main** (ветки dev2 в бэк-репо нет).
> Фронтовая архитектура — см. [FAP2.md](FAP2.md). Передача модуля бэкендеру — см. [FAP-HANDOVER.md](FAP-HANDOVER.md).

## 1. Общее описание

**ФАП** — заявка на организацию услуг **пассажирам задержанного рейса** (и/или экипажу): поставка воды, питание, проживание в гостиницах, трансфер (прилёт/вылет), доставка багажа. Заявка привязана к авиакомпании, аэропорту и рейсу; в ней включаются нужные услуги с планом (количество людей, время/даты), далее заполняются исполнители (водители, отели) и конкретные люди.

Хранение — **один MongoDB-документ** `PassengerRequest`: все услуги — embedded composite-типы (Prisma `type`, не `model`), люди внутри услуг адресуются **числовыми индексами массивов** (`hotelIndex`/`driverIndex`/`personIndex`). Миграций нет (`db push`) — схему менять только аддитивно.

---

## 2. Модель данных (Prisma / MongoDB)

### 2.1. PassengerRequest (schema.prisma ~1267)

| Поле | Тип | Описание |
|------|-----|----------|
| `id`, `createdAt`, `updatedAt` | | Системные |
| `requestNumber` | String? @unique | Человекочитаемый номер `{seq4}{airportCode}{MM}{YY}f`, напр. `0001SVO0526f` |
| `airlineId` | ObjectId | Авиакомпания (relation) |
| `airportId` | ObjectId? | Аэропорт (relation) |
| `flightNumber` | String | Номер рейса |
| `flightDate` | DateTime? | Дата рейса (у старых заявок поле **unset**, не null — в Mongo это разные вещи, фильтровать через `OR: [{flightDate: null}, {flightDate: {isSet: false}}]`) |
| `routeFrom`, `routeTo` | String? | Маршрут |
| `plannedPassengersCount` | Int? | План пассажиров |
| `includesCrew`, `includesPassengers` | Boolean | Состав заявки |
| `crewMembers` | PassengerRequestCrewMember[] | Ростер экипажа (выбранные сотрудники АК) |
| `savedPassengers` | PassengerRequestSavedPerson[] | **Реестр пассажиров заявки** — канонический источник идентичности (см. §3.2) |
| `waterService`, `mealService` | PassengerWaterFoodService? | Вода / питание (общая модель) |
| `livingService` | PassengerLivingService? | Проживание |
| `transferService` | PassengerTransferService? | Трансфер аэропорт→гостиница (ARRIVAL) |
| `departureTransferService` | PassengerTransferService? | Трансфер гостиница→аэропорт (DEPARTURE) |
| `intercityTransferService` | PassengerTransferService? | Межгородний трансфер — **в схеме есть, фронтом не используется** |
| `baggageDeliveryService` | PassengerTransferService? | Доставка багажа |
| `status`, `statusTimes` | | Общий статус + времена переходов |
| `earlyCompletionReason`, `earlyCompletedAt`, `cancelReason` | | Досрочное завершение / отмена |
| `createdById` | ObjectId | Кто создал |
| `representativeLinks` | PassengerRepresentativeLink[] | PWA-ссылки представительств по заявке |
| `hotelReports` | PassengerRequestHotelReport[] | Сохранённые отчёты по отелям (§4) |
| `chats`, `files`, `logs`, `notifications` | | Связи |

### 2.2. Статусы

`PassengerRequestStatus` (заявка): `CREATED → ACCEPTED → IN_PROGRESS → COMPLETED`, + `CANCELLED`.
`PassengerServiceStatus` (каждая услуга): `NEW → ACCEPTED → IN_PROGRESS → COMPLETED`, + `CANCELLED`.

### 2.3. Люди

| Тип | Где | Поля |
|-----|-----|------|
| `PassengerRequestSavedPerson` | реестр заявки | `personId` (стабильный UUID), `fullName`, `phone?`, `seat?`, `personType` (PASSENGER/CREW), `personCategory` (ADULT/CHILD/INFANT), `airlinePersonalId?`, `addedAt` |
| `PassengerServicePerson` | вода/питание | `personId?`, `fullName`, `personCategory?`, `issuedAt?` (время выдачи), `phone?`, `seat?` |
| `PassengerServiceHotelPerson` | проживание | + `roomNumber`, `arrival`, `departure`, `roomCategory`, `roomKind`, `accommodationChesses` |
| `PassengerServiceDriverPerson` | трансфер/багаж | `personId?`, `fullName`, `personCategory?`, `phone?` |

`personCategory` — сквозная возрастная категория (взрослый / ребёнок 2–12 / инфант до 2). Одна driver-модель и одна water/food-модель покрывают 5 услуг → 2 поля Prisma закрыли все сервисы.

### 2.4. План услуги: PassengerServicePlan

`enabled`, `peopleCount?`, `plannedAt?`, `plannedFromAt?`/`plannedToAt?` (период для проживания).

---

## 3. Ключевые механики бэка

### 3.1. Статус услуги: `recomputeServiceStatus`

`services/passengerRequest/serviceStatus.js` — чистая функция, вызывается из **всех** мутаций, меняющих число людей (~21 call site). Правила:

- `CANCELLED` — не трогаем.
- `COMPLETED` + добавили человека → `IN_PROGRESS` (сброс `finishedAt`).
- `COMPLETED` + факт стал меньше плана → `IN_PROGRESS`.
- `NEW`/`ACCEPTED` при появлении людей → `IN_PROGRESS`.
- факт ≥ план → `COMPLETED` (автозавершение).

### 3.2. Единая идентичность пассажира (гидрация)

`savedPassengers` — единственный источник идентичности (`fullName`, `personCategory`, `phone`, `personType`, `seat`, `airlinePersonalId`), матч-ключ — `personId`.

- **Чтение**: `hydratePassengerRequest` (services/passengerRequest/hydratePassengerRequest.js) накладывает идентичность из реестра на людей всех услуг. Подключена в `Query.passengerRequest`, `Query.passengerRequests`, `publishPassengerRequestUpdated` и `Notification.passengerRequest`.
- **Запись**: update-person мутации услуг пропагируют правки идентичности в реестр (`patchSavedPersonIdentity`, incoming-wins).
- **Добавление**: при добавлении человека в услугу снапшот попадает в реестр (`savedPassengers.js`, merge existing-wins для `personCategory` — повторное добавление с дефолтом не затирает реальный CHILD/INFANT).
- Ручное добавление в услугу = свежий `personId` = отдельный человек; унификация — только через выбор из реестра.
- Выселения (evictions) и отчёты по отелям — снапшоты, гидрацией **не** трогаются.

### 3.3. Авторизация (состояние на 2026-08-21)

Историческая «авторизация отключена» (42 закомментированных middleware) закрыта работами 04–06.08:

- **Аутентификация**: весь модуль обёрнут `withFapAuthGuard` (`services/passengerRequest/fapAccess.js`) — аноним получает 401 `UNAUTHENTICATED`, субъект чужого типа — 403 `FORBIDDEN`. Белый список типов субъекта закрытый: `USER`, `EXTERNAL_USER`, `DRIVER`, `AIRLINE_PERSONAL` (⚠️ `HOTEL_PREVIEW` — публичный субъект, в ФАП не допущен намеренно).
- **`recognizePassengerDocument`** — под rate-limit (40/мин на субъекта; каждый вызов — два платных обращения в Yandex Cloud).
- **Изоляция заявок между организациями (FAP_SCOPE)**: правила в `services/passengerRequest/fapScope.js`, охрана в `fapScopeGuard.js`; конверт мутаций закрывает 48 из 55 мутаций одной строкой. Работает в **режиме наблюдения** (пишет лог `FAP_SCOPE` в `logs/warn/`); жёсткий режим включается env-флагом `FAP_SCOPE_ENFORCE=true`. Перед включением: прогон read-only `services/migrations/checkFapScopeReadiness.js` на бою + лог за полный рабочий цикл. Гостиничные субъекты изолируются безусловно, не дожидаясь флага.
- **Внутризаявочные гейты гостиниц** (коммит `e5ee1f9`, 19.08): пер-гостиничные проверки внутри общих заявок, роль `HOTELUSER` добавлена к гостиничным, аналитика «Пассажиры» гостиницам запрещена.
- ⚠️ **Ролевые проверки (`allMiddleware`/`roleMiddleware`) включать нельзя**: у `ExternalUser` нет поля `role` — любой ролевой middleware убьёт PWA и гостиничный вход. Гейты строить только через `resolveScope`/скоупы.
- **Чего нет**: серверной проверки прав редактирования (`reserveUpdate`/`reserveUpdateCompleted` проверяются только на фронте — прямой мутацией завершённую заявку править можно); вопрос о границах серверного enforcement открыт у владельца.

---

## 4. Отчёт по отелю: PassengerRequestHotelReport

Модель (schema ~1335): `passengerRequestId` + `hotelIndex` (`@@unique`), `reportRows Json`, `updatedAt`. Сохранение — `savePassengerRequestHotelReport(requestId, hotelIndex, reportRows)`: **полная замена** строк через upsert.

Поля строки (`PassengerRequestHotelReportRow`, 13 полей): `fullName`, `roomNumber`, `roomCategory`, `roomKind`, `daysCount`, `breakfast`, `lunch`, `dinner`, `foodCost`, `accommodationCost`, `tariffName`, `pricePerDay`, `placementKind`.

Важное:

- **Тариф — не сущность бэка.** Фронт сериализует тарифы «ghost-строками» (пустой `fullName`, `tariffName` = имя, `pricePerDay`+`placementKind` = цена вида размещения, `roomKind: "PER_ROOM"` — маркер режима «Номер») и восстанавливает их при загрузке. Подробности — FAP2.md §Движок отчёта.
- Резолвер при сохранении подменяет `roomCategory` на `makeRoomCategoryLabel(roomCategory, roomKind)` — для PER_ROOM ghost-строк в БД оседает `"ИмяТарифа / PER_ROOM"`. Потребители `roomCategory` должны это учитывать.
- Ghost-строки (пустой `fullName`) обязаны исключаться из любых сумм по людям (иначе двойной счёт) — так делает и аналитика (`passengerAnalyticsUtils.js`).

---

## 5. GraphQL API

### 5.1. Queries

| Операция | Аргументы | Описание |
|----------|-----------|----------|
| `passengerRequests` | `filter`, `skip`, `take` | Список, `orderBy createdAt desc`. Фильтр: `airlineId`, `airportId`, `status`, `search` (requestNumber/flightNumber/routeFrom/routeTo, insensitive contains) |
| `passengerRequest(id)` | | Одна заявка (гидрированная) |
| `passengerAnalytics(input)` | период по `flightDate` (гибрид с `createdAt` для старых), airportIds, flightNumber, status | Аналитика «Пассажиры»: агрегация сохранённых `reportRows` + `reportCost` водителей, скоуп по `airlineId` для АК |

### 5.2. Mutations (по группам)

**Заявка:** `createPassengerRequest`, `updatePassengerRequest`, `setPassengerRequestStatus`, `cancelPassengerRequest`, `completePassengerRequestEarly`, `updatePassengerRequestCrew`.

**Реестр (savedPassengers):** `addPassengerRequestSavedPerson`, `updatePassengerRequestSavedPerson`, `removePassengerRequestSavedPerson`, `addPassengerRequestSavedPeople` (bulk — импорт манифеста). Удаление из реестра **не** удаляет человека из услуг.

**Вода/питание:** `addPassengerRequestPerson`, `addPassengerRequestPeople` (bulk из реестра), `updatePassengerRequestPerson`, `removePassengerRequestPerson`, `completePassengerRequestWaterEarly`/`MealEarly`.

**Проживание:** `addPassengerRequestHotel`/`update`/`remove`, `addPassengerRequestHotelPerson`, `addPassengerRequestHotelPeople` (bulk), `updatePassengerRequestHotelPerson`, `removePassengerRequestHotelPerson`, `relocatePassengerRequestHotelPerson`, `evictPassengerRequestHotelPerson`, `completePassengerRequestLivingEarly`, `savePassengerRequestHotelReport`.

**Трансфер (оба направления):** `addPassengerRequestDriver`/`update`/`remove`, `addPassengerRequestDriverPerson`, `addPassengerRequestDriverPeople` (bulk), `updatePassengerRequestDriverPerson`, `removePassengerRequestDriverPerson`, `completePassengerRequestTransferEarly`.

**Багаж:** `addPassengerRequestBaggageDriver`/`remove`, `completePassengerRequestBaggageDriverDelivery` (отметка доставки по водителю → `deliveryCompletedAt`), `completePassengerRequestBaggageEarly`.

**Статус услуги:** `setPassengerRequestServiceStatus(id, service: WATER|MEAL|LIVING|TRANSFER|DEPARTURE_TRANSFER|BAGGAGE_DELIVERY, status)`.

**Чат:** `sendFapMessage` (+ `markMessageAsRead`, `markAllMessagesAsRead` — общие).

**Представительства / внешние пользователи:** `createRepresentativePwaLink`, `createExternalAuthLink`, `authorizeExternalAuth`, `adminExtendExternalAuthSession`; вход по magic link. `recognizePassengerDocument` — фото-распознавание документа (Yandex OCR → GPT), используется PWA. ⚠️ Без auth и rate-limit (платный API).

### 5.3. Subscriptions

`passengerRequestCreated`, `passengerRequestUpdated` (публикуется гидрированная заявка), плюс чатовые (`newUnreadMessage`, `messageSent`).

---

## 6. Логирование

Все мутации пишут в лог заявки через `logPassengerRequestAction` (`action`, `description`, `fulldescription`, `reason`, `oldData`/`newData`, пользователь из контекста). Чтение — `passengerRequest.logs(pagination)` / `GET_PASSENGER_REQUEST_LOGS` на фронте.

---

## 7. Тесты

`node --test tests/` (node:test, npm-скрипта нет). С августа модуль накрыт **характеризационной сетью** (300+ тестов, `tests/passengerRequest/characterization/`), плюс юниты правил (`fapScope`, `fapScopeGuard`, `serviceStatus`, гидрация, аналитика). Оснастка: `tests/helpers/{seq,prismaDouble,fapHarness,runFapMutation}.js` — модели подменяются на синглтоне `prisma` (обходит отсутствие `mock.module` в Node 20).

⚠️ Ловушки прогона: (1) два падения — средовые и **чужие** (`tests/airline/buildPriceSearchLocation`, `tests/geo/normalizePriceGeography`, Node 20 без `mock.module`) — чинить запрещено, бэйзлайн мерить «не выросло», а не «чисто»; (2) `pubsub` при непустом `REDIS_URL` держит процесс — в каждом файле, импортирующем резолвер, обязателен `releasePubsubAfterTests()`; (3) прогон под `FAP_SCOPE_ENFORCE=true` обязан давать те же числа, что и без флага; (4) поле плана услуги — `peopleCount`, не `count` (фикстура с другим ключом молча проверяет не ту ветку); (5) локальный прогон пишет шум в боевой `logs/`.

---

## 8. Известный техдолг

1. Серверной проверки прав редактирования нет (см. §3.3, «Чего нет»); `FAP_SCOPE_ENFORCE` ещё не включён (режим наблюдения).
2. Стоимость не моделируется на бэке — `reportRows` пишется verbatim с фронта, не агрегируется в БД (аналитика читает Json «как есть»). Движок стоимости — отложенная целевая инвестиция.
3. Index-addressed embedded-модель порождает ~45 однотипных мутаций-патчей; переписывание на relations признано неоправданно рискованным (аудит 2026-07-21). Этапы 4–6 рефактора (поверхность 55 → 42 мутации, адресация по id, typeDef) — спланированы, не начаты; правило трёх шагов: бэк добавляет новую форму → клиенты переезжают → бэк сносит старую.
4. Валидация «манифест соответствует рейсу заявки» — только предупреждение на фронте, бэк не проверяет.
5. Заявка отдаётся участнику целиком (соседние гостиницы, выселения с ФИО, весь реестр) — фильтрации содержимого документа нет; частично сужено пер-гостиничными гейтами 19.08.
