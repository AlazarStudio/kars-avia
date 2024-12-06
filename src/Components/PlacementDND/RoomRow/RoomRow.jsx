import React, { memo, useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { eachDayOfInterval, startOfMonth, endOfMonth, isWeekend, isToday, format, startOfDay } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import DraggableRequest from "../DraggableRequest/DraggableRequest";

const RoomRow = memo(({ isClick, setIsClick, activeDragItem, highlightedDatesOld, setHoveredDayInMonth, setHoveredRoom, dayWidth, weekendColor, borderBottomDraw, room, requests, currentMonth, onUpdateRequest, onOpenModal, allRequests, isDraggingGlobal, userRole, toggleRequestSidebar }) => {
    const { setNodeRef } = useDroppable({
        id: room.id,
    });

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const isDouble = room.type === "double";

    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [highlightedDates, setHighlightedDates] = useState([]);

    const handleMouseEnter = (index, day) => {
        setHoveredPoint(index);
        setHoveredDayInMonth(format(day, 'd'))
        setHoveredRoom(room.id)
    };

    const handleMouseLeave = () => {
        setHoveredPoint(null);
        setHoveredDayInMonth(null)
        setHoveredRoom(null)
    };

    const containerRef = useRef(null);
    const [dayWidthLength, setDayWidthLength] = useState(dayWidth);

    // Update dayWidth dynamically based on container size
    useEffect(() => {
        const updateDayWidth = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth; // Get container width
                const newDayWidth = containerWidth / daysInMonth.length; // Calculate day width
                setDayWidthLength(newDayWidth);
            }
        };

        updateDayWidth();

        const observer = new ResizeObserver(updateDayWidth);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
    }, [daysInMonth]);

    const handleDragOver = (event) => {
        if (activeDragItem) {
            const dragStart = startOfDay(new Date(activeDragItem.checkInDate));
            const dragEnd = startOfDay(new Date(activeDragItem.checkOutDate));

            // Определяем, какие даты нужно подсветить
            const datesToHighlight = daysInMonth.filter(
                (date) => date.getTime() >= dragStart.getTime() && date.getTime() <= dragEnd.getTime()
            );

            setHighlightedDates(datesToHighlight); // Сохраняем даты для подсветки
        }
    };

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
                height: isDouble ? "100px" : "50px",
            }}

            onMouseEnter={(e) => {
                e.preventDefault();
                handleDragOver();
            }}
            onMouseLeave={() => setHighlightedDates([])}
        >
            {daysInMonth.map((day, index) => (
                <Box
                    ref={containerRef}
                    key={index}
                    sx={{
                        width: `${dayWidth}px`,
                        borderLeft: !isClick && highlightedDatesOld[0]?.getTime() === day.getTime() ? "1px solid #75757540" : highlightedDates[0]?.getTime() === day.getTime() ? "1px solid #75757540" : "1px solid #dddddd00",
                        borderBottom: !isClick && highlightedDatesOld.some(d => d.getTime() === day.getTime()) ? "1px solid #75757540" : highlightedDates.some(d => d.getTime() === day.getTime()) ? "1px solid #75757540" : "1px solid #dddddd00",
                        borderTop: !isClick && highlightedDatesOld.some(d => d.getTime() === day.getTime()) ? "1px solid #75757540" : highlightedDates.some(d => d.getTime() === day.getTime()) ? "1px solid #75757540" : "1px solid #dddddd00",
                        borderRight: !isClick && highlightedDatesOld.some(d => d.getTime() === day.getTime()) ? "1px solid #75757540" : highlightedDates.some(d => d.getTime() === day.getTime()) ? "1px solid #75757540" : "1px solid #ddd",
                        backgroundColor: !isClick && highlightedDatesOld.some(d => d.getTime() === day.getTime()) ? "#9e9e9e40" : highlightedDates.some(d => d.getTime() === day.getTime()) ? "#9e9e9e40" : hoveredPoint === index ? "#cce5ff" : !room.active ? '#a9a9a9' : isToday(day) ? "#f3f292" : isWeekend(day) ? weekendColor : "#fff",
                        opacity: !room.active ? '0.5' : '1'
                    }}
                    onMouseEnter={() => handleMouseEnter(index, day)} // Передаем индекс и дату
                    onMouseLeave={handleMouseLeave}
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
                        isClick={isClick}
                        setIsClick={setIsClick}
                    />
                ))}

        </Box>
    );
});


export default RoomRow;
