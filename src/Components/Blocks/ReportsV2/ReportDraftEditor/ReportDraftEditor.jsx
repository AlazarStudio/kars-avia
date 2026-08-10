import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import classes from "./ReportDraftEditor.module.css";
import useReportDraft from "./useReportDraft";
import ReportDraftHeader from "./ReportDraftHeader";
import ReportDraftErrorBanner from "./ReportDraftErrorBanner";
import ReportDraftFilters from "./ReportDraftFilters";
import ReportDraftTable from "./ReportDraftTable";
import ReportDraftFooter from "./ReportDraftFooter";
import ReportDraftDialog from "./ReportDraftDialog";
import { DRAFT_FILTERS, pluralizeRows, rowMatchesSearch } from "./reportDraftEditorUtils";
import { useToast } from "../../../../contexts/ToastContext";
import { convertToDate } from "../../../../../graphQL_requests";
import { rowNeedsPrice, rowNeedsDays } from "../reportDraftRows";
import { isDraftStale, getDraftAgeDays } from "../reportDraftAge";

// Редактор строк черновика отчёта: таблица правки перед подтверждением.
// confirmReportDraft печатает строки ровно такими, как они лежат в базе —
// поэтому "Подтвердить" сначала сохраняет несохранённые правки (см.
// confirmAndExport в useReportDraft), а не полагается на то, что их кто-то
// заметит.
export default function ReportDraftEditor({ draftId, onBack, onDraftReplaced, onConfirmed }) {
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

  const [filter, setFilter] = useState(DRAFT_FILTERS.ALL);
  const [search, setSearch] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  // dialog: null | { type: "leave" | "delete" | "recreate" | "stale" } | { type: "deleteRow", row }
  const [dialog, setDialog] = useState(null);
  const closeDialog = () => setDialog(null);

  // Бэк вернул reportDraft: null (черновик удалён/не существует) — сообщаем
  // и уходим назад к списку, показывать тут больше нечего.
  useEffect(() => {
    if (!loading && draftId && draft === null) {
      notifyError("Черновик не найден");
      onBack();
    }
  }, [loading, draftId, draft, notifyError, onBack]);

  const handleResetFilters = () => {
    setFilter(DRAFT_FILTERS.ALL);
    setSearch("");
  };

  const runSave = async () => {
    try {
      await save();
      setSaveFailed(false);
      success("Черновик сохранён");
      return true;
    } catch (e) {
      setSaveFailed(true);
      notifyError(e?.graphQLErrors?.[0]?.message || "Не удалось сохранить черновик");
      return false;
    }
  };

  const handleBackClick = () => {
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
  const warningRows = searchedRows.filter((row) => rowNeedsPrice(row) || rowNeedsDays(row));
  const editedRows = searchedRows.filter((row) => editedUids.has(row._uid));

  const displayedRows =
    filter === DRAFT_FILTERS.WARNINGS
      ? warningRows
      : filter === DRAFT_FILTERS.EDITED
      ? editedRows
      : searchedRows;

  // Подвал, в отличие от чипов, — сводка по ВСЕМУ черновику, а не по
  // текущему поиску: иначе "показано 3 из 12 · изменено 5" читалось бы как
  // противоречие (изменённых больше, чем показано).
  const totalWarningsCount = rows.filter((row) => rowNeedsPrice(row) || rowNeedsDays(row)).length;

  if (!draft) {
    return (
      <div className={classes.wrap}>
        <div className={classes.loadingBar}>
          <button type="button" className={classes.loadingBack} onClick={onBack}>
            ← Назад
          </button>
        </div>
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
    );
  }

  const period = `${convertToDate(draft.startDate)} – ${convertToDate(draft.endDate)}`;
  const companyName = draft.filterJson?.companyName || "—";
  const title = `Черновик · ${companyName} · ${period}`;
  const stale = isDraftStale(draft.createdAt);
  const staleDays = Math.floor(getDraftAgeDays(draft.createdAt) ?? 0);
  const unsavedRowsCount = editedUids.size + deletedCount;

  return (
    <div className={classes.wrap}>
      <ReportDraftHeader
        title={title}
        isStale={stale}
        dirty={dirty}
        hasRows={rows.length > 0}
        recreating={recreating}
        deleting={deleting}
        saving={saving}
        confirming={confirming}
        onBack={handleBackClick}
        onRecreate={handleRecreateClick}
        onDelete={handleDeleteDraftClick}
        onSave={runSave}
        onConfirm={handleConfirmClick}
      />

      {saveFailed && <ReportDraftErrorBanner onRetry={runSave} retrying={saving} />}

      <div className={classes.card}>
        <ReportDraftFilters
          filter={filter}
          onFilterChange={setFilter}
          counts={{
            all: searchedRows.length,
            warnings: warningRows.length,
            edited: editedRows.length,
            deleted: deletedCount,
          }}
          dirty={dirty}
          onResetAll={resetAll}
          search={search}
          onSearchChange={setSearch}
        />

        <div className={classes.scroll}>
          <ReportDraftTable
            loading={loading}
            rows={rows}
            displayedRows={displayedRows}
            editedUids={editedUids}
            fieldEdited={fieldEdited}
            onCellChange={setCell}
            onResetRow={resetRow}
            onRequestDeleteRow={handleRequestDeleteRow}
            onResetFilters={handleResetFilters}
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
        title={`Черновику ${staleDays} дней`}
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
    </div>
  );
}

ReportDraftEditor.propTypes = {
  draftId: PropTypes.string,
  onBack: PropTypes.func.isRequired,
  onDraftReplaced: PropTypes.func.isRequired,
  onConfirmed: PropTypes.func.isRequired,
};
