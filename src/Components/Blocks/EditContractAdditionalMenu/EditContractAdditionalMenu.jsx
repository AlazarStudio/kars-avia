import React from "react";
import { Menu, MenuItem } from "@mui/material";
import AdditionalMenuIcon from "../../../shared/icons/AdditionalMenuIcon";
import EditIcon from "../../../shared/icons/EditIcon";
import CancelIcon from "../../../shared/icons/CancelIcon";
import classes from "./EditContractAdditionalMenu.module.css";

function EditContractAdditionalMenu({
  anchorEl,
  onOpen,
  onClose,
  menuRef,
  canEdit,
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
        sx={{ zIndex: 10050 }}
        PaperProps={{
          className: classes.paper,
        }}
      >
        {canEdit && (
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
        )}
        {canEdit && (
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

export default EditContractAdditionalMenu;
