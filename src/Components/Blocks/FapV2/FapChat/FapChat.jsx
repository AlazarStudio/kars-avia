import React, { useEffect, useState } from "react";
import classes from "./FapChat.module.css";
import Message from "../../Message/Message";
import ChatIcon from "../../../../shared/icons/ChatIcon";
import CloseIcon from "../../../../shared/icons/CloseIcon";

// Единый чат ФАП v2: плавающая кнопка + выезжающий справа drawer поверх контента.
export default function FapChat({ passengerRequestId, token, user }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const r = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(r);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <>
      {!open && (
        <button
          type="button"
          className={classes.fab}
          onClick={() => setOpen(true)}
          aria-label="Открыть чат"
          title="Чат по заявке"
        >
          <ChatIcon />
          <span>Чат</span>
        </button>
      )}

      {mounted && (
        <>
          <div
            className={`${classes.backdrop} ${shown ? classes.backdropOpen : ""}`}
            onClick={() => setOpen(false)}
          />
          <div
            className={`${classes.drawer} ${shown ? classes.drawerOpen : ""}`}
            role="dialog"
            aria-label="Чат по заявке"
          >
            <div className={classes.header}>
              <span className={classes.title}>Чат</span>
              <button
                type="button"
                className={classes.close}
                onClick={() => setOpen(false)}
                aria-label="Закрыть чат"
              >
                <CloseIcon />
              </button>
            </div>
            <div className={classes.body}>
              <Message
                activeTab="Комментарий"
                passengerRequestId={passengerRequestId}
                token={token}
                user={user}
                chatPadding="0"
                chatHeight="calc(100vh - 150px)"
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
