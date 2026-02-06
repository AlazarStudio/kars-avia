import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./AddDriverToOrganization.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_DISPATCHER_USER,
  getCookie,
  UPDATE_DRIVER_MUTATION,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { rolesObject } from "../../../roles";
import MultiSelectAutocomplete from "../MultiSelectAutocomplete/MultiSelectAutocomplete";
import CloseIcon from "../../../shared/icons/CloseIcon";

function AddDriverToOrganization({
  show,
  onClose,
  orgId,
  addDispatcher,
  addNotification,
  positions,
  drivers,
}) {
  const token = getCookie("token");

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    driverIds: [],
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      driverIds: [],
    });
    setIsEdited(false); // Сброс флага изменений
  }, []);

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
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const [uploadFile, { data, loading, error }] = useMutation(
    UPDATE_DRIVER_MUTATION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          // "Apollo-Require-Preflight": "true",
        },
      },
    }
  );

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setIsLoading(true);

    try {
      if (!orgId) {
        addNotification?.("Нет orgId", "error");
        return;
      }

      const ids = formData.driverIds || [];
      if (!ids.length) {
        addNotification?.("Выберите хотя бы одного водителя", "warning");
        return;
      }

      // ✅ цикл: обновляем каждого водителя
      const results = [];
      for (const driverId of ids) {
        const res = await uploadFile({
          variables: {
            updateDriverId: driverId, // <-- ВАЖНО: не пустая строка
            input: {
              organizationId: orgId,
              organizationConfirmed: true,
            },
          },
        });

        results.push(res);
      }

      // если нужно обновить список/состояние — делай тут
      // addDispatcher тут не подходит, потому что это updateDriver, а не registerUser

      resetForm();
      onClose();
      addNotification?.(`Добавлено водителей: ${ids.length}`, "success");
    } catch (err) {
      console.error(err);
      addNotification?.("Ошибка при добавлении водителей", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current?.contains(event.target) // Клик в боковой панели
      ) {
        return; // Если клик внутри, ничего не делаем
      }

      // Если клик был вне боковой панели, то закрываем её
      closeButton();
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Очистка эффекта при демонтировании компонента
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  const filteredDrivers =
    drivers
      ?.filter((i) => i.organizationId === null)
      ?.map((i) => ({
        id: i.id,
        label: `${i.name}, машина: ${i.car}`,
        // car: i.car,
      })) || [];
  // console.log(drivers);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить водителей</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Водители</label>
              <MultiSelectAutocomplete
                isMultiple={true}
                dropdownWidth={"100%"}
                label={"Выберите водителей"}
                options={filteredDrivers}
                value={filteredDrivers.filter((option) =>
                  formData.driverIds?.includes(option.id)
                )}
                onChange={(event, newValue) => {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    driverIds: newValue.map((option) => option.id),
                    // city: newValue.length > 0 ? newValue[0].city : "",
                  }));
                  // setIsEdited(true);
                }}
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

export default AddDriverToOrganization;
