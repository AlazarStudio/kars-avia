# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Работа с кодом

- Чистый, читаемый, эффективный и поддерживаемый код
- Без оверинжиниринга и лишних абстракций
- Только функциональные компоненты (для React)
- Компоненты маленькие — одна ответственность
- Логика в хуках/утилитах, UI отдельно
- Понятные и единообразные названия
- Перед созданием нового компонента проверь нет ли похожего
- Не дублировать логику — переиспользовать
- Не вносить новые зависимости без явной необходимости
- Всегда анализируй существующую структуру и стиль проекта перед тем как писать код
- Строго следуй архитектуре и паттернам которые уже используются в проекте

## Визуальный стиль

- Анализируй существующие компоненты, цвета, шрифты, отступы и паттерны
- Строго следуй этой стилистике во всех новых элементах
- Не вноси визуальные изменения если не просят

## Экономия токенов

- Не объясняй что делаешь — просто делай
- Без лишних комментариев и резюме после выполнения
- Если задача понятна — не переспрашивай
- Думай на английском, отвечай на русском

---

## О проекте

**Kars Avia** — веб-система управления размещением экипажей авиакомпаний в гостиницах. Диспетчер создаёт заявки на заселение, гостиницы подтверждают размещение, авиакомпании отслеживают своих сотрудников. Дополнительно: трансфер (водители), резерв номеров, чаты, отчёты, аналитика.

## Стек

| Слой | Технология |
|------|-----------|
| Фреймворк | React 18 (JSX, без TypeScript) |
| Сборка | Vite 5 |
| API | GraphQL — Apollo Client 3 (HTTP + WebSocket подписки) |
| UI | Material UI 6 + Emotion |
| Маршрутизация | React Router DOM 6 |
| Drag-and-drop | @dnd-kit/core (шахматка) |
| Даты | date-fns 4, dayjs |
| Rich-text | Tiptap 3 |
| Графики | Recharts |
| Карты | Yandex Maps (@pbe/react-yandex-maps) |
| Экспорт | xlsx, html2pdf.js, jspdf |
| Линтер | ESLint 8 |

## Команды

```bash
npm run dev       # dev-сервер (Vite)
npm run build     # production-сборка в dist/
npm run preview   # превью production-сборки
npm run lint      # ESLint
```

## Окружения (.env)

Активное окружение переключается в `graphQL_requests.js` (строки 4-11):

```js
// Текущее (dev):
export const path = import.meta.env.VITE_DEV_PATH;
export const server = import.meta.env.VITE_DEV_SERVER;
```

| Переменная | Значение |
|-----------|---------|
| `VITE_DEV_PATH` | `devbackend.karsavia.ru:443` |
| `VITE_DEV_SERVER` | `https://devbackend.karsavia.ru:443` |
| `VITE_DEMO_PATH` | `demobackend.karsavia.ru:443` |
| `VITE_DEMO_SERVER` | `https://demobackend.karsavia.ru:443` |
| `VITE_PRODUCTION_PATH` | `backend.karsavia.ru:443` |
| `VITE_PRODUCTION_SERVER` | `https://backend.karsavia.ru:443` |
| `VITE_YMAPS_KEY` | Yandex Maps API key |

> В `.env` у dev-переменных лежат ещё и закомментированные варианты (`localhost:4000` для
> локального бэкенда, старый `45.130.42.244:4000`). Раскомментировать нужно пару
> `VITE_DEV_PATH`/`VITE_DEV_SERVER` целиком — значение в таблице выше отражает активное.

## Структура src/

```
src/
├── App.jsx                  # Apollo Client setup, маршруты
├── main.jsx                 # Точка входа, провайдеры
├── AuthContext.jsx           # Контекст авторизации (JWT из cookie)
├── TokenRefresher.jsx        # Фоновое обновление токена
├── UserActivityTracker.jsx   # Трекер активности пользователя
├── roles.js                 # Роли, статусы, константы
├── requests.js              # Моковые данные (legacy)
├── services/
│   ├── authService.js       # Работа с cookie: token, refreshToken, fingerprint
│   └── authErrorLink.js     # Apollo error link (401 → logout)
├── contexts/
│   ├── ToastContext.jsx      # Глобальные уведомления
│   └── DialogContext.jsx     # Глобальные диалоги подтверждения
├── hooks/
│   ├── useCookies.jsx
│   ├── useDebounce.jsx
│   ├── useLocalStorage.jsx
│   └── useWindowSize.jsx
├── constants/
│   └── externalAuthErrors.js
├── utils/
│   ├── access.js            # Матрица доступа по ролям
│   ├── effectiveCostDays.js # Расчёт эффективных суток
│   ├── transferPrices.js    # Цены трансфера
│   └── scriptRunnerSelectors.js
├── shared/
│   └── icons/               # SVG-иконки как React-компоненты
└── Components/
    ├── Pages/               # Страницы (маршруты)
    ├── Blocks/              # Переиспользуемые блоки (формы, таблицы, модалки)
    ├── Standart/            # Примитивы (Button, H1, H2, Layout, RowBlock, ColumnBlock, WidthBlock, CenterBlock, Text, MUIAlert, MUIConfirm)
    ├── RoleContent/         # Контент по ролям (см. ниже)
    ├── HotelPMS/            # PMS-система для гостиниц (в разработке, mock-данные)
    └── PlacementDNDV2/      # Шахматка v2 (текущая)
        ├── components/      # UI-компоненты (TimelineV2, RoomRowV2, DraggableRequestV2, модалки)
        ├── hooks/           # usePlacementData.js
        └── utils/           # placementFilters, placementPositions, placementOverlap, placementTransforms
```

