import React from "react";
import { Box } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import { differenceInMilliseconds, startOfMonth } from "date-fns";

const DraggableRequest = ({ request, dayWidth, currentMonth, onUpdateRequest, position }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: request.id.toString(),
    });

    const startDate = startOfMonth(currentMonth);
    const checkIn = new Date(`${request.checkInDate}T${request.checkInTime}`);
    const checkOut = new Date(`${request.checkOutDate}T${request.checkOutTime}`);

    const checkInOffset = (differenceInMilliseconds(checkIn, startDate) / (24 * 60 * 60 * 1000)) * dayWidth;
    const duration = (differenceInMilliseconds(checkOut, checkIn) / (24 * 60 * 60 * 1000)) * dayWidth;

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

        onUpdateRequest(updatedRequest);
    };

    const style = {
        position: "absolute",
        top: `${position * 40 + 2}px`, // Смещение для каждой заявки в двухместной комнате
        left: `${checkInOffset}px`,
        width: `${duration}px`,
        height: "35px",
        backgroundColor: isDragging ? "#3b7a3b" : "#439846",
        border: "1px solid #439846",
        borderRadius: "4px",
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

    return (
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
