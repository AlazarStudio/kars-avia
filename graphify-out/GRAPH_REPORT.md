# Graph Report - .  (2026-10-05)

## Corpus Check
- 857 files · ~774,862 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4508 nodes · 14825 edges · 235 communities (182 shown, 53 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 451 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- ФАП: багаж и трансфер — FapBaggagePage, FapBaggageTripPage, FapTransferPage, FapSelect
- GraphQL: ядро запросов и формы заявок
- ФАП: реестр и группы пассажиров
- ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms
- Цены авиакомпании: тарифы и география (airlineTariffPrices, airlineTariffGeography)
- ФАП: FapDetail, FapHeaderActions, FapOverflowMenu и файлы манифеста
- Реестр договоров: таблица InfoTableAllDataTarifs, ДС-поповер и архив
- Реестр договоров: фронт-правки (ДС-бейдж, пролонгация, истечение)
- ФАП: книга Excel — листы воды/питания, багажа и трансфера (buildReportSheets)
- ФАП-аналитика: PassengerAnalytics и мапперы
- ФАП (спеки): единый реестр пассажиров и отправка отчёта на проверку
- ФАП: доступ к отчёту и стадии — fapReportAccess, fapReportStages, FapLivingPage
- ФАП: импорт манифеста — parseManifestXlsx, ManifestUploadField, manifestCore
- Реестры договоров: Hotel/Airline/Organization RegisterOfContracts, DeleteComponent и фильтры
- ФАП-аналитика: passengerAnalyticsMappers и PassengerRequestDetailPanel
- ФАП: импорт манифеста — parseManifestXlsx, ManifestUploadField, manifestCore
- Passenger Analytics Summary Charts
- Passenger Analytics Aggregation
- ФАП-аналитика: экспорт Excel (passengerAnalyticsExport)
- AddressField и геосаджест
- ФАП: профили манифеста (manifestProfiles, PLI, cleanFullName)
- groupsCount и linkedPeopleCount в аналитике по пассажирам
- Сессия и контексты: getCookie, useToast, useDialog, JWT
- ФАП: подбор групп — surnameForms, fapGroupSuggestions и общий корень фамилии
- Представители и доступ: Representative*DetailPage, useEffectiveAccessMenu, Main_Page и DeleteIcon
- ФАП (спеки): распознавание документа по фото, назначение номера и слияние панелей уведомлений
- Аналитика: Dispatcher/Hotel/Support Analytics, AnalyticsChart и DateRangePickerCustom
- Патч-ноуты: seedPatchNotes и patchNotes.data
- ФАП (спеки): распознавание документа по фото, назначение номера и слияние панелей уведомлений
- ФАП: трансфер — FapTransferPage и факт поездки
- SettingsSidebar: AccessPermissionsPanel, accessSections и слияние панелей доступа
- Договорный тариф АК: fapAirlineTariff и цена проживания ФАП
- Сутки проживания: effectiveCostDays и fapPersonDays
- ФАП: деньги отчёта — fapReportMoney и матчинг строк (reportRowMatch)
- Шапка и реестры договоров: Header, FapV2, RegisterOfContracts, Filter, Estafeta
- ФАП: профили манифеста (manifestProfiles, PLI, cleanFullName)
- Excel-даты и парсер массового импорта (excelDate, parseBulkXlsx)
- Цены авиакомпании: тарифы и география (airlineTariffPrices, airlineTariffGeography)
- Тарифы: Create/EditRequestTarifCategory, AirlineTarifs_tabComponent и MultiSelectAutocomplete
- Уведомления и бесконечный скролл (NotificationsSidebar, useInfiniteScroll)
- ФАП: FapDriverPage, FapWaterMealPage, fapConstants и массовое удаление получателей услуг
- Доступ по ролям: access.js (isSuperAdmin…), фильтр гостиниц show/active
- ФАП (спеки): гидрация заявки из ростера и пакетное заселение в PWA
- SettingsSidebar: уведомления — NotificationsPermissionsPanel, notificationSections, notificationPayload
- ФАП: роуты страниц, App.jsx и роли доступа (canAccessMenu, isHotelScoped, FapChat)
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
- Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08)
- Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08)
- Созвон 03.08.2026: конструктор расчёта отчётов (виды исчисления)
- ФАП-доки: оглавление FAP.md, FAP2.md, FAP-HANDOVER, FAP-DECISIONS
- Доки ФАП: FAP.md, FAP2.md, FAP-DECISIONS, FAP-HANDOVER
- ФАП-доки: FAP_SCOPE, withFapAuthGuard, ExternalUser и recognizePassengerDocument
- ФАП-доки: сеть characterization-тестов и разделение резолверов
- docs
- Авторизация: authService, authErrorLink (401 → logout) и TokenRefresher
- SettingsSidebar: AccessPermissionsPanel, accessSections и слияние панелей доступа
- Компании: Company, AirlineCompany_tabComponent, requests.js и decodeJWT
- UI-примитивы: Button, Sidebar, CloseIcon, MUIAutocomplete + формы компаний
- Шахматка v2: usePlacementData, placementTransforms и requestArchiveAccess
- Таблицы заявок: InfoTable и хелперы дат convertToDate / buildScheduledISO
- Шахматка v2: NewPlacementV2, utils и история версий
- CLAUDE.md / AGENTS.md: руководство и MUI-примитивы
- Трансфер: заказ (TransferOrder)
- Ключи accessMenu: menuAccess (roles.js) и README v12.14–v12.15
- Гостиницы по ролям: HotelPage, HotelAdminContent, hotelReadiness, AllRoles
- SettingsSidebar: accessPayload.js и история версий доступа
- SettingsSidebar: accessPayload.js и история версий доступа
- ФАП: шапка услуг FapHeaderActions и видимость услуг для гостиницы
- Отчёты v2 (доки): релиз v12.14 в README/CLAUDE — черновики и пороги суток
- Отчёты v2: правила расчёта суток (reportRules, ReportRulesSidebar)
- Отчёты v2: ReportDraftsPanel, reportDraftAge, reportDraftComment
- README: история версий
- README: история версий
- README: история версий
- README: история версий
- README: история версий
- README: история версий
- README: история версий
- README: история версий
- README: история версий
- README: история версий
- README: история версий
- README: история версий
- README: история версий
- README: история версий
- README: история версий
- README: версии v12.13–v12.14 и hotelAddress (composeHotelAddress)
- README: история версий
- README: история версий
- Меню ролей: MenuDispetcher, SuperAdminMenu и canSeeAnalytics
- ЛК гостиницы: hotelTransfer (hotelProvidesTransfer)
- Описание гостиницы: парсер hotelDescription и HotelPreview
- Сезонные цены категорий номеров (RoomKindSeasons)
- Цены трансфера: transferPrices.js и поиск по маршрутам
- Документация «Помощь»: DocumentationList1, дерево и левая панель
- Документация: локальное хранилище черновиков (docDraftStore, indexedDb, fileStore)
- Документация: редактор Tiptap и расширения
- Документация: загрузка файлов (UploadContext, imageDropPlugin)
- Резерв: ReservePlacement(Representative), ChooseHotel, AddRepresentativeBooking и чат резерва
- TravelLine: поиск, бронирование, синхронизация
- Резерв представителя: вкладки услуг (Habitation / Water / Power / Baggage) и DeleteIcon
- Таблицы InfoTable: InfoTableDataReserve*, Support, RepresentativeData и EditReserveDate
- Системные уведомления и патч-ноуты
- Вход и возврат по /login?next= (loginRedirect, LoginRedirect)
- О компании: HotelSettings, AirlineAbout, OrganizationAbout и иконки контактов
- Чаты и поддержка: Message, SupportPage, getMediaUrl
- Уведомления и бесконечный скролл (NotificationsSidebar, useInfiniteScroll)
- Гостиница: таблица бронирований (HotelTable, Booking, Placement)
- ФАП: карточка поставки — fapSupply, FapSupplyCard
- Документация: создание статей и обновлений (CreateRequestDocumentation, TextEditor)
- Страница гостиницы: HotelPage, роутинг по ролям, ссылка предпросмотра
- «О гостинице»: HotelAbout и иконки удобств
- Сезонные цены категорий номеров (RoomKindSeasons)
- Аналитика АК: AirlineAnalytics, мапперы и сортировка таблиц
- Отчёты v2: выпущенные отчёты, GraphQL и SegmentedToggle
- Отчёты v2: редактор черновика (ReportDraftEditor, поля, сортировка)
- Отчёты v2: черновик — reportDraftRows, useReportDraft
- Плашка техработ: MaintenanceBannerBar и useMaintenanceCountdown
- Системные уведомления и патч-ноуты
- Системные уведомления и патч-ноуты
- Безопасный HTML: sanitizeHtml, TextEditorOutput, InfoTableDataUpdates, HotelAboutRoomBlock
- Документация: правка обновлений (EditRequestUpdates), HotelAboutRoomBlock и TextEditorOutput
- package.json: метаданные и скрипты (dev, build, lint, preview)
- package.json: dependencies (Tiptap, MUI, DOMPurify)
- package
- package
- package
- package
- package
- package.json: dependencies (Tiptap, MUI)
- package
- package
- package
- package
- package.json: dependencies (Tiptap, MUI)
- package
- package
- package
- package
- package
- package
- package
- package
- package.json: dependencies (Tiptap, MUI)
- package
- package
- package
- package.json: dependencies (Tiptap, MUI)
- package
- package
- package
- ScriptRunner: плавающее окно — DraggableWindow, useDragResize, PickHighlight
- package
- package.json: dependencies (Tiptap, MUI)
- package
- package.json: dependencies (Tiptap, MUI)
- package
- package
- package
- package
- package
- ФАП: манифест из реестра и импорт (fapManifestBuild, ManifestImportModal)
- package.json: devDependencies (Vite, ESLint)
- Страницы АК и автопарка: AirlinePage, DriversCompanyPage, роутинг по ролям
- RoleContent: точки входа ролей (SuperAdmin/Dispatcher/Airline)
- Готовность отделов: airlineReadiness, dispatcherDepartmentReadiness, InfoTableData*Company
- Гостиница: таблица бронирований (HotelTable, Booking, Placement)
- Документация: Tiptap-панель, modalStacking, ImageViewer
- Документация: медиа-блоки редактора
- Документация: тулбар и экспорт в Office
- Документация: слэш-команды и блоки (blockRegistry, PlusButtonOverlay)
- Документация: якоря навигации (AnchorHashOverlay)
- Документация: перетаскивание блоков (BlockDragOverlay)
- Документация: выделение блоков (BlockSelectionOverlay, blockLassoSelection)
- Документация: ссылки — LinkModal и иконки
- Документация: файловый блок (fileBlockView, превью офисных файлов)
- Документация: галерея (galleryBlock) — раскладки и подгонка
- Документация: блоки цитаты и рамки (quoteBlock, frameBlock)
- Документация: высота строк таблицы (tableRowResizing)
- Документация: обёртка таблицы, перенос строк и колонок (tableWrapperView)
- Документация: импорт DOCX (docxImport.js)
- Svg-обёртка, иконки действий и меню «⋮»
- Документация: правка статей — EditRequestDocumentation и дерево блоков
- ФАП: скидки пачкой — FapDiscountDialog, fapDiscountZones
- ФАП: файлы манифеста — fapManifestFiles (имя загрузки, порядок, парсинг)
- ФАП: тесты книги отчёта Excel (buildReportSheets.test)
- ФАП: кеш формул Excel (formulaResults)
- «О гостинице»: редактор по разделам — HotelAboutEditor, AboutChecklist, AboutLaundry
- «О гостинице»: разбор описания по разделам (hotelAbout.js)
- «О гостинице»: галерея HotelAboutGallery
- Звёздность гостиниц: starRating, StarRatingFilter, parseStarValue
- Категории номеров: roomCategories и InfoTableDataTarifs
- Таблицы заявок: InfoTable и хелперы дат convertToDate / buildScheduledISO
- Отчёты v2: таблица черновика — ReportDraftTable, Summary, группировка по гостиницам
- Отчёты v2: строка черновика — ReportDraftRow, editorUtils, formatMoney
- ScriptRunner: константы действий и SVG-иконки панели (ACTION_TYPES, Icon*)
- ScriptRunner: компонент, сбор скриптов и экспорт (collectScripts, buildLibraryExportPayload)
- ScriptRunner: исполнение действий и DOM-хелперы (executeAction, setElementValue)
- ScriptRunner: импорт сценариев — parseImportPayload, migrateFromFlatFormat, isValidTree
- ScriptRunner: значения действий — случайные даты и время (resolveTypeActionValue)
- HotelPMS (мок-данные)
- Аналитика АК: сортировка таблиц — analyticsTableSortUtils
- ФАП: список заявок FapV2 и фильтры fapListFilters
- Шахматка v2: стили статусов, BoardToolbar, PlacementBarV2 и RoomRowV2
- Шахматка v2: период и шапка сетки (placementPeriod, GridHeader)
- ScriptRunnerContext и Layout (Empty)
- ФАП: манифест фиксированной ширины и ICAO (manifestFixedWidth)
- ФАП: тесты профилей манифеста
- Тарифы: Create/EditRequestTarifCategory, AirlineTarifs_tabComponent и MultiSelectAutocomplete

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