> **Важно**: `graphQL_requests.js` находится в **корне репозитория**, а не внутри `src/`. Импорт из `src/`: `from "../graphQL_requests"`.

## Роли пользователей

| Константа | Значение | Описание |
|-----------|---------|---------|
| `superAdmin` | `SUPERADMIN` | Супер-администратор (диспетчер) |
| `dispatcerAdmin` | `DISPATCHERADMIN` | Администратор диспетчера |
| `dispatcherModerator` | `DISPATCHERMODERATOR` | Модератор диспетчера |
| `hotelAdmin` | `HOTELADMIN` | Администратор гостиницы |
| `hotelModerator` | `HOTELMODERATOR` | Модератор гостиницы |
| `airlineAdmin` | `AIRLINEADMIN` | Администратор авиакомпании |
| `airlineModerator` | `AIRLINEMODERATOR` | Модератор авиакомпании |

Матрица доступа по ролям — `src/utils/access.js`.

## Аутентификация

- Токены (JWT) хранятся в **cookie**: `token` (24ч), `refreshToken` (30 дней), `auth_fingerprint`
- Весь доступ к токенам — через `src/services/authService.js`
- Apollo link для 401 — `src/services/authErrorLink.js` (редирект на `/login`)
- Декодирование JWT — `decodeJWT()` в `graphQL_requests.js`
- Внешние пользователи (external login) имеют `subjectType: "EXTERNAL_USER"` и дополнительный контекст в cookie `externalUserContext`

## GraphQL

- **Все** запросы/мутации/подписки — в одном файле `graphQL_requests.js` (6000+ строк). Перед добавлением нового запроса убедись, что аналогичного нет.
- HTTP endpoint: `${server}/graphql`
- WS endpoint: `ws://${path}/graphql`
- Загрузка файлов: `apollo-upload-client` (createUploadLink)
- Подписки: `graphql-ws` + `GraphQLWsLink`

**Хелперы из `graphQL_requests.js`** — используй вместо самописных аналогов:

| Функция | Описание |
|---------|---------|
| `convertToDate(dateStr, includeTime?)` | ISO → `"DD.MM.YYYY"` (московское время). ⚠️ С `includeTime: true` возвращает **только `"HH:MM"`, без даты** — вопреки комментарию в коде. Дата со временем собирается двумя вызовами: `` `${convertToDate(x)} ${convertToDate(x, true)}` ``, см. `InfoTableDataReports.jsx` |
| `convertToDateNew(dateStr, includeTime?)` | Аналог, UTC-вариант |
| `buildScheduledISO(date, time)` | Локальные дату/время → UTC ISO-строка |
| `generateTimestampId()` | Уникальный ID: timestamp + random |
| `getMediaUrl(path)` | Добавляет JWT-токен к URL медиафайла |
| `decodeJWT(token)` | Ручное декодирование JWT (base64 payload) |

## Система прав доступа (двухуровневая)

Права работают на двух уровнях одновременно:

**1. Роль** — грубая фильтрация: что вообще видит пользователь. Определяется через `user.role` (из JWT). `src/utils/access.js` содержит матрицу: какие страницы/действия доступны каждой роли.

**2. `accessMenu`** — точечные feature-флаги внутри роли. Для авиакомпаний берётся из `authUser.effectiveAccessMenu` (GraphQL), для диспетчеров — из `dispatcherDepartment.accessMenu`.

**Поток `accessMenu` по компонентам:**
```
Main_Page (запрашивает GET_AUTH_USER_ACCESS / GET_DISPATCHER_DEPARTMENTS)
  → устанавливает state accessMenu
  → передаёт в MenuDispetcher (видимость пунктов меню)
  → передаёт в AllRoles → RoleContent → дочерние страницы/блоки
```

## RoleContent

`src/Components/RoleContent/AllRoles.jsx` — точка входа: получает `user` и `accessMenu`, рендерит нужный контент-компонент:

