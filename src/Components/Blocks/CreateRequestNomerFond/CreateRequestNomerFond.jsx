import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestNomerFond.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import {
  GET_HOTEL_TARIFS,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  getCookie,
  UPDATE_HOTEL,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";

function CreateRequestNomerFond({
  type,
  show,
  onClose,
  addTarif,
  id,
  setAddTarif,
  uniqueCategories,
  tarifs,
  filter,
  addNotification,
}) {
  const token = getCookie("token");
  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме

  const [formData, setFormData] = useState({
    nomerName: "",
    category: null,
    beds: "",
    reserve: "",
    description: "",
    descriptionSecond: "",
    price: type === "apartment" ? null : "",
    roomImages: "",
  });
  // Состояние для выбранного тарифа (roomKind)
  const [selectedRoomKind, setSelectedRoomKind] = useState(null);
  const [hotelTariff, setHotelTariff] = useState([]);

  // console.log(selectedRoomKind);

  const { loading, error, data, refetch } = useQuery(GET_HOTEL_TARIFS, {
    variables: { hotelId: id },
  });

  const { data: dataSubscriptionUpd } = useSubscription(
    GET_HOTELS_UPDATE_SUBSCRIPTION,
    {
      onData: () => {
        refetch();
      },
    }
  );

  const [updateHotel] = useMutation(UPDATE_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setFormData({
      nomerName: "",
      category: null,
      beds: "",
      reserve: "",
      description: "",
      descriptionSecond: "",
      price: type === "apartment" ? null : "",
      roomImages: "",
    });
    setIsEdited(false); // Сброс флага изменений
    setSelectedRoomKind(null);
  }, []);

  useEffect(() => {
    if (show) {
      setFormData((prevState) => ({
        ...prevState,
        reserve: filter === "quote" ? false : true,
      }));
    }
  }, [show, filter]);

  useEffect(() => {
    if (data && show) {
      setHotelTariff(data.hotel?.roomKind);
    }
  }, [data, show]);

  // console.log(hotelTariff);

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

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 8) {
      alert("Вы можете загрузить не более 8 изображений.");
      e.target.value = null;
      return;
    }

    // Преобразуем файлы в массив
    const fileArray = Array.from(files);

    setFormData((prevState) => ({
      ...prevState,
      roomImages: fileArray, // Сохраняем массив файлов
    }));
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.nomerName.trim()) {
      alert("Пожалуйста, заполните все поля формы перед отправкой.");
      setIsLoading(false);
      return;
    }

    try {
      const reserveBoolean = formData.reserve === "true";

      const nomerName =
        formData.reserve === false
          ? formData.nomerName
          : formData.reserve === true && formData.nomerName.includes("резерв")
          ? formData.nomerName
          : `${formData.nomerName} (резерв)`;

      // Преобразование reserve в булево значение

      // Формируем объект для обновления номера, включая roomKindId из выбранного тарифа
      const roomInput = {
        name: nomerName,
        roomKindId: selectedRoomKind ? selectedRoomKind.id : undefined,
        category: formData.category,
        beds: parseFloat(formData.beds),
        reserve: formData.reserve,
        description: formData.description,
        descriptionSecond: formData.descriptionSecond,
        price: parseFloat(formData.price),
      };

      let response_update_room;

      if (formData.roomImages.length > 0) {
        response_update_room = await updateHotel({
          variables: {
            updateHotelId: id,
            input: {
              rooms: [roomInput],
            },
            roomImages: formData.roomImages,
          },
        });
      } else {
        response_update_room = await updateHotel({
          variables: {
            updateHotelId: id,
            input: {
              rooms: [roomInput],
            },
          },
        });
      }

      // console.log(response_update_room);
      // console.log(formData);

      if (response_update_room) {
        const sortedTarifs = Object.values(
          response_update_room.data.updateHotel.rooms.reduce((acc, room) => {
            if (!acc[room.category]) {
              acc[room.category] = {
                name:
                  room.category === "onePlace"
                    ? "Одноместный"
                    : room.category === "twoPlace"
                    ? "Двухместный"
                    : room.category === "threePlace"
                    ? "Трехместный"
                    : room.category === "fourPlace"
                    ? "Четырехместный"
                    : room.category === "fivePlace"
                    ? "Пятиместный"
                    : room.category === "sixPlace"
                    ? "Шестиместный"
                    : room.category === "sevenPlace"
                    ? "Семиместный"
                    : room.category === "eightPlace"
                    ? "Восьмиместный"
                    : room.category === "apartment"
                    ? "Апартаменты"
                    : room.category === "studio"
                    ? "Студия"
                    : "",
                origName: room.category,
                rooms: [],
              };
            }
            acc[room.category].rooms.push(room);
            return acc;
          }, {})
        );

        sortedTarifs.forEach((category) => {
          category.rooms.sort((a, b) => a.name.localeCompare(b.name));
        });

        setAddTarif(sortedTarifs);
        // resetForm();
        // onClose();
      }
      resetForm();
      onClose();
      setIsLoading(false);
      addNotification("Создание номера прошло успешно.", "success");
    } catch (error) {
      console.error("Ошибка при обновлении номеров:", error);
    } finally {
      // resetForm();
      // onClose();
      setIsLoading(false);
      // addNotification("Создание номера прошло успешно.", "success");
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

  const categories = [
    {
      value: "onePlace",
      label: "Одноместный",
    },
    {
      value: "twoPlace",
      label: "Двухместный",
    },
    {
      value: "threePlace",
      label: "Трехместный",
    },
    {
      value: "fourPlace",
      label: "Четырехместный",
    },
    {
      value: "fivePlace",
      label: "Пятиместный",
    },
    {
      value: "sixPlace",
      label: "Шестиместный",
    },
    {
      value: "sevenPlace",
      label: "Семиместный",
    },
    {
      value: "eightPlace",
      label: "Восьмиместный",
    },
  ];

  const apartmentCategories = [
    {
      value: "apartment",
      label: "Апартаменты",
    },
    {
      value: "studio",
      label: "Студия",
    },
  ];

  const bedsCategories = [
    {
      value: 1.0,
      label: "Одна кровать",
    },
    {
      value: 2.0,
      label: "Две кровати",
    },
    {
      value: 3.0,
      label: "Три кровати",
    },
    {
      value: 4.0,
      label: "Четыре кровати",
    },
    {
      value: 5.0,
      label: "Пять кроватей",
    },
    {
      value: 6.0,
      label: "Шесть кроватей",
    },
    {
      value: 7.0,
      label: "Семь кроватей",
    },
    {
      value: 8.0,
      label: "Восемь кроватей",
    },
  ];

  const useCategories = type === "apartment" ? apartmentCategories : categories;
  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Добавить номер</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              {type === "apartment" ? null : (
                <>
                  <label>Квота или резерв</label>
                  <MUIAutocomplete
                    dropdownWidth={"100%"}
                    label={"Выберите тип"}
                    options={["Квота", "Резерв"]}
                    value={formData.reserve === true ? "Резерв" : "Квота"}
                    onChange={(event, newValue) => {
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        reserve: newValue === "Резерв",
                      }));
                      setIsEdited(true);
                    }}
                  />

                  <label>Тариф</label>
                  <MUIAutocomplete
                    dropdownWidth={"100%"}
                    label={"Выберите тариф"}
                    options={hotelTariff.map((tariff) => tariff.name)}
                    value={
                      selectedRoomKind &&
                      hotelTariff.find(
                        (tariff) =>
                          tariff && tariff.name === selectedRoomKind.name
                      )?.name
                    }
                    onChange={(event, newValue) => {
                      const tariff = hotelTariff.find(
                        (tariff) => tariff && tariff.name === newValue
                      );
                      setSelectedRoomKind(tariff);
                    }}
                  />
                </>
              )}

              <label>Название номера</label>
              <input
                type="text"
                name="nomerName"
                value={formData.nomerName}
                onChange={handleChange}
                placeholder="Пример: № 151"
              />

              <label>Дополнительная информация</label>
              <input
                type="text"
                name="descriptionSecond"
                value={formData.descriptionSecond}
                onChange={handleChange}
                placeholder="Пример: Снимает Сам Иванов"
              />

              <label>Количество кроватей</label>
              <MUIAutocomplete
                dropdownWidth={"100%"}
                label={"Выберите категорию"}
                options={bedsCategories.map((category) => category.label)}
                value={
                  bedsCategories.find(
                    (category) => category.value === formData.beds
                  ) || ""
                }
                onChange={(event, newValue) => {
                  const selectedCategory = bedsCategories.find(
                    (category) => category.label === newValue
                  );
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    beds: selectedCategory.value,
                  }));
                  setIsEdited(true);
                }}
              />
              {type === "apartment" ? (
                <>
                  <label>Категория</label>
                  <MUIAutocomplete
                    dropdownWidth={"100%"}
                    label={"Выберите категорию"}
                    options={useCategories.map((category) => category.label)}
                    value={
                      useCategories.find(
                        (category) => category.value === formData.category
                      ) || ""
                    }
                    onChange={(event, newValue) => {
                      const selectedCategory = useCategories.find(
                        (category) => category.label === newValue
                      );
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        category: selectedCategory.value,
                      }));
                      setIsEdited(true);
                    }}
                  />

                  <label>Цена</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || 0}
                    onChange={handleChange}
                  />
                  <label>Описание</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>

                  <label>Изображение</label>
                  <input
                    type="file"
                    name="roomImages"
                    onChange={handleFileChange}
                    multiple
                  />
                </>
              ) : null}
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

export default CreateRequestNomerFond;
