# Архитектура компонента шахматки размещения (NewPlacement)

## Обзор

Компонент `NewPlacement` представляет собой интерактивную систему управления размещением гостей в номерах отеля с визуализацией в виде шахматки (timeline-календаря). Система поддерживает drag-and-drop операции, реальное время обновлений через GraphQL подписки и виртуализацию для производительности.

---

## Основные технологии и библиотеки

### 1. **React** (v18.2.0)
- Основной фреймворк для UI
- Используются хуки: `useState`, `useEffect`, `useMemo`, `useRef`, `useCallback`

### 2. **@dnd-kit/core** (v6.1.0)
- Библиотека для drag-and-drop функциональности
- Компоненты:
  - `DndContext` - контекст для управления перетаскиванием
  - `DragOverlay` - визуальное отображение перетаскиваемого элемента
  - `useDraggable` - хук для элементов, которые можно перетаскивать
  - `useDroppable` - хук для зон, куда можно бросать элементы

### 3. **react-window** (v1.8.11)
- Виртуализация списка комнат для оптимизации производительности
- `VariableSizeList` - список с переменной высотой элементов
- Позволяет рендерить только видимые элементы при большом количестве комнат

### 4. **@apollo/client** (v3.11.8)
- GraphQL клиент для работы с API
- Используется для:
  - `useQuery` - получение данных (комнаты, бронирования, заявки)
  - `useMutation` - обновление данных (бронирования, заявки)
  - `useSubscription` - подписки на изменения в реальном времени

### 5. **date-fns** (v4.1.0)
- Работа с датами
- Функции: `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `differenceInDays`, `isWithinInterval`, `format`, `isToday`, `isWeekend`

### 6. **@mui/material** (v6.1.10)
- UI компоненты Material-UI
- Используется: `Box`, `Typography`, `Tooltip`, `Dialog`, `Button`, `TextField`, `IconButton`

### 7. **react-router-dom** (v6.22.1)
- Маршрутизация
- `useParams` - получение параметров URL (idHotel, requestId)
- `useNavigate` - программная навигация

---

## Структура компонентов

### Главный компонент: `NewPlacement.jsx`

```
NewPlacement
├── Timeline (верхняя панель с календарем)
├── VariableSizeList (виртуализированный список комнат)
│   └── RoomRow (строка комнаты)
│       └── DraggableRequest (перетаскиваемая заявка)
├── Sidebar (боковая панель с заявками)
│   └── DraggableRequest (новые заявки для размещения)
├── DragOverlay (визуализация перетаскивания)
└── Модальные окна:
    ├── EditRequestModal (редактирование заявки)
    ├── ConfirmBookingModal (подтверждение бронирования)
    ├── AddPassengersModal (добавление пассажиров)
    └── EditRequestNomerFond (редактирование номера)
