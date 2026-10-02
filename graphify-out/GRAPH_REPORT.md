# Graph Report - .  (2026-10-02)

## Corpus Check
- 839 files · ~679,981 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4456 nodes · 14663 edges · 206 communities (165 shown, 41 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 443 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- ФАП: багаж и вода/питание — FapBaggagePage, FapBaggageTripPage, FapWaterMealPage, FapHeaderActions
- GraphQL: ядро запросов и формы заявок
- ФАП: FapDetail, fapConstants и файлы манифеста
- ФАП: реестр и группы пассажиров
- ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms
- Цены авиакомпании: тарифы и география (airlineTariffPrices, airlineTariffGeography)
- Реестр договоров: таблица InfoTableAllDataTarifs, ДС-поповер и архив
- Реестр договоров: фронт-правки (ДС-бейдж, пролонгация, истечение)
- Реестры договоров: Hotel/Airline/Organization RegisterOfContracts, DeleteComponent и фильтры
- ФАП: выгрузка проживания в XLSX — addHotelSheet, addCombinedSheet и hotelIndexes
- ФАП-аналитика (спеки): фильтры по периоду, пресеты декад и фильтр по № рейса
- ФАП (спеки): единый реестр пассажиров и отправка отчёта на проверку
- ФАП: доступ к отчёту и стадии — fapReportAccess, fapReportStages, FapLivingPage
- ФАП: импорт манифеста — parseManifestXlsx, ManifestUploadField, manifestCore
- Звёздность гостиниц: starRating, StarRatingFilter, parseStarValue
- ФАП-аналитика: PassengerAnalytics и мапперы
- Passenger Analytics Summary Charts
- Passenger Analytics Aggregation
- ФАП-аналитика: экспорт Excel (passengerAnalyticsExport)
- AddressField и геосаджест
- ФАП: реальные номера гостиницы — fapRooms, RoomNumberField (спека real-hotel-rooms)
- ФАП: профили манифеста (manifestProfiles, PLI, cleanFullName)
- ФАП: подбор групп — surnameForms, fapGroupSuggestions и общий корень фамилии
- groupsCount и linkedPeopleCount в аналитике по пассажирам
- Сессия и контексты: getCookie, useToast, useDialog, JWT
- Представители и доступ: Representative*DetailPage, useEffectiveAccessMenu, Main_Page и DeleteIcon
- ФАП: роуты страниц, App.jsx и роли доступа (canAccessMenu, isHotelScoped, FapChat)
- ФАП (спеки): распознавание документа по фото, назначение номера и слияние панелей уведомлений
- Аналитика: Dispatcher/Hotel/Support Analytics, AnalyticsChart и DateRangePickerCustom
- Системные уведомления и патч-ноуты
- ФАП: трансфер — FapTransferPage и факт поездки
- ФАП: книга Excel — листы воды/питания, багажа и трансфера (buildReportSheets)
- SettingsSidebar: AccessPermissionsPanel, accessSections и слияние панелей доступа
- ФАП-аналитика (спеки): метрики связей groupsCount, linkedPeopleCount и колонка «Группы»
- ФАП: reportRowMatch — единый матчинг строк отчёта к гостям (personId)
- Сутки проживания: effectiveCostDays и fapPersonDays
- Excel-даты и парсер массового импорта (excelDate, parseBulkXlsx)
- Тарифы: Create/EditRequestTarifCategory, AirlineTarifs_tabComponent и MultiSelectAutocomplete
- Уведомления и бесконечный скролл (NotificationsSidebar, useInfiniteScroll)
- ФАП: FapDriverPage, fapEditAccess, PersonBadge и массовое удаление получателей услуг
- ФАП (спеки): гидрация заявки из ростера и пакетное заселение в PWA
- SettingsSidebar: уведомления — NotificationsPermissionsPanel, notificationSections, notificationPayload
- UI-примитивы: Button, Sidebar, CloseIcon, MUIAutocomplete + формы компаний
- Сезонные цены категорий номеров (RoomKindSeasons)
- Шахматка (док): точка входа HotelShahmatka, гейты доступа и v1
- Геометрия сетки (dayWidth, rowHeight = 50 × places)
- Известные расхождения шахматки с конвенциями репозитория
- Шахматка v2 (док): DraggableRequestV2, RoomRowV2, дефекты resize и дат
- Шахматка v2 (док): оркестр NewPlacementV2, плашка и правая панель
- Placement Dead Code Defects
- Шахматка v2 (док): виртуализация строк и buildFilteredRooms
- SHAHMATKA ARCHITECTURE
- Шахматка v2 (док): пересечения — placementOverlap и hasOverlap
- Шахматка v2 (док): статусы и цвета — translateStatus, дубли карты статус→цвет
- Placement Board Data Mapping
- Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08)
- ФАП-доки: оглавление FAP.md, FAP2.md, FAP-HANDOVER, FAP-DECISIONS
- Доки ФАП: FAP.md, FAP2.md, FAP-DECISIONS, FAP-HANDOVER
- ФАП-доки: FAP_SCOPE, withFapAuthGuard, ExternalUser и recognizePassengerDocument
- ФАП-доки: сеть characterization-тестов и разделение резолверов
- docs
- Провайдеры приложения: AuthContext, main.jsx, App и index.html
- Эскадрилья: Estafeta, ExistRequest, статусы и roles
- Доступ по ролям: access.js (isSuperAdmin…), фильтр гостиниц show/active
- Гостиница: таблица бронирований (HotelTable, Booking, Placement)
- Шахматка v2: NewPlacementV2, utils и история версий
- CLAUDE.md / AGENTS.md: руководство и MUI-примитивы
- Таблицы заявок: InfoTable и хелперы дат convertToDate / buildScheduledISO
- Ключи accessMenu: menuAccess (roles.js) и README v12.14–v12.15
- RoleContent: точки входа ролей (SuperAdmin/Dispatcher/Airline)
- SettingsSidebar: accessPayload.js и история версий доступа
- Отчёты v2: ReportDraftsPanel, reportDraftAge, reportDraftComment и раздел в CLAUDE
- Отчёты v2: правила расчёта суток (reportRules, ReportRulesSidebar)
- README: история версий
- README: v12.2 — единый airlineAnalytics, экспорт в PDF и Script Runner
- README: версии v12.13–v12.14 и hotelAddress (composeHotelAddress)
- Меню ролей: MenuDispetcher, SuperAdminMenu и canSeeAnalytics
- Отчёты v2: выпущенные отчёты, GraphQL и SegmentedToggle
- ФАП: манифест фиксированной ширины и ICAO (manifestFixedWidth)
- ЛК гостиницы: hotelTransfer (hotelProvidesTransfer)
- Описание гостиницы: парсер hotelDescription и HotelPreview
- Цены трансфера: transferPrices.js и поиск по маршрутам
- Документация «Помощь»: DocumentationList1, дерево и левая панель
- Документация: локальное хранилище черновиков (docDraftStore, indexedDb, fileStore)
- Документация: редактор Tiptap и расширения
- TravelLine: поиск, бронирование, синхронизация
- Трансфер: заказ (TransferOrder)
- Вход и возврат по /login?next= (loginRedirect, LoginRedirect)
- Страницы АК и автопарка: AirlinePage, DriversCompanyPage, роутинг по ролям
- Авторизация: authService, authErrorLink (401 → logout) и TokenRefresher
- Активность пользователя: UserActivityTracker, MARK_USER_ONLINE / MARK_USER_OFFLINE
- Чаты и поддержка: Message, SupportPage, getMediaUrl
- Резерв: ReservePlacement(Representative), InfoTableDataReserve*, ChooseHotel и словарь roles
- ФАП: сайдбары заявки — CreateRepresentativeRequest, AddRepresentativeService
- Резерв представителя: вкладки услуг (Habitation / Water / Power / Baggage) и DeleteIcon
- Документация: создание статей и обновлений (CreateRequestDocumentation, TextEditor)
- Страница гостиницы: HotelPage, роутинг по ролям, ссылка предпросмотра
- «О гостинице»: HotelAbout и иконки удобств
- Шахматка v2: usePlacementData, placementTransforms и requestArchiveAccess
- Аналитика АК: AirlineAnalytics, мапперы и сортировка таблиц
- Отчёты v2: черновик — reportDraftRows, useReportDraft
- Отчёты v2: таблица черновика — ReportDraftTable, Summary, группировка по гостиницам
- Плашка техработ: MaintenanceBannerBar и useMaintenanceCountdown
- Документация: правка статей — EditRequestDocumentation и дерево блоков
- TravelLine: панель номеров — TravellineRoomsSidebar, TL_AVAILABILITY
- package.json: метаданные и скрипты (dev, build, lint, preview)
- package.json: dependencies (Tiptap, MUI)
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- package
- ScriptRunner: плавающее окно — DraggableWindow, useDragResize, PickHighlight
- package
- package
- package
- package
- package
- package
- package
- package
- ФАП: манифест из реестра и импорт (fapManifestBuild, ManifestImportModal)
- package.json: devDependencies (Vite, ESLint)
- О компании: HotelSettings, AirlineAbout, OrganizationAbout и иконки контактов
- Svg-обёртка, иконки действий и меню «⋮»
- Обрезка изображений: getCroppedImg
- Документация: Tiptap-панель, modalStacking, ImageViewer
- Документация: загрузка файлов (UploadContext, imageDropPlugin)
- Документация: медиа-блоки редактора
- Документация: тулбар и экспорт в Office
- Документация: slash-команды — blockRegistry (Tiptap)
- Документация: якоря навигации (AnchorHashOverlay)
- Документация: перетаскивание блоков (BlockDragOverlay)
- Документация: выделение блоков (BlockSelectionOverlay, blockLassoSelection)
- Документация: импорт DOCX (docxImport.js)
- Документация: PlusButtonOverlay — кнопка «+» у блока
- Документация: файловый блок (fileBlockView, превью офисных файлов)
- Документация: галерея (galleryBlock) — раскладки и подгонка
- Документация: блоки цитаты и рамки (quoteBlock, frameBlock)
- Документация: высота строк таблицы (tableRowResizing)
- Документация: обёртка таблицы, перенос строк и колонок (tableWrapperView)
- Документация: правка обновлений (EditRequestUpdates), HotelAboutRoomBlock и TextEditorOutput
- ФАП: скидки пачкой — FapDiscountDialog, fapDiscountZones
- ФАП: список заявок FapV2 и фильтры fapListFilters
- ФАП: файлы манифеста — fapManifestFiles (имя загрузки, порядок, парсинг)
- ФАП: деньги отчёта — fapReportMoney и матчинг строк (reportRowMatch)
- ФАП: шапка услуг FapHeaderActions и видимость услуг для гостиницы
- ФАП: тесты книги отчёта Excel (buildReportSheets.test)
- Загрузка файлов: FileUpload и UPLOAD_FILE_MUTATION
- «О гостинице»: редактор по разделам — HotelAboutEditor, AboutChecklist, AboutLaundry
- «О гостинице»: разбор описания по разделам (hotelAbout.js)
- «О гостинице»: галерея HotelAboutGallery
- Отчёты v2: строка черновика — ReportDraftRow, editorUtils, formatMoney
- Отчёты v2: список ReportsV2List и шапка черновика
- ScriptRunner: константы действий и SVG-иконки панели (ACTION_TYPES, Icon*)
- ScriptRunner: компонент, сбор скриптов и экспорт (collectScripts, buildLibraryExportPayload)
- ScriptRunner: исполнение действий и DOM-хелперы (executeAction, setElementValue)
- ScriptRunner: импорт сценариев — parseImportPayload, migrateFromFlatFormat, isValidTree
- ScriptRunner: дерево действий — insertNode, moveNode, removeNodeById
- ScriptRunner: значения действий — случайные даты и время (resolveTypeActionValue)
- HotelPMS (мок-данные)
- Аналитика АК: сортировка таблиц — analyticsTableSortUtils
- Шахматка v2: стили статусов, BoardToolbar, PlacementBarV2 и RoomRowV2
- Шахматка v2: период и шапка сетки (placementPeriod, GridHeader)
- Шахматка v2: бейджи плашек (placementBadges), лоток TrayCardV2 и BarPopover
- ScriptRunnerContext и Layout (Empty)
- UI-примитивы: Button, MUILoader, Toast, Sidebar
- ФАП: тесты профилей манифеста

## God Nodes (most connected - your core abstractions)
1. `getCookie()` - 361 edges
2. `useToast()` - 175 edges
3. `MUILoader()` - 147 edges
4. `useDialog()` - 143 edges
5. `getMediaUrl()` - 133 edges
6. `Button()` - 133 edges
7. `useRequiredFields()` - 112 edges
8. `convertToDate()` - 89 edges
9. `Sidebar()` - 87 edges
10. `CloseIcon()` - 82 edges

## Surprising Connections (you probably didn't know these)
- `ФАП: карточка доставки багажа по составу реальных документов` --semantically_similar_to--> `FapTransferPage()`  [INFERRED] [semantically similar]
  docs/superpowers/specs/2026-07-27-fap-baggage-delivery-fields-design.md → src/Components/Blocks/FapV2/FapTransferPage/FapTransferPage.jsx
- `Конфиг секций уведомлений и правило имён каналов` --semantically_similar_to--> `ACCESS_SECTIONS`  [INFERRED] [semantically similar]
  docs/superpowers/specs/2026-07-30-notifications-panel-merge-design.md → src/Components/Blocks/SettingsSidebar/accessSections.js
- `МСК-границы периода аналитики (resolvePeriodBounds)` --semantically_similar_to--> `mskMonthKey()`  [INFERRED] [semantically similar]
  docs/superpowers/specs/2026-07-23-fap-analytics-period-bounds-design.md → src/Components/Pages/AnalyticsForAvia/tabs/PassengerAnalytics/passengerAnalyticsAggregations.js
- `PassengerAnalyticsHotelBreakdown (live headcount vs report snapshot)` --shares_data_with--> `fillHotelsSheet()`  [INFERRED]
  docs/superpowers/specs/2026-07-23-fap-analytics-detail-pack-design.md → src/Components/Pages/AnalyticsForAvia/tabs/PassengerAnalytics/passengerAnalyticsExport.js
- `Airport.address во всех селектах аэропорта` --references--> `GET_PASSENGER_REQUEST`  [INFERRED]
  docs/superpowers/specs/2026-07-30-airline-price-contract-type-and-airport-address-design.md → graphQL_requests.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Поток accessMenu: Main_Page → MenuDispetcher → AllRoles → RoleContent** — claude_access_menu_flow, src_components_pages_main_page_main_page, src_components_blocks_menudispetcher_menudispetcher, src_components_rolecontent_allroles, claude_role_content [EXTRACTED 1.00]
