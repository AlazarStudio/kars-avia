# Архитектура шахматки размещения (PlacementDNDV2)

> **Версия:** документ описывает **v2** — `src/Components/PlacementDNDV2/`, актуальный модуль (проверено по коду 2026-08-17).
> v1 (`src/Components/PlacementDND/`) недостижим из маршрутов, но всё ещё статически импортируется из `src/App.jsx:23` и `HotelShahmatka_tabComponent.jsx:7` — жив только лист `EditReserveDate` (через `ReservePlacementRepresentative`).
> Известные дефекты, мёртвый код и инварианты, которые нельзя ломать при рефакторинге: `docs/superpowers/2026-08-17-placement-v2-frontend-study.md`.

## Обзор

Шахматка — timeline-календарь размещения экипажей и пассажиров резерва по номерам гостиницы. Строки — номера, колонки — дни месяца, плашки — брони. Перетаскивание меняет **номер и койку**; даты меняются только ручками resize по краям плашки. Обновления приходят через GraphQL-подписки, список номеров виртуализован.

Размер: 3 273 строки в 14 файлах, из них `NewPlacementV2.jsx` — 1 701 (52 %).

---

## Точки входа

| Где | Пропсы | Живая |
|---|---|---|
| `src/Components/Blocks/HotelShahmatka_tabComponent/HotelShahmatka_tabComponent.jsx:252` | `idHotelInfo`, `searchQuery`, `user`, `accessMenu` | да, боевая |
| `src/App.jsx:215` — `/newPlacementV2/:idHotel` | **нет ни одного** | зарегистрирован, но ни на что не ссылается |

Таб лениво грузится из четырёх RoleContent-оболочек: `SuperAdminHotelContent`, `DisAdminHotelContent`, `HotelAdminHotelContent`, `TransferAdminOrders` (последняя без импортеров).

`hotelId = idHotelInfo ?? useParams().idHotel`. `requestId` берётся из `useParams` и приходит только с маршрута `/hotels/:hotelID/:requestId` — он включает 4-секундное мигание плашки и `scrollToItem(roomIndex, "center")`.

---

## Технологии

| Библиотека | Что делает здесь |
|---|---|
| `@dnd-kit/core` | `DndContext`, `DragOverlay`, `useDraggable`, `useDroppable`. **Сенсоры не заданы** → дефолтные Pointer + Keyboard без activation constraint, поэтому drag стартует на любом pointerdown и click-vs-drag разруливается вручную |
| `react-window` | `VariableSizeList` — виртуализация строк номеров |
| `@apollo/client` | 6 `useQuery` + 4 `useSubscription` в хуке, 2 `useMutation` в оркестраторе |
| `date-fns` | `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `differenceInMilliseconds`, `isWithinInterval`, `isToday`, `isWeekend`, `format` + локаль `ru` |
| `@mui/material` | `Box`, `Typography`, `Tooltip`, `Dialog`, `Button`, `TextField`, `IconButton` |

---

## Структура

```
PlacementDNDV2/
├── NewPlacementV2.jsx              1701  оркестратор
├── components/
│   ├── TimelineV2.jsx               198  липкая шапка: Квота/Резерв, месяц, полоса дней
│   ├── RoomRowV2.jsx                191  строка номера: фон дней + плашки + дроп-зоны
│   ├── DraggableRequestV2.jsx       728  плашка: 4 режима, drag, resize, портальный тултип
│   ├── EditRequestModalV2.jsx        91  правка дат
│   ├── ConfirmBookingModalV2.jsx     33  подтверждение брони
│   ├── AddPassengersModalV2.jsx     284  пассажир/сотрудник в резерв
│   ├── TimelineV2.module.css         26
│   └── DraggableRequestV2.module.css  6
├── hooks/
│   └── usePlacementData.js          437  весь слой данных
└── utils/
    ├── placementTransforms.js       102  сервер → «карточка размещения»
    ├── placementFilters.js           70  поиск + сборка filteredRooms
    ├── placementOverlap.js           63  две проверки пересечений
    └── placementPositions.js          4  выбор свободной койки