```

---

## Детальная структура компонентов

### 1. **Timeline** (`Timeline.jsx`)
**Назначение:** Верхняя панель с календарем месяца

**Функциональность:**
- Отображение дней месяца
- Навигация по месяцам (предыдущий/следующий)
- Подсветка выходных дней
- Подсветка текущего дня
- Переключение режимов: "Квота" / "Резерв"
- Hover-эффекты для дней

**Пропсы:**
- `currentMonth` - текущий месяц
- `setCurrentMonth` - функция изменения месяца
- `dayWidth` - ширина одного дня (40px)
- `weekendColor`, `monthColor` - цвета для стилизации
- `leftWidth` - ширина левой колонки (220px)

---

### 2. **RoomRow** (`RoomRow.jsx`)
**Назначение:** Строка одной комнаты в шахматке

**Функциональность:**
- Отображение дней месяца как ячеек
- Создание droppable зон для каждой позиции в комнате (для двухместных комнат)
- Рендеринг заявок (`DraggableRequest`) в соответствующих позициях
- Подсветка дат при перетаскивании
- Обработка hover-событий

**Ключевые особенности:**
- Для двухместных комнат создается несколько droppable зон (по количеству мест)
- Каждая зона имеет ID вида: `${room.roomId}-${position}`
- Высота строки зависит от типа комнаты: `50px * room.type`

**Пропсы:**
- `room` - объект комнаты
- `requests` - массив заявок для этой комнаты
- `dayWidth` - ширина одного дня
- `currentMonth` - текущий месяц
- `isDraggingGlobal` - глобальное состояние перетаскивания
- `activeDragItem` - перетаскиваемый элемент
- `highlightedDatesOld` - подсвеченные даты

---

### 3. **DraggableRequest** (`DraggableRequest.jsx`)
**Назначение:** Перетаскиваемая заявка/бронирование

**Функциональность:**
- Drag-and-drop через `useDraggable`
- Позиционирование на timeline по датам заезда/выезда
- Изменение размера (resize) через ручки слева/справа
- Отображение информации о госте, авиакомпании, статусе
- Тултип с детальной информацией при hover
- Анимация мерцания для целевой заявки (если передан `requestId`)
- Разные цвета в зависимости от статуса

**Статусы и цвета:**
- "Забронирован" - зеленый (#4caf50)
- "Продлен" - синий (#2196f3)
- "Сокращен" - красный (#f44336)
- "Перенесен" - оранжевый (#ff9800)
- "Ранний заезд" - фиолетовый (#9575cd)
- "Архив" - темно-зеленый (#3b653d)
- "Готов к архиву" - серо-синий (#638ea4)
- "Ожидает" - серый с анимацией мерцания

**Позиционирование:**
```javascript
left = (checkIn - startOfMonth) * dayWidth
width = (checkOut - checkIn) * dayWidth
top = position * 50px (для многоместных комнат)
```

**Пропсы:**
- `request` - объект заявки
- `dayWidth` - ширина одного дня
- `currentMonth` - текущий месяц
- `position` - позиция в комнате (0, 1, 2...)
- `onUpdateRequest` - callback для обновления заявки
- `onOpenModal` - открытие модального окна редактирования
- `isDraggingGlobal` - глобальное состояние перетаскивания

---

### 4. **EditRequestModal** (`EditRequestModal.jsx`)
**Назначение:** Модальное окно для редактирования дат заезда/выезда

**Функциональность:**
- Изменение даты и времени заезда
- Изменение даты и времени выезда
- Валидация (выезд не может быть раньше заезда)
- Автоматическое определение статуса при изменении дат

---

### 5. **ConfirmBookingModal** (`ConfirmBookingModal.jsx`)
**Назначение:** Подтверждение бронирования новой заявки

**Функциональность:**
- Отображение информации о госте и датах
- Подтверждение или отмена бронирования

---

## Поток данных

### 1. Загрузка данных

```javascript
// Комнаты отеля
GET_HOTEL_ROOMS (hotelId) → rooms

// Бронирования отеля (шахматка)
GET_BRONS_HOTEL (hotelId, dateRange) → hotelChesses → requests

// Новые заявки для размещения
GET_REQUESTS (status: ["created", "opened"]) → filtered by city → newRequests

// Резервы
GET_RESERVE_REQUESTS → filtered by city → requestsReserves
```

### 2. Подписки (real-time обновления)

```javascript
// Создание новой заявки
REQUEST_CREATED_SUBSCRIPTION → добавляется в newRequests

// Обновление заявки
REQUEST_UPDATED_SUBSCRIPTION → обновляется в requests

// Обновление резерва
REQUEST_RESERVE_UPDATED_SUBSCRIPTION → обновление резервов

// Изменение пассажиров в резерве
GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS_PLACEMENT → обновление пассажиров
```

### 3. Мутации (изменение данных)

```javascript
// Обновление бронирования (перемещение, изменение позиции)
UPDATE_HOTEL_BRON (hotelId, hotelChesses) → обновление на сервере

