import React, { useState } from "react";
import { Popover } from "@mui/material";
import ChevronIcon from "../../../shared/icons/ChevronIcon";
import { STATUS_STYLES, getStatusStyle } from "../utils/placementStatusStyles";
import classes from "./BoardToolbar.module.css";

// Порядок легенды — из макета: «Создан» описывает карточки лотка
// (внутренний статус «Ожидает» не переименовываем).
const LEGEND_ITEMS = [
  { name: "Создан", style: getStatusStyle("Ожидает") },
  { name: "Забронирован" },
  { name: "Продлен" },
  { name: "Ранний заезд" },
  { name: "Перенесен" },
  { name: "Сокращен" },
  { name: "Готов к архиву" },
  { name: "Архив" },
].map((item) => ({ ...item, style: item.style || STATUS_STYLES[item.name] }));

const BoardToolbar = ({
  searchQuery,
  onSearch,
  trayOpen,
  onToggleTray,
  trayCount,
  onCreateRequest,
  canCreate,
}) => {
  const [legendAnchorEl, setLegendAnchorEl] = useState(null);
  const legendOpen = Boolean(legendAnchorEl);

  const handleToggleLegend = (event) => {
    setLegendAnchorEl(legendAnchorEl ? null : event.currentTarget);
  };

  const handleCloseLegend = () => {
    setLegendAnchorEl(null);
  };

  return (
    <div className={classes.toolbar}>
      <div className={classes.search}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9aa0b5"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={classes.searchInput}
          type="text"
          value={searchQuery}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Поиск: номер комнаты или ФИО гостя"
        />
      </div>

      <div className={classes.actions}>
        <button
          type="button"
          className={classes.button}
          style={{ background: legendOpen ? "#eef1f7" : "#fff" }}
          onClick={handleToggleLegend}
        >
          <span className={classes.legendDots}>
            <span style={{ background: "#2e7d32" }} />
            <span style={{ background: "#0057C3" }} />
            <span style={{ background: "#C03B28" }} />
          </span>
          Легенда
          <ChevronIcon
            width="10"
            height="10"
            stroke="#9aa0b5"
            strokeWidth="2.5"
            style={{
              transform: legendOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>

        <button
          type="button"
          className={classes.button}
          style={{
            background: trayOpen ? "#e7effa" : "#fff",
            borderColor: trayOpen ? "#0057C355" : "#e8eaf1",
            color: "#2d3147",
          }}
          onClick={onToggleTray}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0057C3"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 10h18" />
          </svg>
          Неразмещённые
          <span className={classes.trayBadge}>{trayCount}</span>
        </button>

        {canCreate && onCreateRequest ? (
          <button
            type="button"
            className={classes.createButton}
            onClick={onCreateRequest}
          >
            Создать заявку
          </button>
        ) : null}
      </div>

      <Popover
        open={legendOpen}
        anchorEl={legendAnchorEl}
        onClose={handleCloseLegend}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            style: {
              width: 200,
              borderRadius: 12,
              border: "1px solid #e8eaf1",
              boxShadow: "0 4px 14px rgba(0,0,0,.15)",
              marginTop: 6,
              padding: 14,
            },
          },
        }}
      >
        <div className={classes.legendTitle}>Статусы броней</div>
        <div className={classes.legendList}>
          {LEGEND_ITEMS.map((item) => (
            <div key={item.name} className={classes.legendRow}>
              <span
                className={classes.legendSwatch}
                style={{
                  background: item.style.tint,
                  borderLeft: `4px solid ${item.style.edge}`,
                }}
              />
              <span className={classes.legendName}>{item.name}</span>
            </div>
          ))}
        </div>
      </Popover>
    </div>
  );
};

export default BoardToolbar;
