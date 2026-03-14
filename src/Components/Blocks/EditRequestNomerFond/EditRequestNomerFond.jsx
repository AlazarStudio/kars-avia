import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestNomerFond.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";

import {
  GET_HOTEL_TARIFS,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  getCookie,
  REORDER_ROOM_KIND_IMAGES,
  getMediaUrl,
  UPDATE_HOTEL,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import MUILoader from "../MUILoader/MUILoader.jsx";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import CloseIcon from "../../../shared/icons/CloseIcon.jsx";

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
  openDeleteNomerComponent,
}) {
  const token = getCookie("token");
  // console.log(nomer);
  const [selectedRoomKind, setSelectedRoomKind] = useState(null);
  const [hotelTariff, setHotelTariff] = useState([]);

  const [coverImage, setCoverImage] = useState(nomer && nomer?.images?.[0]);
  const [coverImage2, setCoverImage2] = useState(null);

  const [deletedImages, setDeletedImages] = useState([]);

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
      onData: () => {
        refetch();
      },
    },
  );

  const [isEdited, setIsEdited] = useState(false); // Флаг, указывающий, были ли изменения в форме
  const [formData, setFormData] = useState({
    nomerName: (nomer && nomer.name) || "",
    category: type === "apartment" ? category?.origName : null,
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
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const resetForm = useCallback(() => {
    if (nomer) {
      setFormData({
        nomerName: nomer?.name || nomer?.id || "",
        category: type === "apartment" ? category?.origName : null,
        beds: nomer?.beds || "",
        reserve: typeof nomer?.reserve === "boolean" ? nomer?.reserve : false,
        active: typeof nomer?.active === "boolean" ? nomer?.active : false,
        description: nomer?.description || "",
        descriptionSecond: nomer?.descriptionSecond || "",
        price: nomer?.price || null,
        roomImages: null,
      });
      setCoverImage(nomer?.images?.[0] || null);
      setCoverImage2(null);
      setDeletedImages([]);
      const preselected = hotelTariff?.find(
        (t) => t?.id === nomer?.roomKind?.id,
      );
      setSelectedRoomKind(preselected || null);
    }
    setIsEdited(false);
  }, [nomer, type, category, hotelTariff]);

  useEffect(() => {
    if (show) {
      setFormData({
        nomerName: nomer?.name || nomer?.id || "",
        category: type === "apartment" ? category?.origName : null,
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
      setHotelTariff(
        Array.isArray(data.hotel?.roomKind) ? data.hotel.roomKind : [],
      );
    }
  }, [data, show]);

  // Если в номере задан тариф (roomKind.id), ищем его в загруженных тарифах и устанавливаем selectedRoomKind
  useEffect(() => {
    const tariffs = Array.isArray(hotelTariff) ? hotelTariff : [];
    if (
      show &&
      nomer &&
      nomer.roomKind &&
      nomer.roomKind.id &&
      tariffs.length > 0
    ) {
      const preselectedTariff = tariffs.find(
        (tariff) => tariff.id === nomer.roomKind.id,
      );
      if (preselectedTariff) {
        setSelectedRoomKind(preselectedTariff);
      }
    }
  }, [show, nomer, hotelTariff]);

  const [isEditing, setIsEditing] = useState(false);

  const closeButton = useCallback(() => {
    setAnchorEl(null);
    if (!isEdited) {
      resetForm();
      setIsEditing(false);
      onClose();
      return;
    }
    if (window.confirm("Вы уверены? Все несохраненные данные будут удалены.")) {
      resetForm();
      setIsEditing(false);
      onClose();
    }
  }, [isEdited, resetForm, onClose]);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => {
    handleMenuClose();
    setIsEditing(true);
  };
  const handleDeleteFromMenu = () => {
    handleMenuClose();
    if (openDeleteNomerComponent && nomer) {
      const categoryName = category?.name ?? category?.origName ?? category;
      onClose();
      openDeleteNomerComponent(nomer, categoryName);
    }
  };
  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setIsEdited(true); // Устанавливаем флаг изменений при любом изменении
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  // переключает пометку удаления для серверного изображения (по его пути)
  const toggleDeleteServerImage = (imagePath) => {
    setDeletedImages((prev) => {
      if (prev.includes(imagePath)) {
        return prev.filter((p) => p !== imagePath);
      } else {
        return [...prev, imagePath];
      }
    });

    // Если удаляем текущую обложку — сбросим её
    if (coverImage === imagePath) {
      setCoverImage(null);
    }
  };

  // удаление нового выбранного файла из formData.roomImages (File)
  const removeNewFile = (index) => {
    setIsEdited(true);
    const file = formData.roomImages?.[index];
    setFormData((prev) => {
      const newFiles = Array.from(prev.roomImages || []);
      newFiles.splice(index, 1);
      return { ...prev, roomImages: newFiles };
    });
    if (coverImage2 === file) setCoverImage2(null);
  };

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

  const handleCoverImageChange = (image) => {
    if (isEditing) {
      setCoverImage(image);
    }
    // setIsEditing(!isEditing);
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

  const [reorderRoomKindImages] = useMutation(REORDER_ROOM_KIND_IMAGES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });
  const nomerImages = Array.isArray(nomer?.images) ? nomer.images : [];
  const imagesArray = coverImage
    ? [
        coverImage,
        ...nomerImages.filter(
          (img) => img !== coverImage && !deletedImages.includes(img),
        ),
      ]
    : nomerImages.filter((img) => !deletedImages.includes(img));

  const imagesArray2 = coverImage2
    ? [
        coverImage2,
        ...(formData?.roomImages?.filter((f) => f !== coverImage2) || []),
      ]
    : formData?.roomImages || [];

  const handleSubmit = async (e) => {
    if (isEditing) {
      e.preventDefault();
      setIsLoading(true);

      try {
        // const finalImagesOrder = imagesArray; // Задаем порядок изображений
        // if (finalImagesOrder && finalImagesOrder.length && imagesArray2.length === 0) {
        // await reorderRoomKindImages({
        //   variables: {
        //     reorderRoomKindImagesId: roomId ? roomId : nomer.id,
        //     imagesArray: finalImagesOrder, // Порядок изображений
        //     imagesToDeleteArray: deletedImages, // Массив путей изображений на удаление
        //   },
        // });

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
            }, {}),
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
        setIsEditing(false);
      } catch (error) {
        console.error("Ошибка при обновлении номера", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (anchorEl && menuRef.current?.contains(event.target)) return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, anchorEl]);

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
        <div className={classes.requestTitle_close}>
          <AdditionalMenu
            anchorEl={anchorEl}
            onOpen={handleMenuOpen}
            onClose={handleMenuClose}
            menuRef={menuRef}
            onEdit={handleEditFromMenu}
            onDelete={
              openDeleteNomerComponent ? handleDeleteFromMenu : undefined
            }
          />
          <div className={classes.closeIconWrapper} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>
      </div>
      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"85vh"} />
      ) : (
        <>
          <div
            className={classes.requestMiddle}
            style={
              isEditing
                ? { height: "calc(100vh - 161px)" }
                : { height: "calc(100vh - 81px)" }
            }
          >
            <div className={classes.requestData}>
              {type !== "apartment" && (
                <>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>
                      Квота или резерв
                    </div>
                    {isEditing ? (
                      <div className={classes.dropdown}>
                        <MUIAutocomplete
                          dropdownWidth={"100%"}
                          label={"Выберите тип"}
                          options={["Квота", "Резерв"]}
                          value={formData.reserve === true ? "Резерв" : "Квота"}
                          onChange={(event, newValue) => {
                            setIsEdited(true);
                            setFormData((prev) => ({
                              ...prev,
                              reserve: newValue === "Резерв",
                            }));
                          }}
                          isDisabled={false}
                        />
                      </div>
                    ) : (
                      <div className={classes.requestDataInfo_desc}>
                        {formData.reserve ? "Резерв" : "Квота"}
                      </div>
                    )}
                  </div>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>Тариф</div>
                    {isEditing ? (
                      <div className={classes.dropdown}>
                        <MUIAutocomplete
                          dropdownWidth={"100%"}
                          label={"Выберите тариф"}
                          options={(hotelTariff || []).map((t) => t?.name)}
                          value={
                            selectedRoomKind
                              ? (hotelTariff || []).find(
                                  (t) => t?.name === selectedRoomKind.name,
                                )?.name
                              : ""
                          }
                          onChange={(event, newValue) => {
                            setIsEdited(true);
                            const tariff = (hotelTariff || []).find(
                              (t) => t?.name === newValue,
                            );
                            setSelectedRoomKind(tariff || null);
                          }}
                          isDisabled={false}
                        />
                      </div>
                    ) : (
                      <div className={classes.requestDataInfo_desc}>
                        {selectedRoomKind?.name || "—"}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Название номера
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="nomerName"
                    value={
                      formData.nomerName?.includes("резерв")
                        ? formData.nomerName.split(" (резерв)")[0]
                        : formData.nomerName || ""
                    }
                    onChange={handleChange}
                    placeholder="Пример: № 151"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.nomerName
                      ?.replace(/\s*\(?\s*резерв\s*\)?/i, "")
                      .trim() ||
                      formData.nomerName ||
                      "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Дополнительная информация
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="descriptionSecond"
                    value={formData.descriptionSecond || ""}
                    onChange={handleChange}
                    placeholder="Пример: Снимает Сам Иванов"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.descriptionSecond || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Количество кроватей
                </div>
                {isEditing ? (
                  <div className={classes.dropdown}>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      label={"Выберите категорию"}
                      options={bedsCategories.map((c) => c.label)}
                      value={
                        bedsCategories.find((c) => c.value === formData.beds)
                          ?.label ?? ""
                      }
                      onChange={(event, newValue) => {
                        setIsEdited(true);
                        const selected = bedsCategories.find(
                          (c) => c.label === newValue,
                        );
                        setFormData((prev) => ({
                          ...prev,
                          beds: selected?.value,
                        }));
                      }}
                      isDisabled={false}
                    />
                  </div>
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {bedsCategories.find((c) => c.value === formData.beds)
                      ?.label || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Состояние</div>
                {isEditing ? (
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
                      setIsEdited(true);
                      setFormData((prev) => ({
                        ...prev,
                        active: e.target.value === "true",
                      }));
                    }}
                  >
                    <option value="" disabled>
                      Выберите состояние
                    </option>
                    <option value="false">Не работает</option>
                    <option value="true">Работает</option>
                  </select>
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.active === true
                      ? "Работает"
                      : formData.active === false
                        ? "Не работает"
                        : "—"}
                  </div>
                )}
              </div>

              {type === "apartment" && (
                <>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>
                      Категория
                    </div>
                    {isEditing ? (
                      <div className={classes.dropdown}>
                        <MUIAutocomplete
                          dropdownWidth={"100%"}
                          label={"Выберите категорию"}
                          options={useCategories.map((c) => c.label)}
                          value={
                            useCategories.find(
                              (c) => c.value === formData.category,
                            )?.label ?? ""
                          }
                          onChange={(event, newValue) => {
                            setIsEdited(true);
                            const selected = useCategories.find(
                              (c) => c.label === newValue,
                            );
                            setFormData((prev) => ({
                              ...prev,
                              category: selected?.value,
                            }));
                          }}
                          isDisabled={false}
                        />
                      </div>
                    ) : (
                      <div className={classes.requestDataInfo_desc}>
                        {useCategories.find(
                          (c) => c.value === formData.category,
                        )?.label || "—"}
                      </div>
                    )}
                  </div>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>Цена</div>
                    {isEditing ? (
                      <input
                        type="number"
                        name="price"
                        value={formData.price ?? ""}
                        onChange={handleChange}
                      />
                    ) : (
                      <div className={classes.requestDataInfo_desc}>
                        {formData.price != null && formData.price !== ""
                          ? formData.price
                          : "—"}
                      </div>
                    )}
                  </div>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>
                      Описание
                    </div>
                    {isEditing ? (
                      <textarea
                        name="description"
                        value={formData.description || ""}
                        onChange={handleChange}
                      />
                    ) : (
                      <div className={classes.requestDataInfo_desc}>
                        {formData.description || "—"}
                      </div>
                    )}
                  </div>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>
                      Изображения
                    </div>
                    {isEditing ? (
                      <input
                        type="file"
                        name="roomImages"
                        onChange={handleFileChange}
                        multiple
                      />
                    ) : (
                      <div className={classes.requestDataInfo_desc}>
                        {nomerImages.length ? `${nomerImages.length} шт.` : "—"}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <>
                      <div className={classes.imageList}>
                        {formData?.roomImages?.map((image, index) => (
                          <div
                            key={`${image.name}-${index}`}
                            className={classes.imageItem}
                          >
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Image ${index + 1}`}
                            />
                            <button
                              className={classes.deleteImageBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNewFile(index);
                              }}
                              title="Удалить"
                            />
                          </div>
                        ))}
                      </div>
                      <div className={classes.imageList}>
                        {nomerImages.map((image, index) => (
                          <div
                            key={`${image}-${index}`}
                            className={classes.imageItem}
                          >
                            <img
                              src={getMediaUrl(image)}
                              alt={`Image ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {isEditing && (
            <div className={classes.requestButton}>
              <Button
                type="button"
                onClick={handleCancelEdit}
                backgroundcolor="var(--hover-gray)"
                color="#000"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                backgroundcolor="#0057C3"
                color="#fff"
              >
                Сохранить <img src="/saveDispatcher.png" alt="" />
              </Button>
            </div>
          )}
        </>
      )}
    </Sidebar>
  );
}

export default EditRequestNomerFond;
