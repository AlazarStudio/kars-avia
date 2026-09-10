# Graph Report - .  (2026-09-10)

## Corpus Check
- 811 files · ~656,936 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4268 nodes · 14134 edges · 230 communities (173 shown, 57 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 433 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- ФАП: багаж и поездки
- GraphQL: ядро запросов и формы заявок
- ФАП: трансфер — FapTransferPage, transportedCount и водитель
- ФАП: реестр и группы пассажиров
- ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms
- Категории номеров и цены авиакомпании
- ФАП: трансфер — FapTransferPage и факт поездки
- Реестр договоров: фронт-правки (ДС-бейдж, пролонгация, истечение)
- Договоры: формы создания и правки
- ФАП: книга отчёта Excel (buildReportSheets)
- ФАП-аналитика: спеки фильтров «Пассажиры» и period-UX
- ФАП-аналитика: PassengerAnalytics и мапперы
- specs
- ФАП: деталка заявки, проживание, доступ к отчёту
- ФАП: страницы-роуты и гейты доступа
- ФАП-аналитика: PassengerAnalytics и мапперы
- ФАП: импорт манифеста — parseManifestXlsx, ManifestUploadField, manifestCore
- Passenger Analytics Summary Charts
- Passenger Analytics Aggregation
- AddressField и геосаджест
- ФАП: спеки профилей манифеста (ПМ/PNL/PLI)
- ФАП: импорт манифеста — parseManifestXlsx, ManifestUploadField, manifestCore
- groupsCount и linkedPeopleCount в аналитике по пассажирам
- ФАП: подсказки групп по фамилиям (surnameForms, fapGroupSuggestions)
- useEffectiveAccessMenu: поток accessMenu Main_Page → MenuDispetcher → AllRoles
- Passenger Document Recognition
- AnalyticsForAvia
- Патч-ноуты: backfill и seedPatchNotes.mjs
- CreateRequestDocumentation
- ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms
- ФАП: трансфер — FapTransferPage, transportedCount и водитель
- SettingsSidebar: права отдела и уведомления
- PassengerAnalytics
- ФАП-аналитика: спеки фильтров «Пассажиры» и period-UX
- utils
- ФАП: книга отчёта Excel (buildReportSheets)
- ФАП: профили манифеста (manifestProfiles, PLI, cleanFullName)
- Excel-даты и парсер массового импорта (excelDate, parseBulkXlsx)
- NotificationsSidebar.jsx
- UI-примитивы: Button, MUILoader, Toast, Sidebar
- ФАП: страницы услуг и константы
- RoleContent: точки входа ролей и роуты FapV2
- ФАП: страницы услуг и константы
- Passenger Identity & Roster
- SettingsSidebar: панель уведомлений (notificationSections, payload)
- SettingsSidebar: панель уведомлений (notificationSections, payload)
- Цепочка accessMenu рвётся до таба шахматки
- Геометрия сетки (dayWidth, rowHeight = 50 × places)
- Известные расхождения шахматки с конвенциями репозитория
- NewPlacementV2.jsx — оркестратор (1701 строка, 52% модуля)
- Placement Dead Code Defects
- Placement Filters & Virtualization
- SHAHMATKA ARCHITECTURE
- Placement Overlap Logic
- Цвета статусов и расхождение translateStatus с roles.js
- Placement Board Data Mapping
- Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08)
- HotelAboutTariffs
- Call Backlog Review 03.08
- docs
- Доки ФАП: FAP.md, FAP2.md, FAP-DECISIONS, FAP-HANDOVER
- docs
- docs
- docs
- App.jsx, AuthContext и index.html: точка входа приложения
- SettingsSidebar: компонент и GraphQL-операции отдела
- Сессия и контексты: getCookie, useToast, useDialog, JWT
- Карточки «О компании» и медиа (getMediaUrl)
- UI-примитивы: Button, MUILoader, Toast, Sidebar
- Роли, шапка и реестры договоров
- Эскадрилья: Estafeta, ExistRequest, статусы и roles
- Шахматка v2: NewPlacementV2, utils и история версий
- Шахматка v2: NewPlacementV2, utils и история версий
- CLAUDE.md / AGENTS.md: руководство и MUI-примитивы
- Аутентификация: authService, ExternalLogin и externalAuthErrors
- Таблицы заявок: InfoTable, GroupedRequests, convertToDate / getMediaUrl
- SettingsSidebar: права отдела и уведомления
- SettingsSidebar: accessPayload.js и история версий доступа
- SettingsSidebar: accessPayload.js и история версий доступа
- Отчёты v2: выпущенные отчёты, plural, hotelAddress (README v12.14)
- Отчёты v2: выпущенные отчёты, GraphQL и SegmentedToggle
- Отчёты v2: правила расчёта суток (reportRules, ReportRulesSidebar)
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
- CLAUDE.md / AGENTS.md: руководство и MUI-примитивы
- README: история версий
- utils
- README: история версий
- README: история версий
- Меню, роли и эффективные права
- ФАП: манифест фиксированной ширины и ICAO (manifestFixedWidth)
- utils
- Описание гостиницы: парсер hotelDescription и HotelPreview
- Сезонные цены тарифов: RoomKindSeasons UI и apolloErrorText
- Цены трансфера: transferPrices.js и поиск по маршрутам
- Документация «Помощь»: DocumentationList1, дерево и левая панель
- storage
- Документация: загрузка файлов (UploadContext, imageDropPlugin)
- Документация: редактор Tiptap и расширения
- Документация: slash-команды и PlusButtonOverlay (Tiptap)
- TravelLine: поиск, бронирование, синхронизация
- Сезонные цены категорий номеров (RoomKindSeasons)
- TransferOrder
- Роли, шапка и реестры договоров
- Страницы АК и автопарка: AirlinePage, DriversCompanyPage, роутинг по ролям
- Чаты и поддержка: Message, SupportPage, getMediaUrl
- NotificationsSidebar
- Резерв и размещение представителя
- TravelLine: поиск, бронирование, синхронизация
- Сессия и контексты: getCookie, useToast, useDialog, JWT
- Резерв представителя: вкладки услуг (Habitation / Water / Power / Baggage) и DeleteIcon
- RoleContent: точки входа ролей и роуты FapV2
- Страница гостиницы: HotelPage, роутинг по ролям, ссылка предпросмотра
- «О гостинице»: HotelAbout и иконки удобств
- Категории номеров и цены авиакомпании
- Аналитика АК: AirlineAnalytics, мапперы и сортировка таблиц
- Отчёты v2: черновик — reportDraftRows, useReportDraft
- Отчёты v2: таблица черновика — ReportDraftTable, Summary, группировка по гостиницам
- Системные уведомления и патч-ноуты
- Системные уведомления и патч-ноуты
- Документация: EditRequestDocumentation, дерево и TextEditorOutput
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
- ScriptRunner
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
- Svg-обёртка, иконки действий и меню «⋮»
- GraphQL: ядро запросов и формы заявок
- UI-примитивы: Button, MUILoader, Toast, Sidebar
- HotelTable
- DocumentationListPanelContent
- Документация: медиа-блоки редактора
- Документация: тулбар и экспорт в Office
- Документация: якоря навигации (AnchorHashOverlay)
- Документация: перетаскивание блоков (BlockDragOverlay)
- components
- Документация: LinkModal и иконки редактора
- Документация: медиа-блоки редактора
- extensions
- Документация: блоки цитаты и рамки (quoteBlock, frameBlock)
- Документация: высота строк таблицы (tableRowResizing)
- Документация: обёртка таблицы, перенос строк и колонок (tableWrapperView)
- Документация: импорт DOCX (docxImport)
- EditRequestDocumentation
- FapV2
- ФАП: трансфер — FapTransferPage и факт поездки
- ФАП: книга отчёта Excel (buildReportSheets)
- Сессия и контексты: getCookie, useToast, useDialog, JWT
- Таблицы заявок: InfoTable, GroupedRequests, convertToDate / getMediaUrl
- HotelAbout tabComponent
- Таблицы InfoTableData* и готовность отделов (readiness)
- Отчёты v2: строка черновика — ReportDraftRow, editorUtils, formatMoney
- Сезонные цены категорий номеров (RoomKindSeasons)
- ScriptRunner: исполнение действий и DOM-хелперы
- ScriptRunner: компонент, сбор скриптов и селекторы
- ScriptRunner: исполнение действий и DOM-хелперы
- ScriptRunner
- ScriptRunner
- Страницы АК и автопарка: AirlinePage, DriversCompanyPage, роутинг по ролям
- HotelPMS (мок-данные)
- Аналитика АК: AirlineAnalytics, мапперы и сортировка таблиц
- Авторизация: App, AuthContext, authService
- Шахматка v2: плашки, лоток и бейджи статусов (PlacementBarV2, TrayCardV2)
- Шахматка v2: период и шапка сетки (placementPeriod, GridHeader)
- Шахматка v2: плашки, лоток и бейджи статусов (PlacementBarV2, TrayCardV2)
- hooks
- services
- ФАП: тесты профилей манифеста

## God Nodes (most connected - your core abstractions)
1. `getCookie()` - 359 edges
2. `useToast()` - 173 edges
3. `MUILoader()` - 147 edges
4. `useDialog()` - 143 edges
5. `getMediaUrl()` - 133 edges
6. `Button()` - 133 edges
7. `useRequiredFields()` - 112 edges
8. `convertToDate()` - 87 edges
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

## Communities (230 total, 57 thin omitted)

### Community 10 - "ФАП: багаж и поездки"
Cohesion: 0.05
Nodes (46): ФАП: карточка доставки багажа по составу реальных документов, Поле baggageTags (номера багажных бирок), Ловушка: скалярный список в composite-типе Prisma приходит null, Дата доставки как единственный признак завершённости, Строгий порядок выката: бэк → фронт, Итерация 2: поездка с несколькими пассажирами, Побочный эффект: метрика transferBaggage перестаёт быть нулевой, BaggageTagsInput — ввод бирок чипами (+38 more)

### Community 0 - "GraphQL: ядро запросов и формы заявок"
Cohesion: 0.01
Nodes (143): Своя багажная мутация updatePassengerRequestBaggageDriver, Размещение заявки в гостинице (выбор города и отеля, ветка access), TRANSFER_SING_IN, GET_MESSAGES_TRANSFER, GET_TRANSFER_REQUESTS, GET_TRANSFERS_COUNT, GET_TRANSFER_REQUEST, CREATE_TRANSFER_REQUEST_MUTATION (+135 more)

### Community 50 - "ФАП: трансфер — FapTransferPage, transportedCount и водитель"
Cohesion: 0.12
Nodes (15): Общий справочник VEHICLE_TYPES в fapConstants, Факт поездки = max(поимённый список, transportedCount), Числовая правка вверх не реоткрывает COMPLETED-услугу, Третье зеркало факт-хелпера: src/utils/transferFact.js в PWA, UPDATE_PASSENGER_REQUEST_DRIVER, FapDestructiveModal(), getTileMetrics(), driverCardKey() (+7 more)

