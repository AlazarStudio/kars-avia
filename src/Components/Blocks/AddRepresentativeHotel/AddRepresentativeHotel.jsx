import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import classes from "./AddRepresentativeHotel.module.css";
import Sidebar from "../Sidebar/Sidebar.jsx";
import {
  ADD_PASSENGER_REQUEST_HOTEL,
  GET_HOTELS_RELAY,
  GET_PASSENGER_REQUEST,
  getCookie,
} from "../../../../graphQL_requests.js";
import MUILoader from "../MUILoader/MUILoader.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import Button from "../../Standart/Button/Button.jsx";
import MUIAutocompleteColor from "../MUIAutocompleteColor/MUIAutocompleteColor.jsx";

function AddRepresentativeHotel({ show, onClose, request, addNotification }) {
  const token = getCookie("token");
  const [isEdited, setIsEdited] = useState(false);
  const sidebarRef = useRef();
  const [selectedHotel, setSelectedHotel] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    peopleCount: "",
    address: "",
    link: "",
    hotelId: "",
  });

  const { data: hotelsData } = useQuery(GET_HOTELS_RELAY, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !show,
  });

  const hotels = hotelsData?.hotels?.hotels ?? [];

  const [addHotel, { loading }] = useMutation(ADD_PASSENGER_REQUEST_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    refetchQueries: [
      {
        query: GET_PASSENGER_REQUEST,
        variables: { passengerRequestId: request?.id },
      },
    ],
    awaitRefetchQueries: true,
  });

  const resetForm = useCallback(() => {
    setSelectedHotel(null);
    setFormData({
      name: "",
      peopleCount: "",
      address: "",
      link: "",
      hotelId: "",
    });
    setIsEdited(false);
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
    setIsEdited(true);
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const isFormValid = () => {
    return (
      formData.name?.trim() &&
      formData.peopleCount !== "" &&
      Number(formData.peopleCount) > 0
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      alert("Выберите гостиницу из списка и укажите количество мест.");
      return;
    }

    const hotel = {
      name: formData.name.trim(),
      peopleCount: Number(formData.peopleCount),
      address: formData.address?.trim() || null,
      link: formData.link?.trim() || null,
      hotelId: formData.hotelId?.trim() || null,
    };

    try {
      await addHotel({
        variables: {
          requestId: request?.id,
          hotel,
        },
      });
      resetForm();
      onClose();
      if (addNotification) {
        addNotification("Гостиница добавлена.", "success");
      }
    } catch (error) {
      console.error(error);
      alert("Ошибка при добавлении гостиницы");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton]);

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить гостиницу</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <CloseIcon />
        </div>
      </div>

      {loading ? (
        <MUILoader loadSize={"50px"} fullHeight={"75vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              <label>Гостиница</label>
              <MUIAutocompleteColor
                dropdownWidth="100%"
                label="Выберите гостиницу"
                options={hotels}
                getOptionLabel={(option) =>
                  option
                    ? `${option.name}, город: ${option?.information?.city ?? "не указан"}`.trim()
                    : ""
                }
                renderOption={(optionProps, option) => {
                  const cityPart = option?.information?.city
                    ? `, город: ${option.information.city}`
                    : "";
                  const labelText = `${option.name}${cityPart}`.trim();
                  const words = labelText.split(", ");
                  return (
                    <li {...optionProps} key={option.id}>
                      {words.map((word, index) => (
                        <span
                          key={index}
                          style={{
                            color: index === 0 ? "black" : "gray",
                            marginRight: 4,
                          }}
                        >
                          {word}
                        </span>
                      ))}
                    </li>
                  );
                }}
                value={selectedHotel || null}
                onChange={(event, newValue) => {
                  setIsEdited(true);
                  setSelectedHotel(newValue || null);
                  setFormData((prev) => ({
                    ...prev,
                    hotelId: newValue?.id ?? "",
                    name: newValue?.name ?? "",
                  }));
                }}
              />

              <label>Количество мест</label>
              <input
                type="number"
                name="peopleCount"
                min={1}
                value={formData.peopleCount}
                onChange={handleChange}
                placeholder="Количество мест"
              />

              <label>Адрес</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Адрес"
              />

              <label>Ссылка</label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button onClick={handleSubmit} disabled={loading}>
              Добавить гостиницу
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default AddRepresentativeHotel;
