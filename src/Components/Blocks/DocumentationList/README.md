# Раздел «Помощь» (Инструкции) — экскурс по фронтенду

Раздел в интерфейсе называется **«Помощь»** в меню и **«Инструкции»** в заголовке страницы. Реализован как блок документации с деревом разделов/статей и богатым редактором контента.

---

## 1. Точка входа и маршрутизация

- **Маршрут:** `/documentation`
- **Меню:** пункт «Помощь» (иконка вопроса) ведёт на `/documentation` в сайдбарах:
  - `SuperAdminContent/SuperAdminMenu/SuperAdminMenu.jsx`,
  - `HotelAdminContent/HotelAdminMenu/HotelAdminMenu.jsx`,
  - `AirlineAdminContent/AirlineAdminMenu/AirlineAdminMenu.jsx`.
- **Рендер контента:** при `id === 'documentation'` рендерится `DocumentationList` в `SuperAdminContent.jsx` и `AirlineAdminContent.jsx`. В `TransferAdminContent` блок закомментирован.

---

## 2. Иерархия компонентов

```
DocumentationList.jsx
  └── DocumentationList1.jsx
        ├── DocumentationListLeftPanel/   — дерево разделов и статей
        ├── DocumentListTiptapPanelContent — центральная панель (просмотр/редактор)
        └── DocumentationListRightPanel/  — навигация по якорям
```

- **DocumentationList.jsx** — обёртка: общий `Header` с текстом «Инструкции», переключатель типа документации (если доступен) и блок с `DocumentationList1`.
- **DocumentationList1.jsx** — layout из трёх зон: левая панель (дерево), центральная (контент/редактор), правая (навигация по якорям). Управляет состоянием дерева, выбранной статьёй, шириной левой панели и открытием правой.

---

## 3. Типы документации (фильтры)

Логика в `documentationFilters.js`:

- **Варианты:** Диспетчер (`dispatcher`), Авиакомпания (`airline`), Гостиница (`hotel`), Представительство (`representation`). Каждому соответствует `apiType`: DISPATCHER, AIRLINE, HOTEL, REPRESENTATION.
- **Доступ к переключателю:** только у `superAdmin` (`hasDocumentationFilterSwitcherAccess`). Остальным показывается один таб по роли (`resolveDocumentationFilterForUser`).
- Дерево и статьи запрашиваются с бэкенда по выбранному `type` (apiType).

---

## 4. Данные и API (GraphQL)

Запросы в `graphQL_requests.js` (около 5166–5295):

- **Дерево:** `GET_SECTIONS_WITH_HIERARCHY` — `sectionsWithHierarhy(type: $type)`. Ответ преобразуется в локальное дерево узлов `section`/`article` в `DocumentationList1` (нормализация, порядок, `toLocalTreeNode`).
- **Статья:** `GET_ARTICLE(id)` — id, title, content (JSON doc), sectionId, section.
- **Мутации:** `CREATE_SECTION`, `UPDATE_SECTION`, `DELETE_SECTION`, `CREATE_ARTICLE`, `UPDATE_ARTICLE`, `DELETE_ARTICLE`. Тип документации передаётся в input как `type: apiType`.
- **Загрузка медиа:** `UPLOAD_DOCUMENTATION_IMAGE`, `UPLOAD_DOCUMENTATION_FILE` — используются в контексте редактора инструкций.

Цикл данных: при смене типа/роли перезапрашивается иерархия; дерево гидратируется в state; при выборе статьи подгружается контент; сохранение контента — через `UPDATE_ARTICLE`.

---

## 5. Левая панель — дерево инструкций

`DocumentationListLeftPanel/DocumentationListLeftPanel.jsx`:

- **Дерево:** разделы (section) и статьи (article), вложенность, сворачивание. Состояние «открыт/закрыт» секций хранится в `localStorage` (`doclist_section_open_state_v1`).
- **Поиск:** поле поиска и фильтр по типу узла (все / разделы / статьи).
- **Права:** при `canManage` — создание раздела/статьи, переименование, удаление (с подтверждением), перетаскивание (drag-and-drop), копирование (буфер и вставка). Вызовы `CREATE_SECTION`, `CREATE_ARTICLE`, `UPDATE_SECTION`, `UPDATE_ARTICLE`, `DELETE_SECTION`, `DELETE_ARTICLE` и `GET_ARTICLE`.
- **Тип документации:** при `showDocumentationFilter` и супер-админе — выбор типа для корневых разделов/статей; для вложенных наследуется от родителя.
- **Выбор статьи:** `onSelectFile(activeDocId)` — при клике по статье в центральной области открывается её контент.

---

## 6. Центральная панель — просмотр/редактирование статьи

`DocumentationListPanelContent/DocumentListTiptapPanelContent.jsx`:

