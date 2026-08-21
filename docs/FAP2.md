# FapV2 — интерфейс заявок ФАП (фронтенд)

> Актуально на 2026-08-21 (ревизия; предыдущая — 2026-07-22). Маршруты `/far/*`, код — `src/Components/Blocks/FapV2/` + обёртки `src/Components/Pages/FapV2/`.
> Модель данных и API бэка — см. [FAP.md](FAP.md). Передача модуля бэкендеру — [FAP-HANDOVER.md](FAP-HANDOVER.md).

## Концепция

Список заявок (карточный грид) → детальная страница заявки (KPI-плитки услуг) → страница конкретной услуги. Отчёт по проживанию — внутри страницы гостиницы (вкладки «Гости / Тарифы / Отчёт»). Старый интерфейс ФАП v1 (`ReservePlacementRepresentative`, `/representativeRequests`) ещё жив у суперадмина как «ФАП v1»; легаси-редактор отчёта удалён.

Единая шапка всех экранов ФАП — `FapHeaderActions` (чип «Реестр» + «Редактировать / Скачать отчёт / История»), используется в 7+ местах.

## Маршруты (App.jsx)

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/far` | `FapV2` (через role-контенты, id="far") | Список заявок, скролл-пагинация |
| `/far/:requestId` | `FapLayout` → `FapDetailPage` → `FapDetail` | Деталка заявки |
| `/far/:requestId/service/:serviceKey` | `FapServicePage` | Страница услуги (water/meal/living/transfer/transferDeparture/baggage) |
| `/far/:requestId/service/living/hotel/:hotelIndex` | `FapHotelDetailPage` → `FapHotelPage` | Гостиница: гости, тарифы, отчёт |
| `/far/:requestId/service/:serviceKey/driver/:driverIndex` | `FapDriverDetailPage` → `FapDriverPage` | Водитель трансфера |
| `/far/:requestId/service/baggage/trip/:driverIndex` | `FapBaggageTripDetailPage` → `FapBaggageTripPage` | Поездка доставки багажа |
| `/far/:requestId/registry` | `FapRegistryPage` → `FapRegistry` | Реестр пассажиров заявки |

`FapLayout` рендерит меню один раз, берёт `accessMenu` из `useEffectiveAccessMenu(user)` и кладёт `{ user, accessMenu }` в Outlet-контекст. Для external-пользователей меню скрыто. Гостиничные роли из деталки заявки перенаправляются сразу на страницу своей гостиницы.

## Доступы (двухслойные: роль + accessMenu)

Центральный модуль — **`fapEditAccess.js`**:

- `canEdit` = ключ **`reserveUpdate`** и не-АК; пункт меню — **`reserveMenu`**; создание — **`reserveCreate`**.
- **`isRequestEditLocked(request, accessMenu, user)`** — отменённая заявка заперта всегда; **завершённая** — только для владельцев ключа **`reserveUpdateCompleted`** (дефолт false, внешним недоступен). Навешан на все 5 входов (`FapServicePage`, `FapHotelDetailPage`, `FapDriverDetailPage`, `FapBaggageTripDetailPage`, `FapRegistryPage`) и `FapDetail`. ⚠️ Гейт чисто клиентский — серверного enforcement нет.
- `canManageServicePeople(service, canEdit)` — состав людей услуги можно вести до статуса CANCELLED включительно у ЗАВЕРШЁННОЙ услуги (осознанное решение 18.08; в `FapDriverPage` ровно два вхождения `canEdit && !isCompleted` — шапка и время подачи, это инвариант).
- **Гостиница** (`isHotelScoped` = роль HOTELADMIN/HOTELMODERATOR или магик-линк scope HOTEL): видит только свою гостиницу внутри заявки; услуга «Трансфер» скрыта, если её собственная гостиница трансфер не возит (**`fapServiceVisibility.js`**, критерий — свои цены трансфера, `hotelProvidesTransfer`); договорные тарифы АК не показываются (`optgroup` и карточки под `!hotelScoped`); свои тарифы показываются в её ценах (`price`/`mealPrice`), а не в ценах для АК; аналитика «Пассажиры» запрещена (бэк). В списке `/far` гостинице не показывается ряд иконок услуг.
- **Авиакомпания**: read-only почти везде; отчёт гостиницы открывается ей **только после «Отправить на проверку»** (**`fapReportAccess.js`**, поле `submittedAt`, парная кнопка «Скрыть»); принудительный режим «Просмотр».
- **External (представитель PWA)**: без меню, без Реестра, без «Скачать отчёт»; `accessMenu` у внешних нет вовсе.
- «Вернуть услугу в работу» (`useServiceReopen`, мутация `reopenPassengerRequestService`) — только диспетчерам, причина обязательна, подключено в кебабах четырёх экранов услуг (на странице водителя — нет, известный пробел).

## Список — `Pages/FapV2/FapV2.jsx`

Карточный грид: номер заявки + статус-бейдж, логотип АК, рейс + дата, аэропорт, прогресс-точки услуг, бейдж «экипаж N». Тулбар: `FilterPopoverButton` (АК/аэропорт/даты/статус — статус персистится в `localStorage.statusFilterFapV2` и уходит серверным фильтром) + серверный поиск (`useDebounce`) + «Создать заявку». **Пагинация — бесконечный скролл** (`useInfiniteScroll` + `InfiniteScrollSentinel`, общий хук с `refreshWindow`). Реалтайм: подписки CREATED/UPDATED → обновление окна.

## Деталка — `Blocks/FapV2/FapDetail`

- Статусы заявки: линейные переходы через статус-пилл + подтверждение; отмена — `FapDestructiveModal` (причина обязательна с 06.08).
- Шапка — `FapHeaderActions`; «Скачать отчёт» — сводный XLSX по сохранённым отчётам; PWA-ссылка представительства (`useRepresentativeLink`).
- KPI-плитки услуг: факт/план, прогресс, дедлайн; проживание — диапазон дат + сутки по длительности (`calculateCostDaysByDuration`); багаж считает доставки по `deliveryCompletedAt`. Плитки фильтруются `fapServiceVisibility` (см. Доступы).
- **Овербукинг разрешён** (03.08): замки «Σ мест ≤ план» и лимиты вместимости сняты по всей цепочке; вместо них — предупреждения о переборе и совпадении ФИО (`fapLivingMismatch.js`: коллизии по ФИО + место как второй различитель), уведомление при переходе порога, кнопка «привести план к факту».
- `FapChat` — чат заявки (подписка + `SEND_FAP_MESSAGE`).

## Страницы услуг

`FapServicePage` маппит `serviceKey` → компонент и передаёт `canEdit` (уже с учётом `isRequestEditLocked`):

| Услуга | Компонент | Особенности |
|--------|-----------|-------------|
| Вода / питание | `FapWaterMealPage` (WATER/MEAL) | Схлопнутая строка редактирования; количества приёмов (З/О/У) + **ланчбокс количеством** (`lunchboxCount`) |
| Проживание | `FapLivingPage` (список отелей) → `FapHotelPage` | См. движок отчёта ниже |
| Трансфер (прилёт/вылет) | `FapTransferPage` → `FapDriverPage` | Привязка поездки к гостинице проживания (`hotelItemId`, кнопка «Заселённые в ‹…›»), **количественный учёт** «перевезено N» (`transportedCount`, факт = max(список, число) — ввод числа может сам завершить услугу); подстановка адреса аэропорта во вторую сторону маршрута |
| Багаж | `FapBaggagePage` → `FapBaggageTripPage` | Поездка водителя со списком пассажиров; у каждого бирки, цена, адрес доставки; сумма поездки производная; отметка доставки по водителю |
| Реестр | `FapRegistry` | См. ниже |

Общее: добавление людей вручную или из реестра (`CatalogPickerModal`, матч по `personId`); возрастная категория (`CategoryBadge`) видна и редактируема; **массовые операции** — выселение, переселение, удаление получателей и пассажиров водителя, присвоение номера (поштучных циклов не осталось, всё пакетными мутациями); валидация дат переселения/выселения.

## Движок отчёта по проживанию — `FapHotelPage`

Вкладки «Гости» / «Тарифы» / «Отчёт». Режимы `FapModeToggle` «Просмотр/Редактирование» (для АК форс view, view-рендер — `FapReportView`).

**Три источника тарифа** в селекте (порядок optgroup): (1) «По договору авиакомпании» — договорные цены АК (`fapAirlineTariff.js`, `GET_AIRLINE_TARIFS`, скрыт от гостиниц), (2) «Тарифы заявки» — ручные, (3) «Тарифы гостиницы» — из `roomKind` гостиницы. ⚠️ Новому гостю **автоподставляется договор АК** (`buildPdForNewPerson`); диспетчеру тарифы гостиницы отдаются в ценах «для АК» (`priceForAirline`/`mealPriceForAir`) — задача «мы↔Объект» из задачника ещё не делалась. Имена тарифов матчатся без регистра и хвостовых пробелов; дубли имён не схлопываются ошибочно (фиксы 15.08/18.08).

**Тариф (клиентский объект):** `{ id, name, breakfast/lunch/dinner, lunchbox, billingMode: "PER_BED"|"PER_ROOM", placementPrices: [{places, pricePerDay}], draft, source? }`. Персист без сущности на бэке — **ghost-строками** в `reportRows` (пустой `fullName`; `roomKind:"PER_ROOM"` — маркер режима «Номер»); черновики тарифов переживают пересборку.

**Расчёт строки (`getEffectiveRow`):**
- Вид размещения номера — редактируемый (`placementKind`), по умолчанию от числа гостей; реальный номер выбирается из фонда гостиницы (`RoomNumberField`, freeSolo, категория подтягивается).
- `PER_BED`: проживание = `pricePerDay(вид) × daysCount × chargeFactor`; скидка — авто по возрасту (ребёнок 50%, инфант 100%) или ручная колонка «Скидка» (`accommodationDiscount`, только проживание).
- `PER_ROOM`: цена номера начисляется один раз на «несущего» гостя, остальным 0 («в номере»); скидки в этом режиме не применяются (известный пробел — задача «деление пополам + скидка детям» из задачника).
- Сутки — **по длительности** (`calculateCostDaysByDuration`: min 1 сутки + 0.5 за начатый 12ч блок; единое правило, `fapPersonDays.js`); ручная правка «Сут.» переживает перезагрузку. Старое правило `calculateEffectiveCostDays` живо для не-ФАП мест.
- **Матч строк отчёта к гостям — по `personId`, ФИО — fallback** для старых строк.

**Жизненный цикл отчёта:** автосейв (дебаунс, полная замена строк) → **«Отправить на проверку»** (`submittedAt`; перед отправкой — предполётная сводка недосчитанного) → отчёт открывается АК. Изменение состава/размещения гасит отправку (бэк, «изменилось → отправь заново»). ⚠️ У ОТПРАВЛЕННОГО отчёта цена и вид размещения читаются из сохранённой строки (пиннинг), у черновика пересчёт живой. Сохранение отчёта публикует `passengerRequestUpdated` — чужие изменения подхватываются live.

**Экспорт XLSX:** `reports/buildReportSheets.js` (exceljs) — 25 колонок, листы по отелю + сводный, «Итого», подзаголовки трансфера. Известные хвосты формата — см. задачник («Коррект иксель формата по ФАПу»): шрифт/выравнивание/полное имя АК/вид размещения у каждого/колонка договора.

**Ограничения:** автосейв = полная замена → last-write-wins при параллельной работе; `updateReportDraft`-подобной версионности нет.

## Группы пассажиров — `fapGroups.js`

`passengerGroups` заявки: kind FAMILY/ESCORT/COLLEAGUES/GROUP/OTHER, `togetherLevel` ROOM|HOTEL, цвет, автоподпись по фамилии (`surnameForms.js` — муж/жен формы схлопываются, русский плюрал). Инвариант «один человек — одна группа» (`buildGroupIndex`). `GroupChip` — единственное место отрисовки метки (реестр, гостиница, отчёт в обоих режимах); сортировка «со связью наверх». `placementRequirement` (1-местное/2-местное) — требование вида размещения. Автоподсказки — `fapGroupSuggestions.js`.

## Реестр — `FapRegistry` (`/far/:requestId/registry`)

Таблица `savedPassengers` с CRUD, поиском, колонкой «Услуги» (presence по `personId` в 5 услугах), раздельными счётчиками детей и инфантов; удаление с предупреждением «размещён в …» (из услуг не удаляется — так устроен бэк); экипаж read-only. ⚠️ Экипаж, заселённый в гостиницу, становится записью реестра и считается вторым человеком (известный дефект, ждёт решения по виду).

**Импорт манифеста:** `ManifestUploadField` → `parseManifestXlsx` (`manifestCore.js`) — **пять профилей**: ПМ, PNL, PLI (DCS-выгрузка), PM_TEXT (фикс-ширина), ICAO Annex 9; .xlsx/.xlsb/.xls, лимит 10 МБ. Инфанты на руках разворачиваются записями `‹сопровождающий› (инфант)` (`expandLapInfants`). **Рейс манифеста сверяется с рейсом заявки** (`isSameFlight`, транслит СУ↔SU): при расхождении — плашка + импорт только через подтверждение. Матчинг людей — жадный 1:1 по нормализованному ФИО (`manifestNameKey`, зеркало бэкового `normalizeFullNameKey`); повторный импорт идемпотентен, existing-wins. ⚠️ Повторный импорт после переименования человека даёт дубль — следствие сшивки по ФИО.

## Аналитика «Пассажиры»

`src/Components/Pages/AnalyticsForAvia/tabs/PassengerAnalytics/` — после программы A–G (24.07): МСК-границы периода, раскрывающаяся детализация по заявке, секционная модалка фильтров со «Сбросить» и бейджем, сводки, единый поток без тумблера, экспорт XLSX одной книгой. Источник — `GET_PASSENGER_ANALYTICS` (бэк агрегирует `reportRows` + `reportCost`, ghost-строки исключены). АК видит только свои заявки; **гостиницам аналитика запрещена** (бэк, 19.08).

## fapConstants.js

`SERVICE_CONFIG` (6 услуг), `REQUEST_STATUS_CONFIG` / `SERVICE_STATUS_CONFIG`, `PERSON_TYPE_CONFIG`, `PERSON_CATEGORY_*`, `normalizeCategory`, `accommodationChargeFactor` (1 / 0.5 / 0) + `accommodationDiscountPercent` (0/50/100), `VEHICLE_TYPES`, `placementKindLabel`, форматтеры дат.

## Общие компоненты и модули FapV2

UI: `FapHeaderActions`, `FapActionButton`, `FapOverflowMenu`, `FapRegistryButton`, `FapModeToggle`, `FapDestructiveModal`, `FapSelect` (все дропдауны ФАП), `ServiceProgressDot`, `PersonBadge`, `CategoryBadge`, `PersonTypeToggle`, `GroupChip`, `CatalogPickerModal`, `ManifestUploadField`, `RoomNumberField`, `FapChat`.
Логика: `fapEditAccess.js`, `fapReportAccess.js`, `fapServiceVisibility.js`, `fapGroups.js`, `fapAirlineTariff.js`, `fapRooms.js`, `fapPersonDays.js`, `fapLivingMismatch.js`, `hooks/useRepresentativeLink`, `hooks/useServiceReopen`.
Тесты: `node --test src/Components/Blocks/FapV2/` (рядом с модулями; бэйзлайн мерить перед работой, не цитировать по памяти).