## Communities (235 total, 53 thin omitted)

### Community 4 - "ФАП: багаж и трансфер — FapBaggagePage, FapBaggageTripPage, FapTransferPage, FapSelect"
Cohesion: 0.04
Nodes (59): ФАП: карточка доставки багажа по составу реальных документов, Поле baggageTags (номера багажных бирок), Ловушка: скалярный список в composite-типе Prisma приходит null, Дата доставки как единственный признак завершённости, Строгий порядок выката: бэк → фронт, Итерация 2: поездка с несколькими пассажирами, Общий справочник VEHICLE_TYPES в fapConstants, Побочный эффект: метрика transferBaggage перестаёт быть нулевой (+51 more)

### Community 1 - "GraphQL: ядро запросов и формы заявок"
Cohesion: 0.02
Nodes (111): Своя багажная мутация updatePassengerRequestBaggageDriver, Ловушка: contractType обязателен в обеих живых подписках цен, Размещение заявки в гостинице (выбор города и отеля, ветка access), GET_MESSAGES_TRANSFER, GET_TRANSFER_REQUESTS, CREATE_TRANSFER_REQUEST_MUTATION, UPDATE_DRIVER_WITH_PHOTO_MUTATION, CREATE_ORGANIZATION (+103 more)

### Community 8 - "ФАП: реестр и группы пассажиров"
Cohesion: 0.05
Nodes (62): GroupChip: гибридная кодировка связи (цвет + иконка + слово), Пять SVG-иконок типов связи в shared/icons, Handoff prompt: FAP passenger groups (2026-07-22), Passenger groups execution invariants (hard constraints), Спека: группы пассажиров + требование вида размещения, Группы пассажиров (PassengerRequestGroup): 5 типов + уровень «вместе», placementRequirement — требование вида размещения на человеке, Ловушка allowlist в normalizeSavedPerson/mergeSavedPerson (+54 more)

### Community 0 - "ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms"
Cohesion: 0.03
Nodes (109): Отчёт: чипы групп в шапке номера (вариант Y), Отчёт: точка группы в строке гостя, Гейт видимости ворнингов групп: метки всем, ⚠ только canEdit, Инварианты рендера групп в FapHotelPage, Отчёт по гостинице: режимы Просмотр / Редактирование, FapReportView — read-only детализация отчёта, FapModeToggle — сегмент Просмотр/Редактирование, Spec: FAP hotel tariff billing mode «Койко-место»/«Номер» (2026-07-21) (+101 more)

### Community 153 - "Цены авиакомпании: тарифы и география (airlineTariffPrices, airlineTariffGeography)"
Cohesion: 0.33
Nodes (6): Исключение занятых аэропортов между договорами авиакомпании, «Выбрать всё» уважает getOptionDisabled, Подсказка о пропущенных аэропортах, Занятые аэропорты выводятся на клиенте из пропа addTarif, Ловушка: Create-опции по id, Edit-опции по value, SELECT_ALL_OPTION

### Community 14 - "ФАП: FapDetail, FapHeaderActions, FapOverflowMenu и файлы манифеста"
Cohesion: 0.08
Nodes (38): Шапка Вариант B: одна primary-кнопка + overflow «⋯», Отклонение от макета: у авиакомпании остаются «История» и chip «Реестр», Единая шапка действий услуг ФАП, Правила видимости пунктов «Отчёт» и «История», Модуль FAP (FapV2) — заявки на пассажирские услуги, FapDetail — переходы статусов CREATED → ACCEPTED → IN_PROGRESS → COMPLETED, v12.3 — запуск ФАП v2, STATUS_TRANSITIONS (+30 more)

### Community 38 - "Реестр договоров: таблица InfoTableAllDataTarifs, ДС-поповер и архив"
Cohesion: 0.10
Nodes (21): Spec: Contract registry frontend edits (2026-07-07), Contract registry frontend edits (6 changes, front-only), Rationale: registry edits need zero backend change, «ДС: N» badge + agreements popover in the registry list, Prolongation chip in the contract list row, Unified expiration badge helper (getExpirationBadge), Rename «Вид приложения» → «Предмет договора» (airline-only), Active filters badge on the «Фильтры» button (+13 more)

### Community 16 - "Реестр договоров: фронт-правки (ДС-бейдж, пролонгация, истечение)"
Cohesion: 0.10
Nodes (39): ДС end date + prolongation + archive/restore, «Архив ДС» tab (client-side active/archived split), Rationale: DeleteComponent in the list, useDialog confirm() in the forms, getMediaUrl(), GET_ORGANIZATION_CONTRACT, UPDATE_ORGANIZATION_CONTRACT, GET_DOCUMENTATION, CREATE_AIRLINE_CONTRACT (+31 more)

### Community 11 - "ФАП: книга Excel — листы воды/питания, багажа и трансфера (buildReportSheets)"
Cohesion: 0.08
Nodes (64): Rationale: XLSX export needs no change under PER_ROOM, Белый список hotelIndexes в пяти точках выгрузки XLSX, Excel-лист проживания: 22 колонки, дата рейса в шапке, единый экспортёр, Удаление легаси-контура отчёта: FapReport, маршрут report/:hotelIndex, SheetJS-экспорт, Колонка «Перевезено» в Excel-листе трансфера (сдвиг «Суммы» I→J), Excel-отчёт: колонка «Ланчбокс» (23 → 24) и SUMPRODUCT в итогах, Приоритет plannedFromAt над plannedAt в дате заезда Excel, v12.13 — ланчбокс и количества приёмов пищи, выгрузка до 24 колонок (+56 more)

### Community 34 - "ФАП-аналитика: PassengerAnalytics и мапперы"
Cohesion: 0.09
Nodes (32): Spec: «Пассажиры» filters modal restyle, stage G (2026-07-24), Sectioned passenger filters modal (Период / Статусы / Параметры), Decade preset highlight via sameRange day comparison, Rationale: AirlineAnalytics.module.css must not be touched, Спека: визуальный полиш «Пассажиры → По заявкам» (этап E, 2026-07-24), План: визуальный полиш аналитики по заявкам (5 задач), Список «По заявкам»: 14 колонок → 6 двухэтажных, Зебра по индексу map, а не через nth-child (+24 more)

### Community 84 - "ФАП (спеки): единый реестр пассажиров и отправка отчёта на проверку"
Cohesion: 0.11
Nodes (19): Спека: отчёт ФАП открывается АК только после «Отправить на проверку» (2026-07-31), План реализации: «Отправить на проверку» (7 задач, бэк→фронт), Отправка отчёта по проживанию на проверку (гейт видимости для АК), Поле submittedAt на PassengerRequestHotelReport + мутация submitPassengerRequestHotelReport, Сброс флага отправки только при реально изменившихся строках, Кнопка «Скрыть» и мутация hidePassengerRequestHotelReport (дополнение того же дня), Ловушки реализации гейта отчёта, Три новых поля строки отчёта: tariffName, pricePerDay, placementKind (+11 more)

### Community 12 - "ФАП: доступ к отчёту и стадии — fapReportAccess, fapReportStages, FapLivingPage"
Cohesion: 0.08
Nodes (49): fapReportAccess — единственное правило видимости отчёта, v12.14 — отчёт по гостинице открывается АК после «Отправить на проверку» (submittedAt), v12.14 — изоляция данных ФАП по гостинице (isHotelScoped / scopedHotelId / canSeeExternalLinks), v12.15 — согласование цен отчёта по проживанию ФАП (fapReportAccess.js, hideMoney для АК до approve), v12.15 — деньги отчёта скрыты от гостиницы (hideMoney, preserveMoneyFields), initials(), FapLivingPage(), HotelCard() (+41 more)

### Community 161 - "ФАП: импорт манифеста — parseManifestXlsx, ManifestUploadField, manifestCore"
Cohesion: 0.40
Nodes (5): Гейт только клиентский — серверной фильтрации reportRows не будет, Спека: проверка соответствия рейса манифеста рейсу заявки (2026-07-22), План: проверка рейса манифеста (5 задач), Проверка расхождения рейса манифеста и рейса заявки, Предупреждение + подтверждение вместо жёсткого блока

### Community 149 - "Реестры договоров: Hotel/Airline/Organization RegisterOfContracts, DeleteComponent и фильтры"
Cohesion: 0.29
Nodes (7): Спека: фильтр гостиниц по видимости (show) и активности (active) (2026-07-15), План: фильтр гостиниц active/show (6 задач), Фильтр списка гостиниц по show/active + бейджи состояния, SegmentedToggle — generic переключатель взаимоисключающих значений, Гейтинг по роли вместо User.dispatcher (вариант B), Точное совпадение фильтра на бэке + fail-closed отправка полей, GET_HOTELS

### Community 99 - "ФАП-аналитика: passengerAnalyticsMappers и PassengerRequestDetailPanel"
Cohesion: 0.24
Nodes (14): HotelStatusBadge — пилюля «Неактивна»/«Скрыта», PassengerRequestDetailPanel — плитки услуг + чипы в палитре ФАП, D3 (per-passenger аналитика) отменён владельцем, formatNights/formatMoneyShort переезжают в passengerAnalyticsMappers, Frontend: 2 new columns, accordion row detail, 2 KPI tiles, 2-sheet XLSX, RowTotal(), num(), joinParts() (+6 more)

### Community 46 - "ФАП: импорт манифеста — parseManifestXlsx, ManifestUploadField, manifestCore"
Cohesion: 0.14
Nodes (22): isSameFlight/normalizeFlightNumber — нечёткое сравнение номеров рейсов, manifestCore.js — shared engine (normHeader, detectProfile, extractPeople), Preserved parser contract: {people, flightNumber, error} + manifestNameKey re-export, Блок загрузки манифеста ManifestUploadField, Младенцы на руках: счётчик на сопровождающем (хук lapInfants), ManifestImportModal(), ManifestUploadField(), CYR_TO_LAT (+14 more)

### Community 112 - "Passenger Analytics Summary Charts"
Cohesion: 0.14
Nodes (14): Спека: сводки по измерениям в аналитике по пассажирам (этап D1, 2026-07-23), План: сводки по измерениям (D1, 3 задачи), Режим «Сводки» во вкладке «Пассажиры» (по аэропортам/АК/месяцам), Агрегация на фронте — бэк не трогаем, Спека: единый поток аналитики «Пассажиры» (этап F), Единый скролл вкладки «Пассажиры» вместо тумблера режимов, Инварианты этапа F: фронт-only, ровно 3 файла, Спека: графики в аналитике по пассажирам (этап D2) (+6 more)

### Community 92 - "Passenger Analytics Aggregation"
Cohesion: 0.20
Nodes (17): buildSummary — движок агрегации сводок (passengerAnalyticsAggregations), Месяц считается сдвигом +3ч (МСК), а не по локали браузера, Семантика counted/all в сводках = семантика KPI-тоталов, buildChartData: топ-8 + «Прочие», исключение бакета без даты, МСК-границы периода аналитики (resolvePeriodBounds), Инвариант: гибрид периода и Mongo-грабля не трогаются, Программа доработки аналитики: этапы A→D, round2() (+9 more)

### Community 119 - "ФАП-аналитика: экспорт Excel (passengerAnalyticsExport)"
Cohesion: 0.33
Nodes (11): Выгрузка текущей сводки одним листом XLSX, Экспорт полного отчёта одной книгой (5 листов), Номер заявки в таблице и в листах Excel (сдвиг колонок), statusLabel(), SUMMARY_SHEETS, fillSummarySheet(), fillRequestsSheet(), fillHotelsSheet() (+3 more)

### Community 19 - "AddressField и геосаджест"
Cohesion: 0.08
Nodes (39): Spec: AddressField / YandexMapModal address data integrity (2026-07-14), AddressField query/anchor state model with lastEmittedRef echo detection, useAddressSuggestions hook (debounce + generation counter + accept), useReverseGeocode hook (generation counter + pending-coords buffer, ymaps in state), Geocoder contract change: {address, approximate} instead of '≈' baked into the string, Trap: anchor must be read via ref and kept out of the search effect deps, Decision: delete the Search/Map toggle and browser geolocation entirely, Deferred: YMaps provider, focus-trap/Escape, ARIA and dead CSS defects (+31 more)