- **Жизненный цикл черновика отчёта: создание → правка строк → сохранение → SUBMITTED → confirm** — claude_report_drafts, claude_recalc_row_rule, claude_update_report_draft_overwrite, readme_v12_15_airline_draft_submit_flow, src_components_blocks_reportsv2_reportdrafteditor_usereportdraft [INFERRED 0.85]
- **Поток данных раздела «Помощь»: тип → дерево → статья → Tiptap → якоря** — src_components_blocks_documentationlist_readme_data_flow, src_components_blocks_documentationlist_readme_documentation_types, src_components_blocks_documentationlist_readme_graphql_api, src_components_blocks_documentationlist_readme_doc_tree, src_components_blocks_documentationlist_readme_center_panel, src_components_blocks_documentationlist_readme_anchor_navigation [EXTRACTED 1.00]
- **Поток данных шахматки v2: запросы → трансформы → фильтры → виртуальный список** — shahmatka_architecture_useplacementdata, shahmatka_architecture_placementtransforms, shahmatka_architecture_placementfilters, shahmatka_architecture_virtualization, shahmatka_architecture_newplacementv2 [EXTRACTED 1.00]
- **Шесть веток handleDragEnd (A, B, C1-C4)** — shahmatka_architecture_drag_branch_a, shahmatka_architecture_drag_branch_b, shahmatka_architecture_drag_branch_c1, shahmatka_architecture_drag_branch_c2, shahmatka_architecture_drag_branch_c3, shahmatka_architecture_drag_branch_c4 [EXTRACTED 1.00]
- **FAP authorization model (auth guard, scoping, client gates)** — docs_fap_withfapauthguard, docs_fap_fap_scope, docs_fap_resolvescope, docs_fap_handover_fap_scope_enforce, docs_fap2_fapeditaccess, docs_fap_decisions_row_level_auth [EXTRACTED 1.00]
- **Passenger identity system (personId canon, registry, hydration, manifest)** — docs_fap_savedpassengers, docs_fap_hydratepassengerrequest, docs_fap_decisions_personid_canon, docs_fap2_fapregistry, docs_fap2_manifest_import [EXTRACTED 1.00]
- **Hotel accommodation report money flow (front engine → reportRows → export/analytics)** — docs_fap2_faphotelpage, docs_fap2_geteffectiverow, docs_fap_hotelreport, docs_fap_ghost_rows, docs_fap2_buildreportsheets, docs_fap2_passenger_analytics [EXTRACTED 1.00]
- **Сохранение настроек отдела: панель → payload → мутация** — src_components_blocks_settingssidebar_readme_settings_sidebar_doc, src_components_blocks_settingssidebar_settingssidebar_settingssidebar, src_components_blocks_settingssidebar_accesspermissionspanel_accesspermissionspanel, src_utils_accesspayload_buildaccesspayload, graphql_requests_update_airline, graphql_requests_update_dispatcher_department [INFERRED 0.95]
- **Путь заявки: список → карточка → выбор гостиницы → размещение** — ekskurs_eskadrilya_i_zayavki_eskadrilya, src_components_blocks_infotabledata_infotabledata_infotabledata, src_components_blocks_existrequest_existrequest_existrequest, src_components_blocks_choosehotel_choosehotel_choosehotel, ekskurs_eskadrilya_i_zayavki_hotel_placement_flow [EXTRACTED 1.00]
- **Учётка гостиницы должна показывать данные стороны гостиницы (договор Карс Авиа↔гостиница), а не диспетчерские данные для авиакомпании** — graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_kontakty_gostinicy_v_o_gostinice, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_ceny_gostinicy_v_nomerah, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_tarify_gostinicy_vmesto_aviakompanii, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_fap_prozhivanie_tarif_dogovora, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_ubrat_reyting_iz_nastroek, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_ubrat_skidku_iz_nastroek, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_ubrat_vidimost_gostinicy, src_components_rolecontent_hoteladmincontent_hoteladminhotelcontent_hoteladminhotelcontent [INFERRED 0.85]
- **Гостиница видит в ФАП только свой скоуп: свои заявки, без чужого трансфера и цен сторонних подрядчиков** — graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_fap_zayavki_tolko_svoej_gostinicy, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_transfer_usluga_skryt_bez_transfera, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_transfer_tarify_tolko_svoi [INFERRED 0.85]
- **Поверхность двойного бронирования в шахматке v2** — docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_double_booking_window, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_drop_into_inactive_room, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_getoverlapping_deref, docs_superpowers_2026_08_17_placement_v2_frontend_study_inv_overlap_functions_not_interchangeable, docs_superpowers_2026_08_17_placement_v2_frontend_study_dup_overlap_predicate [INFERRED 0.85]
- **Resize-тракт: где ломаются даты** — docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_resize_day_shift, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_resize_fires_without_movement, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_resize_no_date_order_check, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_blocked_resize_opens_modal, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_resize_listeners_survive_unmount, docs_superpowers_2026_08_17_placement_v2_frontend_study_dup_date_string_parsing [EXTRACTED 1.00]
- **Мёртвые ветки C1/C2 как единственный носитель проверки active** — shahmatka_architecture_drag_branch_c1, shahmatka_architecture_drag_branch_c2, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_drop_into_inactive_room, docs_superpowers_2026_08_17_placement_v2_frontend_study_inv_dead_branches_hold_active_check, docs_superpowers_2026_08_17_placement_v2_frontend_study_seam_use_placement_dnd [EXTRACTED 1.00]
- **Выкат полей доставки багажа: схема, мутация, легаси-ловушка, порядок деплоя** — docs_superpowers_specs_2026_07_27_fap_baggage_delivery_fields_design_baggage_delivery_card_fields, docs_superpowers_specs_2026_07_27_fap_baggage_delivery_fields_design_baggage_tags_field, docs_superpowers_specs_2026_07_27_fap_baggage_delivery_fields_design_update_baggage_driver_mutation, docs_superpowers_specs_2026_07_27_fap_baggage_delivery_fields_design_composite_null_scalar_list_trap, docs_superpowers_specs_2026_07_27_fap_baggage_delivery_fields_design_deploy_order_backend_first [EXTRACTED 1.00]
- **Метки групп во вкладке «Отчёт»: чип, иконки, шапка номера, точка гостя** — docs_superpowers_specs_2026_07_22_fap_group_legibility_design_group_chip_hybrid_encoding, docs_superpowers_plans_2026_07_22_fap_group_legibility_group_kind_icons, docs_superpowers_specs_2026_07_22_fap_group_legibility_design_report_room_group_summary, docs_superpowers_specs_2026_07_22_fap_group_legibility_design_report_guest_group_dot, src_components_blocks_fapv2_faphotelpage_faphotelpage_faphotelpage [EXTRACTED 1.00]
- **Вариант B шапки на всех экранах ФАП (заявка + четыре услуги)** — docs_superpowers_specs_2026_07_21_fap_report_view_mode_and_toolbar_toolbar_variant_b_overflow, src_components_blocks_fapv2_fapdetail_fapdetail_fapdetail, src_components_blocks_fapv2_faplivingpage_faplivingpage_faplivingpage, src_components_blocks_fapv2_faptransferpage_faptransferpage_faptransferpage, src_components_blocks_fapv2_fapwatermealpage_fapwatermealpage_fapwatermealpage, src_components_blocks_fapv2_fapbaggagepage_fapbaggagepage_fapbaggagepage [EXTRACTED 1.00]
- **PER_ROOM billing: tariff flag → carrier calc → ghost-row persist → unchanged XLSX** — docs_superpowers_specs_2026_07_21_fap_hotel_tariff_billing_mode_design_billing_mode, docs_superpowers_specs_2026_07_21_fap_hotel_tariff_billing_mode_design_carrier_guest, docs_superpowers_specs_2026_07_21_fap_hotel_tariff_billing_mode_design_ghost_row_persist, docs_superpowers_specs_2026_07_21_fap_hotel_tariff_billing_mode_design_per_room_included_display, docs_superpowers_specs_2026_07_21_fap_hotel_tariff_billing_mode_design_xlsx_unchanged [EXTRACTED 1.00]
- **ДС lifecycle surface: end date, archive/restore, Архив ДС tab, list popover, shared expiry badge** — docs_superpowers_specs_2026_07_07_contract_registry_frontend_edits_design_additional_agreement_end_date_and_archiving, docs_superpowers_specs_2026_07_07_contract_registry_frontend_edits_design_ds_archive_tab, docs_superpowers_specs_2026_07_07_contract_registry_frontend_edits_design_additional_agreements_popover_badge, docs_superpowers_specs_2026_07_07_contract_registry_frontend_edits_design_unified_expiration_badge [EXTRACTED 1.00]
- **Passenger filters restyle: sections + reset, decade highlight, applied-filters badge, aa CSS untouched** — docs_superpowers_specs_2026_07_24_fap_analytics_filters_visual_design_sectioned_modal, docs_superpowers_specs_2026_07_24_fap_analytics_filters_visual_design_decade_preset_highlight, docs_superpowers_specs_2026_07_24_fap_analytics_filters_visual_design_active_filters_badge, docs_superpowers_specs_2026_07_24_fap_analytics_filters_visual_design_shared_aa_css_untouched [EXTRACTED 1.00]
- **Единый гейт видимости отчёта по проживанию: поле → правило → экран → пять выгрузок** — docs_superpowers_specs_2026_07_31_fap_report_submit_for_review_design_submitted_at_field, docs_superpowers_specs_2026_07_31_fap_report_submit_for_review_design_fap_report_access_rule, docs_superpowers_specs_2026_07_31_fap_report_submit_for_review_design_xlsx_hotel_indexes_whitelist, src_components_blocks_fapv2_fapreportaccess, src_components_blocks_fapv2_faphotelpage_faphotelpage [EXTRACTED 1.00]
- **Программа развития аналитики «Пассажиры»: D1 сводки → D2 графики → D3 отменён → E визуальный полиш** — docs_superpowers_specs_2026_07_23_fap_analytics_summaries_design_dimension_summaries, docs_superpowers_specs_2026_07_23_fap_analytics_summaries_design_build_summary_engine, docs_superpowers_specs_2026_07_24_fap_analytics_visual_polish_design_d3_per_passenger_cancelled, docs_superpowers_specs_2026_07_24_fap_analytics_visual_polish_design_two_story_request_columns, docs_superpowers_specs_2026_07_24_fap_analytics_visual_polish_design_request_detail_panel [EXTRACTED 1.00]
- **Паттерн клиентского гейтинга по роли с fail-closed отправкой полей** — docs_superpowers_specs_2026_07_31_fap_report_submit_for_review_design_fap_report_access_rule, docs_superpowers_specs_2026_07_31_fap_report_submit_for_review_design_client_side_gate_only, docs_superpowers_specs_2026_07_15_hotel_active_show_filter_design_role_based_gating, docs_superpowers_specs_2026_07_15_hotel_active_show_filter_design_exact_match_fail_closed [INFERRED 0.75]
- **Generation-counter race defense shared by both address hooks** — docs_superpowers_specs_2026_07_14_addressfield_data_integrity_design_useaddresssuggestions_hook, docs_superpowers_specs_2026_07_14_addressfield_data_integrity_design_usereversegeocode_hook, docs_superpowers_specs_2026_07_14_addressfield_data_integrity_design_anchor_via_ref_not_deps, src_hooks_useaddresssuggestions, src_hooks_usereversegeocode [EXTRACTED 1.00]
- **Real room fund flow: query selection → pure helpers → placement kind → input field** — graphql_requests_get_fap_hotel_tariffs, docs_superpowers_specs_2026_07_28_fap_real_hotel_rooms_design_faprooms_pure_helpers, docs_superpowers_specs_2026_07_28_fap_real_hotel_rooms_design_roomkindbyindex_single_point, docs_superpowers_specs_2026_07_28_fap_real_hotel_rooms_design_roomnumberfield_freesolo, src_components_blocks_fapv2_faphotelpage_faphotelpage [EXTRACTED 1.00]
- **Manifest parse pipeline: file → table → profile detection → people extraction → upload field** — docs_superpowers_specs_2026_07_07_fap_manifest_format_profiles_design_format_profiles, src_utils_parsemanifestxlsx, src_utils_manifestcore, src_utils_manifestprofiles, src_components_blocks_fapv2_manifestuploadfield_manifestuploadfield [EXTRACTED 1.00]
- **Конвейер отчёта ФАП: тариф с ценой за сутки → производная стоимость → персист строк → Excel** — docs_superpowers_specs_2026_07_20_fap_report_tariff_redesign_design_tariff_placement_prices, docs_superpowers_specs_2026_07_20_fap_report_tariff_redesign_design_derived_accommodation_cost, docs_superpowers_specs_2026_07_20_fap_report_tariff_redesign_design_ghost_rows_persistence, docs_superpowers_specs_2026_07_20_fap_report_tariff_redesign_design_report_row_new_fields, docs_superpowers_specs_2026_07_20_fap_report_tariff_redesign_design_excel_22_columns [EXTRACTED 1.00]
- **Морфология фамилий ФАП: canonicalSurname питает и подсказки групп, и авто-подпись семьи** — docs_superpowers_specs_2026_07_28_fap_family_surname_gender_matching_design_canonical_surname, docs_superpowers_specs_2026_07_28_fap_family_surname_gender_matching_design_family_label, docs_superpowers_specs_2026_07_28_fap_family_surname_gender_matching_design_same_stem_rewrite, docs_superpowers_specs_2026_07_28_fap_family_surname_gender_matching_design_seat_gating_kept [EXTRACTED 1.00]
- **Консолидация резолюции доступа: баг дублирования → хук → 6 роут-компонентов** — docs_superpowers_specs_2026_07_08_access_effective_menu_shared_hook_design_duplicated_resolution_bug, docs_superpowers_specs_2026_07_08_access_effective_menu_shared_hook_design_hook_merge_rule, src_hooks_useeffectiveaccessmenu_useeffectiveaccessmenu, src_components_pages_main_page_main_page_main_page, src_components_pages_fapv2_faplayout_faplayout [EXTRACTED 1.00]
- **Сквозной поток распознавания документа по фото (PWA → бэк → Yandex Cloud → результат-экран)** — docs_superpowers_specs_2026_07_08_representative_photo_document_recognition_design_photo_document_recognition, docs_superpowers_specs_2026_07_08_representative_photo_document_recognition_design_scan_tabs_and_photo_scanner, docs_superpowers_specs_2026_07_08_representative_photo_document_recognition_design_recognize_passenger_document_mutation, docs_superpowers_specs_2026_07_08_representative_photo_document_recognition_design_normalize_and_confidence, docs_superpowers_specs_2026_07_08_representative_photo_document_recognition_design_unified_boarding_contract, docs_superpowers_specs_2026_07_08_representative_photo_document_recognition_design_graceful_degradation_contract [EXTRACTED 1.00]
- **Аналитика «Пассажиры»: общие агрегаты → графики (D2) → единый поток и книга-отчёт (F)** — src_components_pages_analyticsforavia_tabs_passengeranalytics_passengeranalyticsaggregations_buildsummary, docs_superpowers_specs_2026_07_23_fap_analytics_charts_design_build_chart_data, docs_superpowers_specs_2026_07_23_fap_analytics_charts_design_summary_charts_block, docs_superpowers_specs_2026_07_24_fap_analytics_unified_flow_design_unified_scroll_flow, docs_superpowers_specs_2026_07_24_fap_analytics_unified_flow_design_full_workbook_export [EXTRACTED 1.00]
- **Заливка backfill-патчноутов: data-файл → идемпотентная заливка (UI/CLI) → createPatchNote** — docs_superpowers_specs_2026_07_01_patch_notes_backfill_design_patch_notes_backfill, docs_superpowers_specs_2026_07_01_patch_notes_backfill_design_semver_renumbering, docs_superpowers_specs_2026_07_01_patch_notes_backfill_design_dual_seeding_paths, scripts_patchnotes_data, scripts_seedpatchnotes, src_components_blocks_patchnoteslist_patchnoteslist [EXTRACTED 1.00]
- **Факт трансфера max(список, число) продублирован тремя зеркалами: бэк, CRM, PWA** — docs_superpowers_specs_2026_07_29_fap_transfer_hotel_link_and_count_design_driver_fact_count_max, docs_superpowers_specs_2026_07_29_fap_transfer_hotel_link_and_count_design_transported_count, docs_superpowers_specs_2026_07_29_pwa_transported_count_design_pwa_transfer_fact_mirror, src_components_blocks_fapv2_faptransferfact [EXTRACTED 1.00]
- **Слияние панелей доступов: один компонент, конфиг секций, инъекция стилей, разные каскады** — docs_superpowers_specs_2026_07_30_access_permissions_panel_merge_design_unified_access_permissions_panel, docs_superpowers_plans_2026_07_30_access_permissions_panel_merge_access_sections_config, docs_superpowers_specs_2026_07_30_access_permissions_panel_merge_design_style_injection_decision, docs_superpowers_plans_2026_07_30_access_permissions_panel_merge_detailed_mode_no_cascade [EXTRACTED 1.00]
- **Цепочка стоимости питания ФАП: цены за порцию, количества, ланчбокс, персист, Excel** — docs_superpowers_specs_2026_07_22_fap_lunchbox_meal_counts_design_lunchbox_price, docs_superpowers_specs_2026_07_22_fap_lunchbox_meal_counts_design_meal_counts, docs_superpowers_specs_2026_07_22_fap_lunchbox_meal_counts_design_compute_pd_food, docs_superpowers_specs_2026_07_22_fap_lunchbox_meal_counts_design_report_row_persist_fields, docs_superpowers_specs_2026_07_22_fap_lunchbox_meal_counts_design_excel_lunchbox_column [EXTRACTED 1.00]
- **Цепочка расчёта стоимости проживания ФАП: сутки × цена по категории → сохранённые суммы** — docs_superpowers_specs_2026_07_29_fap_cost_days_by_duration_design_cost_days_rule, docs_superpowers_specs_2026_07_30_fap_airline_price_tariffs_design_airline_contract_tariff, docs_superpowers_specs_2026_07_21_fap_analytics_summary_design_thin_cost_source, src_components_blocks_fapv2_faphotelpage_faphotelpage_resolvetariffpriceperday [INFERRED 0.75]
- **Стек аналитики ФАП: бэк-агрегатор → gql-документ → вкладка → XLSX** — docs_superpowers_specs_2026_07_21_fap_analytics_summary_design_passenger_analytics_resolver, graphql_requests_get_passenger_analytics, src_components_pages_analyticsforavia_tabs_passengeranalytics_passengeranalytics, src_components_pages_analyticsforavia_tabs_passengeranalytics_passengeranalyticsexport, docs_superpowers_plans_2026_07_23_fap_analytics_relations_handoff_relations_metrics [EXTRACTED 1.00]
- **Повторяющаяся деплой-сцепка ФАП: бэк деплоится строго раньше фронта** — docs_superpowers_specs_2026_07_21_fap_analytics_summary_design_deploy_backend_first, docs_superpowers_specs_2026_07_22_fap_report_quality_pack_design_deploy_coupling, docs_superpowers_plans_2026_07_23_fap_analytics_relations_handoff_additive_backend_constraint [INFERRED 0.85]
- **Конвейер импорта манифеста: парсер → UI-блок → bulk-мутация → дедуп каталога** — docs_superpowers_specs_2026_07_06_fap_manifest_import_design_parse_manifest_xlsx, docs_superpowers_specs_2026_07_06_fap_manifest_import_design_manifest_upload_field, docs_superpowers_specs_2026_07_06_fap_manifest_import_design_add_passenger_request_saved_people, docs_superpowers_specs_2026_07_06_fap_manifest_import_design_merge_manifest_people_into_roster, docs_superpowers_specs_2026_07_06_fap_manifest_import_design_manifest_name_key_mirror [EXTRACTED 1.00]
- **Расширение движка профилей манифеста под PLI (ядро + данные профиля + хуки)** — docs_superpowers_specs_2026_07_31_fap_manifest_pli_profile_design_pli_profile, docs_superpowers_specs_2026_07_31_fap_manifest_pli_profile_design_lap_infants, docs_superpowers_specs_2026_07_31_fap_manifest_pli_profile_design_multiline_cell_hooks, src_utils_manifestcore, src_utils_manifestprofiles [EXTRACTED 1.00]
- **Поток «Применяется к»: значение → конфликты локаций → снятие выборов → подписки → подбор цены** — docs_superpowers_specs_2026_07_30_airline_price_contract_type_and_airport_address_design_price_applies_to, docs_superpowers_specs_2026_07_30_airline_price_contract_type_and_airport_address_design_conflicting_contract_types, docs_superpowers_specs_2026_07_30_airline_price_contract_type_and_airport_address_design_prune_used_selections, docs_superpowers_specs_2026_07_30_airline_price_contract_type_and_airport_address_design_subscription_cache_trap, docs_superpowers_specs_2026_07_30_airline_price_contract_type_and_airport_address_design_exist_request_price_pick_fix [EXTRACTED 1.00]
- **Новый конвейер выбора адреса: саджест → uri-геокодинг → выбранное место как истина, с геолокацией для пустого поля** — docs_superpowers_specs_2026_07_14_addressfield_places_search_design_geosuggest_places_source, docs_superpowers_specs_2026_07_14_addressfield_places_search_design_geocode_by_uri, docs_superpowers_specs_2026_07_14_addressfield_places_search_design_picked_address_wins, docs_superpowers_specs_2026_07_14_addressfield_places_search_design_geolocation_singleton, docs_superpowers_specs_2026_07_14_addressfield_places_search_design_dead_expanding_radius_removal [EXTRACTED 1.00]
- **Сквозной путь lunchboxCount: поле бэка → модель и стоимость фронта → UI строки отчёта → Excel → аналитика** — docs_superpowers_specs_2026_07_28_fap_independent_lunchbox_design_lunchbox_count_field, docs_superpowers_specs_2026_07_28_fap_independent_lunchbox_design_lunchbox_count_of_legacy_migration, docs_superpowers_specs_2026_07_28_fap_independent_lunchbox_design_meal_count_inputs_centering, docs_superpowers_specs_2026_07_28_fap_independent_lunchbox_design_excel_lunchbox_column_reindex, docs_superpowers_specs_2026_07_28_fap_independent_lunchbox_design_analytics_count_meals_lunchbox [EXTRACTED 1.00]
- **Этап C аналитики по пассажирам: фильтры, тонкий док АК, бэк-строка регистра, персист вкладок и drill-down** — docs_superpowers_specs_2026_07_23_fap_analytics_filters_ux_design_analytics_filters_stage_c, docs_superpowers_specs_2026_07_23_fap_analytics_filters_ux_design_get_airlines_light_query, docs_superpowers_specs_2026_07_23_fap_analytics_filters_ux_design_case_insensitive_flight_number, docs_superpowers_specs_2026_07_23_fap_analytics_filters_ux_design_analytics_tab_state_persistence, docs_superpowers_specs_2026_07_23_fap_analytics_filters_ux_design_flight_number_drilldown_link [EXTRACTED 1.00]
- **Массовые операции ФАП: одно действие диспетчера = один запрос, одна запись в истории, одно уведомление** — docs_superpowers_specs_2026_07_31_fap_bulk_evict_relocate_and_pwa_batching_design_bulk_evict_relocate_mutations, docs_superpowers_specs_2026_07_31_fap_bulk_evict_relocate_and_pwa_batching_design_bulk_remove_people, docs_superpowers_plans_2026_07_31_fap_bulk_evict_relocate_and_pwa_batching_bulk_index_arithmetic, docs_superpowers_specs_2026_07_31_fap_bulk_evict_relocate_and_pwa_batching_design_single_read_modify_write_rule, docs_superpowers_specs_2026_07_31_fap_bulk_evict_relocate_and_pwa_batching_design_pwa_catalog_batching [EXTRACTED 1.00]
- **Единая шапка действий подключается во всех услугах и внутренних страницах ФАП** — docs_superpowers_plans_2026_07_27_fap_baggage_trip_page_unified_service_header_actions, src_components_blocks_fapv2_faplivingpage_faplivingpage, src_components_blocks_fapv2_faptransferpage_faptransferpage, src_components_blocks_fapv2_fapwatermealpage_fapwatermealpage, src_components_blocks_fapv2_fapbaggagepage_fapbaggagepage, src_components_blocks_fapv2_fapdriverpage_fapdriverpage, src_components_blocks_fapv2_fapbaggagetrippage_fapbaggagetrippage [EXTRACTED 1.00]
- **Панели настроек отдела: один конфиг секций + один конвертер payload + одна панель** — docs_superpowers_specs_2026_07_30_notifications_panel_merge_design_notification_sections_config, docs_superpowers_specs_2026_07_30_notifications_panel_merge_design_shared_notification_payload, docs_superpowers_specs_2026_07_30_notifications_panel_merge_design_styles_injection_prop, src_components_blocks_settingssidebar_notificationspermissionspanel, src_components_blocks_settingssidebar_settingssidebar [EXTRACTED 1.00]
- **Расширение строки отчёта проживания двумя полями (Json + GraphQL + порядок выката)** — docs_superpowers_specs_2026_07_30_fap_placement_kind_and_discount_design_report_rows_json_additive, docs_superpowers_specs_2026_07_30_fap_placement_kind_and_discount_design_placement_kind_override, docs_superpowers_specs_2026_07_30_fap_placement_kind_and_discount_design_accommodation_discount_column, docs_superpowers_plans_2026_07_30_fap_placement_kind_and_discount_backend_first_deploy [EXTRACTED 1.00]
- **Контур ворнингов расселения: группы + требование + единый roomKey + вычислитель** — docs_superpowers_specs_2026_07_22_fap_passenger_groups_design_passenger_groups, docs_superpowers_specs_2026_07_22_fap_passenger_groups_design_placement_requirement, docs_superpowers_specs_2026_07_22_fap_passenger_groups_design_room_key_single_source, docs_superpowers_specs_2026_07_22_fap_passenger_groups_design_group_warnings, docs_superpowers_specs_2026_07_22_fap_passenger_groups_design_group_chip [EXTRACTED 1.00]
- **Канонический пассажир ФАП: ростер + гидрация + категория + экран реестра** — docs_superpowers_specs_2026_07_06_fap_unified_passengers_design_canonical_roster, docs_superpowers_specs_2026_07_06_fap_unified_passengers_design_hydration_overlay, docs_superpowers_plans_2026_07_06_fap_stage1_personcategory_roster_person_category_in_roster, docs_superpowers_specs_2026_07_06_fap_unified_passengers_design_backfill_migration, docs_superpowers_specs_2026_07_20_fap_registry_access_design_registry_section [INFERRED 0.95]

