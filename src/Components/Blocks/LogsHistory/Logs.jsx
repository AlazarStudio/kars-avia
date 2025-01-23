import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./Logs.module.css";
import Sidebar from "../Sidebar/Sidebar";
import { useQuery } from "@apollo/client";
import {
  convertToDate,
  GET_AIRLINE_LOGS,
  GET_HOTEL_LOGS,
  GET_RESERVE_LOGS,
  getCookie,
} from "../../../../graphQL_requests";

function Logs({ type, queryLog, queryID, show, onClose, id, name }) {
  const token = getCookie("token");

  const query = queryLog;
  const ID = queryID;

  const { data: dataLogs } = useQuery(query, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Apollo-Require-Preflight': 'true'
      },
    },
    variables: { [ID]: id },
  });

  // console.log(dataLogs);

  const [logsData, setLogsData] = useState(null);

  useEffect(() => {
    if (dataLogs)
      setLogsData(
        type === "hotel"
          ? dataLogs.hotel
          : type === "airline"
          ? dataLogs.airline
          : dataLogs.reserve
      );
  }, [dataLogs]);

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
            <img src="/close.png" alt="" />
          </div>
        </div>

        {logsData && (
          <div className={classes.requestData}>
            <div className={classes.logs}>
              {[...logsData.logs].reverse().map((log, index) => (
                <div className={classes.logs1} key={log.id}>
                  <div className={classes.historyDate} key={index}>
                    {convertToDate(log.createdAt)}{" "}
                    {convertToDate(log.createdAt, true)}
                  </div>
                  <div
                    className={classes.historyLog}
                    dangerouslySetInnerHTML={{
                      __html: log.description,
                    }}
                  >
                    {/* {log.description} */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Sidebar>
    </>
  );
}

export default Logs;
