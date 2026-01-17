import React, { memo, useMemo, useState } from "react";
import { Box } from "@mui/material";
import {
  eachDayOfInterval,
  endOfMonth,
  isToday,
  isWeekend,
  startOfMonth,
  startOfDay,
} from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import DraggableRequestV2 from "./DraggableRequestV2";

const RoomRowV2 = memo(
  ({
    requestId,
    checkRoomsType,
    hotelAccess,
    isClick,
    setIsClick,
    containerRef,
    activeDragItem,
    highlightedDatesOld,
    setHoveredDayInMonth,
    setHoveredRoom,
    dayWidth,
    weekendColor,
    borderBottomDraw,
    room,
    requests,
    currentMonth,
    onUpdateRequest,
    onOpenModal,
    allRequests,
    isDraggingGlobal,
    user,
    toggleRequestSidebar,
  }) => {
    const daysInMonth = useMemo(
      () =>
        eachDayOfInterval({
          start: startOfMonth(currentMonth),
          end: endOfMonth(currentMonth),
        }),
      [currentMonth]
    );

    const [highlightedDates, setHighlightedDates] = useState([]);

    const handleMouseLeave = () => {
      setHoveredDayInMonth(null);
      setHoveredRoom(null);
    };

    const dayWidthLength = dayWidth;

    const handleDragOver = () => {
      if (activeDragItem) {
        const dragStart = startOfDay(new Date(activeDragItem.checkInDate));
        const dragEnd = startOfDay(new Date(activeDragItem.checkOutDate));

        const datesToHighlight = daysInMonth.filter(
          (date) =>
            date.getTime() >= dragStart.getTime() &&
            date.getTime() <= dragEnd.getTime()
        );

        setHighlightedDates(datesToHighlight);
      }
    };

    return (
      <Box
        ref={(node) => {
          containerRef.current = node;
        }}
        sx={{
          display: "flex",
          position: "relative",
          borderBottom: borderBottomDraw ? "1px solid #dddddd00" : "1px solid #ddd",
          height: `${50 * room.type}px`,
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
              width: `${dayWidthLength}px`,
              borderLeft:
                !isClick && highlightedDatesOld[0]?.getTime() === day.getTime()
                  ? "1px solid #75757540"
                  : highlightedDates[0]?.getTime() === day.getTime()
                  ? "1px solid #75757540"
                  : "1px solid #dddddd00",
              borderBottom:
                !isClick &&
                highlightedDatesOld.some((d) => d.getTime() === day.getTime())
                  ? "1px solid #75757540"
                  : highlightedDates.some((d) => d.getTime() === day.getTime())
                  ? "1px solid #75757540"
                  : "1px solid #dddddd00",
              borderTop:
                !isClick &&
                highlightedDatesOld.some((d) => d.getTime() === day.getTime())
                  ? "1px solid #75757540"
                  : highlightedDates.some((d) => d.getTime() === day.getTime())
                  ? "1px solid #75757540"
                  : "1px solid #dddddd00",
              borderRight:
                !isClick &&
                highlightedDatesOld.some((d) => d.getTime() === day.getTime())
                  ? "1px solid #75757540"
                  : highlightedDates.some((d) => d.getTime() === day.getTime())
                  ? "1px solid #75757540"
                  : "1px solid #ddd",
              backgroundColor:
                !isClick &&
                highlightedDatesOld.some((d) => d.getTime() === day.getTime())
                  ? "#9e9e9e40"
                  : highlightedDates.some((d) => d.getTime() === day.getTime())
                  ? "#9e9e9e40"
                  : !room.active
                  ? "#a9a9a9"
                  : isToday(day)
                  ? "#f3f292"
                  : isWeekend(day)
                  ? weekendColor
                  : "#fff",
              opacity: !room.active ? "0.5" : "1",
            }}
            onMouseLeave={handleMouseLeave}
          />
        ))}

        {requests
          .sort((a, b) => a.position - b.position)
          .map((request) => (
            <DraggableRequestV2
              hotelAccess={hotelAccess}
              requestId={requestId}
              checkRoomsType={checkRoomsType}
              user={user}
              key={request.id}
              request={request}
              dayWidth={dayWidthLength}
              currentMonth={currentMonth}
              onUpdateRequest={onUpdateRequest}
              onOpenModal={onOpenModal}
              allRequests={allRequests}
              position={request.position}
              isDraggingGlobal={isDraggingGlobal}
              toggleRequestSidebar={toggleRequestSidebar}
              isClick={isClick}
              setIsClick={setIsClick}
            />
          ))}

        {Array.from({ length: room.type }).map((_, position) => {
          const droppableId = `${room.roomId}-${position}`;
          const { setNodeRef } = useDroppable({
            id: droppableId,
            data: { roomId: room.roomId, position },
          });

          return (
            <div
              key={droppableId}
              ref={setNodeRef}
              style={{
                position: "absolute",
                top: `${position * 50}px`,
                left: 0,
                width: "100%",
                height: "50px",
                zIndex: 1,
              }}
            />
          );
        })}
      </Box>
    );
  }
);

export default RoomRowV2;
