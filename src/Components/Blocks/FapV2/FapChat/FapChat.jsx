import React, { useEffect, useRef, useState } from "react";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_PASSENGER_REQUEST_CHATS,
  REQUEST_MESSAGES_SUBSCRIPTION,
} from "../../../../../graphQL_requests";
import classes from "./FapChat.module.css";
import Message from "../../Message/Message";
import ChatIcon from "../../../../shared/icons/ChatIcon";
import CloseIcon from "../../../../shared/icons/CloseIcon";
import ChevronIcon from "../../../../shared/icons/ChevronIcon";

// Плавающий мини-чат FAP v2 — 3 состояния: 'mini' | 'large' | 'tab'.
// Состояние сохраняется в localStorage и общее для FapDetail/FapServicePage.
const CHAT_MODE_KEY = "fapV2.chatMode";
const CHAT_LEGACY_KEY = "fapV2.chatCollapsed";
const CHAT_POS_KEY = "fapV2.chatPos";

const DEFAULT_POS = { right: 20, bottom: 20 };
const SIZE = {
  mini: { w: 340, h: 460 },
  large: { w: 480, h: 640 },
  tab: { w: 240, h: 44 },
};
const MIN_VISIBLE = 60;

function readMode() {
  if (typeof window === "undefined") return "mini";
  const m = localStorage.getItem(CHAT_MODE_KEY);
  if (m === "mini" || m === "large" || m === "tab") return m;
  const legacy = localStorage.getItem(CHAT_LEGACY_KEY);
  return legacy === "1" ? "tab" : "mini";
}

function writeMode(m) {
  try {
    localStorage.setItem(CHAT_MODE_KEY, m);
    localStorage.setItem(CHAT_LEGACY_KEY, m === "tab" ? "1" : "0");
  } catch { /* ignore */ }
}

function readPos() {
  if (typeof window === "undefined") return DEFAULT_POS;
  try {
    const raw = localStorage.getItem(CHAT_POS_KEY);
    if (!raw) return DEFAULT_POS;
    const p = JSON.parse(raw);
    if (typeof p?.right === "number" && typeof p?.bottom === "number") return p;
  } catch { /* ignore */ }
  return DEFAULT_POS;
}

