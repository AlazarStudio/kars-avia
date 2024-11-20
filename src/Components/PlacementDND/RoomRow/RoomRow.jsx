import React, { memo } from "react";
import { Box } from "@mui/material";
import { eachDayOfInterval, startOfMonth, endOfMonth, isWeekend, isToday } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import DraggableRequest from "../DraggableRequest/DraggableRequest";

const RoomRow = memo(({ dayWidth, weekendColor, monthColor, room, requests, currentMonth }) => {
    const { setNodeRef } = useDroppable({
        id: room,
    });

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    return (
        <Box
            ref={setNodeRef}
            sx={{
                display: "flex",
                position: "relative",
                borderBottom: "1px solid #ddd",
                height: "30px",
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

            {requests.map((request) => (
                <DraggableRequest
                    key={request.id}
                    request={request}
                    dayWidth={dayWidth}
                    currentMonth={currentMonth}
                />
            ))}
        </Box>
    );
});

export default RoomRow;