### Community 144 - "ФАП: профили манифеста (manifestProfiles, PLI, cleanFullName)"
Cohesion: 0.25
Nodes (8): Spec: FAP multi-format manifest parsing via profiles (2026-07-07), Manifest format profiles (data-described formats + header auto-detection), PM and PNL profiles (two opposite age-category mechanics), Trap: remark tokens lie — INFT sits on the accompanying adults, Decision: PNL row anchor is a valid category code, not the registration number, Verification by Node scripts against real sample files (no frontend test runner), PAX_CATEGORY, PROFILES

### Community 98 - "groupsCount и linkedPeopleCount в аналитике по пассажирам"
Cohesion: 0.13
Nodes (17): Spec: passenger analytics money/people detail pack, stage B (2026-07-23), Analytics detail pack: 18 new per-request scalars + 8 new totals, PassengerAnalyticsHotelBreakdown (live headcount vs report snapshot), Transfer split invariant: round2(arrival+departure+baggage+intercity) == transfer, Invariant: ghost report rows excluded from every new reportRows sum, Legacy fallbacks: personCategory null → ADULT, meal count ?? (price>0 ? 1 : 0), Deploy gate: backend first, frontend second (widened selection breaks old backend), Спека: аналитика ФАП — сводная таблица по заявкам (v1) (+9 more)

### Community 3 - "Сессия и контексты: getCookie, useToast, useDialog, JWT"
Cohesion: 0.08
Nodes (69): Дата рейса (flightDate) сквозняком: формы, деталка, карточка списка, шапка Excel, TZ off-by-one: рейс 1-го числа выпадал из обоих месяцев, Поток создания заявки (sidebar → мутация → подписка → refetch), Проверка на дубликаты заявок при создании, CREATE_DRIVER_MUTATION, CREATE_REQUEST_MUTATION, CREATE_PASSENGER_REQUEST, GET_PASSENGER_REQUESTS (+61 more)

### Community 51 - "ФАП: подбор групп — surnameForms, fapGroupSuggestions и общий корень фамилии"
Cohesion: 0.12
Nodes (24): Спека: распознавание женской формы фамилии в подсказках групп ФАП (2026-07-28), canonicalSurname — общий бесполый корень фамилии (латиница и кириллица), familyLabel — русский плюрал семьи с обратным транслитом (best-effort), sameStem и defaultGroupLabel переписаны через canonical (снят гейт CYRILLIC_RE), Гейтинг подсказок (соседние места / ребёнок) намеренно не меняется, Тесты морфологии на встроенном node --test (TDD, без новых зависимостей), Зеркало бэкового normalizeFullNameKey на фронте (manifestNameKey), Подсказки групп из манифеста (фронт-only, без персиста) (+16 more)

### Community 30 - "Представители и доступ: Representative*DetailPage, useEffectiveAccessMenu, Main_Page и DeleteIcon"
Cohesion: 0.11
Nodes (28): Спека: приоритет доступа должность>отдел везде — общий хук useEffectiveAccessMenu (2026-07-08), Баг: роут-компоненты считали доступ только из отдела, игнорируя должность, useEffectiveAccessMenu(user) — единый источник резолюции, мёрж { ...отдел, ...effective }, effectiveAccessMenu — переопределения по должности, считается на бэке, v12.13 — useEffectiveAccessMenu в роут-компонентах, отчёты открыты авиакомпаниям, v12.15 — canManageAirlineAccess и resolveEffectiveAccessMenu в utils/access.js, GET_USER_EFFECTIVE_ACCESS_MENU, ADD_PASSENGER_REQUEST_DRIVER_PERSON (+20 more)

### Community 131 - "ФАП (спеки): распознавание документа по фото, назначение номера и слияние панелей уведомлений"
Cohesion: 0.22
Nodes (10): Спека: распознавание документа с фото (RepresentativePWA), Распознавание документа по фото (путь без штрихкода), Выбор связки Vision OCR → YandexGPT (Конфиг A), Мутация recognizePassengerDocument + тип RecognizedPassengerDoc, Контракт деградации: распознавание никогда не роняет поток, Единый объект boarding для фото- и штрихкод-пути, ScanTabs + DocumentPhotoScanner и редактируемое ФИО, Нормализация полей и эвристика confidence (+2 more)

### Community 76 - "Аналитика: Dispatcher/Hotel/Support Analytics, AnalyticsChart и DateRangePickerCustom"
Cohesion: 0.19
Nodes (15): Аддитивное расширение AnalyticsChart: case stackedBar + pieValueFormat, GET_DISPATCHERS, GET_ANALYTICS_AIRLINE_REQUESTS, GET_ANALYTICS_USERS, barDensityProps(), groupedSeriesDataIsEffectivelyEmpty(), simpleBarDataIsEffectivelyEmpty(), AnalyticsChart() (+7 more)

### Community 85 - "Патч-ноуты: seedPatchNotes и patchNotes.data"
Cohesion: 0.15
Nodes (16): Спека: backfill патч-ноутов 3.2.0 → 4.3.0, Backfill публичных патч-ноутов из README-чейнджлога, Переработка нумерации: patch-компонент вместо только minor, Два идемпотентных способа заливки патч-ноутов, v12.15 — патч-ноут 4.4.0 и шаблон «Что нового» (patchNotes.data.mjs, systemUpdate.data.mjs), CREATE_PATCH_NOTE, args, DRY_RUN (+8 more)

### Community 126 - "ФАП (спеки): распознавание документа по фото, назначение номера и слияние панелей уведомлений"
Cohesion: 0.18
Nodes (11): Узкая мутация assignPassengerRequestHotelRoom, Ловушка: updatePassengerRequestHotelPerson затирает поля гостя, Одиночное и пакетное присвоение номера через одну мутацию, Потеря полей гостя в updatePassengerRequestHotelPerson, Объединение трёх панелей уведомлений отдела, Мёртвые чекбоксы каналов на легаси-страницах, Затирание канальных флагов в true при частичном payload, Инъекция CSS-модуля пропом styles + showBulkToggle (+3 more)

### Community 138 - "ФАП: трансфер — FapTransferPage и факт поездки"
Cohesion: 0.25
Nodes (9): Привязка поездки трансфера ФАП к гостинице (hotelItemId), Поле «перевезено N» на поездке (transportedCount), Ослабление guard патча водителя: COMPLETED разрешён, режется только CANCELLED, Фильтр «Гостиница» и предвыбор заселённых в CatalogPickerModal, Порядок выката: бэк → фронт (новые поля трансфера), Отклонения при исполнении плана трансфера (одобрены ревью), 7 аддитивных полей строки отчёта (counts, ЛБ-флаги, lunchboxPrice), PWA: ввод «перевезено N» — диалог у водителя и поле у представителя (+1 more)

### Community 79 - "SettingsSidebar: AccessPermissionsPanel, accessSections и слияние панелей доступа"
Cohesion: 0.19
Nodes (17): Единая AccessPermissionsPanel с пропами granularity/styles/sections/showBulkToggle, Конфиг секций прав accessSections.js (секции как данные), Стили инъекцией пропом styles вместо общего CSS, В режиме detailed нет каскада «доступ гасит действия», Отложено: слияние панелей уведомлений и расхождение organization/contracts, Конфиг секций уведомлений и правило имён каналов, Пробел: секция «Брони» не показана ни одной панелью, Вкладка «Доступ» (+9 more)

### Community 75 - "Договорный тариф АК: fapAirlineTariff и цена проживания ФАП"
Cohesion: 0.15
Nodes (19): Тонкий источник стоимости ФАП (агрегируем сохранённое), costMissing / missingCostCount — заявки без посчитанной стоимости, Спека: цены авиакомпании как источник тарифа в проживании ФАП, Договорный тариф АК как источник цены проживания ФАП, Сопоставление 13 категорий номера с полями ценника АК, «Ноль остаётся нулём» — незаполненная категория не подменяется, Договорная цена живая, а не замороженная в отчёте, Географические («общие») ценники АК в ФАП не подбираются (+11 more)

### Community 137 - "Сутки проживания: effectiveCostDays и fapPersonDays"
Cohesion: 0.36
Nodes (6): Отдельная функция вместо флага-режима у существующей, calculateEffectiveCostDays(arrival, departure) — эффективные сутки с частичными, v11.11 (10.03.2026), v11.11 — появление эффективных суток (effectiveCostDays.js), v12.14 — calculateCostDaysByDuration: минимум сутки, +0,5 за каждый начатый 12-часовой блок, calculateEffectiveCostDays()

### Community 54 - "ФАП: деньги отчёта — fapReportMoney и матчинг строк (reportRowMatch)"
Cohesion: 0.16
Nodes (23): Спека: пакет качества отчёта ФАП (personId, период, мелкие фиксы), personId в строках отчёта и единый матчинг строк к гостям, toNum(), lunchboxCountOf(), rowFoodCost(), isPersonRow(), frozenFieldsOf(), withoutTypename() (+15 more)

### Community 2 - "Шапка и реестры договоров: Header, FapV2, RegisterOfContracts, Filter, Estafeta"
Cohesion: 0.07
Nodes (68): Фильтр по периоду в списке заявок ФАП (/far), normalize(), DRIVERS_QUERY, GET_ORGANIZATIONS, DELETE_ORGANIZATION_TRANSFER_PRICE, GET_ORGANIZATION_CONTRACTS, DELETE_ORGANIZATION_CONTRACT, ARCHIVE_AIRLINE_CONTRACT (+60 more)

### Community 47 - "ФАП: профили манифеста (manifestProfiles, PLI, cleanFullName)"
Cohesion: 0.14
Nodes (26): Захват номера рейса с пробелом в PNL-манифесте, Спека: третий формат манифеста ФАП — PLI (выгрузка DCS), Профиль манифеста PLI (третий формат после ПМ и PNL), Хуки профиля readName/readSeat + firstLine для многострочных ячеек, v12.13 — реестр пассажиров ФАП (FapRegistryPage), группы и профили манифестов (ПМ, ПНЛ), v12.14 — манифест ПЛИ, младенцы отдельными строками, excelDate.js, v12.15 — форматы манифеста: фиксированная ширина, ICAO, Руслайн (шесть профилей), s() (+18 more)

### Community 106 - "Excel-даты и парсер массового импорта (excelDate, parseBulkXlsx)"
Cohesion: 0.24
Nodes (13): Спека: импорт пассажирского манифеста (ПМ) в каталог заявки ФАП, Импорт пассажирского манифеста (форма ПМ) в каталог savedPassengers, Парсер формы ПМ на фронте (parseManifestXlsx), Отклонение от спеки: автоподстановка № рейса только при создании, Вне скоупа импорта манифеста ПМ, pad(), s(), excelSerialToParts() (+5 more)

### Community 31 - "Цены авиакомпании: тарифы и география (airlineTariffPrices, airlineTariffGeography)"
Cohesion: 0.14
Nodes (32): Спека: тип заявки на ценниках АК + адрес аэропорта, «Применяется к» — AirlinePrice.contractType (request / fap / all), Правила конфликтов локаций по типу заявки (conflictingContractTypes), Снятие конфликтующих выборов при смене типа (доработка по ревью), Фильтр contractType при подборе цены в карточке заявки экипажа, ContractTypeToggle с произвольным набором вариантов (проп options), v12.13 — договоры АК индивидуальные / общие (contract-type split), airlineTariffPrices.js, v12.14 — «Применяется к» (contractType) у цен АК, адрес у аэропортов (+24 more)

### Community 32 - "Тарифы: Create/EditRequestTarifCategory, AirlineTarifs_tabComponent и MultiSelectAutocomplete"
Cohesion: 0.10
Nodes (27): Распознавание ошибок бэкенда про аэропорт (extractGeoConflictMessage), GET_AIRPORTS_RELAY, UPDATE_HOTEL_TARIF, UPDATE_AIRLINE_TARIF, DELETE_AIRLINE_CATEGORY, DELETE_AIRLINE_TARIFF, DELETE_AIRLINE_PRICE, UPSERT_REPORT_PARTIAL_DAY_SETTING (+19 more)

