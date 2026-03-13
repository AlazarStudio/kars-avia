# Документация по ФАП (Заявка для экипажа / Passenger Request)

## 1. Общее описание

**ФАП** — заявка представителя авиакомпании на организацию услуг для экипажа по рейсу: поставка воды, питание, проживание, трансфер, доставка багажа. Заявка привязана к авиакомпании, аэропорту и рейсу; в ней включаются нужные сервисы с планом (количество людей, время) и далее заполняются конкретные исполнители (водители, отели, пассажиры).

---

## 2. Модель данных (Prisma / MongoDB)

### 2.1. Основная сущность: PassengerRequest

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | ObjectId | Идентификатор заявки |
| `createdAt`, `updatedAt` | DateTime | Системные даты |
| `airlineId` | ObjectId | Авиакомпания |
| `airportId` | ObjectId? | Аэропорт |
| `flightNumber` | String | Номер рейса |
| `flightDate` | DateTime? | Дата рейса |
| `routeFrom`, `routeTo` | String? | Маршрут |
| `plannedPassengersCount` | Int? | Планируемое количество пассажиров |
| `waterService` | PassengerWaterFoodService? | Услуга «Поставка воды» |
| `mealService` | PassengerWaterFoodService? | Услуга «Поставка питания» |
| `livingService` | PassengerLivingService? | Услуга «Проживание» |
| `transferService` | PassengerTransferService? | Услуга «Трансфер» |
| `baggageDeliveryService` | PassengerTransferService? | Услуга «Доставка багажа» |
| `status` | PassengerRequestStatus | Общий статус заявки (CREATED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED) |
| `statusTimes` | PassengerStatusTimes? | Времена смены общего статуса |
| `earlyCompletionReason` | String? | Причина досрочного завершения заявки |
| `earlyCompletedAt` | DateTime? | Дата досрочного завершения |
| `createdById` | ObjectId | Кто создал заявку |
| Связи | | `chats` (Chat[]), `hotelReports` (PassengerRequestHotelReport[]), `externalUsers` (PassengerRequestExternalUser[]), `logs` (история действий через запрос `logs`) |

### 2.2. Статусы

**PassengerRequestStatus** (заявка в целом):

- `CREATED` — создана  
- `ACCEPTED` — принята  
- `IN_PROGRESS` — в работе  
- `COMPLETED` — завершена  
- `CANCELLED` — отменена  

**PassengerServiceStatus** (каждый сервис внутри заявки):

- `NEW`  
- `ACCEPTED` — принята  
- `IN_PROGRESS` — выполняется  
- `COMPLETED` — поставка завершена  
- `CANCELLED` — отменена  

### 2.3. План услуги: PassengerServicePlan

| Поле | Тип | Описание |
|------|-----|----------|
| `enabled` | Boolean | Услуга включена |
| `peopleCount` | Int? | Количество человек (для багажа не используется) |
| `plannedAt` | DateTime? | Планируемое время |
| `plannedFromAt`, `plannedToAt` | DateTime? | Период (для проживания) |

### 2.4. Услуга «Вода» / «Питание»: PassengerWaterFoodService

| Поле | Тип | Описание |
|------|-----|----------|
| `plan` | PassengerServicePlan? | План (люди, время) |
| `status` | PassengerServiceStatus | Статус услуги |
| `times` | PassengerStatusTimes? | acceptedAt, inProgressAt, finishedAt, cancelledAt |
| `earlyCompletionReason` | String? | Причина досрочного завершения |
| `earlyCompletedAt` | DateTime? | Когда завершена досрочно |
| `people` | PassengerServicePerson[] | Список ФИО + время выдачи |

**PassengerServicePerson:** `fullName`, `issuedAt`, `phone`, `seat` (опционально).

### 2.5. Услуга «Проживание»: PassengerLivingService

| Поле | Тип | Описание |
|------|-----|----------|
| `plan` | PassengerServicePlan? | План (места, даты заселения/выселения) |
| `status` | PassengerServiceStatus | Статус |
| `times` | PassengerStatusTimes? | Времена смены статуса |
| `hotels` | PassengerServiceHotel[] | Список отелей |
| `evictions` | PassengerLivingServiceEviction[] | История выселений |

**PassengerServiceHotel:** `itemId`, `hotelId`, `name`, `peopleCount`, `address`, `link`, `people` (брони).  
**PassengerServiceHotelPerson:** `fullName`, `phone`, `roomNumber`, `arrival`, `departure`, `roomCategory`, `roomKind`, `accommodationChesses`.  
**PassengerLivingServiceEviction:** выселение с причиной и датой.

