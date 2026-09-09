# Graph Report - C:\github\kars-avia  (2026-08-24)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 3831 nodes · 12735 edges · 200 communities (156 shown, 44 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 340 edges (avg confidence: 0.77)
- Token cost: 111,871 input · 2,995 output

## Graph Freshness
- Built from commit: `0b9711c4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- FAP Requests & Contract Deletion
- Passenger Request Add Mutations
- UI Primitives & Create Mutations
- Auth Helpers & Positions
- Airline Contracts & Agreements
- Tiptap Audio & Font Blocks
- Airline Analytics Charts
- Tiptap Editor Extensions
- Notification Permissions Panel
- Address Field & Roster Import
- Request Server Filtering
- FAP List Infinite Scroll
- Bulk Person Mutations & Status
- Reserve Requests & Hotel Persons
- Baggage Delivery Card
- TravelLine Integration
- FAP Chat & Baggage Trip
- Project Domain Concepts
- App Bootstrap & Auth Errors
- Hotel PMS Pages
- Tiptap Toolbar Modals
- Airline & Documentation Pages
- FAP Service Early Complete
- Report Draft Mutations
- FAP Service Action Header
- Tiptap File Block View
- Info Table Components
- FAP Passenger Roster & Manifest
- FAP Registry & Living Mismatch
- Documentation Articles CRUD
- FAP Hotel Tariff Billing
- Pluralization Helper
- FAP Passenger Analytics Filters
- Menu Counts & Subscriptions
- XLSX Report Sheet Builder
- Documentation Tree List
- Hotel Status & Request Lists
- README Changelog History
- Tiptap Doc Layout Panel
- Chat Messages & Subscriptions
- Hotel Preview Link
- Documentation Tree Editing
- Tiptap Table Row Resizing
- FAP Group Surname Suggestions
- Hotel Room Fund Categories
- Report Draft Row Editor
- Call Backlog Review 03.08
- Placement V2 Study Defects
- Placement Resize Defects
- Effective Access Menu Hook
- DOCX Import Utility
- Placement Dead Code Defects
- Maintenance Banner & System Update
- Script Runner
- Placement Access Gate Defects
- Role Access Control
- Transfer Order Sidebar
- FAP Bulk Evict & Relocate
- Runtime Dependencies
- Contract Registry Frontend
- Avatar Upload & Org About
- Room Categories Dictionary
- Report Partial-Day Rules
- Documentation Upload Context
- Airline Price As FAP Tariff
- Airline Tariff Geography
- Placement Status Color Map
- Manifest Format Profiles
- Placement Request Plaque Defects
- Manifest PLI/PNL Profiles
- Airline/Hotel Readiness Indicators
- Hotel About Tab
- Create Documentation & Patch Notes
- Tiptap Table Wrapper
- Access Permissions Panel
- Passenger Analytics Aggregation
- Hotel Account Call Fixes
- Script Runner Export Utils
- Squadron Request Placement
- Dev Dependencies
- Doc Draft IndexedDB Store
- Tiptap Block Drag Overlay
- Patch Notes Backfill Seed
- Hotel Booking Table
- Documentation Filters
- Report Draft Editor UI
- Placement Overlap Logic
- Room Kind Seasons & Baggage Draft
- Fixed-Width Manifest Parsing
- Placement Grid Geometry
- Passenger Analytics Summary Charts
- Passenger Analytics XLSX Export
- Report Draft Footer & Summary
- Department Settings Sidebar
- Access Permissions Panel
- Tiptap Link Modal & Icons
- FAP Passenger Groups & Baggage
- Contract Type Toggle
- Request Updates Editor
- Placement Board Data Mapping
- Placement Filters & Virtualization
- Passenger Room Assignment & Notifications
- Tariff Geography Selection
- Block Lasso Selection
- Gallery Block Editor
- Script Runner Date Helpers
- FAP Scope Authorization
- Passenger Manifest Import
- Hotel Tariffs Display
- Tiptap Navigation Anchors
- Quote Block Editor
- Bulk XLSX Import Parsing
- Passenger Document Recognition
- Hotel Active/Show Filter
- Tariff Price Display
- FAP Analytics Group Metrics
- Package Manifest
- FAP Service Visibility Tests
- Action Tree Import/Migration
- Placement Request Modals
- Manifest Profile Parsing
- Transfer Report Fields
- FAP Passenger Analytics Backend
- Transfer Prices Form
- Report Draft Table UI
- Airline Admin Content Tabs
- Hotel & Transfer Admin Tabs
- Airport Exclusion Selection
- dnd-kit Library
- Passenger Identity & Roster
- Passenger Analytics Detail Pack
- FAP Report Send-For-Review
- Lodash Library
- Documentation & Rich-Text Blocks
- Tiptap Block Registry
- Passenger Request Creation
- Script Runner Element Actions
- Tree Node Manipulation
- Yandex Maps Library
- React Grid Layout
- React Resizable
- Tiptap Table Extension
- Tiptap Table Header
- Draggable Window Overlay
- Plus Button Overlay
- Tiptap Table Row
- Tiptap Text Align
- Backend Test Harness & Resolvers
- Airline Table Page
- Airline Price Contract Type
- Script Runner Context
- Tiptap Table Cell
- File Upload
- Released Reports Draft
- MUI Confirm Dialog
- Hotel Address Composer
- Project Guide Docs
- Apollo Client
- Apollo Upload Client
- Emoji Picker
- Emotion React
- Emotion Styled
- ExcelJS
- GraphQL
- GraphQL WS
- html2pdf
- MUI Icons
- MUI Material
- Mutation Events
- React Draggable
- React Easy Crop
- React Input Mask
- React Paginate
- React Quill
- React Tabs
- Recharts
- Tiptap Core
- Tiptap Highlight
- Tiptap Placeholder
- Tiptap Text Style
- Tiptap Underline
- Tiptap ProseMirror
- Tiptap React
- Tiptap Starter Kit
- GraphQL Operations File

## God Nodes (most connected - your core abstractions)
1. `getCookie()` - 357 edges
2. `useToast()` - 171 edges
3. `MUILoader()` - 150 edges
4. `useDialog()` - 140 edges
5. `getMediaUrl()` - 132 edges
6. `Button()` - 130 edges
7. `convertToDate()` - 93 edges
8. `Sidebar()` - 87 edges
9. `CloseIcon()` - 82 edges
10. `decodeJWT()` - 67 edges

## Surprising Connections (you probably didn't know these)
- `ФАП: карточка доставки багажа по составу реальных документов` --semantically_similar_to--> `FapTransferPage()`  [INFERRED] [semantically similar]
  docs/superpowers/specs/2026-07-27-fap-baggage-delivery-fields-design.md → src/Components/Blocks/FapV2/FapTransferPage/FapTransferPage.jsx
- `Конфиг секций уведомлений и правило имён каналов` --semantically_similar_to--> `ACCESS_SECTIONS`  [INFERRED] [semantically similar]
  docs/superpowers/specs/2026-07-30-notifications-panel-merge-design.md → src/Components/Blocks/SettingsSidebar/accessSections.js
- `МСК-границы периода аналитики (resolvePeriodBounds)` --semantically_similar_to--> `mskMonthKey()`  [INFERRED] [semantically similar]
  docs/superpowers/specs/2026-07-23-fap-analytics-period-bounds-design.md → src/Components/Pages/AnalyticsForAvia/tabs/PassengerAnalytics/passengerAnalyticsAggregations.js
- `Airport.address во всех селектах аэропорта` --references--> `GET_PASSENGER_REQUEST`  [INFERRED]
  docs/superpowers/specs/2026-07-30-airline-price-contract-type-and-airport-address-design.md → graphQL_requests.js
- `Ланчбокс в тарифах` --relates_to--> `lunchboxPriceFor()`  [INFERRED]
  graphify-out/transcripts/Правки_по_авии_03_08_2026.txt → src/Components/Blocks/FapV2/FapHotelPage/FapHotelPage.jsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **FAP authorization model (auth guard, scoping, client gates)** — docs_fap_withfapauthguard, docs_fap_fap_scope, docs_fap_resolvescope, docs_fap_handover_fap_scope_enforce, docs_fap2_fapeditaccess, docs_fap_decisions_row_level_auth [EXTRACTED 1.00]
- **Hotel accommodation report money flow (front engine → reportRows → export/analytics)** — docs_fap2_faphotelpage, docs_fap2_geteffectiverow, docs_fap_hotelreport, docs_fap_ghost_rows, docs_fap2_buildreportsheets, docs_fap2_passenger_analytics [EXTRACTED 1.00]
- **Passenger identity system (personId canon, registry, hydration, manifest)** — docs_fap_savedpassengers, docs_fap_hydratepassengerrequest, docs_fap_decisions_personid_canon, docs_fap2_fapregistry, docs_fap2_manifest_import [EXTRACTED 1.00]
- **Учётка гостиницы должна показывать данные стороны гостиницы (договор Карс Авиа↔гостиница), а не диспетчерские данные для авиакомпании** — graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_kontakty_gostinicy_v_o_gostinice, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_ceny_gostinicy_v_nomerah, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_tarify_gostinicy_vmesto_aviakompanii, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_fap_prozhivanie_tarif_dogovora, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_ubrat_reyting_iz_nastroek, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_ubrat_skidku_iz_nastroek, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_ubrat_vidimost_gostinicy, src_components_rolecontent_hoteladmincontent_hoteladminhotelcontent_hoteladminhotelcontent [INFERRED 0.85]
- **Гостиница видит в ФАП только свой скоуп: свои заявки, без чужого трансфера и цен сторонних подрядчиков** — graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_fap_zayavki_tolko_svoej_gostinicy, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_transfer_usluga_skryt_bez_transfera, graphify_out_transcripts_pravki_2026_08_04_uchetka_gostinicy_transfer_tarify_tolko_svoi [INFERRED 0.85]
- **Поверхность двойного бронирования в шахматке v2** — docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_double_booking_window, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_drop_into_inactive_room, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_getoverlapping_deref, docs_superpowers_2026_08_17_placement_v2_frontend_study_inv_overlap_functions_not_interchangeable, docs_superpowers_2026_08_17_placement_v2_frontend_study_dup_overlap_predicate [INFERRED 0.85]
- **Resize-тракт: где ломаются даты** — docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_resize_day_shift, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_resize_fires_without_movement, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_resize_no_date_order_check, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_blocked_resize_opens_modal, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_resize_listeners_survive_unmount, docs_superpowers_2026_08_17_placement_v2_frontend_study_dup_date_string_parsing [EXTRACTED 1.00]
- **Мёртвые ветки C1/C2 как единственный носитель проверки active** — shahmatka_architecture_drag_branch_c1, shahmatka_architecture_drag_branch_c2, docs_superpowers_2026_08_17_placement_v2_frontend_study_defect_drop_into_inactive_room, docs_superpowers_2026_08_17_placement_v2_frontend_study_inv_dead_branches_hold_active_check, docs_superpowers_2026_08_17_placement_v2_frontend_study_seam_use_placement_dnd [EXTRACTED 1.00]
- **Поток данных шахматки v2: запросы → трансформы → фильтры → виртуальный список** — shahmatka_architecture_useplacementdata, shahmatka_architecture_placementtransforms, shahmatka_architecture_placementfilters, shahmatka_architecture_virtualization, shahmatka_architecture_newplacementv2 [EXTRACTED 1.00]
- **Шесть веток handleDragEnd (A, B, C1-C4)** — shahmatka_architecture_drag_branch_a, shahmatka_architecture_drag_branch_b, shahmatka_architecture_drag_branch_c1, shahmatka_architecture_drag_branch_c2, shahmatka_architecture_drag_branch_c3, shahmatka_architecture_drag_branch_c4 [EXTRACTED 1.00]
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
- **Сохранение настроек отдела: панель → payload → мутация** — src_components_blocks_settingssidebar_readme_settings_sidebar_doc, src_components_blocks_settingssidebar_settingssidebar_settingssidebar, src_components_blocks_settingssidebar_accesspermissionspanel_accesspermissionspanel, src_utils_accesspayload_buildaccesspayload, graphql_requests_update_airline, graphql_requests_update_dispatcher_department [INFERRED 0.95]
- **Путь заявки: список → карточка → выбор гостиницы → размещение** — ekskurs_eskadrilya_i_zayavki_eskadrilya, src_components_blocks_infotabledata_infotabledata_infotabledata, src_components_blocks_existrequest_existrequest_existrequest, src_components_blocks_choosehotel_choosehotel_choosehotel, ekskurs_eskadrilya_i_zayavki_hotel_placement_flow [EXTRACTED 1.00]
- **Трёхпанельный модуль документации** — src_components_blocks_documentationlist_readme_three_zone_layout, src_components_blocks_documentationlist_documentationlistcomponents_documentationlist1_documentationlist1_documentationlist1, src_components_blocks_documentationlist_documentationlistcomponents_documentationlistleftpanel_documentationlistleftpanel_documentationlistleftpanel, src_components_blocks_documentationlist_documentationlistcomponents_documentationlistpanelcontent_documentlisttiptappanelcontent_documentlisttiptappanelcontent, src_components_blocks_documentationlist_documentationlistcomponents_documentationlistrightpanel_documentationlistrightpanel_documentationlistrightpanel [EXTRACTED 1.00]
- **Пайплайн загрузки медиа в статьи документации** — src_components_blocks_documentationlist_readme_media_blocks, src_components_blocks_documentationlist_readme_upload_context, src_components_blocks_documentationlist_documentationlistcomponents_documentationlistpanelcontent_src_documentationuploadcontext_documentationuploadprovider, src_components_blocks_documentationlist_documentationlistcomponents_documentationlistpanelcontent_src_documentationuploadstore, graphql_requests_upload_documentation_image, graphql_requests_upload_documentation_file [INFERRED 0.95]

## Communities (200 total, 44 thin omitted)

### Community 0 - "FAP Requests & Contract Deletion"
Cohesion: 0.05
Nodes (88): Фильтр по периоду в списке заявок ФАП (/far), ARCHIVE_AIRLINE_CONTRACT, ARCHIVE_HOTEL_CONTRACT, ARCHIVE_ORGANIZATION_CONTRACT, CANCEL_REQUEST, DELETE_AIRLINE_CONTRACT, DELETE_DISPATCHER_USER, DELETE_HOTEL_CONTRACT (+80 more)

### Community 1 - "Passenger Request Add Mutations"
Cohesion: 0.02
Nodes (133): Своя багажная мутация updatePassengerRequestBaggageDriver, ADD_PASSENGER_REQUEST_BAGGAGE_DRIVER, ADD_PASSENGER_REQUEST_DRIVER, ADD_PASSENGER_REQUEST_DRIVER_PEOPLE, ADD_PASSENGER_REQUEST_HOTEL, ADD_PASSENGER_REQUEST_PEOPLE, ADD_PASSENGER_REQUEST_PERSON, ADMIN_EXTEND_EXTERNAL_AUTH_SESSION (+125 more)

### Community 2 - "UI Primitives & Create Mutations"
Cohesion: 0.12
Nodes (42): ADD_HOTEL_TO_RESERVE, CREATE_AIRLINE, CREATE_AIRLINE_DEPARTMERT, CREATE_DISPATCHER_USER, CREATE_DRIVER_MUTATION, CREATE_HOTEL, CREATE_HOTEL_REPORT, CREATE_POSITION (+34 more)

### Community 3 - "Auth Helpers & Positions"
Cohesion: 0.06
Nodes (81): decodeJWT(), DELETE_AIRLINE_DEPARTMENT, DELETE_AIRLINE_MANAGER, GET_AIRLINE_COMPANY, GET_AIRLINE_POSITIONS, GET_AIRLINE_USERS_POSITIONS, GET_ALL_POSITIONS, GET_DISPATCHER_POSITIONS (+73 more)

### Community 4 - "Airline Contracts & Agreements"
Cohesion: 0.16
Nodes (27): Rationale: DeleteComponent in the list, useDialog confirm() in the forms, ДС end date + prolongation + archive/restore, «Архив ДС» tab (client-side active/archived split), ARCHIVE_ADDITIONAL_AGREEMENT, CREATE_AIRLINE_AA, CREATE_AIRLINE_CONTRACT, DELETE_AIRLINE_CONTRACT_AA, GET_AIRLINES_RELAY (+19 more)

### Community 5 - "Tiptap Audio & Font Blocks"
Cohesion: 0.09
Nodes (34): FONT_SIZE_MODAL_ESTIMATED_SIZE, fontSizeOptions, FontSizeSelect(), useDocumentationUpload(), notifyDocumentationUploadFailure(), AudioBlock, AUDIO_MODAL_ESTIMATED_SIZE, AudioBlockView() (+26 more)

### Community 6 - "Airline Analytics Charts"
Cohesion: 0.09
Nodes (49): Аддитивное расширение AnalyticsChart: case stackedBar + pieValueFormat, GET_AIRLINE_ANALYTICS, GET_AIRLINES, AnalyticsChart(), barDensityProps(), groupedSeriesDataIsEffectivelyEmpty(), simpleBarDataIsEffectivelyEmpty(), AirlineAnalytics() (+41 more)

### Community 7 - "Tiptap Editor Extensions"
Cohesion: 0.06
Nodes (25): BackgroundColor, editorExtensions, FontSize, NavigationAnchor, blockRegistry, ColumnsLayout, FileBlock, FrameBlock (+17 more)

### Community 8 - "Notification Permissions Panel"
Cohesion: 0.25
Nodes (12): Общий buildNotificationPayload на 30 ключей, capitalize(), emailKey(), NOTIFICATION_MASTER_KEYS, NOTIFICATION_SECTIONS, sitePushKey(), EMPTY_MENU, NotificationRow() (+4 more)

### Community 9 - "Address Field & Roster Import"
Cohesion: 0.07
Nodes (43): Verification without a test runner: lint delta + build + scripted browser run, Trap: report-cell room input must commit on blur/Enter, not per keystroke, Бэйзлайн линтера снимается запуском до правок; git stash запрещён, Bulk-мутация addPassengerRequestSavedPeople, Дедуп каталога при импорте: mergeManifestPeopleIntoRoster (жадный 1:1 по ФИО), Trap: anchor must be read via ref and kept out of the search effect deps, Geocoder contract change: {address, approximate} instead of '≈' baked into the string, Spec: AddressField / YandexMapModal address data integrity (2026-07-14) (+35 more)

### Community 10 - "Request Server Filtering"
Cohesion: 0.08
Nodes (32): Многоуровневая серверная фильтрация заявок, Серверный поиск с debounce 500 мс, Упрощённая обработка подписок через refetch(), CHANGE_TO_ARCHIVE, EXTEND_REQUEST_NOTIFICATION_SUBSCRIPTION, GET_BRONS_HOTEL, GET_HOTEL_MIN, GET_HOTEL_ROOMS (+24 more)

### Community 11 - "FAP List Infinite Scroll"
Cohesion: 0.06
Nodes (27): Спека: бесконечный скролл в списке заявок ФАП (/far), Бесконечный скролл списка заявок ФАП (страница 30), refreshWindow() — перезапрос всего загруженного окна одним запросом, Ловушка: сентинел внутри грида нужно обернуть в grid-column: 1 / -1, NOTIFICATIONS_SUBSCRIPTION, QUERY_NOTIFICATIONS, ExistRequestAdditionalMenu(), PassengerRequestLogs() (+19 more)

### Community 12 - "Bulk Person Mutations & Status"
Cohesion: 0.04
Nodes (59): Living и baggage добавлены в пересчёт статуса при правке плана (осознанная смена поведения), Update-мутации персон намеренно не трогаются, recomputeServiceStatus(prev, prevCount, nextCount) — единый пересчёт статуса услуги ФАП, Правила переоткрытия статуса услуги при изменении числа людей, Этап 1: personCategory в ростере и проброс из каталога, Отклонения при исполнении плана трансфера (одобрены ревью), normalizeBulkIndexes + spliceAtIndexes: валидация до изменений, пачка целиком или никак, Массовые мутации удаления: removePassengerRequestPeople и removePassengerRequestDriverPeople (+51 more)

### Community 13 - "Reserve Requests & Hotel Persons"
Cohesion: 0.10
Nodes (31): ADD_PASSENGER_TO_HOTEL, ADD_PERSON_TO_HOTEL, CANCEL_PASSENGER_REQUEST, COMPLETE_PASSENGER_REQUEST_EARLY, CREATE_RESERVE_REPORT, DELETE_PASSENGER_FROM_HOTEL, DELETE_PERSON_FROM_HOTEL, GET_AIRLINE_DEPARTMENT (+23 more)

### Community 14 - "Baggage Delivery Card"
Cohesion: 0.05
Nodes (34): BaggageTagsInput — ввод бирок чипами, Passenger rows in the baggage card + multi-select on create, Тип ТС редактируется и в карточке, и внутри поездки, Побочный эффект: метрика transferBaggage перестаёт быть нулевой, ФАП: карточка доставки багажа по составу реальных документов, Поле baggageTags (номера багажных бирок), Ловушка: скалярный список в composite-типе Prisma приходит null, Дата доставки как единственный признак завершённости (+26 more)

### Community 15 - "TravelLine Integration"
Cohesion: 0.06
Nodes (64): AMEND_TL_RESERVATION, CANCEL_TL_RESERVATION, CREATE_TL_RESERVATION, GET_TL_CONFIG, GET_TL_RATE_PLANS, GET_TL_RESERVATIONS, GET_TL_ROOM_TYPES, mediaSrc() (+56 more)

### Community 16 - "FAP Chat & Baggage Trip"
Cohesion: 0.09
Nodes (59): Страница поездки доставки багажа, fapReportAccess — единственное правило видимости отчёта, GET_HOTEL_TRANSFER_PRICE, GET_PASSENGER_REQUEST, GET_PASSENGER_REQUEST_CHATS, PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, react, react (+51 more)

### Community 17 - "Project Domain Concepts"
Cohesion: 0.05
Nodes (43): calculateEffectiveCostDays (squadron partial days), FAP module (FapV2) — CLAUDE.md summary, Kars Avia (crew accommodation system), PlacementDNDV2 (шахматка v2), Report drafts (create → edit rows → confirm), ReportPartialDaySetting (partial-day thresholds), Reports v2 (squadron reports section), buildReportSheets.js (XLSX report export) (+35 more)

### Community 18 - "App Bootstrap & Auth Errors"
Cohesion: 0.18
Nodes (15): Google Fonts: Montserrat, Inter, Nunito Sans, index.html — HTML-оболочка приложения, #root — точка монтирования React, App(), DialogProvider(), ToastProvider(), AUTH_CODES_NO_RETRY, AUTH_CODES_REFRESH (+7 more)

### Community 19 - "Hotel PMS Pages"
Cohesion: 0.09
Nodes (27): Bookings(), uid(), Dashboard(), HK_FLOW, Housekeeping(), Reports(), Rooms(), ICONS (+19 more)

### Community 20 - "Tiptap Toolbar Modals"
Cohesion: 0.09
Nodes (36): bgColors, ColorModal(), textColors, CustomStyleModal(), EXPORT_FORMATS, ExportModal(), ImportModal(), areStringArraysEqual() (+28 more)

### Community 21 - "Airline & Documentation Pages"
Cohesion: 0.13
Nodes (37): Персист состояния вкладок аналитики (обе смонтированы), AirlinePage(), AirlinesList(), Company(), DocumentationList(), Маршрут /documentation и точка входа «Помощь», Estafeta(), HotelsList() (+29 more)

### Community 22 - "FAP Service Early Complete"
Cohesion: 0.13
Nodes (17): COMPLETE_PASSENGER_REQUEST_LIVING_EARLY, COMPLETE_PASSENGER_REQUEST_MEAL_EARLY, COMPLETE_PASSENGER_REQUEST_TRANSFER_EARLY, COMPLETE_PASSENGER_REQUEST_WATER_EARLY, REMOVE_PASSENGER_REQUEST_DRIVER, REMOVE_PASSENGER_REQUEST_HOTEL, SET_PASSENGER_SERVICE_STATUS, HabitationTab() (+9 more)

### Community 23 - "Report Draft Mutations"
Cohesion: 0.14
Nodes (26): CONFIRM_REPORT_DRAFT, CREATE_AIRLINE_REPORT_DRAFT, CREATE_HOTEL_REPORT_DRAFT, DELETE_REPORT_DRAFT, GET_REPORT_DRAFT, GET_REPORT_DRAFT_PRESENTATION, UPDATE_REPORT_DRAFT, ReportDraftPreview() (+18 more)

### Community 24 - "FAP Service Action Header"
Cohesion: 0.06
Nodes (40): Правила видимости пунктов «Отчёт» и «История», Единая шапка действий услуг ФАП, Числовая правка вверх не реоткрывает COMPLETED-услугу, Дата рейса (flightDate) сквозняком: формы, деталка, карточка списка, шапка Excel, Отклонение от макета: у авиакомпании остаются «История» и chip «Реестр», Шапка Вариант B: одна primary-кнопка + overflow «⋯», Факт поездки = max(поимённый список, transportedCount), Третье зеркало факт-хелпера: src/utils/transferFact.js в PWA (+32 more)

### Community 25 - "Tiptap File Block View"
Cohesion: 0.13
Nodes (20): advanceMediaCandidate(), BLOCK_TARGET_OPTIONS, CODE_FILE_EXTENSIONS, FILE_MODAL_ESTIMATED_SIZE, FileBlockView(), FileTypeIcon(), formatFileSize(), getFileExtension() (+12 more)

### Community 26 - "Info Table Components"
Cohesion: 0.09
Nodes (22): convertToDate(), makeFormatter(), BaggageDeliveryTab(), DriverItem(), InfoTable(), InfoTableDataMyCompany(), InfoTableDataPatchNotes(), InfoTableDataReports() (+14 more)

### Community 27 - "FAP Passenger Roster & Manifest"
Cohesion: 0.06
Nodes (59): Пять SVG-иконок типов связи в shared/icons, План: проверка рейса манифеста (5 задач), Бэк-хелперы групп: upsertGroup / removeGroup / stripPersonFromGroups, Блок загрузки манифеста ManifestUploadField, savedPassengers как канонический ростер идентичности пассажира, Разделение полей: идентичность (ростер) vs placement (услуга), Общий пересчёт статуса услуги (добавление в COMPLETED → IN_PROGRESS), Спека: единый набор пассажиров ФАП + пересчёт статуса услуги (+51 more)

### Community 28 - "FAP Registry & Living Mismatch"
Cohesion: 0.14
Nodes (15): Спека: раздел «Реестр» на заявке ФАП + терминология «гости» → «пассажиры», Терминология ФАП: «гости» → «пассажиры / экипаж», Ворнинги групп W1/W2/W3 (computeFapGroupWarnings), roomKey — единый ключ номера для отчёта и ворнингов, UPDATE_PASSENGER_REQUEST_HOTEL, formatDate(), FapDestructiveModal(), hotelOverbookedBy() (+7 more)

### Community 29 - "Documentation Articles CRUD"
Cohesion: 0.10
Nodes (27): CREATE_ARTICLE, CREATE_SECTION, DELETE_ARTICLE, DELETE_SECTION, GET_ARTICLE, GET_SECTIONS_WITH_HIERARCHY, UPDATE_ARTICLE, UPDATE_SECTION (+19 more)

### Community 30 - "FAP Hotel Tariff Billing"
Cohesion: 0.04
Nodes (86): Спека: номер комнаты в отчёте из «Гости» + сетка «Гости» для просмотра (2026-07-08), Сетка «Гости» в режиме просмотра: 5 треков вместо 6 (ФИО перестаёт обрезаться), Мягкий fallback номера комнаты: пустой снимок отчёта дозаполняется из person.roomNumber, Проживание как производное: pricePerDay(вид) × daysCount, итог комнаты = сумма по гостям, Спека: отчёт ФАП — дата рейса, тариф с ценой за сутки, вид размещения (2026-07-20), Модель тарифа: placementPrices — цена койко-места за сутки по видам размещения, Tariff billingMode: PER_BED | PER_ROOM, Carrier guest — PER_ROOM accommodation charged once (+78 more)

### Community 32 - "FAP Passenger Analytics Filters"
Cohesion: 0.10
Nodes (37): Пресеты декад в фильтре периода аналитики ФАП, План: визуальный полиш аналитики по заявкам (5 задач), Период по flightDate и счётчик noFlightDateCount, Frontend: 2 new columns, accordion row detail, 2 KPI tiles, 2-sheet XLSX, Скоуп АК-ролей не ослабляется АК-пикером, Аналитика по пассажирам, этап C: фильтры (статусы, мульти-аэропорт, АК-пикер) и период-UX, Case-insensitive фильтр по № рейса — единственная бэк-правка этапа, Drill-down из аналитики в заявку по /far/:requestId (+29 more)

### Community 33 - "Menu Counts & Subscriptions"
Cohesion: 0.11
Nodes (20): GET_DISPATCHER, GET_PASSENGER_REQUESTS_COUNT, GET_REQUESTS_COUNT, GET_TRANSFERS_COUNT, GET_USER_SUPPORT_CHATS, PASSENGER_REQUEST_CREATED_SUBSCRIPTION, TRANSFER_CREATED_SUBSCRIPTION, DelayedText() (+12 more)

### Community 34 - "XLSX Report Sheet Builder"
Cohesion: 0.20
Nodes (29): Удаление легаси-контура отчёта: FapReport, маршрут report/:hotelIndex, SheetJS-экспорт, Excel-лист проживания: 22 колонки, дата рейса в шапке, единый экспортёр, Rationale: XLSX export needs no change under PER_ROOM, Excel-отчёт: колонка «Ланчбокс» (23 → 24) и SUMPRODUCT в итогах, Приоритет plannedFromAt над plannedAt в дате заезда Excel, Колонка «Перевезено» в Excel-листе трансфера (сдвиг «Суммы» I→J), Белый список hotelIndexes в пяти точках выгрузки XLSX, PERSON_CATEGORY_LABEL (+21 more)

### Community 35 - "Documentation Tree List"
Cohesion: 0.16
Nodes (27): findDocById(), applySectionOpenState(), clampLeftPanelWidth(), cn(), collectSectionOpenState(), detectServerNodeKind(), DocumentationList1(), getInitialLeftPanelWidth() (+19 more)

### Community 36 - "Hotel Status & Request Lists"
Cohesion: 0.12
Nodes (24): HotelStatusBadge — пилюля «Неактивна»/«Скрыта», Экскурс: Эскадрилья и система заявок в KARS-AVIA CRM, Права доступа к заявкам через accessMenu, AirlineRegisterOfContracts(), DriversCompanyList(), DriversList(), ExistRequest(), HotelPage() (+16 more)

### Community 37 - "README Changelog History"
Cohesion: 0.08
Nodes (31): README — история обновлений Kars Avia (v0.1 → v12.14), v11.11 — появление эффективных суток (effectiveCostDays.js), v12.14 — изоляция данных ФАП по гостинице, v12.3 — запуск ФАП v2, v12.8 — переименование маршрута /fapv2 → /far, v12.4 — прототип PMS для гостиниц (HotelPMS, mock-данные), v10.8 — появление шахматки V2 с модульной структурой, v12.10 — «Должности и доступ» + effectiveAccessMenu (+23 more)

### Community 38 - "Tiptap Doc Layout Panel"
Cohesion: 0.16
Nodes (28): saveDocLayout(), ARTICLE_WIDTH_PRESET_MAX, ArticlePaddingFrameOverlay(), ArticleWidthFrameOverlay(), clamp(), clampPaddingByRect(), clampPairToLimit(), DEFAULT_ARTICLE_PADDING (+20 more)

### Community 39 - "Chat Messages & Subscriptions"
Cohesion: 0.09
Nodes (29): CLAIM_SUPPORT_TICKET, convertToDateNew(), GET_MESSAGES_HOTEL, GET_TRANSFER_CHATS, GET_TRANSFER_MESSAGES, GET_USER_SUPPORT_CHAT, MARK_ALL_MESSAGES_AS_READ, MARK_ALL_TRANSFER_MESSAGES_AS_READ (+21 more)

### Community 40 - "Hotel Preview Link"
Cohesion: 0.07
Nodes (23): CREATE_HOTEL_PREVIEW_LINK, GET_HOTEL_NAME, GET_HOTEL_USERS, HotelPreviewShareButton(), PRESETS, AirlineAdminHotelContent(), HotelAboutTab, DisAdminHotelContent() (+15 more)

### Community 41 - "Documentation Tree Editing"
Cohesion: 0.38
Nodes (9): UPDATE_DOCUMENTATION, BlockItem(), collectImageGroups(), EditRequestDocumentation(), newId(), removeFromTreeById(), stripNode(), toLocalNode() (+1 more)

### Community 42 - "Tiptap Table Row Resizing"
Cohesion: 0.12
Nodes (24): buildDecorations(), currentColWidth(), currentRowHeight(), displayColumnWidth(), displayRowHeight(), domCellAround(), edgeCell(), edgeCellHorizontal() (+16 more)

### Community 43 - "FAP Group Surname Suggestions"
Cohesion: 0.12
Nodes (23): Тесты морфологии на встроенном node --test (TDD, без новых зависимостей), Теневые строки и восстановление тарифов по tariffName, Подсказки групп из манифеста (фронт-only, без персиста), canonicalSurname — общий бесполый корень фамилии (латиница и кириллица), Спека: распознавание женской формы фамилии в подсказках групп ФАП (2026-07-28), familyLabel — русский плюрал семьи с обратным транслитом (best-effort), sameStem и defaultGroupLabel переписаны через canonical (снят гейт CYRILLIC_RE), Гейтинг подсказок (соседние места / ребёнок) намеренно не меняется (+15 more)

### Community 44 - "Hotel Room Fund Categories"
Cohesion: 0.13
Nodes (14): DELETE_HOTEL_CATEGORY, GET_HOTELS_UPDATE_SUBSCRIPTION, UPDATE_HOTEL, CreateRequestCategoryNomer(), bedsCategories, CreateRoomModal(), EditRequestCategory(), requests (+6 more)

### Community 45 - "Report Draft Row Editor"
Cohesion: 0.39
Nodes (13): describeShareSegments(), editableValue(), getArrivalHighlight(), getDepartureHighlight(), listCohabitants(), livingCostTooltip(), splitDateTime(), segments (+5 more)

### Community 46 - "Call Backlog Review 03.08"
Cohesion: 0.12
Nodes (23): Разбор созвона 03.08 (24.08), Постановки YouGile по созвону 03.08, Созвон 03.08.2026: конструктор расчёта отчётов, АК видит реестр без цен, Автоприсвоение номеров комнат, Договор из списка при создании цен трансфера, Доступ к правке архивных заявок, Дубли пассажиров скан/манифест (+15 more)

### Community 47 - "Placement V2 Study Defects"
Cohesion: 0.13
Nodes (26): Оценка точности SHAHMATKA_ARCHITECTURE.md, Дефект: запросы AddPassengersModalV2 уходят без skip, Дефект: AddPassengersModalV2 недостижима, Дефект: getOverlappingRequests разыменовывает draggedRequest без защиты, Дефект: три документа пишут одно поле кэша hotel({id}), Дубликат: маппер пассажиров резерва — 2 копии по ~55 строк, ОПРОВЕРГНУТО: эффект usePlacementData:329 зацикливается, AddPassengersModalV2 — пассажир/сотрудник в резерв (284 строки) (+18 more)

### Community 48 - "Placement Resize Defects"
Cohesion: 0.13
Nodes (19): Дефект: заблокированный по isOverlap resize всё равно открывает модалку, Дефект: document-слушатели resize переживают unmount, Дефект: resize не валидирует порядок дат, Отклонение: MUI-иконки вместо src/shared/icons, Отклонение: нативный alert() вместо useDialog/MUIConfirm/MUIAlert, Отклонение: инлайн sx вместо CSS-модулей, Отклонение: собственная очередь тостов вместо useToast, Отклонение: сырой MUI Button вместо Standart/Button (+11 more)

### Community 49 - "Effective Access Menu Hook"
Cohesion: 0.09
Nodes (31): Спека: приоритет доступа должность>отдел везде — общий хук useEffectiveAccessMenu (2026-07-08), Баг: роут-компоненты считали доступ только из отдела, игнорируя должность, useEffectiveAccessMenu(user) — единый источник резолюции, мёрж { ...отдел, ...effective }, AUTHORIZE_EXTERNAL_AUTH, GET_USER_EFFECTIVE_ACCESS_MENU, REFRESH_TOKEN, TransferOrder, TravellinePage (+23 more)

### Community 50 - "DOCX Import Utility"
Cohesion: 0.19
Nodes (24): buildDocxImageMap(), bytesToDataUrl(), docxArrayBufferToHtml(), escapeHtml(), extractImageHtmlFromRunElement(), extractZipEntryBytes(), findAllByLocalName(), findFirstChild() (+16 more)

### Community 51 - "Placement Dead Code Defects"
Cohesion: 0.17
Nodes (24): Кластер мёртвого кода модуля, Дефект: сдвиг койки внутри номера жёстко пишет status done, Дефект: заявку можно бросить в отключённую комнату, Дефект: нет onDragCancel — доска залипает в перетаскивании, Дефект: молчаливые провалы мутаций, Дубликат: сборка hotelChesses — 3 разошедшиеся копии, Дубликат: блок оптимистичной вставки — 3 копии, Инвариант: мёртвые ветки C1/C2 держат единственную проверку targetRoom.active (+16 more)

### Community 52 - "Maintenance Banner & System Update"
Cohesion: 0.10
Nodes (34): generateTimestampId(), MAINTENANCE_BANNER, MAINTENANCE_BANNER_UPDATED, UPDATE_MAINTENANCE_BANNER, UPDATE_SYSTEM_UPDATE, audiences, MaintenanceBannerBar(), isoToLocalInput() (+26 more)

### Community 53 - "Script Runner"
Cohesion: 0.08
Nodes (3): ACTION_TYPES, KEY_OPTIONS, RESIZE_DIRS

### Community 54 - "Placement Access Gate Defects"
Cohesion: 0.12
Nodes (29): Цепочка accessMenu рвётся до таба шахматки, Дефект: отменённая бронь всегда возвращается в сайдбар эскадрильи, Дефект: пустое состояние сайдбаров проверяет нефильтрованный массив, Дубликат: «Заявок не найдено» — 3 копии, Голый маршрут /newPlacementV2/:idHotel — ни одного пропса, Вопрос: CurrentTimeIndicator из v1 выброшен намеренно?, Вопрос: можно ли удалять PlacementDND/?, roles в модуле используются только для пикселей (+21 more)

### Community 55 - "Role Access Control"
Cohesion: 0.33
Nodes (6): Role access matrix (src/utils/access.js), accessMenu feature flags, RoleContent (per-role content routing), SettingsSidebar (department access editor), fapEditAccess.js (client edit gates), fapServiceVisibility.js (per-role service visibility)

### Community 56 - "Transfer Order Sidebar"
Cohesion: 0.18
Nodes (11): buildScheduledISO(), GET_TRANSFER_REQUEST, TRANSFER_UPDATED_SUBSCRIPTION, UPDATE_TRANSFER_REQUEST_MUTATION, OrderInfoSidebar(), EDITABLE_STATUSES, isFinishedOrCanceled(), pad() (+3 more)

### Community 57 - "FAP Bulk Evict & Relocate"
Cohesion: 0.10
Nodes (24): Пакетные мутации заявки — строго последовательные await, Проверка вместимости на всю пачку при переселении, Массовые мутации выселения и переселения ФАП, ADD_PASSENGER_REQUEST_HOTEL_PERSON, COMPLETE_PASSENGER_REQUEST_BAGGAGE_EARLY, EVICT_PASSENGER_REQUEST_HOTEL_PEOPLE, RELOCATE_PASSENGER_REQUEST_HOTEL_PEOPLE, REMOVE_PASSENGER_REQUEST_BAGGAGE_DRIVER (+16 more)

### Community 58 - "Runtime Dependencies"
Cohesion: 0.08
Nodes (25): date-fns, dayjs, @fingerprintjs/fingerprintjs, html2canvas, jspdf, @mui/system, dependencies, date-fns (+17 more)

### Community 59 - "Contract Registry Frontend"
Cohesion: 0.19
Nodes (12): «ДС: N» badge + agreements popover in the registry list, Rationale: registry edits need zero backend change, Contract registry frontend edits (6 changes, front-only), Rename «Вид приложения» → «Предмет договора» (airline-only), Prolongation chip in the contract list row, Spec: Contract registry frontend edits (2026-07-07), Unified expiration badge helper (getExpirationBadge), Active filters badge on the «Фильтры» button (+4 more)

### Community 60 - "Avatar Upload & Org About"
Cohesion: 0.12
Nodes (21): getMediaUrl(), UPDATE_ORGANIZATION, AvatarUpload(), formatSize(), createImage(), getCroppedImg(), InfiniteScrollSentinel(), InfoTableDataAirlines() (+13 more)

### Community 61 - "Room Categories Dictionary"
Cohesion: 0.18
Nodes (15): AIRLINE_PRICE_ROWS, APARTMENT_CATEGORIES, byValue, CATEGORY_LABELS, CATEGORY_PLACES, CATEGORY_SHORT_LABELS, CATEGORY_STATED_PLACES, categoryLabel() (+7 more)

### Community 62 - "Report Partial-Day Rules"
Cohesion: 0.31
Nodes (11): parseHhMm(), PARTIAL_DAY_DEFAULTS, pickSetting(), RULE_DAY_FIELDS, RULE_TIME_FIELDS, rulesChanged(), LEVEL_SETTINGS, toRulesForm() (+3 more)

### Community 63 - "Documentation Upload Context"
Cohesion: 0.17
Nodes (16): UPLOAD_DOCUMENTATION_FILE, UPLOAD_DOCUMENTATION_IMAGE, appendToken(), DocumentationUploadContext, DocumentationUploadProvider(), ensureLeadingSlash(), ensureUploadedPath(), isSameOriginAsServer() (+8 more)

### Community 64 - "Airline Price As FAP Tariff"
Cohesion: 0.13
Nodes (20): Гейт готовности ценников АК до восстановления отчёта, costMissing / missingCostCount — заявки без посчитанной стоимости, Тонкий источник стоимости ФАП (агрегируем сохранённое), Ловушка: contractType обязателен в обеих живых подписках цен, Договорный тариф АК как источник цены проживания ФАП, Сопоставление 13 категорий номера с полями ценника АК, Спека: цены авиакомпании как источник тарифа в проживании ФАП, Географические («общие») ценники АК в ФАП не подбираются (+12 more)

### Community 65 - "Airline Tariff Geography"
Cohesion: 0.35
Nodes (16): Правила конфликтов локаций по типу заявки (conflictingContractTypes), Снятие конфликтующих выборов при смене типа (доработка по ревью), GET_ALL_TARIFFS, CreateRequestAirlineTarifCategory(), EditRequestAirlineTarifCategory(), findDuplicateGeoRow(), rowsToGeographyInput(), airlineTariffToInput() (+8 more)

### Community 66 - "Placement Status Color Map"
Cohesion: 0.18
Nodes (18): Дефект: handleSaveChanges отправляет status: "" для нераспознанного статуса, Дефект: оптимистичный дроп не удаляет карточку из newRequests, Дефект: статус резолвится по наличию chess.request, а не по значению, Дубликат: карта статус→цвет — 4 копии, Вопрос: удалять translateStatus в пользу roles.js?, Шов: единый словарь статусов на enum-ключах, Русская строка статуса используется как ключ карты цветов, 17 текстов уведомлений шахматки (+10 more)

### Community 67 - "Manifest Format Profiles"
Cohesion: 0.21
Nodes (15): Verification by Node scripts against real sample files (no frontend test runner), Spec: FAP multi-format manifest parsing via profiles (2026-07-07), Manifest format profiles (data-described formats + header auto-detection), manifestCore.js — shared engine (normHeader, detectProfile, extractPeople), Preserved parser contract: {people, flightNumber, error} + manifestNameKey re-export, isSameFlight/normalizeFlightNumber — нечёткое сравнение номеров рейсов, CYR_TO_LAT, detectProfile() (+7 more)

### Community 68 - "Placement Request Plaque Defects"
Cohesion: 0.21
Nodes (14): Дефект: нарушение правил хуков в RoomRowV2, Дефект: простое наведение перерисовывает всю доску, Дефект: по размещённой плашке нельзя открыть карточку заявки, Дефект: resize сдвигает дату на сутки, Дефект: resize срабатывает без движения мыши, Дубликат: сборка new Date(`${date}T${time}`) — 10 мест, ОПРОВЕРГНУТО: дубль useDraggable с тем же id в DragOverlay, ОПРОВЕРГНУТО: круг «UTC-цифр» внутри модуля рассогласован (+6 more)

### Community 69 - "Manifest PLI/PNL Profiles"
Cohesion: 0.14
Nodes (24): Зеркало бэкового normalizeFullNameKey на фронте (manifestNameKey), PM and PNL profiles (two opposite age-category mechanics), Decision: PNL row anchor is a valid category code, not the registration number, Trap: remark tokens lie — INFT sits on the accompanying adults, Захват номера рейса с пробелом в PNL-манифесте, Спека: третий формат манифеста ФАП — PLI (выгрузка DCS), Хуки профиля readName/readSeat + firstLine для многострочных ячеек, Профиль манифеста PLI (третий формат после ПМ и PNL) (+16 more)

### Community 70 - "Airline/Hotel Readiness Indicators"
Cohesion: 0.24
Nodes (7): AirlineReadinessIndicator(), HotelReadinessIndicator(), ReadinessIndicator(), computeAirlineReadiness(), READINESS_GROUPS, computeHotelReadiness(), HOTEL_READINESS_GROUPS

### Community 71 - "Hotel About Tab"
Cohesion: 0.10
Nodes (7): AUTHORIZE_HOTEL_PREVIEW, GET_HOTEL_MEAL_PRICE, GET_HOTEL_PREVIEW, HotelAbout_tabComponent(), TABS, HotelAboutGallery(), HotelPreview()

### Community 72 - "Create Documentation & Patch Notes"
Cohesion: 0.19
Nodes (18): CREATE_DOCUMENTATION, CREATE_PATCH_NOTE, BlockItem(), buildPayload(), CreateRequestDocumentation(), makeEmptyBlock(), newId(), removeFromTree() (+10 more)

### Community 73 - "Tiptap Table Wrapper"
Cohesion: 0.24
Nodes (18): ensureSelectionInThisTable(), findTable(), forceCursorBackIntoTable(), getCellPosInTable(), getTableInWrapper(), isSelectionInsideTable(), isSimpleGridTable(), isTableWrapperEmpty() (+10 more)

### Community 74 - "Access Permissions Panel"
Cohesion: 0.30
Nodes (11): Конфиг секций прав accessSections.js (секции как данные), Конфиг секций уведомлений и правило имён каналов, Пробел: секция «Брони» не показана ни одной панелью, AccessPermissionsPanel(), EMPTY_MENU, ACCESS_SECTIONS, AIRLINE_SECTION_KEYS, defaultSectionKeys() (+3 more)

### Community 75 - "Passenger Analytics Aggregation"
Cohesion: 0.21
Nodes (16): buildChartData: топ-8 + «Прочие», исключение бакета без даты, Программа доработки аналитики: этапы A→D, Инвариант: гибрид периода и Mongo-грабля не трогаются, МСК-границы периода аналитики (resolvePeriodBounds), buildSummary — движок агрегации сводок (passengerAnalyticsAggregations), Семантика counted/all в сводках = семантика KPI-тоталов, Месяц считается сдвигом +3ч (МСК), а не по локали браузера, buildChartData() (+8 more)

### Community 76 - "Hotel Account Call Fixes"
Cohesion: 0.11
Nodes (26): Транскрипт звонка 04.08.2026: правки по учётке гостиницы (00:00–15:08), Правка: во вкладке «Номера» показывать цены гостиницы, а не цены для авиакомпании, Правка: в проживании ФАП показывать гостинице тариф по договору Карс Авиа↔гостиница, Правка: список заявок ФАП в учётке гостиницы — только заявки, где выбрана эта гостиница, Правка: во вкладке «О гостинице» показывать контакты самой гостиницы, Правка: открепить квоту и резерв в шахматке, Заметка: отчёты по эскадрилье в учётке гостиницы не проверены, Правка: раздача ролей пользователям гостиницы (как у диспетчера и авиакомпании) (+18 more)

### Community 77 - "Script Runner Export Utils"
Cohesion: 0.12
Nodes (18): actionHasOutput(), buildFolderExportPayload(), buildLibraryExportPayload(), buildSingleScriptExportPayload(), collectAllScripts(), collectScripts(), countScripts(), createDefaultFields() (+10 more)

### Community 78 - "Squadron Request Placement"
Cohesion: 0.12
Nodes (22): Эскадрилья (модуль заявок на размещение экипажа), Размещение заявки в гостинице (выбор города и отеля, ветка access), Пагинация заявок с синхронизацией URL (take: 50), Маппинг статусов заявки (англ. код → русское название), Жизненный цикл заявки (created → opened → done → archived), GET_HOTEL, GET_REQUEST, UPDATE_REQUEST_RELAY (+14 more)

### Community 79 - "Dev Dependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, eslint-plugin-react, eslint-plugin-react-hooks (+9 more)

### Community 80 - "Doc Draft IndexedDB Store"
Cohesion: 0.28
Nodes (14): buildDocDraftId(), buildDocLayoutId(), loadDocContent(), loadDocDraft(), saveDocContent(), deleteFileRecord(), randomId(), saveBlobAsFile() (+6 more)

### Community 81 - "Tiptap Block Drag Overlay"
Cohesion: 0.24
Nodes (16): BlockDragOverlay(), clampNumber(), getAutoScrollDeltaY(), getClientPointFromEvent(), getColumnsSideDropHint(), getDropPositionByPoint(), getEditorDomSafe(), getEditorViewSafe() (+8 more)

### Community 82 - "Patch Notes Backfill Seed"
Cohesion: 0.20
Nodes (13): Спека: backfill патч-ноутов 3.2.0 → 4.3.0, Два идемпотентных способа заливки патч-ноутов, Backfill публичных патч-ноутов из README-чейнджлога, Переработка нумерации: patch-компонент вместо только minor, args, cmpVersion(), DRY_RUN, gql() (+5 more)

### Community 83 - "Hotel Booking Table"
Cohesion: 0.27
Nodes (10): Booking(), BronInfo(), checkBookingConflict(), HotelTable(), initialState(), reducer(), checkBookingConflict(), HotelTablePageComponent() (+2 more)

### Community 84 - "Documentation Filters"
Cohesion: 0.26
Nodes (13): DOCUMENTATION_FILTER_OPTIONS, FILTER_OPTION_MAP, getDocumentationFilterOption(), hasDocumentationFilterSwitcherAccess(), isDocumentationManageRole(), mapDocumentationFilterToApiType(), normalizeDocumentationFilter(), normalizeRoleValue() (+5 more)

### Community 85 - "Report Draft Editor UI"
Cohesion: 0.21
Nodes (10): getDraftAgeDays(), isDraftStale(), ReportDraftDialog(), ReportDraftEditor(), pluralizeDays(), rowMatchesSearch(), ReportDraftHeader(), useEditingPins() (+2 more)

### Community 86 - "Placement Overlap Logic"
Cohesion: 0.29
Nodes (15): Дефект: окно двойного бронирования после подтверждения, Отклонение: ноль тестов при чистой доменной логике, Дубликат: предикат пересечения — 4 копии, Инвариант: getAvailablePosition возвращает undefined, а 0 — валидный ответ, Инвариант: интервалы полуоткрытые [in, out) во всех четырёх копиях, Инвариант: hasOverlap и getOverlappingRequests не взаимозаменяемы, ConfirmBookingModalV2 — подтверждение брони (33 строки), Ветка A handleDragEnd — элемент из правой панели (!currentRoom) (+7 more)

### Community 87 - "Room Kind Seasons & Baggage Draft"
Cohesion: 0.22
Nodes (15): isPlainObject(), useBaggageTripDraft(), EMPTY_FORM, RoomKindSeasons(), useRoomKindSeasons(), apolloErrorText(), buildDateInputValue(), findOverlappingSeason() (+7 more)

### Community 88 - "Fixed-Width Manifest Parsing"
Cohesion: 0.17
Nodes (18): buildName(), cut(), FIELDS, findLayout(), FIXED_WIDTH_HEADER, ICAO_HEADER, isBrokenWord(), isReg() (+10 more)

### Community 89 - "Placement Grid Geometry"
Cohesion: 0.29
Nodes (14): DAY_WIDTH = 40 живёт двумя жизнями: стартовый стейт и масштаб сайдбара, Дефект: containerRef пишут строка и все ячейки дня, Дефект: ResizeObserver пересоздаётся на каждом рендере, Дубликат: 50 * room.type и голая 50, Расхождение 228 против 220 между шапкой и телом, Вопрос: DAY_WIDTH = 40 должен был остаться масштабом сайдбара?, Шов: хук usePlacementGeometry, DAY_WIDTH = 40 (+6 more)

### Community 90 - "Passenger Analytics Summary Charts"
Cohesion: 0.14
Nodes (14): План: сводки по измерениям (D1, 3 задачи), Спека: графики в аналитике по пассажирам (этап D2), Грабля H-скролла: min-width 0 и нейтрализация карточки чарта, Блок графиков сводки: стек-бары + донат расходов, Режим «Сводки» во вкладке «Пассажиры» (по аэропортам/АК/месяцам), Спека: сводки по измерениям в аналитике по пассажирам (этап D1, 2026-07-23), Агрегация на фронте — бэк не трогаем, Спека: единый поток аналитики «Пассажиры» (этап F) (+6 more)

### Community 91 - "Passenger Analytics XLSX Export"
Cohesion: 0.31
Nodes (12): Выгрузка текущей сводки одним листом XLSX, Экспорт полного отчёта одной книгой (5 листов), Номер заявки в таблице и в листах Excel (сдвиг колонок), REQUEST_STATUS_CONFIG, exportPassengerAnalyticsFullXlsx(), fillHotelsSheet(), fillRequestsSheet(), fillSummarySheet() (+4 more)

### Community 92 - "Report Draft Footer & Summary"
Cohesion: 0.24
Nodes (9): formatDays(), formatMoney(), pluralizeRows(), ReportDraftErrorBanner(), ReportDraftFooter(), ReportDraftGroupHeader(), hintTooltipSlotProps, ReportDraftSummary() (+1 more)

### Community 93 - "Department Settings Sidebar"
Cohesion: 0.24
Nodes (11): GET_DISPATCHER_DEPARTMENTS, UPDATE_DISPATCHER_DEPARTMENT, Состав папки SettingsSidebar, Двойной режим type="airline" / type="dispatcher", Обработка ошибок сохранения настроек, GraphQL-операции SettingsSidebar, Выбор должностей для авиакомпаний, Контракт пропсов SettingsSidebar (+3 more)

### Community 94 - "Access Permissions Panel"
Cohesion: 0.22
Nodes (8): В режиме detailed нет каскада «доступ гасит действия», Отложено: слияние панелей уведомлений и расхождение organization/contracts, Стили инъекцией пропом styles вместо общего CSS, Единая AccessPermissionsPanel с пропами granularity/styles/sections/showBulkToggle, RowSwitch(), SectionCard(), ALL_TRUE_ACCESS, buildAccessPayload()

### Community 95 - "Tiptap Link Modal & Icons"
Cohesion: 0.24
Nodes (11): AddIcon(), ButtonIcon(), ColoredIcon(), DashedIcon(), HighlightIcon(), LinkIcon(), NoUnderlineIcon(), getLinkStylePreviewStyle() (+3 more)

### Community 96 - "FAP Passenger Groups & Baggage"
Cohesion: 0.29
Nodes (7): Handoff prompt: FAP passenger groups (2026-07-22), Passenger groups execution invariants (hard constraints), Rationale: strict backend→frontend deploy window (baggage), Trip reportCost derived from the passengers' prices, Plan: FAP baggage delivery — many passengers per trip (2026-07-27), Trap: scalar list inside a composite type comes back null, Baggage delivery as a trip with a passenger list

### Community 97 - "Contract Type Toggle"
Cohesion: 0.25
Nodes (6): ContractTypeToggle с произвольным набором вариантов (проп options), Точное совпадение фильтра на бэке + fail-closed отправка полей, SegmentedToggle — generic переключатель взаимоисключающих значений, ContractTypeToggle(), DEFAULT_OPTIONS, SegmentedToggle()

### Community 98 - "Request Updates Editor"
Cohesion: 0.44
Nodes (8): BlockItem(), collectImageGroups(), EditRequestUpdates(), newId(), removeFromTreeById(), stripNode(), toLocalNode(), updateTreeById()

### Community 99 - "Placement Board Data Mapping"
Cohesion: 0.27
Nodes (12): Дефект: EditRequestNomerFond из шахматки получает урезанную комнату, Дефект: hotelChess с room: null исчезает бесследно, Отклонение: ~120 строк инлайн-JSX внутри колбэка VariableSizeList, Инвариант: сортировка mapRooms выживает только как tiebreak, Инвариант: инверсию room.id = имя / room.roomId = id нельзя потерять, Вопрос: hotelChess с room: null — реальное состояние бэка?, Шов: компонент RoomLabelCell, mapHotelChessToRequest — hotel.hotelChesses → карточка (+4 more)

### Community 100 - "Placement Filters & Virtualization"
Cohesion: 0.24
Nodes (13): Дефект: мемоизация обнулена свежими Date вне мемо, Дефект: поиск матчит requestID, а показывается requestNumber, Дефект: рендерный TypeError при активном поиске, Дубликат: eachDayOfInterval по месяцу — 4 раза за рендер, Вопрос: room.requests из buildFilteredRooms предполагался источником рендера?, ОПРОВЕРГНУТО: getRoomHeight/itemKey падают на сжимающемся списке, Известные особенности и потенциальные улучшения Estafeta, v6.0 — виртуальный рендеринг списка комнат в шахматке (+5 more)

### Community 101 - "Passenger Room Assignment & Notifications"
Cohesion: 0.22
Nodes (9): Узкая мутация assignPassengerRequestHotelRoom, Одиночное и пакетное присвоение номера через одну мутацию, Ловушка: updatePassengerRequestHotelPerson затирает поля гостя, Затирание канальных флагов в true при частичном payload, Мёртвые чекбоксы каналов на легаси-страницах, Объединение трёх панелей уведомлений отдела, Инъекция CSS-модуля пропом styles + showBulkToggle, Потеря полей гостя в updatePassengerRequestHotelPerson (+1 more)

### Community 102 - "Tariff Geography Selection"
Cohesion: 0.30
Nodes (10): Распознавание ошибок бэкенда про аэропорт (extractGeoConflictMessage), GET_REGIONS, TariffGeographyList(), computeDisabledRegionIds(), extractGeoConflictMessage(), geographyRowsToSelection(), geographyToRows(), geoNorm() (+2 more)

### Community 103 - "Block Lasso Selection"
Cohesion: 0.27
Nodes (9): BlockSelectionOverlay(), hasNativeTextSelectionInActiveField(), intersectRect(), isFormFieldTarget(), normalizeTargetToElement(), rectFromPoints(), BlockLassoSelectionKey, BlockLassoSelectionPlugin (+1 more)

### Community 104 - "Gallery Block Editor"
Cohesion: 0.23
Nodes (8): GALLERY_FITS, GALLERY_LAYOUTS, GalleryBlock, normalizeGalleryColumns(), normalizeGalleryFit(), normalizeGalleryGap(), normalizeGalleryLayout(), parseMaybeInt()

### Community 105 - "Script Runner Date Helpers"
Cohesion: 0.24
Nodes (12): formatIsoDate(), formatRuDate(), formatTimeFromMinutes(), generateRandomDateValue(), getPreviousActionValue(), getPreviousActionValueByIndex(), parseActionDate(), parseActionTime() (+4 more)

### Community 106 - "FAP Scope Authorization"
Cohesion: 0.18
Nodes (11): Constraint: role middleware ban in FAP, Decision: observation mode before hard enforcement, Passenger LK concept (target: October 2026), Decision: row-level authorization, not content filtering, FAP_SCOPE (cross-org request isolation), checkFapScopeReadiness.js (enforcement readiness probe), FAP_SCOPE_ENFORCE rollout (observation → hard mode), ExternalUser & magic links (+3 more)

### Community 107 - "Passenger Manifest Import"
Cohesion: 0.40
Nodes (5): Отклонение от спеки: автоподстановка № рейса только при создании, Спека: импорт пассажирского манифеста (ПМ) в каталог заявки ФАП, Импорт пассажирского манифеста (форма ПМ) в каталог savedPassengers, Вне скоупа импорта манифеста ПМ, Парсер формы ПМ на фронте (parseManifestXlsx)

### Community 108 - "Hotel Tariffs Display"
Cohesion: 0.25
Nodes (10): Правка: трансферные тарифы во вкладке «Тарифы» гостиницы — только если гостиница сама оказывает трансфер, Правка: услугу «трансфер» в заявке ФАП скрыть от гостиниц, не оказывающих трансфер, SERVICE_KEYS, declension(), fmt(), fmtWithVat(), HotelAboutTariffs(), mealLabels (+2 more)

### Community 109 - "Tiptap Navigation Anchors"
Cohesion: 0.24
Nodes (14): AnchorHashOverlay(), buildAnchorsSignature(), isInsideTableNode(), normalizeLabel(), TABLE_NODE_TYPES, TEXT_BLOCK_TAGS, TEXT_NODE_TYPES, buildAnchorDomId() (+6 more)

### Community 110 - "Quote Block Editor"
Cohesion: 0.35
Nodes (9): QuoteBlock, hexToRgb(), PRESET_COLORS, QUOTE_MODAL_ESTIMATED_SIZE, QuoteBlockView(), toQuoteAccentColor(), toQuoteBorderColor(), toQuoteButtonColor() (+1 more)

### Community 111 - "Bulk XLSX Import Parsing"
Cohesion: 0.33
Nodes (10): xlsx, excelSerialToParts(), fmtDate(), fmtTime(), pad(), s(), BULK_HEADERS, parseBulkXlsx() (+2 more)

### Community 112 - "Passenger Document Recognition"
Cohesion: 0.22
Nodes (10): Вынос streamToBuffer в общий хелпер бэкенда, Спека: распознавание документа с фото (RepresentativePWA), Контракт деградации: распознавание никогда не роняет поток, Нормализация полей и эвристика confidence, ПДн-режим: данные в РФ, ничего не сохраняем, Распознавание документа по фото (путь без штрихкода), Мутация recognizePassengerDocument + тип RecognizedPassengerDoc, ScanTabs + DocumentPhotoScanner и редактируемое ФИО (+2 more)

### Community 113 - "Hotel Active/Show Filter"
Cohesion: 0.40
Nodes (5): План: фильтр гостиниц active/show (6 задач), Спека: фильтр гостиниц по видимости (show) и активности (active) (2026-07-15), Фильтр списка гостиниц по show/active + бейджи состояния, Гейтинг по роли вместо User.dispatcher (вариант B), GET_HOTELS

### Community 114 - "Tariff Price Display"
Cohesion: 0.38
Nodes (5): fmtPrice(), fmtWithVat(), InfoTableDataTarifs(), PriceStack(), VAT_PERCENT

### Community 115 - "FAP Analytics Group Metrics"
Cohesion: 0.40
Nodes (5): Сдвиг firstMoneyCol при вставке не-денежной колонки (load-bearing), Столбец «Группы», KPI «Связано пассажиров» и колонка XLSX, Метрики связей в аналитике ФАП: groupsCount и linkedPeopleCount, Тотал linkedPeopleCount считается по ВСЕМ строкам, включая costMissing, COLUMN_TYPE

### Community 116 - "Package Manifest"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 117 - "FAP Service Visibility Tests"
Cohesion: 0.20
Nodes (9): AIRLINE, ALL, DISPATCHER, EXT_DRIVER, EXT_HOTEL, HOTEL, HOTEL_MODERATOR, SUPER (+1 more)

### Community 118 - "Action Tree Import/Migration"
Cohesion: 0.33
Nodes (10): assignIdsToTree(), flatObjectToTree(), generateId(), isPlainObject(), isValidActionItem(), isValidActionsArray(), isValidTree(), isValidTreeNode() (+2 more)

### Community 119 - "Placement Request Modals"
Cohesion: 0.13
Nodes (18): Маршруты заявок (/relay, /hotels/:hotelId/:requestId, /newPlacement/:hotelId), AddNewPassengerPlacement(), ExistReserveMess(), ConfirmBookingModalV2(), clamp(), DraggableRequestV2(), EditRequestModalV2(), RoomRowV2 (+10 more)

### Community 120 - "Manifest Profile Parsing"
Cohesion: 0.22
Nodes (7): detectNarrow(), ICAO_ROWS, NARROW_HEADER, narrowSheet(), VED_AT, VED_ROWS, WIDE_HEADER

### Community 121 - "Transfer Report Fields"
Cohesion: 0.40
Nodes (6): 7 аддитивных полей строки отчёта (counts, ЛБ-флаги, lunchboxPrice), Порядок выката: бэк → фронт (новые поля трансфера), Поле «перевезено N» на поездке (transportedCount), Ослабление guard патча водителя: COMPLETED разрешён, режется только CANCELLED, Риск last-writer-wins и порядок выката бэк → CRM → PWA, PWA: ввод «перевезено N» — диалог у водителя и поле у представителя

### Community 122 - "FAP Passenger Analytics Backend"
Cohesion: 0.18
Nodes (16): Строго аддитивное расширение бэка аналитики ФАП, HANDOFF: связи пассажиров в аналитике ФАП, groupsCount и linkedPeopleCount в аналитике по пассажирам, Порядок деплоя: бэк раньше фронта (passengerAnalytics), Спека: аналитика ФАП — сводная таблица по заявкам (v1), Исключение ghost/тарифных строк отчёта из сумм, GraphQL-запрос passengerAnalytics (read-only агрегатор ФАП), Вкладка «Пассажиры» в аналитике ФАП (+8 more)

### Community 123 - "Transfer Prices Form"
Cohesion: 0.47
Nodes (4): TransferPricesForm(), createEmptyTransferPriceInput(), DEFAULT_TRANSFER_PRICES, toRoutePricesInput()

### Community 124 - "Report Draft Table UI"
Cohesion: 0.16
Nodes (12): DRAFT_FILTERS, ReportDraftEmptyState(), ReportDraftFilters(), HOTEL_WIDTHS, NAME_WIDTHS, ReportDraftSkeleton(), ROOM_WIDTHS, ReportDraftTable() (+4 more)

### Community 125 - "Airline Admin Content Tabs"
Cohesion: 0.07
Nodes (28): DriversCompanyPage(), AirlineAboutTab, AirlineAdminAirlineContent(), AirlineCompanyTab, AirlineRegisterOfContracts, AirlineShahmatkaTabStaff, AirlineAboutTab, AirlineCompanyTab (+20 more)

### Community 126 - "Hotel & Transfer Admin Tabs"
Cohesion: 0.22
Nodes (7): HotelAboutTab, HotelCompanyTab, HotelNomerFondTab, HotelRegisterOfContracts, HotelSettingsTab, HotelShahmatkaTab, HotelTarifsTab

### Community 127 - "Airport Exclusion Selection"
Cohesion: 0.33
Nodes (6): Ловушка: Create-опции по id, Edit-опции по value, Исключение занятых аэропортов между договорами авиакомпании, Занятые аэропорты выводятся на клиенте из пропа addTarif, «Выбрать всё» уважает getOptionDisabled, Подсказка о пропущенных аэропортах, SELECT_ALL_OPTION

### Community 129 - "Passenger Identity & Roster"
Cohesion: 0.29
Nodes (7): Отклонение от спеки: propagation на бэке вместо маршрутизации на фронте, Граница: единство пассажира только через каталог, Гидрация заявки ФАП из ростера savedPassengers, Backend-propagation правки идентичности в ростер, Backfill personId и ростера для исторических заявок, Пакетное заселение из реестра в PWA (useCatalogAdd), Правило: пачка = один read-modify-write

### Community 130 - "Passenger Analytics Detail Pack"
Cohesion: 0.29
Nodes (7): Deploy gate: backend first, frontend second (widened selection breaks old backend), Analytics detail pack: 18 new per-request scalars + 8 new totals, Spec: passenger analytics money/people detail pack, stage B (2026-07-23), Invariant: ghost report rows excluded from every new reportRows sum, PassengerAnalyticsHotelBreakdown (live headcount vs report snapshot), Legacy fallbacks: personCategory null → ADULT, meal count ?? (price>0 ? 1 : 0), Transfer split invariant: round2(arrival+departure+baggage+intercity) == transfer

### Community 131 - "FAP Report Send-For-Review"
Cohesion: 0.11
Nodes (20): Порядок выката строго бэк → фронт (deploy coupling селекции), План реализации: «Отправить на проверку» (7 задач, бэк→фронт), Backfill-миграция personId и ростера (Этап 2), Гидрация заявки (read-overlay идентичности из ростера), Раскатка тремя изолированными этапами (0 статус / 1 категория / 2 гидрация), Ловушка деплоя: бэк раньше фронта (иначе сохранение отчёта падает на новых полях инпута), Три новых поля строки отчёта: tariffName, pricePerDay, placementKind, Предупреждение + подтверждение вместо жёсткого блока (+12 more)

### Community 133 - "Documentation & Rich-Text Blocks"
Cohesion: 0.19
Nodes (8): GET_DOCUMENTATION, GET_DOCUMENTATION_TREE, declension(), HotelAboutRoomBlock(), DocNode(), DocNode(), InfoTableDataUpdates(), TextEditorOutput()

### Community 134 - "Tiptap Block Registry"
Cohesion: 0.48
Nodes (5): clampDocPos(), getFirstTextCursorPosInNode(), getMatchingAncestorFromSelection(), placeCursorInsideNearestNode(), schedulePlaceCursorInsideNearestNode()

### Community 135 - "Passenger Request Creation"
Cohesion: 0.18
Nodes (14): TZ off-by-one: рейс 1-го числа выпадал из обоих месяцев, Поток создания заявки (sidebar → мутация → подписка → refetch), Проверка на дубликаты заявок при создании, CREATE_PASSENGER_REQUEST, CREATE_REQUEST_MUTATION, GET_AIRLINES_SUBSCRIPTION, GET_PASSENGER_REQUESTS, defaultFilter (+6 more)

### Community 136 - "Script Runner Element Actions"
Cohesion: 0.29
Nodes (7): executeAction(), getUnderlyingElement(), isScriptRunnerControl(), normalizeDateLikeValue(), resolveEditableElement(), setElementValue(), sleep()

### Community 137 - "Tree Node Manipulation"
Cohesion: 0.38
Nodes (7): findNodeById(), insertNode(), insertRelativeToNode(), isDescendantOf(), moveNode(), removeNodeById(), reorderNode()

### Community 143 - "Draggable Window Overlay"
Cohesion: 0.33
Nodes (6): react-dom, react-dom, DraggableWindow(), PickHighlight(), TargetMarkers(), useDragResize()

### Community 144 - "Plus Button Overlay"
Cohesion: 0.60
Nodes (5): clampNumber(), getInsertTargetPosForBlock(), getTopLevelBlockPos(), getTopLevelStartPositions(), PlusButtonOverlay()

### Community 147 - "Backend Test Harness & Resolvers"
Cohesion: 0.40
Nodes (5): Characterization test net (300+ tests), Method: finder → adversarial verifier → stand measurement, Two-tier mutation envelope (withPassengerRequest), prismaDouble (test harness), Resolver split — stages 0–3 (12 resolver files + 23 services)

### Community 148 - "Airline Table Page"
Cohesion: 0.70
Nodes (4): AirlineTablePageComponent(), initialState(), packIntoLanes(), reducer()

### Community 149 - "Airline Price Contract Type"
Cohesion: 0.30
Nodes (9): Спека: тип заявки на ценниках АК + адрес аэропорта, Фильтр contractType при подборе цены в карточке заявки экипажа, «Применяется к» — AirlinePrice.contractType (request / fap / all), InfoTableAirlineDataTarifs(), getContractType(), appliesToLabel(), conflictingContractTypes(), normalizeAppliesTo() (+1 more)

### Community 152 - "Script Runner Context"
Cohesion: 0.50
Nodes (3): Empty(), ScriptRunnerContext, ScriptRunnerProvider()

## Ambiguous Edges - Review These
- `FapLivingPage.jsx` → `Ворнинги групп W1/W2/W3 (computeFapGroupWarnings)`  [AMBIGUOUS]
  docs/superpowers/specs/2026-07-22-fap-passenger-groups-design.md · relation: conceptually_related_to
- `TransferAdminContent.jsx` → `Маршрут /documentation и точка входа «Помощь»`  [AMBIGUOUS]
  src/Components/Blocks/DocumentationList/README.md · relation: references
- `useToast()` → `Обработка ошибок сохранения настроек`  [AMBIGUOUS]
  src/Components/Blocks/SettingsSidebar/README.md · relation: references

## Knowledge Gaps
- **450 isolated node(s):** `GET_MESSAGES_TRANSFER`, `UPDATE_DRIVER_WITH_PHOTO_MUTATION`, `UPDATE_PASSENGER_REQUEST_CREW`, `RELOCATE_PASSENGER_REQUEST_HOTEL_PERSON`, `EVICT_PASSENGER_REQUEST_HOTEL_PERSON` (+445 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `FapLivingPage.jsx` and `Ворнинги групп W1/W2/W3 (computeFapGroupWarnings)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `TransferAdminContent.jsx` and `Маршрут /documentation и точка входа «Помощь»`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `useToast()` and `Обработка ошибок сохранения настроек`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `getCookie()` connect `Auth Helpers & Positions` to `FAP Requests & Contract Deletion`, `Passenger Request Add Mutations`, `UI Primitives & Create Mutations`, `Airline Contracts & Agreements`, `Tiptap Audio & Font Blocks`, `Airline Analytics Charts`, `Passenger Request Creation`, `Request Server Filtering`, `FAP List Infinite Scroll`, `Bulk Person Mutations & Status`, `Reserve Requests & Hotel Persons`, `Baggage Delivery Card`, `TravelLine Integration`, `FAP Chat & Baggage Trip`, `Airline Table Page`, `Airline & Documentation Pages`, `FAP Service Early Complete`, `Report Draft Mutations`, `FAP Service Action Header`, `Info Table Components`, `FAP Passenger Roster & Manifest`, `FAP Registry & Living Mismatch`, `Documentation Articles CRUD`, `FAP Hotel Tariff Billing`, `File Upload`, `FAP Passenger Analytics Filters`, `Menu Counts & Subscriptions`, `Documentation Tree List`, `Hotel Status & Request Lists`, `Tiptap Doc Layout Panel`, `Chat Messages & Subscriptions`, `Hotel Preview Link`, `Documentation Tree Editing`, `Hotel Room Fund Categories`, `Effective Access Menu Hook`, `Maintenance Banner & System Update`, `Transfer Order Sidebar`, `FAP Bulk Evict & Relocate`, `Avatar Upload & Org About`, `Report Partial-Day Rules`, `Documentation Upload Context`, `Airline Tariff Geography`, `Hotel About Tab`, `Create Documentation & Patch Notes`, `Hotel Booking Table`, `Documentation Filters`, `Room Kind Seasons & Baggage Draft`, `Department Settings Sidebar`, `Request Updates Editor`, `Tariff Geography Selection`, `Quote Block Editor`, `Placement Request Modals`, `Airline Admin Content Tabs`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `dnd-kit Library`, `Lodash Library`, `Yandex Maps Library`, `React Grid Layout`, `React Resizable`, `Tiptap Table Extension`, `Tiptap Table Header`, `Draggable Window Overlay`, `FAP Chat & Baggage Trip`, `Tiptap Table Row`, `Tiptap Text Align`, `Tiptap Table Cell`, `Apollo Client`, `Apollo Upload Client`, `Emoji Picker`, `Emotion React`, `Emotion Styled`, `ExcelJS`, `GraphQL`, `GraphQL WS`, `html2pdf`, `MUI Icons`, `MUI Material`, `Mutation Events`, `React Draggable`, `React Easy Crop`, `React Input Mask`, `React Paginate`, `React Quill`, `React Tabs`, `Recharts`, `Tiptap Core`, `Tiptap Highlight`, `Tiptap Placeholder`, `Tiptap Text Style`, `Tiptap Underline`, `Tiptap ProseMirror`, `Tiptap React`, `Tiptap Starter Kit`, `Bulk XLSX Import Parsing`, `Package Manifest`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `Правка: открепить квоту и резерв в шахматке` connect `Hotel Account Call Fixes` to `Placement Request Modals`, `Placement V2 Study Defects`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `GET_MESSAGES_TRANSFER`, `UPDATE_DRIVER_WITH_PHOTO_MUTATION`, `UPDATE_PASSENGER_REQUEST_CREW` to the rest of the system?**
  _450 weakly-connected nodes found - possible documentation gaps or missing edges._