### Community 113 - "Уведомления и бесконечный скролл (NotificationsSidebar, useInfiniteScroll)"
Cohesion: 0.20
Nodes (12): Спека: бесконечный скролл в списке заявок ФАП (/far), Бесконечный скролл списка заявок ФАП (страница 30), refreshWindow() — перезапрос всего загруженного окна одним запросом, Ловушка: сентинел внутри грида нужно обернуть в grid-column: 1 / -1, v12.9 (28.06.2026), v12.9 — единый FilterPopoverButton и useInfiniteScroll, v12.13 — список /far на бесконечном скролле, refreshWindow() в useInfiniteScroll, extractRootNodes() (+4 more)

### Community 10 - "ФАП: FapDriverPage, FapWaterMealPage, fapConstants и массовое удаление получателей услуг"
Cohesion: 0.06
Nodes (49): recomputeServiceStatus(prev, prevCount, nextCount) — единый пересчёт статуса услуги ФАП, Правила переоткрытия статуса услуги при изменении числа людей, Living и baggage добавлены в пересчёт статуса при правке плана (осознанная смена поведения), Update-мутации персон намеренно не трогаются, Массовые мутации удаления: removePassengerRequestPeople и removePassengerRequestDriverPeople, normalizeBulkIndexes + spliceAtIndexes: валидация до изменений, пачка целиком или никак, Уведомление авиакомпании при массовом удалении НЕ шлётся, Факт трансфера считается через transferFactCount, а не по длине списка людей (+41 more)

### Community 40 - "Доступ по ролям: access.js (isSuperAdmin…), фильтр гостиниц show/active"
Cohesion: 0.14
Nodes (25): Персист состояния вкладок аналитики (обе смонтированы), Экскурс: Эскадрилья и система заявок в KARS-AVIA CRM, Эскадрилья (модуль заявок на размещение экипажа), Права доступа к заявкам через accessMenu, AirlineRegisterOfContracts(), Estafeta(), ExistRequest(), HotelRegisterOfContracts() (+17 more)

### Community 148 - "ФАП (спеки): гидрация заявки из ростера и пакетное заселение в PWA"
Cohesion: 0.29
Nodes (7): Правило: пачка = один read-modify-write, Пакетное заселение из реестра в PWA (useCatalogAdd), Гидрация заявки ФАП из ростера savedPassengers, Backend-propagation правки идентичности в ростер, Отклонение от спеки: propagation на бэке вместо маршрутизации на фронте, Backfill personId и ростера для исторических заявок, Граница: единство пассажира только через каталог

### Community 93 - "SettingsSidebar: уведомления — NotificationsPermissionsPanel, notificationSections, notificationPayload"
Cohesion: 0.25
Nodes (12): Общий buildNotificationPayload на 30 ключей, Вкладка «Уведомления», Структура строки уведомления (текст → MUISwitch → почта → браузер), EMPTY_MENU, NotificationsPermissionsPanel(), NotificationRow(), NOTIFICATION_SECTIONS, NOTIFICATION_MASTER_KEYS (+4 more)

### Community 7 - "ФАП: роуты страниц, App.jsx и роли доступа (canAccessMenu, isHotelScoped, FapChat)"
Cohesion: 0.06
Nodes (57): Страница поездки доставки багажа, v12.14 — reopenPassengerRequestService, «Вернуть в работу», гейт reserveUpdateCompleted, REQUEST_RESET_PASSWORD, RESET_PASSWORD, VERIFY_EMAIL, GET_PASSENGER_REQUEST_CHATS, PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, GET_PASSENGER_REQUEST (+49 more)

### Community 90 - "Шахматка (док): точка входа HotelShahmatka, гейты доступа и v1"
Cohesion: 0.18
Nodes (18): Голый маршрут /newPlacementV2/:idHotel — ни одного пропса, Цепочка accessMenu рвётся до таба шахматки, roles в модуле используются только для пикселей, PlacementDND v1 недостижим, но остаётся в бандле, Вопрос: CurrentTimeIndicator из v1 выброшен намеренно?, Вопрос: можно ли удалять PlacementDND/?, Шахматка v1 (PlacementDND) — недостижимая из маршрутов, Гейты доступа шахматки (canAccessMenu requestMenu) (+10 more)

### Community 105 - "Геометрия сетки (dayWidth, rowHeight = 50 × places)"
Cohesion: 0.23
Nodes (16): DAY_WIDTH = 40 живёт двумя жизнями: стартовый стейт и масштаб сайдбара, Расхождение 228 против 220 между шапкой и телом, Дефект: ResizeObserver пересоздаётся на каждом рендере, Дефект: containerRef пишут строка и все ячейки дня, Дефект: document-слушатели resize переживают unmount, Ноль содержательных медиазапросов и нет тач-поддержки, Дубликат: 50 * room.type и голая 50, Шов: хук usePlacementGeometry (+8 more)

### Community 91 - "Известные расхождения шахматки с конвенциями репозитория"
Cohesion: 0.14
Nodes (18): Горизонтальная координата дропа не читается никогда, Дефект: resize не валидирует порядок дат, Дефект: заблокированный по isOverlap resize всё равно открывает модалку, Дубликат: блок resize-ручки — 2 дословные копии, Отклонение: инлайн sx вместо CSS-модулей, Отклонение: собственная очередь тостов вместо useToast, Отклонение: нативный alert() вместо useDialog/MUIConfirm/MUIAlert, Отклонение: сырой MUI Button вместо Standart/Button (+10 more)

### Community 110 - "Шахматка v2 (док): DraggableRequestV2, RoomRowV2, дефекты resize и дат"
Cohesion: 0.21
Nodes (14): Дефект: resize сдвигает дату на сутки, Дефект: resize срабатывает без движения мыши, Дефект: по размещённой плашке нельзя открыть карточку заявки, Дефект: нарушение правил хуков в RoomRowV2, Дефект: простое наведение перерисовывает всю доску, ОПРОВЕРГНУТО: дубль useDraggable с тем же id в DragOverlay, ОПРОВЕРГНУТО: круг «UTC-цифр» внутри модуля рассогласован, Дубликат: сборка new Date(`${date}T${time}`) — 10 мест (+6 more)

### Community 96 - "Шахматка v2 (док): оркестр NewPlacementV2, плашка и правая панель"
Cohesion: 0.17
Nodes (17): Дефект: AddPassengersModalV2 недостижима, Дефект: запросы AddPassengersModalV2 уходят без skip, Дефект: отменённая бронь всегда возвращается в сайдбар эскадрильи, Дефект: пустое состояние сайдбаров проверяет нефильтрованный массив, Дубликат: «Заявок не найдено» — 3 копии, Шов: компонент ReservePanel, NewPlacementV2.jsx — оркестратор (1701 строка, 52% модуля), AddPassengersModalV2 — пассажир/сотрудник в резерв (284 строки) (+9 more)

### Community 60 - "Placement Dead Code Defects"
Cohesion: 0.17
Nodes (24): Дефект: заявку можно бросить в отключённую комнату, Дефект: нет onDragCancel — доска залипает в перетаскивании, Дефект: молчаливые провалы мутаций, Дефект: сдвиг койки внутри номера жёстко пишет status done, Клавиатурный drag-and-drop живёт по случайности, Кластер мёртвого кода модуля, Дубликат: блок оптимистичной вставки — 3 копии, Дубликат: сборка hotelChesses — 3 разошедшиеся копии (+16 more)

### Community 111 - "Шахматка v2 (док): виртуализация строк и buildFilteredRooms"
Cohesion: 0.22
Nodes (14): Дефект: рендерный TypeError при активном поиске, Дефект: мемоизация обнулена свежими Date вне мемо, Дефект: поиск матчит requestID, а показывается requestNumber, ОПРОВЕРГНУТО: getRoomHeight/itemKey падают на сжимающемся списке, Дубликат: eachDayOfInterval по месяцу — 4 раза за рендер, Вопрос: room.requests из buildFilteredRooms предполагался источником рендера?, placementFilters — поиск и сборка filteredRooms, Виртуализация строк (VariableSizeList) (+6 more)

### Community 57 - "SHAHMATKA ARCHITECTURE"
Cohesion: 0.13
Nodes (25): Дефект: getOverlappingRequests разыменовывает draggedRequest без защиты, Дефект: три документа пишут одно поле кэша hotel({id}), ОПРОВЕРГНУТО: эффект usePlacementData:329 зацикливается, Оценка точности SHAHMATKA_ARCHITECTURE.md, Дубликат: маппер пассажиров резерва — 2 копии по ~55 строк, Правка: открепить квоту и резерв в шахматке, Шахматка v2 — timeline-календарь размещения, usePlacementData — весь слой данных шахматки (+17 more)

### Community 109 - "Шахматка v2 (док): пересечения — placementOverlap и hasOverlap"
Cohesion: 0.29
Nodes (15): Дефект: окно двойного бронирования после подтверждения, Дубликат: предикат пересечения — 4 копии, Отклонение: ноль тестов при чистой доменной логике, Инвариант: hasOverlap и getOverlappingRequests не взаимозаменяемы, Инвариант: getAvailablePosition возвращает undefined, а 0 — валидный ответ, Инвариант: интервалы полуоткрытые [in, out) во всех четырёх копиях, placementOverlap — две проверки пересечений, placementPositions.getAvailablePosition — выбор свободной койки (+7 more)

### Community 74 - "Шахматка v2 (док): статусы и цвета — translateStatus, дубли карты статус→цвет"
Cohesion: 0.15
Nodes (21): Дефект: handleSaveChanges отправляет status: "" для нераспознанного статуса, Дефект: оптимистичный дроп не удаляет карточку из newRequests, Дефект: статус резолвится по наличию chess.request, а не по значению, Русская строка статуса используется как ключ карты цветов, Дубликат: карта статус→цвет — 4 копии, Шов: единый словарь статусов на enum-ключах, Вопрос: удалять translateStatus в пользу roles.js?, Цвета статусов и расхождение translateStatus с roles.js (+13 more)

### Community 118 - "Placement Board Data Mapping"
Cohesion: 0.27
Nodes (12): Дефект: EditRequestNomerFond из шахматки получает урезанную комнату, Дефект: hotelChess с room: null исчезает бесследно, Отклонение: ~120 строк инлайн-JSX внутри колбэка VariableSizeList, Шов: компонент RoomLabelCell, Инвариант: сортировка mapRooms выживает только как tiebreak, Инвариант: инверсию room.id = имя / room.roomId = id нельзя потерять, Вопрос: hotelChess с room: null — реальное состояние бэка?, placementTransforms — сервер → «карточка размещения» (+4 more)

### Community 107 - "Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08)"
Cohesion: 0.17
Nodes (15): Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08), Правка: список заявок ФАП в учётке гостиницы — только заявки, где выбрана эта гостиница, Правка: во вкладке «О гостинице» показывать контакты самой гостиницы, Правка: убрать поле «рейтинг» из настроек гостиницы, Правка: убрать поле «скидка» из настроек гостиницы, Правка: убрать переключатель «видимость гостиницы» из настроек в учётке гостиницы, Правка: раздача ролей пользователям гостиницы (как у диспетчера и авиакомпании), Заметка: отчёты по эскадрилье в учётке гостиницы не проверены (+7 more)

### Community 127 - "Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08)"
Cohesion: 0.25
Nodes (10): Правка: услугу «трансфер» в заявке ФАП скрыть от гостиниц, не оказывающих трансфер, Правка: трансферные тарифы во вкладке «Тарифы» гостиницы — только если гостиница сама оказывает трансфер, SERVICE_KEYS, mealLabels, transferLabels, fmt(), fmtWithVat(), declension() (+2 more)

### Community 139 - "Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08)"
Cohesion: 0.25
Nodes (9): Правка: в проживании ФАП показывать гостинице тариф по договору Карс Авиа↔гостиница, Правка: во вкладке «Номера» показывать цены гостиницы, а не цены для авиакомпании, Правка: во вкладке «Тарифы» раздела «О гостинице» показывать тарифы гостиницы, а не авиакомпании, Выбор источника тарифа проживания, Расчёт по койко-местам или по номерам, Цена за одного в двухместном номере, Сезонность и сроки действия тарифов, Баг: тариф из гостиницы не считает проживание (+1 more)

### Community 70 - "Созвон 03.08.2026: конструктор расчёта отчётов (виды исчисления)"
Cohesion: 0.13
Nodes (22): Созвон 03.08.2026: конструктор расчёта отчётов, Виды исчисления проживания, Часовая оплата — для АК «Россия», Скидки на проживание, Виды исчисления трансфера, Выбор тарифа трансфера, Расчёт по людям на авто или по авто, Скидки на авто (+14 more)

