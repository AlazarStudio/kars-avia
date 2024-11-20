import React from "react";
import { Box } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import { differenceInMilliseconds, startOfMonth } from "date-fns";

const DraggableRequest = ({ request, dayWidth, currentMonth }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: request.id.toString(),
    });

    const startDate = startOfMonth(currentMonth);
    const checkIn = new Date(`${request.checkInDate}T${request.checkInTime}`);
    const checkOut = new Date(`${request.checkOutDate}T${request.checkOutTime}`);

    const checkInOffset = (differenceInMilliseconds(checkIn, startDate) / (24 * 60 * 60 * 1000)) * dayWidth;
    const duration = (differenceInMilliseconds(checkOut, checkIn) / (24 * 60 * 60 * 1000)) * dayWidth;

    const style = {
        position: "absolute",
        top: "2px",
        left: `${checkInOffset}px`,
        width: `${duration}px`,
        height: "25px",
        backgroundColor: isDragging ? "#439846" : "#439846",
        border: "1px solid #439846",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "white",
        fontSize: "11px",
        zIndex: isDragging ? 10 : 2,
        userSelect: 'none',
        cursor: "move",
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        opacity: isDragging ? 1 : 1, // Прозрачность при перетаскивании
    };

    return (
        <Box ref={setNodeRef} {...listeners} {...attributes} sx={style}>
            {request.guest}
        </Box>
    );
};

export default DraggableRequest;
