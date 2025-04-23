import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestNomerFond.module.css";
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

function EditRequestNomerFond({
  type,
  show,
  id,
  onClose,
  nomer,
  places,
  category,
  reserve,
  active,
  onSubmit,
  roomId,
  roomsRefetch,
  uniqueCategories,
  tarifs,
  addTarif,
  setAddTarif,
  selectedNomer,
  filter,
  addNotification,
}) {
  const token = getCookie("token");
  // console.log(nomer);
  const [selectedRoomKind, setSelectedRoomKind] = useState(null);
  const [hotelTariff, setHotelTariff] = useState([]);

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

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    nomerName: (nomer && nomer.name) || "",
    category: type === "apartment"  ? category?.origName : null,
    beds: nomer?.beds || "",
    reserve: nomer?.reserve || "",
    active: nomer?.active || "",
    description: nomer?.description || "",
    descriptionSecond: nomer?.descriptionSecond || "",
    price: nomer?.price || null,
    roomImages: null,
  });

  // console.log(selectedRoomKind);

  const sidebarRef = useRef();

  const resetForm = useCallback(() => {
    setIsEdited(false); // Сброс флага изменений
    setSelectedRoomKind(null);
  }, []);

  useEffect(() => {
    if (show) {
      setFormData({
        nomerName: nomer?.name || nomer?.id || "",
        category: type === "apartment"  ? category?.origName : null,
        beds: nomer?.beds || "",
        reserve: typeof nomer?.reserve === "boolean" ? nomer?.reserve : false, // Установить false, если undefined
        active: typeof nomer?.active === "boolean" ? nomer?.active : false, // Установить false, если undefined
        description: nomer?.description || "",
        descriptionSecond: nomer?.descriptionSecond || "",
        price: nomer?.price || null,
        roomImages: null,
      });
    }
  }, [show, nomer, category, reserve, active]);

  useEffect(() => {
    if (data && show) {
      setHotelTariff(data.hotel?.roomKind);
    }
  }, [data, show]);

  // Если в номере задан тариф (roomKind.id), ищем его в загруженных тарифах и устанавливаем selectedRoomKind
  useEffect(() => {
    if (
      show &&
      nomer &&
      nomer.roomKind &&
      nomer.roomKind.id &&
      hotelTariff.length > 0
    ) {
      const preselectedTariff = hotelTariff.find(
        (tariff) => tariff.id === nomer.roomKind.id
      );
      if (preselectedTariff) {
        setSelectedRoomKind(preselectedTariff);
      }
    }
  }, [show, nomer, hotelTariff]);

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

  const [updateHotel] = useMutation(UPDATE_HOTEL, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setIsLoading(true);

  //   try {
  //     // const nomerName =
  //     //   filter == "quote" && !formData.reserve
  //     //     ? formData.nomerName
  //     //     : filter == "reserve" &&
  //     //       formData.nomerName.includes("резерв") &&
  //     //       !formData.reserve
  //     //     ? formData.nomerName.replace(/\s*\(?\s*резерв\s*\)?\s*/i, "")
  //     //     : `${formData.nomerName} (резерв)`;
  //     // Если filter не передан, effectiveFilter будет "quote"
  //     const effectiveFilter = filter || "quote";

  //     const nomerName =
  //       formData.reserve && nomer.reserve
  //         ? formData.nomerName
  //         : effectiveFilter === "quote" && !formData.reserve
  //         ? formData.nomerName
  //         : effectiveFilter === "reserve" &&
  //           formData.nomerName.includes("резерв") &&
  //           !formData.reserve
  //         ? formData.nomerName.replace(/\s*\(?\s*резерв\s*\)?\s*/i, "")
  //         : `${formData.nomerName} (резерв)`;

  //     let response_update_room = await updateHotel({
  //       variables: {
  //         updateHotelId: id,
  //         input: {
  //           rooms: [
  //             {
  //               id: roomId ? roomId : nomer.id,
  //               name: nomerName,
  //               category: formData.category,
  //               beds: parseFloat(formData.beds),
  //               reserve: formData.reserve,
  //               active: formData.active,
  //               description: formData.description,
  //               descriptionSecond: formData.descriptionSecond,
  //             },
  //           ],
  //         },
  //         roomImages: formData.roomImages,
  //       },
  //     });
  //     if (response_update_room) {
  //       const sortedTarifs = Object.values(
  //         response_update_room.data.updateHotel.rooms.reduce((acc, room) => {
  //           if (!acc[room.category]) {
  //             acc[room.category] = {
  //               name:
  //                 room.category === "onePlace"
  //                   ? "Одноместный"
  //                   : room.category === "twoPlace"
  //                   ? "Двухместный"
  //                   : room.category === "threePlace"
  //                   ? "Трехместный"
  //                   : room.category === "fourPlace"
  //                   ? "Четырехместный"
  //                   : room.category === "fivePlace"
  //                   ? "Пятиместный"
  //                   : room.category === "sixPlace"
  //                   ? "Шестиместный"
  //                   : room.category === "sevenPlace"
  //                   ? "Семиместный"
  //                   : room.category === "eightPlace"
  //                   ? "Восьмиместный"
  //                   : "",
  //               origName: room.category,
  //               rooms: [],
  //             };
  //           }
  //           acc[room.category].rooms.push(room);
  //           return acc;
  //         }, {})
  //       );

  //       sortedTarifs.forEach((category) => {
  //         category.rooms.sort((a, b) => a.name.localeCompare(b.name));
  //       });

  //       setAddTarif ? setAddTarif(sortedTarifs) : null;
  //       onSubmit ? onSubmit(nomerName, nomer, formData.category) : null;
  //     }
  //     resetForm();
  //     onClose();
  //     setIsLoading(false);
  //     addNotification ? addNotification("Редактирование номера прошло успешно.", "success") : null;
  //   } catch (error) {
  //     console.error("Ошибка при обновлении номера", error);
  //   } finally {
  //     // resetForm();
  //     // onClose();
  //     setIsLoading(false);
  //     // addNotification("Редактирование номера прошло успешно.", "success");
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Определяем имя номера в зависимости от режима (резерв/квота)
      let nomerName;
      if (formData.reserve) {
        // Если включен режим "резерв" – добавляем суффикс, если его там ещё нет
        if (!formData.nomerName.includes("(резерв)")) {
          nomerName = `${formData.nomerName} (резерв)`;
        } else {
          nomerName = formData.nomerName;
        }
      } else {
        // Если режим "квота" – удаляем суффикс "(резерв)", если он присутствует
        nomerName = formData.nomerName
          .replace(/\s*\(?\s*резерв\s*\)?/i, "")
          .trim();
      }

      const roomInput = {
        id: roomId ? roomId : nomer.id,
        name: nomerName,
        roomKindId: selectedRoomKind ? selectedRoomKind.id : undefined,
        category: formData.category,
        beds: parseFloat(formData.beds),
        reserve: formData.reserve,
        description: formData.description,
        descriptionSecond: formData.descriptionSecond,
        price: parseFloat(formData.price),
      };

      let response_update_room = await updateHotel({
        variables: {
          updateHotelId: id,
          input: {
            rooms: [roomInput],
          },
          roomImages: formData.roomImages,
        },
      });

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

        if (setAddTarif) {
          setAddTarif(sortedTarifs);
        }
        if (onSubmit) {
          onSubmit(nomerName, nomer, formData.category);
        }
        if (roomsRefetch) {
          roomsRefetch();
        }
      }
      resetForm();
      onClose();
      setIsLoading(false);
      if (addNotification) {
        addNotification("Редактирование номера прошло успешно.", "success");
      }
    } catch (error) {
      console.error("Ошибка при обновлении номера", error);
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
        <div className={classes.requestTitle_name}>Редактировать номер</div>
        <div className={classes.requestTitle_close} onClick={closeButton}>
          <img src="/close.png" alt="" />
        </div>
      </div>
      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
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
                value={
                  formData.nomerName.includes("резерв")
                    ? formData.nomerName.split(" (резерв)")[0]
                    : `${formData.nomerName}`
                }
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
                    beds: selectedCategory?.value,
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
                        category: selectedCategory?.value,
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

              <label>Состояние</label>
              <select
                name="active"
                value={
                  formData.active === true
                    ? "true"
                    : formData.active === false
                    ? "false"
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value === "true";
                  setIsEdited(true);
                  setFormData((prevState) => ({
                    ...prevState,
                    active: value,
                  }));
                }}
              >
                <option value="" disabled>
                  Выберите состояние
                </option>
                <option value="false">Не работает</option>
                <option value="true">Работает</option>
              </select>
            </div>
          </div>

          <div className={classes.requestButton}>
            <Button type="submit" onClick={handleSubmit}>
              Сохранить изменения
            </Button>
          </div>
        </>
      )}
    </Sidebar>
  );
}

export default EditRequestNomerFond;