### Community 159 - "ФАП-доки: оглавление FAP.md, FAP2.md, FAP-HANDOVER, FAP-DECISIONS"
Cohesion: 0.50
Nodes (5): FAP-DECISIONS.md — decision history, Decision: baggage = trip with per-passenger tags and prices, FAP-HANDOVER.md — module handover to backend dev, FAP.md — backend documentation, FAP2.md — frontend documentation

### Community 43 - "Доки ФАП: FAP.md, FAP2.md, FAP-DECISIONS, FAP-HANDOVER"
Cohesion: 0.08
Nodes (30): Decision: no embedded→relational rewrite, Decision: report opens to airline only on submit, Decision: pin figures only in submitted reports, Decision: FAP days rules (duration, manual override, evictions), Decision: billing mode belongs to tariff (PER_BED/PER_ROOM), Decision: airline contract prices as third tariff source, Decision: personId is the identity canon, Decision: overbooking allowed, no hard blocks in FAP (+22 more)

### Community 125 - "ФАП-доки: FAP_SCOPE, withFapAuthGuard, ExternalUser и recognizePassengerDocument"
Cohesion: 0.18
Nodes (11): Decision: row-level authorization, not content filtering, Decision: observation mode before hard enforcement, Constraint: role middleware ban in FAP, Passenger LK concept (target: October 2026), FAP_SCOPE_ENFORCE rollout (observation → hard mode), checkFapScopeReadiness.js (enforcement readiness probe), ExternalUser & magic links, withFapAuthGuard (auth whitelist) (+3 more)

### Community 160 - "ФАП-доки: сеть characterization-тестов и разделение резолверов"
Cohesion: 0.40
Nodes (5): Method: finder → adversarial verifier → stand measurement, Two-tier mutation envelope (withPassengerRequest), prismaDouble (test harness), Resolver split — stages 0–3 (12 resolver files + 23 services), Characterization test net (300+ tests)

### Community 86 - "Авторизация: authService, authErrorLink (401 → logout) и TokenRefresher"
Cohesion: 0.16
Nodes (17): index.html — HTML-оболочка приложения, #root — точка монтирования React, Google Fonts: Montserrat, Inter, Nunito Sans, REFRESH_TOKEN, App(), AuthProvider(), DialogProvider(), ToastProvider() (+9 more)

### Community 158 - "SettingsSidebar: AccessPermissionsPanel, accessSections и слияние панелей доступа"
Cohesion: 0.47
Nodes (6): SettingsSidebar — компонент настроек через боковое меню, Состав папки SettingsSidebar, Контракт пропсов SettingsSidebar, Режимы «Просмотр» и «Редактирование», Обработка ошибок сохранения настроек, SettingsSidebar()

### Community 15 - "Компании: Company, AirlineCompany_tabComponent, requests.js и decodeJWT"
Cohesion: 0.06
Nodes (45): Двойной режим type="airline" / type="dispatcher", Выбор должностей для авиакомпаний, GraphQL-операции SettingsSidebar, decodeJWT(), GET_ALL_POSITIONS, GET_AIRLINE_USERS_POSITIONS, GET_AIRLINE_POSITIONS, GET_HOTEL_POSITIONS (+37 more)

### Community 9 - "UI-примитивы: Button, Sidebar, CloseIcon, MUIAutocomplete + формы компаний"
Cohesion: 0.13
Nodes (32): Стилизация и переиспользование UI-примитивов, UPDATE_DRIVER_MUTATION, CREATE_POSITION, IMPORT_BULK_REQUESTS, ADD_HOTEL_TO_RESERVE, UPDATE_HOTEL, CREATE_DISPATCHER_USER, UPDATE_DISPATCHER_USER (+24 more)

### Community 61 - "Шахматка v2: usePlacementData, placementTransforms и requestArchiveAccess"
Cohesion: 0.14
Nodes (20): Многоуровневая серверная фильтрация заявок, Серверный поиск с debounce 500 мс, v12.14 — шахматка: cache-and-network, мемоизация контекста, точечные подписки, GET_REQUESTS, GET_REQUESTS_ARCHIVED, GET_HOTEL_MIN, usePlacementData(), translateStatus() (+12 more)

### Community 100 - "Таблицы заявок: InfoTable и хелперы дат convertToDate / buildScheduledISO"
Cohesion: 0.20
Nodes (14): Пагинация заявок с синхронизацией URL (take: 50), MONTHS, WORK_STATUSES, requestWord(), tileInitials(), groupStats(), metaFor(), GroupAvatar() (+6 more)

### Community 65 - "Шахматка v2: NewPlacementV2, utils и история версий"
Cohesion: 0.19
Nodes (16): Маршруты заявок (/relay, /hotels/:hotelId/:requestId, /newPlacement/:hotelId), Структура src/ (App, main, AuthContext, services, contexts, hooks, utils, Components), Шахматка — PlacementDNDV2 (timeline-календарь заселения), v10.8 — появление шахматки V2 с модульной структурой, v12.15 — редизайн шахматки (NewPlacementV2, виды Неделя / Декада / Месяц, портал-поповер), v12.15 — единая доска без «Квота | Резерв» (−1260 строк), v12.15 — снос PlacementDND v1, react-window, TransferAdminOrdersContent, sameId() (+8 more)

### Community 27 - "CLAUDE.md / AGENTS.md: руководство и MUI-примитивы"
Cohesion: 0.09
Nodes (36): CLAUDE.md — руководство по репозиторию для Claude Code, Работа с кодом — правила кода, Визуальный стиль — следовать существующим паттернам, Экономия токенов — не объяснять, просто делать, Kars Avia — система размещения экипажей в гостиницах, Стек: React 18 (JSX), Vite 5, Apollo Client 3, MUI 6, React Router 6, Команды npm: dev / build / preview / lint, Окружения (.env): dev / demo / production, переключение в graphQL_requests.js (+28 more)

### Community 83 - "Трансфер: заказ (TransferOrder)"
Cohesion: 0.16
Nodes (12): Хелперы дат: convertToDate / convertToDateNew / buildScheduledISO, buildScheduledISO(), GET_TRANSFER_REQUEST, UPDATE_TRANSFER_REQUEST_MUTATION, TRANSFER_UPDATED_SUBSCRIPTION, DriverItem(), isFinishedOrCanceled(), EDITABLE_STATUSES (+4 more)

### Community 147 - "Ключи accessMenu: menuAccess (roles.js) и README v12.14–v12.15"
Cohesion: 0.48
Nodes (7): accessMenu — feature-флаги внутри роли, Ключи accessMenu (menuAccess в roles.js), Гейты ролей раздела «Отчёты»: reportMenu, старый раздел только у SUPERADMIN, v12.14 — ключи accessManage / travellineMenu / reserveUpdateCompleted, accessSections.js, v12.15 — «Отчёты v2» стали разделом «Отчёты» для всех ролей, кроме супер-администратора, v12.15 — архив отчётов: «Текущие · Черновики · Архив», archiveReport / restoreReport, ключ reportDelete, menuAccess

### Community 64 - "Гостиницы по ролям: HotelPage, HotelAdminContent, hotelReadiness, AllRoles"
Cohesion: 0.15
Nodes (15): Поток accessMenu: Main_Page → MenuDispetcher → AllRoles → RoleContent, RoleContent — AllRoles.jsx выбирает контент по роли, v12.7 — бейдж «Готовность к работе» + браузерные push-уведомления, GET_HOTEL_USERS, HotelPage(), HotelReadinessIndicator(), HotelStatusBadge(), InfoTableDataHotels() (+7 more)

### Community 124 - "SettingsSidebar: accessPayload.js и история версий доступа"
Cohesion: 0.27
Nodes (11): SettingsSidebar — панель прав доступа отдела (airline / dispatcher), accessStateRef — ref с внутренним состоянием панели прав, positionAccessMenusByPosId — доступ должностей к разделам (PositionOnDepartment), AccessPermissionsPanel — чисто UI, всё через пропсы, Визуальный disabled — opacity 0.55 на контейнере (класс rowDisabled), CSS-модули — свой .module.css у компонента, шаринг между соседями по папке, Визуальный disabled — opacity 0.55 на контейнере (класс rowDisabled), v12.5 (12.05.2026) (+3 more)

### Community 152 - "SettingsSidebar: accessPayload.js и история версий доступа"
Cohesion: 0.60
Nodes (5): buildAccessPayload(internalState) — internal → raw API, v12.10 (29.06.2026), v12.10 — «Должности и доступ» + effectiveAccessMenu (GET_USER_EFFECTIVE_ACCESS_MENU), buildAccessPayload(), ALL_TRUE_ACCESS

### Community 97 - "ФАП: шапка услуг FapHeaderActions и видимость услуг для гостиницы"
Cohesion: 0.18
Nodes (14): Маппинг serviceKey → компонент услуги (FapServicePage), v12.15 — видимость услуг для гостиницы: fapServiceVisibility.js + useHotelServiceVisibility, HOTEL_RESTRICTED_SERVICE_KEYS, isServiceHiddenForUser(), visibleServiceKeys(), ALL, WITHOUT_RESTRICTED, SUPER (+6 more)

### Community 73 - "Отчёты v2 (доки): релиз v12.14 в README/CLAUDE — черновики и пороги суток"
Cohesion: 0.15
Nodes (19): Черновики отчётов: createAirlineReportDraft / createHotelReportDraft → confirmReportDraft, Что нельзя ломать в «Отчётах v2», Границы периода …T00:10:00 / …T23:50:00 — часть расчёта, не форматирование, recalcRow — только для строк, которые правил пользователь, updateReportDraft перезаписывает весь массив строк без версии → явная кнопка сохранения, Что нельзя ломать в «Отчётах v2», Границы периода …T00:10:00 / …T23:50:00 — часть расчёта, не форматирование, recalcRow — только для строк, которые правил пользователь (+11 more)

### Community 104 - "Отчёты v2: правила расчёта суток (reportRules, ReportRulesSidebar)"
Cohesion: 0.28
Nodes (14): Пороги частичных суток — ReportPartialDaySetting, уровни GLOBAL / AIRLINE / HOTEL, v12.15 — «Правила расчёта суток» с уровнями GLOBAL / AIRLINE / HOTEL, resolveDraftPartialDayRules, ReportRulesSidebar(), PARTIAL_DAY_DEFAULTS, RULE_TIME_FIELDS, RULE_DAY_FIELDS, toRulesForm(), validateRules() (+6 more)

### Community 108 - "Отчёты v2: ReportDraftsPanel, reportDraftAge, reportDraftComment"
Cohesion: 0.25
Nodes (7): Доменная логика без JSX: reportRules.js / reportDraftRows.js / reportDraftAge.js (+ node --test), formatDateTime(), ReportDraftsPanel(), getDraftAgeDays(), isDraftStale(), draftAirlineNote(), shortReportTitle()

### Community 23 - "README: история версий"
Cohesion: 0.05
Nodes (42): README — история обновлений Kars Avia (v0.1 → v12.15), v0.1 (02.12.2024), v0.2 (04.12.2024), v0.3 (07.12.2024), v1.1 (18.12.2024), v1.2 (21.12.2024), v2.0 (09.01.2025), v2.1 (15.01.2025) (+34 more)

### Community 168 - "README: история версий"
Cohesion: 0.67
Nodes (3): v10.0 (19.09.2025), v10.1 (04.10.2025), v10.0 — страницы «Обновления» и «Инструкции» (древовидные статьи)

### Community 146 - "README: версии v12.13–v12.14 и hotelAddress (composeHotelAddress)"
Cohesion: 0.29
Nodes (8): v12.6 (18.05.2026), v12.7 (22.05.2026), v12.13 (27.07.2026), v12.6+ — интеграция с TravelLine, v12.13 — аналитика «Пассажиры» (KPI, таблицы, графики, XLSX одной книгой), v12.13 — TravelLine сертификация: дедлайн отмены, часовые пояса, корп. клиенты, v12.13 — приложение представителя: распознавание документа по фото (Yandex Vision → GPT), v12.14 — TravelLine: корпоративный клиент в сайдбаре номеров, отдельный пункт меню

### Community 41 - "Меню ролей: MenuDispetcher, SuperAdminMenu и canSeeAnalytics"
Cohesion: 0.11
Nodes (23): v12.12 (30.06.2026), v12.12 — сгруппированные компактные меню на data-driven рендере, Маршрут /documentation и пункт меню «Помощь», GET_TRANSFERS_COUNT, TRANSFER_CREATED_SUBSCRIPTION, GET_REQUESTS_COUNT, GET_PASSENGER_REQUESTS_COUNT, PASSENGER_REQUEST_CREATED_SUBSCRIPTION (+15 more)

