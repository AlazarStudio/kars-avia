import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useQuery } from "@apollo/client";
import classes from "./ReportDraftEditor.module.css";
import useReportDraft from "./useReportDraft";
import useEditingPins from "./useEditingPins";
import Header from "../../Header/Header";
import ReportDraftHeader from "./ReportDraftHeader";
import ReportDraftErrorBanner from "./ReportDraftErrorBanner";
import ReportDraftFilters from "./ReportDraftFilters";
import ReportDraftTable from "./ReportDraftTable";
import ReportDraftFooter from "./ReportDraftFooter";
import ReportDraftDialog from "./ReportDraftDialog";
import ReportDraftPreview from "./ReportDraftPreview";
import ReportDraftSummary from "./ReportDraftSummary";
import { DRAFT_FILTERS, pluralizeDays, pluralizeRows, rowMatchesSearch } from "./reportDraftEditorUtils";
import { useToast } from "../../../../contexts/ToastContext";
import { convertToDateNew, GET_REPORT_PARTIAL_DAY_SETTINGS, getCookie } from "../../../../../graphQL_requests";
import { measureSavePayload, rowHasWarning } from "../reportDraftRows";
import { isDraftStale, getDraftAgeDays } from "../reportDraftAge";
import { resolveDraftPartialDayRules } from "../reportRules";