## Communities (206 total, 41 thin omitted)

### Community 9 - "ФАП: багаж и вода/питание — FapBaggagePage, FapBaggageTripPage, FapWaterMealPage, FapHeaderActions"
Cohesion: 0.05
Nodes (47): ФАП: карточка доставки багажа по составу реальных документов, Поле baggageTags (номера багажных бирок), Ловушка: скалярный список в composite-типе Prisma приходит null, Дата доставки как единственный признак завершённости, Строгий порядок выката: бэк → фронт, Итерация 2: поездка с несколькими пассажирами, Побочный эффект: метрика transferBaggage перестаёт быть нулевой, BaggageTagsInput — ввод бирок чипами (+39 more)

### Community 0 - "GraphQL: ядро запросов и формы заявок"
Cohesion: 0.02
Nodes (133): Своя багажная мутация updatePassengerRequestBaggageDriver, Размещение заявки в гостинице (выбор города и отеля, ветка access), GET_MESSAGES_TRANSFER, GET_TRANSFER_REQUESTS, CREATE_TRANSFER_REQUEST_MUTATION, UPDATE_DRIVER_WITH_PHOTO_MUTATION, CREATE_ORGANIZATION, GET_ORGANIZATION_CONTRACT (+125 more)

### Community 8 - "ФАП: FapDetail, fapConstants и файлы манифеста"
Cohesion: 0.05
Nodes (54): Общий справочник VEHICLE_TYPES в fapConstants, Шапка Вариант B: одна primary-кнопка + overflow «⋯», Отклонение от макета: у авиакомпании остаются «История» и chip «Реестр», Факт поездки = max(поимённый список, transportedCount), Числовая правка вверх не реоткрывает COMPLETED-услугу, Третье зеркало факт-хелпера: src/utils/transferFact.js в PWA, Единая шапка действий услуг ФАП, Правила видимости пунктов «Отчёт» и «История» (+46 more)

### Community 2 - "ФАП: реестр и группы пассажиров"
Cohesion: 0.04
Nodes (77): GroupChip: гибридная кодировка связи (цвет + иконка + слово), Пять SVG-иконок типов связи в shared/icons, Handoff prompt: FAP passenger groups (2026-07-22), Passenger groups execution invariants (hard constraints), Блок загрузки манифеста ManifestUploadField, Спека: группы пассажиров + требование вида размещения, Группы пассажиров (PassengerRequestGroup): 5 типов + уровень «вместе», placementRequirement — требование вида размещения на человеке (+69 more)

### Community 6 - "ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms"
Cohesion: 0.04
Nodes (72): Отчёт: чипы групп в шапке номера (вариант Y), Отчёт: точка группы в строке гостя, Гейт видимости ворнингов групп: метки всем, ⚠ только canEdit, Инварианты рендера групп в FapHotelPage, Отчёт по гостинице: режимы Просмотр / Редактирование, FapReportView — read-only детализация отчёта, FapModeToggle — сегмент Просмотр/Редактирование, Spec: FAP hotel tariff billing mode «Койко-место»/«Номер» (2026-07-21) (+64 more)

### Community 5 - "Цены авиакомпании: тарифы и география (airlineTariffPrices, airlineTariffGeography)"
Cohesion: 0.06
Nodes (73): Исключение занятых аэропортов между договорами авиакомпании, «Выбрать всё» уважает getOptionDisabled, Подсказка о пропущенных аэропортах, Занятые аэропорты выводятся на клиенте из пропа addTarif, Ловушка: Create-опции по id, Edit-опции по value, Спека: цены авиакомпании как источник тарифа в проживании ФАП, Договорный тариф АК как источник цены проживания ФАП, Сопоставление 13 категорий номера с полями ценника АК (+65 more)

### Community 90 - "Реестр договоров: таблица InfoTableAllDataTarifs, ДС-поповер и архив"
Cohesion: 0.19
Nodes (12): Spec: Contract registry frontend edits (2026-07-07), Contract registry frontend edits (6 changes, front-only), Rationale: registry edits need zero backend change, «ДС: N» badge + agreements popover in the registry list, Prolongation chip in the contract list row, Unified expiration badge helper (getExpirationBadge), Rename «Вид приложения» → «Предмет договора» (airline-only), Active filters badge on the «Фильтры» button (+4 more)

