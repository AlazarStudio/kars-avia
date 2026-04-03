import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./UpdateRequestAirlineStaff.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  decodeJWT,
  getCookie,
  UPDATE_AIRLINE_STAFF,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import MUILoader from "../MUILoader/MUILoader";
import { InputMask } from "@react-input/mask";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { menuAccess, positions } from "../../../roles";
import CloseIcon from "../../../shared/icons/CloseIcon";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function UpdateRequestAirlineStaff({
  show,
  onClose,
  id,
  user,
  accessMenu,
  selectedStaff,
  setAddTarif,
  setShowDelete,
  setDeleteIndex,
  positions,
}) {
  const { confirm, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();

  // const [userRole, setUserRole] = useState();
  const token = getCookie("token");
  const [isEditing, setIsEditing] = useState(false);

  // useEffect(() => {
  //   setUserRole(decodeJWT(token).role);
  // }, [token]);

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    id: selectedStaff?.id || "",
    name: selectedStaff?.name || "",
    number: selectedStaff?.number || "",
    position: selectedStaff?.position?.name || "",
    gender: selectedStaff?.gender || "",
  });

  const sidebarRef = useRef();

  useEffect(() => {
    if (show && selectedStaff) {
      setFormData({
        id: selectedStaff.id,
        name: selectedStaff.name,
        number: selectedStaff.number,
        position: selectedStaff?.position?.name || "",
        gender: selectedStaff.gender,
      });
    }
  }, [show, selectedStaff]);

  const resetForm = useCallback(() => {
    setFormData({
      id: selectedStaff?.id || "",
      name: selectedStaff?.name || "",
      number: selectedStaff?.number || "",
      position: selectedStaff?.position?.name || "",
      gender: selectedStaff?.gender || "",
    });
    setIsEdited(false); // Сброс флага изменений
    setIsEditing(false);
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
  }, [confirm, isDialogOpen, isEdited, onClose, resetForm]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const [updateAirlineStaff] = useMutation(UPDATE_AIRLINE_STAFF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (isEditing) {
      e.preventDefault();
      setIsLoading(true);
      try {
        const selectedPosition = positions.find(
          (position) => position.name === formData.position
        );
        let request = await updateAirlineStaff({
          variables: {
            updateAirlineId: id,
            input: {
              staff: [
                {
                  id: formData.id,
                  name: formData.name,
                  number: formData.number,
                  positionId: selectedPosition?.id,
                  gender: formData.gender,
                },
              ],
            },
          },
        });

        if (request) {
          // setAddTarif(
          //   request.data.updateAirline.staff.sort((a, b) =>
          //     a.name.localeCompare(b.name)
          //   )
          // );

          resetForm();
          onClose();
          setIsLoading(false);
          success("Редактирование прошло успешно.");
        }
      } catch (err) {
        setIsLoading(false);
        notifyError("Произошла ошибка при сохранении данных");
      }
    }
    setIsEditing(!isEditing);
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

  // let positions = [
  //   "КАЭ (Капитан Эскадрильи)",
  //   "КВС (Командир воздушного судна)",
  //   "ВП (Второй пилот)",
  //   "СПБ (Старший бортпроводник)",
  //   "ИБП (Инструктор-бортпроводник)",
  //   "БП (бортпроводник)",
  //   "СА (сотрудник авиакомпании) ",
  //   "Зам. Дир. (заместитель директора)",
  //   "Инженер",
  // ];

  // let positions = [
  //   "КАЭ",
  //   "КВС",
  //   "ВП",
  //   "СБ",
  //   "ИБП",
  //   "БП",
  //   "СА",
  //   "Зам. Дир.",
  //   "Инженер",
  // ];

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Изменить сотрудника</div>
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
              <label>ФИО</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Пример: Иванов Иван Иванович"
                disabled={!isEditing}
              />

              <label>Номер телефона</label>
              <InputMask
                type="text"
                mask="+7 (___) ___-__-__"
                replacement={{ _: /\d/ }}
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="+7 (___) ___-__-__"
                autoComplete="new-password"
                disabled={!isEditing}
              />
              {/* <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="Пример: 89283521345"
              /> */}

              <label>Должность</label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите должность"}
                options={positions?.map((position) => position.name)}
                value={formData.position}
                onChange={(event, newValue) => {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    position: newValue,
                  }));
                  setIsEdited(true);
                }}
                isDisabled={!isEditing}
              />

              <label>Пол</label>
              {/* <DropDownList
                placeholder="Выберите пол"
                searchable={false}
                options={["Мужской", "Женский"]}
                initialValue={formData.gender}
                onSelect={(value) => {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    gender: value,
                  }));
                  setIsEdited(true);
                }}
              /> */}

              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите пол"}
                options={["Мужской", "Женский"]}
                value={formData.gender}
                onChange={(event, newValue) => {
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    gender: newValue,
                  }));
                  setIsEdited(true);
                }}
                isDisabled={!isEditing}
              />
            </div>
          </div>
          {(!user?.airlineId || accessMenu?.personalUpdate) && (
            <div className={classes.requestButton}>
              {/* <Button
                type="submit"
                backgroundcolor={"#ff5151"}
                onClick={() => {
                  setDeleteIndex(selectedStaff);
                  setShowDelete(true);
                  onClose();
                }}
              >
                Удалить
              </Button> */}
              <Button
                onClick={() => {
                  setDeleteIndex(selectedStaff);
                  setShowDelete(true);
                  onClose();
                }}
                backgroundcolor={"#FF9C9C"}
              >
                Удалить <img src="/delete.png" alt="" />
              </Button>
              <Button
                type="submit"
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
          )}
        </>
      )}
    </Sidebar>
  );
}

export default UpdateRequestAirlineStaff;
