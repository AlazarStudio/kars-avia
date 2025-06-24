import React, { useEffect, useMemo, useRef, useState } from "react";
import classes from "./DraggableRequest.module.css";
import ReactDOM from "react-dom";
import { Box, Tooltip, Typography } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import { convertToDate, server } from "../../../../graphQL_requests";
import { differenceInMilliseconds, startOfMonth } from "date-fns";
import { ConstructionOutlined } from "@mui/icons-material";

// Функция для ограничения значения в диапазоне
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const DraggableRequest = ({
  requestId,
  checkRoomsType,
  isClick,
  setIsClick,
  request,
  hotelAccess,
  dayWidth,
  currentMonth,
  onUpdateRequest,
  position,
  allRequests,
  onOpenModal,
  isDraggingGlobal,
  user,
  toggleRequestSidebar,
}) => {
  // Настройка dnd-kit
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: request.id.toString(),
      data: {
        position: request.position,
        roomId: request.room?.id,
      },
    });

  const startDate = startOfMonth(currentMonth);
  const checkIn = new Date(`${request.checkInDate}T${request.checkInTime}`);
  const checkOut = new Date(`${request.checkOutDate}T${request.checkOutTime}`);

  // Рассчитываем смещения для позиционирования заявки
  const checkInOffset =
    (differenceInMilliseconds(checkIn, startDate) / (24 * 60 * 60 * 1000)) *
    dayWidth;
  const duration =
    (differenceInMilliseconds(checkOut, checkIn) / (24 * 60 * 60 * 1000)) *
    dayWidth;

  // Функция выбора цвета в зависимости от статуса заявки
  const getStatusColors = (status) => {
    switch (status) {
      case "Забронирован":
        return { backgroundColor: "#4caf50", borderColor: "#388e3c" };
      case "Продлен":
        return { backgroundColor: "#2196f3", borderColor: "#1976d2" };
      case "Сокращен":
        return { backgroundColor: "#f44336", borderColor: "#d32f2f" };
      case "Перенесен":
        return { backgroundColor: "#ff9800", borderColor: "#e9831a" };
      case "Ранний заезд":
        return { backgroundColor: "#9575cd", borderColor: "#865ecc" };
      case "Архив":
        return { backgroundColor: "#3b653d", borderColor: "#1b5e20" };
      case "Готов к архиву":
        return { backgroundColor: "#638ea4", borderColor: "#78909c" };
      default:
        return { backgroundColor: "#fff", borderColor: "#E4E4EF" };
    }
  };

  const { backgroundColor, borderColor } = getStatusColors(request.status);

  let showBlockRequest = 0.3;
  let showBlockReserve = 0.3;

  if (!checkRoomsType) {
    if (request.isRequest) {
      showBlockRequest = 1;
    }
  } else {
    if (!request.isRequest) {
      showBlockReserve = 1;
    }
  }

  // console.log(hotelAccess)

  // Анимация мерцания для заявки со статусом "Ожидает"
  const blinkAnimation = `
    @keyframes blinkBackground {
      0% { background-color: rgb(194, 194, 194); border: 1px solid rgb(175, 175, 175) }
      50% { background-color: #FCC737; border: 1px solid rgb(218, 172, 47) }
      100% { background-color: rgb(194, 194, 194); border: 1px solid rgb(175, 175, 175) }
    }
  `;

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = blinkAnimation;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Сохраняем исходное состояние заявки для обработки ресайза
  const originalRequestRef = useRef(null);
  const handleResizeStart = () => {
    originalRequestRef.current = { ...request };
  };
  const handleResizeEnd = (updatedRequest) => {
    onOpenModal(updatedRequest, originalRequestRef.current);
  };

  // Обновление заявки при изменении размера
  const handleResize = (type, deltaDays) => {
    const updatedRequest = { ...request };

    if (type === "start") {
      const newCheckIn = new Date(checkIn);
      newCheckIn.setDate(newCheckIn.getDate() + deltaDays);
      updatedRequest.checkInDate = newCheckIn.toISOString().split("T")[0];

      if (deltaDays < 0) {
        updatedRequest.status = "Ранний заезд";
      } else if (deltaDays > 0) {
        updatedRequest.status = "Сокращен";
      }
    } else if (type === "end") {
      const newCheckOut = new Date(checkOut);
      newCheckOut.setDate(newCheckOut.getDate() + deltaDays);
      updatedRequest.checkOutDate = newCheckOut.toISOString().split("T")[0];

      if (deltaDays > 0) {
        updatedRequest.status = "Продлен";
      } else if (deltaDays < 0) {
        updatedRequest.status = "Сокращен";
      }
    }

    // Проверка пересечения заявок
    if (isOverlap(updatedRequest)) {
      console.warn(
        "Изменение размера заявки недопустимо: пересечение с другой заявкой!"
      );
      return request;
    }

    onUpdateRequest(updatedRequest);
    return updatedRequest;
  };

  const isOverlap = (updatedRequest) => {
    const roomRequests = allRequests.filter(
      (req) => req.room?.id === updatedRequest.room?.id
    );

    return roomRequests.some((otherRequest) => {
      if (otherRequest.id === updatedRequest.id) return false;

      const otherCheckIn = new Date(
        `${otherRequest.checkInDate}T${otherRequest.checkInTime}`
      );
      const otherCheckOut = new Date(
        `${otherRequest.checkOutDate}T${otherRequest.checkOutTime}`
      );

      const isTimeOverlap = !(
        otherCheckOut <=
          new Date(
            `${updatedRequest.checkInDate}T${updatedRequest.checkInTime}`
          ) ||
        otherCheckIn >=
          new Date(
            `${updatedRequest.checkOutDate}T${updatedRequest.checkOutTime}`
          )
      );

      const isPositionConflict =
        otherRequest.position === updatedRequest.position;

      return isTimeOverlap && isPositionConflict;
    });
  };

  // Состояния и обработчики для тултипа
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [mouseIsMoving, setMouseIsMoving] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  // Константы для позиционирования тултипа
  const TOOLTIP_WIDTH = 370; // как указано в minWidth стилей
  const TOOLTIP_HEIGHT = 200; // ориентировочная высота тултипа, подберите при необходимости
  const OFFSET = 30; // отступ от курсора
  const MARGIN = 5; // отступ от краёв окна

  const handleMouseEnter = () => {
    setMouseIsMoving(false);
    if (!isDraggingGlobal) {
      setTooltipVisible(true);
    }
  };

  const handleMouseLeave = () => setTooltipVisible(false);

  const handleMouseDown = (e) => {
    setStartPosition({ x: e.clientX, y: e.clientY });
    setIsClick(true);
    setTooltipVisible(false);
  };

  // Обновляем позицию тултипа с учетом переворота (если места снизу недостаточно) и ограничений по экрану
  const handleMouseMove = (e) => {
    setMouseIsMoving(true);

    if (!isDraggingGlobal) {
      let rawX = e.clientX - TOOLTIP_WIDTH / 2; // Центрирование тултипа по оси X
      let rawY;
      // Если снизу от курсора места меньше, чем TOOLTIP_HEIGHT + OFFSET, показываем тултип над курсором
      if (window.innerHeight - e.clientY < TOOLTIP_HEIGHT + OFFSET) {
        rawY = e.clientY - TOOLTIP_HEIGHT - (OFFSET + 40);
      } else {
        rawY = e.clientY + OFFSET;
      }
      const x = clamp(rawX, 0, window.innerWidth - TOOLTIP_WIDTH - MARGIN);
      const y = clamp(rawY, 0, window.innerHeight - TOOLTIP_HEIGHT - MARGIN);
      setTooltipPosition({ x, y });
    } else {
      setTooltipVisible(false);
    }

    const deltaX = Math.abs(e.clientX - startPosition.x);
    const deltaY = Math.abs(e.clientY - startPosition.y);
    if (deltaX > 10 || deltaY > 10) {
      setIsClick(false);
    }
  };

  const handleMouseUp = (e) => {
    if (isClick) {
      toggleRequestSidebar && toggleRequestSidebar(request.requestID);
    }
  };

  const handleClick = (e) => {
    if (!isClick && !mouseIsMoving) {
      toggleRequestSidebar && toggleRequestSidebar(request.requestID);
    }
  };

  let styleToolTip = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  };

  // Основной стиль для отображения заявки
  const style = {
    position: request.room && request.room.id ? "absolute" : "relative",
    top: request.room && request.room.id ? `${position * 50 + 2}px` : "auto",
    left: request.room && request.room.id ? `${checkInOffset}px` : "auto",
    width: request.room && request.room.id ? `${duration}px` : "100%",
    minHeight: request.status === "Ожидает" ? "65px" : "45px",
    backgroundColor: backgroundColor,
    animation:
      requestId &&
      request.requestID === requestId &&
      request.status === "Ожидает"
        ? "blinkBackground 1s infinite"
        : "none",
    opacity: request.isRequest ? showBlockRequest : showBlockReserve,
    border: `1px solid ${borderColor}`,
    borderRadius: "3px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color:
      request.status === "Ожидает" && requestId !== request.requestID
        ? "#1A1A1A"
        : "#fff",
    fontSize: "12px",
    zIndex: isDragging ? 10 : 2,
    userSelect: "none",
    overflow: "hidden",
    cursor: isDragging ? "grabbing" : "grab",
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  // console.log(request.status);

  return (
    <>
      <Box sx={style}>
        {/* Левая ручка для изменения начала */}
        {request.status !== "Ожидает" &&
          request.status !== "Архив" &&
          request.isRequest &&
          showBlockRequest === 1 && (user?.hotelId && hotelAccess || !user?.hotelId) && (
            <Box
              onMouseDown={(e) => {
                const startX = e.clientX;
                let deltaDays = 0;
                handleResizeStart();

                const handleMouseMove = (event) => {
                  const deltaX = event.clientX - startX;
                  deltaDays = Math.round(deltaX / dayWidth);
                  if (deltaDays !== 0) {
                    handleResize("start", deltaDays);
                  }
                };

                const handleMouseUp = () => {
                  document.removeEventListener("mousemove", handleMouseMove);
                  document.removeEventListener("mouseup", handleMouseUp);
                  const updatedRequest = handleResize("start", deltaDays);
                  handleResizeEnd(updatedRequest);
                };

                document.addEventListener("mousemove", handleMouseMove);
                document.addEventListener("mouseup", handleMouseUp);
              }}
              sx={{
                width: "10px",
                height: "100%",
                cursor: "ew-resize",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "23px",
                userSelect: "none",
              }}
            >
              <img
                src="/drag-vertical.svg"
                alt=""
                style={{
                  pointerEvents: "none",
                  width: "100%",
                  height: "100%",
                  padding: "4px 0",
                  cursor: "ew-resize",
                  opacity: "0.5",
                }}
              />
            </Box>
          )}

        {/* Центральная область для перетаскивания */}
        {request.isRequest && showBlockRequest === 1 ? (
          <Box
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onPointerUp={handleClick}
            sx={{
              flex: 1,
              width: "calc(100% - 20px)",
              height: "100%",
              display: "flex",
              alignItems: "center",
              textAlign: "left",
              justifyContent: "left",
              // cursor: "grab",
              zIndex: 1,
              overflow: "hidden",
              padding: "0 5px",
            }}
          >
            {request.status === "Ожидает" && (
              <div
                style={{
                  paddingRight: "5px",
                  display: "flex",
                  alignItems: "center",
                  height: "100%",
                  borderRight: "1px solid #EAEAF3",
                }}
              >
                <img
                  src="/drag-vertical.svg"
                  alt=""
                  style={{
                    filter:
                    request.status === "Ожидает" &&
                    requestId !== request.requestID ? "brightness(0)" : null,
                    pointerEvents: "none",
                    // width: "100%",
                    // height: "100%",
                    height: "30px",
                    padding: "4px 0",
                    cursor: "ew-resize",
                    opacity: "0.5",
                  }}
                />
              </div>
            )}
            <div
              style={{
                padding: "0 12px 0 8px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "left",
                gap: "10px",
              }}
            >
              {request.airline && duration > 35 || request.status === "Ожидает" ? (
                <img
                  src={`${server}${
                    request.airline ? request.airline.images[0] : "null"
                  }`}
                  alt=""
                  style={{
                    height: request.status === "Ожидает" ? "30px" : "25px",
                    width: request.status === "Ожидает" ? "30px" : "25px",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : null}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {request.guest ? (
                  <p
                    className={
                      request?.status === "Ожидает" ? classes.text : null
                    }
                  >
                    {request.guest}{" "}
                    <span>
                      {String(request.guestPosition).split("(")[0].trim()}
                    </span>
                  </p>
                ) : (
                  "Предварительная бронь"
                )}
                {request.status === "Ожидает" && (
                  <>
                    <p
                      className={classes.text}
                      style={{
                        color:
                          request.status === "Ожидает" &&
                          requestId !== request.requestID
                            ? "var(--main-gray)"
                            : "#fff",
                        fontSize: "11px",
                      }}
                    >
                      Прибытие{" "}
                      <span className="blueText">
                        {convertToDate(request.checkInDate)}{" "}
                        {request.checkInTime}
                      </span>
                    </p>
                    <p
                      className={classes.text}
                      style={{
                        color:
                          request.status === "Ожидает" &&
                          requestId !== request.requestID
                            ? "var(--main-gray)"
                            : "#fff",
                        fontSize: "11px",
                      }}
                    >
                      Отъезд{" "}
                      <span className="blueText">
                        {convertToDate(request.checkOutDate)}{" "}
                        {request.checkOutTime}
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>
          </Box>
        ) : !request.isRequest && showBlockReserve === 1 ? (
          <Box
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            sx={{
              flex: 1,
              width: "calc(100% - 20px)",
              height: "35px",
              display: "flex",
              alignItems: "center",
              textAlign: "left",
              justifyContent: "left",
              // cursor: "grab",
              zIndex: 1,
              overflow: "hidden",
              padding: "0 5px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "left",
                gap: "5px",
              }}
            >
              {request.airline && duration > 25 ? (
                <img
                  src={`${server}${
                    request.airline ? request.airline.images[0] : "null"
                  }`}
                  alt=""
                  style={{
                    height: "25px",
                    width: "25px",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : null}
              <div
                style={{
                  width: "100%",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {request.guest}
              </div>
            </div>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              width: "calc(100% - 20px)",
              height: "35px",
              display: "flex",
              alignItems: "center",
              textAlign: "left",
              justifyContent: "left",
              // cursor: "grab",
              zIndex: 1,
              overflow: "hidden",
              padding: "0 5px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "left",
                gap: "5px",
              }}
            >
              {request.airline ? (
                <img
                  src={`${server}${
                    request.airline ? request.airline.images[0] : "null"
                  }`}
                  alt=""
                  style={{
                    height: "25px",
                    width: "25px",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : null}
              <div
                style={{
                  width: "100%",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {request.guest}
              </div>
            </div>
          </Box>
        )}

        {/* Правая ручка для изменения конца */}
        {request.status !== "Ожидает" &&
          request.status !== "Архив" &&
          request.isRequest &&
          showBlockRequest === 1 && (user?.hotelId && hotelAccess || !user?.hotelId) && (
            <Box
              onMouseDown={(e) => {
                const startX = e.clientX;
                let deltaDays = 0;
                handleResizeStart();

                const handleMouseMove = (event) => {
                  const deltaX = event.clientX - startX;
                  deltaDays = Math.round(deltaX / dayWidth);
                  if (deltaDays !== 0) {
                    handleResize("end", deltaDays);
                  }
                };

                const handleMouseUp = () => {
                  document.removeEventListener("mousemove", handleMouseMove);
                  document.removeEventListener("mouseup", handleMouseUp);
                  const updatedRequest = handleResize("end", deltaDays);
                  handleResizeEnd(updatedRequest);
                };

                document.addEventListener("mousemove", handleMouseMove);
                document.addEventListener("mouseup", handleMouseUp);
              }}
              sx={{
                width: "10px",
                height: "100%",
                cursor: "ew-resize",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "23px",
                userSelect: "none",
              }}
            >
              <img
                src="/drag-vertical.svg"
                alt=""
                style={{
                  pointerEvents: "none",
                  width: "100%",
                  height: "100%",
                  padding: "4px 0",
                  cursor: "ew-resize",
                  opacity: "0.5",
                }}
              />
            </Box>
          )}
      </Box>

      {tooltipVisible &&
        !isDraggingGlobal &&
        mouseIsMoving &&
        ReactDOM.createPortal(
          <Box
            sx={{
              position: "fixed",
              top: `${tooltipPosition.y}px`,
              left: `${tooltipPosition.x}px`,
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              padding: "8px",
              zIndex: 1000,
              pointerEvents: "none",
              minWidth: "370px",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            <Typography variant="body2">
              <div style={styleToolTip}>
                Авиакомпания: <b>{request.airline?.name}</b>
              </div>
            </Typography>
            <Typography variant="body2">
              <div style={styleToolTip}>
                № Заявки: <b>{request.requestNumber}</b>
              </div>
            </Typography>
            <Typography variant="body2">
              <div style={styleToolTip}>
                Заявка: <b>{request.isRequest ? "Квота" : "Резерв"}</b>
              </div>
            </Typography>
            {request.room?.name && (
              <Typography variant="body2">
                <div style={styleToolTip}>
                  Комната: <b>{request.room?.name}</b>
                </div>
              </Typography>
            )}
            <Typography variant="body2">
              <div style={styleToolTip}>
                Гость:{" "}
                <b>{request.guest ? request.guest : "Предварительная бронь"}</b>
              </div>
            </Typography>
            {request.guestPosition && (
              <Typography variant="body2">
                <div style={styleToolTip}>
                  Должность: <b>{request.guestPosition}</b>
                </div>
              </Typography>
            )}
            <Typography variant="body2">
              <div style={styleToolTip}>
                Статус: <b>{request.status}</b>
              </div>
            </Typography>
            <Typography variant="body2">
              <div style={styleToolTip}>
                Заселение:{" "}
                <b>
                  {convertToDate(request.checkInDate)} {request.checkInTime}
                </b>
              </div>
            </Typography>
            <Typography variant="body2">
              <div style={styleToolTip}>
                Выселение:{" "}
                <b>
                  {convertToDate(request.checkOutDate)} {request.checkOutTime}
                </b>
              </div>
            </Typography>
          </Box>,
          document.body
        )}
    </>
  );
};

export default DraggableRequest;

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import ReactDOM from 'react-dom'
// import { Box, Tooltip, Typography } from "@mui/material";
// import { useDraggable } from "@dnd-kit/core";
// import { convertToDate, server } from "../../../../graphQL_requests";
// import { differenceInMilliseconds, startOfMonth } from "date-fns";
// import { ConstructionOutlined } from "@mui/icons-material";

// const DraggableRequest = ({ requestId, checkRoomsType, isClick, setIsClick, request, dayWidth, currentMonth, onUpdateRequest, position, allRequests, onOpenModal, isDraggingGlobal, user, toggleRequestSidebar }) => {
//     const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
//         id: request.id.toString(),
//         data: {
//             position: request.position,
//             roomId: request.room?.id,
//         },
//     });

//     // console.log(request);

//     const startDate = startOfMonth(currentMonth);
//     const checkIn = new Date(`${request.checkInDate}T${request.checkInTime}`);
//     const checkOut = new Date(`${request.checkOutDate}T${request.checkOutTime}`);

//     const checkInOffset = (differenceInMilliseconds(checkIn, startDate) / (24 * 60 * 60 * 1000)) * dayWidth;
//     const duration = (differenceInMilliseconds(checkOut, checkIn) / (24 * 60 * 60 * 1000)) * dayWidth;

//     // const [checkInOffset, duration] = useMemo(() => {
//     //     const offset = differenceInMilliseconds(checkIn, startDate) / (24 * 60 * 60 * 1000) * dayWidth;
//     //     const dur = differenceInMilliseconds(checkOut, checkIn) / (24 * 60 * 60 * 1000) * dayWidth;
//     //     return [offset, dur];
//     //   }, [checkIn, checkOut, startDate, dayWidth]);

//     // console.log(duration);

//     const getStatusColors = (status) => {
//         switch (status) {
//             case "Забронирован":
//                 return { backgroundColor: "#4caf50", borderColor: "#388e3c" }; // Зелёный для "Забронирован"
//             case "Продлен":
//                 return { backgroundColor: "#2196f3", borderColor: "#1976d2" }; // Синий для "Продлен"
//             case "Сокращен":
//                 return { backgroundColor: "#f44336", borderColor: "#d32f2f" }; // Красный для "Сокращен"
//             case "Перенесен":
//                 return { backgroundColor: "#ff9800", borderColor: "#e9831a" }; // Красный для "Сокращен"
//             case "Ранний заезд":
//                 return { backgroundColor: "#9575cd", borderColor: "#865ecc" }; // Жёлтый
//             case "Архив":
//                 return { backgroundColor: "#3b653d", borderColor: "#1b5e20" }; // Тёмно-коричневый
//             case "Готов к архиву":
//                 return { backgroundColor: "#638ea4", borderColor: "#78909c" }; // Светло-серый с голубым оттенком
//             default:
//                 return { backgroundColor: "#9e9e9e", borderColor: "#757575" }; // Серый для остальных
//         }
//     };

//     const { backgroundColor, borderColor } = getStatusColors(request.status);

//     let showBlockRequest = 0.3
//     let showBlockReserve = 0.3

//     if (!checkRoomsType) {
//         if (request.isRequest) {
//             showBlockRequest = 1
//         }
//     } else {
//         if (!request.isRequest) {
//             showBlockReserve = 1
//         }
//     }

//     const blinkAnimation = `
//         @keyframes blinkBackground {
//             0% { background-color: rgb(194, 194, 194); border: 1px solid rgb(175, 175, 175) } /* Светло-голубой */
//             50% { background-color: #FCC737; border: 1px solid rgb(218, 172, 47) } /* Пастельно-голубой */
//             100% { background-color:rgb(194, 194, 194); border: 1px solid rgb(175, 175, 175) } /* Светло-голубой */
//         }
//     `;

//     // console.log(request);

//     const style = {
//         // position: request.room ? "absolute" : "relative", // Новые заявки позиционируются иначе
//         // top: request.room ? `${position * 50 + 2}px` : "auto",
//         // left: request.room ? `${checkInOffset}px` : "auto",
//         // width: request.room ? `${duration}px` : '100%',
//         position: request.room && request.room.id ? "absolute" : "relative", // Новые заявки позиционируются иначе
//         top: request.room && request.room.id ? `${position * 50 + 2}px` : "auto",
//         left: request.room && request.room.id ? `${checkInOffset}px` : "auto",
//         width: request.room && request.room.id ? `${duration}px` : '100%',
//         height: "45px",
//         backgroundColor: backgroundColor,
//         animation: requestId && request.requestID === requestId && request.status == "Ожидает"
//             ? "blinkBackground 1s infinite" // Добавляем анимацию, если ID совпадают
//             : "none", // Отключаем анимацию, если ID не совпадают
//         opacity: request.isRequest ? showBlockRequest : showBlockReserve,
//         border: `1px solid ${borderColor}`,
//         borderRadius: "3px",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "space-between",
//         color: "white",
//         fontSize: "11px",
//         zIndex: isDragging ? 10 : 2,
//         userSelect: "none",
//         overflow: "hidden",
//         cursor: isDragging ? "grabbing" : "grab",
//         transform: transform
//             ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
//             : undefined,
//     };

//     useEffect(() => {
//         const styleElement = document.createElement("style");
//         styleElement.textContent = blinkAnimation;
//         document.head.appendChild(styleElement);
//         return () => {
//             document.head.removeChild(styleElement);
//         };
//     }, []);

//     const originalRequestRef = useRef(null);

//     const handleResizeStart = () => {
//         // Сохраняем исходные данные синхронно
//         originalRequestRef.current = { ...request };
//     };

//     const handleResizeEnd = (updatedRequest) => {
//         // Передаём обновлённую заявку в модальное окно
//         onOpenModal(updatedRequest, originalRequestRef.current);
//     }

//     const handleResize = (type, deltaDays) => {
//         const updatedRequest = { ...request };

//         // console.log(updatedRequest);

//         if (type === "start") {
//             const newCheckIn = new Date(checkIn);
//             newCheckIn.setDate(newCheckIn.getDate() + deltaDays);
//             updatedRequest.checkInDate = newCheckIn.toISOString().split("T")[0];

//             // Проверяем, если дата заезда сдвигается позже - статус "Сокращен"
//             if (deltaDays < 0) {
//                 updatedRequest.status = "Ранний заезд";
//             } else if (deltaDays > 0) {
//                 updatedRequest.status = "Сокращен";
//             }
//         } else if (type === "end") {
//             const newCheckOut = new Date(checkOut);
//             newCheckOut.setDate(newCheckOut.getDate() + deltaDays);
//             updatedRequest.checkOutDate = newCheckOut.toISOString().split("T")[0];

//             // Если дата выезда увеличивается - статус "Продлен"
//             if (deltaDays > 0) {
//                 updatedRequest.status = "Продлен";
//             } else if (deltaDays < 0) {
//                 updatedRequest.status = "Сокращен";
//             }
//         }

//         // Проверяем пересечения
//         if (isOverlap(updatedRequest)) {
//             console.warn("Изменение размера заявки недопустимо: пересечение с другой заявкой!");
//             return request; // Возвращаем исходную заявку, если есть пересечение
//         }

//         onUpdateRequest(updatedRequest);
//         return updatedRequest;
//     };

//     // console.log(allRequests.map((item) => item.room));

//     const isOverlap = (updatedRequest) => {
//         const roomRequests = allRequests.filter((req) => req.room?.id === updatedRequest.room?.id);

//         // console.log(updatedRequest);

//         // Проверяем пересечения с каждой заявкой в той же комнате
//         return roomRequests.some((otherRequest) => {
//             if (otherRequest.id === updatedRequest.id) return false;

//             const otherCheckIn = new Date(`${otherRequest.checkInDate}T${otherRequest.checkInTime}`);
//             const otherCheckOut = new Date(`${otherRequest.checkOutDate}T${otherRequest.checkOutTime}`);

//             const isTimeOverlap =
//                 !(
//                     otherCheckOut <= new Date(`${updatedRequest.checkInDate}T${updatedRequest.checkInTime}`) ||
//                     otherCheckIn >= new Date(`${updatedRequest.checkOutDate}T${updatedRequest.checkOutTime}`)
//                 );

//             const isPositionConflict = otherRequest.position === updatedRequest.position;

//             return isTimeOverlap && isPositionConflict;
//         });
//     };

//     const [tooltipVisible, setTooltipVisible] = useState(false);
//     const [mouseIsMoving, setMouseIsMoving] = useState(false);
//     const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

//     const handleMouseEnter = () => {
//         setMouseIsMoving(false)

//         if (!isDraggingGlobal) {
//             setTooltipVisible(true)
//         };
//     };

//     const handleMouseLeave = () => setTooltipVisible(false);

//     const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
//     // const [isClick, setIsClick] = useState(true);

//     const handleMouseDown = (e) => {
//         setStartPosition({ x: e.clientX, y: e.clientY });
//         setIsClick(true);
//         setTooltipVisible(false);
//     };

//     const handleMouseMove = (e) => {
//         setMouseIsMoving(true)

//         if (!isDraggingGlobal) {
//             setTooltipPosition({ x: e.clientX - 350 / 2, y: e.clientY + 10 });
//         } else {
//             setTooltipVisible(false);
//         }

//         const deltaX = Math.abs(e.clientX - startPosition.x);
//         const deltaY = Math.abs(e.clientY - startPosition.y);

//         if (deltaX > 10 || deltaY > 10) {
//             setIsClick(false);
//         }
//     };

//     const handleMouseUp = (e) => {
//         if (isClick) {
//             toggleRequestSidebar && toggleRequestSidebar(request.requestID);
//         }
//     };

//     const handleClick = (e) => {
//         // if (!isClick) {
//         if (!isClick && !mouseIsMoving) {
//             toggleRequestSidebar && toggleRequestSidebar(request.requestID);
//         }
//     };

//     let styleToolTip = {
//         display: 'flex',
//         justifyContent: 'space-between',
//         fontSize: '14px',
//     }

//     // console.log(request.guest === "Иванов Иван Иванович" ? request : null);

//     return (
//         <>
//             <Box sx={style}>
//                 {/* Левая ручка для изменения начала */}
//                 {/* {user != 'HOTELADMIN' && request.status != 'Ожидает' && request.status != 'Архив' && request.isRequest && showBlockRequest == 1 && */}
//                 {request.status != 'Ожидает' && request.status != 'Архив' && request.isRequest && showBlockRequest == 1 &&
//                     <Box
//                         onMouseDown={(e) => {
//                             const startX = e.clientX;
//                             let deltaDays = 0;

//                             handleResizeStart();

//                             const handleMouseMove = (event) => {
//                                 const deltaX = event.clientX - startX;
//                                 deltaDays = Math.round(deltaX / dayWidth); // Обновляем deltaDays
//                                 if (deltaDays !== 0) {
//                                     handleResize("start", deltaDays);
//                                 }
//                             };

//                             const handleMouseUp = () => {
//                                 document.removeEventListener("mousemove", handleMouseMove);
//                                 document.removeEventListener("mouseup", handleMouseUp);

//                                 // Передаём deltaDays в handleResize для обновления заявки
//                                 const updatedRequest = handleResize("start", deltaDays);
//                                 handleResizeEnd(updatedRequest); // Передаём обновлённую заявку
//                             };

//                             document.addEventListener("mousemove", handleMouseMove);
//                             document.addEventListener("mouseup", handleMouseUp);
//                         }}
//                         sx={{
//                             width: "10px",
//                             height: "100%",
//                             cursor: "ew-resize",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             height: '23px',
//                             userSelect: 'none'
//                         }}
//                     >
//                         <img src="/drag-vertical.svg" alt="" style={{ pointerEvents: 'none', width: '100%', height: '100%', padding: '4px 0', cursor: "ew-resize", opacity: '0.5' }} />
//                     </Box>
//                 }

//                 {/* Центральная область для перетаскивания */}
//                 {request.isRequest && showBlockRequest == 1 ?
//                     <Box
//                         ref={setNodeRef}
//                         {...listeners}
//                         {...attributes}
//                         onMouseEnter={handleMouseEnter}
//                         onMouseLeave={handleMouseLeave}
//                         onMouseDown={handleMouseDown} // Отслеживаем начальную позицию
//                         onMouseMove={handleMouseMove} // Проверяем движение мыши
//                         // onMouseUp={handleMouseUp}
//                         onPointerUp={handleClick}
//                         sx={{
//                             flex: 1,
//                             width: 'calc(100% - 20px)',
//                             height: "35px",
//                             display: "flex",
//                             alignItems: "center",
//                             textAlign: "center",
//                             justifyContent: "left",
//                             cursor: "grab",
//                             zIndex: 1,
//                             overflow: 'hidden',
//                             padding: '0 5px'
//                         }}
//                     >
//                         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'left', gap: '5px' }}>
//                             {request.airline && (duration > 35) ? (
//                                 <img
//                                     src={`${server}${request.airline ? request.airline.images[0] : 'null'}`}
//                                     alt=""
//                                     style={{
//                                             height: '25px',
//                                             width: '25px',
//                                             objectFit:'cover',
//                                             borderRadius: '50%'
//                                         }}
//                                 />
//                             ) : null}
//                             <div style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
//                                 {/* { request.guest ? `${request?.guestPosition ? request.guestPosition?.split('(')[0]?.trim() : ''} ${request.guest}` : "Предварительная бронь"} */}
//                                 {
//   request.guest
//     ? `${String(request.guestPosition).split('(')[0]?.trim()} ${request.guest}`
//     : "Предварительная бронь"
// }

// {/* {request.guest
//     ? `${String(request.guestPosition ? request.guestPosition : " ").split('(')[0]?.trim()} ${request.guest}`
//     : "Предварительная бронь"
// } */}

//                             </div>
//                         </div>
//                     </Box>
//                     :
//                     !request.isRequest && showBlockReserve == 1 ?
//                         <Box
//                             ref={setNodeRef}
//                             {...listeners}
//                             {...attributes}
//                             onMouseEnter={handleMouseEnter}
//                             onMouseLeave={handleMouseLeave}
//                             onMouseDown={handleMouseDown} // Отслеживаем начальную позицию
//                             onMouseMove={handleMouseMove} // Проверяем движение мыши
//                             onMouseUp={handleMouseUp}
//                             sx={{
//                                 flex: 1,
//                                 width: 'calc(100% - 20px)',
//                                 height: "35px",
//                                 display: "flex",
//                                 alignItems: "center",
//                                 textAlign: "center",
//                                 justifyContent: "left",
//                                 cursor: "grab",
//                                 zIndex: 1,
//                                 overflow: 'hidden',
//                                 padding: '0 5px'
//                             }}
//                         >
//                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'left', gap: '5px' }}>
//                             {request.airline && (duration > 25) ? (
//                                 <img
//                                     src={`${server}${request.airline ? request.airline.images[0] : 'null'}`}
//                                     alt=""
//                                     style={{
//                                         height: '25px',
//                                         width: '25px',
//                                         objectFit:'cover',
//                                         borderRadius: '50%'
//                                     }}
//                                 />
//                             ): null}
//                                 <div style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
//                                     {request.guest}
//                                 </div>
//                             </div>
//                         </Box>
//                         :
//                         <Box
//                             sx={{
//                                 flex: 1,
//                                 width: 'calc(100% - 20px)',
//                                 height: "35px",
//                                 display: "flex",
//                                 alignItems: "center",
//                                 textAlign: "center",
//                                 justifyContent: "left",
//                                 cursor: "grab",
//                                 zIndex: 1,
//                                 overflow: 'hidden',
//                                 padding: '0 5px'
//                             }}
//                         >
//                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'left', gap: '5px' }}>
//                                 {request.airline ? (
//                                     <img
//                                         src={`${server}${request.airline ? request.airline.images[0] : 'null'}`}
//                                         alt=""
//                                         style={{
//                                             height: '25px',
//                                             width: '25px',
//                                             objectFit:'cover',
//                                             borderRadius: '50%'
//                                         }}
//                                     />
//                                 ) : null}
//                                 <div style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
//                                     {request.guest}
//                                 </div>
//                             </div>
//                         </Box>
//                 }

//                 {/* Правая ручка для изменения конца */}
//                 {/* {user != 'HOTELADMIN' && request.status != 'Ожидает' && request.status != 'Архив' && request.isRequest && showBlockRequest == 1 && */}
//                 { request.status != 'Ожидает' && request.status != 'Архив' && request.isRequest && showBlockRequest == 1 &&
//                     <Box
//                         onMouseDown={(e) => {
//                             const startX = e.clientX;
//                             let deltaDays = 0;

//                             handleResizeStart();

//                             const handleMouseMove = (event) => {
//                                 const deltaX = event.clientX - startX;
//                                 deltaDays = Math.round(deltaX / dayWidth);
//                                 if (deltaDays !== 0) {
//                                     handleResize("end", deltaDays);
//                                 }
//                             };

//                             const handleMouseUp = () => {
//                                 document.removeEventListener("mousemove", handleMouseMove);
//                                 document.removeEventListener("mouseup", handleMouseUp);

//                                 // Получаем обновлённую заявку
//                                 const updatedRequest = handleResize("end", deltaDays);
//                                 handleResizeEnd(updatedRequest);
//                             };

//                             document.addEventListener("mousemove", handleMouseMove);
//                             document.addEventListener("mouseup", handleMouseUp);
//                         }}
//                         sx={{
//                             width: "10px",
//                             height: "100%",
//                             cursor: "ew-resize",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             height: '23px',
//                             userSelect: 'none'
//                         }}
//                     >
//                         <img src="/drag-vertical.svg" alt="" style={{ pointerEvents: 'none', width: '100%', height: '100%', padding: '4px 0', cursor: "ew-resize", opacity: '0.5' }} />
//                     </Box>
//                 }
//             </Box >

//             {tooltipVisible && !isDraggingGlobal && mouseIsMoving && (
//                 ReactDOM.createPortal(
//                     <Box
//                     sx={{
//                         position: "fixed",
//                         top: `${tooltipPosition.y}px`,
//                         left: `${tooltipPosition.x}px`,
//                         backgroundColor: "white",
//                         border: "1px solid #ccc",
//                         borderRadius: "4px",
//                         boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
//                         padding: "8px",
//                         zIndex: 1000,
//                         pointerEvents: "none",
//                         minWidth: '370px',
//                         display: 'flex',
//                         flexDirection: 'column',
//                         gap: '5px'
//                     }}
//                 >
//                     <Typography variant="body2">
//                         <div style={styleToolTip}> Авиакомпания: <b>{request.airline?.name}</b></div>
//                     </Typography>
//                     <Typography variant="body2">
//                         <div style={styleToolTip}> № Заявки: <b>{request.requestNumber}</b></div>
//                     </Typography>
//                     <Typography variant="body2">
//                         <div style={styleToolTip}> Заявка: <b>{request.isRequest ? 'Квота' : 'Резерв'}</b></div>
//                     </Typography>
//                     {/* <Typography variant="body2">
//                         <div style={styleToolTip}> Бронирование: <b>{request.id}</b></div>
//                     </Typography> */}
//                     {request.room?.name &&
//                         <Typography variant="body2">
//                             <div style={styleToolTip}> Комната: <b>{request.room?.name}</b></div>
//                         </Typography>
//                     }
//                     <Typography variant="body2">
//                         <div style={styleToolTip}> Гость: <b>{request.guest ? request.guest : "Предварительная бронь"}</b></div>
//                     </Typography>
//                     {request.guestPosition ? (
//                         <Typography variant="body2">
//                             <div style={styleToolTip}> Должность: <b>{request.guestPosition}</b></div>
//                         </Typography>
//                     ): null}

//                     <Typography variant="body2">
//                         <div style={styleToolTip}> Статус: <b>{request.status}</b></div>
//                     </Typography>
//                     <Typography variant="body2">
//                         <div style={styleToolTip}> Заселение: <b>{convertToDate(request.checkInDate)} {request.checkInTime}</b></div>
//                     </Typography>
//                     <Typography variant="body2">
//                         <div style={styleToolTip}> Выселение: <b>{convertToDate(request.checkOutDate)} {request.checkOutTime}</b></div>
//                     </Typography>
//                 </Box>,
//                     document.body
//                 )

//             )
//             }
//         </>
//     );
// };

// export default DraggableRequest;