### Community 20 - "Реестр договоров: фронт-правки (ДС-бейдж, пролонгация, истечение)"
Cohesion: 0.12
Nodes (35): ДС end date + prolongation + archive/restore, «Архив ДС» tab (client-side active/archived split), Стилизация и переиспользование UI-примитивов, getMediaUrl(), normalize(), GET_DOCUMENTATION, GET_DOCUMENTATION_TREE, CREATE_AIRLINE_CONTRACT (+27 more)

### Community 30 - "Реестры договоров: Hotel/Airline/Organization RegisterOfContracts, DeleteComponent и фильтры"
Cohesion: 0.12
Nodes (30): Rationale: DeleteComponent in the list, useDialog confirm() in the forms, Спека: фильтр гостиниц по видимости (show) и активности (active) (2026-07-15), План: фильтр гостиниц active/show (6 задач), Фильтр списка гостиниц по show/active + бейджи состояния, Гейтинг по роли вместо User.dispatcher (вариант B), GET_ORGANIZATIONS, GET_ORGANIZATION_CONTRACTS, DELETE_ORGANIZATION_CONTRACT (+22 more)

### Community 63 - "ФАП: выгрузка проживания в XLSX — addHotelSheet, addCombinedSheet и hotelIndexes"
Cohesion: 0.18
Nodes (24): Rationale: XLSX export needs no change under PER_ROOM, Белый список hotelIndexes в пяти точках выгрузки XLSX, Excel-лист проживания: 22 колонки, дата рейса в шапке, единый экспортёр, Удаление легаси-контура отчёта: FapReport, маршрут report/:hotelIndex, SheetJS-экспорт, Excel-отчёт: колонка «Ланчбокс» (23 → 24) и SUMPRODUCT в итогах, Приоритет plannedFromAt над plannedAt в дате заезда Excel, placementKindLabel(), toNum() (+16 more)

### Community 112 - "ФАП-аналитика (спеки): фильтры по периоду, пресеты декад и фильтр по № рейса"
Cohesion: 0.17
Nodes (12): Spec: «Пассажиры» filters modal restyle, stage G (2026-07-24), Sectioned passenger filters modal (Период / Статусы / Параметры), Decade preset highlight via sameRange day comparison, Rationale: AirlineAnalytics.module.css must not be touched, Период по flightDate и счётчик noFlightDateCount, Пресеты декад в фильтре периода аналитики ФАП, Фильтр по периоду в списке заявок ФАП (/far), Аналитика по пассажирам, этап C: фильтры (статусы, мульти-аэропорт, АК-пикер) и период-UX (+4 more)

### Community 102 - "ФАП (спеки): единый реестр пассажиров и отправка отчёта на проверку"
Cohesion: 0.14
Nodes (15): Спека: отчёт ФАП открывается АК только после «Отправить на проверку» (2026-07-31), План реализации: «Отправить на проверку» (7 задач, бэк→фронт), Отправка отчёта по проживанию на проверку (гейт видимости для АК), Поле submittedAt на PassengerRequestHotelReport + мутация submitPassengerRequestHotelReport, Сброс флага отправки только при реально изменившихся строках, Кнопка «Скрыть» и мутация hidePassengerRequestHotelReport (дополнение того же дня), Ловушки реализации гейта отчёта, Три новых поля строки отчёта: tariffName, pricePerDay, placementKind (+7 more)

### Community 16 - "ФАП: доступ к отчёту и стадии — fapReportAccess, fapReportStages, FapLivingPage"
Cohesion: 0.08
Nodes (45): fapReportAccess — единственное правило видимости отчёта, v12.14 — отчёт по гостинице открывается АК после «Отправить на проверку» (submittedAt), v12.15 — согласование цен отчёта по проживанию ФАП (fapReportAccess.js, hideMoney для АК до approve), UPDATE_PASSENGER_REQUEST_HOTEL, initials(), FapLivingPage(), HotelCard(), FapReportStageChip() (+37 more)

### Community 41 - "ФАП: импорт манифеста — parseManifestXlsx, ManifestUploadField, manifestCore"
Cohesion: 0.12
Nodes (28): Гейт только клиентский — серверной фильтрации reportRows не будет, Спека: проверка соответствия рейса манифеста рейсу заявки (2026-07-22), План: проверка рейса манифеста (5 задач), Проверка расхождения рейса манифеста и рейса заявки, isSameFlight/normalizeFlightNumber — нечёткое сравнение номеров рейсов, Предупреждение + подтверждение вместо жёсткого блока, Spec: FAP multi-format manifest parsing via profiles (2026-07-07), Manifest format profiles (data-described formats + header auto-detection) (+20 more)

### Community 129 - "Звёздность гостиниц: starRating, StarRatingFilter, parseStarValue"
Cohesion: 0.42
Nodes (6): SegmentedToggle — generic переключатель взаимоисключающих значений, Точное совпадение фильтра на бэке + fail-closed отправка полей, StarRow(), StarRatingFilter(), parseStarValue(), starFractions()

### Community 45 - "ФАП-аналитика: PassengerAnalytics и мапперы"
Cohesion: 0.14
Nodes (26): HotelStatusBadge — пилюля «Неактивна»/«Скрыта», Спека: визуальный полиш «Пассажиры → По заявкам» (этап E, 2026-07-24), План: визуальный полиш аналитики по заявкам (5 задач), Список «По заявкам»: 14 колонок → 6 двухэтажных, PassengerRequestDetailPanel — плитки услуг + чипы в палитре ФАП, Зебра по индексу map, а не через nth-child, D3 (per-passenger аналитика) отменён владельцем, formatNights/formatMoneyShort переезжают в passengerAnalyticsMappers (+18 more)

### Community 106 - "Passenger Analytics Summary Charts"
Cohesion: 0.14
Nodes (14): Спека: сводки по измерениям в аналитике по пассажирам (этап D1, 2026-07-23), План: сводки по измерениям (D1, 3 задачи), Режим «Сводки» во вкладке «Пассажиры» (по аэропортам/АК/месяцам), Агрегация на фронте — бэк не трогаем, Спека: единый поток аналитики «Пассажиры» (этап F), Единый скролл вкладки «Пассажиры» вместо тумблера режимов, Инварианты этапа F: фронт-only, ровно 3 файла, Спека: графики в аналитике по пассажирам (этап D2) (+6 more)

### Community 92 - "Passenger Analytics Aggregation"
Cohesion: 0.21
Nodes (16): buildSummary — движок агрегации сводок (passengerAnalyticsAggregations), Месяц считается сдвигом +3ч (МСК), а не по локали браузера, Семантика counted/all в сводках = семантика KPI-тоталов, buildChartData: топ-8 + «Прочие», исключение бакета без даты, МСК-границы периода аналитики (resolvePeriodBounds), Инвариант: гибрид периода и Mongo-грабля не трогаются, Программа доработки аналитики: этапы A→D, round2() (+8 more)

### Community 109 - "ФАП-аналитика: экспорт Excel (passengerAnalyticsExport)"
Cohesion: 0.31
Nodes (12): Выгрузка текущей сводки одним листом XLSX, Экспорт полного отчёта одной книгой (5 листов), Номер заявки в таблице и в листах Excel (сдвиг колонок), REQUEST_STATUS_CONFIG, statusLabel(), SUMMARY_SHEETS, fillSummarySheet(), fillRequestsSheet() (+4 more)

### Community 26 - "AddressField и геосаджест"
Cohesion: 0.08
Nodes (39): Spec: AddressField / YandexMapModal address data integrity (2026-07-14), AddressField query/anchor state model with lastEmittedRef echo detection, useAddressSuggestions hook (debounce + generation counter + accept), useReverseGeocode hook (generation counter + pending-coords buffer, ymaps in state), Geocoder contract change: {address, approximate} instead of '≈' baked into the string, Trap: anchor must be read via ref and kept out of the search effect deps, Decision: delete the Search/Map toggle and browser geolocation entirely, Deferred: YMaps provider, focus-trap/Escape, ARIA and dead CSS defects (+31 more)

### Community 71 - "ФАП: реальные номера гостиницы — fapRooms, RoomNumberField (спека real-hotel-rooms)"
Cohesion: 0.19
Nodes (19): Spec: FAP living — pick real hotel rooms from the room fund (2026-07-28), Real room selection in FAP living (3 entry points, free-text fallback), fapRooms.js pure helpers (capacity, index, match, occupancy, labels), Placement kind from room capacity — single edit in roomKindByIndex, RoomNumberField — freeSolo MUI Autocomplete over the real room fund, Decision: occupancy is a hint, capacity is never enforced, tariff never auto-bound, Front-only data path: extend GET_FAP_HOTEL_TARIFFS with hotel.rooms, Money-relevant crux: room category overrides headcount for placement kind (+11 more)

### Community 43 - "ФАП: профили манифеста (manifestProfiles, PLI, cleanFullName)"
Cohesion: 0.11
Nodes (29): PM and PNL profiles (two opposite age-category mechanics), Trap: remark tokens lie — INFT sits on the accompanying adults, Decision: PNL row anchor is a valid category code, not the registration number, Захват номера рейса с пробелом в PNL-манифесте, Зеркало бэкового normalizeFullNameKey на фронте (manifestNameKey), Спека: третий формат манифеста ФАП — PLI (выгрузка DCS), Профиль манифеста PLI (третий формат после ПМ и PNL), Младенцы на руках: счётчик на сопровождающем (хук lapInfants) (+21 more)

### Community 48 - "ФАП: подбор групп — surnameForms, fapGroupSuggestions и общий корень фамилии"
Cohesion: 0.11
Nodes (25): Preserved parser contract: {people, flightNumber, error} + manifestNameKey re-export, Теневые строки и восстановление тарифов по tariffName, Спека: распознавание женской формы фамилии в подсказках групп ФАП (2026-07-28), canonicalSurname — общий бесполый корень фамилии (латиница и кириллица), familyLabel — русский плюрал семьи с обратным транслитом (best-effort), sameStem и defaultGroupLabel переписаны через canonical (снят гейт CYRILLIC_RE), Гейтинг подсказок (соседние места / ребёнок) намеренно не меняется, Тесты морфологии на встроенном node --test (TDD, без новых зависимостей) (+17 more)

### Community 89 - "groupsCount и linkedPeopleCount в аналитике по пассажирам"
Cohesion: 0.13
Nodes (17): Spec: passenger analytics money/people detail pack, stage B (2026-07-23), Analytics detail pack: 18 new per-request scalars + 8 new totals, PassengerAnalyticsHotelBreakdown (live headcount vs report snapshot), Transfer split invariant: round2(arrival+departure+baggage+intercity) == transfer, Invariant: ghost report rows excluded from every new reportRows sum, Legacy fallbacks: personCategory null → ADULT, meal count ?? (price>0 ? 1 : 0), Deploy gate: backend first, frontend second (widened selection breaks old backend), Спека: аналитика ФАП — сводная таблица по заявкам (v1) (+9 more)

### Community 1 - "Сессия и контексты: getCookie, useToast, useDialog, JWT"
Cohesion: 0.05
Nodes (109): Дата рейса (flightDate) сквозняком: формы, деталка, карточка списка, шапка Excel, Два идемпотентных способа заливки патч-ноутов, Двойной режим type="airline" / type="dispatcher", Выбор должностей для авиакомпаний, GraphQL-операции SettingsSidebar, Поток создания заявки (sidebar → мутация → подписка → refetch), Проверка на дубликаты заявок при создании, getCookie() (+101 more)

### Community 25 - "Представители и доступ: Representative*DetailPage, useEffectiveAccessMenu, Main_Page и DeleteIcon"
Cohesion: 0.10
Nodes (29): Спека: приоритет доступа должность>отдел везде — общий хук useEffectiveAccessMenu (2026-07-08), useEffectiveAccessMenu(user) — единый источник резолюции, мёрж { ...отдел, ...effective }, Массовые мутации выселения и переселения ФАП, Проверка вместимости на всю пачку при переселении, effectiveAccessMenu — переопределения по должности, считается на бэке, v12.13 — useEffectiveAccessMenu в роут-компонентах, отчёты открыты авиакомпаниям, v12.15 — canManageAirlineAccess и resolveEffectiveAccessMenu в utils/access.js, GET_USER_EFFECTIVE_ACCESS_MENU (+21 more)

### Community 7 - "ФАП: роуты страниц, App.jsx и роли доступа (canAccessMenu, isHotelScoped, FapChat)"
Cohesion: 0.08
Nodes (61): Баг: роут-компоненты считали доступ только из отдела, игнорируя должность, Страница поездки доставки багажа, v12.14 — изоляция данных ФАП по гостинице (isHotelScoped / scopedHotelId / canSeeExternalLinks), v12.14 — reopenPassengerRequestService, «Вернуть в работу», гейт reserveUpdateCompleted, v12.15 — видимость услуг для гостиницы: fapServiceVisibility.js + useHotelServiceVisibility, v12.15 — деньги отчёта скрыты от гостиницы (hideMoney, preserveMoneyFields), GET_PASSENGER_REQUEST_CHATS, PASSENGER_REQUEST_UPDATED_SUBSCRIPTION (+53 more)

### Community 72 - "ФАП (спеки): распознавание документа по фото, назначение номера и слияние панелей уведомлений"
Cohesion: 0.10
Nodes (21): Спека: распознавание документа с фото (RepresentativePWA), Распознавание документа по фото (путь без штрихкода), Выбор связки Vision OCR → YandexGPT (Конфиг A), Мутация recognizePassengerDocument + тип RecognizedPassengerDoc, Контракт деградации: распознавание никогда не роняет поток, Единый объект boarding для фото- и штрихкод-пути, ScanTabs + DocumentPhotoScanner и редактируемое ФИО, Нормализация полей и эвристика confidence (+13 more)

### Community 49 - "Аналитика: Dispatcher/Hotel/Support Analytics, AnalyticsChart и DateRangePickerCustom"
Cohesion: 0.14
Nodes (20): Аддитивное расширение AnalyticsChart: case stackedBar + pieValueFormat, GET_DISPATCHERS, GET_ALL_DISPATCHERS, GET_ANALYTICS_AIRLINE_REQUESTS, barDensityProps(), groupedSeriesDataIsEffectivelyEmpty(), simpleBarDataIsEffectivelyEmpty(), AnalyticsChart() (+12 more)

### Community 22 - "Системные уведомления и патч-ноуты"
Cohesion: 0.08
Nodes (39): Спека: backfill патч-ноутов 3.2.0 → 4.3.0, Backfill публичных патч-ноутов из README-чейнджлога, Переработка нумерации: patch-компонент вместо только minor, v12.15 — патч-ноут 4.4.0 и шаблон «Что нового» (patchNotes.data.mjs, systemUpdate.data.mjs), generateTimestampId(), UPDATE_SYSTEM_UPDATE, args, DRY_RUN (+31 more)

