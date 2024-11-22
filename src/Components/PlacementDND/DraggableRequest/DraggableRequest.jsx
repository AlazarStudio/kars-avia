import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import { differenceInMilliseconds, startOfMonth } from "date-fns";

const DraggableRequest = ({ request, dayWidth, currentMonth, onUpdateRequest, position, allRequests }) => {
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
            default:
                return { backgroundColor: "#9e9e9e", borderColor: "#757575" }; // Серый для остальных
        }
    };

    const { backgroundColor, borderColor } = getStatusColors(request.status);

    const style = {
        position: "absolute",
        top: `${position * 40 + 2}px`,
        left: `${checkInOffset}px`,
        width: `${duration}px`,
        height: "35px",
        backgroundColor: backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        textAlign: 'center',
        justifyContent: "space-between",
        color: "white",
        fontSize: "11px",
        zIndex: isDragging ? 50 : 2,
        userSelect: "none",
        cursor: isDragging ? "grabbing" : "grab",
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
    };

    const handleResize = (type, deltaDays) => {
        const updatedRequest = { ...request };

        if (type === "start") {
            const newCheckIn = new Date(checkIn);
            newCheckIn.setDate(newCheckIn.getDate() + deltaDays);
            updatedRequest.checkInDate = newCheckIn.toISOString().split("T")[0];
        } else if (type === "end") {
            const newCheckOut = new Date(checkOut);
            newCheckOut.setDate(newCheckOut.getDate() + deltaDays);
            updatedRequest.checkOutDate = newCheckOut.toISOString().split("T")[0];
        }

        // Проверяем наложения (логика осталась прежней)
        if (isOverlap(updatedRequest)) {
            console.warn("Накладывание запрещено!");
            return;
        }

        onUpdateRequest(updatedRequest);
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

    const tooltipStyleBlock = { display: 'flex', justifyContent: 'space-between', fontSize: '12px' };
    const tooltipStyleText = { width: '130px', display: 'block' };

    return (
        !isDragging ?
            <Tooltip
                title={
                    <Box>
                        <Typography variant="subtitle2" style={tooltipStyleBlock}>
                            <strong style={tooltipStyleText}>Клиент:</strong> {request.guest}
                        </Typography>
                        <Typography variant="subtitle2" style={tooltipStyleBlock}>
                            <strong style={tooltipStyleText}>Бронирование:</strong> {request.id}
                        </Typography>
                        <Typography variant="body2" style={tooltipStyleBlock}>
                            <strong style={tooltipStyleText}>Комната:</strong> {request.room}
                        </Typography>
                        <Typography variant="body2" style={tooltipStyleBlock}>
                            <strong style={tooltipStyleText}>Дата заезда:</strong> {new Date(request.checkInDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" style={tooltipStyleBlock}>
                            <strong style={tooltipStyleText}>Дата выезда:</strong> {new Date(request.checkOutDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" style={tooltipStyleBlock}>
                            <strong style={tooltipStyleText}>Статус:</strong> {request.status}
                        </Typography>
                    </Box>
                }
                arrow
                placement="right"
                componentsProps={{
                    tooltip: {
                        sx: {
                            width: 'fit-content',
                            maxWidth: 'none',
                            backgroundColor: '#ffffff',
                            color: '#000',
                            boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.3)',
                            fontSize: '11px',
                            padding: '10px 15px',
                        },
                    },
                    arrow: {
                        sx: {
                            color: '#ffffff',
                        },
                    },
                }}
            >
                <Box sx={style}>
                    {/* Левая ручка для изменения начала */}
                    <Box
                        onMouseDown={(e) => {
                            const startX = e.clientX;

                            const handleMouseMove = (event) => {
                                const deltaX = event.clientX - startX;
                                const deltaDays = Math.round(deltaX / dayWidth);
                                if (deltaDays !== 0) {
                                    handleResize("start", deltaDays);
                                }
                            };

                            const handleMouseUp = () => {
                                document.removeEventListener("mousemove", handleMouseMove);
                                document.removeEventListener("mouseup", handleMouseUp);
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
                    {/* Центральная область для перетаскивания */}
                    <Box
                        ref={setNodeRef}
                        {...listeners}
                        {...attributes}
                        sx={{
                            flex: 1,
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "grab",
                            zIndex: 1,
                        }}
                    >
                        {request.guest}
                    </Box>
                    {/* Правая ручка для изменения конца */}
                    <Box
                        onMouseDown={(e) => {
                            const startX = e.clientX;

                            const handleMouseMove = (event) => {
                                const deltaX = event.clientX - startX;
                                const deltaDays = Math.round(deltaX / dayWidth);
                                if (deltaDays !== 0) {
                                    handleResize("end", deltaDays);
                                }
                            };

                            const handleMouseUp = () => {
                                document.removeEventListener("mousemove", handleMouseMove);
                                document.removeEventListener("mouseup", handleMouseUp);
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
                </Box>
            </Tooltip >
            :
            <Box sx={style}>
                {/* Левая ручка для изменения начала */}
                <Box
                    onMouseDown={(e) => {
                        const startX = e.clientX;

                        const handleMouseMove = (event) => {
                            const deltaX = event.clientX - startX;
                            const deltaDays = Math.round(deltaX / dayWidth);
                            if (deltaDays !== 0) {
                                handleResize("start", deltaDays);
                            }
                        };

                        const handleMouseUp = () => {
                            document.removeEventListener("mousemove", handleMouseMove);
                            document.removeEventListener("mouseup", handleMouseUp);
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
                {/* Центральная область для перетаскивания */}
                <Box
                    ref={setNodeRef}
                    {...listeners}
                    {...attributes}
                    sx={{
                        flex: 1,
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "grab",
                        zIndex: 1,
                    }}
                >
                    {request.guest}
                </Box>
                {/* Правая ручка для изменения конца */}
                <Box
                    onMouseDown={(e) => {
                        const startX = e.clientX;

                        const handleMouseMove = (event) => {
                            const deltaX = event.clientX - startX;
                            const deltaDays = Math.round(deltaX / dayWidth);
                            if (deltaDays !== 0) {
                                handleResize("end", deltaDays);
                            }
                        };

                        const handleMouseUp = () => {
                            document.removeEventListener("mousemove", handleMouseMove);
                            document.removeEventListener("mouseup", handleMouseUp);
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
            </Box>
    );
};

export default DraggableRequest;