// Обновление заявки (изменение дат, статуса)
UPDATE_REQUEST_RELAY (requestId, input) → обновление на сервере
```

---

## Логика Drag-and-Drop

### Процесс перетаскивания:

1. **handleDragStart** (начало перетаскивания)
   - Определяется перетаскиваемый элемент (`activeDragItem`)
   - Подсвечиваются даты заявки
   - Устанавливается `isDraggingGlobal = true`

2. **handleDragEnd** (окончание перетаскивания)
   - Определяется целевая зона (`over.id` формата `ROOM123-2`)
   - Парсится `targetRoomId` и `targetPosition`
   - Выполняются проверки:
     - Комната активна?
     - Есть свободные позиции?
     - Нет пересечений с другими заявками?
   - Выполняется мутация `UPDATE_HOTEL_BRON`

### Сценарии перетаскивания:

#### 1. Новая заявка → Комната
- Проверка доступных позиций
- Создание нового бронирования
- Открытие модального окна подтверждения

#### 2. Существующая заявка → Другая комната
- Проверка пересечений
- Поиск свободной позиции
- Обновление `roomId` и `place`

#### 3. Существующая заявка → Та же комната, другая позиция
- Проверка занятости позиции
- Обновление только `place`

#### 4. Существующая заявка → Та же комната, та же позиция
- Ничего не происходит

---

## Алгоритм проверки пересечений

```javascript
function isOverlap(updatedRequest) {
  // 1. Фильтруем заявки в той же комнате
  const roomRequests = requests.filter(
    req => req.room?.id === updatedRequest.room.id
  );
  
  // 2. Проверяем пересечение интервалов
  return roomRequests.some(otherRequest => {
    // Пропускаем саму заявку
    if (otherRequest.id === updatedRequest.id) return false;
    
    // Пропускаем разные позиции
    if (otherRequest.position !== updatedRequest.position) return false;
    
    // Проверяем пересечение дат
    const otherStart = new Date(`${otherRequest.checkInDate}T${otherRequest.checkInTime}`);
    const otherEnd = new Date(`${otherRequest.checkOutDate}T${otherRequest.checkOutTime}`);
    const updatedStart = new Date(`${updatedRequest.checkInDate}T${updatedRequest.checkInTime}`);
    const updatedEnd = new Date(`${updatedRequest.checkOutDate}T${updatedRequest.checkOutTime}`);
    
    // Пересечение есть, если интервалы не разделены
    return !(otherEnd <= updatedStart || otherStart >= updatedEnd);
  });
}
```

---

## Виртуализация списка комнат

### Проблема:
При большом количестве комнат (100+) рендеринг всех строк одновременно приводит к проблемам производительности.

### Решение:
Использование `react-window` с `VariableSizeList`:

```javascript
<VariableSizeList
  ref={listRef}
  itemCount={filteredRooms.length}
  itemSize={getRoomHeight}  // Динамическая высота
  itemKey={itemKey}          // Уникальный ключ
  width="100%"
  height={530}               // Высота контейнера
  overscanCount={5}          // Рендерить +5 элементов вне видимости
>
  {({ index, style }) => <RoomRow ... />}
</VariableSizeList>
```

**Преимущества:**
- Рендерится только видимые элементы + небольшой буфер
- Плавная прокрутка даже при 1000+ комнатах
- Экономия памяти

---

## Режимы работы

### 1. Режим "Квота" (`checkRoomsType = false`)
- Отображаются заявки типа `isRequest = true`
- Показываются новые заявки из `newRequests`
- Фильтрация по городу отеля

### 2. Режим "Резерв" (`checkRoomsType = true`)
- Отображаются заявки типа `isRequest = false`
- Показываются резервы из `requestsReserves`
- Возможность открытия детальной информации о резерве
- Добавление пассажиров из резерва

---

## Фильтрация и поиск

### Фильтрация заявок:
```javascript
filteredRequests = requests.filter(request => 
  // Поиск по тексту
  request.guest?.toLowerCase().includes(searchQuery) ||
  request.room?.name?.toLowerCase().includes(searchQuery) ||
  request.requestID.toLowerCase().includes(searchQuery) ||
  request.airline?.name.toLowerCase().includes(searchQuery)
  &&
  // В пределах текущего месяца
  isWithinInterval(request.checkInDate, { start, end }) ||
  isWithinInterval(request.checkOutDate, { start, end })
)
```

### Фильтрация комнат:
```javascript
filteredRooms = rooms.filter(room =>
  // Комната содержит отфильтрованные заявки
  filteredRequests.some(req => req.room?.id === room.roomId) ||
  // Или название комнаты совпадает с поиском
  room.id.toLowerCase().includes(searchQuery)
)
```

---

## Управление состоянием

### Основные состояния:

```javascript
// Данные
const [rooms, setRooms] = useState([])              // Комнаты отеля
const [requests, setRequests] = useState([])          // Бронирования в шахматке
const [newRequests, setNewRequests] = useState([])   // Новые заявки для размещения
const [hotelInfo, setHotelInfo] = useState(null)     // Информация об отеле

// UI состояние
const [currentMonth, setCurrentMonth] = useState()    // Текущий месяц
const [isDraggingGlobal, setIsDraggingGlobal] = useState(false)
const [activeDragItem, setActiveDragItem] = useState(null)
const [highlightedDatesOld, setHighlightedDatesOld] = useState([])

// Модальные окна
const [isModalOpen, setIsModalOpen] = useState(false)
const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
const [editableRequest, setEditableRequest] = useState(null)

// Режимы
const [checkRoomsType, setCheckRoomsType] = useState(false)  // Квота/Резерв
```

---

## Оптимизации производительности

### 1. **useMemo для вычислений**
```javascript
const filteredRequests = useMemo(() => {
  // Тяжелые вычисления фильтрации
}, [requests, searchQuery, currentMonth]);

