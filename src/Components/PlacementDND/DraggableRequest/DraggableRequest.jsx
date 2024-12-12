import React, { useRef, useState } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import { convertToDate, server } from "../../../../graphQL_requests";
import { differenceInMilliseconds, startOfMonth } from "date-fns";
import { ConstructionOutlined } from "@mui/icons-material";

const DraggableRequest = ({ checkRoomsType, isClick, setIsClick, request, dayWidth, currentMonth, onUpdateRequest, position, allRequests, onOpenModal, isDraggingGlobal, userRole, toggleRequestSidebar }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: request.id.toString(),
        data: {
            position: request.position,
            roomId: request.room,
        },
    });

    const startDate = startOfMonth(currentMonth);
    const checkIn = new Date(`${request.checkInDate}T${request.checkInTime}`);
    const checkOut = new Date(`${request.checkOutDate}T${request.checkOutTime}`);

    const checkInOffset = (differenceInMilliseconds(checkIn, startDate) / (24 * 60 * 60 * 1000)) * dayWidth;
    const duration = (differenceInMilliseconds(checkOut, checkIn) / (24 * 60 * 60 * 1000)) * dayWidth;

    const getStatusColors = (status) => {
        switch (status) {
            case "Забронирован":
                return { backgroundColor: "#4caf50", borderColor: "#388e3c" }; // Зелёный для "Забронирован"
            case "Продлен":
                return { backgroundColor: "#2196f3", borderColor: "#1976d2" }; // Синий для "Продлен"
            case "Сокращен":
                return { backgroundColor: "#f44336", borderColor: "#d32f2f" }; // Красный для "Сокращен"
            case "Перенесен":
                return { backgroundColor: "#ff9800", borderColor: "#e9831a" }; // Красный для "Сокращен"
            case "Ранний заезд":
                return { backgroundColor: "#9575cd", borderColor: "#865ecc" }; // Жёлтый
            default:
                return { backgroundColor: "#9e9e9e", borderColor: "#757575" }; // Серый для остальных
        }
    };

    const { backgroundColor, borderColor } = getStatusColors(request.status);

    let showBlockRequest = 0.3
    let showBlockReserve = 0.3

    if (!checkRoomsType) {
        if (request.isRequest) {
            showBlockRequest = 1
        }
    } else {
        if (!request.isRequest) {
            showBlockReserve = 1
        }
    }

    const style = {
        position: request.room ? "absolute" : "relative", // Новые заявки позиционируются иначе
        top: request.room ? `${position * 50 + 2}px` : "auto",
        left: request.room ? `${checkInOffset}px` : "auto",
        width: request.room ? `${duration}px` : '100%',
        height: "45px",
        backgroundColor: backgroundColor,
        opacity: request.isRequest ? showBlockRequest : showBlockReserve,
        border: `1px solid ${borderColor}`,
        borderRadius: "3px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "white",
        fontSize: "11px",
        zIndex: isDragging ? 10 : 2,
        userSelect: "none",
        cursor: isDragging ? "grabbing" : "grab",
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
    };


    const originalRequestRef = useRef(null);

    const handleResizeStart = () => {
        // Сохраняем исходные данные синхронно
        originalRequestRef.current = { ...request };
    };

    const handleResizeEnd = (updatedRequest) => {
        // Передаём обновлённую заявку в модальное окно
        onOpenModal(updatedRequest, originalRequestRef.current);
    }

    const handleResize = (type, deltaDays) => {
        const updatedRequest = { ...request };

        if (type === "start") {
            const newCheckIn = new Date(checkIn);
            newCheckIn.setDate(newCheckIn.getDate() + deltaDays);
            updatedRequest.checkInDate = newCheckIn.toISOString().split("T")[0];

            // Проверяем, если дата заезда сдвигается позже - статус "Сокращен"
            if (deltaDays < 0) {
                updatedRequest.status = "Ранний заезд";
            } else if (deltaDays > 0) {
                updatedRequest.status = "Сокращен";
            }
        } else if (type === "end") {
            const newCheckOut = new Date(checkOut);
            newCheckOut.setDate(newCheckOut.getDate() + deltaDays);
            updatedRequest.checkOutDate = newCheckOut.toISOString().split("T")[0];

            // Если дата выезда увеличивается - статус "Продлен"
            if (deltaDays > 0) {
                updatedRequest.status = "Продлен";
            } else if (deltaDays < 0) {
                updatedRequest.status = "Сокращен";
            }
        }

        // Проверяем пересечения
        if (isOverlap(updatedRequest)) {
            console.warn("Изменение размера заявки недопустимо: пересечение с другой заявкой!");
            return request; // Возвращаем исходную заявку, если есть пересечение
        }

        onUpdateRequest(updatedRequest);
        return updatedRequest;
    };


    const isOverlap = (updatedRequest) => {
        const roomRequests = allRequests.filter((req) => req.room === updatedRequest.room);

        // Проверяем пересечения с каждой заявкой в той же комнате
        return roomRequests.some((otherRequest) => {
            if (otherRequest.id === updatedRequest.id) return false;

            const otherCheckIn = new Date(`${otherRequest.checkInDate}T${otherRequest.checkInTime}`);
            const otherCheckOut = new Date(`${otherRequest.checkOutDate}T${otherRequest.checkOutTime}`);

            const isTimeOverlap =
                !(
                    otherCheckOut <= new Date(`${updatedRequest.checkInDate}T${updatedRequest.checkInTime}`) ||
                    otherCheckIn >= new Date(`${updatedRequest.checkOutDate}T${updatedRequest.checkOutTime}`)
                );

            const isPositionConflict = otherRequest.position === updatedRequest.position;

            return isTimeOverlap && isPositionConflict;
        });
    };

    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [mouseIsMoving, setMouseIsMoving] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const handleMouseEnter = () => {
        setMouseIsMoving(false)

        if (!isDraggingGlobal) {
            setTooltipVisible(true)
        };
    };

    const handleMouseLeave = () => setTooltipVisible(false);

    const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
    // const [isClick, setIsClick] = useState(true);

    const handleMouseDown = (e) => {
        setStartPosition({ x: e.clientX, y: e.clientY });
        setIsClick(true);
        setTooltipVisible(false);
    };

    const handleMouseMove = (e) => {
        setMouseIsMoving(true)

        if (!isDraggingGlobal) {
            setTooltipPosition({ x: e.clientX - 350 / 2, y: e.clientY + 10 });
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

    let styleToolTip = {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
    }

    return (
        <>
            <Box sx={style}>
                {/* Левая ручка для изменения начала */}
                {userRole != 'HOTELADMIN' && request.status != 'Ожидает' && request.isRequest && showBlockRequest == 1 &&
                    <Box
                        onMouseDown={(e) => {
                            const startX = e.clientX;
                            let deltaDays = 0;

                            handleResizeStart();

                            const handleMouseMove = (event) => {
                                const deltaX = event.clientX - startX;
                                deltaDays = Math.round(deltaX / dayWidth); // Обновляем deltaDays
                                if (deltaDays !== 0) {
                                    handleResize("start", deltaDays);
                                }
                            };

                            const handleMouseUp = () => {
                                document.removeEventListener("mousemove", handleMouseMove);
                                document.removeEventListener("mouseup", handleMouseUp);

                                // Передаём deltaDays в handleResize для обновления заявки
                                const updatedRequest = handleResize("start", deltaDays);
                                handleResizeEnd(updatedRequest); // Передаём обновлённую заявку
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
                            height: '23px',
                            userSelect: 'none'
                        }}
                    >
                        <img src="/drag-vertical.svg" alt="" style={{ pointerEvents: 'none', width: '100%', height: '100%', padding: '4px 0', cursor: "ew-resize", opacity: '0.5' }} />
                    </Box>
                }

                {/* Центральная область для перетаскивания */}
                {request.isRequest && showBlockRequest == 1 ?
                    <Box
                        ref={setNodeRef}
                        {...listeners}
                        {...attributes}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onMouseDown={handleMouseDown} // Отслеживаем начальную позицию
                        onMouseMove={handleMouseMove} // Проверяем движение мыши
                        onMouseUp={handleMouseUp}
                        sx={{
                            flex: 1,
                            width: 'calc(100% - 20px)',
                            height: "35px",
                            display: "flex",
                            alignItems: "center",
                            textAlign: "center",
                            justifyContent: "left",
                            cursor: "grab",
                            zIndex: 1,
                            overflow: 'hidden',
                            padding: '0 5px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'left', gap: '5px' }}>
                            <img src={`${server}${request.airline ? request.airline.images[0] : 'null'}`} alt="" style={{ height: '20px' }} />
                            <div style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {request.guest}
                            </div>
                        </div>
                    </Box>
                    :
                    !request.isRequest && showBlockReserve == 1 ?
                        <Box
                            ref={setNodeRef}
                            {...listeners}
                            {...attributes}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            onMouseDown={handleMouseDown} // Отслеживаем начальную позицию
                            onMouseMove={handleMouseMove} // Проверяем движение мыши
                            onMouseUp={handleMouseUp}
                            sx={{
                                flex: 1,
                                width: 'calc(100% - 20px)',
                                height: "35px",
                                display: "flex",
                                alignItems: "center",
                                textAlign: "center",
                                justifyContent: "left",
                                cursor: "grab",
                                zIndex: 1,
                                overflow: 'hidden',
                                padding: '0 5px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'left', gap: '5px' }}>
                                <img src={`${server}${request.airline ? request.airline.images[0] : 'null'}`} alt="" style={{ height: '20px' }} />
                                <div style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                    {request.guest}
                                </div>
                            </div>
                        </Box>
                        :
                        <Box
                            sx={{
                                flex: 1,
                                width: 'calc(100% - 20px)',
                                height: "35px",
                                display: "flex",
                                alignItems: "center",
                                textAlign: "center",
                                justifyContent: "left",
                                cursor: "grab",
                                zIndex: 1,
                                overflow: 'hidden',
                                padding: '0 5px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'left', gap: '5px' }}>
                                <img src={`${server}${request.airline ? request.airline.images[0] : 'null'}`} alt="" style={{ height: '20px' }} />
                                <div style={{ width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                    {request.guest}
                                </div>
                            </div>
                        </Box>
                }

                {/* Правая ручка для изменения конца */}
                {userRole != 'HOTELADMIN' && request.status != 'Ожидает' && request.isRequest && showBlockRequest == 1 &&
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

                                // Получаем обновлённую заявку
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
                            height: '23px',
                            userSelect: 'none'
                        }}
                    >
                        <img src="/drag-vertical.svg" alt="" style={{ pointerEvents: 'none', width: '100%', height: '100%', padding: '4px 0', cursor: "ew-resize", opacity: '0.5' }} />
                    </Box>
                }
            </Box >

            {tooltipVisible && !isDraggingGlobal && mouseIsMoving && (
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
                        minWidth: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px'
                    }}
                >
                    <Typography variant="body2">
                        <div style={styleToolTip}> Авиакомпания: <b>{request.airline?.name}</b></div>
                    </Typography>
                    <Typography variant="body2">
                        <div style={styleToolTip}> Заявка: <b>{request.isRequest ? 'Квота' : 'Резерв'}</b></div>
                    </Typography>
                    {/* <Typography variant="body2">
                        <div style={styleToolTip}> Бронирование: <b>{request.id}</b></div>
                    </Typography> */}
                    {request.room &&
                        <Typography variant="body2">
                            <div style={styleToolTip}> Комната: <b>{request.room}</b></div>
                        </Typography>
                    }
                    <Typography variant="body2">
                        <div style={styleToolTip}> Гость: <b>{request.guest}</b></div>
                    </Typography>
                    <Typography variant="body2">
                        <div style={styleToolTip}> Статус: <b>{request.status}</b></div>
                    </Typography>
                    <Typography variant="body2">
                        <div style={styleToolTip}> Заселение: <b>{convertToDate(request.checkInDate)} {request.checkInTime}</b></div>
                    </Typography>
                    <Typography variant="body2">
                        <div style={styleToolTip}> Выселение: <b>{convertToDate(request.checkOutDate)} {request.checkOutTime}</b></div>
                    </Typography>
                </Box>
            )
            }
        </>
    );
};

export default DraggableRequest;