### 2.6. Услуга «Трансфер»: PassengerTransferService

| Поле | Тип | Описание |
|------|-----|----------|
| `plan` | PassengerServicePlan? | План (количество людей, время) |
| `status` | PassengerServiceStatus | Статус |
| `times` | PassengerStatusTimes? | Времена смены статуса |
| `drivers` | PassengerServiceDriver[] | Водители |

**PassengerServiceDriver:**  
`fullName`, `phone`, `peopleCount`, `pickupAt`, `link`, `addressFrom`, `addressTo`, `people` (пассажиры по водителю).  
**PassengerServiceDriverPerson:** `fullName`, `phone`.

Авто-смена статуса трансфера:

- первый добавленный водитель → `ACCEPTED`;
- первый добавленный пассажир к любому водителю → `IN_PROGRESS`;
- суммарное количество пассажиров по водителям ≥ `plan.peopleCount` → `COMPLETED`.

### 2.7. Услуга «Доставка багажа»: baggageDeliveryService

Тип тот же — **PassengerTransferService** (план без людей, только время).

**PassengerServiceDriver** для багажа:

- `fullName`, `phone`, `addressFrom`, `addressTo`, `link`, `description`;
- `peopleCount` при создании не используется (можно 0);
- `deliveryCompletedAt` — когда отмечена выполненная доставка **конкретным** водителем.

Досрочное завершение всей услуги «Доставка багажа» (кнопка «Завершить» + причина) не хранит причину в документе сервиса, только в логах заявки.

---

## 3. GraphQL API

### 3.1. Запросы (Query)

| Операция | Аргументы | Описание |
|----------|-----------|----------|
| `passengerRequests` | `filter`, `skip`, `take` | Список заявок с фильтром и пагинацией |
| `passengerRequest(id)` | `id: ID!` | Одна заявка по ID |

Фильтр: `PassengerRequestFilterInput` — `airlineId`, `airportId`, `status`, `search`.

### 3.2. Мутации (Mutation)

#### Заявка

| Мутация | Аргументы | Описание |
|---------|-----------|----------|
| `createPassengerRequest` | `input: PassengerRequestCreateInput!` | Создание ФАП |
| `updatePassengerRequest` | `id: ID!`, `input: PassengerRequestUpdateInput!` | Обновление ФАП |
| `deletePassengerRequest` | `id: ID!` | Удаление ФАП |
| `setPassengerRequestStatus` | `id: ID!`, `status: PassengerRequestStatus!` | Смена общего статуса |
| `setPassengerRequestServiceStatus` | `id: ID!`, `service: PassengerServiceKind!`, `status: PassengerServiceStatus!` | Смена статуса одного сервиса (WATER, MEAL, LIVING, TRANSFER, BAGGAGE_DELIVERY) |
| `completePassengerRequestEarly` | `id: ID!`, `reason: String!` | Досрочное завершение всей заявки (причина пишется в лог и в заявку) |

#### Вода / Питание

| Мутация | Аргументы | Описание |
|---------|-----------|----------|
| `addPassengerRequestPerson` | `requestId`, `service: WATER \| MEAL`, `person: PassengerServicePersonInput!` | Добавить человека (ФИО, время выдачи и т.д.) в воду или питание |
| `completePassengerRequestWaterEarly` | `requestId: ID!`, `reason: String!` | Досрочно завершить услугу «Поставка воды» (причина в лог и в сервис) |
| `completePassengerRequestMealEarly` | `requestId: ID!`, `reason: String!` | Досрочно завершить услугу «Поставка питания» (причина в лог и в сервис) |

#### Проживание

| Мутация | Аргументы | Описание |
|---------|-----------|----------|
| `addPassengerRequestHotel` | `requestId`, `hotel: PassengerServiceHotelInput!` | Добавить отель |
| `addPassengerRequestHotelPerson` | `requestId`, `hotelIndex`, `person` | Добавить пассажира в отель |
| `updatePassengerRequestHotelPerson` | `requestId`, `hotelIndex`, `personIndex`, `person` | Редактировать пассажира в отеле |
| `removePassengerRequestHotelPerson` | `requestId`, `hotelIndex`, `personIndex` | Удалить пассажира из отеля |
| `relocatePassengerRequestHotelPerson` | `requestId`, `fromHotelIndex`, `toHotelIndex`, `personIndex`, `reason`, `movedAt?` | Переселить пассажира между отелями |
| `evictPassengerRequestHotelPerson` | `requestId`, `hotelIndex`, `personIndex`, `reason`, `evictedAt?` | Выселить пассажира из отеля |
| `savePassengerRequestHotelReport` | `requestId`, `hotelIndex`, `reportRows` | Сохранить отчёт по отелю (таблица строк) |

