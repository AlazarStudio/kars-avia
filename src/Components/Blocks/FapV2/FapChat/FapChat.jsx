import React, { useEffect, useState } from "react";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_PASSENGER_REQUEST_CHATS,
  REQUEST_MESSAGES_SUBSCRIPTION,
} from "../../../../../graphQL_requests";
import classes from "./FapChat.module.css";
import Message from "../../Message/Message";
import ChatIcon from "../../../../shared/icons/ChatIcon";
import CloseIcon from "../../../../shared/icons/CloseIcon";

// Единый чат ФАП v2: плавающая кнопка + выезжающий справа drawer поверх контента.
export default function FapChat({ passengerRequestId, token, user, subtitle }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  const isExternal = user?.subjectType === "EXTERNAL_USER";

  // Счётчик непрочитанных считаем снаружи Message — лёгким запросом за чатом заявки.
  const { data, refetch } = useQuery(GET_PASSENGER_REQUEST_CHATS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { passengerRequestId },
    fetchPolicy: "network-only",
    skip: !passengerRequestId || isExternal,
  });

  const chat = data?.chats?.[0];
  const unreadCount = chat?.unreadMessagesCount || 0;

  useSubscription(REQUEST_MESSAGES_SUBSCRIPTION, {
    variables: { chatId: chat?.id },
    skip: !chat?.id,
    onData: () => {
      if (!open) refetch();
    },
  });

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

  // При закрытии чата подтягиваем актуальный счётчик — внутри Message сообщения
  // помечаются прочитанными по мере просмотра.
  useEffect(() => {
    if (!open && !isExternal && chat?.id) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {unreadCount > 0 && (
            <span className={classes.badge} aria-label={`Непрочитанных: ${unreadCount}`}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
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
              <div className={classes.headerAvatar}>
                <ChatIcon />
              </div>
              <div className={classes.headerText}>
                <span className={classes.title}>Чат по заявке</span>
                {subtitle && <span className={classes.subtitle}>{subtitle}</span>}
              </div>
              <button
                type="button"
                className={classes.close}
                onClick={() => setOpen(false)}
                aria-label="Закрыть чат"
              >
                <CloseIcon color="#fff" />
              </button>
            </div>
            <div className={classes.body}>
              <Message
                activeTab="Комментарий"
                passengerRequestId={passengerRequestId}
                token={token}
                user={user}
                chatPadding="0"
                chatHeight="calc(100vh - 148px)"
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