### Community 6 - "ФАП: реестр и группы пассажиров"
Cohesion: 0.05
Nodes (63): GroupChip: гибридная кодировка связи (цвет + иконка + слово), Пять SVG-иконок типов связи в shared/icons, Rationale: strict backend→frontend deploy window (baggage), Handoff prompt: FAP passenger groups (2026-07-22), Passenger groups execution invariants (hard constraints), Спека: группы пассажиров + требование вида размещения, Группы пассажиров (PassengerRequestGroup): 5 типов + уровень «вместе», placementRequirement — требование вида размещения на человеке (+55 more)

### Community 1 - "ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms"
Cohesion: 0.04
Nodes (90): Отчёт: чипы групп в шапке номера (вариант Y), Отчёт: точка группы в строке гостя, Гейт видимости ворнингов групп: метки всем, ⚠ только canEdit, Инварианты рендера групп в FapHotelPage, Отчёт по гостинице: режимы Просмотр / Редактирование, FapReportView — read-only детализация отчёта, FapModeToggle — сегмент Просмотр/Редактирование, Spec: FAP hotel tariff billing mode «Койко-место»/«Номер» (2026-07-21) (+82 more)

### Community 11 - "Категории номеров и цены авиакомпании"
Cohesion: 0.07
Nodes (59): Исключение занятых аэропортов между договорами авиакомпании, «Выбрать всё» уважает getOptionDisabled, Подсказка о пропущенных аэропортах, Занятые аэропорты выводятся на клиенте из пропа addTarif, Ловушка: Create-опции по id, Edit-опции по value, SegmentedToggle — generic переключатель взаимоисключающих значений, Точное совпадение фильтра на бэке + fail-closed отправка полей, Спека: цены авиакомпании как источник тарифа в проживании ФАП (+51 more)

### Community 17 - "ФАП: трансфер — FapTransferPage и факт поездки"
Cohesion: 0.08
Nodes (36): Шапка Вариант B: одна primary-кнопка + overflow «⋯», Отклонение от макета: у авиакомпании остаются «История» и chip «Реестр», Дата рейса (flightDate) сквозняком: формы, деталка, карточка списка, шапка Excel, Единая шапка действий услуг ФАП, Правила видимости пунктов «Отчёт» и «История», Модуль FAP (FapV2) — заявки на пассажирские услуги, FapDetail — переходы статусов CREATED → ACCEPTED → IN_PROGRESS → COMPLETED, v12.3 — запуск ФАП v2 (+28 more)

### Community 39 - "Реестр договоров: фронт-правки (ДС-бейдж, пролонгация, истечение)"
Cohesion: 0.10
Nodes (22): Spec: Contract registry frontend edits (2026-07-07), Contract registry frontend edits (6 changes, front-only), Rationale: registry edits need zero backend change, «Архив ДС» tab (client-side active/archived split), «ДС: N» badge + agreements popover in the registry list, Prolongation chip in the contract list row, Unified expiration badge helper (getExpirationBadge), Rename «Вид приложения» → «Предмет договора» (airline-only) (+14 more)

### Community 35 - "Договоры: формы создания и правки"
Cohesion: 0.19
Nodes (22): ДС end date + prolongation + archive/restore, normalize(), CREATE_AIRLINE_CONTRACT, CREATE_AIRLINE_AA, UPDATE_AIRLINE_CONTRACT_AA, DELETE_AIRLINE_CONTRACT_AA, ARCHIVE_ADDITIONAL_AGREEMENT, RESTORE_ADDITIONAL_AGREEMENT (+14 more)

### Community 14 - "ФАП: книга отчёта Excel (buildReportSheets)"
Cohesion: 0.09
Nodes (56): Rationale: XLSX export needs no change under PER_ROOM, Белый список hotelIndexes в пяти точках выгрузки XLSX, Выгрузка текущей сводки одним листом XLSX, Excel-лист проживания: 22 колонки, дата рейса в шапке, единый экспортёр, Удаление легаси-контура отчёта: FapReport, маршрут report/:hotelIndex, SheetJS-экспорт, Экспорт полного отчёта одной книгой (5 листов), Номер заявки в таблице и в листах Excel (сдвиг колонок), Колонка «Перевезено» в Excel-листе трансфера (сдвиг «Суммы» I→J) (+48 more)

### Community 155 - "ФАП-аналитика: спеки фильтров «Пассажиры» и period-UX"
Cohesion: 0.67
Nodes (3): Spec: «Пассажиры» filters modal restyle, stage G (2026-07-24), Sectioned passenger filters modal (Период / Статусы / Параметры), Rationale: AirlineAnalytics.module.css must not be touched

### Community 30 - "ФАП-аналитика: PassengerAnalytics и мапперы"
Cohesion: 0.12
Nodes (32): Decade preset highlight via sameRange day comparison, Список «По заявкам»: 14 колонок → 6 двухэтажных, PassengerRequestDetailPanel — плитки услуг + чипы в палитре ФАП, Зебра по индексу map, а не через nth-child, D3 (per-passenger аналитика) отменён владельцем, formatNights/formatMoneyShort переезжают в passengerAnalyticsMappers, Frontend: 2 new columns, accordion row detail, 2 KPI tiles, 2-sheet XLSX, Аналитика по пассажирам, этап C: фильтры (статусы, мульти-аэропорт, АК-пикер) и период-UX (+24 more)

### Community 63 - "specs"
Cohesion: 0.09
Nodes (23): Спека: отчёт ФАП открывается АК только после «Отправить на проверку» (2026-07-31), План реализации: «Отправить на проверку» (7 задач, бэк→фронт), Отправка отчёта по проживанию на проверку (гейт видимости для АК), Поле submittedAt на PassengerRequestHotelReport + мутация submitPassengerRequestHotelReport, Сброс флага отправки только при реально изменившихся строках, Гейт только клиентский — серверной фильтрации reportRows не будет, Кнопка «Скрыть» и мутация hidePassengerRequestHotelReport (дополнение того же дня), Ловушки реализации гейта отчёта (+15 more)

### Community 4 - "ФАП: деталка заявки, проживание, доступ к отчёту"
Cohesion: 0.06
Nodes (73): fapReportAccess — единственное правило видимости отчёта, Страница поездки доставки багажа, Маппинг serviceKey → компонент услуги (FapServicePage), v12.15 (02.09.2026), v12.14 — отчёт по гостинице открывается АК после «Отправить на проверку» (submittedAt), v12.14 — изоляция данных ФАП по гостинице (isHotelScoped / scopedHotelId / canSeeExternalLinks), v12.14 — reopenPassengerRequestService, «Вернуть в работу», гейт reserveUpdateCompleted, v12.15 — согласование цен отчёта по проживанию ФАП (fapReportAccess.js, hideMoney для АК до approve) (+65 more)

### Community 16 - "ФАП: страницы-роуты и гейты доступа"
Cohesion: 0.08
Nodes (37): Спека: фильтр гостиниц по видимости (show) и активности (active) (2026-07-15), План: фильтр гостиниц active/show (6 задач), Фильтр списка гостиниц по show/active + бейджи состояния, HotelStatusBadge — пилюля «Неактивна»/«Скрыта», Гейтинг по роли вместо User.dispatcher (вариант B), Права доступа к заявкам через accessMenu, v12.7 — бейдж «Готовность к работе» + браузерные push-уведомления, GET_HOTELS (+29 more)

### Community 77 - "ФАП: импорт манифеста — parseManifestXlsx, ManifestUploadField, manifestCore"
Cohesion: 0.23
Nodes (15): isSameFlight/normalizeFlightNumber — нечёткое сравнение номеров рейсов, manifestCore.js — shared engine (normHeader, detectProfile, extractPeople), normHeader(), CYR_TO_LAT, normalizeFlightNumber(), isSameFlight(), matchRowColumns(), findColumns() (+7 more)

### Community 102 - "Passenger Analytics Summary Charts"
Cohesion: 0.14
Nodes (14): Спека: сводки по измерениям в аналитике по пассажирам (этап D1, 2026-07-23), План: сводки по измерениям (D1, 3 задачи), Режим «Сводки» во вкладке «Пассажиры» (по аэропортам/АК/месяцам), Агрегация на фронте — бэк не трогаем, Спека: единый поток аналитики «Пассажиры» (этап F), Единый скролл вкладки «Пассажиры» вместо тумблера режимов, Инварианты этапа F: фронт-only, ровно 3 файла, Спека: графики в аналитике по пассажирам (этап D2) (+6 more)

### Community 87 - "Passenger Analytics Aggregation"
Cohesion: 0.21
Nodes (16): buildSummary — движок агрегации сводок (passengerAnalyticsAggregations), Месяц считается сдвигом +3ч (МСК), а не по локали браузера, Семантика counted/all в сводках = семантика KPI-тоталов, buildChartData: топ-8 + «Прочие», исключение бакета без даты, МСК-границы периода аналитики (resolvePeriodBounds), Инвариант: гибрид периода и Mongo-грабля не трогаются, Программа доработки аналитики: этапы A→D, round2() (+8 more)

### Community 19 - "AddressField и геосаджест"
Cohesion: 0.08
Nodes (41): Spec: AddressField / YandexMapModal address data integrity (2026-07-14), AddressField query/anchor state model with lastEmittedRef echo detection, useAddressSuggestions hook (debounce + generation counter + accept), useReverseGeocode hook (generation counter + pending-coords buffer, ymaps in state), Geocoder contract change: {address, approximate} instead of '≈' baked into the string, Trap: anchor must be read via ref and kept out of the search effect deps, Decision: delete the Search/Map toggle and browser geolocation entirely, Deferred: YMaps provider, focus-trap/Escape, ARIA and dead CSS defects (+33 more)

### Community 134 - "ФАП: спеки профилей манифеста (ПМ/PNL/PLI)"
Cohesion: 0.25
Nodes (8): Spec: FAP multi-format manifest parsing via profiles (2026-07-07), Manifest format profiles (data-described formats + header auto-detection), PM and PNL profiles (two opposite age-category mechanics), Trap: remark tokens lie — INFT sits on the accompanying adults, Decision: PNL row anchor is a valid category code, not the registration number, Verification by Node scripts against real sample files (no frontend test runner), PAX_CATEGORY, PROFILES

### Community 119 - "ФАП: импорт манифеста — parseManifestXlsx, ManifestUploadField, manifestCore"
Cohesion: 0.25
Nodes (7): Preserved parser contract: {people, flightNumber, error} + manifestNameKey re-export, Блок загрузки манифеста ManifestUploadField, Младенцы на руках: счётчик на сопровождающем (хук lapInfants), ManifestImportModal(), ManifestUploadField(), plural(), INFANT

