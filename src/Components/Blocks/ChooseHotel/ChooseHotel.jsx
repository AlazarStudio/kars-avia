import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import classes from "./ChooseHotel.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import { useQuery } from "@apollo/client";
import { GET_HOTELS_RELAY } from "../../../../graphQL_requests";
import DropDownList from "../DropDownList/DropDownList"; // Импортируем кастомный компонент DropDownList

function ChooseHotel({ show, onClose, chooseObject, id, chooseRequestID, chooseCityRequest }) {
  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({ city: "", hotel: "", request: chooseRequestID });
  const [hotels, setHotels] = useState([]);
  const sidebarRef = useRef();


  // Получаем данные о гостиницах
  const { data: hotelsData, loading: hotelsLoading } =
    useQuery(GET_HOTELS_RELAY);

  useEffect(() => {
    if (!hotelsLoading && hotelsData) {
      setHotels(hotelsData.hotels || []);
    }
  }, [hotelsLoading, hotelsData]);

  useEffect(() => {
    if (chooseCityRequest) {
      setFormData((prevState) => ({ ...prevState, city: chooseCityRequest, hotel: "", request: chooseRequestID }));
    }
  }, [chooseCityRequest]);

  // Получаем уникальные города и фильтруем отели по выбранному городу
  const uniqueCities = useMemo(
    () => [...new Set(hotels.map((hotel) => hotel.city?.trim()))].sort(),
    [hotels]
  );
  const filteredHotels = useMemo(() => {
    return formData.city
      ? hotels.filter((hotel) => hotel.city.trim() === formData.city.trim())
      : [];
  }, [formData.city, hotels]);

  const resetForm = useCallback(() => {
    setFormData({ city: "", hotel: "", request: chooseRequestID });
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
  }, [isEdited, onClose]);

  const handleCitySelect = (value) => {
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({ ...prevState, city: value, hotel: "", request: chooseRequestID })); // Сброс отеля при изменении города
  };

  const handleHotelSelect = (value) => {
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({ ...prevState, hotel: value, request: chooseRequestID }));
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

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Выбрать гостиницу</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      <div className={classes.requestMiddle}>
        <div className={classes.requestData}>
          <label>Город</label>
          <DropDownList
            placeholder="Выберите город"
            options={uniqueCities}
            initialValue={formData.city}
            onSelect={handleCitySelect}
          />

          <label>Гостиница</label>
          <DropDownList
            placeholder="Выберите гостиницу"
            options={filteredHotels.map((hotel) => hotel.name)}
            initialValue={
              filteredHotels.find((hotel) => hotel.id === formData.hotel)
                ?.name || ""
            }
            onSelect={(value) => {
              const selectedHotel = filteredHotels.find(
                (hotel) => hotel.name === value
              );
              handleHotelSelect(selectedHotel?.id || "");
            }}
          />
        </div>
      </div>

      {formData.city && formData.hotel && (
        <div className={classes.requestButton}>
          <Button
            link={`/hotels/${formData.hotel}/${formData.request}`}
            dataObject={chooseObject}
            disabled={true}
          >
            Разместить <img src="/user-check.png" alt="" />
          </Button>
        </div>
      )}
    </Sidebar>
  );
}

export default ChooseHotel;
