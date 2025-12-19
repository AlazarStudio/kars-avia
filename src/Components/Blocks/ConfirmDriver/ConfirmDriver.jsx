import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./ConfirmDriver.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  getCookie,
  server,
  UPDATE_DRIVER_MUTATION,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

function ConfirmDriver({
  show,
  onClose,
  confirm,
  chooseObject,
  updateDriver,
  addNotification,
}) {
  const token = getCookie("token");

  const [updateDriverMutation, { loading: mutationLoading }] = useMutation(
    UPDATE_DRIVER_MUTATION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const sidebarRef = useRef();
  const [showIMG, setShowIMG] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [refusalReason, setRefusalReason] = useState("");

  useEffect(() => {
    if (chooseObject) {
      setShowIMG(chooseObject?.documents?.driverPhoto);
    }
  }, [chooseObject]);

  const closeButton = useCallback(() => {
    setRefusalReason("");
    setShowRejectModal(false);
    onClose();
  }, [onClose]);

  const handleApprove = async () => {
    if (!chooseObject?.id) return;

    setIsLoading(true);
    try {
      await updateDriverMutation({
        variables: {
          updateDriverId: chooseObject.id,
          input: {
            registrationStatus: "APPROVED",
          },
        },
      });

      if (updateDriver) {
        updateDriver(
          {
            ...chooseObject,
            registrationStatus: "APPROVED",
          },
          chooseObject.index
        );
      }

      addNotification?.("Водитель принят.", "success");
      closeButton();
    } catch (error) {
      console.error("Ошибка при принятии водителя:", error);
      addNotification?.("Не удалось принять водителя.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!refusalReason.trim()) {
      addNotification?.("Пожалуйста, укажите причину отклонения.", "warning");
      return;
    }

    if (!chooseObject?.id) return;

    setIsLoading(true);
    try {
      await updateDriverMutation({
        variables: {
          updateDriverId: chooseObject.id,
          input: {
            registrationStatus: "REJECTED",
            refusalReason: refusalReason.trim(),
          },
        },
      });

      if (updateDriver) {
        updateDriver(
          {
            ...chooseObject,
            registrationStatus: "REJECTED",
            refusalReason: refusalReason.trim(),
          },
          chooseObject.index
        );
      }

      addNotification?.("Водитель отклонен.", "success");
      setShowRejectModal(false);
      setRefusalReason("");
      closeButton();
    } catch (error) {
      console.error("Ошибка при отклонении водителя:", error);
      addNotification?.("Не удалось отклонить водителя.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Не закрываем sidebar, если открыто модальное окно
      if (showRejectModal) {
        return;
      }

      // Проверяем, что клик не внутри sidebar и не внутри Dialog
      const isClickInsideSidebar = sidebarRef.current?.contains(event.target);
      const isClickInsideDialog = event.target.closest('[role="dialog"]');

      if (isClickInsideSidebar || isClickInsideDialog) {
        return; // Если клик внутри sidebar или Dialog, ничего не делаем
      }

      closeButton();
    };

    if (show && !showRejectModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, showRejectModal, closeButton]);

  // console.log(user);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Водитель</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="Close" />
        </div>
      </div>
      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle} style={confirm ? { height: "calc(100% - 90px - 71px)" } : { height: "calc(100% - 80px)" }}>
            <div className={classes.requestData}>
              <div className={classes.requestDataInfo_img}>
                <div className={classes.requestDataInfo_img_imgBlock}>
                  <img
                    src={
                      showIMG?.length !== 0
                        ? `${server}${showIMG}`
                        : "/no-avatar.png"
                    }
                    alt=""
                    style={{ userSelect: "none" }}
                  />
                </div>
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>ФИО</div>
                <input
                  type="text"
                  value={chooseObject?.name || ""}
                  disabled
                />
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Почта</div>
                <input
                  type="email"
                  value={chooseObject?.email || ""}
                  disabled
                />
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Номер</div>
                <input
                  type="text"
                  value={chooseObject?.number || ""}
                  disabled
                />
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Номер водительских прав
                </div>
                <input
                  type="text"
                  value={chooseObject?.vehicleNumber || ""}
                  disabled
                />
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Машина</div>
                <input
                  type="text"
                  value={chooseObject?.car || ""}
                  disabled
                />
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Номер машины
                </div>
                <input
                  type="text"
                  value={chooseObject?.driverLicenseNumber || ""}
                  disabled
                />
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Дополнительное оборудование
                </div>
                <input
                  type="text"
                  value={chooseObject?.extraEquipment || ""}
                  disabled
                />
              </div>

              <div className={classes.imageList}>
                {chooseObject?.documents?.carPhotos?.map((image, index) => {
                  return (
                    <div
                      key={`${image}-${index}`}
                      className={`${classes.imageItem}`}
                    >
                      <img
                        src={`${server}${image}`}
                        alt={`Image ${index + 1}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className={classes.imageList}>
                {chooseObject?.documents?.stsPhoto?.map((image, index) => {
                  return (
                    <div
                      key={`${image}-${index}`}
                      className={`${classes.imageItem}`}
                    >
                      <img
                        src={`${server}${image}`}
                        alt={`Image ${index + 1}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className={classes.imageList}>
                {chooseObject?.documents?.ptsPhoto?.map((image, index) => {
                  return (
                    <div
                      key={`${image}-${index}`}
                      className={`${classes.imageItem}`}
                    >
                      <img
                        src={`${server}${image}`}
                        alt={`Image ${index + 1}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className={classes.imageList}>
                {chooseObject?.documents?.osagoPhoto?.map((image, index) => {
                  return (
                    <div
                      key={`${image}-${index}`}
                      className={`${classes.imageItem}`}
                    >
                      <img
                        src={`${server}${image}`}
                        alt={`Image ${index + 1}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className={classes.imageList}>
                {chooseObject?.documents?.licensePhoto?.map((image, index) => {
                  return (
                    <div
                      key={`${image}-${index}`}
                      className={`${classes.imageItem}`}
                    >
                      <img
                        src={`${server}${image}`}
                        alt={`Image ${index + 1}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {confirm && chooseObject?.registrationStatus !== "APPROVED" && (
            <div className={classes.requestButton}>
              <Button
                onClick={handleReject}
                backgroundcolor={"var(--red)"}
                disabled={isLoading || mutationLoading}
              >
                Отклонить
              </Button>

              <Button
                onClick={handleApprove}
                backgroundcolor={"#3CBC6726"}
                color={"#3B6C54"}
                disabled={isLoading || mutationLoading}
              >
                Принять
              </Button>
            </div>
          )}
        </>
      )}

      {/* Модальное окно для ввода причины отклонения */}
      <Dialog
        open={showRejectModal}
        onClose={(event, reason) => {
          // Закрываем только при клике на backdrop или ESC, но не при клике внутри
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            setShowRejectModal(false);
            setRefusalReason("");
          }
        }}
        maxWidth="sm"
        fullWidth
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            borderRadius: "10px",
          },
        }}
      >
        <DialogTitle 
          onClick={(e) => e.stopPropagation()}
          sx={{ padding: "24px" }}
        >
          Причина отклонения
        </DialogTitle>
        <DialogContent 
          onClick={(e) => e.stopPropagation()}
          sx={{ padding: "24px" }}
        >
          <textarea
            value={refusalReason}
            onChange={(e) => setRefusalReason(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            placeholder="Введите причину отклонения..."
            style={{
              width: "100%",
              height: "120px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "none",
            }}
          />
        </DialogContent>
        <DialogActions 
          onClick={(e) => e.stopPropagation()}
          sx={{ padding: "0 24px 24px 24px" }}
        >
          <Button
            onClick={() => {
              setShowRejectModal(false);
              setRefusalReason("");
            }}
            backgroundcolor={"#e0e0e0"}
          >
            Отмена
          </Button>
          <Button
            onClick={handleRejectConfirm}
            backgroundcolor={"var(--red)"}
            color={"#fff"}
            disabled={isLoading || mutationLoading || !refusalReason.trim()}
          >
            Отклонить
          </Button>
        </DialogActions>
      </Dialog>
    </Sidebar>
  );
}

export default ConfirmDriver;