### Community 76 - "groupsCount и linkedPeopleCount в аналитике по пассажирам"
Cohesion: 0.12
Nodes (19): Spec: passenger analytics money/people detail pack, stage B (2026-07-23), Analytics detail pack: 18 new per-request scalars + 8 new totals, PassengerAnalyticsHotelBreakdown (live headcount vs report snapshot), Transfer split invariant: round2(arrival+departure+baggage+intercity) == transfer, Invariant: ghost report rows excluded from every new reportRows sum, Legacy fallbacks: personCategory null → ADULT, meal count ?? (price>0 ? 1 : 0), Deploy gate: backend first, frontend second (widened selection breaks old backend), Спека: аналитика ФАП — сводная таблица по заявкам (v1) (+11 more)

### Community 36 - "ФАП: подсказки групп по фамилиям (surnameForms, fapGroupSuggestions)"
Cohesion: 0.10
Nodes (28): Спека: распознавание женской формы фамилии в подсказках групп ФАП (2026-07-28), canonicalSurname — общий бесполый корень фамилии (латиница и кириллица), familyLabel — русский плюрал семьи с обратным транслитом (best-effort), sameStem и defaultGroupLabel переписаны через canonical (снят гейт CYRILLIC_RE), Гейтинг подсказок (соседние места / ребёнок) намеренно не меняется, Тесты морфологии на встроенном node --test (TDD, без новых зависимостей), Подсказки групп из манифеста (фронт-only, без персиста), hotelOverbookedBy() (+20 more)

### Community 28 - "useEffectiveAccessMenu: поток accessMenu Main_Page → MenuDispetcher → AllRoles"
Cohesion: 0.11
Nodes (29): Спека: приоритет доступа должность>отдел везде — общий хук useEffectiveAccessMenu (2026-07-08), Баг: роут-компоненты считали доступ только из отдела, игнорируя должность, useEffectiveAccessMenu(user) — единый источник резолюции, мёрж { ...отдел, ...effective }, Поток accessMenu: Main_Page → MenuDispetcher → AllRoles → RoleContent, effectiveAccessMenu — переопределения по должности, считается на бэке, v12.13 — useEffectiveAccessMenu в роут-компонентах, отчёты открыты авиакомпаниям, v12.15 — canManageAirlineAccess и resolveEffectiveAccessMenu в utils/access.js, GET_USER_EFFECTIVE_ACCESS_MENU (+21 more)

### Community 123 - "Passenger Document Recognition"
Cohesion: 0.22
Nodes (10): Спека: распознавание документа с фото (RepresentativePWA), Распознавание документа по фото (путь без штрихкода), Выбор связки Vision OCR → YandexGPT (Конфиг A), Мутация recognizePassengerDocument + тип RecognizedPassengerDoc, Контракт деградации: распознавание никогда не роняет поток, Единый объект boarding для фото- и штрихкод-пути, ScanTabs + DocumentPhotoScanner и редактируемое ФИО, Нормализация полей и эвристика confidence (+2 more)

### Community 59 - "AnalyticsForAvia"
Cohesion: 0.17
Nodes (17): Аддитивное расширение AnalyticsChart: case stackedBar + pieValueFormat, GET_ALL_DISPATCHERS, GET_ANALYTICS_AIRLINE_REQUESTS, GET_ANALYTICS_USERS, barDensityProps(), groupedSeriesDataIsEffectivelyEmpty(), simpleBarDataIsEffectivelyEmpty(), AnalyticsChart() (+9 more)

### Community 86 - "Патч-ноуты: backfill и seedPatchNotes.mjs"
Cohesion: 0.15
Nodes (14): Спека: backfill патч-ноутов 3.2.0 → 4.3.0, Backfill публичных патч-ноутов из README-чейнджлога, Переработка нумерации: patch-компонент вместо только minor, v12.15 — патч-ноут 4.4.0 и шаблон «Что нового» (patchNotes.data.mjs, systemUpdate.data.mjs), args, DRY_RUN, RECONCILE, untilIdx (+6 more)

### Community 47 - "CreateRequestDocumentation"
Cohesion: 0.14
Nodes (22): Два идемпотентных способа заливки патч-ноутов, CREATE_HOTEL, CREATE_PATCH_NOTE, CREATE_DOCUMENTATION, newId(), makeEmptyBlock(), updateTree(), removeFromTree() (+14 more)

### Community 118 - "ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms"
Cohesion: 0.18
Nodes (11): Узкая мутация assignPassengerRequestHotelRoom, Ловушка: updatePassengerRequestHotelPerson затирает поля гостя, Одиночное и пакетное присвоение номера через одну мутацию, Потеря полей гостя в updatePassengerRequestHotelPerson, Объединение трёх панелей уведомлений отдела, Мёртвые чекбоксы каналов на легаси-страницах, Затирание канальных флагов в true при частичном payload, Инъекция CSS-модуля пропом styles + showBulkToggle (+3 more)

### Community 131 - "ФАП: трансфер — FapTransferPage, transportedCount и водитель"
Cohesion: 0.25
Nodes (9): Привязка поездки трансфера ФАП к гостинице (hotelItemId), Поле «перевезено N» на поездке (transportedCount), Ослабление guard патча водителя: COMPLETED разрешён, режется только CANCELLED, Фильтр «Гостиница» и предвыбор заселённых в CatalogPickerModal, Порядок выката: бэк → фронт (новые поля трансфера), Отклонения при исполнении плана трансфера (одобрены ревью), 7 аддитивных полей строки отчёта (counts, ЛБ-флаги, lunchboxPrice), PWA: ввод «перевезено N» — диалог у водителя и поле у представителя (+1 more)

### Community 83 - "SettingsSidebar: права отдела и уведомления"
Cohesion: 0.22
Nodes (15): Единая AccessPermissionsPanel с пропами granularity/styles/sections/showBulkToggle, Конфиг секций прав accessSections.js (секции как данные), Стили инъекцией пропом styles вместо общего CSS, В режиме detailed нет каскада «доступ гасит действия», Отложено: слияние панелей уведомлений и расхождение organization/contracts, Вкладка «Доступ», Разделы прав доступа (Эскадрилья, Трансфер, Пассажиры, Отчёты…), EMPTY_MENU (+7 more)

### Community 149 - "PassengerAnalytics"
Cohesion: 0.40
Nodes (5): Метрики связей в аналитике ФАП: groupsCount и linkedPeopleCount, Столбец «Группы», KPI «Связано пассажиров» и колонка XLSX, Тотал linkedPeopleCount считается по ВСЕМ строкам, включая costMissing, Сдвиг firstMoneyCol при вставке не-денежной колонки (load-bearing), COLUMN_TYPE

### Community 154 - "ФАП-аналитика: спеки фильтров «Пассажиры» и period-UX"
Cohesion: 0.67
Nodes (3): Период по flightDate и счётчик noFlightDateCount, Пресеты декад в фильтре периода аналитики ФАП, Фильтр по периоду в списке заявок ФАП (/far)

### Community 85 - "utils"
Cohesion: 0.20
Nodes (12): Спека: ФАП — подсчёт суток проживания по длительности, Правило суток ФАП: минимум 1 сутки + 0.5 за начатый 12-часовой блок, Отдельная функция вместо флага-режима у существующей, Пересчёт daysCount при открытии сохранённого отчёта, calculateEffectiveCostDays(arrival, departure) — эффективные сутки с частичными, v11.11 (10.03.2026), v11.11 — появление эффективных суток (effectiveCostDays.js), v12.14 — calculateCostDaysByDuration: минимум сутки, +0,5 за каждый начатый 12-часовой блок (+4 more)

### Community 74 - "ФАП: книга отчёта Excel (buildReportSheets)"
Cohesion: 0.22
Nodes (16): Спека: пакет качества отчёта ФАП (personId, период, мелкие фиксы), personId в строках отчёта и единый матчинг строк к гостям, toNum(), lunchboxCountOf(), rowFoodCost(), isPersonRow(), frozenFieldsOf(), withoutTypename() (+8 more)

### Community 64 - "ФАП: профили манифеста (manifestProfiles, PLI, cleanFullName)"
Cohesion: 0.17
Nodes (21): Захват номера рейса с пробелом в PNL-манифесте, Спека: третий формат манифеста ФАП — PLI (выгрузка DCS), Профиль манифеста PLI (третий формат после ПМ и PNL), Хуки профиля readName/readSeat + firstLine для многострочных ячеек, v12.14 — манифест ПЛИ, младенцы отдельными строками, excelDate.js, s(), cleanFullName(), firstLine() (+13 more)

### Community 93 - "Excel-даты и парсер массового импорта (excelDate, parseBulkXlsx)"
Cohesion: 0.24
Nodes (13): Спека: импорт пассажирского манифеста (ПМ) в каталог заявки ФАП, Импорт пассажирского манифеста (форма ПМ) в каталог savedPassengers, Парсер формы ПМ на фронте (parseManifestXlsx), Отклонение от спеки: автоподстановка № рейса только при создании, Вне скоупа импорта манифеста ПМ, pad(), s(), excelSerialToParts() (+5 more)

### Community 97 - "NotificationsSidebar.jsx"
Cohesion: 0.18
Nodes (13): Ловушка: contractType обязателен в обеих живых подписках цен, Спека: бесконечный скролл в списке заявок ФАП (/far), Бесконечный скролл списка заявок ФАП (страница 30), refreshWindow() — перезапрос всего загруженного окна одним запросом, Ловушка: сентинел внутри грида нужно обернуть в grid-column: 1 / -1, v12.9 (28.06.2026), v12.9 — единый FilterPopoverButton и useInfiniteScroll, v12.13 — список /far на бесконечном скролле, refreshWindow() в useInfiniteScroll (+5 more)

### Community 26 - "UI-примитивы: Button, MUILoader, Toast, Sidebar"
Cohesion: 0.10
Nodes (30): Распознавание ошибок бэкенда про аэропорт (extractGeoConflictMessage), TZ off-by-one: рейс 1-го числа выпадал из обоих месяцев, Выбор должностей для авиакомпаний, Поток создания заявки (sidebar → мутация → подписка → refetch), Проверка на дубликаты заявок при создании, GET_AIRLINE_POSITIONS, CREATE_REQUEST_MUTATION, CREATE_PASSENGER_REQUEST (+22 more)

### Community 9 - "ФАП: страницы услуг и константы"
Cohesion: 0.05
Nodes (48): recomputeServiceStatus(prev, prevCount, nextCount) — единый пересчёт статуса услуги ФАП, Правила переоткрытия статуса услуги при изменении числа людей, Living и baggage добавлены в пересчёт статуса при правке плана (осознанная смена поведения), Update-мутации персон намеренно не трогаются, Массовые мутации удаления: removePassengerRequestPeople и removePassengerRequestDriverPeople, normalizeBulkIndexes + spliceAtIndexes: валидация до изменений, пачка целиком или никак, Уведомление авиакомпании при массовом удалении НЕ шлётся, Факт трансфера считается через transferFactCount, а не по длине списка людей (+40 more)

