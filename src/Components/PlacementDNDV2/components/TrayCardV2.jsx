import React, { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import ChatIcon from "../../../shared/icons/ChatIcon";
import { convertToDate, getMediaUrl } from "../../../../graphQL_requests";
import { categoryLabel } from "../../../utils/roomCategories";
import { waitBadge } from "../utils/placementBadges";
import classes from "./UnplacedTray.module.css";

// Смещение курсора между нажатием и отпусканием, при котором это ещё клик.
const CLICK_SLOP = 8;

// Карточка неразмещённой заявки: перетаскивается на койку в сетке.
const TrayCardV2 = ({
  request,
  requestId,
  toggleRequestSidebar,
  isOverlay = false,
}) => {
  const {
    id,
    position,
    room,
    requestID,
    createdAt,
    roomCategory,
    airline,
    guest,
    guestPosition,
    checkInDate,
    checkInTime,
    checkOutDate,
    checkOutTime,
    unreadMessages,
  } = request;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id.toString(),
      data: {
        position,
        roomId: room?.id,
      },
      disabled: isOverlay,
    });

  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    if (requestId && requestID === requestId) {
      setIsBlinking(true);
      const timer = setTimeout(() => {
        setIsBlinking(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [requestId, requestID]);

  const pointerStartRef = useRef(null);

  // Своё pointerdown поверх dnd-kit: запоминаем точку нажатия и передаём
  // событие сенсору дальше, иначе перетаскивание перестанет запускаться.
  const handlePointerDown = (event) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    listeners?.onPointerDown?.(event);
  };

  // Клик без смещения открывает карточку заявки — как у плашки в сетке.
  const handlePointerUp = (event) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || isDragging) return;
    if (
      Math.abs(event.clientX - start.x) >= CLICK_SLOP ||
      Math.abs(event.clientY - start.y) >= CLICK_SLOP
    ) {
      return;
    }
    toggleRequestSidebar && toggleRequestSidebar(requestID);
  };

  const wait = waitBadge(createdAt, Date.now());
  const category = roomCategory ? categoryLabel(roomCategory) : "";
  const avatar = airline?.images?.[0] ? getMediaUrl(airline.images[0]) : null;
  const shortPosition = guestPosition
    ? String(guestPosition).split("(")[0].trim()
    : "";
  const unread = unreadMessages || 0;

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...(!isOverlay ? listeners : {})}
      {...(!isOverlay ? attributes : {})}
      className={`${classes.card} ${isBlinking ? classes.cardBlink : ""}`}
      style={{
        opacity: isDragging && !isOverlay ? 0 : 1,
        cursor: isOverlay ? "grabbing" : "grab",
        width: isOverlay ? "316px" : undefined,
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      onPointerDown={isOverlay ? undefined : handlePointerDown}
      onPointerUp={isOverlay ? undefined : handlePointerUp}
    >
      <span className={classes.cardHandle}>
        <svg width="8" height="26" viewBox="0 0 8 26" fill="currentColor">
          <circle cx="2.5" cy="5" r="1.3" />
          <circle cx="5.5" cy="5" r="1.3" />
          <circle cx="2.5" cy="13" r="1.3" />
          <circle cx="5.5" cy="13" r="1.3" />
          <circle cx="2.5" cy="21" r="1.3" />
          <circle cx="5.5" cy="21" r="1.3" />
        </svg>
      </span>

      <div className={classes.cardBody}>
        <div className={classes.cardHead}>
          <span className={classes.cardAvatar}>
            {avatar ? <img src={avatar} alt="" /> : null}
          </span>
          <span className={classes.cardName}>{guest}</span>
          {shortPosition ? (
            <span className={classes.cardPosition}>{shortPosition}</span>
          ) : null}
        </div>

        <div className={classes.cardRow}>
          Прибытие
          <span className={classes.cardValue}>
            {convertToDate(checkInDate)} {checkInTime}
          </span>
        </div>
        <div className={classes.cardRow}>
          Отъезд
          <span className={classes.cardValue}>
            {convertToDate(checkOutDate)} {checkOutTime}
          </span>
        </div>

        <div className={classes.cardChips}>
          <span
            className={classes.chip}
            style={{ color: wait.edge, background: wait.tint }}
          >
            {wait.label}
          </span>
          {category ? (
            <span
              className={classes.chip}
              style={{ color: "#6b7090", background: "#eef1f7" }}
            >
              {category}
            </span>
          ) : null}
          {unread > 0 ? (
            <span className={classes.chatBadge}>
              <ChatIcon width="12" height="12" />
              {unread}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TrayCardV2;
