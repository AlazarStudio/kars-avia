import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestTarif.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";

import {
  GET_AIRLINE_TARIFS,
  GET_HOTEL_TARIFS,
  getCookie,
  UPDATE_AIRLINE_TARIF,
  UPDATE_HOTEL_TARIF,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";

function EditRequestTarif({
  existingPrices,
  show,
  onClose,
  tarif,
  onSubmit,
  id,
  setAddTarif,
  isHotel,
  addNotification,
}) {
  const token = getCookie("token");

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    type: "",
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: tarif?.name || "",
      price: tarif?.price || "",
      type: tarif?.type || "",
    });
    setIsEdited(false); // Сброс флага изменений
  }, []);

  const [updateHotelTarif] = useMutation(
    isHotel ? UPDATE_HOTEL_TARIF : UPDATE_AIRLINE_TARIF,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          "Apollo-Require-Preflight": "true",
        },
      },
    }
  );

  const sidebarRef = useRef();

  useEffect(() => {
    if (show && tarif) {
      setFormData({
        ...formData,
        name: tarif.name,
        price: tarif.price,
        type: tarif.type,
      });
    }
  }, [show, tarif]);

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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   // Проверяем, заполнены ли все поля
  //   if (!formData.name.trim() || !formData.price.trim() || !formData.type) {
  //     alert("Пожалуйста, заполните все поля!");
  //     return;
  //   }

  //   let dataSend;

  //   if (formData.type == 1) {
  //     dataSend = {
  //       prices: {
  //         priceOneCategory: Number(formData.price),
  //       }
  //     };
  //   }

  //   if (formData.type == 2) {
  //     dataSend = {
  //       prices: {
  //         priceTwoCategory: Number(formData.price),
  //       }
  //     };
  //   }

  //   if (formData.type == 3) {
  //     dataSend = {
  //       prices: {
  //         priceThreeCategory: Number(formData.price),
  //       }
  //     };
  //   }

  //   if (formData.type == 4) {
  //     dataSend = {
  //       prices: {
  //         priceFourCategory: Number(formData.price),
  //       }
  //     };
  //   }

  //   if (formData.type == 5) {
  //     dataSend = {
  //       prices: {
  //         priceFiveCategory: Number(formData.price),
  //       }
  //     };
  //   }

  //   if (formData.type == 6) {
  //     dataSend = {
  //       prices: {
  //         priceSixCategory: Number(formData.price),
  //       }
  //     };
  //   }

  //   if (formData.type == 7) {
  //     dataSend = {
  //       prices: {
  //         priceSevenCategory: Number(formData.price),
  //       }
  //     };
  //   }

  //   if (formData.type == 8) {
  //     dataSend = {
  //       prices: {
  //         priceEightCategory: Number(formData.price),
  //       }
  //     };
  //   }

  //   let updateId = isHotel ? "updateHotelId" : "updateAirlineId";

  //   let response_update_tarif = await updateHotelTarif({
  //     variables: {
  //       [updateId]: id,
  //       input: dataSend,
  //     },
  //   });

  //   // console.log(response_update_tarif);

  //   if (response_update_tarif) {
  //     onSubmit([
  //       {
  //         name: "Одноместный",
  //         price: isHotel
  //           ? response_update_tarif.data.updateHotel.priceOneCategory
  //           : response_update_tarif.data.updateAirline.priceOneCategory,
  //         type: 1,
  //       },
  //       {
  //         name: "Двухместный",
  //         price: isHotel
  //           ? response_update_tarif.data.updateHotel.priceTwoCategory
  //           : response_update_tarif.data.updateAirline.priceTwoCategory,
  //         type: 2,
  //       },
  //       {
  //         name: "Трехместный",
  //         price: isHotel
  //           ? response_update_tarif.data.updateHotel.priceThreeCategory
  //           : response_update_tarif.data.updateAirline.priceThreeCategory,
  //         type: 3,
  //       },
  //       {
  //         name: "Четырехместный",
  //         price: isHotel
  //           ? response_update_tarif.data.updateHotel.priceFourCategory
  //           : response_update_tarif.data.updateAirline.priceFourCategory,
  //         type: 4,
  //       },
  //       {
  //         name: "Пятиместный",
  //         price: isHotel
  //           ? response_update_tarif.data.updateHotel.priceFiveCategory
  //           : response_update_tarif.data.updateAirline.priceFiveCategory,
  //         type: 5,
  //       },
  //       {
  //         name: "Шестиместный",
  //         price: isHotel
  //           ? response_update_tarif.data.updateHotel.priceSixCategory
  //           : response_update_tarif.data.updateAirline.priceSixCategory,
  //         type: 6,
  //       },
  //       {
  //         name: "Семиместный",
  //         price: isHotel
  //           ? response_update_tarif.data.updateHotel.priceSevenCategory
  //           : response_update_tarif.data.updateAirline.priceSevenCategory,
  //         type: 7,
  //       },
  //       {
  //         name: "Восьмиместный",
  //         price: isHotel
  //           ? response_update_tarif.data.updateHotel.priceEightCategory
  //           : response_update_tarif.data.updateAirline.priceEightCategory,
  //         type: 8,
  //       },
  //     ]);
  //     resetForm();
  //     onClose();
  //   }
  // };

  const categoryNames = {
    1: "Одноместный",
    2: "Двухместный",
    3: "Трехместный",
    4: "Четырехместный",
    5: "Пятиместный",
    6: "Шестиместный",
    7: "Семиместный",
    8: "Восьмиместный",
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name.trim() || !formData.price.trim() || !formData.type) {
      alert("Пожалуйста, заполните все поля!");
      setIsLoading(false);
      return;
    }

    const typeToFieldMap = {
      1: "priceOneCategory",
      2: "priceTwoCategory",
      3: "priceThreeCategory",
      4: "priceFourCategory",
      5: "priceFiveCategory",
      6: "priceSixCategory",
      7: "priceSevenCategory",
      8: "priceEightCategory",
      228: "priceApartment",
      229: "priceStudio"
    };

    const fieldToUpdate = typeToFieldMap[formData.type];
    if (!fieldToUpdate) {
      alert("Ошибка: Неверный тип тарифа.");
      return;
    }

    // Клонируем актуальные данные перед отправкой
    let updatedPrices = { ...existingPrices };

    // Удаляем `__typename`, так как GraphQL его не принимает
    delete updatedPrices.__typename;

    // Обновляем только одно поле, сохраняя остальные значения
    updatedPrices[fieldToUpdate] = Number(formData.price);

    let updateId = isHotel ? "updateHotelId" : "updateAirlineId";
    let refetchQuery = isHotel ? GET_HOTEL_TARIFS : GET_AIRLINE_TARIFS;
    let refetchId = isHotel ? "hotelId" : "airlineId";

    try {
      let response_update_tarif = await updateHotelTarif({
        variables: {
          [updateId]: id,
          input: { prices: updatedPrices },
        },
        refetchQueries: [
          { query: refetchQuery, variables: { [refetchId]: id } },
        ], // Перезапрашиваем данные
      });

      if (response_update_tarif) {
        // Обновляем `existingPrices` после успешной мутации
        // setExistingPrices(updatedPrices);

        // Обновляем UI без перезагрузки
        setAddTarif((prevTarifs) =>
          prevTarifs.map((tarif) =>
            tarif.type === formData.type
              ? { ...tarif, price: Number(formData.price) }
              : tarif
          )
        );

        resetForm();
        onClose();
        setIsLoading(false);
        addNotification("Редактирование прошло успешно.", "success");
      }
    } catch (error) {
      console.error("Ошибка обновления тарифа:", error);
      setIsLoading(false);
      // alert("Ошибка при обновлении тарифа. Попробуйте еще раз.");
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
        <div className={classes.requestTitle_name}>Редактировать тариф</div>
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
              <label>Название категории</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled
              />
              <label>Цена категории</label>
              <input
                type="text"
                name="price"
                value={formData.price || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Изменить
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default EditRequestTarif;
