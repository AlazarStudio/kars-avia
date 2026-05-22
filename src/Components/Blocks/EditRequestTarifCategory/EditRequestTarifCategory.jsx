import React, { useState, useRef, useEffect, useCallback } from "react";
import classes from "./EditRequestTarifCategory.module.css";
import Button from "../../Standart/Button/Button";
import Sidebar from "../Sidebar/Sidebar";
import CloseIcon from "../../../shared/icons/CloseIcon";
import AdditionalMenu from "../../Standart/AdditionalMenu/AdditionalMenu";

import {
  getCookie,
  getMediaUrl,
  REORDER_ROOM_KIND_IMAGES,
  UPDATE_HOTEL_TARIF,
} from "../../../../graphQL_requests.js";
import { useMutation, useQuery } from "@apollo/client";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
import MUILoader from "../MUILoader/MUILoader.jsx";
import TextEditor from "../TextEditor/TextEditor.jsx";
import { useDialog } from "../../../contexts/DialogContext";
import { useToast } from "../../../contexts/ToastContext";

function EditRequestTarifCategory({
  show,
  onClose,
  tarif,
  refetch,
  onSubmit,
  id,
  user,
  type,
  openDeleteComponent,
}) {
  const token = getCookie("token");
  const { confirm, showAlert, isDialogOpen } = useDialog();
  const { success, error: notifyError } = useToast();
  // console.log(tarif);

  const [formData, setFormData] = useState({
    images: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isEdited, setIsEdited] = useState(false);

  const [coverImage, setCoverImage] = useState(tarif && tarif?.images[0]);
  const [coverImage2, setCoverImage2] = useState(null);

  const [deletedImages, setDeletedImages] = useState([]);
  // console.log(tarif);

  const sidebarRef = useRef();
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  // useEffect(() => {
  //   if (show && tarif) {
  //     setFormData({ ...tarif, images: null });
  //     setCoverImage(tarif?.images[0]);
  //   }
  // }, [show, tarif]);

  useEffect(() => {
    if (show && tarif && !isEditing) {
      setFormData({ ...tarif, images: null });
      setCoverImage(tarif?.images[0] || null);
      setCoverImage2(null);
      setDeletedImages([]);
      setIsEdited(false);
    }
  }, [show, tarif, isEditing]);

  //   console.log(formData);

  const resetForm = useCallback(() => {
    if (!tarif) return;
    setFormData({ ...tarif, images: null });
    setCoverImage(tarif?.images?.[0] || null);
    setCoverImage2(null);
    setDeletedImages([]);
    setIsEdited(false);
  }, [tarif]);

  const closeButton = useCallback(async () => {
    if (isDialogOpen) return;

    setAnchorEl(null);
    if (!isEdited) {
      onClose();
      setIsEditing(false);
      return;
    }
    const isConfirmed = await confirm(
      "Вы уверены? Все несохраненные данные будут удалены."
    );
    if (isConfirmed) {
      resetForm();
      onClose();
      setIsEditing(false);
    }
  }, [confirm, isDialogOpen, isEdited, onClose, resetForm]);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditFromMenu = () => {
    handleMenuClose();
    setIsEditing(true);
  };
  const handleDeleteFromMenu = () => {
    handleMenuClose();
    if (openDeleteComponent && tarif?.id) {
      onClose();
      openDeleteComponent(null, tarif.id);
    }
  };
  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIsEdited(true);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
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

    // Если есть выбранное изображение, ставим его первым в массиве
    const updatedImages = coverImage2 ? [coverImage2, ...fileArray] : fileArray;

    setFormData((prevState) => ({
      ...prevState,
      images: updatedImages,
    }));
  };

  const handleCoverImageChange = (image) => {
    if (isEditing) {
      setIsEdited(true);
      setCoverImage(image);
    }
  };

  const handleCoverImageChange2 = (image) => {
    if (isEditing) {
      setIsEdited(true);
      setCoverImage2(image);
    }
  };

  // переключает пометку удаления для серверного изображения (по его пути)
  const toggleDeleteServerImage = (imagePath) => {
    if (isEditing) setIsEdited(true);
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

  // удаление нового выбранного файла из formData.images (File)
  const removeNewFile = (index) => {
    if (isEditing) setIsEdited(true);
    setFormData((prev) => {
      const newFiles = Array.from(prev.images || []);
      newFiles.splice(index, 1);
      return { ...prev, images: newFiles };
    });

    // если удаляли coverImage2 (File), сбрасываем его
    const file = formData.images?.[index];
    if (coverImage2 === file) setCoverImage2(null);
  };

  const [reorderRoomKindImages] = useMutation(REORDER_ROOM_KIND_IMAGES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Apollo-Require-Preflight": "true",
      },
    },
  });

  // const imagesArray = coverImage
  //   ? [coverImage, ...tarif?.images.filter((img) => img !== coverImage)]
  //   : tarif?.images;
  const imagesArray = coverImage
    ? [
        coverImage,
        ...tarif?.images.filter(
          (img) => img !== coverImage && !deletedImages.includes(img),
        ),
      ]
    : tarif?.images?.filter((img) => !deletedImages.includes(img));

  // const handleReorderImages = async () => {
  //   try {
  //     await reorderRoomKindImages({
  //       variables: {
  //         reorderRoomKindImagesId: formData.id,
  //         imagesArray: imagesArray,
  //       },
  //     });
  //     // addNotification("Обложка обновлена успешно.", "success");
  //   } catch (error) {
  //     console.error("Ошибка при обновлении обложки:", error);
  //     // addNotification("Не удалось обновить обложку.", "error");
  //   }
  // };

  const [isLoading, setIsLoading] = useState(false);

  // const imagesArray2 = coverImage2
  //   ? [coverImage2, ...formData?.images?.filter((img) => img !== coverImage2)]
  //   : formData.images;

  const imagesArray2 = coverImage2
    ? [
        coverImage2,
        ...(formData?.images?.filter((f) => f !== coverImage2) || []),
      ]
    : formData?.images || [];

  // console.log(imagesArray2);

  // const handleSubmit = async (e) => {
  //   if (isEditing) {
  //     e.preventDefault();
  //     setIsLoading(true);

  //     try {
  //       let response_update_tarif = await updateHotelTarif({
  //         variables: {
  //           updateHotelId: id,
  //           input: {
  //             roomKind: [
  //               {
  //                 id: formData.id,
  //                 category: formData.category,
  //                 name: formData.name,
  //                 price: parseFloat(formData.price),
  //                 priceForAirline: parseFloat(formData.priceForAirline),
  //                 description: formData.description,
  //                 square: formData.square,
  //               },
  //             ],
  //           },
  //           roomKindImages: imagesArray2,
  //         },
  //       });
  //       !imagesArray2 ? await handleReorderImages() : null;
  //       onClose();
  //       setIsLoading(false);
  //       setCoverImage(null);
  //       setCoverImage2(null);
  //       addNotification("Редактирование тарифа прошло успешно.", "success");
  //     } catch (error) {
  //       setIsLoading(false);
  //       console.error("Произошла ошибка при выполнении запроса:", error);
  //       alert("Произошло ошибка при редактировании тарифа.");
  //       setCoverImage(null);
  //       setCoverImage2(null);
  //     }
  //   }
  //   setIsEditing(!isEditing);
  // };
  const handleSubmit = async (e) => {
    if (isEditing) {
      e.preventDefault();
      setIsLoading(true);

      try {
        // Обновление тарифа
        // Формирование финального списка изображений, с учетом удалённых
        const finalImagesOrder = imagesArray; // Задаем порядок изображений
        // if (finalImagesOrder && finalImagesOrder.length && imagesArray2.length === 0) {
        await reorderRoomKindImages({
          variables: {
            reorderRoomKindImagesId: formData.id,
            imagesArray: finalImagesOrder, // Порядок изображений
            imagesToDeleteArray: deletedImages, // Массив путей изображений на удаление
          },
        });
        // }

        const response_update_tarif = await updateHotelTarif({
          variables: {
            updateHotelId: id,
            input: {
              roomKind: [
                {
                  id: formData.id,
                  category: formData.category,
                  name: formData.name,
                  price: parseFloat(formData.price),
                  priceForAirline: parseFloat(formData.priceForAirline),
                  priceForAirReq: formData.priceForAirReq,
                  description: formData.description,
                  square: formData.square,
                },
              ],
            },
            roomKindImages: imagesArray2, // передаем новые изображения
          },
        });

        // Сброс состояний после успешного обновления
        onClose();
        // refetch();
        setIsLoading(false);
        setCoverImage(null);
        setCoverImage2(null);
        setDeletedImages([]);
        setFormData((prev) => ({ ...prev, images: null }));
        setIsEditing(false);
        success("Редактирование тарифа прошло успешно.");
      } catch (error) {
        setIsLoading(false);
        console.error("Ошибка при обновлении тарифа:", error);
        notifyError("Не удалось обновить тариф.");
      }
    }
  };

  // const [tarifNames, setTarifNames] = useState([]);

  // useEffect(() => {
  //   const names = addTarif?.map((tarif) => tarif.name);
  //   setTarifNames(names);
  // }, [addTarif]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDialogOpen) return;
      if (event.target.closest(".MuiSnackbar-root")) return;
      if (anchorEl && menuRef.current?.contains(event.target)) return;
      if (sidebarRef.current?.contains(event.target)) return;
      closeButton();
    };
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, closeButton, anchorEl, isDialogOpen]);

  const categories = [
    {
      value: "luxe",
      label: "Люкс",
    },
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

  const useCategories = type === "apartment" ? apartmentCategories : categories;

  return (
    <Sidebar show={show} sidebarRef={sidebarRef}>
      <div className={classes.requestTitle}>
        <div className={classes.requestTitle_name}>Редактировать тариф</div>
        <div className={classes.requestTitle_close}>
          <AdditionalMenu
            anchorEl={anchorEl}
            onOpen={handleMenuOpen}
            onClose={handleMenuClose}
            menuRef={menuRef}
            onEdit={handleEditFromMenu}
            onDelete={openDeleteComponent ? handleDeleteFromMenu : undefined}
          />
          <div className={classes.closeIconWrapper} onClick={closeButton}>
            <CloseIcon />
          </div>
        </div>
      </div>

      {isLoading ? (
        <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
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
              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Категория</div>
                {isEditing ? (
                  <div className={classes.dropdown}>
                    <MUIAutocomplete
                      dropdownWidth={"100%"}
                      label={"Выберите категорию"}
                      options={useCategories.map((category) => category.label)}
                      value={
                        useCategories.find(
                          (category) => category.value === formData?.category,
                        )?.label ?? ""
                      }
                      onChange={(event, newValue) => {
                        setIsEdited(true);
                        const selectedCategory = useCategories.find(
                          (category) => category.label === newValue,
                        );
                        setFormData((prevFormData) => ({
                          ...prevFormData,
                          category: selectedCategory?.value ?? "",
                        }));
                      }}
                      isDisabled={false}
                    />
                  </div>
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {useCategories.find((c) => c.value === formData?.category)
                      ?.label ||
                      formData?.category ||
                      "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>
                  Название тарифа
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Например: Стандарт, Люкс"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.name || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Стоимость</div>
                {isEditing ? (
                  <input
                    type="number"
                    name="price"
                    value={formData.price ?? ""}
                    onChange={handleChange}
                    placeholder="Введите стоимость"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.price != null && formData.price !== ""
                      ? formData.price
                      : "—"}
                  </div>
                )}
              </div>

              {!user?.hotelId && (
                <>
                  <div className={classes.requestDataInfo}>
                    <div className={classes.requestDataInfo_title}>
                      Стоимость для авиакомпании
                    </div>
                    {isEditing ? (
                      <input
                        type="number"
                        name="priceForAirline"
                        value={formData.priceForAirline ?? ""}
                        onChange={handleChange}
                        placeholder="Введите стоимость"
                      />
                    ) : (
                      <div className={classes.requestDataInfo_desc}>
                        {formData.priceForAirline != null &&
                        formData.priceForAirline !== ""
                          ? formData.priceForAirline
                          : "—"}
                      </div>
                    )}
                  </div>
                  <div className={classes.requestDataInfo}>
                    {isEditing ? (
                      <label className={classes.checkboxLabelFull}>
                        <input
                          type="checkbox"
                          checked={Boolean(formData.priceForAirReq)}
                          onChange={(e) => {
                            setIsEdited(true);
                            setFormData((prev) => ({
                              ...prev,
                              priceForAirReq: e.target.checked,
                            }));
                          }}
                        />
                        <span style={{ marginLeft: 8 }}>
                          Стоимость по запросу
                        </span>
                      </label>
                    ) : (
                      <>
                        <div className={classes.requestDataInfo_title}>
                          Стоимость по запросу
                        </div>
                        <div className={classes.requestDataInfo_desc}>
                          {formData.priceForAirReq ? "Да" : "Нет"}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              <div className={classes.requestDataInfo}>
                <div className={classes.requestDataInfo_title}>Квадратура</div>
                {isEditing ? (
                  <input
                    type="text"
                    name="square"
                    value={formData.square || ""}
                    onChange={handleChange}
                    placeholder="м²"
                  />
                ) : (
                  <div className={classes.requestDataInfo_desc}>
                    {formData.square || "—"}
                  </div>
                )}
              </div>

              <div className={classes.requestDataInfo_block}>
                <div className={classes.requestDataInfo_title}>Описание</div>
                {isEditing ? (
                  <TextEditor
                    hotel={null}
                    anotherDescription={formData.description || ""}
                    isEditing={true}
                    onChange={(newDescription) => {
                      setIsEdited(true);
                      setFormData((prev) => ({
                        ...prev,
                        description: newDescription,
                      }));
                    }}
                  />
                ) : (
                  <div
                    className={classes.requestDataInfo_descBlock}
                    dangerouslySetInnerHTML={{
                      __html: formData.description || "—",
                    }}
                  />
                )}
              </div>

              <div className={classes.requestDataInfo_block}>
                <div className={classes.requestDataInfo_title}>Изображения</div>
                {isEditing ? (
                  <input
                    type="file"
                    name="images"
                    onChange={handleFileChange}
                    multiple
                  />
                ) : (
                  <div className={classes.imageList}>
                    {tarif?.images?.length ? (
                      tarif.images.map((image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className={classes.imageItem}
                        >
                          <img
                            src={getMediaUrl(image)}
                            alt={`Изображение ${index + 1}`}
                          />
                        </div>
                      ))
                    ) : (
                      <div className={classes.requestDataInfo_desc}>—</div>
                    )}
                  </div>
                )}
              </div>
              {isEditing && (
                <>
                  {/* список новых файлов (локальные файлы) */}
                  <div className={classes.imageList}>
                    {formData?.images?.map((image, index) => (
                      <div
                        key={`${image.name}-${index}`}
                        className={`${classes.imageItem} ${
                          coverImage2 === image ? classes.selected : ""
                        }`}
                      >
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Image ${index + 1}`}
                          onClick={() =>
                            type === "apartment"
                              ? null
                              : handleCoverImageChange2(image)
                          }
                        />
                        {/* кнопка удалить локальный файл */}
                        {isEditing && (
                          <button
                            className={classes.deleteImageBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNewFile(index);
                            }}
                            title="Удалить"
                          >
                            {/* ✕ */}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* список изображений с сервера */}
                  <div className={classes.imageList}>
                    {tarif?.images?.map((image, index) => {
                      const isMarked = deletedImages.includes(image);
                      return (
                        <div
                          key={`${image}-${index}`}
                          className={`${classes.imageItem} ${
                            coverImage === image ? classes.selected : ""
                          } ${!isEditing && classes.disImage} ${
                            isMarked ? classes.toDelete : ""
                          }`}
                          onClick={() => {
                            if (!isMarked) {
                              handleCoverImageChange(image);
                            }
                          }}
                        >
                          <img
                            src={getMediaUrl(image)}
                            alt={`Image ${index + 1}`}
                          />
                          {isEditing && (
                            <button
                              className={classes.deleteImageBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDeleteServerImage(image);
                              }}
                              title={isMarked ? "Отменить удаление" : "Удалить"}
                            >
                              {/* {isMarked ? "↺" : "✕"} */}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
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

export default EditRequestTarifCategory;

// import React, { useState, useRef, useEffect } from "react";
// import classes from "./EditRequestTarifCategory.module.css";
// import Button from "../../Standart/Button/Button";
// import Sidebar from "../Sidebar/Sidebar";

// import {
//   getCookie,
//   REORDER_ROOM_KIND_IMAGES,
//   server,
//   UPDATE_HOTEL_TARIF,
// } from "../../../../graphQL_requests.js";
// import { useMutation, useQuery } from "@apollo/client";
// import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete.jsx";
// import MUILoader from "../MUILoader/MUILoader.jsx";
// import TextEditor from "../TextEditor/TextEditor.jsx";

// function EditRequestTarifCategory({
//   show,
//   onClose,
//   tarif,
//   onSubmit,
//   addTarif,
//   id,
//   setAddTarif,
//   user,
//   type,
//   addNotification,
// }) {
//   const token = getCookie("token");

//   const [formData, setFormData] = useState({
//     images: null,
//   });

//   const [coverImage, setCoverImage] = useState(tarif && tarif?.images[0]);
//   const [coverImage2, setCoverImage2] = useState(null);

//   // console.log(tarif);

//   const sidebarRef = useRef();

//   const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Apollo-Require-Preflight": "true",
//       },
//     },
//   });

//   useEffect(() => {
//     if (show && tarif) {
//       setFormData({ ...tarif, images: null });
//       setCoverImage(tarif?.images[0]);
//     }
//   }, [show, tarif]);

//   const [isEditing, setIsEditing] = useState(false);

//   //   console.log(formData);

//   const closeButton = () => {
//     let success = confirm("Вы уверены, все несохраненные данные будут удалены");
//     if (success) {
//       onClose();
//       setCoverImage(tarif && tarif?.images[0]);
//       setIsEditing(false);
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prevState) => ({
//       ...prevState,
//       [name]: value,
//     }));
//   };

//   const handleFileChange = (e) => {
//     const files = e.target.files;
//     if (files.length > 8) {
//       alert("Вы можете загрузить не более 8 изображений.");
//       e.target.value = null;
//       return;
//     }

//     const fileArray = Array.from(files);

//     // Если есть выбранное изображение, ставим его первым в массиве
//     const updatedImages = coverImage2 ? [coverImage2, ...fileArray] : fileArray;

//     setFormData((prevState) => ({
//       ...prevState,
//       images: updatedImages,
//     }));
//   };

//   const handleCoverImageChange = (image) => {
//     if (isEditing) {
//       setCoverImage(image);
//     }
//     // setIsEditing(!isEditing);
//   };

//   const handleCoverImageChange2 = (image) => {
//     if (isEditing) {
//       setCoverImage2(image);
//     }
//     // setIsEditing(!isEditing);
//   };

//   const [reorderRoomKindImages] = useMutation(REORDER_ROOM_KIND_IMAGES, {
//     context: {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         // "Apollo-Require-Preflight": "true",
//       },
//     },
//   });

//   const imagesArray = coverImage
//     ? [coverImage, ...tarif?.images.filter((img) => img !== coverImage)]
//     : tarif?.images;

//   const handleReorderImages = async () => {
//     try {
//       await reorderRoomKindImages({
//         variables: {
//           reorderRoomKindImagesId: formData.id,
//           imagesArray: imagesArray,
//         },
//       });
//       // addNotification("Обложка обновлена успешно.", "success");
//     } catch (error) {
//       console.error("Ошибка при обновлении обложки:", error);
//       // addNotification("Не удалось обновить обложку.", "error");
//     }
//   };

//   const [isLoading, setIsLoading] = useState(false);

//   const imagesArray2 = coverImage2
//     ? [coverImage2, ...formData?.images?.filter((img) => img !== coverImage2)]
//     : formData.images;

//   // console.log(imagesArray2);

//   const handleSubmit = async (e) => {
//     if (isEditing) {
//       e.preventDefault();
//       setIsLoading(true);

//       try {
//         let response_update_tarif = await updateHotelTarif({
//           variables: {
//             updateHotelId: id,
//             input: {
//               roomKind: [
//                 {
//                   id: formData.id,
//                   category: formData.category,
//                   name: formData.name,
//                   price: parseFloat(formData.price),
//                   priceForAirline: parseFloat(formData.priceForAirline),
//                   description: formData.description,
//                   square: formData.square,
//                 },
//               ],
//             },
//             roomKindImages: imagesArray2,
//           },
//         });
//         !imagesArray2 ? await handleReorderImages() : null;
//         onClose();
//         setIsLoading(false);
//         setCoverImage(null);
//         setCoverImage2(null);
//         addNotification("Редактирование тарифа прошло успешно.", "success");
//       } catch (error) {
//         setIsLoading(false);
//         console.error("Произошла ошибка при выполнении запроса:", error);
//         alert("Произошло ошибка при редактировании тарифа.");
//         setCoverImage(null);
//         setCoverImage2(null);
//       }
//     }
//     setIsEditing(!isEditing);
//   };

//   const [tarifNames, setTarifNames] = useState([]);

//   useEffect(() => {
//     const names = addTarif?.map((tarif) => tarif.name);
//     setTarifNames(names);
//   }, [addTarif]);

//   useEffect(() => {
//     if (show) {
//       const handleClickOutside = (event) => {
//         if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
//           closeButton();
//         }
//       };
//       document.addEventListener("mousedown", handleClickOutside);

//       return () => {
//         document.removeEventListener("mousedown", handleClickOutside);
//       };
//     }
//   }, [show]);

//   const categories = [
//     {
//       value: "luxe",
//       label: "Люкс",
//     },
//     {
//       value: "onePlace",
//       label: "Одноместный",
//     },
//     {
//       value: "twoPlace",
//       label: "Двухместный",
//     },
//     {
//       value: "threePlace",
//       label: "Трехместный",
//     },
//     {
//       value: "fourPlace",
//       label: "Четырехместный",
//     },
//     {
//       value: "fivePlace",
//       label: "Пятиместный",
//     },
//     {
//       value: "sixPlace",
//       label: "Шестиместный",
//     },
//     {
//       value: "sevenPlace",
//       label: "Семиместный",
//     },
//     {
//       value: "eightPlace",
//       label: "Восьмиместный",
//     },
//   ];

//   const apartmentCategories = [
//     {
//       value: "apartment",
//       label: "Апартаменты",
//     },
//     {
//       value: "studio",
//       label: "Студия",
//     },
//   ];

//   const useCategories = type === "apartment" ? apartmentCategories : categories;

//   return (
//     <Sidebar show={show} sidebarRef={sidebarRef}>
//       <div className={classes.requestTitle}>
//         <div className={classes.requestTitle_name}>Редактировать тариф</div>
//         <div className={classes.requestTitle_close} onClick={closeButton}>
//           <img src="/close.png" alt="close" />
//         </div>
//       </div>

//       {isLoading ? (
//         <MUILoader loadSize={"50px"} fullHeight={"90vh"} />
//       ) : (
//         <>
//           <div className={classes.requestMiddle}>
//             <div className={classes.requestData}>
//               <label>Выберите категорию</label>
//               <MUIAutocomplete
//                 isDisabled={!isEditing}
//                 dropdownWidth={"100%"}
//                 label={"Выберите категорию"}
//                 options={useCategories.map((category) => category.label)}
//                 value={
//                   useCategories.find(
//                     (category) => category.value === formData?.category
//                   ) || ""
//                 }
//                 onChange={(event, newValue) => {
//                   const selectedCategory = useCategories.find(
//                     (category) => category.label === newValue
//                   );
//                   setFormData((prevFormData) => ({
//                     ...prevFormData,
//                     category: selectedCategory.value,
//                   }));
//                   //   setIsEdited(true);
//                 }}
//               />

//               <label>Название тарифа</label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name || ""}
//                 onChange={handleChange}
//                 placeholder="Например: Стандарт, Люкс"
//                 disabled={!isEditing}
//               />

//               <label>Стоимость</label>
//               <input
//                 type="number"
//                 name="price"
//                 value={formData.price || 0}
//                 onChange={handleChange}
//                 placeholder="Введите стоимость"
//                 disabled={!isEditing}
//               />
//               {!user?.hotelId && (
//                 <>
//                   <label>Стоимость для авиакомпании</label>
//                   <input
//                     type="number"
//                     name="priceForAirline"
//                     value={formData.priceForAirline || 0}
//                     onChange={handleChange}
//                     placeholder="Введите стоимость"
//                     disabled={!isEditing}
//                   />
//                 </>
//               )}

//               <label>Квадратура</label>
//               <input
//                 type="text"
//                 name="square"
//                 value={formData.square || ""}
//                 onChange={handleChange}
//                 placeholder="м²"
//                 disabled={!isEditing}
//               />

//               <label>Описание</label>
//               <TextEditor
//                 hotel={null}
//                 anotherDescription={formData.description || ""}
//                 isEditing={isEditing}
//                 onChange={(newDescription) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     description: newDescription,
//                   }))
//                 }
//               />
//               {/* <textarea
//                 id="description"
//                 name="description"
//                 value={formData.description || ""}
//                 onChange={handleChange}
//                 disabled={!isEditing}
//               ></textarea> */}

//               <label>Изображения</label>
//               <input
//                 type="file"
//                 name="images"
//                 onChange={handleFileChange}
//                 disabled={!isEditing}
//                 multiple
//               />
//               <div className={classes.imageList}>
//                 {formData?.images?.map((image, index) => (
//                   <div
//                     key={`${image.name}-${index}`} // Используйте `image.name` для уникальности ключа
//                     className={`${classes.imageItem} ${
//                       coverImage2 === image ? classes.selected : ""
//                     }`}
//                     onClick={() => handleCoverImageChange2(image)}
//                   >
//                     <img
//                       src={URL.createObjectURL(image)}
//                       alt={`Image ${index + 1}`}
//                     />
//                   </div>
//                 ))}
//               </div>

//               <div className={classes.imageList}>
//                 {tarif?.images?.map((image, index) => (
//                   <div
//                     key={`${image}-${index}`}
//                     className={`${classes.imageItem} ${
//                       coverImage === image ? classes.selected : ""
//                     } ${!isEditing && classes.disImage}`}
//                     onClick={() => handleCoverImageChange(image)}
//                   >
//                     <img src={`${server}${image}`} alt={`Image ${index + 1}`} />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           <div className={classes.requestButton}>
//             <Button
//               type="submit"
//               onClick={handleSubmit}
//               backgroundcolor={!isEditing ? "#3CBC6726" : "#0057C3"}
//               color={!isEditing ? "#3B6C54" : "#fff"}
//             >
//               {isEditing ? (
//                 <>
//                   Сохранить <img src="/saveDispatcher.png" alt="" />
//                 </>
//               ) : (
//                 <>
//                   Изменить <img src="/editDispetcher.png" alt="" />
//                 </>
//               )}
//             </Button>
//           </div>
//         </>
//       )}
//     </Sidebar>
//   );
// }

// export default EditRequestTarifCategory;

// import React, { useState, useRef, useEffect } from "react";
// import classes from './EditRequestTarifCategory.module.css';
// import Button from "../../Standart/Button/Button";
// import Sidebar from "../Sidebar/Sidebar";

// import { getCookie, UPDATE_HOTEL_TARIF } from '../../../../graphQL_requests.js';
// import { useMutation, useQuery } from "@apollo/client";

// function EditRequestTarifCategory({ show, onClose, tarif, onSubmit, addTarif, id, setAddTarif, user }) {
//     const token = getCookie('token');

//     const [formData, setFormData] = useState({});

//     const sidebarRef = useRef();

//     const [updateHotelTarif] = useMutation(UPDATE_HOTEL_TARIF, {
//         context: {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//                 // 'Apollo-Require-Preflight': 'true',
//             },
//         },
//     });

//     useEffect(() => {
//         if (show && tarif) {
//             setFormData(tarif.data);
//         }
//     }, [show, tarif]);

//     const closeButton = () => {
//         let success = confirm("Вы уверены, все несохраненные данные будут удалены");
//         if (success) {
//             onClose();
//         }
//     };

//     const handleChange = (e) => {
//         const { name, value } = e.target;

//         if (name === 'tarifName') {
//             const selectedTarif = addTarif.find(tarif => tarif.name === value);
//             setFormData(prevState => ({
//                 ...prevState,
//                 tarif: selectedTarif
//             }));
//         } else if (name === 'type') {
//             setFormData(prevState => ({
//                 ...prevState,
//                 category: {
//                     ...prevState.category,
//                     name: value,
//                 },
//             }));
//         } else if (name === 'price' || name === 'price_airline') {
//             setFormData(prevState => ({
//                 ...prevState,
//                 category: {
//                     ...prevState.category,
//                     prices: [
//                         {
//                             ...prevState.category?.prices?.[0],
//                             [name === 'price' ? 'amount' : 'amountair']: value,
//                         }
//                     ],
//                 },
//             }));
//         } else {
//             setFormData(prevState => ({
//                 ...prevState,
//                 [name]: value,
//             }));
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         let response_update_category = await updateHotelTarif({
//             variables: {
//                 updateHotelId: id,
//                 input: {
//                     "categories": [
//                         {
//                             "name": formData.category.name,
//                             "id": formData.category.id
//                         }
//                     ]
//                 }
//             }
//         });

//         let response_update_prices = await updateHotelTarif({
//             variables: {
//                 updateHotelId: id,
//                 input: {
//                     "prices": [
//                         {
//                             "id": formData.category.prices[0].id,
//                             "amount": Number(formData.category.prices[0].amount),
//                             "amountair": Number(formData.category.prices[0].amountair),
//                             "categoryId": formData.category.id,
//                             "tariffId": formData.tarif.id
//                         }
//                     ]
//                 }
//             }
//         });

//         if (response_update_category && response_update_prices) {
//             setAddTarif(response_update_prices.data.updateHotel.tariffs)
//             onClose();
//         }
//     };

//     const [tarifNames, setTarifNames] = useState([]);

//     useEffect(() => {
//         const names = addTarif.map(tarif => tarif.name);
//         setTarifNames(names);
//     }, [addTarif]);

//     useEffect(() => {
//         if (show) {
//             const handleClickOutside = (event) => {
//                 if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
//                     closeButton();
//                 }
//             };
//             document.addEventListener('mousedown', handleClickOutside);

//             return () => {
//                 document.removeEventListener('mousedown', handleClickOutside);
//             };
//         }
//     }, [show]);

//     return (
//         <Sidebar show={show} sidebarRef={sidebarRef}>
//             <div className={classes.requestTitle}>
//                 <div className={classes.requestTitle_name}>Редактировать</div>
//                 <div className={classes.requestTitle_close} onClick={closeButton}><img src="/close.png" alt="close" /></div>
//             </div>

//             <div className={classes.requestMiddle}>
//                 <div className={classes.requestData}>
//                     {/* <label>Выберите тариф</label>
//                     <select name="tarifName" value={formData?.tarif?.name} onChange={handleChange}>
//                         <option value="">Выберите тариф</option>
//                         {tarifNames.map((name, index) => (
//                             <option key={index} value={name}>{name}</option>
//                         ))}
//                     </select> */}

//                     <label>Тип номера</label>
//                     <input
//                         type="text"
//                         name="type"
//                         value={formData?.category?.name || ''}
//                         onChange={handleChange}
//                         placeholder="Введите тип номера"
//                     />

//                     {user?.role != "AIRLINEADMIN" &&
//                         <>
//                             <label>Стоимость</label>
//                             <input
//                                 type="text"
//                                 name="price"
//                                 value={formData?.category?.prices?.[0]?.amount || ''}
//                                 onChange={handleChange}
//                                 placeholder="Введите стоимость"
//                             />
//                         </>
//                     }

//                     {user?.role != "HOTELADMIN" &&
//                         <>
//                             <label>Стоимость для авиакомпании</label>
//                             <input
//                                 type="text"
//                                 name="price_airline"
//                                 value={formData?.category?.prices?.[0]?.amountair || ''}
//                                 onChange={handleChange}
//                                 placeholder="Введите стоимость для авиакомпании"
//                             />
//                         </>
//                     }
//                 </div>
//             </div>

//             <div className={classes.requestButton}>
//                 <Button type="submit" onClick={handleSubmit}>Изменить</Button>
//             </div>
//         </Sidebar>
//     );
// }

// export default EditRequestTarifCategory;