### Community 12 - "RoleContent: точки входа ролей и роуты FapV2"
Cohesion: 0.11
Nodes (43): Персист состояния вкладок аналитики (обе смонтированы), RoleContent — AllRoles.jsx выбирает контент по роли, Маршрут /documentation и пункт меню «Помощь», DocumentationList.jsx — обёртка с Header «Инструкции» и переключателем типа, PASSENGER_REQUEST_CREATED_SUBSCRIPTION, GET_HOTEL_CITY, AirlinePage(), AirlinesList() (+35 more)

### Community 135 - "ФАП: страницы услуг и константы"
Cohesion: 0.25
Nodes (8): Массовые мутации выселения и переселения ФАП, Арифметика индексов пачки (bulkHotelPeople), Проверка вместимости на всю пачку при переселении, Массовое удаление получателей услуг (§6a), REMOVE_PASSENGER_REQUEST_PEOPLE, REMOVE_PASSENGER_REQUEST_DRIVER_PEOPLE, RELOCATE_PASSENGER_REQUEST_HOTEL_PEOPLE, EVICT_PASSENGER_REQUEST_HOTEL_PEOPLE

### Community 137 - "Passenger Identity & Roster"
Cohesion: 0.29
Nodes (7): Правило: пачка = один read-modify-write, Пакетное заселение из реестра в PWA (useCatalogAdd), Гидрация заявки ФАП из ростера savedPassengers, Backend-propagation правки идентичности в ростер, Отклонение от спеки: propagation на бэке вместо маршрутизации на фронте, Backfill personId и ростера для исторических заявок, Граница: единство пассажира только через каталог

### Community 84 - "SettingsSidebar: панель уведомлений (notificationSections, payload)"
Cohesion: 0.25
Nodes (12): Общий buildNotificationPayload на 30 ключей, Вкладка «Уведомления», Структура строки уведомления (текст → MUISwitch → почта → браузер), EMPTY_MENU, NotificationsPermissionsPanel(), NotificationRow(), NOTIFICATION_SECTIONS, NOTIFICATION_MASTER_KEYS (+4 more)

### Community 34 - "Цепочка accessMenu рвётся до таба шахматки"
Cohesion: 0.09
Nodes (36): Голый маршрут /newPlacementV2/:idHotel — ни одного пропса, Цепочка accessMenu рвётся до таба шахматки, roles в модуле используются только для пикселей, Дефект: AddPassengersModalV2 недостижима, Дефект: запросы AddPassengersModalV2 уходят без skip, Дефект: отменённая бронь всегда возвращается в сайдбар эскадрильи, Дефект: пустое состояние сайдбаров проверяет нефильтрованный массив, PlacementDND v1 недостижим, но остаётся в бандле (+28 more)

### Community 100 - "Геометрия сетки (dayWidth, rowHeight = 50 × places)"
Cohesion: 0.29
Nodes (14): DAY_WIDTH = 40 живёт двумя жизнями: стартовый стейт и масштаб сайдбара, Расхождение 228 против 220 между шапкой и телом, Дефект: ResizeObserver пересоздаётся на каждом рендере, Дефект: containerRef пишут строка и все ячейки дня, Дубликат: 50 * room.type и голая 50, Шов: хук usePlacementGeometry, Вопрос: DAY_WIDTH = 40 должен был остаться масштабом сайдбара?, TimelineV2 — липкая шапка с полосой дней (+6 more)

### Community 81 - "Известные расхождения шахматки с конвенциями репозитория"
Cohesion: 0.14
Nodes (18): Горизонтальная координата дропа не читается никогда, Дефект: document-слушатели resize переживают unmount, Дефект: resize не валидирует порядок дат, Дефект: заблокированный по isOverlap resize всё равно открывает модалку, Ноль содержательных медиазапросов и нет тач-поддержки, Дубликат: блок resize-ручки — 2 дословные копии, Отклонение: инлайн sx вместо CSS-модулей, Отклонение: собственная очередь тостов вместо useToast (+10 more)

### Community 101 - "NewPlacementV2.jsx — оркестратор (1701 строка, 52% модуля)"
Cohesion: 0.21
Nodes (14): Дефект: resize сдвигает дату на сутки, Дефект: resize срабатывает без движения мыши, Дефект: по размещённой плашке нельзя открыть карточку заявки, Дефект: нарушение правил хуков в RoomRowV2, Дефект: простое наведение перерисовывает всю доску, ОПРОВЕРГНУТО: дубль useDraggable с тем же id в DragOverlay, ОПРОВЕРГНУТО: круг «UTC-цифр» внутри модуля рассогласован, Дубликат: сборка new Date(`${date}T${time}`) — 10 мест (+6 more)

### Community 56 - "Placement Dead Code Defects"
Cohesion: 0.16
Nodes (25): Дефект: заявку можно бросить в отключённую комнату, Дефект: нет onDragCancel — доска залипает в перетаскивании, Дефект: молчаливые провалы мутаций, Дефект: сдвиг койки внутри номера жёстко пишет status done, Клавиатурный drag-and-drop живёт по случайности, Кластер мёртвого кода модуля, Дубликат: блок оптимистичной вставки — 3 копии, Дубликат: сборка hotelChesses — 3 разошедшиеся копии (+17 more)

### Community 117 - "Placement Filters & Virtualization"
Cohesion: 0.31
Nodes (11): Дефект: рендерный TypeError при активном поиске, Дефект: мемоизация обнулена свежими Date вне мемо, Дефект: поиск матчит requestID, а показывается requestNumber, ОПРОВЕРГНУТО: getRoomHeight/itemKey падают на сжимающемся списке, Дубликат: eachDayOfInterval по месяцу — 4 раза за рендер, Вопрос: room.requests из buildFilteredRooms предполагался источником рендера?, placementFilters — поиск и сборка filteredRooms, Виртуализация строк (VariableSizeList) (+3 more)

### Community 61 - "SHAHMATKA ARCHITECTURE"
Cohesion: 0.15
Nodes (23): Дефект: getOverlappingRequests разыменовывает draggedRequest без защиты, Дефект: три документа пишут одно поле кэша hotel({id}), ОПРОВЕРГНУТО: эффект usePlacementData:329 зацикливается, Оценка точности SHAHMATKA_ARCHITECTURE.md, Дубликат: маппер пассажиров резерва — 2 копии по ~55 строк, Шахматка v2 — timeline-календарь размещения, usePlacementData — весь слой данных шахматки, Матчинг заявок и резервов с гостиницей по airport.id (+15 more)

### Community 96 - "Placement Overlap Logic"
Cohesion: 0.29
Nodes (15): Дефект: окно двойного бронирования после подтверждения, Дубликат: предикат пересечения — 4 копии, Отклонение: ноль тестов при чистой доменной логике, Инвариант: hasOverlap и getOverlappingRequests не взаимозаменяемы, Инвариант: getAvailablePosition возвращает undefined, а 0 — валидный ответ, Инвариант: интервалы полуоткрытые [in, out) во всех четырёх копиях, placementOverlap — две проверки пересечений, placementPositions.getAvailablePosition — выбор свободной койки (+7 more)

### Community 82 - "Цвета статусов и расхождение translateStatus с roles.js"
Cohesion: 0.18
Nodes (18): Дефект: handleSaveChanges отправляет status: "" для нераспознанного статуса, Дефект: оптимистичный дроп не удаляет карточку из newRequests, Дефект: статус резолвится по наличию chess.request, а не по значению, Русская строка статуса используется как ключ карты цветов, Дубликат: карта статус→цвет — 4 копии, Шов: единый словарь статусов на enum-ключах, Вопрос: удалять translateStatus в пользу roles.js?, Цвета статусов и расхождение translateStatus с roles.js (+10 more)

### Community 109 - "Placement Board Data Mapping"
Cohesion: 0.27
Nodes (12): Дефект: EditRequestNomerFond из шахматки получает урезанную комнату, Дефект: hotelChess с room: null исчезает бесследно, Отклонение: ~120 строк инлайн-JSX внутри колбэка VariableSizeList, Шов: компонент RoomLabelCell, Инвариант: сортировка mapRooms выживает только как tiebreak, Инвариант: инверсию room.id = имя / room.roomId = id нельзя потерять, Вопрос: hotelChess с room: null — реальное состояние бэка?, placementTransforms — сервер → «карточка размещения» (+4 more)

### Community 51 - "Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08)"
Cohesion: 0.11
Nodes (26): Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08), Правка: список заявок ФАП в учётке гостиницы — только заявки, где выбрана эта гостиница, Правка: в проживании ФАП показывать гостинице тариф по договору Карс Авиа↔гостиница, Правка: открепить квоту и резерв в шахматке, Правка: во вкладке «О гостинице» показывать контакты самой гостиницы, Правка: во вкладке «Номера» показывать цены гостиницы, а не цены для авиакомпании, Правка: во вкладке «Тарифы» раздела «О гостинице» показывать тарифы гостиницы, а не авиакомпании, Правка: убрать поле «рейтинг» из настроек гостиницы (+18 more)

### Community 120 - "HotelAboutTariffs"
Cohesion: 0.25
Nodes (10): Правка: услугу «трансфер» в заявке ФАП скрыть от гостиниц, не оказывающих трансфер, Правка: трансферные тарифы во вкладке «Тарифы» гостиницы — только если гостиница сама оказывает трансфер, SERVICE_KEYS, mealLabels, transferLabels, fmt(), fmtWithVat(), declension() (+2 more)

### Community 62 - "Call Backlog Review 03.08"
Cohesion: 0.12
Nodes (23): Созвон 03.08.2026: конструктор расчёта отчётов, Виды исчисления проживания, Часовая оплата — для АК «Россия», Скидки на проживание, Виды исчисления трансфера, Выбор тарифа трансфера, Расчёт по людям на авто или по авто, Скидки на авто (+15 more)

### Community 147 - "docs"
Cohesion: 0.50
Nodes (5): FAP-DECISIONS.md — decision history, Decision: baggage = trip with per-passenger tags and prices, FAP-HANDOVER.md — module handover to backend dev, FAP.md — backend documentation, FAP2.md — frontend documentation

### Community 40 - "Доки ФАП: FAP.md, FAP2.md, FAP-DECISIONS, FAP-HANDOVER"
Cohesion: 0.08
Nodes (30): Decision: no embedded→relational rewrite, Decision: report opens to airline only on submit, Decision: pin figures only in submitted reports, Decision: FAP days rules (duration, manual override, evictions), Decision: billing mode belongs to tariff (PER_BED/PER_ROOM), Decision: airline contract prices as third tariff source, Decision: personId is the identity canon, Decision: overbooking allowed, no hard blocks in FAP (+22 more)

### Community 116 - "docs"
Cohesion: 0.18
Nodes (11): Decision: row-level authorization, not content filtering, Decision: observation mode before hard enforcement, Constraint: role middleware ban in FAP, Passenger LK concept (target: October 2026), FAP_SCOPE_ENFORCE rollout (observation → hard mode), checkFapScopeReadiness.js (enforcement readiness probe), ExternalUser & magic links, withFapAuthGuard (auth whitelist) (+3 more)