function writePos(p) {
  try { localStorage.setItem(CHAT_POS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function clampPos(p, size) {
  if (typeof window === "undefined") return p;
  const maxRight = Math.max(0, window.innerWidth - MIN_VISIBLE);
  const maxBottom = Math.max(0, window.innerHeight - MIN_VISIBLE);
  const minRight = MIN_VISIBLE - size.w;
  const minBottom = MIN_VISIBLE - size.h;
  return {
    right: Math.min(maxRight, Math.max(minRight, p.right)),
    bottom: Math.min(maxBottom, Math.max(minBottom, p.bottom)),
  };
}

export default function FapChat({ passengerRequestId, token, user, flightNumber }) {
  const [mode, setMode] = useState(readMode);
  const [pos, setPos] = useState(readPos);
  const dragRef = useRef(null);
  const wasDraggingRef = useRef(false);
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);
  const isExternal = user?.subjectType === "EXTERNAL_USER";

  const { data, refetch } = useQuery(GET_PASSENGER_REQUEST_CHATS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { passengerRequestId },
    fetchPolicy: "network-only",
    skip: !passengerRequestId || isExternal,
  });

  const chat = data?.chats?.[0];
  const unreadCount = chat?.unreadMessagesCount || 0;
  const isTab = mode === "tab";
  const isLarge = mode === "large";

  useSubscription(REQUEST_MESSAGES_SUBSCRIPTION, {
    variables: { chatId: chat?.id },
    skip: !chat?.id,
    onData: () => {
      if (isTab) refetch();
    },
  });

  useEffect(() => {
    if (!isTab && !isExternal && chat?.id) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTab]);

  // Drag-and-drop. Порог 4px отделяет клик от перетаскивания (важно для tab).
  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!wasDraggingRef.current) {
        if (Math.hypot(dx, dy) < 4) return;
        wasDraggingRef.current = true;
        document.body.style.cursor = "grabbing";
      }
      const next = clampPos(
        { right: d.startRight - dx, bottom: d.startBottom - dy },
        d.size,
      );
      setPos(next);
    };
    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      if (wasDraggingRef.current) writePos(posRef.current);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // При смене размера / окне браузера — подтягиваем позицию в границы.
  useEffect(() => {
    const size = SIZE[mode];
    const clamped = clampPos(posRef.current, size);
    if (clamped.right !== posRef.current.right || clamped.bottom !== posRef.current.bottom) {
      setPos(clamped);
      writePos(clamped);
    }
    const onResize = () => {
      const c = clampPos(posRef.current, SIZE[mode]);
      if (c.right !== posRef.current.right || c.bottom !== posRef.current.bottom) {
        setPos(c);
        writePos(c);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mode]);

  const startDrag = (e) => {
    if (e.button !== 0) return;
    // Игнорируем нажатия на дочерние кнопки (chevron / × в title bar).
    // На tab сам элемент — кнопка, и это норм: closest("button") === currentTarget.
    const childBtn = e.target.closest("button");
    if (childBtn && childBtn !== e.currentTarget) return;
    e.preventDefault();
    wasDraggingRef.current = false;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRight: posRef.current.right,
      startBottom: posRef.current.bottom,
      size: SIZE[mode],
    };
    document.body.style.userSelect = "none";
  };

  // Click на tab: открыть mini только если это был именно клик (не drag).
  const handleTabClick = () => {
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }
    setAndSave("mini");
  };

  const setAndSave = (next) => {
    setMode(next);
    writeMode(next);
  };

  const posStyle = { right: `${pos.right}px`, bottom: `${pos.bottom}px` };

  if (isTab) {
    return (
      <button
        type="button"
        className={classes.tab}
        style={posStyle}
        onMouseDown={startDrag}
        onClick={handleTabClick}
        aria-label="Открыть чат"
        title="Открыть чат (зажмите и тяните, чтобы переместить)"
      >
        <ChatIcon />
        <span className={classes.tabLabel}>Чат заявки</span>
        {unreadCount > 0 && (
          <span className={classes.tabBadge} aria-label={`Непрочитанных: ${unreadCount}`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <ChevronIcon className={classes.tabChevron} />
      </button>
    );
  }

  const subtitle = flightNumber ? `Рейс ${flightNumber}` : "";

  return (
    <div
      className={`${classes.window} ${isLarge ? classes.windowLarge : classes.windowMini}`}
      style={posStyle}
      role="dialog"
      aria-label="Чат по заявке"
    >
      <div
        className={classes.titleBar}
        onMouseDown={startDrag}
        onDoubleClick={() => setAndSave(isLarge ? "mini" : "large")}
      >
        <span className={classes.dragGrip} aria-hidden="true">
          <span className={classes.gripDot} />
          <span className={classes.gripDot} />
          <span className={classes.gripDot} />
          <span className={classes.gripDot} />
          <span className={classes.gripDot} />
          <span className={classes.gripDot} />
        </span>
        <ChatIcon className={classes.titleIcon} />
        <span className={classes.titleText}>
          Чат{flightNumber ? ` · ${flightNumber}` : ""}
        </span>
        {unreadCount > 0 && (
          <span className={classes.titleBadge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
        <button
          type="button"
          className={classes.titleBtn}
          onClick={() => setAndSave(isLarge ? "mini" : "large")}
          title={isLarge ? "Уменьшить окно" : "Развернуть окно"}
          aria-label={isLarge ? "Уменьшить окно" : "Развернуть окно"}
        >
          <ChevronIcon className={isLarge ? classes.iconDown : classes.iconUp} />
        </button>
        <button
          type="button"
          className={classes.titleBtn}
          onClick={() => setAndSave("tab")}
          title="Свернуть"
          aria-label="Свернуть"
        >
          <CloseIcon color="#fff" />
        </button>
      </div>
      {subtitle && (
        <div className={classes.subBar}>
          <span className={classes.subDot} />
          {subtitle}
        </div>
      )}
      <div className={classes.body}>
        <Message
          activeTab="Комментарий"
          passengerRequestId={passengerRequestId}
          token={token}
          user={user}
          chatPadding="0"
          chatHeight="100%"
        />
      </div>
    </div>
  );
}
