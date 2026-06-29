import React, { useState } from "react";
import classes from "./AddMenuButton.module.css";

// Кнопка «+ Добавить» с выпадающим меню: Новый отдел / Новый пользователь.
// Пункты вызывают существующие формы добавления (через колбэки).
export default function AddMenuButton({
  onAddDepartment,
  onAddUser,
  deptLabel = "Новый отдел",
  deptSubtitle = "Подразделение компании",
  userLabel = "Новый пользователь",
  userSubtitle = "Аккаунт сотрудника",
}) {
  const [open, setOpen] = useState(false);

  const pick = (fn) => {
    setOpen(false);
    fn?.();
  };

  return (
    <div className={classes.wrap}>
      <button
        type="button"
        className={classes.trigger}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Добавить
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div className={classes.overlay} onClick={() => setOpen(false)} />
          <div className={classes.menu}>
            <button
              type="button"
              className={classes.item}
              onClick={() => pick(onAddDepartment)}
            >
              <span className={`${classes.itemIcon} ${classes.iconBlue}`}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="3" width="16" height="18" rx="1.6" />
                  <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h6" />
                </svg>
              </span>
              <span className={classes.itemText}>
                <span className={classes.itemTitle}>{deptLabel}</span>
                <span className={classes.itemSub}>{deptSubtitle}</span>
              </span>
            </button>

            <button
              type="button"
              className={classes.item}
              onClick={() => pick(onAddUser)}
            >
              <span className={`${classes.itemIcon} ${classes.iconGreen}`}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="8" r="3.6" />
                  <path d="M3.5 20c0-3.6 3.2-5.6 6.5-5.6 1 0 2 .2 2.8.5" />
                  <line x1="18.5" y1="13" x2="18.5" y2="19" />
                  <line x1="15.5" y1="16" x2="21.5" y2="16" />
                </svg>
              </span>
              <span className={classes.itemText}>
                <span className={classes.itemTitle}>{userLabel}</span>
                <span className={classes.itemSub}>{userSubtitle}</span>
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