### Community 148 - "docs"
Cohesion: 0.40
Nodes (5): Method: finder → adversarial verifier → stand measurement, Two-tier mutation envelope (withPassengerRequest), prismaDouble (test harness), Resolver split — stages 0–3 (12 resolver files + 23 services), Characterization test net (300+ tests)

### Community 78 - "App.jsx, AuthContext и index.html: точка входа приложения"
Cohesion: 0.17
Nodes (14): index.html — HTML-оболочка приложения, #root — точка монтирования React, Google Fonts: Montserrat, Inter, Nunito Sans, App(), AuthContext, getExternalUserContext(), AuthProvider(), useAuth() (+6 more)

### Community 145 - "SettingsSidebar: компонент и GraphQL-операции отдела"
Cohesion: 0.47
Nodes (6): SettingsSidebar — компонент настроек через боковое меню, Состав папки SettingsSidebar, Контракт пропсов SettingsSidebar, Режимы «Просмотр» и «Редактирование», Обработка ошибок сохранения настроек, SettingsSidebar()

### Community 2 - "Сессия и контексты: getCookie, useToast, useDialog, JWT"
Cohesion: 0.07
Nodes (90): Двойной режим type="airline" / type="dispatcher", getCookie(), getMediaUrl(), decodeJWT(), GET_ALL_POSITIONS, GET_AIRLINE_USERS_POSITIONS, GET_AIRLINES_UPDATE_SUBSCRIPTION, CREATE_AIRLINE_DEPARTMERT (+82 more)

### Community 89 - "Карточки «О компании» и медиа (getMediaUrl)"
Cohesion: 0.27
Nodes (9): GraphQL-операции SettingsSidebar, UPDATE_AIRLINE, GET_AIRLINE_COMPANY, GET_DISPATCHER_DEPARTMENTS, UPDATE_DISPATCHER_DEPARTMENT, ContactsIcon(), HomeIcon(), PinIcon() (+1 more)

### Community 3 - "UI-примитивы: Button, MUILoader, Toast, Sidebar"
Cohesion: 0.16
Nodes (29): Стилизация и переиспользование UI-примитивов, CREATE_DRIVER_MUTATION, UPDATE_DRIVER_MUTATION, CREATE_POSITION, CREATE_AIRLINE, CREATE_DISPATCHER_USER, UPDATE_DISPATCHER_USER, CREATE_REPORT (+21 more)

### Community 15 - "Роли, шапка и реестры договоров"
Cohesion: 0.10
Nodes (38): Экскурс: Эскадрилья и система заявок в KARS-AVIA CRM, Эскадрилья (модуль заявок на размещение экипажа), Многоуровневая серверная фильтрация заявок, Серверный поиск с debounce 500 мс, Пагинация заявок с синхронизацией URL (take: 50), GET_ORGANIZATIONS, GET_ORGANIZATION_CONTRACTS, DELETE_ORGANIZATION_CONTRACT (+30 more)

### Community 156 - "Эскадрилья: Estafeta, ExistRequest, статусы и roles"
Cohesion: 0.67
Nodes (3): Жизненный цикл заявки (created → opened → done → archived), Маппинг статусов заявки (англ. код → русское название), statusLabels

### Community 103 - "Шахматка v2: NewPlacementV2, utils и история версий"
Cohesion: 0.25
Nodes (12): Упрощённая обработка подписок через refetch(), Известные особенности и потенциальные улучшения Estafeta, REQUEST_CREATED_SUBSCRIPTION, REQUEST_UPDATED_SUBSCRIPTION, GET_BRONS_HOTEL, GET_HOTEL_MIN, usePlacementData(), translateStatus() (+4 more)

### Community 72 - "Шахматка v2: NewPlacementV2, utils и история версий"
Cohesion: 0.21
Nodes (14): Маршруты заявок (/relay, /hotels/:hotelId/:requestId, /newPlacement/:hotelId), Шахматка — PlacementDNDV2 (timeline-календарь заселения), v10.8 — появление шахматки V2 с модульной структурой, v12.15 — редизайн шахматки (NewPlacementV2, виды Неделя / Декада / Месяц, портал-поповер), v12.15 — единая доска без «Квота | Резерв» (−1260 строк), v12.15 — снос PlacementDND v1, react-window, TransferAdminOrdersContent, sameId(), NewPlacementV2() (+6 more)

### Community 38 - "CLAUDE.md / AGENTS.md: руководство и MUI-примитивы"
Cohesion: 0.11
Nodes (31): CLAUDE.md — руководство по репозиторию для Claude Code, Работа с кодом — правила кода, Визуальный стиль — следовать существующим паттернам, Экономия токенов — не объяснять, просто делать, Kars Avia — система размещения экипажей в гостиницах, Стек: React 18 (JSX), Vite 5, Apollo Client 3, MUI 6, React Router 6, Команды npm: dev / build / preview / lint, Окружения (.env): dev / demo / production, переключение в graphQL_requests.js (+23 more)

### Community 22 - "Аутентификация: authService, ExternalLogin и externalAuthErrors"
Cohesion: 0.08
Nodes (28): Структура src/ (App, main, AuthContext, services, contexts, hooks, utils, Components), v11.6 — UserActivityTracker (markUserOffline / markUserOnline), REFRESH_TOKEN, LOGOUT, REQUEST_RESET_PASSWORD, RESET_PASSWORD, VERIFY_EMAIL, MARK_USER_OFFLINE (+20 more)

### Community 25 - "Таблицы заявок: InfoTable, GroupedRequests, convertToDate / getMediaUrl"
Cohesion: 0.08
Nodes (25): Хелперы дат: convertToDate / convertToDateNew / buildScheduledISO, buildScheduledISO(), makeFormatter(), convertToDate(), SAVE_MEALS_MUTATION, SAVE_HANDLE_EXTEND_MUTATION, EXTEND_REQUEST_NOTIFICATION_SUBSCRIPTION, CHANGE_TO_ARCHIVE (+17 more)

### Community 146 - "SettingsSidebar: права отдела и уведомления"
Cohesion: 0.80
Nodes (5): accessMenu — feature-флаги внутри роли, Ключи accessMenu (menuAccess в roles.js), v12.14 — ключи accessManage / travellineMenu / reserveUpdateCompleted, accessSections.js, v12.15 — архив отчётов: «Текущие · Черновики · Архив», archiveReport / restoreReport, ключ reportDelete, menuAccess

### Community 115 - "SettingsSidebar: accessPayload.js и история версий доступа"
Cohesion: 0.27
Nodes (11): SettingsSidebar — панель прав доступа отдела (airline / dispatcher), accessStateRef — ref с внутренним состоянием панели прав, positionAccessMenusByPosId — доступ должностей к разделам (PositionOnDepartment), AccessPermissionsPanel — чисто UI, всё через пропсы, Визуальный disabled — opacity 0.55 на контейнере (класс rowDisabled), CSS-модули — свой .module.css у компонента, шаринг между соседями по папке, Визуальный disabled — opacity 0.55 на контейнере (класс rowDisabled), v12.5 (12.05.2026) (+3 more)

### Community 142 - "SettingsSidebar: accessPayload.js и история версий доступа"
Cohesion: 0.60
Nodes (5): buildAccessPayload(internalState) — internal → raw API, v12.10 (29.06.2026), v12.10 — «Должности и доступ» + effectiveAccessMenu (GET_USER_EFFECTIVE_ACCESS_MENU), buildAccessPayload(), ALL_TRUE_ACCESS

### Community 68 - "Отчёты v2: выпущенные отчёты, plural, hotelAddress (README v12.14)"
Cohesion: 0.18
Nodes (17): Раздел «Отчёты v2» (ReportsV2) — отчёты по заявкам эскадрильи, Черновики отчётов: createAirlineReportDraft / createHotelReportDraft → confirmReportDraft, Доменная логика без JSX: reportRules.js / reportDraftRows.js / reportDraftAge.js (+ node --test), Что нельзя ломать в «Отчётах v2», Границы периода …T00:10:00 / …T23:50:00 — часть расчёта, не форматирование, recalcRow — только для строк, которые правил пользователь, updateReportDraft перезаписывает весь массив строк без версии → явная кнопка сохранения, Что нельзя ломать в «Отчётах v2» (+9 more)

### Community 46 - "Отчёты v2: выпущенные отчёты, GraphQL и SegmentedToggle"
Cohesion: 0.11
Nodes (22): Гейты ролей раздела «Отчёты»: reportMenu, старый раздел только у SUPERADMIN, v12.14 (14.08.2026), v12.14 — релиз раздела «Отчёты v2» (черновики + пороги частичных суток), v12.14 — редактор черновика повторяет печатную форму реестра (18 колонок), группировка по гостиницам, v12.14 — выпущенный отчёт в режиме только чтения (ReportDraftEditor mode=view), plural.js, v12.14 — заселение сверх плана, массовые мутации, hotelAddress.js, v12.14 — FapSelect для всех списков, удалён RepresentativeHotelReportPage, v12.14 — шахматка: cache-and-network, мемоизация контекста, точечные подписки (+14 more)

### Community 53 - "Отчёты v2: правила расчёта суток (reportRules, ReportRulesSidebar)"
Cohesion: 0.16
Nodes (23): Пороги частичных суток — ReportPartialDaySetting, уровни GLOBAL / AIRLINE / HOTEL, v12.15 — «Правила расчёта суток» с уровнями GLOBAL / AIRLINE / HOTEL, resolveDraftPartialDayRules, GET_REPORT_PARTIAL_DAY_SETTINGS, UPSERT_REPORT_PARTIAL_DAY_SETTING, DELETE_REPORT_PARTIAL_DAY_SETTING, GET_AIRLINES_LIGHT, breakfastCellText(), FIELD_GROUPS (+15 more)

### Community 20 - "README: история версий"
Cohesion: 0.04
Nodes (45): README — история обновлений Kars Avia (v0.1 → v12.15), v0.1 (02.12.2024), v0.2 (04.12.2024), v0.3 (07.12.2024), v1.1 (18.12.2024), v1.2 (21.12.2024), v2.0 (09.01.2025), v2.1 (15.01.2025) (+37 more)

### Community 159 - "README: история версий"
Cohesion: 0.67
Nodes (3): v10.0 (19.09.2025), v10.1 (04.10.2025), v10.0 — страницы «Обновления» и «Инструкции» (древовидные статьи)

### Community 158 - "CLAUDE.md / AGENTS.md: руководство и MUI-примитивы"
Cohesion: 0.67
Nodes (3): v12.2 (14.04.2026), v12.2 — единый airlineAnalytics и экспорт аналитики в PDF, v12.2 — Script Runner (запись и воспроизведение сценариев, только SUPERADMIN)

### Community 150 - "utils"
Cohesion: 0.40
Nodes (5): v12.6 (18.05.2026), v12.7 (22.05.2026), v12.6+ — интеграция с TravelLine, v12.13 — TravelLine сертификация: дедлайн отмены, часовые пояса, корп. клиенты, v12.14 — TravelLine: корпоративный клиент в сайдбаре номеров, отдельный пункт меню