const filteredRooms = useMemo(() => {
  // Фильтрация и сортировка комнат
}, [rooms, filteredRequests, searchQuery]);
```

### 2. **React.memo для компонентов**
- `RoomRow` обернут в `memo()` для предотвращения лишних ререндеров
- `Timeline` обернут в `memo()`

### 3. **Виртуализация списка**
- Использование `react-window` для больших списков

### 4. **Условный рендеринг**
- Компоненты рендерятся только при необходимости
- Модальные окна монтируются только при открытии

---

## Обработка ошибок

### Уведомления:
```javascript
const addNotification = (text, status) => {
  // status: "success" | "error" | "info"
  // Автоматическое удаление через 5.3 секунды
}
```

### Типичные ошибки:
- "Все позиции заняты в этой комнате!"
- "Комната не активна!"
- "Место занято в комнате!"
- "Эту заявку нельзя перемещать, так как она в архиве"
- "Изменение заявки недопустимо: пересечение с другой заявкой!"

---

## Интеграция с другими компонентами

### Связанные компоненты:

1. **ExistRequest** - детальная информация о заявке
2. **ExistReserveMess** - сообщения по резерву
3. **AddNewPassengerPlacement** - добавление нового размещения из резерва
4. **EditRequestNomerFond** - редактирование номера фонда
5. **AddPassengersModal** - добавление пассажиров в резерв

---

## Особенности реализации

### 1. **Автоматический скролл к заявке**
```javascript
// Если передан requestId в URL, автоматически скроллится к нужной комнате
useEffect(() => {
  if (roomIndex >= 0 && listRef.current) {
    listRef.current.scrollToItem(roomIndex, "center");
  }
}, [roomIndex, requestId]);
```

### 2. **Динамическая ширина дней**
```javascript
// Ширина дня вычисляется на основе ширины контейнера
useEffect(() => {
  const updateDayWidth = () => {
    const containerWidth = containerRef.current.offsetWidth;
    const newDayWidth = containerWidth / daysInMonth.length;
    setDayWidthLength(newDayWidth);
  };
  // Используется ResizeObserver для отслеживания изменений
}, [daysInMonth]);
```

### 3. **Подсветка при перетаскивании**
- При начале перетаскивания подсвечиваются даты заявки
- При наведении на комнату подсвечиваются даты перетаскиваемой заявки

### 4. **Мерцание целевой заявки**
- Если в URL есть `requestId`, соответствующая заявка мерцает 4 секунды
- Используется CSS анимация `blinkBackground`

---

## Граф зависимостей данных

```
GET_HOTEL_MIN
    ↓
hotelInfo (city, access, id)
    ↓
GET_REQUESTS (filter by city)
    ↓
newRequests

GET_BRONS_HOTEL (hotelId, dateRange)
    ↓
requests (hotelChesses)

GET_HOTEL_ROOMS (hotelId)
    ↓
rooms

GET_RESERVE_REQUESTS
    ↓
requestsReserves (filter by city)
    ↓
handleOpenReserveInfo
    ↓
GET_RESERVE_REQUEST_HOTELS
    ↓
newReservePassangers
```

---

## Константы

```javascript
const DAY_WIDTH = 40;              // Ширина одного дня в пикселях
const LEFT_WIDTH = 220;            // Ширина левой колонки с названиями комнат
const WEEKEND_COLOR = "#efefef";   // Цвет выходных дней
const MONTH_COLOR = "#ddd";        // Цвет границ месяцев
```

---

## Безопасность и права доступа

### Проверки доступа:
- `hotelInfo?.access` - доступ к редактированию отеля
- `user?.hotelId` - проверка принадлежности отеля пользователю
- `user?.role` - роль пользователя (hotelAdmin, superAdmin, etc.)
- `room.active` - активность комнаты

### Ограничения:
- Заявки в архиве нельзя перемещать (кроме superAdmin)
- Неактивные комнаты нельзя использовать для размещения
- Редактирование доступно только при наличии прав

---

## Заключение

Компонент `NewPlacement` представляет собой сложную систему управления размещением с:
- Интерактивным drag-and-drop интерфейсом
- Real-time обновлениями через GraphQL подписки
- Оптимизацией производительности через виртуализацию
- Гибкой системой фильтрации и поиска
- Поддержкой различных режимов работы (Квота/Резерв)
- Интеграцией с множеством связанных компонентов

Архитектура построена на современных React-практиках с использованием специализированных библиотек для каждой задачи.
