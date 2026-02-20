import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";

import classes from "./ExistRequestTransfer.module.css";
import Sidebar from "../Sidebar/Sidebar";
import CloseIcon from "../../../shared/icons/CloseIcon";
import MUILoader from "../MUILoader/MUILoader";

import {
  GET_TRANSFER_REQUEST,
  convertToDate,
  getCookie,
} from "../../../../graphQL_requests";
import { statusLabels } from "../../../roles";
import TransferMessage from "../TransferMessage/TransferMessage";
import Button from "../../Standart/Button/Button";

function ExistRequestTransfer({
  show,
  onClose,
  chooseRequestID,
  user,
  accessMenu,
  setChooseRequestID,
  canChat = true,
}) {
  const navigate = useNavigate();
  const token = getCookie("token");
  const sidebarRef = useRef();

  const [activeTab, setActiveTab] = useState("Общая");

  const { data, loading } = useQuery(GET_TRANSFER_REQUEST, {
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    },
    variables: { transferId: chooseRequestID },
    skip: !chooseRequestID || !show,
  });

  const transfer = data?.transfer || null;

  const closeButton = useCallback(() => {
    setActiveTab("Общая");
    onClose();
    setChooseRequestID?.("");
  }, [onClose, setChooseRequestID]);

  // Клик вне боковой панели закрывает её (как в ExistRequest)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeButton();
      }
    };
    if (show) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  const handleGoToMap = () => {
    if (chooseRequestID) {
      closeButton();
      navigate(`/orders/${chooseRequestID}`);
    }
  };

  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  const getStatusClass = (status) => {
    if (!status) return "";
    return (status || "").toLowerCase();
  };

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>
          {transfer ? `№ ${transfer.id}` : "Заявка"}
        </div>
        <div className={classes.requestTitle_close}>
          <div onClick={closeButton} className={classes.closeIconWrapper}>
            <CloseIcon />
          </div>
        </div>
      </div>

      {loading ? (
        <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
      ) : transfer ? (
        <>
          <div className={classes.tabs}>
            <div
              className={`${classes.tab} ${activeTab === "Общая" ? classes.activeTab : ""}`}
              onClick={() => handleTabChange("Общая")}
            >
              Общая
            </div>
            {canChat && (
              <div
                className={`${classes.tab} ${activeTab === "Комментарии" ? classes.activeTab : ""}`}
                onClick={() => handleTabChange("Комментарии")}
              >
                Комментарии
              </div>
            )}
          </div>

          <div
            className={classes.requestMiddle}
            style={{ height: activeTab === "Комментарии" ? "calc(100vh - 117px)" : "calc(100vh - 200px)" }}
          >
            {activeTab === "Общая" && (
              <div className={classes.requestData}>
                <div className={classes.requestDataTitle}>
                  Информация о заявке
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>
                    Статус
                  </div>
                  <div className={`${classes.requestDataInfo_desc} ${classes.requestDataInfo_descStatus}`}>
                    <span
                      className={`${classes.statusBadge} ${classes[getStatusClass(transfer.status)] || ""}`}
                    >
                      {statusLabels[transfer.status] || transfer.status}
                    </span>
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>
                    Авиакомпания
                  </div>
                  <div className={classes.requestDataInfo_desc}>
                    {transfer.airline?.name || "—"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>
                    Пассажиры
                  </div>
                  <div className={classes.requestDataInfo_desc}>
                    {transfer.persons?.length > 0
                      ? transfer.persons.map((p) => p.name).join(", ")
                      : "Предварительная бронь"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>
                    Подача
                  </div>
                  <div className={classes.requestDataInfo_desc}>
                    {transfer.fromAddress || "—"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>
                    Куда ехать
                  </div>
                  <div className={classes.requestDataInfo_desc}>
                    {transfer.toAddress || "—"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>
                    Время подачи
                  </div>
                  <div className={classes.requestDataInfo_desc}>
                    {transfer.scheduledPickupAt
                      ? `${convertToDate(transfer.scheduledPickupAt)} ${convertToDate(transfer.scheduledPickupAt, true)}`
                      : "—"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>
                    Багаж
                  </div>
                  <div className={classes.requestDataInfo_desc}>
                    {transfer.baggage || "—"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>
                    Описание
                  </div>
                  <div className={classes.requestDataInfo_desc}>
                    {transfer.description || "—"}
                  </div>
                </div>

                {transfer.driver && (
                  <>
                    <div className={classes.requestDataTitle}>
                      Информация о водителе
                    </div>
                    {transfer.driver.organization?.name && (
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Организация
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {transfer.driver.organization.name}
                        </div>
                      </div>
                    )}
                    <div className={classes.requestDataInfo}>
                      <div className={classes.requestDataInfo_title}>
                        Имя
                      </div>
                      <div className={classes.requestDataInfo_desc}>
                        {transfer.driver.name || "—"}
                      </div>
                    </div>
                    <div className={classes.requestDataInfo}>
                      <div className={classes.requestDataInfo_title}>
                        Машина
                      </div>
                      <div className={classes.requestDataInfo_desc}>
                        {transfer.driver.car || "—"}
                      </div>
                    </div>
                    <div className={classes.requestDataInfo}>
                      <div className={classes.requestDataInfo_title}>
                        Гос. номер
                      </div>
                      <div className={classes.requestDataInfo_desc}>
                        {transfer.driver.vehicleNumber || "—"}
                      </div>
                    </div>
                    {transfer.driver.rating != null && (
                      <div className={classes.requestDataInfo}>
                        <div className={classes.requestDataInfo_title}>
                          Рейтинг
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {transfer.driver.rating}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "Комментарии" && canChat && (
              <TransferMessage
                transferId={chooseRequestID}
                token={token}
                user={user}
                chatHeight={"calc(100vh - 117px)"}
              />
            )}
          </div>

          {activeTab !== "Комментарии" && (
            <div className={classes.requestButton}>
              <Button
                type="button"
                // className={classes.goToMapButton}
                onClick={handleGoToMap}
              >
                Перейти на карту
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className={classes.requestData}>
          <p>Заявка не найдена</p>
        </div>
      )}
    </Sidebar>
  );
}

export default ExistRequestTransfer;
