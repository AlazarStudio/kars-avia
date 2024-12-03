import React, { memo, useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { eachDayOfInterval, startOfMonth, endOfMonth, isWeekend, isToday } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import DraggableRequest from "../DraggableRequest/DraggableRequest";

const RoomRow = memo(({ dayWidth, weekendColor, borderBottomDraw, room, requests, currentMonth, onUpdateRequest, onOpenModal, allRequests, isDraggingGlobal, userRole, toggleRequestSidebar }) => {
    const { setNodeRef } = useDroppable({
        id: room.id,
    });

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const isDouble = room.type === "double";

    const containerRef = useRef(null);
    const [dayWidthLength, setDayWidthLength] = useState(30); // Default value

    // Update dayWidth dynamically based on container size
    useEffect(() => {
        const updateDayWidth = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth; // Get container width
                const newDayWidth = containerWidth / daysInMonth.length; // Calculate day width
                setDayWidthLength(newDayWidth);
            }
        };

        // Initial calculation
        updateDayWidth();

        // ResizeObserver for dynamic resizing
        const observer = new ResizeObserver(updateDayWidth);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
    }, [daysInMonth]);

    return (
        <Box
            ref={(node) => {
                setNodeRef(node); // Connect to dnd-kit
                containerRef.current = node; // Save reference for resizing
            }}
            sx={{
                display: "flex",
                position: "relative",
                borderBottom: borderBottomDraw ? "1px solid #dddddd00" : "1px solid #ddd",
                height: isDouble ? "80px" : "40px",
            }}
        >
            {daysInMonth.map((day, index) => (
                <Box
                    ref={containerRef}
                    key={index}
                    sx={{
                        width: `${dayWidth}px`,
                        borderRight: "1px solid #ddd",
                        backgroundColor: !room.active ? '#a9a9a9' : isToday(day) ? "#f3f292" : isWeekend(day) ? weekendColor : "#fff",
                        opacity: !room.active ? '0.5' : '1'
                    }}
                />
            ))}

            {requests
                .sort((a, b) => a.position - b.position)
                .map((request) => (
                    <DraggableRequest
                        userRole={userRole}
                        key={request.id}
                        request={request}
                        dayWidth={dayWidthLength}
                        currentMonth={currentMonth}
                        onUpdateRequest={onUpdateRequest}
                        onOpenModal={onOpenModal} // Прокидываем в DraggableRequest
                        allRequests={allRequests} // Передаем все заявки
                        position={request.position}
                        isDraggingGlobal={isDraggingGlobal}
                        toggleRequestSidebar={toggleRequestSidebar}
                    />
                ))}

        </Box>
    );
});


export default RoomRow;
