import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import classes from "./PassengerRequestLogs.module.css";
import Sidebar from "../Sidebar/Sidebar";
import CloseIcon from "../../../shared/icons/CloseIcon";
import { useQuery } from "@apollo/client";
import {
  convertToDate,
  convertToDateNew,
  GET_PASSENGER_REQUEST_LOGS,
  getCookie,
  getMediaUrl,
} from "../../../../graphQL_requests";
import ReactPaginate from "react-paginate";
import MUILoader from "../MUILoader/MUILoader";
import { roleLabels } from "../../../roles";

const PAGE_SIZE = 50;

function PassengerRequestLogs({ show, onClose, passengerRequestId }) {
  const token = getCookie("token");
  const sidebarRef = useRef(null);
  const logRef = useRef(null);
  const [pageInfo, setPageInfo] = useState({ skip: 0, take: PAGE_SIZE });

  useEffect(() => {
    if (show) {
      setPageInfo({ skip: 0, take: PAGE_SIZE });
    }
  }, [show]);

  const { data: logsData, loading } = useQuery(GET_PASSENGER_REQUEST_LOGS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      passengerRequestId,
      pagination: pageInfo,
    },
    skip: !show || !passengerRequestId,
  });

  const logsList = logsData?.passengerRequest?.logs?.logs ?? [];
  const totalPages = logsData?.passengerRequest?.logs?.totalPages ?? 1;

  const groupedHistory = useMemo(() => {
    const sorted = [...logsList].sort(
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
  }, [logsList]);

  const fmtDay = (ts) =>
    new Date(ts).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const handlePageClick = useCallback((e) => {
    if (logRef.current) {
      logRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
    setPageInfo((prev) => ({
      ...prev,
      skip: e.selected * prev.take,
    }));
  }, []);

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

        {logsData && (
          <div
            className={classes.requestData}
            style={{ paddingBottom: totalPages > 1 ? "40px" : "0" }}
          >
            <div ref={logRef} className={classes.logs}>
              {groupedHistory.length === 0 ? (
                <div className={classes.empty}>
                  Записей в истории пока нет.
                </div>
              ) : (
                groupedHistory.map(([dayTs, dayLogs]) => (
                  <div
                    className={classes.historySection}
                    key={dayTs}
                  >
                    <div className={classes.historyDate}>
                      {fmtDay(dayTs)}
                    </div>
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
            </div>
            {totalPages > 1 && (
              <div className={classes.pagination}>
                <ReactPaginate
                  previousLabel="←"
                  nextLabel="→"
                  breakLabel="..."
                  pageCount={totalPages}
                  marginPagesDisplayed={1}
                  pageRangeDisplayed={2}
                  onPageChange={handlePageClick}
                  containerClassName={classes.pagination}
                  activeClassName={classes.activePaginationNumber}
                  pageLinkClassName={classes.paginationNumber}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default PassengerRequestLogs;