### Community 128 - "ФАП: трансфер — FapTransferPage и факт поездки"
Cohesion: 0.25
Nodes (9): Привязка поездки трансфера ФАП к гостинице (hotelItemId), Поле «перевезено N» на поездке (transportedCount), Ослабление guard патча водителя: COMPLETED разрешён, режется только CANCELLED, Фильтр «Гостиница» и предвыбор заселённых в CatalogPickerModal, Порядок выката: бэк → фронт (новые поля трансфера), Отклонения при исполнении плана трансфера (одобрены ревью), 7 аддитивных полей строки отчёта (counts, ЛБ-флаги, lunchboxPrice), PWA: ввод «перевезено N» — диалог у водителя и поле у представителя (+1 more)

### Community 35 - "ФАП: книга Excel — листы воды/питания, багажа и трансфера (buildReportSheets)"
Cohesion: 0.10
Nodes (36): Колонка «Перевезено» в Excel-листе трансфера (сдвиг «Суммы» I→J), v12.13 — ланчбокс и количества приёмов пищи, выгрузка до 24 колонок, v12.15 — xlsx ФАП: finishSheet, лист «Доставка багажа», первые тесты reports/, PERSON_CATEGORY_LABEL, prefixedSheetName(), chooseSheetName(), BASE_FONT, HEADER_FONT (+28 more)

### Community 64 - "SettingsSidebar: AccessPermissionsPanel, accessSections и слияние панелей доступа"
Cohesion: 0.16
Nodes (21): Единая AccessPermissionsPanel с пропами granularity/styles/sections/showBulkToggle, Конфиг секций прав accessSections.js (секции как данные), Стили инъекцией пропом styles вместо общего CSS, В режиме detailed нет каскада «доступ гасит действия», Отложено: слияние панелей уведомлений и расхождение organization/contracts, SettingsSidebar — компонент настроек через боковое меню, Состав папки SettingsSidebar, Контракт пропсов SettingsSidebar (+13 more)

### Community 147 - "ФАП-аналитика (спеки): метрики связей groupsCount, linkedPeopleCount и колонка «Группы»"
Cohesion: 0.40
Nodes (5): Метрики связей в аналитике ФАП: groupsCount и linkedPeopleCount, Столбец «Группы», KPI «Связано пассажиров» и колонка XLSX, Тотал linkedPeopleCount считается по ВСЕМ строкам, включая costMissing, Сдвиг firstMoneyCol при вставке не-денежной колонки (load-bearing), COLUMN_TYPE

### Community 130 - "ФАП: reportRowMatch — единый матчинг строк отчёта к гостям (personId)"
Cohesion: 0.39
Nodes (8): Порядок деплоя: бэк раньше фронта (passengerAnalytics), Спека: пакет качества отчёта ФАП (personId, период, мелкие фиксы), personId в строках отчёта и единый матчинг строк к гостям, Деплой-сцепка personId: бэк строго первым, pid(), nm(), findRowIndexForPerson(), findPersonIndexForRow()

### Community 127 - "Сутки проживания: effectiveCostDays и fapPersonDays"
Cohesion: 0.36
Nodes (6): Отдельная функция вместо флага-режима у существующей, calculateEffectiveCostDays(arrival, departure) — эффективные сутки с частичными, v11.11 (10.03.2026), v11.11 — появление эффективных суток (effectiveCostDays.js), v12.14 — calculateCostDaysByDuration: минимум сутки, +0,5 за каждый начатый 12-часовой блок, calculateEffectiveCostDays()

### Community 98 - "Excel-даты и парсер массового импорта (excelDate, parseBulkXlsx)"
Cohesion: 0.24
Nodes (13): Спека: импорт пассажирского манифеста (ПМ) в каталог заявки ФАП, Импорт пассажирского манифеста (форма ПМ) в каталог savedPassengers, Парсер формы ПМ на фронте (parseManifestXlsx), Отклонение от спеки: автоподстановка № рейса только при создании, Вне скоупа импорта манифеста ПМ, pad(), s(), excelSerialToParts() (+5 more)

### Community 46 - "Тарифы: Create/EditRequestTarifCategory, AirlineTarifs_tabComponent и MultiSelectAutocomplete"
Cohesion: 0.11
Nodes (22): Ловушка: contractType обязателен в обеих живых подписках цен, Распознавание ошибок бэкенда про аэропорт (extractGeoConflictMessage), REORDER_ROOM_KIND_IMAGES, UPDATE_HOTEL_TARIF, GET_AIRLINE_TARIFS, UPDATE_AIRLINE_TARIF, GET_ALL_TARIFFS, PRICE_CATEGORY_CHANGE_SUBSCRIPTION (+14 more)

### Community 91 - "Уведомления и бесконечный скролл (NotificationsSidebar, useInfiniteScroll)"
Cohesion: 0.15
Nodes (15): Спека: бесконечный скролл в списке заявок ФАП (/far), Бесконечный скролл списка заявок ФАП (страница 30), refreshWindow() — перезапрос всего загруженного окна одним запросом, Ловушка: сентинел внутри грида нужно обернуть в grid-column: 1 / -1, v12.9 (28.06.2026), v12.9 — единый FilterPopoverButton и useInfiniteScroll, v12.13 — список /far на бесконечном скролле, refreshWindow() в useInfiniteScroll, extractRootNodes() (+7 more)

### Community 21 - "ФАП: FapDriverPage, fapEditAccess, PersonBadge и массовое удаление получателей услуг"
Cohesion: 0.05
Nodes (37): recomputeServiceStatus(prev, prevCount, nextCount) — единый пересчёт статуса услуги ФАП, Правила переоткрытия статуса услуги при изменении числа людей, Living и baggage добавлены в пересчёт статуса при правке плана (осознанная смена поведения), Update-мутации персон намеренно не трогаются, Массовые мутации удаления: removePassengerRequestPeople и removePassengerRequestDriverPeople, normalizeBulkIndexes + spliceAtIndexes: валидация до изменений, пачка целиком или никак, Уведомление авиакомпании при массовом удалении НЕ шлётся, Факт трансфера считается через transferFactCount, а не по длине списка людей (+29 more)

### Community 134 - "ФАП (спеки): гидрация заявки из ростера и пакетное заселение в PWA"
Cohesion: 0.29
Nodes (7): Правило: пачка = один read-modify-write, Пакетное заселение из реестра в PWA (useCatalogAdd), Гидрация заявки ФАП из ростера savedPassengers, Backend-propagation правки идентичности в ростер, Отклонение от спеки: propagation на бэке вместо маршрутизации на фронте, Backfill personId и ростера для исторических заявок, Граница: единство пассажира только через каталог

### Community 75 - "SettingsSidebar: уведомления — NotificationsPermissionsPanel, notificationSections, notificationPayload"
Cohesion: 0.21
Nodes (14): Конфиг секций уведомлений и правило имён каналов, Общий buildNotificationPayload на 30 ключей, Пробел: секция «Брони» не показана ни одной панелью, Вкладка «Уведомления», Структура строки уведомления (текст → MUISwitch → почта → браузер), EMPTY_MENU, NotificationsPermissionsPanel(), NotificationRow() (+6 more)

### Community 3 - "UI-примитивы: Button, Sidebar, CloseIcon, MUIAutocomplete + формы компаний"
Cohesion: 0.13
Nodes (41): TZ off-by-one: рейс 1-го числа выпадал из обоих месяцев, CREATE_DRIVER_MUTATION, UPDATE_DRIVER_MUTATION, CREATE_POSITION, CREATE_REQUEST_MUTATION, CREATE_PASSENGER_REQUEST, GET_AIRLINES_RELAY, GET_AIRPORTS_RELAY (+33 more)

### Community 17 - "Сезонные цены категорий номеров (RoomKindSeasons)"
Cohesion: 0.08
Nodes (44): accommodationDiscountPercent — проценты скидки, выраженные через chargeFactor, v12.15 — сезонные цены тарифов гостиницы (RoomKindSeasons, roomKindSeasons.js, apolloErrorText.js), UPDATE_PASSENGER_REQUEST_SUPPLY, GET_ROOM_KIND_SEASONS, CREATE_ROOM_KIND_SEASON, UPDATE_ROOM_KIND_SEASON, DELETE_ROOM_KIND_SEASON, FapSupplyCard() (+36 more)

### Community 83 - "Шахматка (док): точка входа HotelShahmatka, гейты доступа и v1"
Cohesion: 0.18
Nodes (18): Голый маршрут /newPlacementV2/:idHotel — ни одного пропса, Цепочка accessMenu рвётся до таба шахматки, roles в модуле используются только для пикселей, PlacementDND v1 недостижим, но остаётся в бандле, Вопрос: CurrentTimeIndicator из v1 выброшен намеренно?, Вопрос: можно ли удалять PlacementDND/?, Шахматка v1 (PlacementDND) — недостижимая из маршрутов, Гейты доступа шахматки (canAccessMenu requestMenu) (+10 more)

### Community 104 - "Геометрия сетки (dayWidth, rowHeight = 50 × places)"
Cohesion: 0.29
Nodes (14): DAY_WIDTH = 40 живёт двумя жизнями: стартовый стейт и масштаб сайдбара, Расхождение 228 против 220 между шапкой и телом, Дефект: ResizeObserver пересоздаётся на каждом рендере, Дефект: containerRef пишут строка и все ячейки дня, Дубликат: 50 * room.type и голая 50, Шов: хук usePlacementGeometry, Вопрос: DAY_WIDTH = 40 должен был остаться масштабом сайдбара?, TimelineV2 — липкая шапка с полосой дней (+6 more)

### Community 70 - "Известные расхождения шахматки с конвенциями репозитория"
Cohesion: 0.11
Nodes (22): Горизонтальная координата дропа не читается никогда, Дефект: оптимистичный дроп не удаляет карточку из newRequests, Дефект: document-слушатели resize переживают unmount, Дефект: resize не валидирует порядок дат, Дефект: заблокированный по isOverlap resize всё равно открывает модалку, Ноль содержательных медиазапросов и нет тач-поддержки, Дубликат: блок resize-ручки — 2 дословные копии, Отклонение: инлайн sx вместо CSS-модулей (+14 more)

### Community 105 - "Шахматка v2 (док): DraggableRequestV2, RoomRowV2, дефекты resize и дат"
Cohesion: 0.21
Nodes (14): Дефект: resize сдвигает дату на сутки, Дефект: resize срабатывает без движения мыши, Дефект: по размещённой плашке нельзя открыть карточку заявки, Дефект: нарушение правил хуков в RoomRowV2, Дефект: простое наведение перерисовывает всю доску, ОПРОВЕРГНУТО: дубль useDraggable с тем же id в DragOverlay, ОПРОВЕРГНУТО: круг «UTC-цифр» внутри модуля рассогласован, Дубликат: сборка new Date(`${date}T${time}`) — 10 мест (+6 more)

### Community 87 - "Шахматка v2 (док): оркестр NewPlacementV2, плашка и правая панель"
Cohesion: 0.17
Nodes (17): Дефект: AddPassengersModalV2 недостижима, Дефект: запросы AddPassengersModalV2 уходят без skip, Дефект: отменённая бронь всегда возвращается в сайдбар эскадрильи, Дефект: пустое состояние сайдбаров проверяет нефильтрованный массив, Дубликат: «Заявок не найдено» — 3 копии, Шов: компонент ReservePanel, NewPlacementV2.jsx — оркестратор (1701 строка, 52% модуля), AddPassengersModalV2 — пассажир/сотрудник в резерв (284 строки) (+9 more)

### Community 62 - "Placement Dead Code Defects"
Cohesion: 0.17
Nodes (24): Дефект: заявку можно бросить в отключённую комнату, Дефект: нет onDragCancel — доска залипает в перетаскивании, Дефект: молчаливые провалы мутаций, Дефект: сдвиг койки внутри номера жёстко пишет status done, Клавиатурный drag-and-drop живёт по случайности, Кластер мёртвого кода модуля, Дубликат: блок оптимистичной вставки — 3 копии, Дубликат: сборка hotelChesses — 3 разошедшиеся копии (+16 more)

### Community 117 - "Шахматка v2 (док): виртуализация строк и buildFilteredRooms"
Cohesion: 0.31
Nodes (11): Дефект: рендерный TypeError при активном поиске, Дефект: мемоизация обнулена свежими Date вне мемо, Дефект: поиск матчит requestID, а показывается requestNumber, ОПРОВЕРГНУТО: getRoomHeight/itemKey падают на сжимающемся списке, Дубликат: eachDayOfInterval по месяцу — 4 раза за рендер, Вопрос: room.requests из buildFilteredRooms предполагался источником рендера?, placementFilters — поиск и сборка filteredRooms, Виртуализация строк (VariableSizeList) (+3 more)

### Community 69 - "SHAHMATKA ARCHITECTURE"
Cohesion: 0.15
Nodes (23): Дефект: getOverlappingRequests разыменовывает draggedRequest без защиты, Дефект: три документа пишут одно поле кэша hotel({id}), ОПРОВЕРГНУТО: эффект usePlacementData:329 зацикливается, Оценка точности SHAHMATKA_ARCHITECTURE.md, Дубликат: маппер пассажиров резерва — 2 копии по ~55 строк, Шахматка v2 — timeline-календарь размещения, usePlacementData — весь слой данных шахматки, Матчинг заявок и резервов с гостиницей по airport.id (+15 more)

### Community 101 - "Шахматка v2 (док): пересечения — placementOverlap и hasOverlap"
Cohesion: 0.29
Nodes (15): Дефект: окно двойного бронирования после подтверждения, Дубликат: предикат пересечения — 4 копии, Отклонение: ноль тестов при чистой доменной логике, Инвариант: hasOverlap и getOverlappingRequests не взаимозаменяемы, Инвариант: getAvailablePosition возвращает undefined, а 0 — валидный ответ, Инвариант: интервалы полуоткрытые [in, out) во всех четырёх копиях, placementOverlap — две проверки пересечений, placementPositions.getAvailablePosition — выбор свободной койки (+7 more)

### Community 97 - "Шахматка v2 (док): статусы и цвета — translateStatus, дубли карты статус→цвет"
Cohesion: 0.22
Nodes (16): Дефект: handleSaveChanges отправляет status: "" для нераспознанного статуса, Дефект: статус резолвится по наличию chess.request, а не по значению, Русская строка статуса используется как ключ карты цветов, Дубликат: карта статус→цвет — 4 копии, Шов: единый словарь статусов на enum-ключах, Вопрос: удалять translateStatus в пользу roles.js?, Цвета статусов и расхождение translateStatus с roles.js, translateStatus — код статуса → русская строка (+8 more)

### Community 111 - "Placement Board Data Mapping"
Cohesion: 0.27
Nodes (12): Дефект: EditRequestNomerFond из шахматки получает урезанную комнату, Дефект: hotelChess с room: null исчезает бесследно, Отклонение: ~120 строк инлайн-JSX внутри колбэка VariableSizeList, Шов: компонент RoomLabelCell, Инвариант: сортировка mapRooms выживает только как tiebreak, Инвариант: инверсию room.id = имя / room.roomId = id нельзя потерять, Вопрос: hotelChess с room: null — реальное состояние бэка?, placementTransforms — сервер → «карточка размещения» (+4 more)

