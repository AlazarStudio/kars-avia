import PropTypes from "prop-types";
import classes from "./ReportDraftHeader.module.css";
import RestoreIcon from "../../../../shared/icons/RestoreIcon";

// Строка управления редактором черновика: назад, заголовок (+ бейдж
// устаревания), действия справа. Чисто UI — вся логика (что дёргать по
// клику, какие диалоги открывать) живёт в ReportDraftEditor.
export default function ReportDraftHeader({
  title,
  isStale,
  dirty,
  hasRows,
  recreating,
  deleting,
  saving,
  confirming,
  onBack,
  onRecreate,
  onDelete,
  onSave,
  onConfirm,
}) {
  return (
    <div className={classes.bar}>
      <button type="button" className={classes.backBtn} onClick={onBack}>
        ← Назад
      </button>

      <div className={classes.title} title={title}>
        {title}
      </div>

      {isStale && (
        <span className={classes.staleBadge}>
          <span className={classes.staleDot} />
          устарел
        </span>
      )}

      <div className={classes.actions}>
        <button
          type="button"
          className={classes.recreateBtn}
          disabled={recreating}
          onClick={onRecreate}
        >
          <RestoreIcon width={16} height={16} color="#2A2E45" cursor="pointer" />
          {recreating ? "Пересоздание…" : "Пересоздать"}
        </button>

        <button type="button" className={classes.deleteBtn} disabled={deleting} onClick={onDelete}>
          {deleting ? "Удаление…" : "Удалить"}
        </button>

        <button
          type="button"
          className={dirty ? classes.saveBtnActive : classes.saveBtnDisabled}
          disabled={!dirty || saving}
          onClick={onSave}
        >
          {dirty && <span className={classes.saveDot} />}
          {saving ? "Сохранение…" : "Сохранить"}
        </button>

        <button
          type="button"
          className={hasRows ? classes.confirmBtnActive : classes.confirmBtnDisabled}
          disabled={!hasRows || confirming}
          onClick={onConfirm}
        >
          {confirming ? "Выгрузка…" : "Подтвердить и выгрузить"}
        </button>
      </div>
    </div>
  );
}

ReportDraftHeader.propTypes = {
  title: PropTypes.string.isRequired,
  isStale: PropTypes.bool,
  dirty: PropTypes.bool,
  hasRows: PropTypes.bool,
  recreating: PropTypes.bool,
  deleting: PropTypes.bool,
  saving: PropTypes.bool,
  confirming: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
  onRecreate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