### Community 58 - "Описание гостиницы: парсер hotelDescription и HotelPreview"
Cohesion: 0.17
Nodes (22): v12.15 — «О гостинице» адаптив, чипы удобств (hotelDescription.js, +26 тестов), HotelAbout_tabComponent(), VOID_TAGS, PARAGRAPH_TAGS, NAMED_ENTITIES, isCodePoint(), decodeEntities(), toHtmlString() (+14 more)

### Community 67 - "Сезонные цены категорий номеров (RoomKindSeasons)"
Cohesion: 0.22
Nodes (18): v12.15 — сезонные цены тарифов гостиницы (RoomKindSeasons, roomKindSeasons.js, apolloErrorText.js), EMPTY_FORM, RoomKindSeasons(), useRoomKindSeasons(), apolloErrorText(), buildDateInputValue(), toDateInputValue(), toDisplayDate() (+10 more)

### Community 128 - "Цены трансфера: transferPrices.js и поиск по маршрутам"
Cohesion: 0.24
Nodes (9): v12.15 — TravelLine SyncIndicator; поиск цен трансфера matchesTransferPriceSearch, DEFAULT_TRANSFER_PRICES, TRANSFER_SEATER_KEYS, matchesTransferPriceSearch(), toRoutePricesInput(), airports, cities, refs (+1 more)

### Community 5 - "Документация «Помощь»: DocumentationList1, дерево и левая панель"
Cohesion: 0.05
Nodes (84): Раздел «Помощь» (Инструкции) — модуль документации, Иерархия компонентов: DocumentationList → DocumentationList1 → панели, DocumentationList.jsx — обёртка с Header «Инструкции» и переключателем типа, DocumentationList1 — трёхзонный layout (дерево / контент / якоря), Типы документации: dispatcher / airline / hotel / representation → apiType, Переключатель типа только у superAdmin (hasDocumentationFilterSwitcherAccess), GraphQL API документации: sectionsWithHierarhy, article, CRUD секций/статей, upload, Нормализация дерева section/article из ответа (toLocalTreeNode) (+76 more)

### Community 87 - "Документация: локальное хранилище черновиков (docDraftStore, indexedDb, fileStore)"
Cohesion: 0.25
Nodes (16): Лейаут статьи (ширина, отступы) — saveDocLayout / docDraftStore, buildDocDraftId(), buildDocLayoutId(), loadDocContent(), loadDocDraft(), saveDocContent(), saveDocLayout(), randomId() (+8 more)

### Community 17 - "Документация: редактор Tiptap и расширения"
Cohesion: 0.06
Nodes (24): Редактор Tiptap — базовые расширения (StarterKit, Color, Highlight, FontSize, …), NavigationAnchor — атрибуты anchorTag / anchorId на paragraph и heading, Табличные расширения (TableWrapper, RowHeight, RowResizing, CellCursorPad, SelectionLock), Блоки контента: Quote, Toggle, Frame, Columns, Image, Gallery, Video, Audio, File, Ограничение VK-видео: iframe разрешён только на официальных сайтах партнёров, FontSize, BackgroundColor, NavigationAnchor (+16 more)

### Community 88 - "Документация: загрузка файлов (UploadContext, imageDropPlugin)"
Cohesion: 0.17
Nodes (14): SlashInterceptor + SlashCommand, BlockLassoSelectionPlugin, imageDropPlugin, DocumentationUploadContext, isSameOriginAsServer(), ensureUploadedPath(), ensureLeadingSlash(), normalizeUploadsPath(), appendToken(), uniqueUrls() (+6 more)

### Community 13 - "Резерв: ReservePlacement(Representative), ChooseHotel, AddRepresentativeBooking и чат резерва"
Cohesion: 0.07
Nodes (44): getCookie(), GET_HOTELS_RELAY, UPDATE_PASSENGER_REQUEST, ADD_PASSENGER_REQUEST_HOTEL_PERSON, GET_RESERVE_REQUEST, CREATE_RESERVE_REPORT, GET_RESERVE_REQUEST_HOTELS, GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION_PERSONS (+36 more)

### Community 6 - "TravelLine: поиск, бронирование, синхронизация"
Cohesion: 0.06
Nodes (67): mediaSrc(), GET_TL_CONFIG, SET_TL_CONFIG, GET_TL_ROOM_TYPES, GET_TL_RATE_PLANS, TL_AVAILABILITY, TL_PROPERTY_CALENDAR, TL_PROPERTIES_AVAILABILITY (+59 more)

### Community 39 - "Резерв представителя: вкладки услуг (Habitation / Water / Power / Baggage) и DeleteIcon"
Cohesion: 0.11
Nodes (23): makeFormatter(), convertToDate(), SET_PASSENGER_SERVICE_STATUS, REMOVE_PASSENGER_REQUEST_HOTEL, REMOVE_PASSENGER_REQUEST_DRIVER, COMPLETE_PASSENGER_REQUEST_WATER_EARLY, COMPLETE_PASSENGER_REQUEST_MEAL_EARLY, COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY (+15 more)

### Community 55 - "Таблицы InfoTable: InfoTableDataReserve*, Support, RepresentativeData и EditReserveDate"
Cohesion: 0.18
Nodes (17): convertToDateNew(), UPDATE_HOTEL_BRON, GET_RESERVE_LOGS, GET_RESERVE_REQUEST_HOTELS_SUBSCRIPTION, ADD_PERSON_TO_HOTEL, ADD_PASSENGER_TO_HOTEL, UPDATE_RESERVE, GET_HOTEL_ROOMS (+9 more)

### Community 154 - "Системные уведомления и патч-ноуты"
Cohesion: 0.53
Nodes (4): generateTimestampId(), emptySeasonDraft(), RoomKindSeasonsDraft(), SeasonRowEditor()

### Community 115 - "Вход и возврат по /login?next= (loginRedirect, LoginRedirect)"
Cohesion: 0.25
Nodes (10): TRANSFER_SING_IN, SINGIN, SINGUP, Login(), LoginRedirect(), NO_RETURN_PATHS, normalizePath(), isReturnable() (+2 more)

### Community 52 - "О компании: HotelSettings, AirlineAbout, OrganizationAbout и иконки контактов"
Cohesion: 0.13
Nodes (17): GET_ORGANIZATION, UPDATE_ORGANIZATION, GET_HOTEL_LOGS, GET_AIRLINE_LOGS, GET_PASSENGER_REQUEST_LOGS, REORDER_GALLERY, DELETE_HOTEL, AirlineAbout_tabComponent() (+9 more)

### Community 44 - "Чаты и поддержка: Message, SupportPage, getMediaUrl"
Cohesion: 0.10
Nodes (24): REQUEST_MESSAGES_SUBSCRIPTION, GET_MESSAGES_HOTEL, SEND_FAP_MESSAGE, MESSAGE_SENT_SUBSCRIPTION, MARK_MESSAGE_AS_READ, MARK_ALL_MESSAGES_AS_READ, UPDATE_MESSAGE_BRON, GET_TRANSFER_CHATS (+16 more)

### Community 140 - "Уведомления и бесконечный скролл (NotificationsSidebar, useInfiniteScroll)"
Cohesion: 0.31
Nodes (7): QUERY_NOTIFICATIONS, NOTIFICATIONS_SUBSCRIPTION, notificationDedupeKey(), REPORT_DRAFT_ACTIONS, separatorToType, NotificationsSidebar(), ExportIcon()

### Community 102 - "Гостиница: таблица бронирований (HotelTable, Booking, Placement)"
Cohesion: 0.19
Nodes (13): GET_REQUEST, GET_BRONS_HOTEL, Booking(), BronInfo(), initialState(), reducer(), checkBookingConflict(), HotelTablePageComponent() (+5 more)

### Community 94 - "ФАП: карточка поставки — fapSupply, FapSupplyCard"
Cohesion: 0.26
Nodes (13): UPDATE_PASSENGER_REQUEST_SUPPLY, FapSupplyCard(), FapSupplyCardEditor(), money(), FapSupplyCardView(), toLocalInputValue(), fromLocalInputValue(), supplyDraftFromService() (+5 more)

### Community 80 - "Документация: создание статей и обновлений (CreateRequestDocumentation, TextEditor)"
Cohesion: 0.19
Nodes (18): CREATE_HOTEL, CREATE_DOCUMENTATION, newId(), makeEmptyBlock(), updateTree(), removeFromTree(), buildPayload(), BlockItem() (+10 more)

### Community 45 - "Страница гостиницы: HotelPage, роутинг по ролям, ссылка предпросмотра"
Cohesion: 0.07
Nodes (19): CREATE_HOTEL_PREVIEW_LINK, PRESETS, HotelPreviewShareButton(), HotelAboutTab, HotelCompanyTab, HotelNomerFondTab, HotelShahmatkaTab, HotelTarifsTab (+11 more)

### Community 22 - "«О гостинице»: HotelAbout и иконки удобств"
Cohesion: 0.06
Nodes (19): AUTHORIZE_HOTEL_PREVIEW, GET_HOTEL_PREVIEW, GET_HOTEL_MEAL_PRICE, GET_HOTEL_TRANSFER_PRICE, AMENITY_ICONS, TABS, HotelPreview(), AirConditionerIcon() (+11 more)

### Community 162 - "Сезонные цены категорий номеров (RoomKindSeasons)"
Cohesion: 0.40
Nodes (4): GET_ROOM_KIND_SEASONS, CREATE_ROOM_KIND_SEASON, UPDATE_ROOM_KIND_SEASON, DELETE_ROOM_KIND_SEASON

### Community 26 - "Аналитика АК: AirlineAnalytics, мапперы и сортировка таблиц"
Cohesion: 0.11
Nodes (36): GET_AIRLINES, GET_AIRLINE_ANALYTICS, SERVICE_OPTIONS, isPeriodRangeComplete(), formatPeriodHuman(), formatPeriodWithDays(), ALL_AIRPORTS_OPTION, ALL_SERVICES_OPTION (+28 more)

### Community 66 - "Отчёты v2: выпущенные отчёты, GraphQL и SegmentedToggle"
Cohesion: 0.17
Nodes (17): GET_AIRLINE_REPORT, GET_REPORTS_SUBSCRIPTION, GET_HOTEL_REPORT, DELETE_REPORT, ARCHIVE_REPORT, RESTORE_REPORT, GET_REPORT_DRAFTS, ReportsV2() (+9 more)

### Community 77 - "Отчёты v2: редактор черновика (ReportDraftEditor, поля, сортировка)"
Cohesion: 0.17
Nodes (17): GET_REPORT_PARTIAL_DAY_SETTINGS, MY_REPORT_EDITABLE_FIELDS, SET_MY_REPORT_EDITABLE_FIELDS, ReportDraftDialog(), ReportDraftEditor(), ReportDraftErrorBanner(), sortDraftRows(), applyMealCountChange() (+9 more)

### Community 28 - "Отчёты v2: черновик — reportDraftRows, useReportDraft"
Cohesion: 0.11
Nodes (33): GET_REPORT_DRAFT, GET_REPORT_DRAFT_PRESENTATION, UPDATE_REPORT_DRAFT, RECREATE_REPORT_DRAFT, CONFIRM_REPORT_DRAFT, SUBMIT_AIRLINE_REPORT_DRAFT, UNSUBMIT_AIRLINE_REPORT_DRAFT, REJECT_AIRLINE_REPORT_DRAFT (+25 more)

### Community 132 - "Плашка техработ: MaintenanceBannerBar и useMaintenanceCountdown"
Cohesion: 0.31
Nodes (8): MAINTENANCE_BANNER, MAINTENANCE_BANNER_UPDATED, MaintenanceBannerBar(), isoToLocalInput(), localInputToISO(), MaintenanceBannerSettings(), useMaintenanceCountdown(), formatCountdown()

### Community 62 - "Системные уведомления и патч-ноуты"
Cohesion: 0.21
Nodes (20): SYSTEM_UPDATE, UPDATE_SYSTEM_UPDATE, SystemNotificationsSettings(), hasItems(), SystemUpdateCard(), emptyState(), SystemUpdateSettings(), AUDIENCE_ORDER (+12 more)

### Community 145 - "Системные уведомления и патч-ноуты"
Cohesion: 0.36
Nodes (5): MARK_SYSTEM_UPDATE_SEEN, SYSTEM_UPDATE_PUBLISHED, SystemUpdateGate(), SystemUpdateModal(), useSystemUpdate()

### Community 114 - "Безопасный HTML: sanitizeHtml, TextEditorOutput, InfoTableDataUpdates, HotelAboutRoomBlock"
Cohesion: 0.24
Nodes (8): GET_DOCUMENTATION_TREE, declension(), HotelAboutRoomBlock(), InfoTableDataPatchNotes(), DocNode(), InfoTableDataUpdates(), TextEditorOutput(), sanitizeHtml()