- **Пустое состояние:** когда статья не выбрана — заголовок «Инструкции», кнопки: открыть левую панель, обновить дерево.
- **С открытой статьёй:** тулбар с «Назад», названием статьи, обновлением, переключателем правой панели; ниже — область редактора (Tiptap) и опции ширины/отступов контента (preset/manual, shared/manual padding).
- **Контент:** приходит как JSON (ProseMirror doc). Парсится из `article.content` или из метаданных в `description` (legacy). Лейаут статьи (ширина, отступы) хранится отдельно (в т.ч. локально) и может сохраняться через `saveDocLayout` / docDraftStore.
- **Сохранение:** при изменении контента (и при правах редактирования) вызывается `onDraftPersist(docId, 'content', content)` → в `DocumentationList1` это приводит к `UPDATE_ARTICLE` с `input: { content, type? }`.

Редактор обёрнут в `DocumentationListPanelContent/src/DocumentationUploadContext.jsx`: провайдер даёт `uploadImage` и `uploadFile` (через мутации загрузки), токен из cookie; `DocumentationUploadStore.js` — уведомления об ошибках загрузки.

---

## 7. Редактор Tiptap — расширения и блоки

`DocumentationListPanelContent/src/editorExtensions.js`:

- **Базовый текст:** StarterKit (параграфы, заголовки 1–6, списки, код, ссылки), Placeholder, TextStyle, Color, Highlight, Underline, TextAlign, FontSize, BackgroundColor.
- **Навигация по документу:** `NavigationAnchor` — атрибуты `anchorTag`/`anchorId` на paragraph/heading; используются для правой панели «содержание».
- **Таблицы:** Table, TableCell, TableHeader, TableWrapper, TableRowHeight, TableRowResizing, TableCellCursorPad, TableCellSelectionOnContent, TableSelectionLockPlugin.
- **Блоки контента:** QuoteBlock, Toggle, FrameBlock, ColumnsLayout, **ImageBlock**, **GalleryBlock**, **VideoBlock**, **AudioBlock**, **FileBlock** — каждый в своей view в `DocumentationListPanelContent/src/extensions/`; поддержка вставки/загрузки и при необходимости миграции на серверные URL (upload).
- **Доп. поведение:** SlashInterceptor + SlashCommand, BlockLassoSelectionPlugin, imageDropPlugin для вставки изображений.

Сообщение про «Отображение этого видео из ВКонтакте разрешено только на официальных сайтах партнёров» связано с тем, что видео-блок рендерит iframe VK; ограничения домена исходят от VK, не от кода.

---

## 8. Правая панель — навигация по якорям

`DocumentationListRightPanel/DocumentationListRightPanel.jsx`:

- **Входные данные:** `blocks` — массив якорей из текущей статьи (заголовки/параграфы с `data-nav-anchor`).
- **Источник blocks:** в редакторе `DocumentationListPanelContent/src/components/AnchorHashOverlay.jsx` сканирует документ, собирает блоки с якорями и вызывает `onAnchorsChange(nextBlocks)` → в `DocumentationList1` это попадает в `rightPanelBlocks` и передаётся в правую панель.
- **Поведение:** список пунктов с прокруткой к соответствующему блоку в центральной панели; подсветка активного пункта при скролле (по позиции viewport относительно sticky-тулбара).

Панель показывается только когда открыта статья и пользователь её явно открыл (кнопка-шеврон); при смене статьи правый сайдбар закрывается.

---

## 9. Вспомогательные модули

- **docTreeUtils.js:** `findDocById(tree, id)` — поиск статьи в дереве по id.
- **DocumentationList1/tree.js:** `loadTree()` возвращает `[]`; начальное дерево приходит с сервера через `GET_SECTIONS_WITH_HIERARCHY` и гидратируется в state.
- **Стили:** `DocumentationList.module.css` — секция, фильтры, блок документации; `DocumentationListLeftPanel/DocumentationListLeftPanel.css`; отдельные CSS для блоков редактора (таблицы, аудио, файлы, галерея и т.д.).

---

## 10. Краткий поток данных

1. Пользователь заходит на `/documentation` → рендер `DocumentationList` → по роли/настройкам выбирается тип документации → `DocumentationList1` запрашивает `GET_SECTIONS_WITH_HIERARCHY(type)`.
2. Ответ превращается в дерево section/article, сохраняется в state и отображается в левой панели; при необходимости синхронизируется с сервером через мутации из левой панели.
3. Клик по статье → `setActiveDocId` → запрос `GET_ARTICLE(id)` (или кэш), контент передаётся в Tiptap; якоря собираются и уходят в правую панель.
4. Редактирование (если есть права) → при сохранении контента вызывается `UPDATE_ARTICLE`; загрузка картинок/файлов — через контекст загрузки и мутации `UPLOAD_DOCUMENTATION_IMAGE` / `UPLOAD_DOCUMENTATION_FILE`.

Итог: раздел «Помощь» на фронте — это полноценный модуль документации с мульти-типом (диспетчер/авиакомпания/гостиница/представительство), деревом разделов и статей, богатым Tiptap-редактором с медиа-блоками и правой панелью навигации по якорям, с разграничением по ролям и сохранением в GraphQL API.
