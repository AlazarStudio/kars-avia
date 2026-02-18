import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestAirlineStaff.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_AIRLINE_STAFF,
  decodeJWT,
  GET_AIRLINES_RELAY,
  getCookie,
} from "../../../../graphQL_requests";
import { useMutation } from "@apollo/client";
import DropDownList from "../DropDownList/DropDownList";
import MUILoader from "../MUILoader/MUILoader";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { InputMask } from "@react-input/mask";
import { positions } from "../../../roles";
import CloseIcon from "../../../shared/icons/CloseIcon";

function CreateRequestAirlineStaff({
  show,
  onClose,
  id,
  addTarif,
  setAddTarif,
  airlineRefetch,
  setSelectedAirline,
  addNotification,
  positions,
  setNewStaffId,
  isExist,
}) {
  const [userRole, setUserRole] = useState();
  const [isEdited, setIsEdited] = useState(false);
  const token = getCookie("token");

  useEffect(() => {
    setUserRole(decodeJWT(token).role);
  }, [token]);

  const [formData, setFormData] = useState({
    name: "",
    number: "",
    position: "",
    gender: "",
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      number: "",
      position: "",
      gender: "",
    });
    setIsEdited(false); // Сбрасываем флаг изменений
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

  const [createAirlineStaff] = useMutation(CREATE_AIRLINE_STAFF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
    refetchQueries: [{ query: GET_AIRLINES_RELAY }],
  });

  const isFormValid = () => {
    return (
      formData.name && formData.number && formData.position && formData.gender
    );
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isFormValid()) {
      alert("Пожалуйста, заполните все обязательные поля.");
      setIsLoading(false);
      return;
    }

    // Проверка на заполненность полей
    // const requiredFields = ["name", "number", "position", "gender"];
    // const emptyFields = requiredFields.filter(
    //   (field) => !formData[field]?.trim()
    // );

    // if (emptyFields.length > 0) {
    //   alert("Пожалуйста, заполните все обязательные поля.");
    //   return;
    // }

    try {
      const selectedPosition = positions.find(
        (position) => position.name === formData.position
      );
      let request = await createAirlineStaff({
        variables: {
          updateAirlineId: id,
          input: {
            staff: [
              {
                name: formData.name,
                number: formData.number,
                positionId: selectedPosition?.id,
                gender: formData.gender,
              },
            ],
          },
        },
      });

      if (request.data) {
        // console.log(request.data.updateAirline.staff.at(-1));
        setNewStaffId
          ? setNewStaffId(
            isExist
              ? request.data.updateAirline.staff.at(-1)
              : request.data.updateAirline.staff.at(-1).id
          )
          : null;

        airlineRefetch ? airlineRefetch() : null;

        setAddTarif
          ? setAddTarif(
            request.data.updateAirline.staff.sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          )
          : null;

        resetForm();
        onClose();
        // setSelectedAirline ? setSelectedAirline(null) : null;
        addNotification
          ? addNotification("Сотрудник добавлен успешно.", "success")
          : null;
        setIsLoading(false);
        // airlineRefetch ? airlineRefetch() : null;
      }
    } catch (err) {
      alert("Произошла ошибка при сохранении данных");
      console.error(err);
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

  const genders = ["Мужской", "Женский"];

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить сотрудника</div>
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
              <label>Фамилия И.О.</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Пример: Иванов И.И."
                autoComplete="new-password"
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
              />

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
              />

              <label>Пол</label>

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

export default CreateRequestAirlineStaff;
