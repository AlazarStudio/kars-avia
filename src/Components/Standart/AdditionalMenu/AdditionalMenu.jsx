import React from "react";
import { Menu, MenuItem } from "@mui/material";
import AdditionalMenuIcon from "../../../shared/icons/AdditionalMenuIcon";
import EditIcon from "../../../shared/icons/EditIcon";
import CancelIcon from "../../../shared/icons/CancelIcon";
import classes from "./AdditionalMenu.module.css";

function AdditionalMenu({
  anchorEl,
  onOpen,
  onClose,
  menuRef,
  onEdit,
  onDelete,
}) {
  return (
    <>
      <div className={classes.trigger} onClick={onOpen}>
        <AdditionalMenuIcon />
      </div>
      <Menu
        ref={menuRef}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
        disableAutoFocusItem
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          className: classes.paper,
        }}
      >
        <MenuItem
          className={classes.item}
          onClick={() => {
            onClose();
            onEdit();
          }}
        >
          <EditIcon />
          Редактировать
        </MenuItem>
        {onDelete && (
          <MenuItem
            className={`${classes.item} ${classes.itemDanger}`}
            onClick={() => {
              onClose();
              onDelete();
            }}
          >
            <CancelIcon />
            Удалить
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

export default AdditionalMenu;
