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
| Виртуализация | react-window (шахматка) |
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
| `VITE_DEV_PATH` | `45.130.42.244:4000` |
| `VITE_DEV_SERVER` | `http://45.130.42.244:4000` |
| `VITE_DEMO_PATH` | `demobackend.karsavia.ru:443` |
| `VITE_DEMO_SERVER` | `https://demobackend.karsavia.ru:443` |
| `VITE_PRODUCTION_PATH` | `backend.karsavia.ru:443` |
| `VITE_PRODUCTION_SERVER` | `https://backend.karsavia.ru:443` |
| `VITE_YMAPS_KEY` | Yandex Maps API key |

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
├── graphQL_requests.js      # GraphQL-запросы, server/path, утилиты
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
│   ├── access.js            # Матрица доступа по ролям
│   ├── externalAuthErrors.js
│   ├── effectiveCostDays.js
│   └── transferPrices.js
├── utils/                   # Утилитарные функции
├── shared/                  # Общие компоненты
└── Components/
    ├── Pages/               # Страницы (маршруты)
    ├── Blocks/              # Переиспользуемые блоки (формы, таблицы, модалки)
    ├── Standart/            # Примитивы (Button, H1, Layout, RowBlock и т.д.)
    ├── PlacementDND/        # Шахматка v1 (dnd-kit)
    └── PlacementDNDV2/      # Шахматка v2 (текущая)
```

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

Матрица доступа по ролям — `src/constants/access.js`.

## Аутентификация

- Токены (JWT) хранятся в **cookie**: `token` (24ч), `refreshToken` (30 дней), `auth_fingerprint`
- Весь доступ к токенам — через `src/services/authService.js`
- Apollo link для 401 — `src/services/authErrorLink.js` (редирект на `/login`)
- Декодирование JWT — `decodeJWT()` в `graphQL_requests.js`
- Внешние пользователи (external login) имеют `subjectType: "EXTERNAL_USER"` и дополнительный контекст в cookie `externalUserContext`

## GraphQL

- **Все** запросы/мутации/подписки — в одном файле `graphQL_requests.js` (5000+ строк). Перед добавлением нового запроса убедись, что аналогичного нет.
- HTTP endpoint: `${server}/graphql`
- WS endpoint: `ws://${path}/graphql`
- Загрузка файлов: `apollo-upload-client` (createUploadLink)
- Подписки: `graphql-ws` + `GraphQLWsLink`

## Система прав доступа (двухуровневая)

Права работают на двух уровнях одновременно:

**1. Роль** — грубая фильтрация: что вообще видит пользователь. Определяется через `user.role` (из JWT). `src/constants/access.js` содержит матрицу: какие страницы/действия доступны каждой роли.

**2. `accessMenu`** — точечные feature-флаги внутри роли. Для авиакомпаний берётся из `authUser.effectiveAccessMenu` (GraphQL), для диспетчеров — из `dispatcherDepartment.accessMenu`.

**Поток `accessMenu` по компонентам:**
```
Main_Page (запрашивает GET_AUTH_USER_ACCESS / GET_DISPATCHER_DEPARTMENTS)
  → устанавливает state accessMenu
  → передаёт в MenuDispetcher (видимость пунктов меню)
  → передаёт в AllRoles → RoleContent → дочерние страницы/блоки
```

Для авиакомпаний `effectiveAccessMenu` уже учитывает переопределения по должности (позиции), рассчитывается на бэке.

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
- Виртуализация строк номеров (`react-window`, `VariableSizeList`)
- Real-time обновления через GraphQL subscriptions
- Документация архитектуры: `SHAHMATKA_ARCHITECTURE.md`

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

## Ключевые паттерны

- **Контексты**: Toast (`useToast`) и Dialog (`useDialog`) доступны глобально
- **Медиафайлы**: `getMediaUrl(path)` из `graphQL_requests.js` добавляет token в URL
- **Стандартные примитивы**: используй компоненты из `src/Components/Standart/` (Button, H1, H2, Layout, RowBlock, ColumnBlock, WidthBlock, CenterBlock, Text)
- **MUI-обёртки**: `MUIAutocomplete`, `MUILoader`, `MUIAlert`, `MUIConfirm`, `MUISwitch`, `MUITextField` — внутренние обёртки над MUI
- **Lazy loading**: тяжёлые страницы подключаются через `React.lazy` + `Suspense`
- **Визуальный disabled**: затемнение элементов при `disabled` делается через `opacity: 0.55` на контейнере (класс `rowDisabled`), а не через MUI-проп `disabled` — это обеспечивает одинаковый вид для включённых и выключённых переключателей
- **CSS-модули**: каждый компонент имеет свой `.module.css`. Стили соседних компонентов из той же папки могут шариться (напр. `AccessPermissionsPanel` использует `SettingsSidebar.module.css`)