```

Дерево рендера:

```
NewPlacementV2
└── DndContext
    ├── TimelineV2                       (sticky, зависит от dayWidth)
    ├── VariableSizeList                 (itemSize = 50 * room.places)
    │   └── [строка] ячейка имени номера (220px, инлайн ~120 строк JSX)
    │       └── RoomRowV2
    │           ├── ячейки дней (фон: выходной/сегодня/неактивен/подсветка)
    │           ├── DraggableRequestV2 × N (absolute: left, top, width)
    │           └── дроп-зоны × room.places (id `${roomId}-${position}`)
    ├── правая панель: Квота | Резерв | детали резерва
    └── DragOverlay → DraggableRequestV2 (isOverlay)
модалки (смонтированы всегда): EditRequestModalV2, AddPassengersModalV2,
ConfirmBookingModalV2, ExistRequest (за accessMenu-гейтом),
AddNewPassengerPlacement, ExistReserveMess; EditRequestNomerFond — по флагу
```

---

## Модель данных

`placementTransforms.js` сводит две серверные формы к одной плоской записи.

| | `mapHotelChessToRequest` | `mapRequestToPlacement` |
|---|---|---|
| источник | `hotel.hotelChesses` (`GET_BRONS_HOTEL`) | `requests.requests` (`GET_REQUESTS`) |
| `id` | `chess.id` | `` `pending-${request.id}` `` |
| `room` | объект `{id, name, category, places, active, reserve}` | **нет** |
| `position` | `chess.place - 1` | **нет** |
| `status` | `translateStatus(...)` | литерал `"Ожидает"` |
| `requestID` | `request.id` **или** `reserve.id` | `request.id` |
| `isRequest` | `Boolean(chess.request)` | `true` |

Инварианты, которые легко сломать по незнанию:

- **`mapRooms` инвертирует имена:** `room.id` — человекочитаемое **имя** номера, `room.roomId` — id в БД. В домене заявок `req.room.id` — это **id в БД**.
- **`place` на бэке 1-based, `position` на фронте 0-based.**
- **`request.room` полиморфен:** объект у серверных строк, **голая строка-id** у оптимистично вставленных при дропе (`NewPlacementV2.jsx:275`).
- **Даты живут в «UTC-цифрах»:** читаются через `new Date(x).toISOString().split("T")`, пишутся обратно приклеиванием `Z`. Остальное приложение форматирует через `convertToDate` (московское время).
- **Сортировка `mapRooms`** (reserve → численно по имени) выживает **только** как tiebreak стабильной сортировки внутри корзин `buildFilteredRooms` (reserve → вместимость).

---

## Поток данных

```
hotelId + token (cookie)
  ├─ GET_HOTEL_MIN      (cache-and-network, skip !hotelId)  → hotelInfo → airportId
  ├─ GET_HOTEL_ROOMS    (cache-and-network)                 → mapRooms → rooms
  ├─ GET_BRONS_HOTEL    (network-only, hcPagination: месяц) → mapHotelChessToRequest → requests
  ├─ GET_REQUESTS       (skip до airportId; take 500;
  │                      status ["created","opened"])       → newRequests   (правая панель «Квота»)
  ├─ GET_RESERVE_REQUESTS (skip до airportId; take 500)     → requestsReserves («Резерв»)
  └─ [openReserveId] GET_RESERVE_REQUEST
                     GET_RESERVE_REQUEST_HOTELS            → newReservePassangers

requests → filterRequestsBySearch(searchQuery, границы месяца) → filteredRequests
        → buildFilteredRooms(rooms, filteredRequests, searchQuery) → filteredRooms
        → VariableSizeList
