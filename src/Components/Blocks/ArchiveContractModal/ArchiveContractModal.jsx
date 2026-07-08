import React, { useEffect } from "react";
import classes from "./ArchiveContractModal.module.css";

// Подтверждение переноса в архив (дизайн из макета реестра).
// По умолчанию — про договор; через title/entityLabel переиспользуется для ДС.
function ArchiveContractModal({
  number,
  title = "Перенести договор в архив?",
  entityLabel = "Договор",
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className={classes.overlay} data-archive-modal onClick={onCancel}>
      <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
        <div className={classes.top}>
          <span className={classes.icon}>
            <svg width="22" height="22" viewBox="0 0 19 19" fill="none">
              <rect x="1.75" y="2.25" width="15.5" height="4" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3.25 6.25V14.25C3.25 15.6307 4.36929 16.75 5.75 16.75H13.25C14.6307 16.75 15.75 15.6307 15.75 14.25V6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.5 9.75H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <div className={classes.title}>{title}</div>
        </div>

        <div className={classes.desc}>
          {entityLabel} {number ? <>№ <b className={classes.num}>{number}</b> </> : null}
          исчезнет из активного списка, но не будет удалён — его можно восстановить в любой момент.
        </div>

        <div className={classes.actions}>
          <button type="button" className={classes.cancel} onClick={onCancel}>
            Отмена
          </button>
          <button type="button" className={classes.confirm} onClick={onConfirm}>
            Перенести в архив
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArchiveContractModal;
