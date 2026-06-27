import React, { useState } from "react";
import { Popover } from "@mui/material";
import TuneIcon from "../../../shared/icons/TuneIcon";
import classes from "./FilterPopoverButton.module.css";

// Единая кнопка-фильтр: квадратная иконка (TuneIcon) открывает MUI Popover
// с переданными фильтрами (children). Бейдж показывает число активных
// фильтров, «Сбросить» вызывает onReset и закрывает поповер.
// Сам держит anchorEl — экранам своё состояние не нужно.
function FilterPopoverButton({
  activeCount = 0,
  onReset,
  title = "Фильтры",
  width = 320,
  children,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const close = () => setAnchorEl(null);
  const handleReset = () => {
    if (onReset) onReset();
    close();
  };

  return (
    <>
      <button
        type="button"
        aria-label={title}
        className={`${classes.filterButton} ${activeCount > 0 ? classes.filterButtonActive : ""}`}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <TuneIcon />
        {activeCount > 0 && (
          <span className={classes.filterBadge}>{activeCount}</span>
        )}
      </button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: "8px",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(20, 24, 42, 0.12)",
              overflow: "visible",
            },
          },
        }}
      >
        <div className={classes.filterPopover} style={{ width }}>
          <div className={classes.filterPopoverHeader}>
            <span>{title}</span>
            {activeCount > 0 && (
              <button
                type="button"
                className={classes.filterReset}
                onClick={handleReset}
              >
                Сбросить
              </button>
            )}
          </div>
          {children}
        </div>
      </Popover>
    </>
  );
}

export default FilterPopoverButton;
