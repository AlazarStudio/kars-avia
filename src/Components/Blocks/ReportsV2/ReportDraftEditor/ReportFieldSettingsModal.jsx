import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import classes from "./ReportFieldSettingsModal.module.css";
import MUISwitch from "../../MUISwitch/MUISwitch";
import { EDITABLE_FIELDS, REPORT_FIELD_LABELS } from "../reportDraftRows";

// Шестерёнка редактора черновика: какие поля строк правятся. Выглядит как
// карточка доступов (AccessPermissionsPanel): строка-подпись + переключатель.
// Настройка ЛИЧНАЯ и хранится у пользователя на сервере
// (User.reportEditableFields) — едет за ним на любое устройство; открыть её
// может только тот, кому должность выдала право reportFieldSettings.
//
// Собственный оверлей вместо useDialog — по той же причине, что у
// ReportDraftDialog: системный диалог умеет только «да/нет».
export default function ReportFieldSettingsModal({
  open,
  fields, // string[] | null — текущая настройка (null = все поля)
  saving,
  onSave, // (string[] | null) => void; null — сброс к дефолту
  onClose,
}) {
  const [draft, setDraft] = useState(() => new Set(fields ?? EDITABLE_FIELDS));

  // Каждое открытие стартует с сохранённого состояния, а не с прошлого черновика.
  useEffect(() => {
    if (open) setDraft(new Set(fields ?? EDITABLE_FIELDS));
  }, [open, fields]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (key, checked) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const allOn = EDITABLE_FIELDS.every((key) => draft.has(key));

  const handleSave = () => {
    // Полный набор сохраняем как null (сброс): дефолт остаётся дефолтом и
    // автоматически подхватит поля, которые редактор получит в будущем.
    onSave(allOn ? null : EDITABLE_FIELDS.filter((key) => draft.has(key)));
  };

  return (
    <div
      className={classes.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={classes.card} role="dialog" aria-modal="true" aria-labelledby="reportFieldSettingsTitle">
        <div id="reportFieldSettingsTitle" className={classes.title}>
          Редактируемые поля черновика
        </div>
        <div className={classes.subtitle}>
          Личная настройка: выключенные поля показываются только для чтения.
          Сохраняется в профиле и действует на любом устройстве.
        </div>

        <div className={classes.list}>
          {EDITABLE_FIELDS.map((key) => (
            <div key={key} className={classes.row}>
              <div className={classes.rowLabel}>{REPORT_FIELD_LABELS[key] || key}</div>
              <MUISwitch
                label=""
                checked={draft.has(key)}
                onChange={(e) => toggle(key, e.target.checked)}
                disabled={saving}
              />
            </div>
          ))}
        </div>

        <div className={classes.actions}>
          <button
            type="button"
            className={classes.linkBtn}
            disabled={saving || allOn}
            onClick={() => setDraft(new Set(EDITABLE_FIELDS))}
          >
            Включить все
          </button>
          <span className={classes.spacer} />
          <button type="button" className={classes.cancelBtn} onClick={onClose} disabled={saving}>
            Отмена
          </button>
          <button type="button" className={classes.primaryBtn} onClick={handleSave} disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

ReportFieldSettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  fields: PropTypes.arrayOf(PropTypes.string),
  saving: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
