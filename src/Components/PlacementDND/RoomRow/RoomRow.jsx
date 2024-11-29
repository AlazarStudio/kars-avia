import React, { memo } from "react";
import { Box } from "@mui/material";
import { eachDayOfInterval, startOfMonth, endOfMonth, isWeekend, isToday } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import DraggableRequest from "../DraggableRequest/DraggableRequest";

const RoomRow = memo(({ dayWidth, weekendColor, monthColor, room, requests, currentMonth, onUpdateRequest, onOpenModal, allRequests, isDraggingGlobal, userRole }) => {
    const { setNodeRef } = useDroppable({
        id: room.id,
    });

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const isDouble = room.type === "double";

    return (
        <Box
            ref={setNodeRef}
            sx={{
                display: "flex",
                position: "relative",
                borderBottom: "1px solid #ddd",
                height: isDouble ? "80px" : "40px",
            }}
        >
            {daysInMonth.map((day, index) => (
                <Box
                    key={index}
                    sx={{
                        width: `${dayWidth}px`,
                        borderRight: "1px solid #ddd",
                        backgroundColor: isToday(day) ? "#f3f292" : isWeekend(day) ? weekendColor : "#fff",
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
                        dayWidth={dayWidth}
                        currentMonth={currentMonth}
                        onUpdateRequest={onUpdateRequest}
                        onOpenModal={onOpenModal} // Прокидываем в DraggableRequest
                        allRequests={allRequests} // Передаем все заявки
                        position={request.position}
                        isDraggingGlobal={isDraggingGlobal}
                    />
                ))}

        </Box>
    );
});


export default RoomRow;