#### Трансфер

| Мутация | Аргументы | Описание |
|---------|-----------|----------|
| `addPassengerRequestDriver` | `requestId`, `driver: PassengerServiceDriverInput!` | Добавить водителя (ФИО, телефон, кол-во мест, адреса, ссылка) |
| `addPassengerRequestDriverPerson` | `requestId`, `driverIndex`, `person: PassengerServiceDriverPersonInput!` | Добавить пассажира к водителю |
| `updatePassengerRequestDriverPerson` | `requestId`, `driverIndex`, `personIndex`, `person` | Редактировать пассажира у водителя |
| `removePassengerRequestDriverPerson` | `requestId`, `driverIndex`, `personIndex` | Удалить пассажира у водителя |

#### Доставка багажа

| Мутация | Аргументы | Описание |
|---------|-----------|----------|
| `addPassengerRequestBaggageDriver` | `requestId`, `driver: PassengerServiceDriverInput!` | Добавить водителя (ФИО, телефон, адреса, ссылка, описание; без peopleCount) |
| `completePassengerRequestBaggageDriverDelivery` | `requestId: ID!`, `driverIndex: Int!` | Отметить доставку выполненной для водителя с индексом `driverIndex` (0-based) |
| `completePassengerRequestBaggageEarly` | `requestId: ID!`, `reason: String!` | Досрочно завершить всю услугу «Доставка багажа» (причина только в лог) |

### 3.3. Подписки (Subscription)

| Подписка | Описание |
|----------|----------|
| `passengerRequestCreated` | Создана новая заявка ФАП |
| `passengerRequestUpdated` | Заявка ФАП обновлена |

### 3.4. Специальные поля заявки

- `passengerRequest.hotelReport(hotelIndex: Int!)` — сохранённый отчёт по отелю по индексу.
- `passengerRequest.hotelReports` — все сохранённые отчёты по отелям.
- `passengerRequest.logs(pagination)` — история действий по заявке (логи ФАП).

---

## 4. Логирование (история действий)

Все мутации, меняющие данные ФАП, пишут запись в лог заявки через `logPassengerRequestAction`. В лог попадают: `action`, `description`, `fulldescription`, `reason` (если есть), `oldData`, `newData`, `airlineId`, `passengerRequestId`, пользователь из контекста.

Примеры `action`:

- `create_passenger_request`, `update_passenger_request`, `delete_passenger_request`
- `update_passenger_request_status`, `update_passenger_request_service_status`
- `add_passenger_request_person`
- `add_passenger_request_hotel`, `add_passenger_request_hotel_person`, `update_passenger_request_hotel_person`, `remove_passenger_request_hotel_person`
- `add_passenger_request_driver`, `add_passenger_request_driver_person`, `update_passenger_request_driver_person`, `remove_passenger_request_driver_person`
- `add_passenger_request_baggage_driver`, `complete_passenger_request_baggage_driver_delivery`, `complete_passenger_request_baggage_early`
- `complete_passenger_request_water_early`, `complete_passenger_request_meal_early`, `complete_passenger_request_early`
- `relocate_passenger_request_hotel_person`, `evict_passenger_request_hotel_person`
- `save_passenger_request_hotel_report`

---

## 5. Фронтенд (маршруты и экраны)

### 5.1. Маршруты (React Router)

- `/:id/representativeRequestsPlacement/:idRequest` — страница размещения по заявке ФАП (вкладки: вода, питание, трансфер, доставка багажа, проживание).
- `/:id/representativeRequestsPlacement/:idRequest/hotel/:hotelId` — карточка отеля (проживание): брони, чат, отчёт.
- `/:id/representativeRequestsPlacement/:idRequest/hotel/:hotelId/report` — отчёт по отелю.
- `/:id/representativeRequestsPlacement/:idRequest/driver/:driverIndex` — карточка водителя трансфера: пассажиры, чат (доставка багажа в деталь водителя не заходит).

`id` — идентификатор представителя/контекста, `idRequest` — ID заявки ФАП.

