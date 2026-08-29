import React, { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { categoryLabel } from "../../../utils/roomCategories";
import { DAY_BG, dayCellBg } from "../utils/placementPeriod";
import PlacementBarV2 from "./PlacementBarV2";
import classes from "./RoomRowV2.module.css";

const LANE_HEIGHT = 44;

// Дроп-зона одной койки. Хук вынесен в компонент: в цикле его звать нельзя.
const LaneDropZone = ({ roomId, position }) => {
  const { setNodeRef } = useDroppable({
    id: `${roomId}-${position}`,
    data: { roomId, position },
  });

  return (
    <div
      ref={setNodeRef}
      className={classes.dropZone}
      style={{ top: `${position * LANE_HEIGHT}px` }}
    />
  );
};

const RoomRowV2 = memo(
  ({
    room,
    days,
    dayW,
    period,
    dragTarget,
    highlightedDates,
    requestId,
    hotelAccess,
    onUpdateRequest,
    onOpenModal,
    allRequests,
    isDraggingGlobal,
    user,
    toggleRequestSidebar,
    onRoomClick,
  }) => {
    const {
      roomId,
      id: roomName,
      type: lanes,
      roomType,
      roomKind,
      category,
      beds,
      active,
      requests,
    } = room;

    const subtitle = category ? categoryLabel(category) : "";
    const isTargetRoom = dragTarget?.roomId === roomId;

    // Название в шапке строки обрезается многоточием — полный текст в тултипе.
    const displayName = `${roomType !== "apartment" ? "№ " : ""}${roomName}${
      roomType !== "apartment" && roomKind?.name ? ` ${roomKind.name}` : ""
    }`;
    const labelTitle = [displayName, subtitle].filter(Boolean).join(" — ");

    const highlighted = (day) =>
      highlightedDates?.some((d) => d.getTime() === day.getTime());

    return (
      <div
        className={classes.row}
        data-room-id={roomId}
        style={{ height: `${lanes * LANE_HEIGHT}px` }}
      >
        <div className={classes.label} style={{ opacity: active ? 1 : 0.55 }}>
          <div
            className={classes.labelTitles}
            title={labelTitle}
            onClick={() => onRoomClick && onRoomClick(room)}
          >
            <span className={classes.roomName}>{displayName}</span>
            <span className={classes.roomSub}>{subtitle}</span>
          </div>
          <div className={classes.roomIcons}>
            <div className={classes.roomIconRow}>
              <img
                src="/roomPlacePersonWhite.png"
                className={classes.roomIconPerson}
                alt=""
              />
              {`x ${lanes}`}
            </div>
            {beds ? (
              <div className={classes.roomIconRow}>
                <img
                  src="/roomsIcon.png"
                  className={classes.roomIconBed}
                  alt=""
                />
                {`x ${beds}`}
              </div>
            ) : null}
          </div>
        </div>

        <div className={classes.body}>
          {days.map((day) => (
            <div
              key={day.getTime()}
              className={classes.dayCell}
              style={{
                width: `${dayW}px`,
                minWidth: `${dayW}px`,
                background: highlighted(day) ? DAY_BG.today : dayCellBg(day),
                opacity: active ? 1 : 0.45,
              }}
            />
          ))}

          {Array.from({ length: lanes - 1 }).map((_, index) => (
            <div
              key={`divider-${index}`}
              className={classes.divider}
              style={{ top: `${(index + 1) * LANE_HEIGHT}px` }}
            />
          ))}

          {lanes > 1
            ? Array.from({ length: lanes }).map((_, index) => (
                <div
                  key={`bed-${index}`}
                  className={classes.bedCircle}
                  style={{ top: `${index * LANE_HEIGHT + 14}px` }}
                >
                  {index + 1}
                </div>
              ))
            : null}

          {isTargetRoom ? (
            <div
              className={classes.dragTarget}
              style={{
                top: `${dragTarget.position * LANE_HEIGHT}px`,
                background: dragTarget.valid ? "#eaf2fd" : "#faeae6",
              }}
            />
          ) : null}

          {Array.from({ length: lanes }).map((_, position) => (
            <LaneDropZone
              key={`drop-${position}`}
              roomId={roomId}
              position={position}
            />
          ))}

          {requests
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((request) => (
              <PlacementBarV2
                key={request.id}
                request={request}
                position={request.position}
                period={period}
                dayW={dayW}
                requestId={requestId}
                hotelAccess={hotelAccess}
                user={user}
                allRequests={allRequests}
                onUpdateRequest={onUpdateRequest}
                onOpenModal={onOpenModal}
                isDraggingGlobal={isDraggingGlobal}
                toggleRequestSidebar={toggleRequestSidebar}
              />
            ))}

          {!active ? (
            <span className={classes.offNote}>не работает</span>
          ) : null}
        </div>
      </div>
    );
  }
);

RoomRowV2.displayName = "RoomRowV2";

export default RoomRowV2;
