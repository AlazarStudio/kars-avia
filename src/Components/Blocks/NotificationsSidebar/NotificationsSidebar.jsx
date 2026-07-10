import React, { useState, useRef, useEffect } from "react";
import classes from "./NotificationsSidebar.module.css";
import Sidebar from "../Sidebar/Sidebar";
import {
  convertToDate,
  NOTIFICATIONS_SUBSCRIPTION,
  QUERY_NOTIFICATIONS,
} from "../../../../graphQL_requests";
import { useSubscription } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import { useNavigate } from "react-router-dom";
import { roles } from "../../../roles";
import ExportIcon from "../../../shared/icons/ExportIcon";
import CloseIcon from "../../../shared/icons/CloseIcon";
import useInfiniteScroll from "../../../hooks/useInfiniteScroll";
import InfiniteScrollSentinel from "../InfiniteScrollSentinel/InfiniteScrollSentinel";

const TAKE = 50; // размер страницы

function notificationDedupeKey(it) {
  return (
    it.id ??
    `${it.createdAt}-${it.description?.action}-${
      it.passengerRequestId ?? it.reserveId ?? it.requestId ?? ""
    }`
  );
}

const separatorToType = {
  All: undefined,
  request: "request",
  passengerRequest: "passengerRequest",
  transfer: "transfer",
};

function NotificationsSidebar({ onRequestClick, user, token, show, onClose }) {
  const sidebarRef = useRef();
  const navigate = useNavigate();

  const [separator, setSeparator] = useState("All");
  const selectedType = separatorToType[separator];

  const {
    items,
    hasMore,
    loading,
    loadingMore,
    error,
    wrapperRef,
    sentinelRef,
    refresh,
  } = useInfiniteScroll(QUERY_NOTIFICATIONS, {
    take: TAKE,
    enabled: show,
    context: { headers: { Authorization: `Bearer ${token}` } },
    buildVariables: (page, take) => ({
      pagination: {
        skip: page,
        take,
        ...(selectedType ? { type: selectedType } : {}),
      },
    }),
    getItems: (d) => d?.getAllNotifications?.notifications ?? [],
    getPageInfo: (d) => ({
      totalPages: d?.getAllNotifications?.totalPages,
      totalCount: d?.getAllNotifications?.totalCount,
    }),
    getKey: notificationDedupeKey,
    resetKeys: [selectedType],
  });

  // Подписка: мягко обновляем список с головы
  useSubscription(NOTIFICATIONS_SUBSCRIPTION, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    onData: () => {
      refresh();
    },
  });

  // helpers
  const dayKey = (s) => {
    const d = new Date(s);
    d.setHours(0, 0, 0, 0); // локальная полуночь
    return d.getTime();
  };
  const fmtDay = (ts) =>
    new Date(ts).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const sorted = React.useMemo(
    () =>
      [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [items]
  );

  const grouped = React.useMemo(() => {
    const m = new Map();
    for (const n of sorted) {
      const k = dayKey(n.createdAt);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(n);
    }
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]); // дни ↓
  }, [sorted]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (show) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, onClose]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.notifyWrapper}>
        {loading && <MUILoader fullHeight={"100vh"} />}

        {!loading && !error && (
          <>
            <div className={classes.requestTitle}>
              <div className={classes.requestTitle_name}>Уведомления</div>
              <div className={classes.requestTitle_close}>
                <div onClick={onClose} className={classes.closeIconWrapper}>
                  <CloseIcon />
                </div>
              </div>
            </div>
            <div className={classes.separatorWrapper}>
              <button
                onClick={() => setSeparator("All")}
                className={separator === "All" ? classes.active : null}
              >
                Все
              </button>
              <button
                onClick={() => setSeparator("request")}
                className={separator === "request" ? classes.active : null}
              >
                Эскадрилья
              </button>
              <button
                onClick={() => setSeparator("passengerRequest")}
                className={
                  separator === "passengerRequest" ? classes.active : null
                }
              >
                ФАП
              </button>
              <button
                onClick={() => setSeparator("transfer")}
                className={separator === "transfer" ? classes.active : null}
              >
                Трансфер
              </button>
            </div>

            <div className={classes.notify} ref={wrapperRef}>
              {grouped.map(([dayTs, list]) => (
                <div className={classes.notifySection} key={dayTs}>
                  <p className={classes.notifyDate}>{fmtDay(dayTs)}</p>
                  {list.map((notify, index) => {
                    const isHotelAdmin = user?.role === roles.hotelAdmin;
                    const isPassengerRequest =
                      notify.passengerRequestId != null;
                    const isReserve =
                      notify.reserveId != null && !isPassengerRequest;
                    const passengerRequestLink = `/far/${notify.passengerRequestId}`;
                    const reserveLink = `/reserve/reservePlacement/${notify.reserveId}`;
                    return (
                      <div
                        className={classes.notifyMessageWrapper}
                        key={notify.id ?? `${dayTs}-${index}`}
                      >
                        <div className={classes.notifyTextWrapper}>
                          <div className={classes.notifyMessageHeader}>
                            <div className={classes.notifyMessageTime}>
                              <p>{convertToDate(notify.createdAt, true)}</p>
                            </div>
                          </div>
                          <div className={classes.notifyMessageText}>
                            {notify?.description?.action === "new_message" &&
                            notify.chatId ? (
                              <p className={classes.notifyDescription}>
                                В чате новое сообщение
                              </p>
                            ) : (
                              <p
                                className={classes.notifyDescription}
                                dangerouslySetInnerHTML={{
                                  __html:
                                    notify.description?.description || "",
                                }}
                              />
                            )}
                          </div>
                          {isHotelAdmin && isPassengerRequest ? (
                            <p
                              className={classes.toRequest}
                              onClick={() => navigate(passengerRequestLink)}
                            >
                              <ExportIcon />
                            </p>
                          ) : isHotelAdmin && isReserve ? (
                            <p
                              className={classes.toRequest}
                              onClick={() => navigate(reserveLink)}
                            >
                              <ExportIcon />
                            </p>
                          ) : (
                            <p
                              className={classes.toRequest}
                              onClick={() =>
                                isPassengerRequest
                                  ? navigate(passengerRequestLink)
                                  : isReserve
                                    ? navigate(reserveLink)
                                    : onRequestClick(notify)
                              }
                            >
                              <ExportIcon />
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              <InfiniteScrollSentinel
                sentinelRef={sentinelRef}
                loadingMore={loadingMore}
                hasMore={hasMore}
                hasItems={grouped.length > 0}
                endLabel="Это все уведомления"
              />
            </div>
          </>
        )}
      </div>
    </Sidebar>
  );
}

export default NotificationsSidebar;