### 5.2. Основные компоненты

- **RepresentativeRequests** — список заявок; кнопка «Создать заявку» открывает сайдбар создания ФАП.
- **CreateRepresentativeRequest** — форма создания ФАП: авиакомпания, рейс, аэропорт, чекбоксы услуг (вода, питание, проживание, трансфер, доставка багажа). Для каждой услуги — свои поля (для багажа только время, без количества людей).
- **AddRepresentativeService** — добавление ещё не включённых услуг к существующей заявке (то же: для багажа только время).
- **ReservePlacementRepresentative** — страница одной заявки: фильтры-вкладки (Поставка воды, Поставка питания, Трансфер, Доставка багажа, Проживание), панель с кнопками («Создать заявку на трансфер», «Создать заявку» для багажа, «Добавить гостиницу», «Досрочно завершить» и т.д.), контент вкладки и чат.
- **WaterSupplyTab**, **PowerSupplyTab** — вкладки вода/питание: таблица людей, кнопка «Вода доставлена» / аналог, кнопка «Завершить» (модалка с причиной).
- **TransferAccommodationTab** — вкладка трансфера: таблица водителей (ID, ФИО, время посадки, кол-во пассажиров, ссылка), переход в карточку водителя по клику.
- **BaggageDeliveryTab** — вкладка доставки багажа: таблица водителей (ID, ФИО, адреса, время, описание, ссылка), кнопка «Завершить» (модалка с причиной для всей услуги). Отметка доставки по каждому водителю — только через API (фронт при необходимости можно добавить отдельно).
- **HabitationTab** — вкладка проживания: список отелей, переход в карточку отеля.
- **AddRepresentativeDriver** — сайдбар «Создать заявку» для трансфера: выбор/создание водителя, адреса, кол-во людей, ссылка.
- **AddRepresentativeBaggageDriver** — сайдбар «Создать заявку» для доставки багажа: выбор/создание водителя, адреса, описание, ссылка (без количества людей).
- **AddRepresentativeHotel** — сайдбар добавления гостиницы в проживание.
- **RepresentativeHotelDetailPage** — деталь отеля (брони, добавление/редактирование пассажиров, отчёт, чат).
- **RepresentativeDriverDetailPage** — деталь водителя трансфера (пассажиры по водителю, добавление/редактирование/удаление пассажиров, чат).
- **RepresentativeHotelReportPage** — страница отчёта по отелю.
- **PassengerRequestLogs** — просмотр истории действий по заявке (логи ФАП).

---

## 6. Сводка по услугам

| Услуга | План | Основные сущности | Завершение |
|--------|------|-------------------|------------|
| Поставка воды | peopleCount, plannedAt | people[] (ФИО, время выдачи) | Кнопка «Вода доставлена» (ACCEPTED); «Завершить» + причина (COMPLETED, причина в сервис и лог) |
| Поставка питания | peopleCount, plannedAt | people[] | Аналогично воде |
| Проживание | peopleCount, plannedFromAt, plannedToAt | hotels[] → people[] (брони), evictions | Статус сервиса; переселение/выселение через отдельные мутации |
| Трансфер | peopleCount, plannedAt | drivers[] → people[] | Авто-статус по водителям и пассажирам; деталь по водителю с пассажирами |
| Доставка багажа | только plannedAt | drivers[] (без peopleCount) | «Завершить» услугу (причина в лог); по водителю — completePassengerRequestBaggageDriverDelivery (deliveryCompletedAt) |

---

## 7. Примеры вызовов API (для теста)

### Создание заявки с доставкой багажа

```graphql
mutation CreatePassengerRequest($input: PassengerRequestCreateInput!) {
  createPassengerRequest(input: $input) {
    id
    flightNumber
    baggageDeliveryService { plan { enabled plannedAt } }
  }
}
# Variables:
# "input": {
#   "airlineId": "...",
#   "flightNumber": "SU 123",
#   "baggageDeliveryService": {
#     "plan": { "enabled": true, "plannedAt": "2025-02-25T14:00:00.000Z" }
#   }
# }
```

### Добавление водителя в доставку багажа

```graphql
mutation AddBaggageDriver($requestId: ID!, $driver: PassengerServiceDriverInput!) {
  addPassengerRequestBaggageDriver(requestId: $requestId, driver: $driver) {
    id
    baggageDeliveryService { drivers { fullName addressFrom addressTo description } }
  }
}
# driver: { fullName: "...", phone: "...", addressFrom: "...", addressTo: "...", link: null, description: "..." }
```

