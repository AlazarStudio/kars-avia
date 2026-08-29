import React from "react";
import TrayCardV2 from "./TrayCardV2";
import Button from "../../Standart/Button/Button";
import classes from "./UnplacedTray.module.css";

// Лоток неразмещённых заявок — колонка в потоке справа от сетки.
const UnplacedTray = ({
  open,
  onClose,
  city,
  items,
  listHidden,
  onCreateRequest,
  canCreate,
  requestId,
  toggleRequestSidebar,
}) => {
  if (!open) return null;

  const isEmpty = items.length === 0;
  // Список скрыт гейтом доступа — «Все заявки размещены» здесь было бы враньём.
  const isHiddenEmpty = isEmpty && listHidden;

  return (
    <div className={classes.tray}>
      <div className={classes.header}>
        <span className={classes.title}>
          {city ? `Заявки по эскадрильи в городе ${city}` : "Заявки по эскадрильи"}
        </span>
        <button type="button" className={classes.close} onClick={onClose}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7090"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isHiddenEmpty ? (
        <div className={classes.empty}>
          <span className={classes.emptyTitle}>Заявок не найдено</span>
        </div>
      ) : isEmpty ? (
        <div className={classes.empty}>
          <span className={classes.emptyIcon}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2e7d32"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <span className={classes.emptyTitle}>Все заявки размещены</span>
          <span className={classes.emptyText}>
            Новые заявки по эскадрилье появятся здесь автоматически
          </span>
          {canCreate && onCreateRequest ? (
            <Button
              onClick={onCreateRequest}
              backgroundcolor="#fff"
              color="#0057C3"
              border="1px solid #0057C3"
              height="36px"
              padding="0 16px"
            >
              Создать заявку
            </Button>
          ) : null}
        </div>
      ) : (
        <div className={classes.list}>
          {items.map((request) => (
            <TrayCardV2
              key={request.id}
              request={request}
              requestId={requestId}
              toggleRequestSidebar={toggleRequestSidebar}
            />
          ))}
          <div className={classes.dropHint}>
            Перетащите карточку на койку в шахматке
          </div>
        </div>
      )}
    </div>
  );
};

export default UnplacedTray;