// Редактор строк черновика отчёта: таблица правки перед подтверждением.
// confirmReportDraft печатает строки ровно такими, как они лежат в базе —
// поэтому "Подтвердить" сначала сохраняет несохранённые правки (см.
// confirmAndExport в useReportDraft), а не полагается на то, что их кто-то
// заметит.
export default function ReportDraftEditor({
  draftId,
  onBack,
  onDraftReplaced,
  onConfirmed,
  airports,
  mode = "edit",
}) {
  // Выпущенный отчёт открывается тем же экраном, но править его нельзя —
  // на бэке подтверждение необратимо (Only DRAFT reports can be confirmed).
  const canEdit = mode === "edit";

  const {
    draft,
    rows,
    loading,
    saving,
    confirming,
    deleting,
    recreating,
    dirty,
    editedUids,
    total,
    serverTotal,
    deletedCount,
    setCell,
    removeRow,
    resetRow,
    resetAll,
    fieldEdited,
    save,
    confirmAndExport,
    recreate,
    removeDraft,
  } = useReportDraft(draftId);

  const { success, error: notifyError } = useToast();

  // Действующие пороги частичных суток — для подсветки заезда/выезда в
  // таблице. Отдельный запрос (не поднят в ReportsV2.jsx): список нужен только
  // здесь и в ReportRulesSidebar, а редактор рендерится ВМЕСТО списка, так что
  // одновременно они не смонтированы — общая у них только запись в кэше
  // Apollo, in-flight дедупликации тут не бывает.
  //
  // cache-and-network, как в ReportRulesSidebar: запись в кэше общая, и на
  // cache-first редактор весь сеанс SPA рисовал бы по порогам, которые кто-то
  // уже поменял в другой вкладке, ни разу не сходив в сеть.
  const token = getCookie("token");
  const { data: rulesData, loading: rulesLoading } = useQuery(GET_REPORT_PARTIAL_DAY_SETTINGS, {
    fetchPolicy: "cache-and-network",
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const rules = useMemo(
    () => resolveDraftPartialDayRules(rulesData?.reportPartialDaySettings, draft),
    [rulesData, draft]
  );
  // Пока действующий порог неизвестен, вниз уходит null — «ещё не знаем», а не
  // «считай по дефолтам»: иначе строки сначала красятся по 06:00/12:00 и
  // перекрашиваются после ответа, то есть вспышка случается ровно там, где
  // порог переопределён и подсветка нужнее всего.
  // Одного `loading` мало: cache-and-network держит его true и во время
  // фоновой проверки поверх уже показанных данных — подсветка гасла бы на
  // каждом обновлении. Ошибка запроса тоже считается ответом: правил нет,
  // работаем по дефолтам.
  const rulesKnown = Boolean(rulesData) || !rulesLoading;

  const [filter, setFilter] = useState(DRAFT_FILTERS.ALL);
  const [search, setSearch] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  // Замер строк на момент неудачного сохранения: {bytes, limit} — если строки
  // не влезли в лимит тела запроса, и null во всех остальных случаях.
  const [oversize, setOversize] = useState(null);
  // dialog: null | { type: "leave" | "delete" | "recreate" | "stale" } | { type: "deleteRow", row }
  const [dialog, setDialog] = useState(null);
  const closeDialog = () => setDialog(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Наведённая группа соседей по номеру — подсвечивает все её строки разом.
  const [hoveredCluster, setHoveredCluster] = useState(null);

  // Режим и свёрнутость сознательно не сохраняются между открытиями: черновик
  // всегда открывается как печатная форма, чтобы первое, что видит диспетчер,
  // совпадало с файлом, который он сверяет.
  const [groupBy, setGroupBy] = useState("file");
  const [collapsedHotels, setCollapsedHotels] = useState(() => new Set());

  const toggleHotel = (hotel) => {
    setCollapsedHotels((prev) => {
      const next = new Set(prev);
      if (next.has(hotel)) next.delete(hotel);
      else next.add(hotel);
      return next;
    });
  };

  // Строки, которые правят прямо сейчас, держим в выборке даже когда они
  // перестали подходить под фильтр — иначе строка исчезает из-под курсора на
  // первой же введённой цифре (см. useEditingPins).
  const { pinned, pin, hold, release, clear: clearPins } = useEditingPins();

  const handleCellChange = (uid, field, value) => {
    pin(uid);
    setCell(uid, field, value);
  };

  // Смена фильтра или поиска — пользователь сам пересобрал выборку, прошлые
  // закрепления в ней только мешали бы.
  const handleFilterChange = (next) => {
    clearPins();
    setFilter(next);
  };

  const handleSearchChange = (next) => {
    clearPins();
    setSearch(next);
  };

  // Бэк вернул reportDraft: null (черновик удалён/не существует) — сообщаем
  // и уходим назад к списку, показывать тут больше нечего.
  useEffect(() => {
    if (!loading && draftId && draft === null) {
      notifyError("Черновик не найден");
      onBack();
    }
  }, [loading, draftId, draft, notifyError, onBack]);

  const handleResetFilters = () => {
    clearPins();
    setFilter(DRAFT_FILTERS.ALL);
    setSearch("");
  };

  // Число строк изменилось (удалили лишние) — прошлый вердикт о размере
  // устарел, баннер прячем: следующая попытка посчитает заново.
  useEffect(() => {
    setSaveFailed(false);
    setOversize(null);
  }, [rows.length]);

  const runSave = async () => {
    try {
      await save();
      setSaveFailed(false);
      setOversize(null);
      success("Черновик сохранён");
      return true;
    } catch (e) {
      // Размер меряем только на неудаче: JSON по всем строкам стоит заметно
      // дороже показа баннера, и на успешном пути он не нужен.
      //
      // Когда строки не влезают в лимит, бэк рвёт соединение без CORS-ответа,
      // браузер отдаёт «Failed to fetch», и у Apollo не остаётся ни
      // graphQLErrors, ни статуса — отличить это от настоящего отказа сети
      // по самой ошибке нельзя. Отсюда замер: он даёт причину, которой в
      // ошибке нет.
      const payload = measureSavePayload(rows);
      // Байты и лимит — для того, кто будет разбираться, а не для диспетчера:
      // в интерфейсе он видит только строки и совет сузить период.
      console.error(
        `[reportDraft] сохранение не прошло: ${payload.rowCount} строк, ` +
          `${payload.bytes} Б при лимите тела запроса ${payload.limit} Б`,
        e
      );
      setOversize(payload.exceeds ? payload : null);
      setSaveFailed(true);
      notifyError(
        e?.graphQLErrors?.[0]?.message ||
          (payload.exceeds
            ? "Черновик не сохранён: слишком много строк"
            : "Не удалось сохранить черновик")
      );
      return false;
    }
  };

  const handleBackClick = () => {
    // В режиме просмотра правок не бывает — выходим сразу, без диалога.
    if (!canEdit) {
      onBack();
      return;
    }
    if (dirty) {
      setDialog({ type: "leave" });
      return;
    }
    onBack();
  };

  const handleLeaveWithoutSaving = () => {
    closeDialog();
    onBack();
  };

  const handleSaveAndLeave = async () => {
    const ok = await runSave();
    closeDialog();
    // Если сохранение упало — остаёмся на странице: баннер и тост уже
    // показали ошибку, а правки остались в браузере, их не теряем.
    if (ok) onBack();
  };

  const handleDeleteDraftClick = () => setDialog({ type: "delete" });
  const handleConfirmDeleteDraft = async () => {
    closeDialog();
    try {
      await removeDraft();
      success("Черновик удалён");
      onBack();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Не удалось удалить черновик");
    }
  };

  const handleRecreateClick = () => setDialog({ type: "recreate" });
  const runRecreate = async () => {
    closeDialog();
    try {
      const newId = await recreate();
      success("Черновик пересоздан");
      onDraftReplaced(newId);
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Не удалось пересоздать черновик");
    }
  };

  const runConfirmExport = async () => {
    closeDialog();
    try {
      await confirmAndExport();
      success("Отчёт выгружен");
      onConfirmed();
    } catch (e) {
      notifyError(e?.graphQLErrors?.[0]?.message || "Не удалось подтвердить черновик");
    }
  };

  const handleConfirmClick = () => {
    if (isDraftStale(draft?.createdAt)) {
      setDialog({ type: "stale" });
      return;
    }
    runConfirmExport();
  };

  const handleRequestDeleteRow = (row) => setDialog({ type: "deleteRow", row });
  const handleConfirmDeleteRow = () => {
    if (dialog?.type === "deleteRow") removeRow(dialog.row._uid);
    closeDialog();
  };

  // Поиск сужает базовый набор, счётчики чипов и отображаемые строки — уже
  // результат поиска. Переключение вкладки фильтра само по себе числа на
  // других вкладках не двигает (см. ReportDraftFilters).
  const searchedRows = rows.filter((row) => rowMatchesSearch(row, search));
  const warningRows = searchedRows.filter((row) => rowHasWarning(row));
  const editedRows = searchedRows.filter((row) => editedUids.has(row._uid));

  // Счётчики чипов считаются по warningRows/editedRows — то есть честно, без
  // закреплений. А вот показываем строку, если она либо подходит под фильтр,
  // либо закреплена как правящаяся: порядок при этом сохраняется сам, потому
  // что фильтруется исходный searchedRows, а не склеиваются два списка.
  const matchesFilter = (row) =>
    filter === DRAFT_FILTERS.WARNINGS
      ? rowHasWarning(row)
      : filter === DRAFT_FILTERS.EDITED
      ? editedUids.has(row._uid)
      : true;

  const displayedRows = searchedRows.filter(
    (row) => matchesFilter(row) || pinned.has(row._uid)
  );

  // Подвал, в отличие от чипов, — сводка по ВСЕМУ черновику, а не по
  // текущему поиску: иначе "показано 3 из 12 · изменено 5" читалось бы как
  // противоречие (изменённых больше, чем показано).
  const totalWarningsCount = rows.filter((row) => rowHasWarning(row)).length;

  if (!draft) {
    return (
      <>
      <Header>
        <div className={classes.titleHeader}>
          <button type="button" className={classes.backButton} onClick={onBack} aria-label="Назад">
            <img src="/arrow.png" alt="" />
          </button>
          Отчеты v2
        </div>
      </Header>

      <div className={classes.wrap}>
        <ReportDraftHeader title="Черновик" loading />
        <div className={classes.card}>
          <div className={classes.scroll}>
            <ReportDraftTable
              loading
              rows={[]}
              displayedRows={[]}
              editedUids={editedUids}
              fieldEdited={fieldEdited}
              onCellChange={setCell}
              onResetRow={resetRow}
              onRequestDeleteRow={handleRequestDeleteRow}
              onResetFilters={handleResetFilters}
            />
          </div>
        </div>
      </div>
      </>
    );
  }

  // Сентинелы периода в UTC — рендер по UTC, иначе конец периода +1 день
  const period = `${convertToDateNew(draft.startDate)} – ${convertToDateNew(draft.endDate)}`;
  const companyName = draft.filterJson?.companyName || "—";
  // Экран один на две роли, поэтому и подпись разная: черновик правят, а
  // выпущенный отчёт только смотрят — называть его черновиком нельзя, он уже
  // напечатан и в базе лежит со статусом CONFIRMED.
  const title = `${canEdit ? "Черновик" : "Отчёт"} · ${companyName} · ${period}`;
  const stale = isDraftStale(draft.createdAt);
  const staleDays = Math.floor(getDraftAgeDays(draft.createdAt) ?? 0);
  const unsavedRowsCount = editedUids.size + deletedCount;

  return (
    <>
    <Header>
      <div className={classes.titleHeader}>
        <button
          type="button"
          className={classes.backButton}
          onClick={handleBackClick}
          aria-label="Назад"
        >
          <img src="/arrow.png" alt="" />
        </button>
        Отчеты v2
      </div>
    </Header>

    <div className={classes.wrap}>
      {/* Логотип показываем только у отчёта по авиакомпании: у неё он есть
          в справочнике. В отчёте по гостинице показывать нечего — гостиница
          в строках лежит только именем, без ссылки на карточку. */}
      <ReportDraftHeader
        title={title}
        logo={draft.airline ? draft.airline.images?.[0] ?? null : undefined}
        isStale={stale}
        dirty={dirty}
        hasRows={rows.length > 0}
        recreating={recreating}
        deleting={deleting}
        saving={saving}
        confirming={confirming}
        canEdit={canEdit}
        downloadUrl={draft.savedReport?.url}
        onPreview={() => setPreviewOpen(true)}
        onRecreate={handleRecreateClick}
        onDelete={handleDeleteDraftClick}
        onSave={runSave}
        onConfirm={handleConfirmClick}
      />

      {saveFailed && (
        <ReportDraftErrorBanner
          onRetry={runSave}
          retrying={saving}
          oversize={oversize}
        />
      )}

      <ReportDraftSummary filterJson={draft.filterJson} rows={rows} airports={airports} />

      <div className={classes.card}>
        <ReportDraftFilters
          filter={filter}
          onFilterChange={handleFilterChange}
          counts={{
            all: searchedRows.length,
            warnings: warningRows.length,
            edited: editedRows.length,
            deleted: deletedCount,
          }}
          dirty={dirty}
          onResetAll={resetAll}
          search={search}
          onSearchChange={handleSearchChange}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          canEdit={canEdit}
        />

        <div className={classes.scroll}>
          <ReportDraftTable
            loading={loading}
            rows={rows}
            displayedRows={displayedRows}
            editedUids={editedUids}
            fieldEdited={fieldEdited}
            onCellChange={handleCellChange}
            onCellFocus={hold}
            onCellBlur={release}
            onResetRow={resetRow}
            onRequestDeleteRow={handleRequestDeleteRow}
            onResetFilters={handleResetFilters}
            hoveredCluster={hoveredCluster}
            onHoverCluster={setHoveredCluster}
            rules={rulesKnown ? rules : null}
            groupBy={groupBy}
            collapsedHotels={collapsedHotels}
            onToggleHotel={toggleHotel}
            narrowed={filter !== DRAFT_FILTERS.ALL || search.trim() !== ""}
            canEdit={canEdit}
          />
        </div>

        <ReportDraftFooter
          shownCount={displayedRows.length}
          totalCount={rows.length}
          editedCount={editedUids.size}
          warningsCount={totalWarningsCount}
          deletedCount={deletedCount}
          total={total}
          serverTotal={serverTotal}
          canEdit={canEdit}
        />
      </div>

      <ReportDraftDialog
        open={dialog?.type === "leave"}
        onClose={closeDialog}
        symbol="!"
        symbolBg="#FFF6E8"
        symbolColor="#D9891F"
        title="Выйти без сохранения?"
        message={`В черновике есть несохранённые правки — ${unsavedRowsCount} ${pluralizeRows(
          unsavedRowsCount
        )}. Если выйти сейчас, они пропадут.`}
        cancelLabel="Остаться"
        onCancel={closeDialog}
        primaryLabel="Выйти без сохранения"
        primaryColor="#D97A22"
        onPrimary={handleLeaveWithoutSaving}
        tertiaryLabel="Сохранить и выйти"
        onTertiary={handleSaveAndLeave}
      />

      <ReportDraftDialog
        open={dialog?.type === "delete"}
        onClose={closeDialog}
        symbol="✕"
        symbolBg="#FDEDE6"
        symbolColor="#D2482C"
        title="Удалить черновик?"
        message={`Черновик «${companyName}» и все внесённые правки будут удалены. Отчёт придётся собирать заново.`}
        cancelLabel="Отмена"
        onCancel={closeDialog}
        primaryLabel="Удалить черновик"
        primaryColor="#D2482C"
        onPrimary={handleConfirmDeleteDraft}
      />

      <ReportDraftDialog
        open={dialog?.type === "recreate"}
        onClose={closeDialog}
        symbol="↻"
        symbolBg="#EFF4FE"
        symbolColor="#0057C3"
        title="Пересоздать черновик?"
        message={`Черновик соберётся заново из свежих данных заявок. Все ручные правки — ${unsavedRowsCount} ${pluralizeRows(
          unsavedRowsCount
        )} — будут потеряны.`}
        cancelLabel="Отмена"
        onCancel={closeDialog}
        primaryLabel="Пересоздать"
        primaryColor="#0057C3"
        onPrimary={runRecreate}
      />

      <ReportDraftDialog
        open={dialog?.type === "stale"}
        onClose={closeDialog}
        symbol="!"
        symbolBg="#FFF6E8"
        symbolColor="#D9891F"
        title={`Черновику ${staleDays} ${pluralizeDays(staleDays)}`}
        message="Данные заявок за это время могли измениться, а черновик их не увидит. Выгруженный файл может разойтись с фактическим размещением."
        note="Надёжнее сначала нажать «Пересоздать» — правки при этом потеряются, зато цифры будут актуальными."
        cancelLabel="Отмена"
        onCancel={closeDialog}
        primaryLabel="Всё равно выгрузить"
        primaryColor="#D97A22"
        onPrimary={runConfirmExport}
        tertiaryLabel="Пересоздать черновик"
        onTertiary={runRecreate}
      />

      <ReportDraftDialog
        open={dialog?.type === "deleteRow"}
        onClose={closeDialog}
        symbol="✕"
        symbolBg="#FDEDE6"
        symbolColor="#D2482C"
        title="Удалить строку из отчёта?"
        message="Строка исчезнет из выгрузки и из итоговой суммы. Вернуть её можно только пересозданием черновика."
        cancelLabel="Отмена"
        onCancel={closeDialog}
        primaryLabel="Удалить строку"
        primaryColor="#D2482C"
        onPrimary={handleConfirmDeleteRow}
      />

      <ReportDraftPreview
        open={previewOpen}
        draftId={draftId}
        onClose={() => setPreviewOpen(false)}
        localTotal={total}
        unsavedCount={unsavedRowsCount}
      />
    </div>
    </>
  );
}

ReportDraftEditor.propTypes = {
  draftId: PropTypes.string,
  onBack: PropTypes.func.isRequired,
  onDraftReplaced: PropTypes.func.isRequired,
  onConfirmed: PropTypes.func.isRequired,
  airports: PropTypes.array,
  mode: PropTypes.oneOf(["edit", "view"]),
};
