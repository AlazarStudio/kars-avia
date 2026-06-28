import React, { useCallback, useEffect, useMemo, useRef } from "react";
import classes from "./PassengerRequestLogs.module.css";
import Sidebar from "../Sidebar/Sidebar";
import CloseIcon from "../../../shared/icons/CloseIcon";
import {
  convertToDateNew,
  GET_PASSENGER_REQUEST_LOGS,
  getCookie,
  getMediaUrl,
} from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import { roleLabels } from "../../../roles";
import useInfiniteScroll from "../../../hooks/useInfiniteScroll";
import InfiniteScrollSentinel from "../InfiniteScrollSentinel/InfiniteScrollSentinel";

const PAGE_SIZE = 50;

function PassengerRequestLogs({ show, onClose, passengerRequestId }) {
  const token = getCookie("token");
  const sidebarRef = useRef(null);

  const {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    wrapperRef,
    sentinelRef,
  } = useInfiniteScroll(GET_PASSENGER_REQUEST_LOGS, {
    take: PAGE_SIZE,
    enabled: show && !!passengerRequestId,
    context: { headers: { Authorization: `Bearer ${token}` } },
    // OFFSET-пагинация: skip = page * take
    buildVariables: (page, take) => ({
      passengerRequestId,
      pagination: { skip: page * take, take },
    }),
    getItems: (d) => d?.passengerRequest?.logs?.logs ?? [],
    getPageInfo: (d) => ({
      totalPages: d?.passengerRequest?.logs?.totalPages,
      totalCount: d?.passengerRequest?.logs?.totalCount,
    }),
    resetKeys: [passengerRequestId],
  });

  const groupedHistory = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const dayKey = (dateStr) => {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };
    const m = new Map();
    for (const log of sorted) {
      const k = dayKey(log.createdAt);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(log);
    }
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [items]);

  const fmtDay = (ts) =>
    new Date(ts).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const closeButton = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        show &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        closeButton();
      }
    };
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.inner}>
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>История заявки</div>
          <div className={classes.requestTitle_close} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>

        {loading && <MUILoader fullHeight={"92vh"} />}

        {!loading && !error && (
          <div className={classes.requestData} style={{ paddingBottom: "0" }}>
            <div ref={wrapperRef} className={classes.logs}>
              {groupedHistory.length === 0 ? (
                <div className={classes.empty}>Записей в истории пока нет.</div>
              ) : (
                groupedHistory.map(([dayTs, dayLogs]) => (
                  <div className={classes.historySection} key={dayTs}>
                    <div className={classes.historyDate}>{fmtDay(dayTs)}</div>
                    {dayLogs.map((log, idx) => (
                      <div
                        className={classes.logText}
                        key={log.id ?? `${dayTs}-${idx}`}
                      >
                        <span className={classes.historyLogTime}>
                          {convertToDateNew(log.createdAt, true)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            className={classes.historyLog}
                            dangerouslySetInnerHTML={{
                              __html: log.description || "",
                            }}
                          />
                          {log.reason && (
                            <div className={classes.historyLogReason}>
                              Причина: {log.reason}
                            </div>
                          )}
                          {log.cancelReason && (
                            <div className={classes.historyLogReason}>
                              Причина отмены: {log.cancelReason}
                            </div>
                          )}
                        </div>
                        <div
                          className={classes.logImg}
                          title={
                            log.user
                              ? [
                                  log.user?.name,
                                  roleLabels[log.user?.role] ??
                                    roleLabels[log.user?.role?.toUpperCase()] ??
                                    log.user?.role,
                                ]
                                  .filter(Boolean)
                                  .join(", ") || undefined
                              : undefined
                          }
                        >
                          <img
                            src={
                              log.user?.images?.[0]
                                ? getMediaUrl(log.user.images[0])
                                : "/no-avatar.png"
                            }
                            alt=""
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}

              <InfiniteScrollSentinel
                sentinelRef={sentinelRef}
                loadingMore={loadingMore}
                hasMore={hasMore}
                hasItems={groupedHistory.length > 0}
                endLabel="Это вся история"
              />
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default PassengerRequestLogs;
