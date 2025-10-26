import React, { useState } from "react";
import classes from "./StatusLegend.module.css";
import { Menu, MenuItem } from "@mui/material";
import Button from "../../Standart/Button/Button";

function StatusLegend({ children, ...props }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setOpen(false);
  };
  return (
    <>
      <button
        className={`${classes.downloadsButton} ${anchorEl ? classes.open : ""}`}
        onClick={handleMenuOpen}
      >
        Легенда
        <span
          style={{
            display: "inline-block",
            transform: anchorEl ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            fontSize: "12px",
          }}
        >
          ▼
        </span>
      </button>
      <Menu
        id="legend-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            borderRadius: 10,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            // padding: "8px 0",
            width: 160,
            boxShadow: "1px 8px 12px rgba(0,0,0,0.1)",
          },
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <MenuItem className={classes.menuItem}>
          <div
            className={classes.legendInfoColor}
            style={{ backgroundColor: "#9e9e9e" }}
          ></div>
          <div className={classes.legendInfoText}>Создан</div>
        </MenuItem>
        <MenuItem className={classes.menuItem}>
          <div
            className={classes.legendInfoColor}
            style={{ backgroundColor: "#2196f3" }}
          ></div>
          <div className={classes.legendInfoText}>Продлен</div>
        </MenuItem>
        <MenuItem className={classes.menuItem}>
          <div
            className={classes.legendInfoColor}
            style={{ backgroundColor: "#4caf50" }}
          ></div>
          <div className={classes.legendInfoText}>Забронирован</div>
        </MenuItem>
        <MenuItem className={classes.menuItem}>
          <div
            className={classes.legendInfoColor}
            style={{ backgroundColor: "#9575cd" }}
          ></div>
          <div className={classes.legendInfoText}>Ранний заезд</div>
        </MenuItem>
        <MenuItem className={classes.menuItem}>
          <div
            className={classes.legendInfoColor}
            style={{ backgroundColor: "#ff9800" }}
          ></div>
          <div className={classes.legendInfoText}>Перенесен</div>
        </MenuItem>
        <MenuItem className={classes.menuItem}>
          <div
            className={classes.legendInfoColor}
            style={{ backgroundColor: "#f44336" }}
          ></div>
          <div className={classes.legendInfoText}>Сокращен</div>
        </MenuItem>
        <MenuItem className={classes.menuItem}>
          <div
            className={classes.legendInfoColor}
            style={{ backgroundColor: "#638ea4" }}
          ></div>
          <div className={classes.legendInfoText}>Готов к архиву</div>
        </MenuItem>
        <MenuItem className={classes.menuItem}>
          <div
            className={classes.legendInfoColor}
            style={{ backgroundColor: "#3b653d" }}
          ></div>
          <div className={classes.legendInfoText}>Архив</div>
        </MenuItem>
      </Menu>
    </>
  );
}

export default StatusLegend;
