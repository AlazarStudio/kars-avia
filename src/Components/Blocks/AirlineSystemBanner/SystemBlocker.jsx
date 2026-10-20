import classes from "./AirlineSystemBanner.module.css";

// Полноэкранная карточка системного уведомления: закрывает весь интерфейс.
function SystemBlocker({ title, children, footer }) {
  return (
    <div
      className={classes.blocker}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="systemBlockerTitle"
    >
      <div className={classes.card}>
        <div className={classes.accent} />

        <div className={classes.body}>
          <div className={classes.head}>
            <div className={classes.icon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <div className={classes.eyebrow}>Системное уведомление</div>
              <div className={classes.title} id="systemBlockerTitle">
                {title}
              </div>
            </div>
          </div>

          {children && <p className={classes.text}>{children}</p>}

          {footer && <div className={classes.footer}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export default SystemBlocker;
