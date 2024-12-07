import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestReport.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_REPORT,
  decodeJWT,
  GET_AIRLINES_RELAY,
  GET_HOTELS_RELAY,
  getCookie,
} from "../../../../graphQL_requests";
import DropDownList from "../DropDownList/DropDownList";
import Swal from "sweetalert2";

function CreateRequestReport({ show, onClose, addDispatcher }) {
  const token = getCookie("token");
  const user = decodeJWT(token);

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    // airline: '',
    // airlineImg: '',
    // dateFormirovania: '',
    startDate: "",
    endDate: "",
    airlineId: user.airlineId ? user.airlineId : "",
    hotelId: user.hotelId ? user.hotelId : "",
  });

  const [airlines, setAirlines] = useState([]);
  const [airOrHotel, setAirOrHotel] = useState("");
  const [selectedAirline, setSelectedAirline] = useState(null);

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      startDate: "",
      endDate: "",
      airlineId: user.airlineId ? user.airlineId : "",
      hotelId: user.hotelId ? user.hotelId : "",
    });
    setAirOrHotel("");
    setIsEdited(false); // Сброс флага изменений
  }, [user.airlineId, user.hotelId]);

  const closeButton = useCallback(() => {
    if (!isEdited) {
      resetForm();
      onClose();
      return;
    }

    Swal.fire({
      title: "Вы уверены?",
      text: "Все несохраненные данные будут удалены.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Да",
      cancelButtonText: "Нет",
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        confirmButton: "swal_confirm",
        cancelButton: "swal_cancel",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        resetForm();
        onClose();
      }
    });
  }, [isEdited, resetForm, onClose]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Месяцы в JavaScript начинаются с 0
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        airlineImg: file.name,
      }));
    }
  };

  const { data } = useQuery(
    airOrHotel === "airline" ? GET_AIRLINES_RELAY : GET_HOTELS_RELAY
  );

  const selectData = airOrHotel === "airline" ? data?.airlines : data?.hotels;

  useEffect(() => {
    setAirlines(selectData);
  }, [selectData]);

  // Мутация для создания нового отчета
  const [createReport] = useMutation(CREATE_REPORT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const isFormValid = () => {
    return (
      formData.startDate &&
      formData.endDate &&
      (formData.airlineId || formData.hotelId)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      Swal.fire({
        title: "Ошибка!",
        text: "Пожалуйста, заполните все обязательные поля.",
        icon: "error",
        confirmButtonText: "Ок",
        customClass: {
          confirmButton: "swal_confirm",
        },
      });
      return;
    }

    const input = {
      filter: {
        startDate: formData.startDate,
        endDate: formData.endDate,
        airlineId: formData.airlineId,
        hotelId: formData.hotelId,
      },
      format: "xlsx",
      type: airOrHotel === "airline" ? "airline" : "hotel",
    };

    try {
      await createReport({ variables: { input } });
      resetForm();
      onClose();
    } catch (error) {
      console.error("Catch: ", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Проверяем, был ли клик внутри боковой панели или SweetAlert2
      if (
        document.querySelector(".swal2-container")?.contains(event.target) || // Клик в SweetAlert2
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

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить отчет</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      <div className={classes.requestMiddle}>
        <div className={classes.requestData}>
          {/* <label>Авиакомпания</label>
                    <input type="text" name="airline" placeholder="Авиакомпания" value={formData.airline} onChange={handleChange} /> */}

          {user.airlineId || user.hotelId ? null : (
            <>
              <label>Авиакомпания или гостиница</label>
              <DropDownList
                placeholder="Выберите тип отчета"
                searchable={false}
                options={["Авиакомпания", "Гостиница"]}
                initialValue={
                  airOrHotel
                    ? airOrHotel === "airline"
                      ? "Авиакомпания"
                      : "Гостиница"
                    : ""
                }
                onSelect={(value) => {
                  setAirOrHotel(value === "Авиакомпания" ? "airline" : "hotel");
                  setIsEdited(true);
                }}
              />

              {airOrHotel === "airline" ? (
                <>
                  <label>Авиакомпания</label>
                  <DropDownList
                    placeholder="Введите авиакомпанию"
                    searchable={false}
                    options={airlines?.map((airline) => airline.name)}
                    initialValue={selectedAirline?.name || ""}
                    onSelect={(value) => {
                      const selectedAirline = airlines.find(
                        (airline) => airline.name === value
                      );
                      setSelectedAirline(selectedAirline);
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        airlineId: selectedAirline?.id || "",
                      }));
                      setIsEdited(true);
                    }}
                  />
                </>
              ) : airOrHotel === "hotel" ? (
                <>
                  <label>Гостиница</label>
                  <DropDownList
                    placeholder="Введите гостиницу"
                    searchable={false}
                    options={airlines?.map((airline) => airline.name)}
                    initialValue={selectedAirline?.name || ""}
                    onSelect={(value) => {
                      const selectedAirline = airlines.find(
                        (airline) => airline.name === value
                      );
                      setSelectedAirline(selectedAirline);
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        hotelId: selectedAirline?.id || "",
                      }));
                      setIsEdited(true);
                    }}
                  />
                </>
              ) : null}
            </>
          )}

          <label>Начальная дата</label>
          <input
            type="date"
            name="startDate"
            placeholder="Начальная дата"
            value={formData.startDate}
            onChange={handleChange}
          />

          <label>Конечная дата</label>
          <input
            type="date"
            name="endDate"
            min={formData.startDate}
            placeholder="Конечная дата"
            value={formData.endDate}
            onChange={handleChange}
          />

          {/* <label>Картинка</label>
                    <input type="file" name="airlineImg" onChange={handleFileChange} /> */}
        </div>
      </div>

      <div className={classes.requestButton}>
        <Button type="submit" onClick={handleSubmit}>
          Добавить
        </Button>
      </div>
    </Sidebar>
  );
}

export default CreateRequestReport;
