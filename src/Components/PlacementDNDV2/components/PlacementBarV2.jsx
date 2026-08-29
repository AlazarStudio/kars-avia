import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { getMediaUrl } from "../../../../graphQL_requests";
import { layoutBar } from "../utils/placementBarLayout";
import { getStatusStyle } from "../utils/placementStatusStyles";
import BarPopover from "./BarPopover";
import classes from "./PlacementBarV2.module.css";

const LANE_HEIGHT = 44;
const BAR_HEIGHT = 36;
const HOVER_DELAY = 250;
// Габариты поповера с запасом: по ним решаем, куда его раскрывать.
const POPOVER_HEIGHT = 210;
const POPOVER_WIDTH = 300;
// Зазор между плашкой и поповером и минимальные отступы от краёв вьюпорта.
const POPOVER_GAP = 4;
const VIEWPORT_PAD_RIGHT = 10;
const VIEWPORT_PAD_LEFT = 8;
// Смещение курсора между нажатием и отпусканием, при котором это ещё клик.
const CLICK_SLOP = 8;

const PlacementBarV2 = ({
  requestId,
  request,
  hotelAccess,
  period,
  dayW,
  onUpdateRequest,
  position,
  allRequests,
  onOpenModal,
  isDraggingGlobal,
  user,
  toggleRequestSidebar,
  isOverlay = false,
}) => {
  const {
    id,
    room,
    requestID,
    isRequest,
    status,
    guest,
    guestPosition,
    airline,
    position: requestPosition,
    checkInDate,
    checkInTime,
    checkOutDate,
    checkOutTime,
  } = request;
  const lane = position ?? requestPosition;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id.toString(),
      data: {
        position: requestPosition,
        roomId: room?.id,
      },
      disabled: isOverlay || !isRequest,
    });

  const checkIn = new Date(`${checkInDate}T${checkInTime}`);
  const checkOut = new Date(`${checkOutDate}T${checkOutTime}`);

  const layout = layoutBar(request, period, dayW);
  const style = getStatusStyle(status, isRequest);
  const isLegacy = !isRequest;

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

  const originalRequestRef = useRef(null);
  const handleResizeStart = () => {
    originalRequestRef.current = { ...request };
  };
  const handleResizeEnd = (updatedRequest) => {
    onOpenModal(updatedRequest, originalRequestRef.current);
  };

  const handleResize = (type, deltaDays) => {
    const updatedRequest = { ...request };

    if (type === "start") {
      const newCheckIn = new Date(checkIn);
      newCheckIn.setDate(newCheckIn.getDate() + deltaDays);
      updatedRequest.checkInDate = newCheckIn.toISOString().split("T")[0];

      if (deltaDays < 0) {
        updatedRequest.status = "Ранний заезд";
      } else if (deltaDays > 0) {
        updatedRequest.status = "Сокращен";
      }
    } else if (type === "end") {
      const newCheckOut = new Date(checkOut);
      newCheckOut.setDate(newCheckOut.getDate() + deltaDays);
      updatedRequest.checkOutDate = newCheckOut.toISOString().split("T")[0];

      if (deltaDays > 0) {
        updatedRequest.status = "Продлен";
      } else if (deltaDays < 0) {
        updatedRequest.status = "Сокращен";
      }
    }

    if (isOverlap(updatedRequest)) {
      return request;
    }

    onUpdateRequest(updatedRequest);
    return updatedRequest;
  };

  const isOverlap = (updatedRequest) => {
    const roomRequests = (allRequests || []).filter(
      (req) => req.room?.id === updatedRequest.room?.id
    );

    return roomRequests.some((otherRequest) => {
      if (otherRequest.id === updatedRequest.id) return false;

      const otherCheckIn = new Date(
        `${otherRequest.checkInDate}T${otherRequest.checkInTime}`
      );
      const otherCheckOut = new Date(
        `${otherRequest.checkOutDate}T${otherRequest.checkOutTime}`
      );

      const isTimeOverlap = !(
        otherCheckOut <=
          new Date(
            `${updatedRequest.checkInDate}T${updatedRequest.checkInTime}`
          ) ||
        otherCheckIn >=
          new Date(
            `${updatedRequest.checkOutDate}T${updatedRequest.checkOutTime}`
          )
      );

      const isPositionConflict =
        otherRequest.position === updatedRequest.position;

      return isTimeOverlap && isPositionConflict;
    });
  };

  const startResize = (type) => (event) => {
    // mousedown грипса не должен доходить до плашки: её handleMouseDown
    // сбрасывает hovered и грипс размонтируется прямо под курсором.
    event.stopPropagation();
    const startX = event.clientX;
    let deltaDays = 0;
    handleResizeStart();

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      deltaDays = Math.round(deltaX / dayW);
      if (deltaDays !== 0) {
        handleResize(type, deltaDays);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      const updatedRequest = handleResize(type, deltaDays);
      handleResizeEnd(updatedRequest);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const [hovered, setHovered] = useState(false);
  const [popPos, setPopPos] = useState(null);
  const pointerStartRef = useRef(null);
  const hoverTimerRef = useRef(null);

  const barRef = useRef(null);
  // Один DOM-узел — один ref: складываем свой ref и ref dnd-kit в колбэк.
  const setRefs = useCallback(
    (node) => {
      barRef.current = node;
      if (!isLegacy && !isOverlay) setNodeRef(node);
    },
    [isLegacy, isOverlay, setNodeRef]
  );

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  useEffect(() => clearHoverTimer, []);

  // Координаты поповера считаем по факту, во вьюпорте: по умолчанию под
  // плашкой, вверх — только если снизу не влезает; по X прижимаем к экрану.
  const resolvePopPos = () => {
    const node = barRef.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    const below = rect.bottom + POPOVER_GAP;
    const top =
      below + POPOVER_HEIGHT > window.innerHeight
        ? rect.top - POPOVER_GAP - POPOVER_HEIGHT
        : below;
    const left = Math.max(
      VIEWPORT_PAD_LEFT,
      Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - VIEWPORT_PAD_RIGHT)
    );
    return { top, left };
  };

  const handleMouseEnter = () => {
    if (isDraggingGlobal || isOverlay || isLegacy) return;
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => {
      const pos = resolvePopPos();
      if (!pos) return;
      setPopPos(pos);
      setHovered(true);
    }, HOVER_DELAY);
  };

  const handleMouseLeave = () => {
    clearHoverTimer();
    setHovered(false);
  };

  useEffect(() => {
    if (isDraggingGlobal) {
      clearHoverTimer();
      setHovered(false);
    }
  }, [isDraggingGlobal]);

  // Поповер лежит в body с position:fixed, поэтому при прокрутке сетки он
  // отвязался бы от плашки — закрываем его на первом же скролле.
  useEffect(() => {
    if (!hovered) return undefined;
    const scroller = barRef.current?.closest("[data-grid-scroll]");
    if (!scroller) return undefined;
    const handleScroll = () => setHovered(false);
    scroller.addEventListener("scroll", handleScroll, { once: true });
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, [hovered]);

  // Свой pointerdown поверх dnd-kit: запоминаем точку нажатия и передаём
  // событие сенсору дальше, иначе перетаскивание перестанет запускаться.
  const handlePointerDown = (event) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    clearHoverTimer();
    setHovered(false);
    listeners?.onPointerDown?.(event);
  };

  // Клик = отпускание рядом с точкой нажатия. Легаси-плашки резерва не
  // открываем: их requestID указывает на резерв, а не на заявку.
  const handlePointerUp = (event) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || isDraggingGlobal || !isRequest) return;
    if (
      Math.abs(event.clientX - start.x) >= CLICK_SLOP ||
      Math.abs(event.clientY - start.y) >= CLICK_SLOP
    ) {
      return;
    }
    toggleRequestSidebar && toggleRequestSidebar(requestID);
  };

  if (!layout && !isOverlay) return null;

  const width = layout ? layout.width : 160;
  const canResize =
    isRequest &&
    status !== "Ожидает" &&
    status !== "Архив" &&
    ((user?.hotelId && hotelAccess) || !user?.hotelId);
  const showGrips = hovered && !isLegacy && canResize;
  const showAvatar = !isLegacy && width > 44 && airline;
  const showName = width > 60;
  const showChip = !isLegacy && width > 185;
  const avatar = airline?.images?.[0] ? getMediaUrl(airline.images[0]) : null;

  const clipL = layout?.clipL;
  const clipR = layout?.clipR;
  // Должность в скобках («КВС (командир)») на плашке не помещается — берём
  // короткую часть, как в старом DraggableRequestV2.
  const shortPosition = guestPosition
    ? String(guestPosition).split("(")[0].trim()
    : "";
  const barLabel = guest
    ? `${guest}${shortPosition ? ` ${shortPosition}` : ""}`
    : "Предварительная бронь";

  const boxStyle = isOverlay
    ? {
        position: "relative",
        width: `${width}px`,
        height: `${BAR_HEIGHT}px`,
        background: style.tint,
        border: `1px solid ${isLegacy ? style.edge : `${style.edge}40`}`,
        borderLeft: `4px solid ${style.edge}`,
        borderRadius: "10px",
        cursor: "grabbing",
        zIndex: 2,
      }
    : {
        position: "absolute",
        top: `${lane * LANE_HEIGHT + 4}px`,
        left: `${layout.left + 2}px`,
        width: `${width}px`,
        height: `${BAR_HEIGHT}px`,
        background: style.tint,
        border: `1px solid ${isLegacy ? style.edge : `${style.edge}40`}`,
        borderLeft: `4px solid ${style.edge}`,
        borderRadius: `${clipL ? 0 : 10}px ${clipR ? 0 : 10}px ${clipR ? 0 : 10}px ${clipL ? 0 : 10}px`,
        opacity: isDragging ? 0 : 1,
        cursor: isLegacy ? "default" : isDragging ? "grabbing" : "grab",
        zIndex: hovered ? 6 : 2,
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      };

  return (
    <div
      ref={setRefs}
      {...(!isOverlay && !isLegacy ? listeners : {})}
      {...(!isOverlay && !isLegacy ? attributes : {})}
      className={`${classes.bar} ${isBlinking ? classes.blink : ""}`}
      style={boxStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={isLegacy || isOverlay ? undefined : handlePointerDown}
      onPointerUp={isLegacy || isOverlay ? undefined : handlePointerUp}
    >
      {clipL ? (
        <span className={classes.clipLeft}>← {layout.clipLLabel}</span>
      ) : null}

      {isLegacy ? (
        <svg
          className={classes.lock}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9aa0b5"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      ) : null}

      {showAvatar ? (
        <span className={classes.avatar}>
          {avatar ? <img src={avatar} alt="" /> : null}
        </span>
      ) : null}

      {showName ? (
        <span
          className={classes.label}
          style={{ color: isLegacy ? "#9aa0b5" : "#2d3147" }}
        >
          {isLegacy ? "Резерв" : barLabel}
        </span>
      ) : null}

      {showChip ? (
        <span
          className={classes.statusChip}
          style={{ color: style.edge, borderColor: `${style.edge}40` }}
        >
          {status}
        </span>
      ) : null}

      {clipR ? (
        <span className={classes.clipRight}>{layout.clipRLabel} →</span>
      ) : null}

      {showGrips ? (
        <>
          <span
            className={`${classes.grip} ${classes.gripLeft}`}
            style={{ borderColor: style.edge }}
            // грипсы лежат внутри draggable-плашки: без остановки pointerdown
            // dnd-kit начал бы перетаскивание вместо ресайза
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={startResize("start")}
          />
          <span
            className={`${classes.grip} ${classes.gripRight}`}
            style={{ borderColor: style.edge }}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={startResize("end")}
          />
        </>
      ) : null}

      {hovered && popPos && !isLegacy && !isDraggingGlobal ? (
        <BarPopover
          request={request}
          style={style}
          top={popPos.top}
          left={popPos.left}
        />
      ) : null}
    </div>
  );
};

export default PlacementBarV2;
