import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./ConfirmDriver.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  getCookie,
  getMediaUrl,
  UPDATE_DRIVER_MUTATION,
  convertToDate,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Modal, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import DownloadIcon from "@mui/icons-material/Download";

function ConfirmDriver({
  show,
  onClose,
  confirm,
  chooseObject,
  updateDriver,
  addNotification,
  disAdmin, // для определения контекста: true - страница водителей, false/undefined - страница организации
  organizationId, // ID организации для страницы организации
  canAccept = true, // право принять/отклонить водителя
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
  const [localDriverStatus, setLocalDriverStatus] = useState(null);

  // Состояния для модального окна изображения
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  useEffect(() => {
    if (chooseObject) {
      setShowIMG(chooseObject?.documents?.driverPhoto);
      setLocalDriverStatus(chooseObject?.registrationStatus);
    }
  }, [chooseObject]);

  const closeButton = useCallback(() => {
    setRefusalReason("");
    setShowRejectModal(false);
    onClose();
  }, [onClose]);

  // Функции для работы с модальным окном изображения
  const openImageModal = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setImageModalOpen(true);
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(getMediaUrl(selectedImageUrl));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = selectedImageUrl.split("/").pop() || "image";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка при скачивании изображения:", error);
      // Fallback: открываем в новой вкладке, если скачивание не удалось
      window.open(selectedImageUrl, "_blank");
    }
  };

  // Обработка зума колесиком мыши
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setImageZoom((prev) => Math.max(0.5, Math.min(5, prev + delta)));
  };

  // Обработка перетаскивания изображения
  const handleMouseDown = (e) => {
    if (imageZoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && imageZoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (imageModalOpen) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [imageModalOpen, isDragging, dragStart, imageZoom]);

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

      // Обновляем локальный статус сразу
      setLocalDriverStatus("APPROVED");

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
      // Если это страница водителей (disAdmin === true) - работаем с registrationStatus
      // Если страница организации (disAdmin !== true) - удаляем связь с организацией (organizationId: null)
      const input = disAdmin === true
        ? {
          registrationStatus: "REJECTED",
          refusalReason: refusalReason.trim(),
        }
        : {
          organizationId: null,
          refusalReason: refusalReason.trim(),
        };

      await updateDriverMutation({
        variables: {
          updateDriverId: chooseObject.id,
          input,
        },
      });

      // Обновляем локальный статус сразу
      if (disAdmin === true) {
        setLocalDriverStatus("REJECTED");
      }

      if (updateDriver) {
        updateDriver(
          {
            ...chooseObject,
            ...(disAdmin === true
              ? { registrationStatus: "REJECTED" }
              : {
                organizationId: null,
                organization: null,
                organizationConfirmed: false
              }),
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
      // Не закрываем sidebar, если открыты модальные окна
      if (showRejectModal || imageModalOpen) {
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

    if (show && !showRejectModal && !imageModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, showRejectModal, imageModalOpen, closeButton]);

  const getStatusText = (status) => {
    switch (status) {
      case "APPROVED":
        return "Подтвержден";
      case "PENDING":
        return "На рассмотрении";
      case "REJECTED":
        return "Отклонен";
      default:
        return status || "—";
    }
  };

  const formatRegistrationDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const formattedDate = convertToDate(dateString);
    const formattedTime = convertToDate(dateString, true);
    const months = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year} г., ${formattedTime}`;
  };

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Данные водителя</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>
      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle} style={{ height: "calc(100% - 90px - 68px)" }}>
            <div className={classes.requestData}>
              {/* Секция "Водитель" */}
              <div className={classes.section}>
                <div className={classes.sectionTitle}>Водитель</div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Имя</div>
                  <div className={classes.requestDataInfo_desc}>
                    {chooseObject?.name || "—"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Телефон</div>
                  <div className={classes.requestDataInfo_desc}>
                    {chooseObject?.number || "—"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Email</div>
                  <div className={classes.requestDataInfo_desc}>
                    {chooseObject?.email || "—"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Статус анкеты</div>
                  <div className={classes.requestDataInfo_desc}>
                    {getStatusText(chooseObject?.registrationStatus)}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Рейтинг</div>
                  <div className={classes.requestDataInfo_desc}>
                    {chooseObject?.rating || "—"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Дата регистрации</div>
                  <div className={classes.requestDataInfo_desc}>
                    {formatRegistrationDate(chooseObject?.createdAt)}
                  </div>
                </div>
              </div>

              {/* Секция "Автомобиль" */}
              <div className={classes.section}>
                <div className={classes.sectionTitle}>Автомобиль</div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Модель</div>
                  <div className={classes.requestDataInfo_desc}>
                    {chooseObject?.car || "—"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Госномер</div>
                  <div className={classes.requestDataInfo_desc}>
                    {chooseObject?.vehicleNumber || "—"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Доп. оборудование</div>
                  <div className={classes.requestDataInfo_desc}>
                    {chooseObject?.extraEquipment || "—"}
                  </div>
                </div>
              </div>

              {/* Секция "Организация" */}
              <div className={classes.section}>
                <div className={classes.sectionTitle}>Организация</div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Организация</div>
                  <div className={classes.requestDataInfo_desc}>
                    {chooseObject?.organization?.name || "—"}
                  </div>
                </div>
                <div className={classes.requestDataInfo}>
                  <div className={classes.requestDataInfo_title}>Подтверждена организацией</div>
                  <div className={classes.requestDataInfo_desc}>
                    {chooseObject?.organizationConfirmed ? "Да" : "Нет"}
                  </div>
                </div>
              </div>

              {/* Секция "Документы" */}
              <div className={classes.section}>
                <div className={classes.sectionTitle}>Документы</div>

                {chooseObject?.documents?.driverPhoto && (
                  <>
                    <label>Фото водителя</label>
                    <div className={classes.imageList}>
                      <div className={classes.imageItem}>
                        <img
                          src={getMediaUrl(chooseObject.documents.driverPhoto)}
                          alt="Фото водителя"
                          onClick={() => openImageModal(getMediaUrl(chooseObject.documents.driverPhoto))}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {chooseObject?.documents?.licensePhoto && chooseObject.documents.licensePhoto.length > 0 && (
                  <>
                    <label>Водительское удостоверение</label>
                    <div className={classes.imageList}>
                      {chooseObject.documents.licensePhoto.map((image, index) => (
                        <div key={`license-${index}`} className={classes.imageItem}>
                          <img
                            src={getMediaUrl(image)}
                            alt={`Водительское удостоверение ${index + 1}`}
                            onClick={() => openImageModal(getMediaUrl(image))}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {chooseObject?.documents?.stsPhoto && chooseObject.documents.stsPhoto.length > 0 && (
                  <>
                    <label>СТС</label>
                    <div className={classes.imageList}>
                      {chooseObject.documents.stsPhoto.map((image, index) => (
                        <div key={`sts-${index}`} className={classes.imageItem}>
                          <img
                            src={getMediaUrl(image)}
                            alt={`СТС ${index + 1}`}
                            onClick={() => openImageModal(getMediaUrl(image))}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {chooseObject?.documents?.ptsPhoto && chooseObject.documents.ptsPhoto.length > 0 && (
                  <>
                    <label>ПТС</label>
                    <div className={classes.imageList}>
                      {chooseObject.documents.ptsPhoto.map((image, index) => (
                        <div key={`pts-${index}`} className={classes.imageItem}>
                          <img
                            src={getMediaUrl(image)}
                            alt={`ПТС ${index + 1}`}
                            onClick={() => openImageModal(getMediaUrl(image))}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {chooseObject?.documents?.osagoPhoto && chooseObject.documents.osagoPhoto.length > 0 && (
                  <>
                    <label>ОСАГО</label>
                    <div className={classes.imageList}>
                      {chooseObject.documents.osagoPhoto.map((image, index) => (
                        <div key={`osago-${index}`} className={classes.imageItem}>
                          <img
                            src={getMediaUrl(image)}
                            alt={`ОСАГО ${index + 1}`}
                            onClick={() => openImageModal(getMediaUrl(image))}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {chooseObject?.documents?.carPhotos && chooseObject.documents.carPhotos.length > 0 && (
                  <>
                    <label>Фото машины</label>
                    <div className={classes.imageList}>
                      {chooseObject.documents.carPhotos.map((image, index) => (
                        <div key={`car-${index}`} className={classes.imageItem}>
                          <img
                            src={getMediaUrl(image)}
                            alt={`Фото машины ${index + 1}`}
                            onClick={() => openImageModal(getMediaUrl(image))}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {canAccept && (confirm || (organizationId && chooseObject?.organization)) && (
            <div className={classes.requestButton}>
              <Button
                onClick={handleReject}
                backgroundcolor={"var(--red)"}
                disabled={isLoading || mutationLoading}
              >
                Отклонить
              </Button>

              {confirm && canAccept && localDriverStatus !== "APPROVED" && (
                <Button
                  onClick={handleApprove}
                  backgroundcolor={"#3CBC6726"}
                  color={"#3B6C54"}
                  disabled={isLoading || mutationLoading}
                >
                  Принять
                </Button>
              )}
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

      {/* Модальное окно для просмотра изображения с зумом */}
      <Modal
        open={imageModalOpen}
        onClose={closeImageModal}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "90vw",
            height: "90vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            outline: "none",
          }}
          onWheel={handleWheel}
        >
          {/* Кнопка закрытия */}
          <IconButton
            onClick={closeImageModal}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10,
              color: "white",
              backgroundColor: "rgba(0,0,0,0.5)",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.7)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Кнопки управления зумом */}
          {/* <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 10,
              display: "flex",
              // flexDirection: "column",
              gap: 1,
            }}
          >
            <IconButton
              onClick={handleZoomIn}
              disabled={imageZoom >= 5}
              sx={{
                color: "white",
                backgroundColor: "rgba(0,0,0,0.5)",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.7)",
                },
                "&:disabled": {
                  backgroundColor: "rgba(0,0,0,0.3)",
                  color: "rgba(255,255,255,0.5)",
                },
              }}
            >
              <ZoomInIcon />
            </IconButton>
            <IconButton
              onClick={handleZoomOut}
              disabled={imageZoom <= 0.5}
              sx={{
                color: "white",
                backgroundColor: "rgba(0,0,0,0.5)",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.7)",
                },
                "&:disabled": {
                  backgroundColor: "rgba(0,0,0,0.3)",
                  color: "rgba(255,255,255,0.5)",
                },
              }}
            >
              <ZoomOutIcon />
            </IconButton>
            {imageZoom !== 1 && (
              <IconButton
                onClick={handleResetZoom}
                sx={{
                  color: "white",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.7)",
                  },
                  fontSize: "12px",
                  padding: "8px",
                }}
              >
                1:1
              </IconButton>
            )}
          </Box> */}

          {/* Кнопка скачивания */}
          <IconButton
            onClick={handleDownload}
            sx={{
              position: "absolute",
              top: 16,
              right: 64,
              zIndex: 10,
              color: "white",
              backgroundColor: "rgba(0,0,0,0.5)",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.7)",
              },
            }}
          >
            <DownloadIcon />
          </IconButton>

          {/* Изображение */}
          <img
            ref={imageRef}
            src={selectedImageUrl}
            alt="Увеличенное изображение"
            onMouseDown={handleMouseDown}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
              cursor: imageZoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              transition: isDragging ? "none" : "transform 0.1s ease-out",
              userSelect: "none",
            }}
            draggable={false}
          />
        </Box>
      </Modal>
    </Sidebar>
  );
}

export default ConfirmDriver;
