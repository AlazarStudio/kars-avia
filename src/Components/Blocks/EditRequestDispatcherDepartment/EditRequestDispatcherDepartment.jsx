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

function EditRequestDispatcherDepartment({
  show,
  onClose,
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
    if (!isEdited) {
      resetForm();
      onClose();
      return;
    }
    if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
      resetForm();
      onClose();
    }
  }, [isEdited, resetForm, onClose]);

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
    e.preventDefault();
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
            accessMenu: department?.accessMenu || {},
          },
        },
      });

      if (response?.data?.updateDispatcherDepartment) {
        onUpdated?.(response.data.updateDispatcherDepartment);
        resetForm();
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
  }, [show, closeButton]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Изменить отдел</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="Закрыть" />
        </div>
      </div>
      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Название отдела</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Пример: Отдел продаж"
                disabled={!isEditing}
              />

              <label>Почта</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@mail.ru"
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className={classes.requestButton}>
            <Button
              onClick={handleSubmit}
              backgroundcolor={!isEditing ? "#3CBC6726" : "#0057C3"}
              color={!isEditing ? "#3B6C54" : "#fff"}
            >
              {isEditing ? (
                <>
                  Сохранить <img src="/saveDispatcher.png" alt="" />
                </>
              ) : (
                <>
                  Изменить <img src="/editDispetcher.png" alt="" />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default EditRequestDispatcherDepartment;
