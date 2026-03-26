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
  editLabel = "Редактировать",
  deleteLabel = "Удалить",
  showEditIcon = true,
  showDeleteIcon = true,
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
          {showEditIcon && <EditIcon />}
          {editLabel}
        </MenuItem>
        {onDelete && (
          <MenuItem
            className={`${classes.item} ${classes.itemDanger}`}
            onClick={() => {
              onClose();
              onDelete();
            }}
          >
            {showDeleteIcon && <CancelIcon />}
            {deleteLabel}
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

export default AdditionalMenu;