### Community 15 - "Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08)"
Cohesion: 0.05
Nodes (58): Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08), Правка: список заявок ФАП в учётке гостиницы — только заявки, где выбрана эта гостиница, Правка: услугу «трансфер» в заявке ФАП скрыть от гостиниц, не оказывающих трансфер, Правка: в проживании ФАП показывать гостинице тариф по договору Карс Авиа↔гостиница, Правка: трансферные тарифы во вкладке «Тарифы» гостиницы — только если гостиница сама оказывает трансфер, Правка: открепить квоту и резерв в шахматке, Правка: во вкладке «О гостинице» показывать контакты самой гостиницы, Правка: во вкладке «Номера» показывать цены гостиницы, а не цены для авиакомпании (+50 more)

### Community 145 - "ФАП-доки: оглавление FAP.md, FAP2.md, FAP-HANDOVER, FAP-DECISIONS"
Cohesion: 0.50
Nodes (5): FAP-DECISIONS.md — decision history, Decision: baggage = trip with per-passenger tags and prices, FAP-HANDOVER.md — module handover to backend dev, FAP.md — backend documentation, FAP2.md — frontend documentation

### Community 47 - "Доки ФАП: FAP.md, FAP2.md, FAP-DECISIONS, FAP-HANDOVER"
Cohesion: 0.08
Nodes (30): Decision: no embedded→relational rewrite, Decision: report opens to airline only on submit, Decision: pin figures only in submitted reports, Decision: FAP days rules (duration, manual override, evictions), Decision: billing mode belongs to tariff (PER_BED/PER_ROOM), Decision: airline contract prices as third tariff source, Decision: personId is the identity canon, Decision: overbooking allowed, no hard blocks in FAP (+22 more)

### Community 116 - "ФАП-доки: FAP_SCOPE, withFapAuthGuard, ExternalUser и recognizePassengerDocument"
Cohesion: 0.18
Nodes (11): Decision: row-level authorization, not content filtering, Decision: observation mode before hard enforcement, Constraint: role middleware ban in FAP, Passenger LK concept (target: October 2026), FAP_SCOPE_ENFORCE rollout (observation → hard mode), checkFapScopeReadiness.js (enforcement readiness probe), ExternalUser & magic links, withFapAuthGuard (auth whitelist) (+3 more)

### Community 146 - "ФАП-доки: сеть characterization-тестов и разделение резолверов"
Cohesion: 0.40
Nodes (5): Method: finder → adversarial verifier → stand measurement, Two-tier mutation envelope (withPassengerRequest), prismaDouble (test harness), Resolver split — stages 0–3 (12 resolver files + 23 services), Characterization test net (300+ tests)

### Community 118 - "Провайдеры приложения: AuthContext, main.jsx, App и index.html"
Cohesion: 0.25
Nodes (9): index.html — HTML-оболочка приложения, #root — точка монтирования React, Google Fonts: Montserrat, Inter, Nunito Sans, App(), AuthContext, getExternalUserContext(), AuthProvider(), DialogProvider() (+1 more)

### Community 18 - "Эскадрилья: Estafeta, ExistRequest, статусы и roles"
Cohesion: 0.11
Nodes (38): Экскурс: Эскадрилья и система заявок в KARS-AVIA CRM, Эскадрилья (модуль заявок на размещение экипажа), Жизненный цикл заявки (created → opened → done → archived), Маппинг статусов заявки (англ. код → русское название), Многоуровневая серверная фильтрация заявок, Серверный поиск с debounce 500 мс, Пагинация заявок с синхронизацией URL (take: 50), DRIVERS_QUERY (+30 more)

### Community 56 - "Доступ по ролям: access.js (isSuperAdmin…), фильтр гостиниц show/active"
Cohesion: 0.13
Nodes (22): Права доступа к заявкам через accessMenu, v12.7 — бейдж «Готовность к работе» + браузерные push-уведомления, GET_HOTEL_USERS, AirlineRegisterOfContracts(), CreateRequestSidebar(), DriversCompanyList(), DriversCompany_tabComponent(), DriversList() (+14 more)

### Community 28 - "Гостиница: таблица бронирований (HotelTable, Booking, Placement)"
Cohesion: 0.08
Nodes (32): Упрощённая обработка подписок через refetch(), Известные особенности и потенциальные улучшения Estafeta, makeFormatter(), convertToDate(), REQUEST_CREATED_SUBSCRIPTION, REQUEST_UPDATED_SUBSCRIPTION, GET_REQUEST, GET_BRONS_HOTEL (+24 more)

### Community 61 - "Шахматка v2: NewPlacementV2, utils и история версий"
Cohesion: 0.17
Nodes (18): Маршруты заявок (/relay, /hotels/:hotelId/:requestId, /newPlacement/:hotelId), Структура src/ (App, main, AuthContext, services, contexts, hooks, utils, Components), Шахматка — PlacementDNDV2 (timeline-календарь заселения), v10.8 (17.01.2026), v10.8 — появление шахматки V2 с модульной структурой, v12.15 — редизайн шахматки (NewPlacementV2, виды Неделя / Декада / Месяц, портал-поповер), v12.15 — единая доска без «Квота | Резерв» (−1260 строк), v12.15 — снос PlacementDND v1, react-window, TransferAdminOrdersContent (+10 more)

### Community 40 - "CLAUDE.md / AGENTS.md: руководство и MUI-примитивы"
Cohesion: 0.11
Nodes (31): CLAUDE.md — руководство по репозиторию для Claude Code, Работа с кодом — правила кода, Визуальный стиль — следовать существующим паттернам, Экономия токенов — не объяснять, просто делать, Kars Avia — система размещения экипажей в гостиницах, Стек: React 18 (JSX), Vite 5, Apollo Client 3, MUI 6, React Router 6, Команды npm: dev / build / preview / lint, Окружения (.env): dev / demo / production, переключение в graphQL_requests.js (+23 more)

### Community 23 - "Таблицы заявок: InfoTable и хелперы дат convertToDate / buildScheduledISO"
Cohesion: 0.08
Nodes (30): Хелперы дат: convertToDate / convertToDateNew / buildScheduledISO, convertToDateNew(), MONTHS, WORK_STATUSES, requestWord(), tileInitials(), groupStats(), metaFor() (+22 more)

### Community 144 - "Ключи accessMenu: menuAccess (roles.js) и README v12.14–v12.15"
Cohesion: 0.80
Nodes (5): accessMenu — feature-флаги внутри роли, Ключи accessMenu (menuAccess в roles.js), v12.14 — ключи accessManage / travellineMenu / reserveUpdateCompleted, accessSections.js, v12.15 — архив отчётов: «Текущие · Черновики · Архив», archiveReport / restoreReport, ключ reportDelete, menuAccess

### Community 19 - "RoleContent: точки входа ролей (SuperAdmin/Dispatcher/Airline)"
Cohesion: 0.10
Nodes (43): Поток accessMenu: Main_Page → MenuDispetcher → AllRoles → RoleContent, RoleContent — AllRoles.jsx выбирает контент по роли, Маршрут /documentation и пункт меню «Помощь», GET_HOTEL_NAME, AirlinePage(), AirlinesList(), Company(), DocumentationList() (+35 more)

### Community 88 - "SettingsSidebar: accessPayload.js и история версий доступа"
Cohesion: 0.19
Nodes (16): SettingsSidebar — панель прав доступа отдела (airline / dispatcher), accessStateRef — ref с внутренним состоянием панели прав, buildAccessPayload(internalState) — internal → raw API, positionAccessMenusByPosId — доступ должностей к разделам (PositionOnDepartment), AccessPermissionsPanel — чисто UI, всё через пропсы, Визуальный disabled — opacity 0.55 на контейнере (класс rowDisabled), CSS-модули — свой .module.css у компонента, шаринг между соседями по папке, Визуальный disabled — opacity 0.55 на контейнере (класс rowDisabled) (+8 more)

### Community 55 - "Отчёты v2: ReportDraftsPanel, reportDraftAge, reportDraftComment и раздел в CLAUDE"
Cohesion: 0.14
Nodes (22): Раздел «Отчёты v2» (ReportsV2) — отчёты по заявкам эскадрильи, Гейты ролей раздела «Отчёты»: reportMenu, старый раздел только у SUPERADMIN, Черновики отчётов: createAirlineReportDraft / createHotelReportDraft → confirmReportDraft, Доменная логика без JSX: reportRules.js / reportDraftRows.js / reportDraftAge.js (+ node --test), Что нельзя ломать в «Отчётах v2», Границы периода …T00:10:00 / …T23:50:00 — часть расчёта, не форматирование, recalcRow — только для строк, которые правил пользователь, updateReportDraft перезаписывает весь массив строк без версии → явная кнопка сохранения (+14 more)

### Community 60 - "Отчёты v2: правила расчёта суток (reportRules, ReportRulesSidebar)"
Cohesion: 0.18
Nodes (21): Пороги частичных суток — ReportPartialDaySetting, уровни GLOBAL / AIRLINE / HOTEL, v12.15 — «Правила расчёта суток» с уровнями GLOBAL / AIRLINE / HOTEL, resolveDraftPartialDayRules, GET_REPORT_PARTIAL_DAY_SETTINGS, UPSERT_REPORT_PARTIAL_DAY_SETTING, DELETE_REPORT_PARTIAL_DAY_SETTING, GET_AIRLINES_LIGHT, FIELD_GROUPS, LEVEL_OPTIONS (+13 more)

### Community 11 - "README: история версий"
Cohesion: 0.03
Nodes (75): README — история обновлений Kars Avia (v0.1 → v12.15), v0.1 (02.12.2024), v0.2 (04.12.2024), v0.3 (07.12.2024), v1.0 (12.12.2024), v1.1 (18.12.2024), v1.2 (21.12.2024), v2.0 (09.01.2025) (+67 more)

### Community 151 - "README: v12.2 — единый airlineAnalytics, экспорт в PDF и Script Runner"
Cohesion: 0.67
Nodes (3): v12.2 (14.04.2026), v12.2 — единый airlineAnalytics и экспорт аналитики в PDF, v12.2 — Script Runner (запись и воспроизведение сценариев, только SUPERADMIN)

### Community 100 - "README: версии v12.13–v12.14 и hotelAddress (composeHotelAddress)"
Cohesion: 0.16
Nodes (14): v12.6 (18.05.2026), v12.7 (22.05.2026), v12.13 (27.07.2026), v12.14 (14.08.2026), v12.6+ — интеграция с TravelLine, v12.13 — аналитика «Пассажиры» (KPI, таблицы, графики, XLSX одной книгой), v12.13 — TravelLine сертификация: дедлайн отмены, часовые пояса, корп. клиенты, v12.13 — приложение представителя: распознавание документа по фото (Yandex Vision → GPT) (+6 more)

### Community 58 - "Меню ролей: MenuDispetcher, SuperAdminMenu и canSeeAnalytics"
Cohesion: 0.12
Nodes (19): v12.12 (30.06.2026), v12.12 — сгруппированные компактные меню на data-driven рендере, GET_TRANSFERS_COUNT, TRANSFER_CREATED_SUBSCRIPTION, TRANSFER_UPDATED_SUBSCRIPTION, GET_REQUESTS_COUNT, GET_PASSENGER_REQUESTS_COUNT, PASSENGER_REQUEST_CREATED_SUBSCRIPTION (+11 more)

### Community 65 - "Отчёты v2: выпущенные отчёты, GraphQL и SegmentedToggle"
Cohesion: 0.14
Nodes (18): v12.14 — выпущенный отчёт в режиме только чтения (ReportDraftEditor mode=view), plural.js, GET_AIRLINE_REPORT, GET_REPORTS_SUBSCRIPTION, GET_HOTEL_REPORT, DELETE_REPORT, ARCHIVE_REPORT, RESTORE_REPORT, GET_REPORT_DRAFTS (+10 more)

### Community 44 - "ФАП: манифест фиксированной ширины и ICAO (manifestFixedWidth)"
Cohesion: 0.12
Nodes (28): v12.15 — форматы манифеста: фиксированная ширина, ICAO, Руслайн (шесть профилей), FIELDS, FIXED_WIDTH_HEADER, toLines(), nextTokenStart(), readLayout(), cut(), isReg() (+20 more)

### Community 59 - "Описание гостиницы: парсер hotelDescription и HotelPreview"
Cohesion: 0.16
Nodes (23): v12.15 — «О гостинице» адаптив, чипы удобств (hotelDescription.js, +26 тестов), HotelAbout_tabComponent(), blockText(), VOID_TAGS, PARAGRAPH_TAGS, NAMED_ENTITIES, isCodePoint(), decodeEntities() (+15 more)

### Community 67 - "Цены трансфера: transferPrices.js и поиск по маршрутам"
Cohesion: 0.16
Nodes (20): v12.15 — TravelLine SyncIndicator; поиск цен трансфера matchesTransferPriceSearch, UPDATE_ORGANIZATION, DELETE_ORGANIZATION_TRANSFER_PRICE, GET_AIRLINE_TRANSFER_PRICES, DELETE_AIRLINE_TRANSFER_PRICE, AirlineTransferPrices_tabComponent(), InfoTableOrganizationTransferPrices(), OrganizationTransferPrices_tabComponent() (+12 more)

### Community 4 - "Документация «Помощь»: DocumentationList1, дерево и левая панель"
Cohesion: 0.05
Nodes (84): Раздел «Помощь» (Инструкции) — модуль документации, Иерархия компонентов: DocumentationList → DocumentationList1 → панели, DocumentationList.jsx — обёртка с Header «Инструкции» и переключателем типа, DocumentationList1 — трёхзонный layout (дерево / контент / якоря), Типы документации: dispatcher / airline / hotel / representation → apiType, Переключатель типа только у superAdmin (hasDocumentationFilterSwitcherAccess), GraphQL API документации: sectionsWithHierarhy, article, CRUD секций/статей, upload, Нормализация дерева section/article из ответа (toLocalTreeNode) (+76 more)

### Community 80 - "Документация: локальное хранилище черновиков (docDraftStore, indexedDb, fileStore)"
Cohesion: 0.25
Nodes (16): Лейаут статьи (ширина, отступы) — saveDocLayout / docDraftStore, buildDocDraftId(), buildDocLayoutId(), loadDocContent(), loadDocDraft(), saveDocContent(), saveDocLayout(), randomId() (+8 more)

### Community 14 - "Документация: редактор Tiptap и расширения"
Cohesion: 0.05
Nodes (31): Редактор Tiptap — базовые расширения (StarterKit, Color, Highlight, FontSize, …), NavigationAnchor — атрибуты anchorTag / anchorId на paragraph и heading, Табличные расширения (TableWrapper, RowHeight, RowResizing, CellCursorPad, SelectionLock), Блоки контента: Quote, Toggle, Frame, Columns, Image, Gallery, Video, Audio, File, SlashInterceptor + SlashCommand, BlockLassoSelectionPlugin, imageDropPlugin, Ограничение VK-видео: iframe разрешён только на официальных сайтах партнёров, FontSize, BackgroundColor (+23 more)

### Community 10 - "TravelLine: поиск, бронирование, синхронизация"
Cohesion: 0.06
Nodes (60): mediaSrc(), GET_TL_CONFIG, SET_TL_CONFIG, GET_TL_ROOM_TYPES, GET_TL_RATE_PLANS, TL_PROPERTY_CALENDAR, TL_PROPERTIES_AVAILABILITY, GET_TL_RESERVATIONS (+52 more)

