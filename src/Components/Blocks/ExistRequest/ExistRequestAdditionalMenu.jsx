import React from "react";
import { Link } from "react-router-dom";
import { Menu, MenuItem } from "@mui/material";
import AdditionalMenuIcon from "../../../shared/icons/AdditionalMenuIcon";
import ShahmatkaIcon from "../../../shared/icons/ShahmatkaIcon";
import EditIcon from "../../../shared/icons/EditIcon";
import CancelIcon from "../../../shared/icons/CancelIcon";
import { isAirlineAdmin } from "../../../utils/access";
import classes from "./ExistRequestAdditionalMenu.module.css";

function ExistRequestAdditionalMenu({
  anchorEl,
  onOpen,
  onClose,
  menuRef,
  formData,
  user,
  canUpdateActions,
  activeTab,
  onEdit,
  onCancelRequest,
  onCloseSidebar,
}) {
  const showShahmatka =
    !isAirlineAdmin(user) &&
    formData.status !== "created" &&
    formData.status !== "opened" &&
    formData.status !== "canceled";

  const showEdit =
    canUpdateActions &&
    formData.status !== "created" &&
    formData.status !== "opened" &&
    formData.status !== "canceled";

  const showCancel =
    canUpdateActions &&
    formData.status !== "created" &&
    formData.status !== "opened" &&
    formData.status !== "canceled" &&
    formData.status !== "archived" &&
    activeTab !== "Комментарии" &&
    activeTab !== "История";

  const cancelLabel =
    user?.airlineId &&
    formData.status !== "archived" &&
    formData.status !== "archiving"
      ? "Запрос на отмену"
      : "Отменить заявку";

  const handleGoToShahmatka = () => {
    localStorage.setItem("selectedTab", 0);
    onClose();
    onCloseSidebar();
  };

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
        // MenuListProps={{
        //   disablePadding: true,
        // }}
      >
        {showShahmatka && (
          <MenuItem
            className={classes.item}
            component={Link}
            to={`/hotels/${formData.hotelId}/${formData.id}`}
            onClick={handleGoToShahmatka}
          >
            <ShahmatkaIcon />
            Перейти в шахматку
          </MenuItem>
        )}
        {showEdit && (
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
        {showCancel && (
          <MenuItem
            className={`${classes.item} ${classes.itemDanger}`}
            onClick={() => {
              onClose();
              onCancelRequest();
            }}
          >
            <CancelIcon />
            {cancelLabel}
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

export default ExistRequestAdditionalMenu;
