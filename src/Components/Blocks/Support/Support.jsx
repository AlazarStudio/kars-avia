import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./Support.module.css";
import Sidebar from "../Sidebar/Sidebar";
import { getCookie } from "../../../../graphQL_requests";
import SupportMessage from "../SupportMessage/SupportMessage";

function Support({ show, onClose, user, selectedId }) {
  const token = getCookie("token");
  // console.log(user.id);

  // let userId = user ? user : selectedId
  

  const [activeTab, setActiveTab] = useState("Комментарии");
  const [formData, setFormData] = useState(null);
  const sidebarRef = useRef();

  // Функция закрытия формы
  const closeButton = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose]);

  const resetForm = useCallback(() => setActiveTab("Комментарии"), []);

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
      {!formData && (
        <Sidebar show={show} sidebarRef={sidebarRef}>
          <div className={classes.requestTitle}>
            <div className={classes.requestTitle_name}>
              Техническая поддержка
            </div>
            <div className={classes.requestTitle_close} onClick={closeButton}>
              <img src="/close.png" alt="" />
            </div>
          </div>

          <div
            className={classes.requestMiddle}
            // style={{
            //   height:
            //     (activeTab === "Комментарии") &&
            //     "calc(100vh - 79px - 67px)",
            // }}
          >
            <SupportMessage
              formData={formData}
              token={token}
              user={user}
              selectedId={selectedId}
            />
          </div>
        </Sidebar>
      )}
    </>
  );
}

export default Support;