```

**Хук не даёт Apollo управлять UI:** каждый результат запроса копируется в `useState` через `useEffect`.

**Заявки и резервы матчатся с гостиницей по `airport.id`, а не по названию города** — фильтрация серверная, через `pagination.airportId`.

Мутации:

| Мутация | Когда | Что шлёт |
|---|---|---|
| `UPDATE_HOTEL_BRON` | дроп в номер / подтверждение брони | `updateHotelId` + `input.hotelChesses[0]` |
| `UPDATE_REQUEST_RELAY` | сохранение дат из `EditRequestModalV2` | `updateRequestId` + `input {arrival, departure, status}` |

Обе объявлены без `optimisticResponse`, без `refetchQueries` и без `update`; серверная правда возвращается общим `onCompleted → refetchBrons() + bronRefetch()`.

---

## Подписки

Четыре подписки без переменных: `REQUEST_CREATED_SUBSCRIPTION`, `REQUEST_UPDATED_SUBSCRIPTION`, `REQUEST_RESERVE_UPDATED_SUBSCRIPTION`, `GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS_PLACEMENT`.

**Все `onData` игнорируют payload и просто зовут `bronRefetch()`** (у `requestCreated` дополнительно `refetchBrons()`). Код, который патчил стейт из payload, и фильтры по отелю/аэропорту закомментированы (`usePlacementData.js:139-192`), поэтому `mapUpdatedRequestFromSubscription` жив только внутри комментария. Практическое следствие: изменение любой заявки в системе вызывает `network-only` перезапрос доски.

Исключение — `reservePersons`: её payload дополнительно дописывает новые карточки пассажиров в `newReservePassangers` (дедуп по `personID`) и вызывает `refetchHotelReserveOne()`.

---

## Геометрия

```
dayWidth   = containerRef.offsetWidth / daysInMonth.length     // ResizeObserver
rowHeight  = 50 * room.type                                    // room.type = room.places
droppable  = { id: `${roomId}-${position}`, top: position * 50, height: 50 }
bar.left   = (checkIn  - startOfMonth(currentMonth)) / 86400000 * dayWidth
bar.width  = (checkOut - checkIn)                    / 86400000 * dayWidth
bar.top    = position * 50 + 2
bar.height = status === "Ожидает" ? 65 : 45
```

- `DAY_WIDTH = 40` — **только** начальное значение стейта и масштаб карточек в правой панели; сетка работает на измеренной ширине.
- **Горизонтального скролла нет:** кастомный `outerElementType` сбрасывает `scrollLeft` в 0 на каждом событии скролла и ставит `overflowX: hidden` (`NewPlacementV2.jsx:881-897`). Колонка имён не уезжает потому, что уехать некуда.
- **Шапка и тело выравниваются общим скаляром `dayWidth`**, а не синхронизацией скролла. `TimelineV2:120` при этом хардкодит `calc(100% - 228px)` = `LEFT_WIDTH` (220) + 8 px скроллбара из `src/index.css:143`.
- **Высота строки не реагирует на пересечения.** Две заявки с одинаковым `position` и пересекающимися датами рисуются друг на друге; пересечение только предотвращается при дропе/резайзе, но никогда не разрешается укладкой в полосы.

---

## Drag-and-drop

`over.id` формата `` `${roomId}-${position}` `` разбирается в `handleDragEnd` через `over.id.split("-")`. **Горизонтальная координата дропа не читается никогда** — DnD меняет только номер и койку.

Шесть веток `handleDragEnd`:

| Ветка | Условие | Действие |
|---|---|---|
| A | `!currentRoom` — любой элемент из правой панели | занять нижнюю свободную койку, оптимистично вставить строку (`room` = строка), открыть `ConfirmBookingModalV2`. Мутации ещё нет |
| B | тот же номер, другая койка | своя инлайновая проверка занятости → `UPDATE_HOTEL_BRON` с `status: "done"` |
| C1 | `newRequests.includes(...)` | **недостижима** |
| C2 | `newReservePassangers.includes(...)` | **недостижима** |
| C3 | другой номер | требует `targetRoom.active`; **игнорирует койку, на которую целились** — берёт нижнюю свободную; `UPDATE_HOTEL_BRON` без `status` |
| C4 | `room?.id === targetRoomId` внутри C | **недостижима** (перехвачено веткой B) |

C1/C2 недостижимы, потому что попасть в них можно только при истинном `currentRoom`, а ни `mapRequestToPlacement`, ни маппер пассажиров резерва не выставляют `room`. **В этих мёртвых ветках лежит единственная проверка `targetRoom.active` для неразмещённых заявок** — при рефакторинге её надо перенести, а не удалить.

`onDragCancel` не объявлен: Escape, resize окна и `visibilitychange` не очищают `isDraggingGlobal` / `activeDragItem` / `highlightedDatesOld`.

Правка дат идёт отдельным треком, мимо dnd-kit: ручка → нативные `document` mousemove/mouseup → `deltaDays = Math.round(deltaX / dayWidth)` → `handleResize` (живой предпросмотр через `onUpdateRequest`) → на mouseup открывается `EditRequestModalV2` → `handleSaveChanges` → `UPDATE_REQUEST_RELAY`.

---

## Проверка пересечений

Две функции в `placementOverlap.js`, **намеренно не взаимозаменяемые**:

```js
// валидирует правку: та же комната И ТА ЖЕ КОЙКА
hasOverlap({ requests, updatedRequest })

