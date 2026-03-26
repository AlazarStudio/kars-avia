import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestDispatcherDepartment.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  UPDATE_DISPATCHER_DEPARTMENT,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import CloseIcon from "../../../shared/icons/CloseIcon";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";

function EditRequestDispatcherDepartment({
  show,
  onClose,
  refetchDepartments,
  department,
  onUpdated,
  addNotification,
}) {
  const token = getCookie("token");
  const [isEdited, setIsEdited] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: department?.name || "",
    email: department?.email || "",
  });

  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (show && department) {
      setFormData({
        name: department.name || "",
        email: department.email || "",
      });
    }
  }, [show, department]);

  const resetForm = useCallback(() => {
    setFormData({
      name: department?.name || "",
      email: department?.email || "",
    });
    setIsEdited(false);
  }, [department]);

  const closeButton = useCallback(() => {
    setAnchorEl(null);
    if (!isEdited) {
      resetForm();
      onClose();
      setIsEditing(false);
      return;
    }
    if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
      resetForm();
      onClose();
      setIsEditing(false);
    }
  }, [isEdited, resetForm, onClose]);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => {
    handleMenuClose();
    setIsEditing(true);
  };
  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const [updateDispatcherDepartment] = useMutation(
    UPDATE_DISPATCHER_DEPARTMENT,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    e?.preventDefault?.();
    setIsLoading(true);

    if (!formData.name.trim()) {
      alert("Пожалуйста, введите название отдела.");
      setIsLoading(false);
      return;
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert("Введите корректный email.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await updateDispatcherDepartment({
        variables: {
          updateDispatcherDepartmentId: department?.id,
          input: {
            name: formData.name,
            email: formData.email || null,
            // accessMenu: department?.accessMenu || {},
          },
        },
      });

      if (response?.data?.updateDispatcherDepartment) {
        onUpdated?.(response.data.updateDispatcherDepartment);
        refetchDepartments?.();
        setFormData({
          name: formData.name.trim(),
          email: formData.email?.trim() || "",
        });
        setIsEdited(false);
        addNotification?.("Редактирование отдела прошло успешно.", "success");
      }
    } catch (err) {
      alert("Произошла ошибка при сохранении данных");
      console.error(err);
    } finally {
      setIsEditing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (anchorEl && menuRef.current?.contains(event.target)) {
        setAnchorEl(null);
        return;
      }
      if (sidebarRef.current?.contains(event.target)) {
        return;
      }
      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, closeButton, anchorEl]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Изменить отдел</div>
        <div className={classes.requestTitle_close}>
          <AdditionalMenu
            anchorEl={anchorEl}
            onOpen={handleMenuOpen}
            onClose={handleMenuClose}
            menuRef={menuRef}
            onEdit={handleEditFromMenu}
          />
          <div className={classes.closeIconWrapper} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>
      </div>
      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Название отдела
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Пример: Отдел продаж"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.name || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Почта</div>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@mail.ru"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.email || "—"}
                  </div>
                )}
              </div>
            </div>
          </div>
          {isEditing && (
            <div className={classes.requestButton}>
              <Button
                onClick={handleCancelEdit}
                backgroundcolor="var(--hover-gray)"
                color="#000"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                backgroundcolor="#0057C3"
                color="#fff"
              >
                Сохранить <img src="/saveDispatcher.png" alt="" />
              </Button>
            </div>
          )}
        </>
      )}
    </Sidebar>
  );
}

export default EditRequestDispatcherDepartment;