### Community 110 - "Трансфер: заказ (TransferOrder)"
Cohesion: 0.22
Nodes (9): buildScheduledISO(), GET_TRANSFER_REQUEST, UPDATE_TRANSFER_REQUEST_MUTATION, OrderInfoSidebar(), isFinishedOrCanceled(), EDITABLE_STATUSES, pad(), toDateAndTime() (+1 more)

### Community 107 - "Вход и возврат по /login?next= (loginRedirect, LoginRedirect)"
Cohesion: 0.25
Nodes (10): TRANSFER_SING_IN, SINGIN, SINGUP, Login(), LoginRedirect(), NO_RETURN_PATHS, normalizePath(), isReturnable() (+2 more)

### Community 37 - "Страницы АК и автопарка: AirlinePage, DriversCompanyPage, роутинг по ролям"
Cohesion: 0.07
Nodes (29): GET_ORGANIZATION, DriversCompanyPage(), DriversCompanyTab, AirlineTarifsTab, AirlineRegisterOfContracts, AirlineShahmatkaTabStaff, OrganizationAboutTab, OrganizationRegisterOfContracts (+21 more)

### Community 84 - "Авторизация: authService, authErrorLink (401 → logout) и TokenRefresher"
Cohesion: 0.16
Nodes (12): REFRESH_TOKEN, TokenRefresher(), isExternalUser(), AUTH_CODES_NO_RETRY, AUTH_CODES_REFRESH, isAuthError(), shouldLogoutImmediately(), isRefreshOrLogin() (+4 more)

### Community 139 - "Активность пользователя: UserActivityTracker, MARK_USER_ONLINE / MARK_USER_OFFLINE"
Cohesion: 0.40
Nodes (5): LOGOUT, MARK_USER_OFFLINE, MARK_USER_ONLINE, lastMinutesPhrase(), UserActivityTracker()

### Community 36 - "Чаты и поддержка: Message, SupportPage, getMediaUrl"
Cohesion: 0.09
Nodes (26): REQUEST_MESSAGES_SUBSCRIPTION, GET_MESSAGES_HOTEL, SEND_FAP_MESSAGE, MARK_MESSAGE_AS_READ, MARK_ALL_MESSAGES_AS_READ, UPDATE_MESSAGE_BRON, GET_TRANSFER_CHATS, GET_TRANSFER_MESSAGES (+18 more)

### Community 12 - "Резерв: ReservePlacement(Representative), InfoTableDataReserve*, ChooseHotel и словарь roles"
Cohesion: 0.07
Nodes (46): GET_HOTELS_RELAY, UPDATE_HOTEL_BRON, CANCEL_PASSENGER_REQUEST, COMPLETE_PASSENGER_REQUEST_EARLY, GET_RESERVE_LOGS, REQUEST_RESERVE_UPDATED_SUBSCRIPTION, GET_RESERVE_REQUEST, CREATE_RESERVE_REPORT (+38 more)

### Community 135 - "ФАП: сайдбары заявки — CreateRepresentativeRequest, AddRepresentativeService"
Cohesion: 0.43
Nodes (6): UPDATE_PASSENGER_REQUEST, isoToTimeString(), isoToDateString(), buildPlannedFromTo(), initialFormState, EditRepresentativeRequest()

### Community 66 - "Резерв представителя: вкладки услуг (Habitation / Water / Power / Baggage) и DeleteIcon"
Cohesion: 0.13
Nodes (17): SET_PASSENGER_SERVICE_STATUS, REMOVE_PASSENGER_REQUEST_HOTEL, REMOVE_PASSENGER_REQUEST_DRIVER, COMPLETE_PASSENGER_REQUEST_WATER_EARLY, COMPLETE_PASSENGER_REQUEST_MEAL_EARLY, COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY, COMPLETE_PASSENGER_REQUEST_LIVING_EARLY, statusToLabel (+9 more)

### Community 76 - "Документация: создание статей и обновлений (CreateRequestDocumentation, TextEditor)"
Cohesion: 0.19
Nodes (18): CREATE_HOTEL, CREATE_DOCUMENTATION, newId(), makeEmptyBlock(), updateTree(), removeFromTree(), buildPayload(), BlockItem() (+10 more)

### Community 50 - "Страница гостиницы: HotelPage, роутинг по ролям, ссылка предпросмотра"
Cohesion: 0.07
Nodes (19): CREATE_HOTEL_PREVIEW_LINK, PRESETS, HotelPreviewShareButton(), HotelAboutTab, HotelCompanyTab, HotelNomerFondTab, HotelShahmatkaTab, HotelTarifsTab (+11 more)

### Community 33 - "«О гостинице»: HotelAbout и иконки удобств"
Cohesion: 0.07
Nodes (17): GET_HOTEL_PREVIEW, GET_HOTEL_MEAL_PRICE, GET_HOTEL_TRANSFER_PRICE, AMENITY_ICONS, TABS, AirConditionerIcon(), BarIcon(), ConferenceIcon() (+9 more)

### Community 99 - "Шахматка v2: usePlacementData, placementTransforms и requestArchiveAccess"
Cohesion: 0.22
Nodes (13): GET_HOTEL_MIN, usePlacementData(), translateStatus(), mapRooms(), mapHotelChessToRequest(), mapRequestToPlacement(), mapUpdatedRequestFromSubscription(), isRequestArchived() (+5 more)

### Community 32 - "Аналитика АК: AirlineAnalytics, мапперы и сортировка таблиц"
Cohesion: 0.11
Nodes (36): GET_AIRLINES, GET_AIRLINE_ANALYTICS, SERVICE_OPTIONS, isPeriodRangeComplete(), formatPeriodHuman(), formatPeriodWithDays(), ALL_AIRPORTS_OPTION, ALL_SERVICES_OPTION (+28 more)

### Community 31 - "Отчёты v2: черновик — reportDraftRows, useReportDraft"
Cohesion: 0.10
Nodes (33): GET_REPORT_DRAFT, UPDATE_REPORT_DRAFT, RECREATE_REPORT_DRAFT, CONFIRM_REPORT_DRAFT, SUBMIT_AIRLINE_REPORT_DRAFT, REJECT_AIRLINE_REPORT_DRAFT, NAME_WIDTHS, ROOM_WIDTHS (+25 more)

### Community 52 - "Отчёты v2: таблица черновика — ReportDraftTable, Summary, группировка по гостиницам"
Cohesion: 0.13
Nodes (19): GET_REPORT_DRAFT_PRESENTATION, MY_REPORT_EDITABLE_FIELDS, SET_MY_REPORT_EDITABLE_FIELDS, ReportDraftDialog(), ReportDraftErrorBanner(), ReportDraftFilters(), ReportDraftFooter(), ReportDraftGroupHeader() (+11 more)

### Community 140 - "Плашка техработ: MaintenanceBannerBar и useMaintenanceCountdown"
Cohesion: 0.60
Nodes (4): MAINTENANCE_BANNER_UPDATED, MaintenanceBannerBar(), useMaintenanceCountdown(), formatCountdown()

### Community 122 - "Документация: правка статей — EditRequestDocumentation и дерево блоков"
Cohesion: 0.38
Nodes (9): UPDATE_DOCUMENTATION, newId(), toLocalNode(), stripNode(), collectImageGroups(), updateTreeById(), removeFromTreeById(), BlockItem() (+1 more)

### Community 131 - "TravelLine: панель номеров — TravellineRoomsSidebar, TL_AVAILABILITY"
Cohesion: 0.31
Nodes (6): TL_AVAILABILITY, CREATE_TL_RESERVATION, formatDate(), nightsBetween(), parsePersonName(), TravellineRoomsSidebar()

### Community 123 - "package.json: метаданные и скрипты (dev, build, lint, preview)"
Cohesion: 0.20
Nodes (9): name, private, version, type, scripts, dev, build, lint (+1 more)

### Community 74 - "package.json: dependencies (Tiptap, MUI)"
Cohesion: 0.12
Nodes (20): dependencies, @mui/icons-material, @mui/icons-material, @tiptap/extension-color, @tiptap/extension-color, @tiptap/extension-highlight, @tiptap/extension-highlight, @tiptap/extension-table (+12 more)

### Community 150 - "package"
Cohesion: 0.67
Nodes (3): @tiptap/extension-table-cell, @tiptap/extension-table-cell, @tiptap/extension-table-header

### Community 141 - "ScriptRunner: плавающее окно — DraggableWindow, useDragResize, PickHighlight"
Cohesion: 0.33
Nodes (6): react-dom, react-dom, useDragResize(), DraggableWindow(), PickHighlight(), TargetMarkers()

### Community 108 - "ФАП: манифест из реестра и импорт (fapManifestBuild, ManifestImportModal)"
Cohesion: 0.29
Nodes (12): xlsx, xlsx, manifestPeople(), mark(), hasManifestRoster(), buildManifestRows(), buildManifestWorkbook(), manifestDownloadName() (+4 more)

### Community 93 - "package.json: devDependencies (Vite, ESLint)"
Cohesion: 0.12
Nodes (17): devDependencies, @types/react, @types/react, @types/react-dom, @types/react-dom, @vitejs/plugin-react, @vitejs/plugin-react, eslint (+9 more)

### Community 94 - "О компании: HotelSettings, AirlineAbout, OrganizationAbout и иконки контактов"
Cohesion: 0.26
Nodes (9): AirlineAbout_tabComponent(), HotelSettings_tabComponent(), OrganizationAbout_tabComponent(), ContactsIcon(), DescriptionIcon(), HomeIcon(), PinIcon(), RequisitesIcon() (+1 more)

### Community 13 - "Svg-обёртка, иконки действий и меню «⋮»"
Cohesion: 0.05
Nodes (26): AirlineReadinessIndicator(), ExistRequestAdditionalMenu(), collapseBtnStyle, InfoTableDataAirlines(), collapseBtnStyle, InfoTableDataDispatcherCompany(), MENU_ITEMS, ReadinessIndicator() (+18 more)

### Community 53 - "Документация: Tiptap-панель, modalStacking, ImageViewer"
Cohesion: 0.16
Nodes (26): EMPTY_DOC, DEFAULT_ARTICLE_PADDING, ARTICLE_WIDTH_PRESET_MAX, isDocJson(), normalizeIncomingDocContent(), isSameDocContentSemantically(), clamp(), normalizePadding() (+18 more)

### Community 85 - "Документация: загрузка файлов (UploadContext, imageDropPlugin)"
Cohesion: 0.18
Nodes (13): DocumentationUploadContext, isSameOriginAsServer(), ensureUploadedPath(), ensureLeadingSlash(), normalizeUploadsPath(), appendToken(), uniqueUrls(), DocumentationUploadProvider() (+5 more)

### Community 24 - "Документация: медиа-блоки редактора"
Cohesion: 0.11
Nodes (30): useDocumentationUpload(), notifyDocumentationUploadFailure(), FONT_SIZE_MODAL_ESTIMATED_SIZE, fontSizeOptions, FontSizeSelect(), AUDIO_MODAL_ESTIMATED_SIZE, loadYouTubeIframeApi(), loadVkVideoApi() (+22 more)

### Community 29 - "Документация: тулбар и экспорт в Office"
Cohesion: 0.09
Nodes (36): getDocumentationUploadFile(), textColors, bgColors, ColorModal(), CustomStyleModal(), EXPORT_FORMATS, ExportModal(), ImportModal() (+28 more)

### Community 142 - "Документация: PlusButtonOverlay — кнопка «+» у блока"
Cohesion: 0.60
Nodes (5): clampNumber(), getTopLevelBlockPos(), getTopLevelStartPositions(), getInsertTargetPosForBlock(), PlusButtonOverlay()

### Community 119 - "Документация: якоря навигации (AnchorHashOverlay)"
Cohesion: 0.36
Nodes (9): TEXT_NODE_TYPES, TEXT_BLOCK_TAGS, TABLE_NODE_TYPES, normalizeLabel(), buildAnchorsSignature(), isInsideTableNode(), AnchorHashOverlay(), buildAnchorDomId() (+1 more)

### Community 95 - "Документация: перетаскивание блоков (BlockDragOverlay)"
Cohesion: 0.24
Nodes (16): getEditorViewSafe(), getEditorDomSafe(), getClientPointFromEvent(), getTopLevelStartPositions(), getTopLevelBlockEl(), getTopLevelBlockPos(), getNodePosByDom(), getNearestTopLevelBlockElByClientY() (+8 more)

### Community 113 - "Документация: выделение блоков (BlockSelectionOverlay, blockLassoSelection)"
Cohesion: 0.27
Nodes (9): rectFromPoints(), intersectRect(), isFormFieldTarget(), normalizeTargetToElement(), hasNativeTextSelectionInActiveField(), BlockSelectionOverlay(), BlockLassoSelectionKey, BlockLassoSelectionPMPlugin (+1 more)

### Community 34 - "Документация: импорт DOCX (docxImport.js)"
Cohesion: 0.11
Nodes (35): linkStyles, renderLinkIcon(), getLinkStylePreviewStyle(), LinkModal(), LinkIcon(), ButtonIcon(), HighlightIcon(), DashedIcon() (+27 more)

### Community 136 - "Документация: slash-команды — blockRegistry (Tiptap)"
Cohesion: 0.48
Nodes (5): clampDocPos(), getFirstTextCursorPosInNode(), getMatchingAncestorFromSelection(), placeCursorInsideNearestNode(), schedulePlaceCursorInsideNearestNode()

### Community 57 - "Документация: файловый блок (fileBlockView, превью офисных файлов)"
Cohesion: 0.13
Nodes (20): FILE_MODAL_ESTIMATED_SIZE, BLOCK_TARGET_OPTIONS, getFileExtension(), getOfficePreviewUrl(), getPreviewKind(), TEXT_FILE_EXTENSIONS, CODE_FILE_EXTENSIONS, TEXT_FILENAMES (+12 more)

### Community 114 - "Документация: галерея (galleryBlock) — раскладки и подгонка"
Cohesion: 0.23
Nodes (8): parseMaybeInt(), GALLERY_LAYOUTS, GALLERY_FITS, normalizeGalleryLayout(), normalizeGalleryColumns(), normalizeGalleryGap(), normalizeGalleryFit(), GalleryBlock

### Community 120 - "Документация: блоки цитаты и рамки (quoteBlock, frameBlock)"
Cohesion: 0.35
Nodes (9): QuoteBlock, QUOTE_MODAL_ESTIMATED_SIZE, PRESET_COLORS, hexToRgb(), toQuoteBorderColor(), toQuoteAccentColor(), toQuoteButtonColor(), toQuoteTextColor() (+1 more)

### Community 54 - "Документация: высота строк таблицы (tableRowResizing)"
Cohesion: 0.12
Nodes (24): tableRowResizingPluginKey, RowResizeState, domCellAround(), rowDomAtCellPos(), edgeCell(), edgeCellHorizontal(), updateHandle(), updateCornerHandle() (+16 more)

### Community 81 - "Документация: обёртка таблицы, перенос строк и колонок (tableWrapperView)"
Cohesion: 0.24
Nodes (18): TABLE_HEADER_MODAL_ESTIMATE, TABLE_HEADER_PRESET_COLORS, findTable(), ensureSelectionInThisTable(), isSelectionInsideTable(), forceCursorBackIntoTable(), moveCursorLeft(), removeLastRow() (+10 more)

