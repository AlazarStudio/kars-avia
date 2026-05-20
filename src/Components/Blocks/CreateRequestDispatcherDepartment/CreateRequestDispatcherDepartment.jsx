import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestDispatcherDepartment.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_DISPATCHER_DEPARTMENT,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader";
import CloseIcon from "../../../shared/icons/CloseIcon";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

const ALL_ACCESS_ENABLED = {
  requestMenu: true, requestCreate: true, requestUpdate: true, requestChat: true,
  transferMenu: true, transferCreate: true, transferUpdate: true, transferChat: true,
  personalMenu: true, personalCreate: true, personalUpdate: true,
  reserveMenu: true, reserveCreate: true, reserveUpdate: true,
  analyticsMenu: true, analyticsUpload: true,
  reportMenu: true, reportCreate: true,
  userMenu: true, userCreate: true, userUpdate: true,
  airlineMenu: true, airlineUpdate: true,
  contracts: true, contractCreate: true, contractUpdate: true,
  organizationMenu: true, organizationCreate: true, organizationUpdate: true,
  organizationAddDrivers: true, organizationAcceptDrivers: true,
};

const ALL_NOTIFICATIONS_ENABLED = {
  requestCreate: true, emailRequestCreate: true, sitePushRequestCreate: true,
  requestDatesChange: true, emailRequestDatesChange: true, sitePushRequestDatesChange: true,
  requestPlacementChange: true, emailRequestPlacementChange: true, sitePushRequestPlacementChange: true,
  requestCancel: true, emailRequestCancel: true, sitePushRequestCancel: true,
  passengerRequestCreate: true, emailPassengerRequestCreate: true, sitePushPassengerRequestCreate: true,
  passengerRequestDatesChange: true, emailPassengerRequestDatesChange: true, sitePushPassengerRequestDatesChange: true,
  passengerRequestUpdate: true, emailPassengerRequestUpdate: true, sitePushPassengerRequestUpdate: true,
  passengerRequestPlacementChange: true, emailPassengerRequestPlacementChange: true, sitePushPassengerRequestPlacementChange: true,
  passengerRequestCancel: true, emailPassengerRequestCancel: true, sitePushPassengerRequestCancel: true,
  newMessage: true, emailNewMessage: true, sitePushNewMessage: true,
};

function CreateRequestDispatcherDepartment({
  show,
  onClose,
  onCreated,
}) {
  const token = getCookie("token");
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();
  const [isEdited, setIsEdited] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({ name: "", email: "" });
    setIsEdited(false);
  }, []);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    if (!isEdited) {
      resetForm();
      onClose();
      return;
    }

    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) {
      resetForm();
      onClose();
    }
  }, [isEdited, resetForm, onClose, confirm, isDialogOpen]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const [createDispatcherDepartment] = useMutation(
    CREATE_DISPATCHER_DEPARTMENT,
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
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name.trim()) {
      showAlert("Пожалуйста, введите название отдела.");
      setIsLoading(false);
      return;
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showAlert("Введите корректный email.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await createDispatcherDepartment({
        variables: {
          input: {
            name: formData.name,
            email: formData.email || null,
            accessMenu: ALL_ACCESS_ENABLED,
            notificationMenu: ALL_NOTIFICATIONS_ENABLED,
          },
        },
      });

      if (response?.data?.createDispatcherDepartment) {
        onCreated?.(response.data.createDispatcherDepartment);
        resetForm();
        onClose();
        success("Добавление отдела прошло успешно.");
      }
    } catch (err) {
      setIsLoading(false);
      notifyError("Произошла ошибка при сохранении данных");
      console.error("catch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;

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
  }, [show, closeButton, isDialogOpen]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить отдел</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Название</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Пример: Отдел продаж"
              />

              <label>Почта</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@mail.ru"
              />
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Добавить
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default CreateRequestDispatcherDepartment;