### Community 133 - "Документация: правка обновлений (EditRequestUpdates), HotelAboutRoomBlock и TextEditorOutput"
Cohesion: 0.38
Nodes (9): UPDATE_DOCUMENTATION, newId(), toLocalNode(), stripNode(), collectImageGroups(), updateTreeById(), removeFromTreeById(), BlockItem() (+1 more)

### Community 134 - "package.json: метаданные и скрипты (dev, build, lint, preview)"
Cohesion: 0.20
Nodes (9): name, private, version, type, scripts, dev, build, lint (+1 more)

### Community 69 - "package.json: dependencies (Tiptap, MUI, DOMPurify)"
Cohesion: 0.10
Nodes (22): dependencies, @react-input/mask, @react-input/mask, @tiptap/extension-color, @tiptap/extension-color, @tiptap/extension-table, @tiptap/extension-table-row, @tiptap/extension-text-align (+14 more)

### Community 167 - "package"
Cohesion: 0.67
Nodes (3): @tiptap/extension-table-cell, @tiptap/extension-table-cell, @tiptap/extension-table-header

### Community 155 - "ScriptRunner: плавающее окно — DraggableWindow, useDragResize, PickHighlight"
Cohesion: 0.33
Nodes (6): react-dom, react-dom, useDragResize(), DraggableWindow(), PickHighlight(), TargetMarkers()

### Community 116 - "ФАП: манифест из реестра и импорт (fapManifestBuild, ManifestImportModal)"
Cohesion: 0.29
Nodes (12): xlsx, xlsx, manifestPeople(), mark(), hasManifestRoster(), buildManifestRows(), buildManifestWorkbook(), manifestDownloadName() (+4 more)

### Community 101 - "package.json: devDependencies (Vite, ESLint)"
Cohesion: 0.12
Nodes (17): devDependencies, @types/react, @types/react, @types/react-dom, @types/react-dom, @vitejs/plugin-react, @vitejs/plugin-react, eslint (+9 more)

### Community 37 - "Страницы АК и автопарка: AirlinePage, DriversCompanyPage, роутинг по ролям"
Cohesion: 0.07
Nodes (28): DriversCompanyPage(), DriversCompanyTab, AirlineTarifsTab, AirlineRegisterOfContracts, AirlineShahmatkaTabStaff, OrganizationAboutTab, OrganizationRegisterOfContracts, OrganizationTransferPricesTab (+20 more)

### Community 29 - "RoleContent: точки входа ролей (SuperAdmin/Dispatcher/Airline)"
Cohesion: 0.13
Nodes (30): AirlinePage(), AirlinesList(), Company(), DocumentationList(), HotelsList(), MyCompany(), PatchNotesList(), PositionAccessPage() (+22 more)

### Community 95 - "Готовность отделов: airlineReadiness, dispatcherDepartmentReadiness, InfoTableData*Company"
Cohesion: 0.20
Nodes (10): AirlineReadinessIndicator(), collapseBtnStyle, collapseBtnStyle, InfoTableDataDispatcherCompany(), ReadinessIndicator(), SettingsIcon(), READINESS_GROUPS, computeAirlineReadiness() (+2 more)

### Community 163 - "Гостиница: таблица бронирований (HotelTable, Booking, Placement)"
Cohesion: 0.70
Nodes (4): initialState(), reducer(), packIntoLanes(), AirlineTablePageComponent()

### Community 48 - "Документация: Tiptap-панель, modalStacking, ImageViewer"
Cohesion: 0.16
Nodes (26): EMPTY_DOC, DEFAULT_ARTICLE_PADDING, ARTICLE_WIDTH_PRESET_MAX, isDocJson(), normalizeIncomingDocContent(), isSameDocContentSemantically(), clamp(), normalizePadding() (+18 more)

### Community 18 - "Документация: медиа-блоки редактора"
Cohesion: 0.11
Nodes (30): useDocumentationUpload(), notifyDocumentationUploadFailure(), FONT_SIZE_MODAL_ESTIMATED_SIZE, fontSizeOptions, FontSizeSelect(), AUDIO_MODAL_ESTIMATED_SIZE, loadYouTubeIframeApi(), loadVkVideoApi() (+22 more)

### Community 24 - "Документация: тулбар и экспорт в Office"
Cohesion: 0.09
Nodes (36): getDocumentationUploadFile(), textColors, bgColors, ColorModal(), CustomStyleModal(), EXPORT_FORMATS, ExportModal(), ImportModal() (+28 more)

### Community 63 - "Документация: слэш-команды и блоки (blockRegistry, PlusButtonOverlay)"
Cohesion: 0.14
Nodes (16): clampNumber(), getTopLevelBlockPos(), getTopLevelStartPositions(), getInsertTargetPosForBlock(), PlusButtonOverlay(), clampDocPos(), getFirstTextCursorPosInNode(), getMatchingAncestorFromSelection() (+8 more)

### Community 129 - "Документация: якоря навигации (AnchorHashOverlay)"
Cohesion: 0.36
Nodes (9): TEXT_NODE_TYPES, TEXT_BLOCK_TAGS, TABLE_NODE_TYPES, normalizeLabel(), buildAnchorsSignature(), isInsideTableNode(), AnchorHashOverlay(), buildAnchorDomId() (+1 more)

### Community 103 - "Документация: перетаскивание блоков (BlockDragOverlay)"
Cohesion: 0.24
Nodes (16): getEditorViewSafe(), getEditorDomSafe(), getClientPointFromEvent(), getTopLevelStartPositions(), getTopLevelBlockEl(), getTopLevelBlockPos(), getNodePosByDom(), getNearestTopLevelBlockElByClientY() (+8 more)

### Community 120 - "Документация: выделение блоков (BlockSelectionOverlay, blockLassoSelection)"
Cohesion: 0.27
Nodes (9): rectFromPoints(), intersectRect(), isFormFieldTarget(), normalizeTargetToElement(), hasNativeTextSelectionInActiveField(), BlockSelectionOverlay(), BlockLassoSelectionKey, BlockLassoSelectionPMPlugin (+1 more)

### Community 117 - "Документация: ссылки — LinkModal и иконки"
Cohesion: 0.24
Nodes (11): linkStyles, renderLinkIcon(), getLinkStylePreviewStyle(), LinkModal(), LinkIcon(), ButtonIcon(), HighlightIcon(), DashedIcon() (+3 more)

### Community 53 - "Документация: файловый блок (fileBlockView, превью офисных файлов)"
Cohesion: 0.13
Nodes (20): FILE_MODAL_ESTIMATED_SIZE, BLOCK_TARGET_OPTIONS, getFileExtension(), getOfficePreviewUrl(), getPreviewKind(), TEXT_FILE_EXTENSIONS, CODE_FILE_EXTENSIONS, TEXT_FILENAMES (+12 more)

### Community 121 - "Документация: галерея (galleryBlock) — раскладки и подгонка"
Cohesion: 0.23
Nodes (8): parseMaybeInt(), GALLERY_LAYOUTS, GALLERY_FITS, normalizeGalleryLayout(), normalizeGalleryColumns(), normalizeGalleryGap(), normalizeGalleryFit(), GalleryBlock

### Community 130 - "Документация: блоки цитаты и рамки (quoteBlock, frameBlock)"
Cohesion: 0.35
Nodes (9): QuoteBlock, QUOTE_MODAL_ESTIMATED_SIZE, PRESET_COLORS, hexToRgb(), toQuoteBorderColor(), toQuoteAccentColor(), toQuoteButtonColor(), toQuoteTextColor() (+1 more)

### Community 49 - "Документация: высота строк таблицы (tableRowResizing)"
Cohesion: 0.12
Nodes (24): tableRowResizingPluginKey, RowResizeState, domCellAround(), rowDomAtCellPos(), edgeCell(), edgeCellHorizontal(), updateHandle(), updateCornerHandle() (+16 more)

### Community 89 - "Документация: обёртка таблицы, перенос строк и колонок (tableWrapperView)"
Cohesion: 0.24
Nodes (18): TABLE_HEADER_MODAL_ESTIMATE, TABLE_HEADER_PRESET_COLORS, findTable(), ensureSelectionInThisTable(), isSelectionInsideTable(), forceCursorBackIntoTable(), moveCursorLeft(), removeLastRow() (+10 more)

### Community 59 - "Документация: импорт DOCX (docxImport.js)"
Cohesion: 0.19
Nodes (24): escapeHtml(), wordVal(), relId(), wordBoolean(), halfPointsToPx(), wordColorToCss(), wordHighlightToCss(), findFirstChild() (+16 more)

### Community 20 - "Svg-обёртка, иконки действий и меню «⋮»"
Cohesion: 0.08
Nodes (13): ExistRequestAdditionalMenu(), MENU_ITEMS, AdditionalMenuIcon(), CancelIcon(), ExitIcon(), NotificationIcon(), NotifyIcon(), ProfileHomeIcon() (+5 more)

### Community 141 - "Документация: правка статей — EditRequestDocumentation и дерево блоков"
Cohesion: 0.44
Nodes (8): newId(), toLocalNode(), stripNode(), collectImageGroups(), updateTreeById(), removeFromTreeById(), BlockItem(), EditRequestDocumentation()

### Community 71 - "ФАП: скидки пачкой — FapDiscountDialog, fapDiscountZones"
Cohesion: 0.18
Nodes (15): QUICK_PERCENTS, EMPTY_PRESETS, EMPTY_CUSTOM, clampInput(), FapDiscountDialog(), DISCOUNT_ZONES, clampPercent(), zoneMembers() (+7 more)

### Community 122 - "ФАП: файлы манифеста — fapManifestFiles (имя загрузки, порядок, парсинг)"
Cohesion: 0.36
Nodes (9): baseNameOf(), withoutTimestamp(), extensionOf(), flightSlug(), manifestUploadName(), isManifestFile(), parseManifestFile(), manifestFilesNewestFirst() (+1 more)

### Community 33 - "ФАП: тесты книги отчёта Excel (buildReportSheets.test)"
Cohesion: 0.09
Nodes (30): addRequestReportSheets(), makeRequest(), makeRequestWithGuest(), guestSheet(), combinedSheet(), makeBaggageRequest(), baggageSheet(), makeFullServiceRequest() (+22 more)

### Community 81 - "ФАП: кеш формул Excel (formulaResults)"
Cohesion: 0.16
Nodes (14): fail(), isFormula(), colNumber(), tokenize(), FUNCTIONS, evaluate(), sheetEvaluator(), fillFormulaResults() (+6 more)

### Community 135 - "«О гостинице»: редактор по разделам — HotelAboutEditor, AboutChecklist, AboutLaundry"
Cohesion: 0.24
Nodes (6): AboutChecklist(), AboutLaundry(), INFRASTRUCTURE_GROUPS, FACILITY_GROUPS, INFRASTRUCTURE_ITEMS, ROOM_GROUPS

### Community 35 - "«О гостинице»: разбор описания по разделам (hotelAbout.js)"
Cohesion: 0.11
Nodes (33): HotelAboutEditor(), ABOUT_LABELS, FACILITY_ITEMS, ROOM_ITEMS, RARE_ITEM_KEYS, DICTIONARIES, LABEL_ALIASES, LAUNDRY_ON (+25 more)

### Community 150 - "Звёздность гостиниц: starRating, StarRatingFilter, parseStarValue"
Cohesion: 0.62
Nodes (4): StarRow(), StarRatingFilter(), parseStarValue(), starFractions()

### Community 68 - "Категории номеров: roomCategories и InfoTableDataTarifs"
Cohesion: 0.13
Nodes (18): VAT_PERCENT, fmtPrice(), fmtWithVat(), PriceStack(), InfoTableDataTarifs(), ROOM_CATEGORIES, byValue, CATEGORY_LABELS (+10 more)

### Community 157 - "Таблицы заявок: InfoTable и хелперы дат convertToDate / buildScheduledISO"
Cohesion: 0.47
Nodes (4): InfoTableDataTransferOrders(), formatTimeRemaining(), ReportTimer(), statusLabels

### Community 50 - "Отчёты v2: таблица черновика — ReportDraftTable, Summary, группировка по гостиницам"
Cohesion: 0.10
Nodes (20): ReportDraftEmptyState(), ReportDraftFilters(), ReportDraftFooter(), ReportDraftGroupHeader(), NAME_WIDTHS, ROOM_WIDTHS, HOTEL_WIDTHS, ReportDraftSkeleton() (+12 more)

