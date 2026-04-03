import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./CreateRequestNomerFond.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import {
  CREATE_MANY_ROOMS,
  GET_HOTEL_ROOMS,
  GET_HOTEL_TARIFS,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  getCookie,
  UPDATE_HOTEL,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

const REQUIRED_FIELDS_MESSAGE =
  "Пожалуйста, заполните все обязательные поля.";

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
}) {
  const token = getCookie("token");
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();
  const [isEdited, setIsEdited] = useState(false);
  const [isMultipleRooms, setIsMultipleRooms] = useState(false); // Флаг для выбора множества комнат

  const [formData, setFormData] = useState({
    nomerName: "",
    category: null,
    beds: "",
    reserve: "",
    description: "",
    descriptionSecond: "",
    price: type === "apartment" ? null : "",
    roomImages: null,
    roomsName: "",
    roomsQuantity: 0, // количество комнат
  });
  const [selectedRoomKind, setSelectedRoomKind] = useState(null);
  const [hotelTariff, setHotelTariff] = useState([]);
  const [coverImage, setCoverImage] = useState(null);

  const { loading, error, data, refetch } = useQuery(GET_HOTEL_TARIFS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: { hotelId: id },
  });

  const { data: dataSubscriptionUpd } = useSubscription(
    GET_HOTELS_UPDATE_SUBSCRIPTION,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
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

  const [createManyRooms] = useMutation(CREATE_MANY_ROOMS, {
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
      roomImages: null,
      roomsName: "",
      roomsQuantity: 0,
    });
    setIsEdited(false); // Сброс флага изменений
    setSelectedRoomKind(null);
    setCoverImage(null);
  }, [type]);

  useEffect(() => {
    if (show) {
      setFormData((prevState) => ({
        ...prevState,
        reserve: filter === "reserve" ? true : false,
      }));
    }
  }, [show, filter]);

  useEffect(() => {
    if (data && show) {
      setHotelTariff(data.hotel?.roomKind);
    }
  }, [data, show]);

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
  }, [confirm, isDialogOpen, isEdited, resetForm, onClose]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleCoverImageChange = (image) => {
    setIsEdited(true);
    setCoverImage(image);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (files.length > 8) {
      showAlert("Вы можете загрузить не более 8 изображений.");
      e.target.value = null;
      return;
    }

    setIsEdited(true);
    const fileArray = Array.from(files);

    setFormData((prevState) => ({
      ...prevState,
      roomImages: fileArray,
    }));
  };

  const imagesArray = coverImage
    ? [coverImage, ...formData.roomImages?.filter((img) => img !== coverImage)]
    : formData.roomImages;

  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = () => {
    const raw = formData.nomerName;
    const nameStr = typeof raw === "number" ? String(raw) : String(raw ?? "");
    if (!nameStr.trim()) return false;
    if (!selectedRoomKind && type !== "apartment") return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      showAlert(REQUIRED_FIELDS_MESSAGE);
      return;
    }

    setIsLoading(true);

    try {
      const reserveBoolean = formData.reserve === "true";

      const nomerName =
        formData.reserve === false
          ? formData.nomerName
          : formData.reserve === true && formData.nomerName.includes("резерв")
            ? formData.nomerName
            : `${formData.nomerName} (резерв)`;

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

      const manyRoomsInput = {
        hotelId: id,
        roomKindId: selectedRoomKind ? selectedRoomKind.id : undefined,
        numberOfRooms: parseFloat(formData.roomsQuantity),
        roomsName: parseFloat(formData.nomerName),
        beds: parseFloat(formData.beds),
        reserve: formData.reserve,
        type: "room",
        active: true,
      };

      // Если выбрано множество комнат
      if (isMultipleRooms) {
        // Используем только createManyRooms
        await createManyRooms({
          variables: {
            input: manyRoomsInput,
          },
          refetchQueries: [
            { query: GET_HOTEL_ROOMS, variables: { hotelId: id } },
          ],
        });
      } else {
        // Если не выбрано множество комнат, используем только updateHotel
        let response_update_room;

        if (formData.roomImages) {
          response_update_room = await updateHotel({
            variables: {
              updateHotelId: id,
              input: {
                rooms: [roomInput],
              },
              roomImages: imagesArray,
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

        // if (response_update_room) {
        //   const sortedTarifs = Object.values(
        //     response_update_room.data.updateHotel.rooms.reduce((acc, room) => {
        //       if (!acc[room.category]) {
        //         acc[room.category] = {
        //           name:
        //             room.category === "onePlace"
        //               ? "Одноместный"
        //               : room.category === "twoPlace"
        //               ? "Двухместный"
        //               : room.category === "threePlace"
        //               ? "Трехместный"
        //               : room.category === "fourPlace"
        //               ? "Четырехместный"
        //               : room.category === "fivePlace"
        //               ? "Пятиместный"
        //               : room.category === "sixPlace"
        //               ? "Шестиместный"
        //               : room.category === "sevenPlace"
        //               ? "Семиместный"
        //               : room.category === "eightPlace"
        //               ? "Восьмиместный"
        //               : room.category === "apartment"
        //               ? "Апартаменты"
        //               : room.category === "studio"
        //               ? "Студия"
        //               : "",
        //           origName: room.category,
        //           rooms: [],
        //         };
        //       }
        //       acc[room.category].rooms.push(room);
        //       return acc;
        //     }, {})
        //   );

        //   sortedTarifs.forEach((category) => {
        //     category.rooms.sort((a, b) => a.name.localeCompare(b.name));
        //   });

        //   setAddTarif(sortedTarifs);
        // }
      }

      resetForm();
      onClose();
      setIsLoading(false);
      success("Создание номера прошло успешно.");
    } catch (error) {
      console.error("Ошибка при обновлении номеров:", error);
      notifyError("Не удалось создать номер.");
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

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, isDialogOpen]);

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
          <CloseIcon />
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"80vh"} />
      ) : (
        <>
          <div className={classes.requestMiddle}>
            <div className={classes.requestData}>
              {/* Checkbox для выбора множества комнат */}
              <label className={classes.checkBox}>
                <input
                  type="checkbox"
                  checked={isMultipleRooms}
                  onChange={(e) => {
                    setIsEdited(true);
                    setIsMultipleRooms(e.target.checked);
                  }}
                />
                Создать несколько номеров
              </label>
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
                      setIsEdited(true);
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
                type={isMultipleRooms ? "number" : "text"}
                name="nomerName"
                value={formData.nomerName}
                onChange={handleChange}
                placeholder="Пример: № 151"
              />

              {!isMultipleRooms && (
                <>
                  <label>Дополнительная информация</label>
                  <input
                    type="text"
                    name="descriptionSecond"
                    value={formData.descriptionSecond}
                    onChange={handleChange}
                    placeholder="Пример: Снимает Сам Иванов"
                  />
                </>
              )}
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

                  <label>Изображения</label>
                  <input
                    type="file"
                    name="roomImages"
                    onChange={handleFileChange}
                    multiple
                  />
                  <div className={classes.imageList}>
                    {formData?.roomImages?.map((image, index) => (
                      <div
                        key={`${image.name}-${index}`} // Используйте `image.name` для уникальности ключа
                        className={`${classes.imageItem} ${coverImage === image ? classes.selected : ""
                          }`}
                        onClick={() => handleCoverImageChange(image)}
                      >
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Image ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {/* Показать поле для ввода количества комнат, если выбран checkbox */}
              {isMultipleRooms && (
                <>
                  <label>Количество номеров</label>
                  <input
                    type="number"
                    name="roomsQuantity"
                    value={formData.roomsQuantity}
                    onChange={handleChange}
                    min="1"
                  />
                </>
              )}
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