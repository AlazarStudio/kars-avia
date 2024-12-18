import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import classes from "./ExistReserveMess.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useMutation, useQuery } from "@apollo/client";
import {
  CANCEL_REQUEST,
  CHANGE_TO_ARCHIVE,
  convertToDate,
  GET_LOGS,
  GET_REQUEST,
  GET_RESERVE_REQUEST,
  getCookie,
  SAVE_HANDLE_EXTEND_MUTATION,
  SAVE_MEALS_MUTATION,
} from "../../../../graphQL_requests";
import Message from "../Message/Message";
import { roles } from "../../../roles";

function ExistReserveMess({
  show,
  onClose,
  chooseRequestID,
  user
}) {
  const token = getCookie("token");

  const { data } = useQuery(GET_RESERVE_REQUEST, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
    variables: { reserveId: chooseRequestID },
  });

  const [activeTab, setActiveTab] = useState("Комментарии");
  const [formData, setFormData] = useState(null);
  const sidebarRef = useRef();

  useEffect(() => {
    if (data && data.reserve) setFormData(data.reserve);
  }, [data]);

  const closeButton = useCallback(() => {
    onClose();
  }, [onClose]);

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
          <div className={classes.requestTitle_name}>
            Сообщения
          </div>
          <div className={classes.requestTitle_close} onClick={closeButton}>
            <img src="/close.png" alt="" />
          </div>
        </div>

        <div className={classes.requestMiddle} style={{
          height:
            (activeTab === "Комментарии" ||
              formData.status !== "created") &&
            "calc(100vh - 79px)",
        }} >
          {/* Вкладка "Комментарии" */}
          {activeTab === "Комментарии" && (
            <Message
              activeTab={activeTab}
              chooseRequestID={''}
              chooseReserveID={chooseRequestID}
              formData={formData}
              token={token}
              user={user}
              height={159}
            />
          )}

        </div>
      </Sidebar>
    </>
  );
}

export default ExistReserveMess;