| Файл | Роль |
|------|------|
| `SuperAdminContent` | `SUPERADMIN` |
| `DispatcherAdminContent` | `DISPATCHERADMIN` |
| `AirlineAdminContent` | `AIRLINEADMIN` |
| `HotelAdminContent` | `HOTELADMIN` |
| `RepresentativeAdminContent` | Представительские услуги |
| `TransferAdminContent` | Трансфер |

Каждый контент-компонент сам управляет выбором вкладки/страницы на основе `id` из `useParams`.

Для авиакомпаний `effectiveAccessMenu` уже учитывает переопределения по должности (позиции), рассчитывается на бэке.

**Все ключи `accessMenu`** (определены в `src/roles.js` → `menuAccess`):

```
requestMenu, requestCreate, requestUpdate, requestChat
reserveMenu, reserveCreate, reserveUpdate, reserveUpdateCompleted
userMenu, userCreate, userUpdate
personalMenu, personalCreate, personalUpdate
analyticsMenu
airlineMenu, airlineUpdate, airlineContracts
reportMenu, reportCreate
travellineMenu, accessManage
```

## Настройки доступа отдела (SettingsSidebar)

`src/Components/Blocks/SettingsSidebar/` — боковая панель для редактирования прав доступа отдела. Работает для обоих типов: `type="airline"` и `type="dispatcher"`.

**Архитектура стейта:**

- `accessMenu` — raw API-формат `{ requestMenu: bool, ... }`, загружается из `currentDepartment.accessMenu`
- `accessStateRef` — ref, в который `AccessPermissionsPanel` непрерывно пишет своё внутреннее состояние (формат секций: `{ squadron: { access, create, ... }, transfer: {...}, ... }`)
- `buildAccessPayload(internalState)` — конвертер internal → raw API, вызывается при сохранении

**Должности с доступом по разделам (`type="airline"`):**

- `positionAccessMenusByPosId: { [positionId]: { requestMenu, transferMenu, personalMenu } }` — какие из трёх разделов (Эскадрилья, Трансфер, Сотрудники) доступны каждой должности
- Загружается из `currentDepartment.positionAccessMenus`
- При сохранении: `positionIds` = `Object.keys(positionAccessMenusByPosId)`, `positionAccessMenus` = массив `{ positionId, accessMenu }`
- На бэке хранится в модели `PositionOnDepartment` (junction: отдел ↔ должность + встроенный `accessMenu`)

**`AccessPermissionsPanel`** — чисто UI, получает всё через пропсы. Управляет только своим внутренним `state` (секции переключателей) и пишет его в `stateRef`. Для должностей — получает `positionAccessMenusByPosId` + `setPositionAccessMenusByPosId` и управляет ими напрямую через колбэки.

## Шахматка (Placement)

Основной модуль — `src/Components/PlacementDNDV2/`. Это timeline-календарь для управления заселением:
- Drag-and-drop заявок по номерам и датам (`@dnd-kit/core`)
- Real-time обновления через GraphQL subscriptions
- Документация архитектуры: `SHAHMATKA_ARCHITECTURE.md` — описывает **v2** (актуален на 2026-08-17)
- Разбор фронта с якорями `файл:строка`, известные дефекты, мёртвый код и инварианты, которые нельзя ломать: `docs/superpowers/2026-08-17-placement-v2-frontend-study.md`

## Статусы заявок

| Код | Русское название |
|-----|----------------|
| `opened` | В обработке |
| `created` | Создан |
| `done` | Размещён |
| `extended` | Продлён |
| `reduced` | Сокращён |
| `transferred` | Перенесён |
| `earlyStart` | Ранний заезд |
| `archiving` | Готов к архиву |
| `archived` | Архив |
| `canceled` | Отменён |

## Модуль FAP (Passenger Requests)

`src/Components/Blocks/FapV2/` — управление заявками на пассажирские услуги (вода, питание, проживание, трансфер, багаж).

- `fapConstants.js` — конфиги статусов (`REQUEST_STATUS_CONFIG`, `SERVICE_STATUS_CONFIG`), типов услуг (`SERVICE_CONFIG`), утилиты форматирования дат
- `FapDetail` — детальная страница заявки, управляет переходами статусов (`CREATED → ACCEPTED → IN_PROGRESS → COMPLETED`)
- Каждая услуга — отдельный компонент: `FapLivingPage` + `FapHotelPage` (проживание), `FapTransferPage` + `FapDriverPage` (трансфер), `FapWaterMealPage` (вода/питание), `FapBaggagePage` + `FapBaggageTripPage` (багаж). Маппинг `serviceKey` → компонент — в `src/Components/Pages/FapV2/FapServicePage.jsx`
- `FapHotelPage` + `FapReportView` — отчёт по проживанию: строки группируются по номеру комнаты (`roomNumber`; гости без номера — отдельными строками), редактируемые цены и тарифы, экспорт в XLSX (`reports/buildReportSheets.js`)