### Community 127 - "Меню, роли и эффективные права"
Cohesion: 0.40
Nodes (5): v12.12 — сгруппированные компактные меню на data-driven рендере, DelayedText(), AirlineAdminMenu(), HotelAdminMenu(), MenuNavIcons

### Community 66 - "ФАП: манифест фиксированной ширины и ICAO (manifestFixedWidth)"
Cohesion: 0.16
Nodes (19): v12.15 — форматы манифеста: фиксированная ширина, ICAO, Руслайн (шесть профилей), FIELDS, FIXED_WIDTH_HEADER, toLines(), nextTokenStart(), readLayout(), cut(), isReg() (+11 more)

### Community 48 - "Описание гостиницы: парсер hotelDescription и HotelPreview"
Cohesion: 0.14
Nodes (24): v12.15 — «О гостинице» адаптив, чипы удобств (hotelDescription.js, +26 тестов), AUTHORIZE_HOTEL_PREVIEW, HotelAbout_tabComponent(), HotelPreview(), VOID_TAGS, PARAGRAPH_TAGS, NAMED_ENTITIES, isCodePoint() (+16 more)

### Community 139 - "Сезонные цены тарифов: RoomKindSeasons UI и apolloErrorText"
Cohesion: 0.48
Nodes (4): v12.15 — сезонные цены тарифов гостиницы (RoomKindSeasons, roomKindSeasons.js, apolloErrorText.js), isPlainObject(), useBaggageTripDraft(), apolloErrorText()

### Community 75 - "Цены трансфера: transferPrices.js и поиск по маршрутам"
Cohesion: 0.21
Nodes (16): v12.15 — TravelLine SyncIndicator; поиск цен трансфера matchesTransferPriceSearch, AirlineTransferPrices_tabComponent(), InfoTableOrganizationTransferPrices(), OrganizationTransferPrices_tabComponent(), TransferPriceSidebarForm(), DEFAULT_TRANSFER_PRICES, TRANSFER_SEATER_KEYS, matchesTransferPriceSearch() (+8 more)

### Community 5 - "Документация «Помощь»: DocumentationList1, дерево и левая панель"
Cohesion: 0.05
Nodes (79): Раздел «Помощь» (Инструкции) — модуль документации, Иерархия компонентов: DocumentationList → Документация «Помощь»: DocumentationList1, дерево и левая панель → панели, Документация «Помощь»: DocumentationList1, дерево и левая панель — трёхзонный layout (дерево / контент / якоря), Типы документации: dispatcher / airline / hotel / representation → apiType, Переключатель типа только у superAdmin (hasDocumentationFilterSwitcherAccess), GraphQL API документации: sectionsWithHierarhy, article, CRUD секций/статей, upload, Нормализация дерева section/article из ответа (toLocalTreeNode), Левая панель — дерево инструкций (поиск, фильтр по типу узла) (+71 more)

### Community 79 - "storage"
Cohesion: 0.25
Nodes (16): Лейаут статьи (ширина, отступы) — saveDocLayout / docDraftStore, buildDocDraftId(), buildDocLayoutId(), loadDocContent(), loadDocDraft(), saveDocContent(), saveDocLayout(), randomId() (+8 more)

### Community 70 - "Документация: загрузка файлов (UploadContext, imageDropPlugin)"
Cohesion: 0.17
Nodes (16): DocumentationUploadContext (uploadImage / uploadFile) + DocumentationUploadStore, UPLOAD_DOCUMENTATION_IMAGE, UPLOAD_DOCUMENTATION_FILE, DocumentationUploadContext, isSameOriginAsServer(), ensureUploadedPath(), ensureLeadingSlash(), normalizeUploadsPath() (+8 more)

### Community 18 - "Документация: редактор Tiptap и расширения"
Cohesion: 0.06
Nodes (24): Редактор Tiptap — базовые расширения (StarterKit, Color, Highlight, FontSize, …), NavigationAnchor — атрибуты anchorTag / anchorId на paragraph и heading, Табличные расширения (TableWrapper, RowHeight, RowResizing, CellCursorPad, SelectionLock), Блоки контента: Quote, Toggle, Frame, Columns, Image, Gallery, Video, Audio, File, Ограничение VK-видео: iframe разрешён только на официальных сайтах партнёров, FontSize, BackgroundColor, NavigationAnchor (+16 more)

### Community 57 - "Документация: slash-команды и PlusButtonOverlay (Tiptap)"
Cohesion: 0.13
Nodes (17): SlashInterceptor + SlashCommand, BlockLassoSelectionPlugin, imageDropPlugin, clampNumber(), getTopLevelBlockPos(), getTopLevelStartPositions(), getInsertTargetPosForBlock(), PlusButtonOverlay(), clampDocPos(), getFirstTextCursorPosInNode() (+9 more)

### Community 7 - "TravelLine: поиск, бронирование, синхронизация"
Cohesion: 0.06
Nodes (60): mediaSrc(), GET_TL_CONFIG, SET_TL_CONFIG, GET_TL_ROOM_TYPES, GET_TL_RATE_PLANS, TL_PROPERTY_CALENDAR, TL_PROPERTIES_AVAILABILITY, GET_TL_RESERVATIONS (+52 more)

### Community 152 - "Сезонные цены категорий номеров (RoomKindSeasons)"
Cohesion: 0.83
Nodes (3): generateTimestampId(), emptySeasonDraft(), RoomKindSeasonsDraft()

### Community 110 - "TransferOrder"
Cohesion: 0.23
Nodes (8): UPDATE_TRANSFER_REQUEST_MUTATION, TRANSFER_UPDATED_SUBSCRIPTION, OrderInfoSidebar(), isFinishedOrCanceled(), EDITABLE_STATUSES, pad(), toDateAndTime(), TransferOrder()

### Community 42 - "Роли, шапка и реестры договоров"
Cohesion: 0.15
Nodes (20): DRIVERS_QUERY, ORGANIZATION_CREATED_SUBSCRIPTION, DRIVER_UPDATED_SUBSCRIPTION, GET_DISPATCHER_POSITIONS, GET_DISPATCHERS, GET_DISPATCHERS_SUBSCRIPTION, DELETE_DISPATCHER_USER, ConfirmDriver() (+12 more)

### Community 54 - "Страницы АК и автопарка: AirlinePage, DriversCompanyPage, роутинг по ролям"
Cohesion: 0.10
Nodes (21): GET_ORGANIZATION, DriversCompanyPage(), AirlineCompanyTab, AirlineShahmatkaTabStaff, AirlineAboutTab, AirlineRegisterOfContracts, AirlineAdminAirlineContent(), AirlineCompanyTab (+13 more)

### Community 43 - "Чаты и поддержка: Message, SupportPage, getMediaUrl"
Cohesion: 0.10
Nodes (23): REQUEST_MESSAGES_SUBSCRIPTION, GET_MESSAGES_HOTEL, SEND_FAP_MESSAGE, MARK_MESSAGE_AS_READ, MARK_ALL_MESSAGES_AS_READ, UPDATE_MESSAGE_BRON, GET_TRANSFER_CHATS, GET_TRANSFER_MESSAGES (+15 more)

### Community 136 - "NotificationsSidebar"
Cohesion: 0.32
Nodes (6): QUERY_NOTIFICATIONS, NOTIFICATIONS_SUBSCRIPTION, notificationDedupeKey(), separatorToType, NotificationsSidebar(), ExportIcon()

### Community 8 - "Резерв и размещение представителя"
Cohesion: 0.06
Nodes (53): GET_AIRLINES_RELAY, GET_HOTELS_RELAY, UPDATE_HOTEL_BRON, GET_RESERVE_LOGS, GET_RESERVE_REQUEST, CREATE_RESERVE_REPORT, ADD_HOTEL_TO_RESERVE, GET_RESERVE_REQUEST_HOTELS (+45 more)

### Community 124 - "TravelLine: поиск, бронирование, синхронизация"
Cohesion: 0.27
Nodes (7): GET_REQUEST, TL_AVAILABILITY, CREATE_TL_RESERVATION, formatDate(), nightsBetween(), parsePersonName(), TravellineRoomsSidebar()

### Community 138 - "Сессия и контексты: getCookie, useToast, useDialog, JWT"
Cohesion: 0.43
Nodes (6): UPDATE_PASSENGER_REQUEST, isoToTimeString(), isoToDateString(), buildPlannedFromTo(), initialFormState, EditRepresentativeRequest()

### Community 69 - "Резерв представителя: вкладки услуг (Habitation / Water / Power / Baggage) и DeleteIcon"
Cohesion: 0.16
Nodes (14): SET_PASSENGER_SERVICE_STATUS, REMOVE_PASSENGER_REQUEST_HOTEL, REMOVE_PASSENGER_REQUEST_DRIVER, COMPLETE_PASSENGER_REQUEST_WATER_EARLY, COMPLETE_PASSENGER_REQUEST_MEAL_EARLY, COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY, COMPLETE_PASSENGER_REQUEST_LIVING_EARLY, statusToLabel (+6 more)

### Community 90 - "RoleContent: точки входа ролей и роуты FapV2"
Cohesion: 0.20
Nodes (12): NEW_UNREAD_MESSAGE_SUBSCRIPTION, MESSAGE_SENT_SUBSCRIPTION, GET_DISPATCHER, Header(), Support(), DriversCompanyList, DriversList, DriversCompanyPage (+4 more)

### Community 41 - "Страница гостиницы: HotelPage, роутинг по ролям, ссылка предпросмотра"
Cohesion: 0.07
Nodes (19): CREATE_HOTEL_PREVIEW_LINK, PRESETS, HotelPreviewShareButton(), HotelAboutTab, HotelCompanyTab, HotelNomerFondTab, HotelShahmatkaTab, HotelTarifsTab (+11 more)

### Community 27 - "«О гостинице»: HotelAbout и иконки удобств"
Cohesion: 0.07
Nodes (17): GET_HOTEL_PREVIEW, GET_HOTEL_MEAL_PRICE, GET_HOTEL_TRANSFER_PRICE, AMENITY_ICONS, TABS, AirConditionerIcon(), BarIcon(), ConferenceIcon() (+9 more)

### Community 32 - "Категории номеров и цены авиакомпании"
Cohesion: 0.09
Nodes (27): GET_HOTEL_TARIFS, UPDATE_HOTEL, REORDER_ROOM_KIND_IMAGES, DELETE_HOTEL_CATEGORY, CreateRequestCategoryNomer(), bedsCategories, EditRequestCategory(), requests (+19 more)

### Community 29 - "Аналитика АК: AirlineAnalytics, мапперы и сортировка таблиц"
Cohesion: 0.12
Nodes (35): GET_AIRLINES, GET_AIRLINE_ANALYTICS, SERVICE_OPTIONS, isPeriodRangeComplete(), formatPeriodHuman(), formatPeriodWithDays(), ALL_AIRPORTS_OPTION, ALL_SERVICES_OPTION (+27 more)