// выдаёт множество занятых койек: та же комната, КОЙКА ИГНОРИРУЕТСЯ
getOverlappingRequests({ requests, targetRoomId, draggedRequest })
```

Интервалы полуоткрытые `[in, out)` — выезд и заезд в один момент разрешены осознанно. `hasOverlap` нормализует и объектный, и строковый `room`; `getOverlappingRequests` матчит только `req.room?.id`.

Выбор койки — целиком `placementPositions.js`:

```js
export const getAvailablePosition = (roomType, occupiedPositions) => {
  const maxPositions = Array.from({ length: roomType }, (_, i) => i);
  return maxPositions.find((pos) => !occupiedPositions.includes(pos));
};
```

Возвращает `undefined` при заполненности, а `0` — валидная койка. Все четыре вызывающих корректно пишут `=== undefined`; проверка на falsy молча забракует койку 0.

---

## Виртуализация

```jsx
<VariableSizeList
  ref={listRef}
  outerElementType={ListOuterElement}   // сбрасывает scrollLeft в 0
  itemCount={filteredRooms.length}
  itemSize={getRoomHeight}              // 50 * room.type
  itemKey={itemKey}                     // room.roomId
  width="100%"
  height={/* 6-ветвевой тернарник по роли и window.innerHeight */}
  overscanCount={5}
  style={{ overflowY: "scroll", overflowX: "hidden" }}
>
```

`resetAfterIndex(0, true)` вызывается при смене `filteredRooms`, при смене месяца, на старте и на конце перетаскивания. `itemData` не используется — рендерер строки пересоздаётся каждый рендер.

---

## Режимы работы

Тумблер «Квота» / «Резерв» живёт в `TimelineV2` (собственный `activeButton` + колбэк в родительский `checkRoomsType`).

| Режим | Правая панель | Плашки |
|---|---|---|
| Квота (`false`) | «Заявки по эскадрильи в городе …» из `newRequests` | `isRequest === true` в полную непрозрачность, остальные — `opacity 0.3` без ручек |
| Резерв (`true`) | «Заявки по пассажирам» из `requestsReserves`; по клику — панель деталей резерва с пассажирами | наоборот |

---

## Фильтрация и поиск

`filterRequestsBySearch` — **при пустом `searchQuery` возвращает `requests` как есть** (фильтр по месяцу пропускается; окно и так задано запросом). При непустом — текстовый матч по `guest`, `guestPosition`, `room.name`, `requestID`, `airline.name` **И** пересечение с текущим месяцем.

`buildFilteredRooms` — раскладывает заявки по `Map` (ключ `req.room?.id`), отбрасывает номера без совпадений, вешает на каждый `room.requests` и сортирует: сначала не-резервные, затем по вместимости. Приклеенный `room.requests` рендером **не используется** — строка заново фильтрует `filteredRequests` полным проходом (`NewPlacementV2.jsx:1213`); массив нужен только для дип-линка.

---

## Состояние

25 `useState` в `NewPlacementV2`, по смыслу:

```js
// данные приходят из usePlacementData (requests, newRequests, rooms, hotelInfo, …)
currentMonth                                   // окно: и запрос, и сетка
checkRoomsType                                 // Квота / Резерв
activeDragItem, activeDragItemOld, isDraggingGlobal, highlightedDatesOld, isClick
isModalOpen, editableRequest, originalRequest  // правка дат
isConfirmModalOpen, selectedRequest            // подтверждение брони
showEditNomer, selectedNomer                   // EditRequestNomerFond
showRequestSidebar, selectedRequestID          // ExistRequest
showReserveInfo, openReserveId, showModalForAddHotelInReserve,
showCreateSidebarReserveOne, showChooseHotels, showRequestSidebarMess,
isAddPassengersModalOpen                       // ветка резерва
notifications                                  // собственная очередь тостов
hasInitialLoadCompleted                        // лоадер показывается только один раз
dayWidthLength, hoveredDayInMonth, hoveredRoom
```

---

## Права доступа

- `canAccessMenu(accessMenu, "requestMenu", user)` — **единственный живой гейт**, монтирует `ExistRequest` (`NewPlacementV2.jsx:1609`). SUPERADMIN проходит по короткому замыканию роли.
- `getDispatcherAccess(accessMenu, "requestChat" | "requestUpdate", user)` — трёхзначные флаги (`undefined` для не-диспетчеров), пробрасываются в `ExistRequest`, где читаются через `??` как «мнения диспетчера нет, применяй правило авиакомпании».
- `hotelInfo?.access` + `user?.hotelId` — гейт ручек resize и списка заявок в правой панели.
- `room.active` — неактивный номер красится серым; блокировка дропа работает только в ветке C3.
- `user?.role === roles.hotelAdmin` — используется **только** для подбора пиксельных высот; `HOTELMODERATOR` не покрыт ни одной веткой.

**`accessMenu` доходит не везде:** дальше по цепочке его передаёт только `DispatcherAdminContent.jsx:159`. `SuperAdminContent`, `HotelAdminContent`, `RepresentativeAdminContent` и голый маршрут отдают `undefined`, и `HotelPage` подставляет дефолт `{}`.

---

## Константы и магические числа

```js
const DAY_WIDTH = 40;              // начальное значение / масштаб правой панели
const LEFT_WIDTH = 220;            // колонка имён номеров
const WEEKEND_COLOR = "#efefef";
const MONTH_COLOR = "#ddd";        // передаётся двум детям, не читается никем
```

Не вынесены и продублированы: `50` (высота койки — 5 мест в 3 файлах), `228` в `TimelineV2` (= 220 + 8 px скроллбара), `86400000`, высоты списка `610/530/460/420/390`, высоты лоадера `82vh/75vh/83vh/68vh`, таймаут тоста `5300` (= 5000 из `Notification` + 300 на анимацию выхода).

Цвета статусов (`DraggableRequestV2.jsx:52-71`, ключи — **русские** строки после `translateStatus`):

| Статус | Фон | Рамка |
|---|---|---|
| Забронирован | `#4caf50` | `#388e3c` |
| Продлен | `#2196f3` | `#1976d2` |
| Сокращен | `#f44336` | `#d32f2f` |
| Перенесен | `#ff9800` | `#e9831a` |
| Ранний заезд | `#9575cd` | `#865ecc` |
| Архив | `#3b653d` | `#1b5e20` |
| Готов к архиву | `#638ea4` | `#78909c` |
| прочее («Ожидает», «Неизвестно») | `#fff` | `#E4E4EF` |

