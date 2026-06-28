import React, { useRef, useEffect, useCallback, useMemo } from "react";
import classes from "./Logs.module.css";
import Sidebar from "../Sidebar/Sidebar";
import {
  convertToDateNew,
  getCookie,
  getMediaUrl,
} from "../../../../graphQL_requests";
import MUILoader from "../MUILoader/MUILoader";
import CloseIcon from "../../../shared/icons/CloseIcon";
import { roleLabels } from "../../../roles";
import useInfiniteScroll from "../../../hooks/useInfiniteScroll";
import InfiniteScrollSentinel from "../InfiniteScrollSentinel/InfiniteScrollSentinel";

function Logs({ type, queryLog, queryID, show, onClose, id, name }) {
  const token = getCookie("token");

  // Узел с логами зависит от типа сущности
  const node = (d) =>
    type === "hotel"
      ? d?.hotel?.logs
      : type === "airline"
        ? d?.airline?.logs
        : d?.reserve?.logs;

  const {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    wrapperRef,
    sentinelRef,
  } = useInfiniteScroll(queryLog, {
    take: 50,
    enabled: show && id != null,
    context: { headers: { Authorization: `Bearer ${token}` } },
    // OFFSET-пагинация: skip = page * take
    buildVariables: (page, take) => ({
      [queryID]: id,
      pagination: { skip: page * take, take },
    }),
    getItems: (d) => node(d)?.logs ?? [],
    getPageInfo: (d) => ({
      totalPages: node(d)?.totalPages,
      totalCount: node(d)?.totalCount,
    }),
    resetKeys: [id, type],
  });

  // Группировка истории по датам (как в уведомлениях и ExistRequest)
  const dayKey = (s) => {
    const d = new Date(s);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const fmtDay = (ts) =>
    new Date(ts).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const groupedHistory = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const m = new Map();
    for (const log of sorted) {
      const k = dayKey(log.createdAt);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(log);
    }
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [items]);

  const sidebarRef = useRef();

  // Функция закрытия формы
  const closeButton = useCallback(() => {
    onClose();
  }, [onClose]);

  // Клик вне боковой панели закрывает её
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeButton();
      }
    };

    if (show) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  return (
    <>
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>{`История ${name}`}</div>
          <div className={classes.requestTitle_close} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>

        {loading && <MUILoader fullHeight={"92vh"} />}

        {!loading && !error && (
          <div
            className={classes.requestData}
            style={{ paddingBottom: "20px" }}
          >
            <div ref={wrapperRef} className={classes.logs}>
              {groupedHistory.map(([dayTs, dayLogs]) => (
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
                      <div
                        className={classes.historyLog}
                        dangerouslySetInnerHTML={{
                          __html: log.description,
                        }}
                      />
                      <div
                        className={classes.logImg}
                        title={
                          log.user
                            ? [
                                log.user.name,
                                roleLabels[log.user.role] ??
                                  roleLabels[log.user.role?.toUpperCase()] ??
                                  log.user.role,
                              ]
                                .filter(Boolean)
                                .join(", ") || undefined
                            : undefined
                        }
                      >
                        <img
                          src={
                            log.user?.images[0]
                              ? getMediaUrl(log.user?.images[0])
                              : "/no-avatar.png"
                          }
                          alt=""
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}

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
      </Sidebar>
    </>
  );
}

export default Logs;