### Community 31 - "Отчёты v2: черновик — reportDraftRows, useReportDraft"
Cohesion: 0.11
Nodes (32): GET_REPORT_DRAFT, GET_REPORT_DRAFT_PRESENTATION, UPDATE_REPORT_DRAFT, RECREATE_REPORT_DRAFT, CONFIRM_REPORT_DRAFT, SUBMIT_AIRLINE_REPORT_DRAFT, UNSUBMIT_AIRLINE_REPORT_DRAFT, DELETE_REPORT_DRAFT (+24 more)

### Community 33 - "Отчёты v2: таблица черновика — ReportDraftTable, Summary, группировка по гостиницам"
Cohesion: 0.10
Nodes (24): MY_REPORT_EDITABLE_FIELDS, SET_MY_REPORT_EDITABLE_FIELDS, ReportDraftDialog(), ReportDraftEmptyState(), ReportDraftErrorBanner(), ReportDraftFilters(), ReportDraftFooter(), ReportDraftGroupHeader() (+16 more)

### Community 108 - "Системные уведомления и патч-ноуты"
Cohesion: 0.29
Nodes (10): MAINTENANCE_BANNER, UPDATE_MAINTENANCE_BANNER, MAINTENANCE_BANNER_UPDATED, MaintenanceBannerBar(), MESSAGE_PRESETS, isoToLocalInput(), localInputToISO(), MaintenanceBannerSettings() (+2 more)

### Community 60 - "Системные уведомления и патч-ноуты"
Cohesion: 0.21
Nodes (20): SYSTEM_UPDATE, UPDATE_SYSTEM_UPDATE, SystemNotificationsSettings(), hasItems(), SystemUpdateCard(), emptyState(), SystemUpdateSettings(), AUDIENCE_ORDER (+12 more)

### Community 125 - "Документация: EditRequestDocumentation, дерево и TextEditorOutput"
Cohesion: 0.38
Nodes (9): UPDATE_DOCUMENTATION, newId(), toLocalNode(), stripNode(), collectImageGroups(), updateTreeById(), removeFromTreeById(), BlockItem() (+1 more)

### Community 126 - "package"
Cohesion: 0.20
Nodes (9): name, private, version, type, scripts, dev, build, lint (+1 more)

### Community 73 - "package.json: dependencies (Tiptap, MUI)"
Cohesion: 0.12
Nodes (20): dependencies, @mui/icons-material, @mui/icons-material, @tiptap/extension-color, @tiptap/extension-color, @tiptap/extension-highlight, @tiptap/extension-highlight, @tiptap/extension-table (+12 more)

### Community 157 - "package"
Cohesion: 0.67
Nodes (3): @tiptap/extension-table-cell, @tiptap/extension-table-cell, @tiptap/extension-table-header

### Community 143 - "ScriptRunner"
Cohesion: 0.33
Nodes (6): react-dom, react-dom, useDragResize(), DraggableWindow(), PickHighlight(), TargetMarkers()

### Community 104 - "ФАП: манифест из реестра и импорт (fapManifestBuild, ManifestImportModal)"
Cohesion: 0.29
Nodes (12): xlsx, xlsx, manifestPeople(), mark(), hasManifestRoster(), buildManifestRows(), buildManifestWorkbook(), manifestDownloadName() (+4 more)

### Community 88 - "package.json: devDependencies (Vite, ESLint)"
Cohesion: 0.12
Nodes (17): devDependencies, @types/react, @types/react, @types/react-dom, @types/react-dom, @vitejs/plugin-react, @vitejs/plugin-react, eslint (+9 more)

### Community 13 - "Svg-обёртка, иконки действий и меню «⋮»"
Cohesion: 0.06
Nodes (23): AirlineReadinessIndicator(), ExistRequestAdditionalMenu(), collapseBtnStyle, InfoTableDataAirlines(), collapseBtnStyle, InfoTableDataDispatcherCompany(), MENU_ITEMS, ReadinessIndicator() (+15 more)

### Community 151 - "GraphQL: ядро запросов и формы заявок"
Cohesion: 0.70
Nodes (4): initialState(), reducer(), packIntoLanes(), AirlineTablePageComponent()

### Community 98 - "HotelTable"
Cohesion: 0.23
Nodes (11): Booking(), BronInfo(), initialState(), reducer(), checkBookingConflict(), HotelTablePageComponent(), initialState(), reducer() (+3 more)

### Community 44 - "DocumentationListPanelContent"
Cohesion: 0.16
Nodes (26): EMPTY_DOC, DEFAULT_ARTICLE_PADDING, ARTICLE_WIDTH_PRESET_MAX, isDocJson(), normalizeIncomingDocContent(), isSameDocContentSemantically(), clamp(), normalizePadding() (+18 more)

### Community 21 - "Документация: медиа-блоки редактора"
Cohesion: 0.11
Nodes (30): useDocumentationUpload(), notifyDocumentationUploadFailure(), FONT_SIZE_MODAL_ESTIMATED_SIZE, fontSizeOptions, FontSizeSelect(), AUDIO_MODAL_ESTIMATED_SIZE, loadYouTubeIframeApi(), loadVkVideoApi() (+22 more)

### Community 24 - "Документация: тулбар и экспорт в Office"
Cohesion: 0.09
Nodes (36): getDocumentationUploadFile(), textColors, bgColors, ColorModal(), CustomStyleModal(), EXPORT_FORMATS, ExportModal(), ImportModal() (+28 more)

### Community 121 - "Документация: якоря навигации (AnchorHashOverlay)"
Cohesion: 0.36
Nodes (9): TEXT_NODE_TYPES, TEXT_BLOCK_TAGS, TABLE_NODE_TYPES, normalizeLabel(), buildAnchorsSignature(), isInsideTableNode(), AnchorHashOverlay(), buildAnchorDomId() (+1 more)

### Community 91 - "Документация: перетаскивание блоков (BlockDragOverlay)"
Cohesion: 0.24
Nodes (16): getEditorViewSafe(), getEditorDomSafe(), getClientPointFromEvent(), getTopLevelStartPositions(), getTopLevelBlockEl(), getTopLevelBlockPos(), getNodePosByDom(), getNearestTopLevelBlockElByClientY() (+8 more)

### Community 111 - "components"
Cohesion: 0.27
Nodes (9): rectFromPoints(), intersectRect(), isFormFieldTarget(), normalizeTargetToElement(), hasNativeTextSelectionInActiveField(), BlockSelectionOverlay(), BlockLassoSelectionKey, BlockLassoSelectionPMPlugin (+1 more)

### Community 105 - "Документация: LinkModal и иконки редактора"
Cohesion: 0.24
Nodes (11): linkStyles, renderLinkIcon(), getLinkStylePreviewStyle(), LinkModal(), LinkIcon(), ButtonIcon(), HighlightIcon(), DashedIcon() (+3 more)

### Community 49 - "Документация: медиа-блоки редактора"
Cohesion: 0.13
Nodes (20): FILE_MODAL_ESTIMATED_SIZE, BLOCK_TARGET_OPTIONS, getFileExtension(), getOfficePreviewUrl(), getPreviewKind(), TEXT_FILE_EXTENSIONS, CODE_FILE_EXTENSIONS, TEXT_FILENAMES (+12 more)

### Community 112 - "extensions"
Cohesion: 0.23
Nodes (8): parseMaybeInt(), GALLERY_LAYOUTS, GALLERY_FITS, normalizeGalleryLayout(), normalizeGalleryColumns(), normalizeGalleryGap(), normalizeGalleryFit(), GalleryBlock

### Community 122 - "Документация: блоки цитаты и рамки (quoteBlock, frameBlock)"
Cohesion: 0.35
Nodes (9): QuoteBlock, QUOTE_MODAL_ESTIMATED_SIZE, PRESET_COLORS, hexToRgb(), toQuoteBorderColor(), toQuoteAccentColor(), toQuoteButtonColor(), toQuoteTextColor() (+1 more)

### Community 45 - "Документация: высота строк таблицы (tableRowResizing)"
Cohesion: 0.12
Nodes (24): tableRowResizingPluginKey, RowResizeState, domCellAround(), rowDomAtCellPos(), edgeCell(), edgeCellHorizontal(), updateHandle(), updateCornerHandle() (+16 more)

### Community 80 - "Документация: обёртка таблицы, перенос строк и колонок (tableWrapperView)"
Cohesion: 0.24
Nodes (18): TABLE_HEADER_MODAL_ESTIMATE, TABLE_HEADER_PRESET_COLORS, findTable(), ensureSelectionInThisTable(), isSelectionInsideTable(), forceCursorBackIntoTable(), moveCursorLeft(), removeLastRow() (+10 more)

### Community 58 - "Документация: импорт DOCX (docxImport)"
Cohesion: 0.19
Nodes (24): escapeHtml(), wordVal(), relId(), wordBoolean(), halfPointsToPx(), wordColorToCss(), wordHighlightToCss(), findFirstChild() (+16 more)

### Community 94 - "EditRequestDocumentation"
Cohesion: 0.22
Nodes (12): newId(), toLocalNode(), stripNode(), collectImageGroups(), updateTreeById(), removeFromTreeById(), BlockItem(), EditRequestUpdates() (+4 more)

### Community 106 - "FapV2"
Cohesion: 0.29
Nodes (11): QUICK_PERCENTS, EMPTY_PRESETS, EMPTY_CUSTOM, clampInput(), FapDiscountDialog(), DISCOUNT_ZONES, clampPercent(), zoneMembers() (+3 more)

### Community 113 - "ФАП: трансфер — FapTransferPage и факт поездки"
Cohesion: 0.36
Nodes (9): baseNameOf(), withoutTimestamp(), extensionOf(), flightSlug(), manifestUploadName(), isManifestFile(), parseManifestFile(), manifestFilesNewestFirst() (+1 more)

### Community 65 - "ФАП: книга отчёта Excel (buildReportSheets)"
Cohesion: 0.14
Nodes (20): makeRequest(), makeRequestWithGuest(), guestSheet(), combinedSheet(), makeBaggageRequest(), baggageSheet(), makeFullServiceRequest(), throwOnError() (+12 more)

### Community 99 - "Таблицы заявок: InfoTable, GroupedRequests, convertToDate / getMediaUrl"
Cohesion: 0.24
Nodes (12): MONTHS, WORK_STATUSES, requestWord(), tileInitials(), groupStats(), metaFor(), GroupAvatar(), GroupedRequests() (+4 more)

### Community 140 - "Таблицы InfoTableData* и готовность отделов (readiness)"
Cohesion: 0.38
Nodes (5): VAT_PERCENT, fmtPrice(), fmtWithVat(), PriceStack(), InfoTableDataTarifs()

