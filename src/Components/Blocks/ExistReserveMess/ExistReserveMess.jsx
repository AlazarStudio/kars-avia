import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./ExistReserveMess.module.css";
import Sidebar from "../Sidebar/Sidebar";
import { useQuery } from "@apollo/client";
import { GET_RESERVE_REQUEST, getCookie } from "../../../../graphQL_requests";
import Message from "../Message/Message";

function ExistReserveMess({ show, onClose, chooseRequestID, hotelId, user }) {
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

  const [separator, setSeparator] = useState("airline");
  const [isHaveTwoChats, setIsHaveTwoChats] = useState();

  return (
    <>
      <Sidebar show={show} sidebarRef={sidebarRef}>
        <div className={classes.requestTitle}>
          <div className={classes.requestTitle_name}>Сообщения</div>
          <div className={classes.requestTitle_close} onClick={closeButton}>
            <img src="/close.png" alt="" />
          </div>
        </div>

        <div
          className={classes.requestMiddle}
          style={{
            height:
              (activeTab === "Комментарии" || formData.status !== "created") &&
              "calc(100vh - 79px)",
          }}
        >
          {/* Вкладка "Комментарии" */}
          {activeTab === "Комментарии" && (
            <>
              {user?.airlineId || user?.hotelId ? null : (
                <div className={classes.separatorWrapper}>
                  {isHaveTwoChats === false ? (
                    <button
                      onClick={() => setSeparator("airline")} // Установить separator как 'airline'
                      className={
                        separator === "airline" ? classes.active : null
                      }
                    >
                      Авиакомпания
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setSeparator("airline")} // Установить separator как 'airline'
                        className={
                          separator === "airline" ? classes.active : null
                        }
                      >
                        Авиакомпания
                      </button>
                      <button
                        onClick={() => setSeparator("hotel")} // Установить separator как 'hotel'
                        className={
                          separator === "hotel" ? classes.active : null
                        }
                      >
                        Гостиница
                      </button>
                    </>
                  )}
                </div>
              )}

              <Message
                activeTab={activeTab}
                show={show}
                setIsHaveTwoChats={setIsHaveTwoChats}
                chooseRequestID={""}
                chooseReserveID={chooseRequestID}
                formData={formData}
                token={token}
                user={user}
                separator={separator}
                hotelChatId={hotelId}
                chatHeight={
                  user?.airlineId || user?.hotelId
                    ? "calc(100vh - 150px)"
                    : "calc(100vh - 210px)"
                }
              />
            </>
          )}
        </div>
      </Sidebar>
    </>
  );
}

export default ExistReserveMess;