### Отметить доставку багажа выполненной для водителя

```graphql
mutation CompleteBaggageDriverDelivery($requestId: ID!, $driverIndex: Int!) {
  completePassengerRequestBaggageDriverDelivery(requestId: $requestId, driverIndex: $driverIndex) {
    id
    baggageDeliveryService { drivers { fullName deliveryCompletedAt } }
  }
}
```

### Досрочно завершить услугу «Доставка багажа»

```graphql
mutation CompleteBaggageEarly($requestId: ID!, $reason: String!) {
  completePassengerRequestBaggageEarly(requestId: $requestId, reason: $reason) {
    id
    baggageDeliveryService { status times { finishedAt } }
  }
}
```

---

## 8. Чат по заявке

У заявки есть связь **chats** — список чатов (`Chat[]`), привязанных к `passengerRequestId`. Чаты используются на странице размещения и в карточках отеля/водителя для переписки по заявке или по конкретному объекту (отель/водитель). Модель Chat в Prisma содержит `passengerRequestId` (опционально); при удалении заявки зависимые чаты обрабатываются согласно политике каскада (см. схему).

---

## 9. Внешние пользователи ФАП (External Users)

Для доступа к заявке без полноценной учётки используется механизм **внешних пользователей**:

- **PassengerRequestExternalUser** — запись «внешнего» пользователя, привязанная к заявке (`passengerRequestId`). Поля: `login`, `email`, `name`, `accountType` (например CRM), `passengerServiceHotelItemId` (привязка к конкретному отелю в заявке), `active`, сессия (`sessionExpiresAt`, `refreshToken`).
- **PassengerRequestExternalUserMagicLinkToken** — токен магической ссылки для входа: привязка к внешнему пользователю, `magicLinkUrl`, `expiresAt`, `usedAt`, кто выдал ссылку (`createdByAdminId`).

Запрос из модуля **externalAuth** (не из passengerRequest):

- **Query:** `passengerRequestExternalUsers(passengerRequestId: ID!)` — список внешних пользователей по заявке.

Мутации выдачи/продления доступа (в том числе по ФАП) объявлены в том же модуле (например `adminIssuePassengerRequestExternalUserMagicLink`, продление сессии). Вход по магической ссылке — `externalUserSignInWithMagicLink(token, fingerprint)`. После входа такой пользователь считается «внешним» по заявке; на фронте для него может ограничиваться видимость (например только свой отель) и скрываться часть кнопок (`isExternalUser` / `isExternalPassengerRequestUser`).

---

## 10. Сохранённый отчёт по отелю

- **PassengerRequestHotelReport** (Prisma) — один сохранённый отчёт на пару (заявка, отель): `passengerRequestId` + `hotelIndex`, уникальность по `@@unique([passengerRequestId, hotelIndex])`. Поле `reportRows` хранится как Json (массив строк: fullName, roomNumber, roomCategory, roomKind, daysCount, breakfast, lunch, dinner, foodCost, accommodationCost).
- В GraphQL заявка возвращает `hotelReport(hotelIndex)` и `hotelReports`; сохранение — мутация `savePassengerRequestHotelReport(requestId, hotelIndex, reportRows)`. Отчёт используется на странице отеля и на отдельной странице отчёта по отелю.

---

## 11. Что не вошло или вынесено отдельно

- **buildPassengerRequestReport** — мутация вызывается с фронта (генерация/скачивание сводного отчёта по заявке, `savedReport` и т.д.). В описанном бэкенде (passengerRequest + report через savePassengerRequestHotelReport) отдельной мутации `buildPassengerRequestReport` может не быть; реализация может находиться в другом сервисе или модуле. При необходимости проверять актуальную схему бэкенда.
- **Права доступа** — на фронте используются роли (представитель, авиакомпания, диспетчер), `accessMenu`, `isExternalPassengerRequestUser`; список заявок и кнопки могут зависеть от роли и привязки к авиакомпании/департаменту. Детальное описание прав и ролей вынесено в отдельную логику (например `utils/access.js`, меню по ролям).
- **Связи с другими моделями** — у Airline и User есть связи с `passengerRequests`; при необходимости смотреть полную схему Prisma (Chat, Log, SavedReport и т.д.).

---

*Документ актуален на момент описания кодовой базы (бэкенд: Prisma + GraphQL; фронт: React, маршруты и компоненты представителя).*