## Раздел «Отчёты v2»

`src/Components/Blocks/ReportsV2/` — отчёты по заявкам **эскадрильи** (не ФАП): период, сутки проживания, цена, питание, выгрузка в Excel. Раздел открывается пунктом «Отчёты» у всех ролей (у диспетчера и авиакомпании — гейт `reportMenu`; `/reportsV2` остаётся рабочим алиасом у диспетчера), старый раздел «Отчёты» остаётся только у `SUPERADMIN`; черновики и «Правила расчёта суток» видят только `SUPERADMIN` и `DISPATCHERADMIN` — авиакомпания и гостиница видят только выпущенные отчёты.

Две функции поверх обычного создания отчёта:

- **Черновики** — `createAirlineReportDraft` / `createHotelReportDraft` → правка строк → `confirmReportDraft`. Включаются галкой «Проверить строки перед выгрузкой» в форме создания; без неё отчёт выпускается одним шагом, как раньше
- **Пороги частичных суток** — модель `ReportPartialDaySetting`, уровни `GLOBAL / AIRLINE / HOTEL`: переопределение по АК действует только в отчётах по этой АК, по гостинице — только в отчётах по этой гостинице; уровень и сущность выбираются в панели «Правила расчёта суток». Правят обе админ-роли (`SUPERADMIN` и `DISPATCHERADMIN`) — так же гейтит бэк

Раскладка: `ReportsV2.jsx` (контейнер: состояние, запросы, гейты по ролям), `ReportsV2List/`, `ReportDraftsPanel/`, `ReportDraftEditor/` (редактор строк + хук `useReportDraft.js`), `ReportCreateSidebar/`, `ReportRulesSidebar/`. Доменная логика без JSX вынесена в `reportRules.js`, `reportDraftRows.js`, `reportDraftAge.js` — у всех тесты рядом (`node --test src/Components/Blocks/ReportsV2/`).

**Что нельзя ломать:**

- границы периода уходят на бэк как `…T00:10:00` и `…T23:50:00` — это не форматирование, а часть расчёта: бэк обрезает по ним заявку, и обрезанный край попадает в спецветки суток. Причём `23:50` берёт настраиваемое `departureFullDays`, а `00:10` захардкожен нулём
- `recalcRow` применяется **только к строкам, которые правил пользователь**: у нетронутых сумма приходит с бэка, где стоимость номера делится между соседями по временным сегментам, и наивное «сутки × цена» переписало бы чужие деньги
- `confirmReportDraft` печатает то, что лежит в базе, поэтому подтверждение при несохранённых правках сначала сохраняет
- пересоздание черновика создаёт новый **до** удаления старого
- `pricePerDay: null` не подменять нулём; `__typename` снимать перед отправкой строк
- `updateReportDraft` перезаписывает весь массив строк целиком, без версии — отсюда сохранение явной кнопкой, а не автосейвом

## Ключевые паттерны

- **Контексты**: Toast (`useToast`) и Dialog (`useDialog`) доступны глобально
- **Медиафайлы**: `getMediaUrl(path)` из `graphQL_requests.js` добавляет token в URL
- **Стандартные примитивы**: используй компоненты из `src/Components/Standart/` (Button, H1, H2, Layout, RowBlock, ColumnBlock, WidthBlock, CenterBlock, Text)
- **MUI-обёртки в Blocks**: `MUIAutocomplete`, `MUIAutocompleteColor`, `MUILoader`, `MUISwitch`, `MUITextField` — в `src/Components/Blocks/MUI*/`. `MUIAlert` и `MUIConfirm` — в `src/Components/Standart/`
- **Lazy loading**: тяжёлые страницы подключаются через `React.lazy` + `Suspense`
- **Визуальный disabled**: затемнение элементов при `disabled` делается через `opacity: 0.55` на контейнере (класс `rowDisabled`), а не через MUI-проп `disabled` — это обеспечивает одинаковый вид для включённых и выключённых переключателей
- **CSS-модули**: каждый компонент имеет свой `.module.css`. Стили соседних компонентов из той же папки могут шариться (напр. `AccessPermissionsPanel` использует `SettingsSidebar.module.css`)
- **SVG-иконки**: хранятся как React-компоненты в `src/shared/icons/`. Использовать их вместо MUI-иконок где возможно
- **`calculateEffectiveCostDays(arrival, departure)`** из `src/utils/effectiveCostDays.js` — считает эффективные сутки с учётом частичных суток (заезд до 06:00 → +1, до 14:00 → +0.5; выезд после 18:00 → +1, после 12:00 → +0.5). Используется в расчётах стоимости размещения