### Community 36 - "Отчёты v2: строка черновика — ReportDraftRow, editorUtils, formatMoney"
Cohesion: 0.16
Nodes (32): ReportDraftRow(), trimSeconds(), reportDateToInputValue(), inputValueToReportDate(), DRAFT_SORT_TYPES, parseReportDateParts(), computeStayDays(), paidMealsCount() (+24 more)

### Community 56 - "ScriptRunner: константы действий и SVG-иконки панели (ACTION_TYPES, Icon*)"
Cohesion: 0.08
Nodes (6): collectScripts(), collectAllScripts(), countScripts(), ACTION_TYPES, KEY_OPTIONS, RESIZE_DIRS

### Community 72 - "ScriptRunner: компонент, сбор скриптов и экспорт (collectScripts, buildLibraryExportPayload)"
Cohesion: 0.12
Nodes (22): generateSelector(), makeSafeFileName(), findNodeById(), updateNodeById(), removeNodeById(), insertNode(), isDescendantOf(), moveNode() (+14 more)

### Community 151 - "ScriptRunner: исполнение действий и DOM-хелперы (executeAction, setElementValue)"
Cohesion: 0.29
Nodes (7): sleep(), getUnderlyingElement(), resolveEditableElement(), normalizeDateLikeValue(), setElementValue(), isScriptRunnerControl(), executeAction()

### Community 136 - "ScriptRunner: импорт сценариев — parseImportPayload, migrateFromFlatFormat, isValidTree"
Cohesion: 0.33
Nodes (10): isPlainObject(), isValidActionItem(), isValidActionsArray(), generateId(), assignIdsToTree(), migrateFromFlatFormat(), flatObjectToTree(), isValidTreeNode() (+2 more)

### Community 123 - "ScriptRunner: значения действий — случайные даты и время (resolveTypeActionValue)"
Cohesion: 0.24
Nodes (12): parseActionDate(), formatIsoDate(), formatRuDate(), generateRandomDateValue(), parseActionTime(), formatTimeFromMinutes(), randomInt(), getPreviousActionValue() (+4 more)

### Community 21 - "HotelPMS (мок-данные)"
Cohesion: 0.09
Nodes (27): HotelPMS(), uid(), Bookings(), Dashboard(), HK_FLOW, Housekeeping(), Reports(), Rooms() (+19 more)

### Community 142 - "Аналитика АК: сортировка таблиц — analyticsTableSortUtils"
Cohesion: 0.44
Nodes (8): cmpNum(), cmpStr(), STR_SORT_KEYS, sortRowsByKey(), sortPositionRows(), sortAirportRows(), sortMergedRequestRows(), sortSegmentBlocks()

### Community 143 - "ФАП: список заявок FapV2 и фильтры fapListFilters"
Cohesion: 0.44
Nodes (7): pickAirline(), pickAirport(), toIsoOrNull(), parseIsoOrNull(), serializeListFilters(), parseListFilters(), baseFilters

### Community 25 - "Шахматка v2: стили статусов, BoardToolbar, PlacementBarV2 и RoomRowV2"
Cohesion: 0.08
Nodes (26): MEAL_LABELS, BarPopover(), LEGEND_ITEMS, BoardToolbar(), PlacementBarV2(), TrayCardV2(), UnplacedTray(), countOccupiedLanes() (+18 more)

### Community 78 - "Шахматка v2: период и шапка сетки (placementPeriod, GridHeader)"
Cohesion: 0.16
Nodes (14): VIEW_TABS, GridHeader(), MONTH, req(), capitalize(), weekTitle(), decadeIndex(), decadeRange() (+6 more)

### Community 164 - "ScriptRunnerContext и Layout (Empty)"
Cohesion: 0.50
Nodes (3): Empty(), ScriptRunnerContext, ScriptRunnerProvider()

### Community 42 - "ФАП: манифест фиксированной ширины и ICAO (manifestFixedWidth)"
Cohesion: 0.12
Nodes (27): FIELDS, FIXED_WIDTH_HEADER, toLines(), nextTokenStart(), readLayout(), cut(), isReg(), isBrokenWord() (+19 more)

### Community 82 - "ФАП: тесты профилей манифеста"
Cohesion: 0.11
Nodes (14): WIDE_HEADER, NARROW_HEADER, narrowSheet(), detectNarrow(), VED_AT, VED_ROWS, ICAO_ROWS, RUSLINE_GROUPS (+6 more)

### Community 166 - "Тарифы: Create/EditRequestTarifCategory, AirlineTarifs_tabComponent и MultiSelectAutocomplete"
Cohesion: 0.83
Nodes (3): normalizePart(), buildScriptRunnerBaseId(), buildAutocompleteOptionKey()

## Ambiguous Edges - Review These
- `Ворнинги групп W1/W2/W3 (computeFapGroupWarnings)` → `FapLivingPage.jsx`  [AMBIGUOUS]
  docs/superpowers/specs/2026-07-22-fap-passenger-groups-design.md · relation: conceptually_related_to
- `Обработка ошибок сохранения настроек` → `useToast()`  [AMBIGUOUS]
  src/Components/Blocks/SettingsSidebar/README.md · relation: references

## Knowledge Gaps
- **569 isolated node(s):** `Побочный эффект: метрика transferBaggage перестаёт быть нулевой`, `Подсказка о пропущенных аэропортах`, `Spec: Contract registry frontend edits (2026-07-07)`, `Prolongation chip in the contract list row`, `Spec: FAP hotel tariff billing mode «Койко-место»/«Номер» (2026-07-21)` (+564 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Ворнинги групп W1/W2/W3 (computeFapGroupWarnings)` and `FapLivingPage.jsx`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Обработка ошибок сохранения настроек` and `useToast()`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `getCookie()` connect `Резерв: ReservePlacement(Representative), ChooseHotel, AddRepresentativeBooking и чат резерва` to `ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms`, `GraphQL: ядро запросов и формы заявок`, `Шапка и реестры договоров: Header, FapV2, RegisterOfContracts, Filter, Estafeta`, `Сессия и контексты: getCookie, useToast, useDialog, JWT`, `ФАП: багаж и трансфер — FapBaggagePage, FapBaggageTripPage, FapTransferPage, FapSelect`, `Документация «Помощь»: DocumentationList1, дерево и левая панель`, `Документация: блоки цитаты и рамки (quoteBlock, frameBlock)`, `Документация: правка обновлений (EditRequestUpdates), HotelAboutRoomBlock и TextEditorOutput`, `ФАП: реестр и группы пассажиров`, `UI-примитивы: Button, Sidebar, CloseIcon, MUIAutocomplete + формы компаний`, `ФАП: FapDriverPage, FapWaterMealPage, fapConstants и массовое удаление получателей услуг`, `ФАП: роуты страниц, App.jsx и роли доступа (canAccessMenu, isHotelScoped, FapChat)`, `ФАП: доступ к отчёту и стадии — fapReportAccess, fapReportStages, FapLivingPage`, `Документация: правка статей — EditRequestDocumentation и дерево блоков`, `ФАП: FapDetail, FapHeaderActions, FapOverflowMenu и файлы манифеста`, `Компании: Company, AirlineCompany_tabComponent, requests.js и decodeJWT`, `Реестр договоров: фронт-правки (ДС-бейдж, пролонгация, истечение)`, `Документация: медиа-блоки редактора`, `«О гостинице»: HotelAbout и иконки удобств`, `Плашка техработ: MaintenanceBannerBar и useMaintenanceCountdown`, `Аналитика АК: AirlineAnalytics, мапперы и сортировка таблиц`, `Отчёты v2: черновик — reportDraftRows, useReportDraft`, `RoleContent: точки входа ролей (SuperAdmin/Dispatcher/Airline)`, `SettingsSidebar: AccessPermissionsPanel, accessSections и слияние панелей доступа`, `Цены авиакомпании: тарифы и география (airlineTariffPrices, airlineTariffGeography)`, `Тарифы: Create/EditRequestTarifCategory, AirlineTarifs_tabComponent и MultiSelectAutocomplete`, `TravelLine: поиск, бронирование, синхронизация`, `Сезонные цены категорий номеров (RoomKindSeasons)`, `Гостиница: таблица бронирований (HotelTable, Booking, Placement)`, `ФАП-аналитика: PassengerAnalytics и мапперы`, `Страницы АК и автопарка: AirlinePage, DriversCompanyPage, роутинг по ролям`, `Представители и доступ: Representative*DetailPage, useEffectiveAccessMenu, Main_Page и DeleteIcon`, `Резерв представителя: вкладки услуг (Habitation / Water / Power / Baggage) и DeleteIcon`, `Доступ по ролям: access.js (isSuperAdmin…), фильтр гостиниц show/active`, `Меню ролей: MenuDispetcher, SuperAdminMenu и canSeeAnalytics`, `Страница гостиницы: HotelPage, роутинг по ролям, ссылка предпросмотра`, `Документация: Tiptap-панель, modalStacking, ImageViewer`, `О компании: HotelSettings, AirlineAbout, OrganizationAbout и иконки контактов`, `Таблицы InfoTable: InfoTableDataReserve*, Support, RepresentativeData и EditReserveDate`, `Описание гостиницы: парсер hotelDescription и HotelPreview`, `Системные уведомления и патч-ноуты`, `Гостиницы по ролям: HotelPage, HotelAdminContent, hotelReadiness, AllRoles`, `Шахматка v2: NewPlacementV2, utils и история версий`, `Отчёты v2: выпущенные отчёты, GraphQL и SegmentedToggle`, `Сезонные цены категорий номеров (RoomKindSeasons)`, `Аналитика: Dispatcher/Hotel/Support Analytics, AnalyticsChart и DateRangePickerCustom`, `Отчёты v2: редактор черновика (ReportDraftEditor, поля, сортировка)`, `Документация: создание статей и обновлений (CreateRequestDocumentation, TextEditor)`, `Трансфер: заказ (TransferOrder)`, `Документация: загрузка файлов (UploadContext, imageDropPlugin)`, `ФАП: карточка поставки — fapSupply, FapSupplyCard`, `ФАП: шапка услуг FapHeaderActions и видимость услуг для гостиницы`, `Гостиница: таблица бронирований (HotelTable, Booking, Placement)`, `Отчёты v2: правила расчёта суток (reportRules, ReportRulesSidebar)`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Why does `dependencies` connect `package.json: dependencies (Tiptap, MUI, DOMPurify)` to `package.json: метаданные и скрипты (dev, build, lint, preview)`, `ФАП: роуты страниц, App.jsx и роли доступа (canAccessMenu, isHotelScoped, FapChat)`, `ScriptRunner: плавающее окно — DraggableWindow, useDragResize, PickHighlight`, `package`, `package`, `package`, `package.json: dependencies (Tiptap, MUI)`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package.json: dependencies (Tiptap, MUI)`, `package`, `package`, `package.json: dependencies (Tiptap, MUI)`, `package`, `package`, `package`, `package`, `package`, `package.json: dependencies (Tiptap, MUI)`, `package`, `package.json: dependencies (Tiptap, MUI)`, `package`, `package`, `package`, `package`, `package`, `package`, `package.json: dependencies (Tiptap, MUI)`, `package`, `package`, `package`, `package`, `package`, `package`, `ФАП: манифест из реестра и импорт (fapManifestBuild, ManifestImportModal)`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `README — история обновлений Kars Avia (v0.1 → v12.15)` connect `README: история версий` to `ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms`, `Сутки проживания: effectiveCostDays и fapPersonDays`, `README: версии v12.13–v12.14 и hotelAddress (composeHotelAddress)`, `SettingsSidebar: accessPayload.js и история версий доступа`, `CLAUDE.md / AGENTS.md: руководство и MUI-примитивы`, `README: история версий`, `Меню ролей: MenuDispetcher, SuperAdminMenu и canSeeAnalytics`, `Отчёты v2 (доки): релиз v12.14 в README/CLAUDE — черновики и пороги суток`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `Уведомления и бесконечный скролл (NotificationsSidebar, useInfiniteScroll)`, `SettingsSidebar: accessPayload.js и история версий доступа`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `Побочный эффект: метрика transferBaggage перестаёт быть нулевой`, `Подсказка о пропущенных аэропортах`, `Spec: Contract registry frontend edits (2026-07-07)` to the rest of the system?**
  _569 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ФАП: багаж и трансфер — FapBaggagePage, FapBaggageTripPage, FapTransferPage, FapSelect` be split into smaller, more focused modules?**
  _Cohesion score 0.03723963812329055 - nodes in this community are weakly interconnected._