### Community 37 - "Отчёты v2: строка черновика — ReportDraftRow, editorUtils, formatMoney"
Cohesion: 0.17
Nodes (32): ReportDraftEditor(), ReportDraftRow(), formatDays(), trimSeconds(), reportDateToInputValue(), inputValueToReportDate(), DRAFT_SORT_TYPES, sortDraftRows() (+24 more)

### Community 71 - "Сезонные цены категорий номеров (RoomKindSeasons)"
Cohesion: 0.23
Nodes (17): EMPTY_FORM, RoomKindSeasons(), SeasonRowEditor(), useRoomKindSeasons(), buildDateInputValue(), toDateInputValue(), toDisplayDate(), formatSeasonRange() (+9 more)

### Community 52 - "ScriptRunner: исполнение действий и DOM-хелперы"
Cohesion: 0.08
Nodes (6): collectScripts(), collectAllScripts(), countScripts(), ACTION_TYPES, KEY_OPTIONS, RESIZE_DIRS

### Community 67 - "ScriptRunner: компонент, сбор скриптов и селекторы"
Cohesion: 0.12
Nodes (22): generateSelector(), makeSafeFileName(), findNodeById(), updateNodeById(), removeNodeById(), insertNode(), isDescendantOf(), moveNode() (+14 more)

### Community 141 - "ScriptRunner: исполнение действий и DOM-хелперы"
Cohesion: 0.29
Nodes (7): sleep(), getUnderlyingElement(), resolveEditableElement(), normalizeDateLikeValue(), setElementValue(), isScriptRunnerControl(), executeAction()

### Community 128 - "ScriptRunner"
Cohesion: 0.33
Nodes (10): isPlainObject(), isValidActionItem(), isValidActionsArray(), generateId(), assignIdsToTree(), migrateFromFlatFormat(), flatObjectToTree(), isValidTreeNode() (+2 more)

### Community 114 - "ScriptRunner"
Cohesion: 0.24
Nodes (12): parseActionDate(), formatIsoDate(), formatRuDate(), generateRandomDateValue(), parseActionTime(), formatTimeFromMinutes(), randomInt(), getPreviousActionValue() (+4 more)

### Community 132 - "Страницы АК и автопарка: AirlinePage, DriversCompanyPage, роутинг по ролям"
Cohesion: 0.22
Nodes (8): DriversCompanyTab, AirlineTarifsTab, AirlineRegisterOfContracts, AirlineShahmatkaTabStaff, OrganizationAboutTab, OrganizationRegisterOfContracts, OrganizationTransferPricesTab, TransferAdminDriversContent()

### Community 23 - "HotelPMS (мок-данные)"
Cohesion: 0.09
Nodes (27): HotelPMS(), uid(), Bookings(), Dashboard(), HK_FLOW, Housekeeping(), Reports(), Rooms() (+19 more)

### Community 133 - "Аналитика АК: AirlineAnalytics, мапперы и сортировка таблиц"
Cohesion: 0.44
Nodes (8): cmpNum(), cmpStr(), STR_SORT_KEYS, sortRowsByKey(), sortPositionRows(), sortAirportRows(), sortMergedRequestRows(), sortSegmentBlocks()

### Community 129 - "Авторизация: App, AuthContext, authService"
Cohesion: 0.38
Nodes (7): Login(), LoginRedirect(), NO_RETURN_PATHS, normalizePath(), isReturnable(), buildLoginPath(), resolveLoginTarget()

### Community 55 - "Шахматка v2: плашки, лоток и бейджи статусов (PlacementBarV2, TrayCardV2)"
Cohesion: 0.11
Nodes (16): MEAL_LABELS, BarPopover(), LEGEND_ITEMS, BoardToolbar(), PlacementBarV2(), layoutBar(), fmtShort(), MONTH (+8 more)

### Community 92 - "Шахматка v2: период и шапка сетки (placementPeriod, GridHeader)"
Cohesion: 0.21
Nodes (12): VIEW_TABS, GridHeader(), capitalize(), weekTitle(), decadeIndex(), decadeRange(), periodRange(), buildPeriod() (+4 more)

### Community 95 - "Шахматка v2: плашки, лоток и бейджи статусов (PlacementBarV2, TrayCardV2)"
Cohesion: 0.18
Nodes (10): TrayCardV2(), UnplacedTray(), countOccupiedLanes(), waitBadge(), bedsLabel(), NOW, NEW_STYLE, WARN_STYLE (+2 more)

### Community 130 - "services"
Cohesion: 0.36
Nodes (9): isExternalUser(), AUTH_CODES_NO_RETRY, AUTH_CODES_REFRESH, isAuthError(), shouldLogoutImmediately(), isRefreshOrLogin(), doRefresh(), singleFlightRefresh() (+1 more)

### Community 107 - "ФАП: тесты профилей манифеста"
Cohesion: 0.15
Nodes (10): WIDE_HEADER, NARROW_HEADER, narrowSheet(), detectNarrow(), VED_AT, VED_ROWS, ICAO_ROWS, RUSLINE_GROUPS (+2 more)

## Ambiguous Edges - Review These
- `Ворнинги групп W1/W2/W3 (computeFapGroupWarnings)` → `FapLivingPage.jsx`  [AMBIGUOUS]
  docs/superpowers/specs/2026-07-22-fap-passenger-groups-design.md · relation: conceptually_related_to
- `Обработка ошибок сохранения настроек` → `useToast()`  [AMBIGUOUS]
  src/Components/Blocks/SettingsSidebar/README.md · relation: references

## Knowledge Gaps
- **514 isolated node(s):** `Побочный эффект: метрика transferBaggage перестаёт быть нулевой`, `Подсказка о пропущенных аэропортах`, `Spec: Contract registry frontend edits (2026-07-07)`, `Prolongation chip in the contract list row`, `Spec: FAP hotel tariff billing mode «Койко-место»/«Номер» (2026-07-21)` (+509 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **57 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Ворнинги групп W1/W2/W3 (computeFapGroupWarnings)` and `FapLivingPage.jsx`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Обработка ошибок сохранения настроек` and `useToast()`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `getCookie()` connect `Сессия и контексты: getCookie, useToast, useDialog, JWT` to `GraphQL: ядро запросов и формы заявок`, `ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms`, `UI-примитивы: Button, MUILoader, Toast, Sidebar`, `ФАП: деталка заявки, проживание, доступ к отчёту`, `Документация «Помощь»: DocumentationList1, дерево и левая панель`, `ФАП: реестр и группы пассажиров`, `TravelLine: поиск, бронирование, синхронизация`, `Резерв и размещение представителя`, `ФАП: страницы услуг и константы`, `ФАП: багаж и поездки`, `Категории номеров и цены авиакомпании`, `RoleContent: точки входа ролей и роуты FapV2`, `Сессия и контексты: getCookie, useToast, useDialog, JWT`, `Сезонные цены тарифов: RoomKindSeasons UI и apolloErrorText`, `Роли, шапка и реестры договоров`, `ФАП: страницы-роуты и гейты доступа`, `ФАП: трансфер — FapTransferPage и факт поездки`, `SettingsSidebar: компонент и GraphQL-операции отдела`, `Документация: медиа-блоки редактора`, `Аутентификация: authService, ExternalLogin и externalAuthErrors`, `GraphQL: ядро запросов и формы заявок`, `Таблицы заявок: InfoTable, GroupedRequests, convertToDate / getMediaUrl`, `UI-примитивы: Button, MUILoader, Toast, Sidebar`, `«О гостинице»: HotelAbout и иконки удобств`, `useEffectiveAccessMenu: поток accessMenu Main_Page → MenuDispetcher → AllRoles`, `Аналитика АК: AirlineAnalytics, мапперы и сортировка таблиц`, `ФАП-аналитика: PassengerAnalytics и мапперы`, `Отчёты v2: черновик — reportDraftRows, useReportDraft`, `Категории номеров и цены авиакомпании`, `Сессия и контексты: getCookie, useToast, useDialog, JWT`, `Отчёты v2: таблица черновика — ReportDraftTable, Summary, группировка по гостиницам`, `Договоры: формы создания и правки`, `Отчёты v2: строка черновика — ReportDraftRow, editorUtils, formatMoney`, `Страница гостиницы: HotelPage, роутинг по ролям, ссылка предпросмотра`, `Роли, шапка и реестры договоров`, `DocumentationListPanelContent`, `Отчёты v2: выпущенные отчёты, GraphQL и SegmentedToggle`, `CreateRequestDocumentation`, `Описание гостиницы: парсер hotelDescription и HotelPreview`, `ФАП: трансфер — FapTransferPage, transportedCount и водитель`, `Отчёты v2: правила расчёта суток (reportRules, ReportRulesSidebar)`, `Страницы АК и автопарка: AirlinePage, DriversCompanyPage, роутинг по ролям`, `AnalyticsForAvia`, `Системные уведомления и патч-ноуты`, `Резерв представителя: вкладки услуг (Habitation / Water / Power / Baggage) и DeleteIcon`, `Документация: загрузка файлов (UploadContext, imageDropPlugin)`, `Сезонные цены категорий номеров (RoomKindSeasons)`, `Шахматка v2: NewPlacementV2, utils и история версий`, `Цены трансфера: transferPrices.js и поиск по маршрутам`, `Карточки «О компании» и медиа (getMediaUrl)`, `RoleContent: точки входа ролей и роуты FapV2`, `EditRequestDocumentation`, `HotelTable`, `Системные уведомления и патч-ноуты`, `TransferOrder`, `Документация: блоки цитаты и рамки (quoteBlock, frameBlock)`, `TravelLine: поиск, бронирование, синхронизация`, `Документация: EditRequestDocumentation, дерево и TextEditorOutput`?**
  _High betweenness centrality (0.209) - this node is a cross-community bridge._
- **Why does `dependencies` connect `package.json: dependencies (Tiptap, MUI)` to `ФАП: деталка заявки, проживание, доступ к отчёту`, `ScriptRunner`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `package`, `ФАП: манифест из реестра и импорт (fapManifestBuild, ManifestImportModal)`, `package`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `README — история обновлений Kars Avia (v0.1 → v12.15)` connect `README: история версий` to `ФАП: отчёт по гостинице — FapHotelPage, FapReportView, fapRooms`, `ФАП: деталка заявки, проживание, доступ к отчёту`, `SettingsSidebar: accessPayload.js и история версий доступа`, `utils`, `CLAUDE.md / AGENTS.md: руководство и MUI-примитивы`, `README: история версий`, `Отчёты v2: выпущенные отчёты, GraphQL и SegmentedToggle`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `README: история версий`, `utils`, `README: история версий`, `README: история версий`, `NotificationsSidebar.jsx`, `SettingsSidebar: accessPayload.js и история версий доступа`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `Побочный эффект: метрика transferBaggage перестаёт быть нулевой`, `Подсказка о пропущенных аэропортах`, `Spec: Contract registry frontend edits (2026-07-07)` to the rest of the system?**
  _514 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ФАП: багаж и поездки` be split into smaller, more focused modules?**
  _Cohesion score 0.04528158295281583 - nodes in this community are weakly interconnected._