### Community 103 - "Документация: правка обновлений (EditRequestUpdates), HotelAboutRoomBlock и TextEditorOutput"
Cohesion: 0.24
Nodes (11): newId(), toLocalNode(), stripNode(), collectImageGroups(), updateTreeById(), removeFromTreeById(), BlockItem(), EditRequestUpdates() (+3 more)

### Community 82 - "ФАП: скидки пачкой — FapDiscountDialog, fapDiscountZones"
Cohesion: 0.20
Nodes (14): QUICK_PERCENTS, EMPTY_PRESETS, EMPTY_CUSTOM, clampInput(), FapDiscountDialog(), DISCOUNT_ZONES, clampPercent(), zoneMembers() (+6 more)

### Community 73 - "ФАП: список заявок FapV2 и фильтры fapListFilters"
Cohesion: 0.17
Nodes (15): ServiceProgressDot(), SERVICE_ORDER, LOGO_PALETTE, logoColor(), STATUS_OPTIONS, SERVICE_OPTIONS, REPORT_STAGE_OPTIONS, FapV2() (+7 more)

### Community 121 - "ФАП: файлы манифеста — fapManifestFiles (имя загрузки, порядок, парсинг)"
Cohesion: 0.40
Nodes (8): baseNameOf(), withoutTimestamp(), extensionOf(), flightSlug(), manifestUploadName(), isManifestFile(), parseManifestFile(), manifestFilesNewestFirst()

### Community 77 - "ФАП: деньги отчёта — fapReportMoney и матчинг строк (reportRowMatch)"
Cohesion: 0.21
Nodes (17): toNum(), lunchboxCountOf(), rowFoodCost(), isPersonRow(), frozenFieldsOf(), withoutTypename(), preserveMoneyFields(), TEXT_FIELDS (+9 more)

### Community 124 - "ФАП: шапка услуг FapHeaderActions и видимость услуг для гостиницы"
Cohesion: 0.20
Nodes (9): ALL, WITHOUT_RESTRICTED, SUPER, DISPATCHER, AIRLINE, HOTEL, HOTEL_MODERATOR, EXT_HOTEL (+1 more)

### Community 39 - "ФАП: тесты книги отчёта Excel (buildReportSheets.test)"
Cohesion: 0.09
Nodes (30): addRequestReportSheets(), makeRequest(), makeRequestWithGuest(), guestSheet(), combinedSheet(), makeBaggageRequest(), baggageSheet(), makeFullServiceRequest() (+22 more)

### Community 125 - "«О гостинице»: редактор по разделам — HotelAboutEditor, AboutChecklist, AboutLaundry"
Cohesion: 0.24
Nodes (6): AboutChecklist(), AboutLaundry(), INFRASTRUCTURE_GROUPS, FACILITY_GROUPS, INFRASTRUCTURE_ITEMS, ROOM_GROUPS

### Community 42 - "«О гостинице»: разбор описания по разделам (hotelAbout.js)"
Cohesion: 0.12
Nodes (31): HotelAboutEditor(), ABOUT_LABELS, FACILITY_ITEMS, ROOM_ITEMS, RARE_ITEM_KEYS, DICTIONARIES, LABEL_ALIASES, LAUNDRY_ON (+23 more)

### Community 38 - "Отчёты v2: строка черновика — ReportDraftRow, editorUtils, formatMoney"
Cohesion: 0.17
Nodes (32): ReportDraftEditor(), ReportDraftRow(), trimSeconds(), reportDateToInputValue(), inputValueToReportDate(), DRAFT_SORT_TYPES, sortDraftRows(), parseReportDateParts() (+24 more)

### Community 96 - "Отчёты v2: список ReportsV2List и шапка черновика"
Cohesion: 0.18
Nodes (10): ReportDraftEmptyState(), iconPropTypes, SearchIcon(), DocIcon(), SKELETON_NAME_WIDTHS, reportsWord(), ReportsV2List(), shortReportTitle() (+2 more)

### Community 68 - "ScriptRunner: константы действий и SVG-иконки панели (ACTION_TYPES, Icon*)"
Cohesion: 0.08
Nodes (3): ACTION_TYPES, KEY_OPTIONS, RESIZE_DIRS

### Community 86 - "ScriptRunner: компонент, сбор скриптов и экспорт (collectScripts, buildLibraryExportPayload)"
Cohesion: 0.12
Nodes (18): generateSelector(), makeSafeFileName(), updateNodeById(), collectScripts(), collectAllScripts(), countScripts(), buildLibraryExportPayload(), buildSingleScriptExportPayload() (+10 more)

### Community 137 - "ScriptRunner: исполнение действий и DOM-хелперы (executeAction, setElementValue)"
Cohesion: 0.29
Nodes (7): sleep(), getUnderlyingElement(), resolveEditableElement(), normalizeDateLikeValue(), setElementValue(), isScriptRunnerControl(), executeAction()

### Community 126 - "ScriptRunner: импорт сценариев — parseImportPayload, migrateFromFlatFormat, isValidTree"
Cohesion: 0.33
Nodes (10): isPlainObject(), isValidActionItem(), isValidActionsArray(), generateId(), assignIdsToTree(), migrateFromFlatFormat(), flatObjectToTree(), isValidTreeNode() (+2 more)

### Community 138 - "ScriptRunner: дерево действий — insertNode, moveNode, removeNodeById"
Cohesion: 0.38
Nodes (7): findNodeById(), removeNodeById(), insertNode(), isDescendantOf(), moveNode(), insertRelativeToNode(), reorderNode()

### Community 115 - "ScriptRunner: значения действий — случайные даты и время (resolveTypeActionValue)"
Cohesion: 0.24
Nodes (12): parseActionDate(), formatIsoDate(), formatRuDate(), generateRandomDateValue(), parseActionTime(), formatTimeFromMinutes(), randomInt(), getPreviousActionValue() (+4 more)

### Community 27 - "HotelPMS (мок-данные)"
Cohesion: 0.09
Nodes (27): HotelPMS(), uid(), Bookings(), Dashboard(), HK_FLOW, Housekeeping(), Reports(), Rooms() (+19 more)

### Community 132 - "Аналитика АК: сортировка таблиц — analyticsTableSortUtils"
Cohesion: 0.44
Nodes (8): cmpNum(), cmpStr(), STR_SORT_KEYS, sortRowsByKey(), sortPositionRows(), sortAirportRows(), sortMergedRequestRows(), sortSegmentBlocks()

### Community 51 - "Шахматка v2: стили статусов, BoardToolbar, PlacementBarV2 и RoomRowV2"
Cohesion: 0.11
Nodes (19): MEAL_LABELS, BarPopover(), LEGEND_ITEMS, BoardToolbar(), PlacementBarV2(), TrayCardV2(), UnplacedTray(), waitBadge() (+11 more)

### Community 78 - "Шахматка v2: период и шапка сетки (placementPeriod, GridHeader)"
Cohesion: 0.17
Nodes (13): VIEW_TABS, GridHeader(), MONTH, capitalize(), weekTitle(), decadeIndex(), decadeRange(), periodRange() (+5 more)

### Community 133 - "Шахматка v2: бейджи плашек (placementBadges), лоток TrayCardV2 и BarPopover"
Cohesion: 0.28
Nodes (6): countOccupiedLanes(), bedsLabel(), NOW, NEW_STYLE, WARN_STYLE, ALERT_STYLE

### Community 148 - "ScriptRunnerContext и Layout (Empty)"
Cohesion: 0.50
Nodes (3): Empty(), ScriptRunnerContext, ScriptRunnerProvider()

### Community 79 - "ФАП: тесты профилей манифеста"
Cohesion: 0.11
Nodes (14): WIDE_HEADER, NARROW_HEADER, narrowSheet(), detectNarrow(), VED_AT, VED_ROWS, ICAO_ROWS, RUSLINE_GROUPS (+6 more)

## Ambiguous Edges - Review These
- `Ворнинги групп W1/W2/W3 (computeFapGroupWarnings)` → `FapLivingPage.jsx`  [AMBIGUOUS]
  docs/superpowers/specs/2026-07-22-fap-passenger-groups-design.md · relation: conceptually_related_to
- `Обработка ошибок сохранения настроек` → `useToast()`  [AMBIGUOUS]
  src/Components/Blocks/SettingsSidebar/README.md · relation: references

## Knowledge Gaps
- **562 isolated node(s):** `Побочный эффект: метрика transferBaggage перестаёт быть нулевой`, `Подсказка о пропущенных аэропортах`, `Spec: Contract registry frontend edits (2026-07-07)`, `Prolongation chip in the contract list row`, `Spec: FAP hotel tariff billing mode «Койко-место»/«Номер» (2026-07-21)` (+557 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Ворнинги групп W1/W2/W3 (computeFapGroupWarnings)` and `FapLivingPage.jsx`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Обработка ошибок сохранения настроек` and `useToast()`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `getCookie()` connect `Сессия и контексты: getCookie, useToast, useDialog, JWT` to `GraphQL: ядро запросов и формы заявок`, `ФАП: реестр и группы пассажиров`, `UI-примитивы: Button, Sidebar, CloseIcon, MUIAutocomplete + формы компаний`, `Документация «Помощь»: DocumentationList1, дерево и левая панель`, `Цены авиакомпании: тарифы и география (airlineTariffPrices, airlineTariffGeography)`, `ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms`, `ФАП: сайдбары заявки — CreateRepresentativeRequest, AddRepresentativeService`, `ФАП: FapDetail, fapConstants и файлы манифеста`, `ФАП: багаж и вода/питание — FapBaggagePage, FapBaggageTripPage, FapWaterMealPage, FapHeaderActions`, `ФАП: роуты страниц, App.jsx и роли доступа (canAccessMenu, isHotelScoped, FapChat)`, `TravelLine: поиск, бронирование, синхронизация`, `Резерв: ReservePlacement(Representative), InfoTableDataReserve*, ChooseHotel и словарь roles`, `Активность пользователя: UserActivityTracker, MARK_USER_ONLINE / MARK_USER_OFFLINE`, `ФАП: доступ к отчёту и стадии — fapReportAccess, fapReportStages, FapLivingPage`, `Сезонные цены категорий номеров (RoomKindSeasons)`, `Эскадрилья: Estafeta, ExistRequest, статусы и roles`, `RoleContent: точки входа ролей (SuperAdmin/Dispatcher/Airline)`, `Реестр договоров: фронт-правки (ДС-бейдж, пролонгация, истечение)`, `ФАП: FapDriverPage, fapEditAccess, PersonBadge и массовое удаление получателей услуг`, `Системные уведомления и патч-ноуты`, `TravelLine: панель номеров — TravellineRoomsSidebar, TL_AVAILABILITY`, `Документация: медиа-блоки редактора`, `Загрузка файлов: FileUpload и UPLOAD_FILE_MUTATION`, `Представители и доступ: Representative*DetailPage, useEffectiveAccessMenu, Main_Page и DeleteIcon`, `Гостиница: таблица бронирований (HotelTable, Booking, Placement)`, `Реестры договоров: Hotel/Airline/Organization RegisterOfContracts, DeleteComponent и фильтры`, `Отчёты v2: черновик — reportDraftRows, useReportDraft`, `Аналитика АК: AirlineAnalytics, мапперы и сортировка таблиц`, `«О гостинице»: HotelAbout и иконки удобств`, `Страницы АК и автопарка: AirlinePage, DriversCompanyPage, роутинг по ролям`, `Отчёты v2: строка черновика — ReportDraftRow, editorUtils, formatMoney`, `ФАП-аналитика: PassengerAnalytics и мапперы`, `Тарифы: Create/EditRequestTarifCategory, AirlineTarifs_tabComponent и MultiSelectAutocomplete`, `Аналитика: Dispatcher/Hotel/Support Analytics, AnalyticsChart и DateRangePickerCustom`, `Страница гостиницы: HotelPage, роутинг по ролям, ссылка предпросмотра`, `Отчёты v2: таблица черновика — ReportDraftTable, Summary, группировка по гостиницам`, `Документация: Tiptap-панель, modalStacking, ImageViewer`, `Доступ по ролям: access.js (isSuperAdmin…), фильтр гостиниц show/active`, `Меню ролей: MenuDispetcher, SuperAdminMenu и canSeeAnalytics`, `Описание гостиницы: парсер hotelDescription и HotelPreview`, `Отчёты v2: правила расчёта суток (reportRules, ReportRulesSidebar)`, `Шахматка v2: NewPlacementV2, utils и история версий`, `SettingsSidebar: AccessPermissionsPanel, accessSections и слияние панелей доступа`, `Отчёты v2: выпущенные отчёты, GraphQL и SegmentedToggle`, `Резерв представителя: вкладки услуг (Habitation / Water / Power / Baggage) и DeleteIcon`, `Цены трансфера: transferPrices.js и поиск по маршрутам`, `ФАП: список заявок FapV2 и фильтры fapListFilters`, `Документация: создание статей и обновлений (CreateRequestDocumentation, TextEditor)`, `Документация: загрузка файлов (UploadContext, imageDropPlugin)`, `О компании: HotelSettings, AirlineAbout, OrganizationAbout и иконки контактов`, `Документация: правка обновлений (EditRequestUpdates), HotelAboutRoomBlock и TextEditorOutput`, `Трансфер: заказ (TransferOrder)`, `Документация: блоки цитаты и рамки (quoteBlock, frameBlock)`, `Документация: правка статей — EditRequestDocumentation и дерево блоков`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **Why does `dependencies` connect `package.json: dependencies (Tiptap, MUI)` to `ФАП: роуты страниц, App.jsx и роли доступа (canAccessMenu, isHotelScoped, FapChat)`, `ScriptRunner: плавающее окно — DraggableWindow, useDragResize, PickHighlight`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `ФАП: манифест из реестра и импорт (fapManifestBuild, ManifestImportModal)`, `package.json: метаданные и скрипты (dev, build, lint, preview)`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `README — история обновлений Kars Avia (v0.1 → v12.15)` connect `README: история версий` to `README: версии v12.13–v12.14 и hotelAddress (composeHotelAddress)`, `ФАП: FapDriverPage, fapEditAccess, PersonBadge и массовое удаление получателей услуг`, `README: v12.2 — единый airlineAnalytics, экспорт в PDF и Script Runner`, `SettingsSidebar: accessPayload.js и история версий доступа`, `Меню ролей: MenuDispetcher, SuperAdminMenu и canSeeAnalytics`, `Уведомления и бесконечный скролл (NotificationsSidebar, useInfiniteScroll)`, `Шахматка v2: NewPlacementV2, utils и история версий`, `Сутки проживания: effectiveCostDays и fapPersonDays`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `Побочный эффект: метрика transferBaggage перестаёт быть нулевой`, `Подсказка о пропущенных аэропортах`, `Spec: Contract registry frontend edits (2026-07-07)` to the rest of the system?**
  _562 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ФАП: багаж и вода/питание — FapBaggagePage, FapBaggageTripPage, FapWaterMealPage, FapHeaderActions` be split into smaller, more focused modules?**
  _Cohesion score 0.04728604728604729 - nodes in this community are weakly interconnected._