⚠ `translateStatus` расходится с проектным `src/roles.js`: `done` → «Забронирован» здесь и «Размещен» там.

---

## Ошибки и уведомления

Модуль **не использует** глобальный `ToastContext` — у него своя очередь (`NewPlacementV2.jsx:796-805`) поверх `src/Components/Notification/Notification.jsx`, с хардкодом 5300 мс.

Тексты (17 штук), основные:

- «Целевая комната не определена!» / «Текущая или целевая комната не найдена»
- «Все позиции заняты в этой комнате!» / «Место занято в комнате!»
- «Комната не активна!»
- «Эту заявку нельзя перемещать, так как она в архиве»
- «Изменение заявки недопустимо: пересечение с другой заявкой!»
- «Бронь успешно добавлена» / «Бронь успешно перемещена» / «Заявка перемещена в комнату N»

Ни один `useQuery` в модуле не деструктурирует `error`. `ErrorBoundary` в проекте отсутствует.

---

## Связанные компоненты

| Компонент | Роль |
|---|---|
| `Blocks/ExistRequest` | карточка заявки (за `requestMenu`-гейтом) |
| `Blocks/ExistReserveMess` | чат по резерву |
| `Blocks/AddNewPassengerPlacement` | добавление гостиницы в резерв |
| `Blocks/EditRequestNomerFond` | правка номера по клику на имя |
| `Blocks/MUILoader` | лоадер первой загрузки |
| `Components/Notification` | всплывающие уведомления |

---

## Известные расхождения с конвенциями репозитория

Перечислены здесь, чтобы не воспроизводить их в новом коде: у `NewPlacementV2.jsx` нет CSS-модуля (100 % инлайн `sx`), тосты переизобретены вместо `useToast`, `useDialog`/`MUIConfirm`/`MUIAlert` не используются (в `EditRequestModalV2` — нативный `alert()`), кнопки в диалогах — сырой MUI вместо `Standart/Button`, иконки — MUI вместо `src/shared/icons`, тестов нет.

Полный перечень дефектов, дубликатов и мёртвого кода с якорями `файл:строка` — в `docs/superpowers/2026-08-17-placement-v2-frontend-study.md`.
